import uuid
import logging
from datetime import datetime, date
from enum import Enum
from typing import Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.models.user import UserRole, DepartmentType, DutyState

logger = logging.getLogger("smart_campus.attendance")


class AuditSeverity(str, Enum):
    """Urgency / criticality level of system audit log entries."""
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    WARNING = "WARNING"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    SUCCESS = "SUCCESS"



class AuditEventType(str, Enum):
    """Exhaustive categorization for enterprise audit trail events."""
    SOS_TRIGGERED = "SOS_TRIGGERED"
    AI_THREAT_DETECTED = "AI_THREAT_DETECTED"
    GUARD_DISPATCHED = "GUARD_DISPATCHED"
    GHOST_ENERGY_DETECTED = "GHOST_ENERGY_DETECTED"
    GRIEVANCE_RAISED = "GRIEVANCE_RAISED"
    WORKER_DISPATCHED = "WORKER_DISPATCHED"
    SLA_MISSED_REASSIGNED = "SLA_MISSED_REASSIGNED"
    SLA_ESCALATED = "SLA_ESCALATED"
    ADMIN_GLOBAL_OVERRIDE = "ADMIN_GLOBAL_OVERRIDE"
    ATTENDANCE_CHANGED = "ATTENDANCE_CHANGED"
    TASK_RESOLVED = "TASK_RESOLVED"
    USER_LOGIN = "USER_LOGIN"
    SYSTEM_INITIALIZED = "SYSTEM_INITIALIZED"


class AttendanceRecord(BaseModel):
    """Daily staff duty and presence tracking document."""
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    staff_id: Optional[str] = None
    name: str
    role: UserRole
    department: Optional[DepartmentType] = None
    date_str: str = Field(default_factory=lambda: date.today().isoformat(), description="YYYY-MM-DD")
    date: Optional[str] = None  # Legacy alias
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    live_gps_zone: Optional[str] = Field(default=None, description="E.g., Block-B (Floor 2)")
    live_zone: Optional[str] = None  # Legacy alias
    lat: Optional[float] = None
    lng: Optional[float] = None
    current_state: DutyState = DutyState.ONLINE_FREE
    tasks_completed_count: int = 0
    tasks_completed: int = 0  # Legacy alias
    missed_sla_count: int = 0
    total_hours_worked: float = 0.0
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @model_validator(mode="before")
    @classmethod
    def sync_attendance_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "date_str" in values and "date" not in values:
                values["date"] = values["date_str"]
            elif "date" in values and "date_str" not in values:
                values["date_str"] = values["date"]

            if "live_gps_zone" in values and "live_zone" not in values:
                values["live_zone"] = values["live_gps_zone"]
            elif "live_zone" in values and "live_gps_zone" not in values:
                values["live_gps_zone"] = values["live_zone"]

            if "tasks_completed_count" in values and "tasks_completed" not in values:
                values["tasks_completed"] = values["tasks_completed_count"]
            elif "tasks_completed" in values and "tasks_completed_count" not in values:
                values["tasks_completed_count"] = values["tasks_completed"]
        return values

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)


# Backward compatibility aliases
AttendanceLedgerBase = AttendanceRecord
AttendanceLedgerInDB = AttendanceRecord
AttendanceLedgerResponse = AttendanceRecord


class AuditLogRecord(BaseModel):
    """System-wide immutable security, facility, and administrative audit event."""
    id: Optional[str] = Field(default=None, alias="_id")
    event_id: str = Field(default_factory=lambda: f"EVT-{uuid.uuid4().hex[:8].upper()}")
    event_type: Union[AuditEventType, str]
    severity: AuditSeverity = AuditSeverity.INFO
    title: str
    description: str
    actor_id: Optional[str] = None
    actor_name: str
    actor_role: Optional[UserRole] = None
    role: Optional[UserRole] = None  # Legacy alias
    target_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    @model_validator(mode="before")
    @classmethod
    def sync_audit_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "actor_role" in values and "role" not in values:
                values["role"] = values["actor_role"]
            elif "role" in values and "actor_role" not in values:
                values["actor_role"] = values["role"]
        return values

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)


# Backward compatibility aliases
AuditLogBase = AuditLogRecord
AuditLogInDB = AuditLogRecord
AuditLogResponse = AuditLogRecord


async def log_audit_event(
    event_type: Union[AuditEventType, str],
    title: str,
    description: str,
    actor_name: str,
    actor_id: Optional[str] = None,
    actor_role: Optional[UserRole] = None,
    target_id: Optional[str] = None,
    severity: AuditSeverity = AuditSeverity.INFO,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Persists an immutable audit log entry into the global_audit_logs collection.
    """
    from app.database import audit_logs_col, serialize_doc

    doc = {
        "event_id": f"EVT-{uuid.uuid4().hex[:8].upper()}",
        "event_type": str(event_type.value if hasattr(event_type, "value") else event_type),
        "severity": str(severity.value if hasattr(severity, "value") else severity),
        "title": title,
        "description": description,
        "actor_id": actor_id,
        "actor_name": actor_name,
        "actor_role": str(actor_role.value if hasattr(actor_role, "value") else actor_role) if actor_role else None,
        "role": str(actor_role.value if hasattr(actor_role, "value") else actor_role) if actor_role else None,
        "target_id": target_id,
        "metadata": metadata or {},
        "timestamp": datetime.utcnow(),
    }
    try:
        res = await audit_logs_col.insert_one(doc)
        doc["_id"] = res.inserted_id
        return serialize_doc(doc) or {}
    except Exception as exc:
        logger.error(f"Failed to record audit event: {exc}", exc_info=True)
        return doc
