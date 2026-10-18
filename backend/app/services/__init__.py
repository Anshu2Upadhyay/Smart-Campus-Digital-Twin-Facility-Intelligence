"""
Smart Campus Digital Twin & Facility Intelligence Platform
Services & Asynchronous Real-Time Pipeline
"""

from app.services.gps_matcher import (
    haversine_distance_meters,
    detect_building_geofence,
    update_staff_live_gps,
    find_nearest_free_guards,
    recommend_smart_workers,
)
from app.services.websocket_manager import ws_manager, ConnectionManager
from app.services.sla_scheduler import run_sla_monitor
from app.services.vision_engine import vision_engine, CampusVisionEngine
from app.services.campus_gpt_rag import campus_rag, CampusGptRagEngine

__all__ = [
    "haversine_distance_meters",
    "detect_building_geofence",
    "update_staff_live_gps",
    "find_nearest_free_guards",
    "recommend_smart_workers",
    "ws_manager",
    "ConnectionManager",
    "run_sla_monitor",
    "vision_engine",
    "CampusVisionEngine",
    "campus_rag",
    "CampusGptRagEngine",
]
