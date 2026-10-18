from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.models.user import GeoPoint


class CameraTag(str, Enum):
    """Classification for surveillance & digital twin video streams."""
    INDOOR_FACILITY = "INDOOR_FACILITY"
    OUTDOOR_SECURITY = "OUTDOOR_SECURITY"


class RoomHealthStatus(str, Enum):
    """Real-time physical asset operational & energy status."""
    NORMAL = "NORMAL"
    GHOST_ENERGY_ALERT = "GHOST_ENERGY_ALERT"
    FAULT_REPORTED = "FAULT_REPORTED"
    MAINTENANCE_ACTIVE = "MAINTENANCE_ACTIVE"
    ALERT = "ALERT"  # Backward compatibility alias for GHOST_ENERGY_ALERT


# Backward compatibility alias
AssetStatus = RoomHealthStatus


class ApplianceItem(BaseModel):
    """Electrical appliance installed in a campus room or hall."""
    name: str = Field(..., description="E.g., Split AC, LED Tube Lights, Ceiling Fans, Smart Projector")
    count: int = Field(default=1, ge=0)
    power_rating_kw_total: float = Field(default=0.0, ge=0.0, description="Cumulative load in Kilowatts (kW)")
    kw: float = Field(default=0.0, ge=0.0, description="Alias for power_rating_kw_total")

    @model_validator(mode="before")
    @classmethod
    def sync_kw_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "power_rating_kw_total" in values and values["power_rating_kw_total"] > 0:
                values["kw"] = values["power_rating_kw_total"]
            elif "kw" in values and values["kw"] > 0:
                values["power_rating_kw_total"] = values["kw"]
        return values

    model_config = ConfigDict(populate_by_name=True)


class TimetableSlot(BaseModel):
    """Academic timetable scheduling slot for room occupancy verification."""
    day_of_week: str = Field(..., description="Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday")
    start_hour: int = Field(..., ge=0, le=23, description="24-hour format start hour")
    end_hour: int = Field(..., ge=0, le=23, description="24-hour format end hour")
    subject_or_event: str
    faculty_name: str
    is_lecture_scheduled: bool = True

    model_config = ConfigDict(populate_by_name=True)


class BlockAssetCreate(BaseModel):
    """Payload to register a campus building block with geofencing coordinates."""
    block_name: str = Field(..., description="E.g., Block-A, Block-B, Block-C, Library, Gate-1, Gate-2")
    gps_lat: float
    gps_lng: float
    radius_meters: float = 65.0
    total_floors: int = 3
    boundary_coordinates: Optional[List[List[float]]] = Field(
        default=None,
        description="GeoJSON Polygon ring [[lng, lat], ...] for building boundary geofencing"
    )


class BlockDocument(BaseModel):
    """MongoDB representation of a Campus Block."""
    id: Optional[str] = Field(default=None, alias="_id")
    block_name: str
    gps_lat: float
    gps_lng: float
    radius_meters: float = 65.0
    total_floors: int = 3
    center_location: Optional[GeoPoint] = None
    boundary_polygon: Optional[Dict[str, Any]] = None
    status: RoomHealthStatus = RoomHealthStatus.NORMAL
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)


class RoomBase(BaseModel):
    """Base schema for physical campus room or zone."""
    block_name: str
    room_number: str
    floor_number: int = 0
    gps_lat: float
    gps_lng: float
    room_type: str = Field(default="CLASSROOM", description="CLASSROOM, LAB, CORRIDOR, WASHROOM, GATE")
    appliances: List[ApplianceItem] = Field(default_factory=list)
    total_kw_rating: float = Field(default=0.0, ge=0.0)
    rtsp_url: str = Field(default="", description="CCTV RTSP/HLS stream URL")
    camera_tag: CameraTag = Field(default=CameraTag.INDOOR_FACILITY)
    seating_capacity: int = 60
    timetable_slots: List[TimetableSlot] = Field(default_factory=list)
    current_status: RoomHealthStatus = Field(default=RoomHealthStatus.NORMAL)

    @model_validator(mode="before")
    @classmethod
    def calculate_total_power(cls, values: Any) -> Any:
        if isinstance(values, dict):
            apps = values.get("appliances", [])
            total = 0.0
            for app in apps:
                if isinstance(app, dict):
                    kw_val = app.get("power_rating_kw_total") or app.get("kw", 0.0)
                    total += float(kw_val)
                elif hasattr(app, "power_rating_kw_total"):
                    total += float(app.power_rating_kw_total or app.kw or 0.0)
            if total > 0 and (not values.get("total_kw_rating") or values.get("total_kw_rating") == 0.0):
                values["total_kw_rating"] = round(total, 3)
        return values


class RoomAssetCreate(RoomBase):
    """Input payload to register or configure a room asset zone."""
    pass


# Backward compatibility alias
RoomCreate = RoomAssetCreate


class RoomInDB(RoomBase):
    """Complete Room document in MongoDB."""
    id: Optional[str] = Field(default=None, alias="_id")
    location: Optional[GeoPoint] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )


class RoomResponse(RoomBase):
    """Public representation of campus room asset."""
    id: Optional[str] = Field(default=None, alias="_id")
    location: Optional[GeoPoint] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


class BlockSummary(BaseModel):
    """High-level summary of campus blocks for digital twin 3D campus navigation."""
    block_name: str
    total_floors: int = 1
    total_rooms: int = 0
    gps_lat: float
    gps_lng: float
    status: RoomHealthStatus = RoomHealthStatus.NORMAL
