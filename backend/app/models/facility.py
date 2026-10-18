from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.models.user import GeoPoint


class WorkorderSource(str, Enum):
    """Source that initiated the facility maintenance ticket."""
    AI_GHOST_ENERGY = "AI_GHOST_ENERGY"
    USER_GRIEVANCE = "USER_GRIEVANCE"


# Backward compatibility alias
TicketSource = WorkorderSource


class FacilityCategory(str, Enum):
    """Maintenance category mapped directly to ground worker trade departments."""
    ELECTRICAL = "ELECTRICAL"
    HVAC_AC = "HVAC_AC"
    PLUMBING = "PLUMBING"
    HOUSEKEEPING = "HOUSEKEEPING"
    IT_AV = "IT_AV"
    CIVIL_CARPENTRY = "CIVIL_CARPENTRY"


class WorkorderStatus(str, Enum):
    """Lifecycle stages for facility tickets & energy waste interventions."""
    SUBMITTED = "SUBMITTED"
    VERIFIED_ASSIGNED = "VERIFIED_ASSIGNED"
    WORKER_EN_ROUTE = "WORKER_EN_ROUTE"
    RESOLVED = "RESOLVED"
    ESCALATED = "ESCALATED"


# Backward compatibility alias
WorkOrderStatus = WorkorderStatus


class TimelineStep(BaseModel):
    """Swiggy-style 4-step status tracker progression entry."""
    step_key: str = Field(..., description="SUBMITTED, VERIFIED_ASSIGNED, WORKER_EN_ROUTE, RESOLVED")
    title: str = Field(..., description="Step label displayed on UI")
    description: Optional[str] = None
    completed: bool = False
    timestamp: Optional[datetime] = None
    actor_name: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class RaiseComplaintRequest(BaseModel):
    """Grievance report submitted by student or faculty member."""
    category: FacilityCategory
    block_name: str
    floor_number: int
    room_number: str
    title: str
    description: str
    complaint_photo_base64: Optional[str] = None


class SimulateGhostEnergyRequest(BaseModel):
    """Payload to trigger synthetic Ghost Energy wastage detection."""
    block_name: str = "Block-B"
    floor_number: int = 2
    room_number: str = "Room 204"


class DispatchWorkerRequest(BaseModel):
    """Supervisor manual dispatch action."""
    worker_id: str
    supervisor_note: Optional[str] = None


class WorkerResolveTaskRequest(BaseModel):
    """Worker on-site completion proof submission."""
    proof_photo_base64: str = Field(..., description="Base64 encoded JPEG/PNG image")
    resolution_note: Optional[str] = "Appliances switched off from main board / Fault repaired."


class RecommendedWorker(BaseModel):
    """Smart Recommendation Engine candidate scoring details."""
    worker_id: str
    worker_name: str
    staff_id: str
    department: str
    phone: Optional[str] = None
    distance_meters: float
    current_block: str
    current_floor: int
    match_score: float = 95.0
    active_tasks: int = 0
    eta_seconds: Optional[int] = None

    model_config = ConfigDict(populate_by_name=True)


class FacilityWorkOrderBase(BaseModel):
    """Base schema for facility maintenance tickets."""
    workorder_code: Optional[str] = None
    source: WorkorderSource = WorkorderSource.AI_GHOST_ENERGY
    ticket_source: Optional[WorkorderSource] = None
    category: FacilityCategory = FacilityCategory.ELECTRICAL
    required_department: Optional[FacilityCategory] = None
    status: WorkorderStatus = WorkorderStatus.SUBMITTED
    block_name: str = "Block-B"
    floor_number: int = 0
    room_number: str = "Room 204"
    lat: float = 28.6139
    lng: float = 77.2090
    title: str = "Facility Maintenance Request"
    description: str = "Maintenance issue reported."
    instruction_hindi: Optional[str] = None
    wasted_power_kw: float = 0.0
    wasted_kw: float = 0.0
    vacant_duration_minutes: int = 0
    cctv_verification_data: Optional[Dict[str, Any]] = None
    reported_by_user: Optional[Dict[str, Any]] = None
    complaint_photo_url: Optional[str] = None
    recommended_workers: List[Dict[str, Any]] = Field(default_factory=list)
    assigned_worker_id: Optional[str] = None
    assigned_worker_name: Optional[str] = None
    assigned_worker_staff_id: Optional[str] = None
    assigned_worker_dept: Optional[str] = None
    assigned_worker_phone: Optional[str] = None
    supervisor_autopilot_deadline: Optional[datetime] = None
    sla_accept_deadline: Optional[datetime] = None
    sla_deadline: Optional[datetime] = None
    sla_resolve_deadline: Optional[datetime] = None
    reassigned_history: List[Dict[str, Any]] = Field(default_factory=list)
    proof_photo_url: Optional[str] = None
    post_close_cctv_verified: bool = False
    post_close_luminance: Optional[float] = None
    energy_saved_kwh: float = 0.0
    money_saved_rupees: float = 0.0
    rupees_saved: float = 0.0

    @model_validator(mode="before")
    @classmethod
    def sync_facility_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "ticket_source" in values and "source" not in values:
                values["source"] = values["ticket_source"]
            elif "source" in values and "ticket_source" not in values:
                values["ticket_source"] = values["source"]

            if "category" in values and "required_department" not in values:
                values["required_department"] = values["category"]
            elif "required_department" in values and "category" not in values:
                values["category"] = values["required_department"]

            if "wasted_power_kw" in values and values["wasted_power_kw"] > 0 and (not values.get("wasted_kw")):
                values["wasted_kw"] = values["wasted_power_kw"]
            elif "wasted_kw" in values and values["wasted_kw"] > 0 and (not values.get("wasted_power_kw")):
                values["wasted_power_kw"] = values["wasted_kw"]

            if "money_saved_rupees" in values and values["money_saved_rupees"] > 0 and (not values.get("rupees_saved")):
                values["rupees_saved"] = values["money_saved_rupees"]
            elif "rupees_saved" in values and values["rupees_saved"] > 0 and (not values.get("money_saved_rupees")):
                values["money_saved_rupees"] = values["rupees_saved"]

            if "sla_deadline" in values and (not values.get("sla_resolve_deadline")):
                values["sla_resolve_deadline"] = values["sla_deadline"]
            elif "sla_resolve_deadline" in values and (not values.get("sla_deadline")):
                values["sla_deadline"] = values["sla_resolve_deadline"]
        return values


class FacilityWorkOrderCreate(FacilityWorkOrderBase):
    """Payload to create a new ticket or log ghost energy alert."""
    pass


class FacilityWorkorderDocument(FacilityWorkOrderBase):
    """Complete MongoDB Facility Work Order Document."""
    id: Optional[str] = Field(default=None, alias="_id")
    location: Optional[GeoPoint] = None
    timeline_steps: List[TimelineStep] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    dispatched_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )


# Backward compatibility aliases
FacilityWorkOrderInDB = FacilityWorkorderDocument


class FacilityWorkOrderResponse(FacilityWorkOrderBase):
    """Sanitized public response representation."""
    id: Optional[str] = Field(default=None, alias="_id")
    location: Optional[GeoPoint] = None
    timeline_steps: List[TimelineStep] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    dispatched_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)
