from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.campus import ApplianceItem, CameraTag, RoomHealthStatus


class SpatialRoom(BaseModel):
    """Spatial room footprint on a 2D floor-plan with appliances & virtual meters."""
    room_number: str = Field(..., description="E.g., 201, 204, Lab 101, Auditorium")
    room_type: str = Field(default="CLASSROOM", description="CLASSROOM, LAB, OFFICE, CORRIDOR, WASHROOM, AUDITORIUM, GATE")
    x: float = Field(default=50.0, description="X coordinate on 2D canvas (pixels or %)")
    y: float = Field(default=50.0, description="Y coordinate on 2D canvas (pixels or %)")
    width: float = Field(default=160.0, description="Width in canvas units")
    height: float = Field(default=120.0, description="Height in canvas units")
    color: Optional[str] = Field(default=None, description="Hex color or theme accent")
    seating_capacity: int = Field(default=50, ge=0)
    appliances: List[ApplianceItem] = Field(default_factory=list, description="Installed electrical appliances")
    total_kw: float = Field(default=0.0, ge=0.0, description="Calculated virtual load rating")
    status: str = Field(default="NORMAL", description="NORMAL, GHOST_ENERGY_ALERT, MAINTENANCE, ALERT")
    cctv_ids: List[str] = Field(default_factory=list, description="IDs of CCTV cameras monitoring this room")

    model_config = ConfigDict(populate_by_name=True)


class SpatialCamera(BaseModel):
    """CCTV Surveillance Camera plotted on spatial 2D/3D map with RTSP stream."""
    camera_id: str = Field(..., description="E.g., CAM-B-204, CAM-01")
    name: str = Field(..., description="Camera label e.g., Room 204 Main Angle")
    room_number: Optional[str] = Field(default=None)
    x: float = Field(default=100.0, description="X coordinate on floor canvas")
    y: float = Field(default=100.0, description="Y coordinate on floor canvas")
    angle: float = Field(default=45.0, description="Field of view rotation angle (0-360 deg)")
    fov: float = Field(default=75.0, description="Field of view spread in degrees")
    rtsp_url: str = Field(..., description="rtsp:// or http:// video stream URL")
    detection_mode: str = Field(default="GENERAL", description="VIOLENCE_FIGHT, OVERCROWDING, INTRUSION, GENERAL, GHOST_LOAD")
    status: str = Field(default="ONLINE", description="ONLINE, ALERT, OFFLINE")
    fps: int = Field(default=30)
    resolution: str = Field(default="1920x1080 (1080p)")

    model_config = ConfigDict(populate_by_name=True)


class SpatialFloor(BaseModel):
    """Building floor container with spatial canvas dimensions, rooms & cameras."""
    floor_number: int = Field(..., ge=0, description="0 = Ground, 1 = 1st Floor, 2 = 2nd Floor, etc.")
    name: str = Field(default="Ground Floor")
    width: float = Field(default=1000.0)
    height: float = Field(default=600.0)
    rooms: List[SpatialRoom] = Field(default_factory=list)
    cameras: List[SpatialCamera] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class SpatialBlock(BaseModel):
    """Building block structure in Campus Digital Twin."""
    block_name: str = Field(..., description="E.g., Block-A, Block-B, Library, Hostels, Admin Block")
    gps_lat: float = Field(default=28.6139)
    gps_lng: float = Field(default=77.2090)
    total_floors: int = Field(default=3, ge=1)
    floors: List[SpatialFloor] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class CampusSpatialLayout(BaseModel):
    """Master Campus Hierarchical Spatial Digital Twin Schema."""
    id: Optional[str] = Field(default=None, alias="_id")
    campus_name: str = Field(default="Smart Campus Digital Twin (Main Campus)")
    center_gps: Dict[str, float] = Field(default_factory=lambda: {"lat": 28.6139, "lng": 77.2090})
    blocks: List[SpatialBlock] = Field(default_factory=list)
    version: int = Field(default=1)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)
