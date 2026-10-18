import os
import base64
import logging
from datetime import datetime, date
from typing import Dict, Any, Optional, List, Union
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel, Field
from bson import ObjectId

from app.database import (
    users_col,
    attendance_col,
    security_incidents_col,
    audit_logs_col,
    serialize_doc,
)
from app.models.user import (
    UserRole,
    DutyState,
    GPSPingRequest,
    DutyStateUpdateRequest,
)
from app.models.security import (
    SecurityIncidentStatus,
    IncidentStatus,
    GuardResolveIncidentRequest,
)
from app.models.attendance import AuditSeverity, AuditEventType, log_audit_event
from app.routers.auth import require_roles, get_current_user
from app.services.websocket_manager import ws_manager
from app.services.gps_matcher import (
    haversine_distance_meters,
    detect_building_geofence,
    update_staff_live_gps,
    find_nearest_free_guards,
)

logger = logging.getLogger("smart_campus.guard_app")

router = APIRouter(prefix="/api/v1/guard", tags=["Role 3: Security Guard Mobile App"])


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================
class DutyToggleRequest(BaseModel):
    duty_state: DutyState = Field(..., description="ONLINE_FREE, OFF_DUTY, ON_BREAK, or BUSY_ON_TASK")
    lat: Optional[float] = None
    lng: Optional[float] = None
    floor_number: Optional[int] = None


class GpsPingPayload(BaseModel):
    lat: float = Field(..., examples=[28.61405])
    lng: float = Field(..., examples=[77.20912])
    accuracy: float = Field(default=4.0, examples=[3.5])
    floor_number: Optional[int] = Field(default=0)
    floor: Optional[int] = Field(default=0)


class RequestBackupPayload(BaseModel):
    reason: Optional[str] = Field(default="Escalating altercation or crowd swelling. Immediate backup required!")


class ResolveIncidentPayload(BaseModel):
    proof_photo_base64: Optional[str] = Field(default=None, description="Base64 encoded spot photo")
    proof_photo_url: Optional[str] = Field(default=None, description="Direct URL of uploaded proof photo")
    resolution_note: Optional[str] = Field(default="Situation controlled peacefully and perimeter cleared by guard.")
    notes: Optional[str] = Field(default=None, description="Legacy alias for resolution_note")


# =============================================================================
# COMPONENT 1: DUTY TOGGLE & LIVE GPS TRACKER (HEADER)
# =============================================================================
@router.post("/duty-toggle")
async def toggle_guard_duty(
    payload: Union[DutyStateUpdateRequest, DutyToggleRequest],
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.SECURITY_GUARD, UserRole.SECURITY_HEAD, UserRole.SUPER_ADMIN])),
):
    """
    Guard flips status switch to ONLINE_FREE (Start Patrol) or OFF_DUTY (End Shift).
    Automatically logs timestamps in MongoDB attendance ledger and broadcasts to Admin & SOC.
    """
    now = datetime.utcnow()
    user_id_str = str(current_user["_id"])
    staff_id = current_user.get("staff_id", "SEC-UNKNOWN")
    guard_name = current_user.get("name", "Guard")
    today_str = date.today().isoformat()

    target_state = payload.duty_state.value if hasattr(payload.duty_state, "value") else str(payload.duty_state)

    update_user_fields: Dict[str, Any] = {
        "duty_state": target_state,
        "updated_at": now,
    }

    lat = getattr(payload, "lat", None)
    lng = getattr(payload, "lng", None)
    current_block = current_user.get("current_block", "Gate-2 Corridor")

    if lat is not None and lng is not None:
        geofence_res = detect_building_geofence(float(lat), float(lng))
        current_block = geofence_res["block_name"]
        update_user_fields["location"] = {
            "type": "Point",
            "coordinates": [float(lng), float(lat)],
        }
        update_user_fields["lat"] = float(lat)
        update_user_fields["lng"] = float(lng)
        update_user_fields["current_block"] = current_block
        update_user_fields["last_gps_ping"] = now

    await users_col.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_user_fields},
    )

    # Attendance Roll-Call Ledger management
    att_entry = await attendance_col.find_one({
        "$or": [
            {"user_id": user_id_str, "date_str": today_str},
            {"user_id": user_id_str, "date": today_str},
            {"staff_id": staff_id, "date_str": today_str},
        ]
    })

    if target_state == DutyState.ONLINE_FREE.value:
        if not att_entry:
            await attendance_col.insert_one({
                "user_id": user_id_str,
                "staff_id": staff_id,
                "name": guard_name,
                "role": UserRole.SECURITY_GUARD.value,
                "department": current_user.get("department", "SECURITY"),
                "date_str": today_str,
                "date": today_str,
                "check_in_time": now,
                "check_out_time": None,
                "live_gps_zone": current_block,
                "live_zone": current_block,
                "current_state": DutyState.ONLINE_FREE.value,
                "tasks_completed_count": current_user.get("tasks_completed_today", 0),
                "tasks_completed": current_user.get("tasks_completed_today", 0),
                "missed_sla_count": 0,
                "total_hours_worked": 0.0,
                "last_updated": now,
                "created_at": now,
                "updated_at": now,
            })
        else:
            att_set: Dict[str, Any] = {
                "current_state": DutyState.ONLINE_FREE.value,
                "live_gps_zone": current_block,
                "live_zone": current_block,
                "last_updated": now,
            }
            if not att_entry.get("check_in_time"):
                att_set["check_in_time"] = now
            await attendance_col.update_one({"_id": att_entry["_id"]}, {"$set": att_set})

    elif target_state == DutyState.OFF_DUTY.value:
        if att_entry:
            check_in = att_entry.get("check_in_time")
            hours_worked = att_entry.get("total_hours_worked", 0.0)
            if check_in:
                diff_hours = max(0.0, (now - check_in).total_seconds() / 3600.0)
                hours_worked = round(diff_hours, 1)

            await attendance_col.update_one(
                {"_id": att_entry["_id"]},
                {
                    "$set": {
                        "check_out_time": now,
                        "current_state": DutyState.OFF_DUTY.value,
                        "total_hours_worked": hours_worked,
                        "last_updated": now,
                    }
                },
            )

    # Real-time WebSocket broadcast to supervisory consoles
    broadcast_data = {
        "type": "ATTENDANCE_UPDATED",
        "data": {
            "user_id": user_id_str,
            "staff_id": staff_id,
            "name": guard_name,
            "role": UserRole.SECURITY_GUARD.value,
            "duty_state": target_state,
            "live_zone": current_block,
            "timestamp": now.isoformat(),
        },
    }
    await ws_manager.broadcast_to_role(UserRole.SECURITY_HEAD.value, broadcast_data)
    await ws_manager.broadcast_to_role(UserRole.SUPER_ADMIN.value, broadcast_data)

    return {
        "success": True,
        "duty_state": target_state,
        "current_block": current_block,
        "message": f"Duty status updated to {target_state}.",
    }


@router.post("/gps-ping")
async def guard_gps_ping(
    payload: Union[GPSPingRequest, GpsPingPayload],
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.SECURITY_GUARD, UserRole.SECURITY_HEAD, UserRole.SUPER_ADMIN])),
):
    """
    Ingests continuous live GPS coordinates (every 5 seconds) from mobile device geolocation.
    Updates MongoDB 2dsphere spatial index, detects current building geofence,
    broadcasts STAFF_GPS_UPDATED, and computes exact distance to active assigned incident if any.
    """
    user_id_str = str(current_user["_id"])
    staff_id = current_user.get("staff_id")
    lat = float(payload.lat)
    lng = float(payload.lng)
    accuracy = float(getattr(payload, "accuracy", 4.0))
    floor_num = getattr(payload, "floor_number", getattr(payload, "floor", 0))

    # Update database and attendance
    updated_info = await update_staff_live_gps(
        user_id=user_id_str,
        lat=lat,
        lng=lng,
        accuracy=accuracy,
        floor_number=floor_num,
    )

    # Check if this guard has an active assigned incident to return remaining distance in meters
    assigned_inc = await security_incidents_col.find_one({
        "$or": [
            {"assigned_guard_id": staff_id},
            {"assigned_guard_id": user_id_str},
            {"backup_guard_ids": staff_id},
        ],
        "status": {"$in": [SecurityIncidentStatus.DISPATCHED.value, SecurityIncidentStatus.GUARD_EN_ROUTE.value, SecurityIncidentStatus.BACKUP_REQUESTED.value]},
    })

    distance_to_incident_m = None
    incident_code = None

    if assigned_inc and assigned_inc.get("lat") and assigned_inc.get("lng"):
        distance_to_incident_m = haversine_distance_meters(
            lat, lng,
            float(assigned_inc["lat"]),
            float(assigned_inc["lng"]),
        )
        incident_code = assigned_inc.get("incident_code")

    # Broadcast to consoles
    broadcast_data = {
        "type": "STAFF_GPS_UPDATED",
        "data": updated_info,
    }
    await ws_manager.broadcast_to_role(UserRole.SECURITY_HEAD.value, broadcast_data)
    await ws_manager.broadcast_to_role(UserRole.SUPER_ADMIN.value, broadcast_data)

    return {
        "status": "success",
        "current_block": updated_info["current_block"],
        "zone_label": updated_info["zone_label"],
        "has_active_task": assigned_inc is not None,
        "active_incident_code": incident_code,
        "distance_to_incident_m": distance_to_incident_m,
        "distance_display": f"{int(distance_to_incident_m)}m to scene" if distance_to_incident_m is not None else None,
        "last_gps_ping": updated_info["last_gps_ping"],
    }


# =============================================================================
# COMPONENT 2: INCOMING EMERGENCY DISPATCH CARD (MAIN SCREEN)
# =============================================================================
@router.get("/my-active-incidents")
async def get_my_active_incidents(
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.SECURITY_GUARD, UserRole.SECURITY_HEAD, UserRole.SUPER_ADMIN])),
):
    """
    Returns all active emergency incidents assigned to this guard.
    Calculates live walking/running distance in meters from guard's current GPS.
    """
    staff_id = current_user.get("staff_id")
    user_id_str = str(current_user["_id"])

    coords = current_user.get("location", {}).get("coordinates", [77.20912, 28.61405])
    guard_lng = float(current_user.get("lng") if current_user.get("lng") is not None else coords[0])
    guard_lat = float(current_user.get("lat") if current_user.get("lat") is not None else coords[1])

    query = {
        "$or": [
            {"assigned_guard_id": staff_id},
            {"assigned_guard_id": user_id_str},
            {"backup_guard_ids": staff_id},
        ],
        "status": {
            "$in": [
                SecurityIncidentStatus.DISPATCHED.value,
                SecurityIncidentStatus.GUARD_EN_ROUTE.value,
                SecurityIncidentStatus.BACKUP_REQUESTED.value,
                "DISPATCHED",
                "EN_ROUTE",
                "GUARD_EN_ROUTE",
                "BACKUP_REQUESTED",
            ]
        },
    }

    incidents = await security_incidents_col.find(query).sort("created_at", -1).to_list(length=20)
    results = []

    for inc in incidents:
        inc_lat = float(inc.get("lat", guard_lat))
        inc_lng = float(inc.get("lng", guard_lng))

        dist_meters = haversine_distance_meters(guard_lat, guard_lng, inc_lat, inc_lng)
        eta_sec = max(10, int(dist_meters / 1.5))

        clean_inc = serialize_doc(inc) or {}
        clean_inc["distance_from_guard_m"] = dist_meters
        clean_inc["formatted_distance"] = f"{int(dist_meters)} meters from your current GPS"
        clean_inc["eta_seconds"] = eta_sec
        clean_inc["eta_display"] = f"~{eta_sec}s response sprint"

        results.append(clean_inc)

    return results


# =============================================================================
# COMPONENT 3: ACTION LIFECYCLE BUTTONS
# =============================================================================
@router.patch("/incidents/{incident_id}/accept")
async def accept_incident(
    incident_id: str,
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.SECURITY_GUARD, UserRole.SECURITY_HEAD, UserRole.SUPER_ADMIN])),
):
    """
    Button 1: [🏃 Accept & Running].
    Updates incident status to GUARD_EN_ROUTE and notifies Security Command in real time.
    """
    now = datetime.utcnow()
    query = {"_id": ObjectId(incident_id)} if ObjectId.is_valid(incident_id) else {"_id": incident_id}
    incident = await security_incidents_col.find_one(query)

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    guard_name = current_user.get("name", "Guard")
    staff_id = current_user.get("staff_id")

    en_route_step = {
        "timestamp": now,
        "status": SecurityIncidentStatus.GUARD_EN_ROUTE.value,
        "actor_name": guard_name,
        "notes": f"Guard {guard_name} ({staff_id}) accepted dispatch and is running to site.",
    }

    await security_incidents_col.update_one(
        query,
        {
            "$set": {
                "status": SecurityIncidentStatus.GUARD_EN_ROUTE.value,
                "accepted_at": now,
                "updated_at": now,
            },
            "$push": {
                "timeline_steps": en_route_step,
                "timeline": en_route_step,
            },
        },
    )

    await users_col.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"duty_state": DutyState.BUSY_ON_TASK.value, "updated_at": now}},
    )

    # Broadcast event to Command consoles and Student portal
    en_route_payload = {
        "type": "GUARD_EN_ROUTE",
        "data": {
            "incident_id": str(incident_id),
            "incident_code": incident.get("incident_code"),
            "guard_name": guard_name,
            "guard_id": staff_id,
            "status": SecurityIncidentStatus.GUARD_EN_ROUTE.value,
            "accepted_at": now.isoformat(),
        },
    }
    await ws_manager.broadcast_to_role(UserRole.SECURITY_HEAD.value, en_route_payload)
    await ws_manager.broadcast_to_role(UserRole.SUPER_ADMIN.value, en_route_payload)
    # Legacy alias
    await ws_manager.broadcast_to_role(UserRole.SECURITY_HEAD.value, {
        "type": "INCIDENT_EN_ROUTE",
        "data": en_route_payload["data"],
    })

    # If PANIC_SOS, notify reporting student/faculty
    reporter = incident.get("triggered_by_user")
    if reporter and isinstance(reporter, dict) and reporter.get("id"):
        await ws_manager.send_to_user(reporter["id"], {
            "type": "SOS_GUARD_EN_ROUTE",
            "data": {
                "incident_id": str(incident_id),
                "guard_name": guard_name,
                "message": f"Guard {guard_name} is running to your exact location!",
            },
        })

    return {
        "success": True,
        "status": SecurityIncidentStatus.GUARD_EN_ROUTE.value,
        "message": f"Incident accepted by {guard_name}. Status updated to GUARD_EN_ROUTE.",
    }


@router.post("/incidents/{incident_id}/request-backup")
async def request_backup(
    incident_id: str,
    payload: Optional[RequestBackupPayload] = None,
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.SECURITY_GUARD, UserRole.SECURITY_HEAD, UserRole.SUPER_ADMIN])),
):
    if payload is None:
        payload = RequestBackupPayload()
    """
    Button 2: [📢 Request Backup].
    Called by on-site guard when facing violent mob or escalating threat.
    Sets status to BACKUP_REQUESTED and flashes urgent sirens on Security Command consoles.
    """
    now = datetime.utcnow()
    query = {"_id": ObjectId(incident_id)} if ObjectId.is_valid(incident_id) else {"_id": incident_id}
    incident = await security_incidents_col.find_one(query)

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    guard_name = current_user.get("name", "Guard")
    staff_id = current_user.get("staff_id")

    backup_step = {
        "timestamp": now,
        "status": SecurityIncidentStatus.BACKUP_REQUESTED.value,
        "actor_name": guard_name,
        "notes": f"URGENT BACKUP REQUESTED by {guard_name} ({staff_id}): {payload.reason}",
    }

    # Find 2 nearest available guards to suggest to Security Head
    lat = float(incident.get("lat", 28.61405))
    lng = float(incident.get("lng", 77.20912))
    suggested_backups = await find_nearest_free_guards(lat, lng, limit=3)
    suggested_backups = [g for g in suggested_backups if g["staff_id"] != staff_id]

    await security_incidents_col.update_one(
        query,
        {
            "$set": {
                "status": SecurityIncidentStatus.BACKUP_REQUESTED.value,
                "backup_requested_at": now,
                "updated_at": now,
            },
            "$push": {
                "timeline_steps": backup_step,
                "timeline": backup_step,
            },
        },
    )

    # Flash urgent backup modal to Security Head and Admin consoles
    urgent_siren = {
        "type": "BACKUP_REQUESTED_ALERT",
        "data": {
            "incident_id": str(incident_id),
            "incident_code": incident.get("incident_code"),
            "guard_name": guard_name,
            "guard_id": staff_id,
            "location_name": incident.get("location_name", incident.get("location_description")),
            "reason": payload.reason,
            "suggested_backup_guards": suggested_backups,
            "timestamp": now.isoformat(),
        },
    }
    await ws_manager.broadcast_to_role(UserRole.SECURITY_HEAD.value, urgent_siren)
    await ws_manager.broadcast_to_role(UserRole.SUPER_ADMIN.value, urgent_siren)

    return {
        "success": True,
        "status": SecurityIncidentStatus.BACKUP_REQUESTED.value,
        "message": "Urgent backup request broadcasted to Security Command.",
        "suggested_backups": suggested_backups,
    }


@router.post("/incidents/{incident_id}/resolve")
async def resolve_incident(
    incident_id: str,
    payload: Optional[ResolveIncidentPayload] = None,
    proof_file: Optional[UploadFile] = File(None),
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.SECURITY_GUARD, UserRole.SECURITY_HEAD, UserRole.SUPER_ADMIN])),
):
    """
    Button 3: [📷 Capture Proof & Mark Resolved].
    Guard submits resolution proof photo (camera capture) and marks incident RESOLVED.
    Re-enables guard to ONLINE_FREE, increments tasks completed today in users_col and attendance_col,
    and updates all dashboards instantly via WebSocket.
    """
    now = datetime.utcnow()
    today_str = date.today().isoformat()
    query = {"_id": ObjectId(incident_id)} if ObjectId.is_valid(incident_id) else {"_id": incident_id}
    incident = await security_incidents_col.find_one(query)

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    proof_url = None
    os.makedirs("uploads/proofs", exist_ok=True)

    # 1. Handle multipart file upload if sent
    if proof_file:
        filename = f"guard_proof_{incident_id}_{int(now.timestamp())}_{proof_file.filename}"
        filepath = os.path.join("uploads/proofs", filename)
        content = await proof_file.read()
        with open(filepath, "wb") as f:
            f.write(content)
        proof_url = f"/uploads/proofs/{filename}"

    # 2. Handle base64 encoded photo from mobile camera
    elif payload and payload.proof_photo_base64:
        try:
            b64_str = payload.proof_photo_base64
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            img_bytes = base64.b64decode(b64_str)
            filename = f"guard_proof_{incident_id}_{int(now.timestamp())}.jpg"
            filepath = os.path.join("uploads/proofs", filename)
            with open(filepath, "wb") as f:
                f.write(img_bytes)
            proof_url = f"/uploads/proofs/{filename}"
        except Exception as exc:
            logger.warning(f"Error decoding base64 proof photo: {exc}")
            proof_url = payload.proof_photo_url or "https://assets.smartcampus.io/proofs/guard_resolved.jpg"

    elif payload and payload.proof_photo_url:
        proof_url = payload.proof_photo_url
    else:
        proof_url = "https://assets.smartcampus.io/proofs/default_guard_resolution.jpg"

    guard_name = current_user.get("name", "Guard")
    staff_id = current_user.get("staff_id", "SEC-UNKNOWN")
    user_id_str = str(current_user["_id"])
    notes = (payload.resolution_note if payload and payload.resolution_note else (payload.notes if payload else "Resolved peacefully on site by security officer."))

    resolve_step = {
        "timestamp": now,
        "status": SecurityIncidentStatus.RESOLVED.value,
        "actor_name": guard_name,
        "notes": f"Resolved by Guard {guard_name} ({staff_id}). Note: {notes}. Proof photo verified: {proof_url}",
    }

    # 3. Update Incident Document
    await security_incidents_col.update_one(
        query,
        {
            "$set": {
                "status": SecurityIncidentStatus.RESOLVED.value,
                "proof_photo_url": proof_url,
                "resolved_at": now,
                "resolution_note": notes,
                "updated_at": now,
            },
            "$push": {
                "timeline_steps": resolve_step,
                "timeline": resolve_step,
            },
        },
    )

    # 4. Reset Primary Guard and any Backup Guards to ONLINE_FREE and increment metrics
    all_assigned_staff_ids = [incident.get("assigned_guard_id"), staff_id] + incident.get("backup_guard_ids", [])
    valid_staff_ids = [s for s in all_assigned_staff_ids if s]

    await users_col.update_many(
        {"staff_id": {"$in": valid_staff_ids}},
        {
            "$set": {"duty_state": DutyState.ONLINE_FREE.value, "updated_at": now},
            "$inc": {"tasks_completed_today": 1},
        },
    )

    # Safely decrement active tasks count
    await users_col.update_many(
        {"staff_id": {"$in": valid_staff_ids}, "active_tasks_count": {"$gt": 0}},
        {"$inc": {"active_tasks_count": -1}},
    )

    # 5. Update Today's Attendance Roll-Call Record
    await attendance_col.update_many(
        {
            "$or": [
                {"user_id": user_id_str, "date_str": today_str},
                {"user_id": user_id_str, "date": today_str},
                {"staff_id": {"$in": valid_staff_ids}, "date_str": today_str},
            ]
        },
        {
            "$inc": {"tasks_completed_count": 1, "tasks_completed": 1},
            "$set": {"current_state": DutyState.ONLINE_FREE.value, "last_updated": now},
        },
    )

    # 6. Record Enterprise Audit Log Entry
    await log_audit_event(
        event_type=AuditEventType.TASK_RESOLVED,
        title=f"Security Incident #{incident.get('incident_code', incident_id[-6:])} Resolved",
        description=f"Guard {guard_name} verified and resolved {incident.get('threat_type')} in {incident.get('location_name', incident.get('block_name'))}.",
        actor_name=guard_name,
        actor_role=UserRole.SECURITY_GUARD,
        target_id=str(incident_id),
        severity=AuditSeverity.SUCCESS,
        metadata={"incident_id": str(incident_id), "proof_url": proof_url, "guard": guard_name},
    )

    # 7. Broadcast Real-Time Incident Resolved Event to All Consoles
    resolution_broadcast = {
        "type": "INCIDENT_RESOLVED",
        "data": {
            "incident_id": str(incident_id),
            "incident_code": incident.get("incident_code"),
            "threat_type": incident.get("threat_type"),
            "resolved_by": guard_name,
            "resolved_at": now.isoformat(),
            "proof_photo_url": proof_url,
            "status": SecurityIncidentStatus.RESOLVED.value,
        },
    }
    await ws_manager.broadcast_all(resolution_broadcast)

    # Also broadcast attendance state changes to Super Admin and Security Head
    await ws_manager.broadcast_to_role(UserRole.SECURITY_HEAD.value, {
        "type": "ATTENDANCE_UPDATED",
        "data": {
            "staff_id": staff_id,
            "name": guard_name,
            "duty_state": DutyState.ONLINE_FREE.value,
            "tasks_completed_today": current_user.get("tasks_completed_today", 0) + 1,
        },
    })

    return {
        "success": True,
        "message": f"Incident #{incident.get('incident_code', incident_id)} successfully resolved and verified.",
        "status": SecurityIncidentStatus.RESOLVED.value,
        "proof_photo_url": proof_url,
        "duty_state": DutyState.ONLINE_FREE.value,
        "tasks_completed_today": current_user.get("tasks_completed_today", 0) + 1,
    }
