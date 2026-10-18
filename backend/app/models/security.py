from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.models.user import GeoPoint


class SecurityThreatType(str, Enum):
    """Categorization of security alerts detected by AI vision or SOS triggers."""
    VIOLENCE_FIGHT = "VIOLENCE_FIGHT"
    OVERCROWDING = "OVERCROWDING"
    FIRE_SMOKE = "FIRE_SMOKE"
    PANIC_SOS = "PANIC_SOS"


# Backward compatibility alias
IncidentType = SecurityThreatType


class SecurityIncidentStatus(str, Enum):
    """Lifecycle stages for campus security alerts."""
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    DISMISSED_FALSE_ALARM = "DISMISSED_FALSE_ALARM"
    DISMISSED = "DISMISSED_FALSE_ALARM"  # Compatibility alias
    DISPATCHED = "DISPATCHED"
    GUARD_EN_ROUTE = "GUARD_EN_ROUTE"
    EN_ROUTE = "GUARD_EN_ROUTE"          # Compatibility alias
    BACKUP_REQUESTED = "BACKUP_REQUESTED"
    RESOLVED = "RESOLVED"


# Backward compatibility alias
IncidentStatus = SecurityIncidentStatus


class SecuritySeverity(str, Enum):
    """Urgency level of security incident."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


# Backward compatibility alias
IncidentSeverity = SecuritySeverity


class SOSTriggerRequest(BaseModel):
    """Payload sent by mobile student/faculty/guard triggering a Panic SOS."""
    lat: float
    lng: float
    block_name: Optional[str] = "Gate-2"
    floor_number: Optional[int] = 1
    emergency_type: str = "PANIC_SOS"
    message: Optional[str] = "Emergency Help Needed Immediately!"


class SimulateThreatRequest(BaseModel):
    """Payload to trigger synthetic AI Vision security detections for demonstrations."""
    threat_type: SecurityThreatType = SecurityThreatType.VIOLENCE_FIGHT
    block_name: str = "Gate-2"
    location_description: str = "Block-B Ground Corridor (Near Gate-2)"
    lat: float = 28.6140
    lng: float = 77.2091


class DispatchGuardRequest(BaseModel):
    """Payload to assign a primary security guard to an incident."""
    guard_id: Optional[str] = None
    notes: Optional[str] = None



class GuardResolveIncidentRequest(BaseModel):
    """Payload submitted by a field guard resolving the incident on-site."""
    proof_photo_base64: str = Field(..., description="Base64 encoded JPEG/PNG proof photo")
    resolution_note: Optional[str] = "Situation controlled and area cleared."


class RecommendedGuard(BaseModel):
    """Telemetry and calculated distance metrics for nearest security guards."""
    guard_id: str
    guard_name: str
    staff_id: Optional[str] = None
    phone: Optional[str] = None
    distance_meters: float
    duty_state: str = "ONLINE_FREE"
    current_block: Optional[str] = None
    current_floor: Optional[int] = None
    eta_seconds: Optional[int] = None

    model_config = ConfigDict(populate_by_name=True)


class SecurityTimelineStep(BaseModel):
    """Audit entry recording state changes in the incident lifecycle."""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: SecurityIncidentStatus
    actor_name: str
    notes: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


# Backward compatibility alias
IncidentTimelineItem = SecurityTimelineStep


class SecurityIncidentBase(BaseModel):
    """Base schema for security alerts."""
    incident_code: Optional[str] = None
    threat_type: SecurityThreatType = SecurityThreatType.VIOLENCE_FIGHT
    incident_type: Optional[SecurityThreatType] = None
    severity: SecuritySeverity = SecuritySeverity.HIGH
    status: SecurityIncidentStatus = SecurityIncidentStatus.PENDING_VERIFICATION
    block_name: str = "Gate-2"
    floor_number: int = 0
    location_name: Optional[str] = None
    location_description: str = "Corridor"
    lat: float
    lng: float
    camera_id: Optional[str] = None
    rtsp_url: Optional[str] = None
    preview_clip_url: Optional[str] = None
    ai_confidence: Optional[Union[float, str]] = 94.6
    multi_frame_verified: bool = True
    triggered_by_user: Optional[Dict[str, Any]] = None
    recommended_guards: List[Dict[str, Any]] = Field(default_factory=list)
    assigned_guard_id: Optional[str] = None
    assigned_guard_name: Optional[str] = None
    assigned_guard_Badge: Optional[str] = None
    assigned_guard_badge: Optional[str] = None
    assigned_guard_phone: Optional[str] = None
    backup_guards: List[Dict[str, Any]] = Field(default_factory=list)
    backup_guard_ids: List[str] = Field(default_factory=list)
    proof_photo_url: Optional[str] = None
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def sync_type_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "incident_type" in values and "threat_type" not in values:
                values["threat_type"] = values["incident_type"]
            elif "threat_type" in values and "incident_type" not in values:
                values["incident_type"] = values["threat_type"]
            if "location_description" in values and "location_name" not in values:
                values["location_name"] = values["location_description"]
            elif "location_name" in values and "location_description" not in values:
                values["location_description"] = values["location_name"]
            if "assigned_guard_Badge" in values and "assigned_guard_badge" not in values:
                values["assigned_guard_badge"] = values["assigned_guard_Badge"]
            elif "assigned_guard_badge" in values and "assigned_guard_Badge" not in values:
                values["assigned_guard_Badge"] = values["assigned_guard_badge"]
        return values


class SecurityIncidentCreate(SecurityIncidentBase):
    """Payload to trigger SOS or report an incident."""
    pass


class SecurityIncidentDocument(SecurityIncidentBase):
    """Complete MongoDB Security Incident Document."""
    id: Optional[str] = Field(default=None, alias="_id")
    location: Optional[GeoPoint] = None
    dispatched_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    timeline_steps: List[SecurityTimelineStep] = Field(default_factory=list)
    timeline: List[SecurityTimelineStep] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )


# Backward compatibility aliases
SecurityIncidentInDB = SecurityIncidentDocument


class SecurityIncidentResponse(SecurityIncidentBase):
    """Sanitized public response representation."""
    id: Optional[str] = Field(default=None, alias="_id")
    location: Optional[GeoPoint] = None
    dispatched_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    timeline_steps: List[SecurityTimelineStep] = Field(default_factory=list)
    timeline: List[SecurityTimelineStep] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)
