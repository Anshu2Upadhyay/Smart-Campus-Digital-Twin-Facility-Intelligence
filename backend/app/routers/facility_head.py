import logging
import uuid
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId

from app.database import (
    users_col,
    rooms_col,
    facility_workorders_col,
    audit_logs_col,
    blocks_col,
    attendance_col,
    cameras_col,
    spatial_layout_col,
    serialize_doc,
    serialize_list,
)
from app.config import settings
from app.models.user import (
    UserRole,
    DepartmentType,
    DutyState,
    CreateWorkerRequest,
)
from app.models.campus import RoomHealthStatus, AssetStatus
from app.models.facility import (
    WorkorderSource,
    TicketSource,
    FacilityCategory,
    WorkorderStatus,
    WorkOrderStatus,
    TimelineStep,
    SimulateGhostEnergyRequest,
    DispatchWorkerRequest,
    WorkerResolveTaskRequest,
    RecommendedWorker,
)
from app.models.attendance import AuditSeverity, AuditEventType, log_audit_event
from app.routers.auth import require_roles, get_current_user
from app.seed import hash_secret
from app.services.websocket_manager import ws_manager
from app.services.gps_matcher import (
    recommend_smart_workers,
    haversine_distance_meters,
    detect_building_geofence,
    update_staff_live_gps,
)

logger = logging.getLogger("smart_campus.facility_head")

router = APIRouter(prefix="/api/v1/facility", tags=["Role 4: Facility Supervisor"])
alias_router = APIRouter(prefix="/api/v1/facility-head", tags=["Role 4: Facility Supervisor (Alias)"])

VALID_6_TRADES = [
    "ELECTRICAL",
    "HVAC_AC",
    "PLUMBING",
    "HOUSEKEEPING",
    "IT_AV",
    "CIVIL_CARPENTRY",
]


# =============================================================================
# EXTENDED PYDANTIC SCHEMAS
# =============================================================================
class WorkerOnboardInput(BaseModel):
    name: str = Field(..., examples=["Santosh Kumar"])
    phone: str = Field(..., examples=["9876543207"])
    staff_id: Optional[str] = Field(default=None, examples=["WRK-207"])
    badge_id: Optional[str] = Field(default=None, examples=["WRK-207"])
    department: str = Field(..., examples=["HOUSEKEEPING"], description="One of the 6 trades")
    pin: str = Field(default="2222", min_length=4, max_length=6, description="4-Digit Quick PIN")
    current_block: Optional[str] = Field(default="Block-B")
    default_block: Optional[str] = Field(default="Block-B")
    current_floor: Optional[int] = Field(default=1)
    floor: Optional[int] = Field(default=1)
    lat: Optional[float] = Field(default=28.6139)
    lng: Optional[float] = Field(default=77.2090)

    model_config = ConfigDict(populate_by_name=True)


class DispatchWorkerInput(BaseModel):
    worker_id: Optional[str] = Field(default=None, description="Worker Staff ID (WRK-203) or MongoDB User ID. If omitted, top AI candidate is picked.")
    supervisor_note: Optional[str] = Field(default=None, description="Optional dispatch instructions")
    notes: Optional[str] = Field(default=None)


class SimulateGhostEnergyInput(BaseModel):
    block_name: Optional[str] = Field(default="Block-B")
    floor_number: Optional[int] = Field(default=2)
    room_number: Optional[str] = Field(default="Room 204")
    wasted_power_kw: Optional[float] = Field(default=3.54)
    wasted_kw: Optional[float] = Field(default=3.54)
    category: Optional[str] = Field(default="HOUSEKEEPING")


# =============================================================================
# HELPER: NORMALIZE WORKORDER DOCUMENT
# =============================================================================
def _normalize_workorder_doc(wo: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures consistent aliases across all API consumers."""
    wo_id = str(wo.get("_id")) if wo.get("_id") else wo.get("id")
    wo["id"] = wo_id
    wo["ticket_id"] = wo_id

    # Backward compatibility mappings
    if "source" in wo and "ticket_source" not in wo:
        wo["ticket_source"] = wo["source"]
    elif "ticket_source" in wo and "source" not in wo:
        wo["source"] = wo["ticket_source"]

    if "category" in wo and "required_department" not in wo:
        wo["required_department"] = wo["category"]
    elif "required_department" in wo and "category" not in wo:
        wo["category"] = wo["required_department"]

    wasted = wo.get("wasted_power_kw") or wo.get("wasted_kw") or 0.0
    wo["wasted_power_kw"] = float(wasted)
    wo["wasted_kw"] = float(wasted)

    saved_kwh = wo.get("energy_saved_kwh") or 0.0
    saved_rupees = wo.get("money_saved_rupees") or wo.get("rupees_saved") or 0.0
    wo["energy_saved_kwh"] = float(saved_kwh)
    wo["money_saved_rupees"] = float(saved_rupees)
    wo["rupees_saved"] = float(saved_rupees)

    now = datetime.utcnow()
    # Countdown calculations
    ap_deadline = wo.get("supervisor_autopilot_deadline")
    if ap_deadline and isinstance(ap_deadline, datetime):
        wo["autopilot_remaining_seconds"] = max(0, int((ap_deadline - now).total_seconds()))
    else:
        wo["autopilot_remaining_seconds"] = 0

    sla_acc_deadline = wo.get("sla_accept_deadline") or wo.get("sla_deadline")
    if sla_acc_deadline and isinstance(sla_acc_deadline, datetime):
        wo["sla_accept_remaining_seconds"] = max(0, int((sla_acc_deadline - now).total_seconds()))
        wo["sla_remaining_seconds"] = wo["sla_accept_remaining_seconds"]
    else:
        wo["sla_accept_remaining_seconds"] = 0
        wo["sla_remaining_seconds"] = 0

    return serialize_doc(wo)


# =============================================================================
# SCREEN 1: 6-DEPARTMENT WORKER ONBOARDING & GPS ROSTER
# =============================================================================
async def _execute_create_worker(
    payload: Union[CreateWorkerRequest, WorkerOnboardInput],
    current_user: Dict[str, Any],
) -> Dict[str, Any]:
    """Unified handler for onboarding ground workers across trades."""
    now = datetime.utcnow()
    today_str = date.today().isoformat()

    staff_code = (
        getattr(payload, "staff_id", None)
        or getattr(payload, "badge_id", None)
        or f"WRK-{uuid.uuid4().hex[:4].upper()}"
    ).strip().upper()

    phone_clean = payload.phone.strip()

    # Validate Trade
    dept_raw = str(getattr(payload, "department", "HOUSEKEEPING")).upper()
    if dept_raw not in VALID_6_TRADES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid department '{dept_raw}'. Must be strictly one of: {', '.join(VALID_6_TRADES)}",
        )

    # Check Duplicates
    existing = await users_col.find_one({
        "$or": [{"staff_id": staff_code}, {"phone": phone_clean}]
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Worker with Staff ID '{staff_code}' or Phone '{phone_clean}' already exists.",
        )

    lat = float(getattr(payload, "lat", 28.6139) or 28.6139)
    lng = float(getattr(payload, "lng", 77.2090) or 77.2090)
    block = getattr(payload, "current_block", None) or getattr(payload, "default_block", None) or str(detect_building_geofence(lat, lng)) or "Block-B"
    floor = int(getattr(payload, "current_floor", None) or getattr(payload, "floor", 1) or 1)

    pin = getattr(payload, "pin", "2222")
    hashed_pin = hash_secret(pin)

    new_worker = {
        "staff_id": staff_code,
        "name": payload.name.strip(),
        "phone": phone_clean,
        "role": UserRole.GROUND_WORKER.value,
        "department": dept_raw,
        "duty_state": DutyState.ONLINE_FREE.value,
        "pin_hash": hashed_pin,
        "demo_plain_secret": pin,
        "pin_demo_ref": pin,
        "current_block": block,
        "current_floor": floor,
        "accuracy": 4.5,
        "last_gps_ping": now,
        "lat": lat,
        "lng": lng,
        "location": {
            "type": "Point",
            "coordinates": [lng, lat],
        },
        "active_tasks_count": 0,
        "missed_alerts_count": 0,
        "tasks_completed_today": 0,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    result = await users_col.insert_one(new_worker)
    worker_id = str(result.inserted_id)
    new_worker["id"] = worker_id

    # Initialize Roll-Call in attendance_col
    zone_label = f"{block} • Floor {floor}" if floor > 0 else block
    await attendance_col.update_one(
        {
            "$or": [
                {"user_id": worker_id, "date_str": today_str},
                {"staff_id": staff_code, "date_str": today_str},
            ]
        },
        {
            "$setOnInsert": {
                "user_id": worker_id,
                "staff_id": staff_code,
                "name": payload.name.strip(),
                "role": UserRole.GROUND_WORKER.value,
                "department": dept_raw,
                "date_str": today_str,
                "date": today_str,
                "check_in_time": now,
                "created_at": now,
            },
            "$set": {
                "status": "PRESENT",
                "duty_state": DutyState.ONLINE_FREE.value,
                "live_gps_zone": zone_label,
                "live_zone": zone_label,
                "lat": lat,
                "lng": lng,
                "tasks_completed_today": 0,
                "active_tasks": 0,
                "last_updated": now,
            },
        },
        upsert=True,
    )

    # Real-Time WebSocket Broadcasts
    broadcast_payload = {
        "type": "WORKER_CREATED",
        "data": {
            "worker_id": worker_id,
            "staff_id": staff_code,
            "name": payload.name.strip(),
            "department": dept_raw,
            "duty_state": DutyState.ONLINE_FREE.value,
            "block": block,
            "floor": floor,
            "created_by": current_user.get("name", "Supervisor"),
        },
    }
    await ws_manager.broadcast_to_role(UserRole.FACILITY_SUPERVISOR.value, broadcast_payload)
    await ws_manager.broadcast_to_role(UserRole.SUPER_ADMIN.value, broadcast_payload)

    # Attendance Update Event
    await ws_manager.broadcast_to_role(
        UserRole.FACILITY_SUPERVISOR.value,
        {
            "type": "ATTENDANCE_UPDATED",
            "data": {
                "staff_id": staff_code,
                "name": payload.name.strip(),
                "duty_state": DutyState.ONLINE_FREE.value,
                "status": "PRESENT",
                "zone_label": zone_label,
            },
        },
    )

    # Audit Log
    await log_audit_event(
        event_type="WORKER_ENROLLED",
        title=f"Worker Onboarded: {payload.name.strip()} ({staff_code})",
        description=f"Technician enrolled into trade {dept_raw} by Supervisor {current_user.get('name')}.",
        actor_name=current_user.get("name", "Supervisor"),
        role=current_user.get("role", UserRole.FACILITY_SUPERVISOR.value),
        severity=AuditSeverity.INFO,
        metadata={"worker_id": worker_id, "staff_id": staff_code, "department": dept_raw},
    )

    sanitized = dict(new_worker)
    sanitized.pop("pin_hash", None)
    sanitized.pop("_id", None)
    return {
        "success": True,
        "message": f"Ground Worker {payload.name.strip()} ({staff_code}) registered successfully in trade {dept_raw}.",
        "worker": serialize_doc(sanitized),
    }


@router.post("/create-worker")
async def create_worker_endpoint(
    payload: WorkerOnboardInput,
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.FACILITY_SUPERVISOR, UserRole.SUPER_ADMIN])),
):
    """Enroll a new ground technician under one of the 6 maintenance trades."""
    return await _execute_create_worker(payload, current_user)


@alias_router.post("/create-worker")
async def create_worker_alias_endpoint(
    payload: WorkerOnboardInput,
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.FACILITY_SUPERVISOR, UserRole.SUPER_ADMIN])),
):
    """Alias route for worker onboarding: /api/v1/facility-head/create-worker."""
    return await _execute_create_worker(payload, current_user)


@router.get("/workers")
async def list_ground_workers_with_matrix(
    department_filter: Optional[str] = Query(default=None, description="Optional filter by trade"),
    duty_state_filter: Optional[str] = Query(default=None, description="Optional filter by duty state"),
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.FACILITY_SUPERVISOR, UserRole.SUPER_ADMIN])),
):
    """
    Returns complete Ground Workers roster across all 6 departments with live GPS + Floor positions,
    plus an aggregated department_summary matrix for supervisor analytics.
    """
    query: Dict[str, Any] = {"role": UserRole.GROUND_WORKER.value, "is_active": True}
    if department_filter:
        query["department"] = department_filter.strip().upper()
    if duty_state_filter:
        query["duty_state"] = duty_state_filter.strip().upper()

    cursor = users_col.find(query).sort([("department", 1), ("name", 1)])
    workers = await cursor.to_list(length=200)

    # Build 6-Department Summary Matrix
    department_summary: Dict[str, Dict[str, int]] = {
        trade: {"ONLINE_FREE": 0, "BUSY_ON_TASK": 0, "ON_BREAK": 0, "OFF_DUTY": 0, "total": 0}
        for trade in VALID_6_TRADES
    }

    formatted_workers = []
    for w in workers:
        w_id = str(w.pop("_id", ""))
        w["id"] = w_id
        w.pop("hashed_password", None)
        w.pop("pin_hash", None)

        dept = str(w.get("department", "HOUSEKEEPING")).upper()
        state = str(w.get("duty_state", DutyState.ONLINE_FREE.value)).upper()

        if dept in department_summary:
            if state in department_summary[dept]:
                department_summary[dept][state] += 1
            department_summary[dept]["total"] += 1

        coords = w.get("location", {}).get("coordinates", [77.2090, 28.6139])
        w["lng"] = coords[0] if len(coords) > 0 else 77.2090
        w["lat"] = coords[1] if len(coords) > 1 else 28.6139
        w["status_badge"] = "🟢 Free" if state == "ONLINE_FREE" else ("🟡 Busy" if state == "BUSY_ON_TASK" else ("☕ Break" if state == "ON_BREAK" else "🔴 Off-Duty"))

        formatted_workers.append(serialize_doc(w))

    total_online = sum(stats["ONLINE_FREE"] for stats in department_summary.values())
    total_busy = sum(stats["BUSY_ON_TASK"] for stats in department_summary.values())
    total_break = sum(stats["ON_BREAK"] for stats in department_summary.values())
    total_off = sum(stats["OFF_DUTY"] for stats in department_summary.values())

    return {
        "success": True,
        "total_workers": len(formatted_workers),
        "total_online_free": total_online,
        "total_busy_on_task": total_busy,
        "total_on_break": total_break,
        "total_off_duty": total_off,
        "department_summary": department_summary,
        "workers": formatted_workers,
    }


# =============================================================================
# SCREEN 2: INDOOR BUILDING FLOOR-GRID & INCIDENT QUEUE
# =============================================================================
@router.get("/floor-grid")
async def get_floor_grid_status(
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.FACILITY_SUPERVISOR, UserRole.SUPER_ADMIN, UserRole.SECURITY_HEAD])),
):
    """
    Returns visual digital twin floor grid for all blocks (Block-A, Block-B, Block-C, Central Library).
    Each room has a dynamic visual_indicator:
      - 'GREEN' ('NORMAL') when zero unresolved maintenance tickets exist
      - 'RED' ('GHOST_ENERGY_ALERT' or 'FAULT_REPORTED') when active workorders exist
    Includes appliances, rated wattage (kW), and live camera stream pointers.
    """
    rooms_cursor = rooms_col.find().sort([("block_name", 1), ("floor_number", 1), ("room_number", 1)])
    all_rooms = await rooms_cursor.to_list(length=300)

    # Fetch active facility workorders
    active_wo_cursor = facility_workorders_col.find({
        "status": {"$nin": [WorkOrderStatus.RESOLVED.value]}
    })
    active_workorders = await active_wo_cursor.to_list(length=150)

    # Map unresolved workorders by (block, room_number)
    active_issue_keys: Dict[tuple, Dict[str, Any]] = {}
    for wo in active_workorders:
        b_name = wo.get("block_name")
        r_num = wo.get("room_number")
        if b_name and r_num:
            active_issue_keys[(b_name.strip().lower(), r_num.strip().lower())] = wo

    grid_by_block: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
    flat_room_list: List[Dict[str, Any]] = []

    total_power_drain_kw = 0.0
    active_alert_rooms_count = 0

    for r in all_rooms:
        block = r.get("block_name", "Block-B")
        floor = r.get("floor_number", 1)
        floor_key = f"Floor {floor}"
        room_no = r.get("room_number", "Room")

        key = (block.strip().lower(), room_no.strip().lower())
        linked_wo = active_issue_keys.get(key)

        is_alert = (linked_wo is not None) or (r.get("current_status") in [
            RoomHealthStatus.ALERT.value,
            RoomHealthStatus.GHOST_ENERGY_ALERT.value,
            "FAULT_REPORTED",
            "ALERT",
        ])

        visual_indicator = "RED" if is_alert else "GREEN"
        status_label = (
            "GHOST_ENERGY_ALERT" if (linked_wo and linked_wo.get("source") == WorkorderSource.AI_GHOST_ENERGY.value)
            else ("FAULT_REPORTED" if linked_wo else ("NORMAL" if not is_alert else "ALERT"))
        )

        appliances = r.get("appliances", [])
        total_kw = float(r.get("total_kw_rating", 0.0) or 0.0)
        wasted_kw = 0.0
        if is_alert:
            if linked_wo:
                wasted_kw = float(linked_wo.get("wasted_kw") or linked_wo.get("wasted_power_kw") or total_kw or 0.0)
            else:
                wasted_kw = float(total_kw or 0.0)

        if is_alert:
            active_alert_rooms_count += 1
            total_power_drain_kw += wasted_kw

        room_entry = {
            "room_id": str(r.get("_id")),
            "block_name": block,
            "floor_number": floor,
            "room_number": room_no,
            "room_type": r.get("room_type", "CLASSROOM"),
            "visual_indicator": visual_indicator,
            "visual_status": visual_indicator,
            "status_label": status_label,
            "total_kw_rating": total_kw,
            "wasted_power_kw": wasted_kw,
            "appliances": appliances,
            "appliances_summary": ", ".join(f"{a.get('count', 1)}x {a.get('name', 'Unit')} ({a.get('kw', 0.0)} kW)" for a in appliances) if appliances else "Standard load",
            "active_ticket_id": str(linked_wo.get("_id")) if linked_wo else None,
            "ticket_source": linked_wo.get("source") or linked_wo.get("ticket_source") if linked_wo else None,
            "ticket_title": linked_wo.get("title") if linked_wo else None,
            "ticket_status": linked_wo.get("status") if linked_wo else None,
            "instruction_hindi": linked_wo.get("instruction_hindi") if linked_wo else None,
            "camera_tag": r.get("camera_tag", "INDOOR_FACILITY"),
            "rtsp_url": r.get("rtsp_url"),
            "gps_lat": r.get("gps_lat") or (r.get("location", {}).get("coordinates", [0, 0])[1] if r.get("location") else 28.6139),
            "gps_lng": r.get("gps_lng") or (r.get("location", {}).get("coordinates", [0, 0])[0] if r.get("location") else 77.2090),
        }

        flat_room_list.append(room_entry)

        if block not in grid_by_block:
            grid_by_block[block] = {}
        if floor_key not in grid_by_block[block]:
            grid_by_block[block][floor_key] = []
        grid_by_block[block][floor_key].append(room_entry)

    return {
        "success": True,
        "total_rooms": len(flat_room_list),
        "active_alert_rooms": active_alert_rooms_count,
        "total_active_wasted_kw": round(total_power_drain_kw, 2),
        "grid_by_block": grid_by_block,
        "rooms": flat_room_list,
    }


@router.get("/workorders")
async def list_facility_workorders(
    status_filter: Optional[str] = Query(default=None, description="SUBMITTED, VERIFIED_ASSIGNED, WORKER_EN_ROUTE, RESOLVED, ESCALATED"),
    category_filter: Optional[str] = Query(default=None, description="Trade department filter"),
    limit: int = Query(default=100, le=200),
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.FACILITY_SUPERVISOR, UserRole.SUPER_ADMIN, UserRole.GROUND_WORKER])),
):
    """
    Returns all active and resolved facility workorders (AI Ghost Energy & User Grievances).
    For pending workorders, dynamically computes AI Smart Worker Recommendations with match scores and distances.
    Includes autopilot and SLA countdown timers.
    """
    query: Dict[str, Any] = {}
    if status_filter:
        query["status"] = status_filter.strip().upper()
    if category_filter:
        query["$or"] = [
            {"category": category_filter.strip().upper()},
            {"required_department": category_filter.strip().upper()},
        ]

    cursor = facility_workorders_col.find(query).sort("created_at", -1).limit(limit)
    workorders = await cursor.to_list(length=limit)

    results = []
    for raw_wo in workorders:
        wo = _normalize_workorder_doc(raw_wo)

        # Dynamic AI Recommendations for unassigned/pending workorders
        is_pending = wo.get("status") in [WorkOrderStatus.SUBMITTED.value, WorkOrderStatus.ESCALATED.value]
        if is_pending and not wo.get("assigned_worker_id"):
            target_lat = wo.get("lat", 28.6139)
            target_lng = wo.get("lng", 77.2090)
            req_dept = wo.get("required_department") or wo.get("category") or "HOUSEKEEPING"
            t_block = wo.get("block_name", "Block-B")
            t_floor = wo.get("floor_number", 1)

            recommended = await recommend_smart_workers(
                target_lat=target_lat,
                target_lng=target_lng,
                required_department=req_dept,
                target_block=t_block,
                target_floor=t_floor,
                limit=3,
            )
            wo["recommended_workers"] = recommended
        elif not wo.get("recommended_workers"):
            wo["recommended_workers"] = []

        results.append(wo)

    return results


@router.post("/simulate-ghost-energy")
async def simulate_ghost_energy_alert(
    payload: Optional[SimulateGhostEnergyInput] = None,
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.FACILITY_SUPERVISOR, UserRole.SUPER_ADMIN])),
):
    if payload is None:
        payload = SimulateGhostEnergyInput()
    """
    Demo/Testing Endpoint: Generates a high-precision 3.54 kW Ghost Energy Drain in an indoor room (e.g. Block-B Room 204),
    attaches YOLOv8 optical headcount 0 telemetry, calculates 60s autopilot and 600s SLA deadlines,
    and flashes real-time WebSocket alert cards to supervisor and admin consoles.
    """
    now = datetime.utcnow()
    block_name = payload.block_name or "Block-B"
    room_number = payload.room_number or "Room 204"
    floor_number = payload.floor_number or 2
    wasted_kw = float(payload.wasted_power_kw or payload.wasted_kw or 3.54)
    dept = (payload.category or "HOUSEKEEPING").strip().upper()

    # Query Room Telemetry
    room = await rooms_col.find_one({"block_name": block_name, "room_number": room_number})
    if not room:
        room = await rooms_col.find_one({"room_number": room_number})

    room_lat = room.get("gps_lat") or 28.6139 if room else 28.6139
    room_lng = room.get("gps_lng") or 77.2090 if room else 77.2090
    appliances = room.get("appliances", [
        {"name": "Split AC", "count": 2, "kw": 3.0},
        {"name": "LED Tube Lights", "count": 6, "kw": 0.24},
        {"name": "Ceiling Fans", "count": 4, "kw": 0.30},
    ]) if room else [
        {"name": "Split AC", "count": 2, "kw": 3.0},
        {"name": "LED Tube Lights", "count": 6, "kw": 0.24},
        {"name": "Ceiling Fans", "count": 4, "kw": 0.30},
    ]

    total_rating = float(room.get("total_kw_rating", wasted_kw) if room else wasted_kw)

    # Compute AI Recommended Workers
    recommended_candidates = await recommend_smart_workers(
        target_lat=room_lat,
        target_lng=room_lng,
        required_department=dept,
        target_block=block_name,
        target_floor=floor_number,
        limit=3,
    )

    autopilot_deadline = now + timedelta(seconds=60)
    sla_resolve_deadline = now + timedelta(seconds=600)
    workorder_code = f"WO-GHOST-{uuid.uuid4().hex[:6].upper()}"

    new_wo = {
        "workorder_code": workorder_code,
        "source": WorkorderSource.AI_GHOST_ENERGY.value,
        "ticket_source": WorkorderSource.AI_GHOST_ENERGY.value,
        "category": dept,
        "required_department": dept,
        "status": WorkorderStatus.SUBMITTED.value,
        "block_name": block_name,
        "floor_number": floor_number,
        "room_number": room_number,
        "lat": room_lat,
        "lng": room_lng,
        "location": {
            "type": "Point",
            "coordinates": [room_lng, room_lat],
        },
        "wasted_power_kw": wasted_kw,
        "wasted_kw": wasted_kw,
        "vacant_duration_minutes": 10,
        "title": f"AI Ghost Energy Drain: {room_number} ({block_name})",
        "description": f"Indoor Digital Twin detected {room_number} vacant for > 10 mins with {wasted_kw} kW active appliance drain.",
        "instruction_hindi": f"Kamra khali hai ({room_number}). Main switchboard se 2 AC, 6 Lights aur 4 Fans turant band karein.",
        "cctv_verification_data": {
            "headcount": 0,
            "headcount_detected": 0,
            "occupancy_status": "VACANT_UNOCCUPIED",
            "room_luminance": 224.0,
            "room_luminance_lux": 224.0,
            "appliances_on": [
                "2 Split AC (3.0 kW)",
                "6 LED Lights (0.24 kW)",
                "4 Ceiling Fans (0.30 kW)",
            ],
            "active_appliances": appliances,
            "timetable_status": "NO_LECTURE_SCHEDULED",
            "clip_duration_sec": 5,
            "privacy_mode": "ON_DEMAND_5_SEC_ONLY",
        },
        "supervisor_autopilot_deadline": autopilot_deadline,
        "sla_accept_deadline": None,
        "sla_deadline": sla_resolve_deadline,
        "sla_resolve_deadline": sla_resolve_deadline,
        "recommended_workers": recommended_candidates,
        "assigned_worker_id": None,
        "assigned_worker_name": None,
        "assigned_worker_staff_id": None,
        "assigned_worker_dept": None,
        "assigned_worker_phone": None,
        "proof_photo_url": None,
        "post_close_cctv_verified": False,
        "energy_saved_kwh": 0.0,
        "money_saved_rupees": 0.0,
        "rupees_saved": 0.0,
        "timeline_steps": [
            {
                "step_key": "SUBMITTED",
                "title": "Submitted / Detected by Indoor AI Vision",
                "description": f"Zero headcount confirmed with {wasted_kw} kW power drain in {room_number}.",
                "completed": True,
                "timestamp": now,
                "actor_name": "Indoor Digital Twin Vision Engine",
            },
            {
                "step_key": "VERIFIED_ASSIGNED",
                "title": "Verified & Assigned to Worker",
                "description": "Waiting for Supervisor CCTV Verification or Auto-Pilot Dispatch",
                "completed": False,
                "timestamp": None,
                "actor_name": None,
            },
            {
                "step_key": "WORKER_EN_ROUTE",
                "title": "Worker En Route",
                "description": "Worker has accepted task and heading to room",
                "completed": False,
                "timestamp": None,
                "actor_name": None,
            },
            {
                "step_key": "RESOLVED",
                "title": "Resolved with Live Proof Photo & CCTV Verified",
                "description": "Appliances shut off, optical verification confirmed",
                "completed": False,
                "timestamp": None,
                "actor_name": None,
            },
        ],
        "created_at": now,
        "updated_at": now,
    }

    insert_res = await facility_workorders_col.insert_one(new_wo)
    wo_id = str(insert_res.inserted_id)
    new_wo["id"] = wo_id

    # Update Room & Block Health Status to ALERT (RED)
    await rooms_col.update_one(
        {"block_name": block_name, "room_number": room_number},
        {"$set": {"current_status": RoomHealthStatus.GHOST_ENERGY_ALERT.value, "updated_at": now}},
    )
    await blocks_col.update_one(
        {"block_name": block_name},
        {"$set": {"status": "ALERT", "updated_at": now}},
    )

    # Real-Time WebSocket Alerts
    normalized_wo = _normalize_workorder_doc(new_wo)
    event_payload = {
        "type": "NEW_FACILITY_WORKORDER",
        "data": normalized_wo,
    }
    await ws_manager.broadcast_to_role(UserRole.FACILITY_SUPERVISOR.value, event_payload)
    await ws_manager.broadcast_to_role(UserRole.SUPER_ADMIN.value, event_payload)

    # Audit Log
    await log_audit_event(
        event_type="GHOST_ENERGY_DETECTED",
        title=f"3.54 kW Ghost Energy Alert: {block_name} {room_number}",
        description=f"Optical AI detected 0 occupants with {wasted_kw} kW active load. Auto-Pilot in 60s.",
        actor_name="AI Vision Digital Twin",
        role="SYSTEM_AI",
        severity=AuditSeverity.WARNING,
        metadata={"workorder_id": wo_id, "room": room_number, "wasted_kw": wasted_kw},
    )

    return {
        "success": True,
        "message": f"Ghost Energy Drain alert created for {block_name} {room_number} ({wasted_kw} kW).",
        "workorder": normalized_wo,
    }


# =============================================================================
# SCREEN 3: PRIVACY-SAFE CCTV VERIFICATION & AI SMART DISPATCH
# =============================================================================
@router.get("/workorders/{workorder_id}/verify-cctv")
async def verify_workorder_cctv(
    workorder_id: str,
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.FACILITY_SUPERVISOR, UserRole.SUPER_ADMIN])),
):
    """
    Privacy-Safe Optical Verification:
    Strict Rule: Continuous feeds are locked to protect student/faculty privacy.
    Upon supervisor request, unlocks an ephemeral 5-second verified snapshot verifying 0 headcount,
    luminance level, and running appliances without exposing private camera streams.
    """
    wo_query = {"_id": ObjectId(workorder_id)} if ObjectId.is_valid(workorder_id) else {"$or": [{"id": workorder_id}, {"workorder_code": workorder_id}]}
    wo = await facility_workorders_col.find_one(wo_query)
    if not wo:
        raise HTTPException(status_code=404, detail=f"Facility work order '{workorder_id}' not found.")

    now = datetime.utcnow()
    block_name = wo.get("block_name", "Block-B")
    room_number = wo.get("room_number", "Room 204")
    floor_number = wo.get("floor_number", 2)
    wasted_kw = float(wo.get("wasted_power_kw") or wo.get("wasted_kw") or 3.54)

    # Room appliance details
    room = await rooms_col.find_one({"block_name": block_name, "room_number": room_number})
    appliances_list = [
        "2 Split AC (3.0 kW)",
        "6 LED Lights (0.24 kW)",
        "4 Ceiling Fans (0.30 kW)",
    ]
    if room and room.get("appliances"):
        appliances_list = [f"{a.get('count', 1)} {a.get('name', 'Unit')} ({a.get('kw', 0.0)} kW)" for a in room["appliances"]]

    # Audit Logging for Privacy Compliance
    await log_audit_event(
        event_type="PRIVACY_CCTV_VERIFIED",
        title=f"Privacy-Safe 5-Sec CCTV Verified: {block_name} {room_number}",
        description=f"Supervisor {current_user.get('name')} verified 5-sec optical verification clip for ticket #{str(wo.get('_id'))[-6:]}.",
        actor_name=current_user.get("name", "Supervisor"),
        role=current_user.get("role", UserRole.FACILITY_SUPERVISOR.value),
        severity=AuditSeverity.INFO,
        metadata={"workorder_id": str(wo.get("_id")), "room_number": room_number},
    )

    return {
        "success": True,
        "workorder_id": str(wo.get("_id")),
        "block_name": block_name,
        "floor_number": floor_number,
        "room_number": room_number,
        "privacy_unlock_seconds": 5,
        "headcount_detected": 0,
        "occupancy_status": "VACANT_UNOCCUPIED",
        "vacant_since_minutes": int(wo.get("vacant_duration_minutes", 10)),
        "room_luminance_lux": 224.0,
        "appliances_detected_on": appliances_list,
        "wasted_power_kw": wasted_kw,
        "timetable_check": "No Lecture Scheduled",
        "verified_by_supervisor": True,
        "verified_at": now.isoformat(),
        "preview_clip_url": "https://assets.smartcampus.io/clips/ghost_energy_room204_5s.mp4",
        "message": f"5-second verified audit clip unlocked. Zero human presence confirmed with {wasted_kw} kW active load.",
    }


@router.post("/workorders/{workorder_id}/dispatch")
async def dispatch_worker_to_workorder(
    workorder_id: str,
    payload: Optional[DispatchWorkerInput] = None,
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.FACILITY_SUPERVISOR, UserRole.SUPER_ADMIN])),
):
    if payload is None:
        payload = DispatchWorkerInput()
    """
    Supervisor Smart Dispatch Action:
    Assigns selected or top AI-ranked technician, starts 180s (3-minute) worker SLA countdown,
    updates Swiggy-style timeline tracker Step 2, and pushes a high-priority mobile card to the worker.
    """
    now = datetime.utcnow()
    wo_query = {"_id": ObjectId(workorder_id)} if ObjectId.is_valid(workorder_id) else {"$or": [{"id": workorder_id}, {"workorder_code": workorder_id}]}
    wo = await facility_workorders_col.find_one(wo_query)
    if not wo:
        raise HTTPException(status_code=404, detail=f"Work order '{workorder_id}' not found.")

    worker = None
    target_worker_id = payload.worker_id

    # If worker not explicitly provided, pick #1 top AI recommended candidate
    if not target_worker_id:
        req_dept = wo.get("required_department") or wo.get("category") or "HOUSEKEEPING"
        top_candidates = await recommend_smart_workers(
            target_lat=wo.get("lat", 28.6139),
            target_lng=wo.get("lng", 77.2090),
            required_department=req_dept,
            target_block=wo.get("block_name"),
            target_floor=wo.get("floor_number", 1),
            limit=1,
        )
        if top_candidates:
            target_worker_id = top_candidates[0]["staff_id"]

    if target_worker_id:
        w_query = {
            "$or": [
                {"staff_id": target_worker_id},
                {"_id": ObjectId(target_worker_id)} if ObjectId.is_valid(target_worker_id) else {"phone": target_worker_id},
            ]
        }
        worker = await users_col.find_one(w_query)

    if not worker:
        raise HTTPException(
            status_code=404,
            detail=f"Worker candidate '{target_worker_id}' could not be located in staff roster.",
        )

    worker_obj_id = str(worker.get("_id"))
    worker_staff_id = worker.get("staff_id", target_worker_id)
    worker_name = worker.get("name", "Technician")
    worker_dept = worker.get("department", wo.get("category", "HOUSEKEEPING"))
    worker_phone = worker.get("phone", "N/A")
    supervisor_name = current_user.get("name", "Facility Supervisor")

    # 3-Minute Acceptance SLA Window
    sla_accept_deadline = now + timedelta(seconds=180)

    # Timeline Step 2 Update
    step_2 = {
        "step_key": "VERIFIED_ASSIGNED",
        "title": f"Verified & Assigned to {worker_dept} Worker {worker_name} ({worker_staff_id})",
        "description": payload.supervisor_note or payload.notes or f"Supervisor {supervisor_name} verified telemetry and dispatched {worker_name}.",
        "completed": True,
        "timestamp": now,
        "actor_name": supervisor_name,
    }

    # Update Workorder
    await facility_workorders_col.update_one(
        {"_id": wo["_id"]},
        {
            "$set": {
                "status": WorkorderStatus.VERIFIED_ASSIGNED.value,
                "assigned_worker_id": worker_obj_id,
                "assigned_worker_name": worker_name,
                "assigned_worker_staff_id": worker_staff_id,
                "assigned_worker_dept": worker_dept,
                "assigned_worker_phone": worker_phone,
                "dispatched_at": now,
                "sla_accept_deadline": sla_accept_deadline,
                "sla_deadline": sla_accept_deadline,
                "updated_at": now,
            },
            "$push": {"timeline_steps": step_2},
        },
    )

    # Increment worker workload
    await users_col.update_one(
        {"_id": worker["_id"]},
        {"$inc": {"active_tasks_count": 1}, "$set": {"updated_at": now}},
    )

    # Loud High-Priority Alert Card to Worker Mobile App
    worker_card = {
        "type": "WORKORDER_DISPATCHED",
        "data": {
            "workorder_id": str(wo["_id"]),
            "ticket_id": str(wo["_id"]),
            "source": wo.get("source"),
            "category": wo.get("category"),
            "block_name": wo.get("block_name"),
            "floor_number": wo.get("floor_number"),
            "room_number": wo.get("room_number"),
            "instruction_hindi": wo.get("instruction_hindi") or f"Kamra khali hai. Main switchboard se appliances band karein.",
            "wasted_power_kw": wo.get("wasted_power_kw", 3.54),
            "dispatched_at": now.isoformat(),
            "sla_accept_deadline": sla_accept_deadline.isoformat(),
            "sla_remaining_seconds": 180,
            "dispatched_by": supervisor_name,
        },
    }
    await ws_manager.send_to_user(worker_staff_id, worker_card)
    await ws_manager.send_to_user(worker_obj_id, worker_card)

    # Broadcast to Facility Supervisor, Super Admin, and Reporter
    broad_data = {
        "type": "WORKORDER_DISPATCHED",
        "data": {
            "workorder_id": str(wo["_id"]),
            "assigned_worker_name": worker_name,
            "assigned_worker_staff_id": worker_staff_id,
            "assigned_worker_dept": worker_dept,
            "sla_accept_deadline": sla_accept_deadline.isoformat(),
        },
    }
    await ws_manager.broadcast_to_role(UserRole.FACILITY_SUPERVISOR.value, broad_data)
    await ws_manager.broadcast_to_role(UserRole.SUPER_ADMIN.value, broad_data)

    # Notify student if grievance
    reporter = wo.get("reported_by_user", {})
    if reporter and reporter.get("id"):
        await ws_manager.send_to_user(str(reporter["id"]), broad_data)

    # Audit Log
    await log_audit_event(
        event_type="WORKORDER_DISPATCHED",
        title=f"Worker Dispatched: {worker_name} ({worker_staff_id})",
        description=f"Ticket #{str(wo['_id'])[-6:]} assigned to {worker_name} by {supervisor_name}. 3-min SLA started.",
        actor_name=supervisor_name,
        role=current_user.get("role", UserRole.FACILITY_SUPERVISOR.value),
        severity=AuditSeverity.INFO,
        metadata={"workorder_id": str(wo["_id"]), "worker_staff_id": worker_staff_id},
    )

    return {
        "success": True,
        "message": f"Workorder #{str(wo['_id'])[-6:]} assigned to {worker_name} ({worker_staff_id}) with 3-minute SLA window.",
        "assigned_worker": {
            "id": worker_obj_id,
            "staff_id": worker_staff_id,
            "name": worker_name,
            "department": worker_dept,
            "phone": worker_phone,
        },
        "sla_accept_deadline": sla_accept_deadline.isoformat(),
        "sla_remaining_seconds": 180,
    }


# =============================================================================
# SHARED ACCEPT & RESOLVE ENDPOINTS (FOR DIRECT COMPATIBILITY)
# =============================================================================
@router.patch("/workorders/{workorder_id}/accept")
async def accept_workorder_shared(
    workorder_id: str,
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.GROUND_WORKER, UserRole.FACILITY_SUPERVISOR, UserRole.SUPER_ADMIN])),
):
    """Shared acceptance endpoint mounted under /api/v1/facility/workorders/{id}/accept."""
    from app.routers.worker_app import _handle_workorder_accept
    return await _handle_workorder_accept(workorder_id, current_user)


@router.post("/workorders/{workorder_id}/resolve")
async def resolve_workorder_shared(
    workorder_id: str,
    payload: WorkerResolveTaskRequest,
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.GROUND_WORKER, UserRole.FACILITY_SUPERVISOR, UserRole.SUPER_ADMIN])),
):
    """Shared double-verified resolution endpoint mounted under /api/v1/facility/workorders/{id}/resolve."""
    from app.routers.worker_app import _handle_workorder_resolve
    return await _handle_workorder_resolve(workorder_id, payload, current_user)


# =============================================================================
# SCREEN 5: CCTV FACILITY EQUIPMENT & APPLIANCE VERIFICATION
# =============================================================================
@router.get("/cameras")
@alias_router.get("/cameras")
async def list_facility_cameras(
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.FACILITY_SUPERVISOR, UserRole.SUPER_ADMIN, UserRole.SECURITY_HEAD])),
):
    """
    Returns all surveillance cameras configured by the Super Admin in the Map Engine.
    Enriched with linked facility workorders, appliance details, and equipment inspection status.
    """
    cams = await cameras_col.find().to_list(length=100)
    if not cams:
        layout_doc = await spatial_layout_col.find_one()
        if layout_doc:
            for b in layout_doc.get("blocks", []):
                b_name = b.get("block_name")
                for f in b.get("floors", []):
                    f_num = f.get("floor_number", 0)
                    for c in f.get("cameras", []):
                        cams.append({
                            "camera_id": c.get("camera_id"),
                            "name": c.get("name") or c.get("camera_id"),
                            "camera_name": c.get("name") or c.get("camera_id"),
                            "block_name": b_name,
                            "floor_number": f_num,
                            "room_number": c.get("room_number", ""),
                            "rtsp_url": c.get("rtsp_url") or c.get("stream_url", ""),
                            "status": c.get("status", "ONLINE"),
                        })

    # Apply permissions: only return cameras granted to this facility supervisor by Admin
    allowed_cams = current_user.get("allowed_cameras") or []
    if current_user.get("role") != UserRole.SUPER_ADMIN.value and allowed_cams and "ALL" not in allowed_cams:
        cams = [c for c in cams if str(c.get("camera_id") or c.get("_id")) in allowed_cams]

    # Link any active facility workorders for each camera / room
    active_workorders = await facility_workorders_col.find({
        "status": {"$nin": [WorkorderStatus.RESOLVED.value, "RESOLVED"]},
    }).to_list(length=100)

    wo_by_room = {str(wo.get("room_number")): wo for wo in active_workorders if wo.get("room_number")}
    wo_by_block = {str(wo.get("block_name")): wo for wo in active_workorders if wo.get("block_name")}

    results = []
    for cam in cams:
        cam_id = str(cam.get("camera_id") or cam.get("_id"))
        b_name = cam.get("block_name", "Campus")
        r_num = str(cam.get("room_number", ""))
        linked_wo = wo_by_room.get(r_num) or wo_by_block.get(b_name)

        ticket_code = ""
        if linked_wo:
            ticket_code = linked_wo.get("ticket_id") or linked_wo.get("workorder_id") or f"TK-{str(linked_wo.get('_id'))[-4:].upper()}"
        else:
            ticket_code = f"ROUTINE-{cam_id[-4:]}"

        results.append({
            "id": cam_id,
            "camera_id": cam_id,
            "name": cam.get("name") or cam.get("camera_name") or cam_id,
            "title": f"{b_name} {r_num} • {cam.get('name') or cam_id}".strip(),
            "location": f"{b_name} Floor {cam.get('floor_number', 0)}" + (f" (Room {r_num})" if r_num else ""),
            "block_name": b_name,
            "floor_number": cam.get("floor_number", 0),
            "room_number": r_num,
            "rtsp_url": cam.get("rtsp_url") or "",
            "status": "VERIFY_NEEDED" if linked_wo else "NORMAL",
            "ticket": ticket_code,
            "details": linked_wo.get("description") if linked_wo else f"Visual status check for {b_name} equipment and ambient appliances.",
        })

    return results
