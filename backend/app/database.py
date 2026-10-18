import logging
from datetime import datetime, date
from typing import Any, Dict, List, Optional, Union
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import GEOSPHERE, ASCENDING, DESCENDING

from app.config import settings

logger = logging.getLogger("smart_campus.database")

# Initialize Motor AsyncIO Client & Database Connection Pool
client: AsyncIOMotorClient = AsyncIOMotorClient(
    settings.MONGODB_URL,
    maxPoolSize=100,
    minPoolSize=10,
    serverSelectionTimeoutMS=5000,
)
db: AsyncIOMotorDatabase = client[settings.DB_NAME]

# Core Exported MongoDB Collections
users_col = db["users"]
blocks_col = db["campus_blocks"]
rooms_col = db["campus_rooms"]
timetables_col = db["room_timetables"]
security_incidents_col = db["security_incidents"]
facility_workorders_col = db["facility_workorders"]
attendance_col = db["duty_attendance"]
audit_logs_col = db["global_audit_logs"]
campus_docs_col = db["campus_rag_documents"]
cameras_col = db["campus_cctv_cameras"]
spatial_layout_col = db["campus_spatial_layout"]

# Compatibility aliases for any legacy references
blocks = blocks_col
rooms = rooms_col


def _serialize_value(val: Any) -> Any:
    """Recursively formats MongoDB types into JSON-serializable primitives."""
    if isinstance(val, ObjectId):
        return str(val)
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    if isinstance(val, dict):
        return {k: _serialize_value(v) for k, v in val.items()}
    if isinstance(val, (list, tuple, set)):
        return [_serialize_value(item) for item in val]
    return val


def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Transforms MongoDB document into a clean, FastAPI-safe dictionary.
    Converts '_id' (ObjectId) into string 'id', and converts nested ObjectIds
    and datetimes to standard ISO strings.
    """
    if doc is None:
        return None

    cleaned: Dict[str, Any] = {}
    for key, value in doc.items():
        if key == "_id":
            cleaned["id"] = str(value)
        else:
            cleaned[key] = _serialize_value(value)

    if "id" not in cleaned and "_id" in doc:
        cleaned["id"] = str(doc["_id"])

    return cleaned


def serialize_list(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Serializes a list of MongoDB documents."""
    return [serialize_doc(doc) for doc in docs if doc is not None]


async def init_indexes() -> None:
    """
    Initializes critical database indexes including 2dsphere geospatial
    indexes, unique sparse identity indexes, and composite workflow indexes.
    """
    try:
        logger.info("Initializing MongoDB indexes across all campus collections...")

        # 1. users_col Indexes
        await users_col.create_index([("location", GEOSPHERE)], name="idx_users_location_2dsphere")
        await users_col.create_index("email", unique=True, sparse=True, name="idx_users_email_unique")
        await users_col.create_index("staff_id", unique=True, sparse=True, name="idx_users_staff_id_unique")
        await users_col.create_index("roll_or_emp_id", unique=True, sparse=True, name="idx_users_roll_unique")
        await users_col.create_index(
            [("role", ASCENDING), ("duty_state", ASCENDING), ("department", ASCENDING)],
            name="idx_users_role_duty_dept"
        )

        # 2. blocks_col Indexes
        await blocks_col.create_index([("boundary_polygon", GEOSPHERE)], name="idx_blocks_boundary_2dsphere")
        await blocks_col.create_index([("center_location", GEOSPHERE)], name="idx_blocks_center_2dsphere")
        await blocks_col.create_index("block_name", unique=True, name="idx_blocks_name_unique")

        # 3. rooms_col Indexes
        await rooms_col.create_index(
            [("block_name", ASCENDING), ("floor_number", ASCENDING), ("room_number", ASCENDING)],
            unique=True,
            name="idx_rooms_block_floor_room_unique"
        )
        await rooms_col.create_index([("location", GEOSPHERE)], name="idx_rooms_location_2dsphere")
        await rooms_col.create_index("camera_tag", name="idx_rooms_camera_tag")

        # 4. timetables_col Indexes
        await timetables_col.create_index(
            [("block_name", ASCENDING), ("room_number", ASCENDING), ("day_of_week", ASCENDING)],
            name="idx_timetables_room_day"
        )

        # 5. security_incidents_col Indexes
        await security_incidents_col.create_index(
            [("status", ASCENDING), ("created_at", DESCENDING)],
            name="idx_security_status_created"
        )
        await security_incidents_col.create_index([("location", GEOSPHERE)], name="idx_security_location_2dsphere")
        await security_incidents_col.create_index("incident_code", sparse=True, name="idx_security_incident_code")

        # 6. facility_workorders_col Indexes
        await facility_workorders_col.create_index(
            [("status", ASCENDING), ("sla_deadline", ASCENDING)],
            name="idx_facility_status_sla"
        )
        await facility_workorders_col.create_index(
            [("assigned_worker_id", ASCENDING), ("status", ASCENDING)],
            name="idx_facility_assigned_worker_status"
        )
        await facility_workorders_col.create_index([("location", GEOSPHERE)], name="idx_facility_location_2dsphere")
        await facility_workorders_col.create_index("workorder_code", sparse=True, name="idx_facility_workorder_code")

        # 7. attendance_col Indexes
        await attendance_col.create_index(
            [("user_id", ASCENDING), ("date_str", ASCENDING)],
            name="idx_attendance_user_datestr"
        )
        await attendance_col.create_index(
            [("user_id", ASCENDING), ("date", ASCENDING)],
            name="idx_attendance_user_date_legacy"
        )

        # 8. audit_logs_col Indexes
        await audit_logs_col.create_index([("timestamp", DESCENDING)], name="idx_audit_logs_timestamp")
        await audit_logs_col.create_index("event_type", name="idx_audit_logs_event_type")

        # 9. campus_docs_col Indexes
        await campus_docs_col.create_index("doc_id", sparse=True, name="idx_campus_docs_doc_id")

        logger.info("All MongoDB indexes successfully synchronized and verified.")
    except Exception as exc:
        logger.error(f"Error while synchronizing database indexes: {exc}", exc_info=True)
        # Non-fatal during rapid development restarts, but logged with full context


async def close_database() -> None:
    """Closes MongoDB connection pool gracefully."""
    client.close()
    logger.info("MongoDB client connections closed.")
