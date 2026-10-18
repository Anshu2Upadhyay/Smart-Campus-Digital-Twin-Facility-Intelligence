import asyncio
import logging
from datetime import datetime, timedelta, date
from typing import Optional, List, Dict, Any
from bson import ObjectId

from app.config import settings
from app.database import (
    facility_workorders_col,
    security_incidents_col,
    users_col,
    attendance_col,
    audit_logs_col,
    serialize_doc,
)
from app.models.facility import WorkorderStatus, WorkOrderStatus
from app.models.user import UserRole
from app.models.attendance import AuditSeverity, AuditEventType, log_audit_event
from app.services.gps_matcher import recommend_smart_workers
from app.services.websocket_manager import ws_manager

logger = logging.getLogger("smart_campus.sla_scheduler")


async def run_sla_monitor(check_interval_seconds: int = 5) -> None:
    """
    Asynchronous Enterprise SLA Monitoring Engine:
    Runs every 5 seconds checking MongoDB collections to enforce:
      - Tier 1: 60-Second Supervisor Autopilot Mode (Auto-Dispatches free workers).
      - Tier 2: 3-Minute Worker Acceptance SLA (Penalizes timeouts & auto-reassigns).
      - Tier 3: 10-Minute Resolution Escalation Timer (Alerts Super Admin & Department Heads).
    """
    logger.info(
        f"Active SLA Scheduler initialized: Autopilot={settings.SLA_SUPERVISOR_AUTOPILOT_SECONDS}s, "
        f"Acceptance={settings.SLA_WORKER_ACCEPT_SECONDS}s, Escalation={settings.SLA_ESCALATION_SECONDS}s."
    )

    while True:
        try:
            now = datetime.utcnow()
            today_str = date.today().isoformat()

            # =================================================================
            # TIER 1: 60-SECOND SUPERVISOR AUTOPILOT MODE
            # =================================================================
            # Find tickets still SUBMITTED with no assigned worker created > 60s ago
            tier1_threshold = now - timedelta(seconds=settings.SLA_SUPERVISOR_AUTOPILOT_SECONDS)
            tier1_query = {
                "status": WorkorderStatus.SUBMITTED.value,
                "assigned_worker_id": None,
                "created_at": {"$lte": tier1_threshold},
            }

            unassigned_tickets = await facility_workorders_col.find(tier1_query).to_list(length=25)

            for ticket in unassigned_tickets:
                ticket_id = ticket["_id"]
                t_lat = float(ticket.get("lat", 28.6139))
                t_lng = float(ticket.get("lng", 77.2090))
                category = ticket.get("category") or ticket.get("required_department")
                block_name = ticket.get("block_name", "Block-B")
                floor = int(ticket.get("floor_number", 1))

                recommended = await recommend_smart_workers(
                    target_lat=t_lat,
                    target_lng=t_lng,
                    required_department=category,
                    target_block=block_name,
                    target_floor=floor,
                    limit=3,
                )

                if recommended:
                    best_worker = recommended[0]
                    accept_deadline = now + timedelta(seconds=settings.SLA_WORKER_ACCEPT_SECONDS)
                    resolve_deadline = now + timedelta(seconds=settings.SLA_ESCALATION_SECONDS)

                    pilot_step = {
                        "step_key": WorkorderStatus.VERIFIED_ASSIGNED.value,
                        "title": f"Auto-Pilot Assigned to {best_worker['name']}",
                        "description": (
                            f"Supervisor inactive for {settings.SLA_SUPERVISOR_AUTOPILOT_SECONDS}s. "
                            f"AI Auto-Pilot dispatched {best_worker['name']} ({best_worker['match_percentage']}, {best_worker['distance_meters']}m away)."
                        ),
                        "completed": True,
                        "timestamp": now,
                        "actor_name": "AI Auto-Pilot Engine",
                    }

                    await facility_workorders_col.update_one(
                        {"_id": ticket_id},
                        {
                            "$set": {
                                "status": WorkorderStatus.VERIFIED_ASSIGNED.value,
                                "assigned_worker_id": best_worker["worker_id"],
                                "assigned_worker_name": best_worker["name"],
                                "assigned_worker_staff_id": best_worker["staff_id"],
                                "assigned_worker_dept": best_worker["department"],
                                "assigned_worker_phone": best_worker["phone"],
                                "dispatched_at": now,
                                "sla_accept_deadline": accept_deadline,
                                "sla_deadline": accept_deadline,
                                "sla_resolve_deadline": resolve_deadline,
                                "updated_at": now,
                            },
                            "$push": {"timeline_steps": pilot_step},
                        },
                    )

                    # Update worker active task workload
                    await users_col.update_one(
                        {"_id": ObjectId(best_worker["worker_id"])},
                        {"$inc": {"active_tasks_count": 1}},
                    )

                    # Dispatch loud alert to worker's mobile application
                    task_notification = {
                        "type": "WORKORDER_DISPATCHED",
                        "data": {
                            "ticket_id": str(ticket_id),
                            "workorder_code": ticket.get("workorder_code"),
                            "title": ticket.get("title"),
                            "block_name": block_name,
                            "floor_number": floor,
                            "room_number": ticket.get("room_number"),
                            "category": category,
                            "instruction_hindi": ticket.get("instruction_hindi"),
                            "sla_seconds": settings.SLA_WORKER_ACCEPT_SECONDS,
                            "accept_deadline": accept_deadline.isoformat(),
                        },
                    }
                    await ws_manager.send_to_user(best_worker["worker_id"], task_notification)
                    await ws_manager.send_to_user(best_worker["staff_id"], task_notification)

                    # Broadcast real-time status update to Supervisory dashboards
                    supervisor_alert = {
                        "type": "WORKORDER_UPDATED",
                        "data": {
                            "ticket_id": str(ticket_id),
                            "status": WorkorderStatus.VERIFIED_ASSIGNED.value,
                            "assigned_worker_name": best_worker["name"],
                            "assigned_worker_staff_id": best_worker["staff_id"],
                            "auto_pilot": True,
                        },
                    }
                    await ws_manager.broadcast_to_role(UserRole.FACILITY_SUPERVISOR.value, supervisor_alert)
                    await ws_manager.broadcast_to_role(UserRole.SUPER_ADMIN.value, supervisor_alert)

                    # Audit trail logging
                    await log_audit_event(
                        event_type=AuditEventType.WORKER_DISPATCHED,
                        title=f"AI Auto-Pilot Dispatched: {ticket.get('room_number')}",
                        description=f"Auto-assigned to {best_worker['name']} ({best_worker['staff_id']}) after supervisor 60s timeout.",
                        actor_name="AI Auto-Pilot",
                        actor_role=UserRole.SUPER_ADMIN,
                        target_id=str(ticket_id),
                        severity=AuditSeverity.INFO,
                        metadata={"worker": best_worker["name"], "room": ticket.get("room_number")},
                    )
                    logger.info(f"[Tier 1 Autopilot] Dispatched ticket {ticket_id} to {best_worker['name']}.")

            # =================================================================
            # TIER 2: 3-MINUTE WORKER ACCEPTANCE SLA & AUTO-REASSIGNMENT
            # =================================================================
            # Find tickets in VERIFIED_ASSIGNED state where accept countdown has expired
            tier2_query = {
                "status": WorkorderStatus.VERIFIED_ASSIGNED.value,
                "$or": [
                    {"sla_accept_deadline": {"$lte": now, "$ne": None}},
                    {"sla_deadline": {"$lte": now, "$ne": None}},
                ],
            }

            expired_acceptance_tickets = await facility_workorders_col.find(tier2_query).to_list(length=25)

            for ticket in expired_acceptance_tickets:
                ticket_id = ticket["_id"]
                orig_worker_id = ticket.get("assigned_worker_id")
                orig_worker_name = ticket.get("assigned_worker_name", "Assigned Worker")
                orig_staff_id = ticket.get("assigned_worker_staff_id")

                # 1. Penalize delinquent worker: increment missed SLA & decrement workload
                delinquent_query = {}
                if orig_worker_id and ObjectId.is_valid(orig_worker_id):
                    delinquent_query = {"_id": ObjectId(orig_worker_id)}
                elif orig_staff_id:
                    delinquent_query = {"staff_id": orig_staff_id}

                if delinquent_query:
                    delinquent_user = await users_col.find_one_and_update(
                        delinquent_query,
                        {
                            "$inc": {"missed_alerts_count": 1},
                            "$set": {"updated_at": now},
                        },
                        return_document=True,
                    )
                    # Decrement active tasks count safely
                    if delinquent_user and delinquent_user.get("active_tasks_count", 0) > 0:
                        await users_col.update_one(delinquent_query, {"$inc": {"active_tasks_count": -1}})

                    # Update today's attendance missed SLA counter
                    user_ref = str(delinquent_user["_id"]) if delinquent_user else str(orig_worker_id)
                    await attendance_col.update_one(
                        {
                            "$or": [
                                {"user_id": user_ref, "date_str": today_str},
                                {"staff_id": orig_staff_id, "date_str": today_str},
                            ]
                        },
                        {"$inc": {"missed_sla_count": 1}},
                    )

                # Revoke task on delinquent worker's mobile screen
                revoke_msg = {
                    "type": "SLA_TASK_REVOKED",
                    "data": {
                        "ticket_id": str(ticket_id),
                        "reason": f"3-Minute acceptance SLA deadline ({settings.SLA_WORKER_ACCEPT_SECONDS}s) expired.",
                    },
                }
                if orig_worker_id:
                    await ws_manager.send_to_user(str(orig_worker_id), revoke_msg)
                if orig_staff_id:
                    await ws_manager.send_to_user(str(orig_staff_id), revoke_msg)

                # Record penalty entry in ticket's reassignment history
                history_entry = {
                    "worker_id": str(orig_worker_id),
                    "worker_name": orig_worker_name,
                    "staff_id": orig_staff_id,
                    "reason": "3-Min Acceptance SLA Missed",
                    "timestamp": now,
                }

                # 2. Candidate Selection: Exclude all previously tried workers
                already_tried: List[str] = [str(orig_worker_id), str(orig_staff_id)]
                for prev in ticket.get("reassigned_history", []):
                    if prev.get("worker_id"):
                        already_tried.append(str(prev["worker_id"]))
                    if prev.get("staff_id"):
                        already_tried.append(str(prev["staff_id"]))

                t_lat = float(ticket.get("lat", 28.6139))
                t_lng = float(ticket.get("lng", 77.2090))
                category = ticket.get("category") or ticket.get("required_department")
                block_name = ticket.get("block_name", "Block-B")
                floor = int(ticket.get("floor_number", 1))

                candidates = await recommend_smart_workers(
                    target_lat=t_lat,
                    target_lng=t_lng,
                    required_department=category,
                    target_block=block_name,
                    target_floor=floor,
                    exclude_worker_ids=already_tried,
                    limit=3,
                )

                if candidates:
                    new_worker = candidates[0]
                    new_accept_deadline = now + timedelta(seconds=settings.SLA_WORKER_ACCEPT_SECONDS)

                    reassign_step = {
                        "step_key": WorkorderStatus.VERIFIED_ASSIGNED.value,
                        "title": f"Re-assigned to {new_worker['name']}",
                        "description": f"Previous worker {orig_worker_name} missed 3-minute SLA. Auto re-assigned to {new_worker['name']} ({new_worker['match_percentage']}).",
                        "completed": True,
                        "timestamp": now,
                        "actor_name": "SLA Reassignment Engine",
                    }

                    await facility_workorders_col.update_one(
                        {"_id": ticket_id},
                        {
                            "$set": {
                                "assigned_worker_id": new_worker["worker_id"],
                                "assigned_worker_name": new_worker["name"],
                                "assigned_worker_staff_id": new_worker["staff_id"],
                                "assigned_worker_dept": new_worker["department"],
                                "assigned_worker_phone": new_worker["phone"],
                                "sla_accept_deadline": new_accept_deadline,
                                "sla_deadline": new_accept_deadline,
                                "updated_at": now,
                            },
                            "$push": {
                                "timeline_steps": reassign_step,
                                "reassigned_history": history_entry,
                            },
                        },
                    )

                    await users_col.update_one(
                        {"_id": ObjectId(new_worker["worker_id"])},
                        {"$inc": {"active_tasks_count": 1}},
                    )

                    # Send urgent task alert to new technician
                    new_task_msg = {
                        "type": "WORKORDER_DISPATCHED",
                        "data": {
                            "ticket_id": str(ticket_id),
                            "workorder_code": ticket.get("workorder_code"),
                            "title": ticket.get("title"),
                            "block_name": block_name,
                            "floor_number": floor,
                            "room_number": ticket.get("room_number"),
                            "category": category,
                            "instruction_hindi": ticket.get("instruction_hindi"),
                            "sla_seconds": settings.SLA_WORKER_ACCEPT_SECONDS,
                            "urgent_reassigned": True,
                        },
                    }
                    await ws_manager.send_to_user(new_worker["worker_id"], new_task_msg)
                    await ws_manager.send_to_user(new_worker["staff_id"], new_task_msg)

                    # Broadcast reassignment warning to Supervisor & Super Admin
                    reassign_alert = {
                        "type": "SLA_MISSED_REASSIGNED",
                        "data": {
                            "ticket_id": str(ticket_id),
                            "workorder_code": ticket.get("workorder_code"),
                            "room_number": ticket.get("room_number"),
                            "delinquent_worker": orig_worker_name,
                            "new_worker": new_worker["name"],
                        },
                    }
                    await ws_manager.broadcast_to_role(UserRole.FACILITY_SUPERVISOR.value, reassign_alert)
                    await ws_manager.broadcast_to_role(UserRole.SUPER_ADMIN.value, reassign_alert)

                    await log_audit_event(
                        event_type=AuditEventType.SLA_MISSED_REASSIGNED,
                        title=f"SLA Reassigned: {ticket.get('room_number')}",
                        description=f"Worker {orig_worker_name} timed out. Reassigned to {new_worker['name']}.",
                        actor_name="SLA Monitor",
                        actor_role=UserRole.SUPER_ADMIN,
                        target_id=str(ticket_id),
                        severity=AuditSeverity.WARNING,
                        metadata={"delinquent": orig_worker_name, "reassigned_to": new_worker["name"]},
                    )
                    logger.warning(f"[Tier 2 SLA Timeout] Ticket {ticket_id} transferred from {orig_worker_name} to {new_worker['name']}.")
                else:
                    # No available replacement worker -> Immediate Escalation
                    escalate_step = {
                        "step_key": WorkorderStatus.ESCALATED.value,
                        "title": "Escalated: No Available Replacement Worker",
                        "description": f"Worker {orig_worker_name} timed out and no alternative technicians are available. Escalated to Supervisor.",
                        "completed": True,
                        "timestamp": now,
                        "actor_name": "SLA Monitor",
                    }
                    await facility_workorders_col.update_one(
                        {"_id": ticket_id},
                        {
                            "$set": {"status": WorkorderStatus.ESCALATED.value, "updated_at": now},
                            "$push": {"timeline_steps": escalate_step, "reassigned_history": history_entry},
                        },
                    )

            # =================================================================
            # TIER 3: 10-MINUTE RESOLUTION ESCALATION TIMER
            # =================================================================
            # Escalate tickets unresolved after 10 minutes from creation
            tier3_threshold = now - timedelta(seconds=settings.SLA_ESCALATION_SECONDS)
            tier3_query = {
                "created_at": {"$lte": tier3_threshold},
                "status": {"$nin": [WorkorderStatus.RESOLVED.value, WorkorderStatus.ESCALATED.value]},
            }

            tickets_to_escalate = await facility_workorders_col.find(tier3_query).to_list(length=25)

            for ticket in tickets_to_escalate:
                ticket_id = ticket["_id"]
                critical_step = {
                    "step_key": WorkorderStatus.ESCALATED.value,
                    "title": "Critical 10-Minute SLA Breached",
                    "description": f"Ticket remained unresolved after {settings.SLA_ESCALATION_SECONDS}s window. Escalated directly to Facility Head & Super Admin.",
                    "completed": True,
                    "timestamp": now,
                    "actor_name": "SLA Escalation Engine",
                }

                await facility_workorders_col.update_one(
                    {"_id": ticket_id},
                    {
                        "$set": {
                            "status": WorkorderStatus.ESCALATED.value,
                            "updated_at": now,
                        },
                        "$push": {"timeline_steps": critical_step},
                    },
                )

                critical_payload = {
                    "type": "SLA_ESCALATED_CRITICAL",
                    "data": {
                        "ticket_id": str(ticket_id),
                        "workorder_code": ticket.get("workorder_code"),
                        "block_name": ticket.get("block_name"),
                        "room_number": ticket.get("room_number"),
                        "wasted_power_kw": ticket.get("wasted_power_kw", ticket.get("wasted_kw", 0.0)),
                        "assigned_worker_name": ticket.get("assigned_worker_name"),
                        "duration_minutes": 10,
                    },
                }

                await ws_manager.broadcast_to_role(UserRole.SUPER_ADMIN.value, critical_payload)
                await ws_manager.broadcast_to_role(UserRole.FACILITY_SUPERVISOR.value, critical_payload)

                await log_audit_event(
                    event_type=AuditEventType.SLA_ESCALATED,
                    title=f"Critical SLA Escalation: {ticket.get('room_number')}",
                    description=f"Ticket #{ticket.get('workorder_code')} breached 10-minute resolution SLA.",
                    actor_name="SLA Escalation Engine",
                    actor_role=UserRole.SUPER_ADMIN,
                    target_id=str(ticket_id),
                    severity=AuditSeverity.CRITICAL,
                    metadata={"ticket_id": str(ticket_id), "room": ticket.get("room_number")},
                )
                logger.error(f"[Tier 3 Escalation] Ticket {ticket_id} ({ticket.get('room_number')}) breached 10-minute SLA.")

            # Also check security incidents for unresolved critical alerts > 10m
            sec_escalate_query = {
                "created_at": {"$lte": tier3_threshold},
                "status": {"$nin": ["RESOLVED", "DISMISSED_FALSE_ALARM", "ESCALATED"]},
                "is_escalated": {"$ne": True},
            }
            sec_incidents = await security_incidents_col.find(sec_escalate_query).to_list(length=10)
            for inc in sec_incidents:
                inc_id = inc["_id"]
                await security_incidents_col.update_one(
                    {"_id": inc_id},
                    {"$set": {"is_escalated": True, "updated_at": now}},
                )
                sec_alert = {
                    "type": "SECURITY_INCIDENT_ESCALATED",
                    "data": {
                        "incident_id": str(inc_id),
                        "incident_code": inc.get("incident_code"),
                        "threat_type": inc.get("threat_type"),
                        "location_description": inc.get("location_description"),
                    },
                }
                await ws_manager.broadcast_to_role(UserRole.SUPER_ADMIN.value, sec_alert)
                await ws_manager.broadcast_to_role(UserRole.SECURITY_HEAD.value, sec_alert)

        except asyncio.CancelledError:
            logger.info("SLA Scheduler background task received cancellation signal.")
            break
        except Exception as exc:
            logger.error(f"Unexpected error in SLA scheduler execution loop: {exc}", exc_info=True)

        await asyncio.sleep(check_interval_seconds)
