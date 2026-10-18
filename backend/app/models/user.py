from datetime import datetime
from enum import Enum
from typing import List, Optional, Literal, Union
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class UserRole(str, Enum):
    """System-wide user roles with differentiated privileges."""
    SUPER_ADMIN = "SUPER_ADMIN"
    SECURITY_HEAD = "SECURITY_HEAD"
    SECURITY_GUARD = "SECURITY_GUARD"
    FACILITY_SUPERVISOR = "FACILITY_SUPERVISOR"
    GROUND_WORKER = "GROUND_WORKER"
    STUDENT_FACULTY = "STUDENT_FACULTY"


class DepartmentType(str, Enum):
    """Ground worker trades, security wings, academic, and administration departments."""
    ADMINISTRATION = "ADMINISTRATION"
    SECURITY = "SECURITY"
    ELECTRICAL = "ELECTRICAL"
    HVAC_AC = "HVAC_AC"
    PLUMBING = "PLUMBING"
    HOUSEKEEPING = "HOUSEKEEPING"
    IT_AV = "IT_AV"
    CIVIL_CARPENTRY = "CIVIL_CARPENTRY"
    ACADEMIC = "ACADEMIC"
    GENERAL = "GENERAL"


# Backward compatibility alias
Department = DepartmentType


class DutyState(str, Enum):
    """Field operational status for guards and ground maintenance technicians."""
    ONLINE_FREE = "ONLINE_FREE"
    BUSY_ON_TASK = "BUSY_ON_TASK"
    ON_BREAK = "ON_BREAK"
    OFF_DUTY = "OFF_DUTY"


class GeoPoint(BaseModel):
    """
    Standard MongoDB GeoJSON Point format.
    Coordinates must be in [longitude, latitude] order.
    """
    type: Literal["Point"] = "Point"
    coordinates: List[float] = Field(..., description="[longitude, latitude]")

    model_config = ConfigDict(populate_by_name=True)


class OfficialLoginRequest(BaseModel):
    """Credentials for Official Web Portal Login (Admin, Heads, Faculty, Students)."""
    identifier: str = Field(..., description="Email, Student Roll No, or Employee ID")
    password: str = Field(..., min_length=4)


class StaffPinLoginRequest(BaseModel):
    """Fast 4-Digit PIN Authentication for Field Guards and Ground Technicians."""
    identifier: str = Field(..., description="Staff ID (e.g., SEC-101, WRK-201) or Registered Phone Number")
    pin: str = Field(..., min_length=4, max_length=6, description="4-Digit numeric PIN")


class CreateHeadRequest(BaseModel):
    """Request payload to register a departmental head/supervisor."""
    name: str
    email: EmailStr
    phone: str
    password: str
    role: Literal["SECURITY_HEAD", "FACILITY_SUPERVISOR"]
    department: str = "ADMINISTRATION"
    allowed_cameras: Optional[List[str]] = Field(default_factory=list, description="Permitted camera IDs for this head. If empty or contains 'ALL', full access.")


class CreateGuardRequest(BaseModel):
    """Request payload to onboard a security guard."""
    name: str
    phone: str
    staff_id: str = Field(..., description="E.g., SEC-101")
    default_gate: str = "Gate-2"
    pin: str = Field(default="1111", min_length=4, max_length=4)
    lat: float = 28.6139
    lng: float = 77.2090


class CreateWorkerRequest(BaseModel):
    """Request payload to onboard a ground maintenance technician."""
    name: str
    phone: str
    staff_id: str = Field(..., description="E.g., WRK-201")
    department: Literal["ELECTRICAL", "HVAC_AC", "PLUMBING", "HOUSEKEEPING", "IT_AV", "CIVIL_CARPENTRY"]
    pin: str = Field(default="2222", min_length=4, max_length=4)
    current_block: str = "Block-B"
    current_floor: int = 1
    lat: float = 28.6139
    lng: float = 77.2090


class GPSPingRequest(BaseModel):
    """Live GPS location heartbeat from Mobile Staff Application."""
    lat: float
    lng: float
    accuracy: float = 5.0
    floor_number: Optional[int] = None


class DutyStateUpdateRequest(BaseModel):
    """Quick toggle for operational duty state."""
    duty_state: DutyState
    floor_number: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class UserLocation(BaseModel):
    """Detailed operational telemetry and indoor tracking metrics."""
    location: Optional[GeoPoint] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    current_block: Optional[str] = None
    current_floor: Optional[int] = None
    accuracy: Optional[float] = None
    last_gps_ping: Optional[datetime] = None
    active_tasks_count: int = 0
    missed_alerts_count: int = 0
    tasks_completed_today: int = 0


class UserBase(BaseModel):
    """Core attributes for campus user identity."""
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole
    department: Optional[DepartmentType] = DepartmentType.GENERAL
    staff_id: Optional[str] = None
    roll_or_emp_id: Optional[str] = None
    default_gate: Optional[str] = None
    duty_state: DutyState = DutyState.OFF_DUTY
    current_block: Optional[str] = None
    current_floor: Optional[int] = None
    avatar_url: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    """Payload for creating/seeding a user in the system."""
    password: Optional[str] = None
    pin: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    location: Optional[GeoPoint] = None


class UserInDB(UserBase):
    """Complete representation of a user document in MongoDB."""
    id: Optional[str] = Field(default=None, alias="_id")
    password_hash: Optional[str] = None
    hashed_password: Optional[str] = None
    pin_hash: Optional[str] = None
    demo_plain_secret: Optional[str] = Field(default=None, description="Plaintext secret for demo UI helper cards")
    pin_demo_ref: Optional[str] = Field(default=None, description="Legacy alias for demo PIN reference")
    location: Optional[GeoPoint] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    gps_accuracy: Optional[float] = None
    accuracy: Optional[float] = None
    last_gps_ping: Optional[datetime] = None
    active_tasks_count: int = 0
    tasks_completed_today: int = 0
    missed_alerts_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )


class UserResponse(UserBase):
    """Sanitized public representation of user excluding password hashes."""
    id: Optional[str] = Field(default=None, alias="_id")
    demo_plain_secret: Optional[str] = None
    pin_demo_ref: Optional[str] = None
    location: Optional[GeoPoint] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    gps_accuracy: Optional[float] = None
    accuracy: Optional[float] = None
    last_gps_ping: Optional[datetime] = None
    active_tasks_count: int = 0
    tasks_completed_today: int = 0
    missed_alerts_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


class TokenResponse(BaseModel):
    """JWT Bearer authentication token payload."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
