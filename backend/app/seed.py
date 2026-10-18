import logging
import uuid
import bcrypt
from datetime import datetime, timedelta, date
from typing import Dict, Any, List

from app.database import (
    users_col,
    blocks_col,
    rooms_col,
    security_incidents_col,
    facility_workorders_col,
    attendance_col,
    audit_logs_col,
)
from app.models.user import UserRole, DepartmentType, DutyState
from app.models.campus import CameraTag, RoomHealthStatus
from app.models.security import SecurityThreatType, SecurityIncidentStatus, SecuritySeverity
from app.models.facility import WorkorderSource, FacilityCategory, WorkorderStatus
from app.models.attendance import AuditSeverity, AuditEventType

logger = logging.getLogger("smart_campus.seed")


def hash_secret(secret: str) -> str:
    """Hash password or PIN securely using standard bcrypt."""
    try:
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(secret.encode("utf-8"), salt).decode("utf-8")
    except Exception:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.hash(secret)


def verify_secret(plain_secret: str, hashed: str) -> bool:
    """Verify password or PIN against bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_secret.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_secret, hashed)


async def seed_initial_data() -> Dict[str, Any]:
    """
    Production database seeder:
    Seeds official accounts, guards, workers, campus blocks with GeoJSON polygons,
    rooms with virtual appliance power meters, initial live incidents, work orders,
    staff attendance roll-call, and system audit logs.
    """
    results: Dict[str, int] = {
        "official_users_seeded": 0,
        "guards_seeded": 0,
        "workers_seeded": 0,
        "blocks_seeded": 0,
        "rooms_seeded": 0,
        "security_incidents_seeded": 0,
        "facility_workorders_seeded": 0,
        "attendance_seeded": 0,
        "audit_logs_seeded": 0,
    }

    now = datetime.utcnow()
    today_str = date.today().isoformat()

    # =========================================================================
    # 1. OFFICIAL PORTAL ACCOUNTS (Admin, Security Head, Facility Head, Student, Faculty)
    # =========================================================================
    official_users = [
        {
            "name": "Rajeshwar Admin",
            "email": "admin@campus.edu",
            "phone": "9876500000",
            "role": UserRole.SUPER_ADMIN.value,
            "department": DepartmentType.ADMINISTRATION.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "password_hash": hash_secret("Admin@123"),
            "hashed_password": hash_secret("Admin@123"),
            "demo_plain_secret": "Admin@123",
            "pin_demo_ref": "Admin@123",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Col. Pratap Singh",
            "email": "security.head@campus.edu",
            "phone": "9876500002",
            "role": UserRole.SECURITY_HEAD.value,
            "department": DepartmentType.SECURITY.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "password_hash": hash_secret("SecHead@123"),
            "hashed_password": hash_secret("SecHead@123"),
            "demo_plain_secret": "SecHead@123",
            "pin_demo_ref": "SecHead@123",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Er. Manish Verma",
            "email": "facility.head@campus.edu",
            "phone": "9876500003",
            "role": UserRole.FACILITY_SUPERVISOR.value,
            "department": DepartmentType.ADMINISTRATION.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "password_hash": hash_secret("FacHead@123"),
            "hashed_password": hash_secret("FacHead@123"),
            "demo_plain_secret": "FacHead@123",
            "pin_demo_ref": "FacHead@123",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Rahul Sharma (B.Tech CSE 3rd Yr)",
            "email": "rahul@campus.edu",
            "roll_or_emp_id": "STU-2026-001",
            "phone": "9876500001",
            "role": UserRole.STUDENT_FACULTY.value,
            "department": DepartmentType.ACADEMIC.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "password_hash": hash_secret("Student@123"),
            "hashed_password": hash_secret("Student@123"),
            "demo_plain_secret": "Student@123",
            "pin_demo_ref": "Student@123",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Prof. Neha Gupta (HOD Electronics)",
            "email": "neha@campus.edu",
            "roll_or_emp_id": "EMP-2026-101",
            "phone": "9876500101",
            "role": UserRole.STUDENT_FACULTY.value,
            "department": DepartmentType.ACADEMIC.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "password_hash": hash_secret("Faculty@123"),
            "hashed_password": hash_secret("Faculty@123"),
            "demo_plain_secret": "Faculty@123",
            "pin_demo_ref": "Faculty@123",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
    ]

    for user in official_users:
        existing = await users_col.find_one({"email": user["email"]})
        if not existing:
            await users_col.insert_one(user)
            results["official_users_seeded"] += 1

    # =========================================================================
    # 2. FIELD SECURITY GUARDS (4-Digit PIN: 1111)
    # =========================================================================
    guards = [
        {
            "staff_id": "SEC-101",
            "name": "Vikram Singh",
            "phone": "9876543101",
            "role": UserRole.SECURITY_GUARD.value,
            "department": DepartmentType.SECURITY.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "pin_hash": hash_secret("1111"),
            "demo_plain_secret": "1111",
            "pin_demo_ref": "1111",
            "default_gate": "Gate-2 (Block-B Corridor)",
            "current_block": "Gate-2 Corridor",
            "current_floor": 0,
            "lat": 28.61405,
            "lng": 77.20912,
            "gps_accuracy": 3.5,
            "accuracy": 3.5,
            "location": {
                "type": "Point",
                "coordinates": [77.20912, 28.61405]  # [lng, lat]
            },
            "last_gps_ping": now,
            "active_tasks_count": 0,
            "tasks_completed_today": 3,
            "missed_alerts_count": 0,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "staff_id": "SEC-104",
            "name": "Rajesh Kumar",
            "phone": "9876543104",
            "role": UserRole.SECURITY_GUARD.value,
            "department": DepartmentType.SECURITY.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "pin_hash": hash_secret("1111"),
            "demo_plain_secret": "1111",
            "pin_demo_ref": "1111",
            "default_gate": "Block-A Quadrangle",
            "current_block": "Block-A",
            "current_floor": 1,
            "lat": 28.61320,
            "lng": 77.20820,
            "gps_accuracy": 4.0,
            "accuracy": 4.0,
            "location": {
                "type": "Point",
                "coordinates": [77.20820, 28.61320]
            },
            "last_gps_ping": now,
            "active_tasks_count": 0,
            "tasks_completed_today": 2,
            "missed_alerts_count": 0,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "staff_id": "SEC-102",
            "name": "Sandeep Tiwari",
            "phone": "9876543102",
            "role": UserRole.SECURITY_GUARD.value,
            "department": DepartmentType.SECURITY.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "pin_hash": hash_secret("1111"),
            "demo_plain_secret": "1111",
            "pin_demo_ref": "1111",
            "default_gate": "Main Gate-1",
            "current_block": "Gate-1",
            "current_floor": 0,
            "lat": 28.61260,
            "lng": 77.20750,
            "gps_accuracy": 4.5,
            "accuracy": 4.5,
            "location": {
                "type": "Point",
                "coordinates": [77.20750, 28.61260]
            },
            "last_gps_ping": now,
            "active_tasks_count": 0,
            "tasks_completed_today": 1,
            "missed_alerts_count": 0,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
    ]

    guard_id_map: Dict[str, str] = {}
    for guard in guards:
        existing = await users_col.find_one({"staff_id": guard["staff_id"]})
        if not existing:
            res = await users_col.insert_one(guard)
            guard_id_map[guard["staff_id"]] = str(res.inserted_id)
            results["guards_seeded"] += 1
        else:
            guard_id_map[guard["staff_id"]] = str(existing["_id"])

    # =========================================================================
    # 3. GROUND WORKERS (All 6 Departments, 4-Digit PIN: 2222)
    # =========================================================================
    workers = [
        {
            "staff_id": "WRK-201",
            "name": "Ramesh Kumar",
            "phone": "9876543201",
            "role": UserRole.GROUND_WORKER.value,
            "department": DepartmentType.HOUSEKEEPING.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "pin_hash": hash_secret("2222"),
            "demo_plain_secret": "2222",
            "pin_demo_ref": "2222",
            "current_block": "Block-B",
            "current_floor": 2,
            "lat": 28.61395,
            "lng": 77.20905,
            "gps_accuracy": 3.0,
            "accuracy": 3.0,
            "location": {
                "type": "Point",
                "coordinates": [77.20905, 28.61395]
            },
            "last_gps_ping": now,
            "active_tasks_count": 0,
            "tasks_completed_today": 4,
            "missed_alerts_count": 0,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "staff_id": "WRK-202",
            "name": "Amit Patel",
            "phone": "9876543202",
            "role": UserRole.GROUND_WORKER.value,
            "department": DepartmentType.ELECTRICAL.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "pin_hash": hash_secret("2222"),
            "demo_plain_secret": "2222",
            "pin_demo_ref": "2222",
            "current_block": "Block-A",
            "current_floor": 1,
            "lat": 28.61345,
            "lng": 77.20845,
            "gps_accuracy": 3.5,
            "accuracy": 3.5,
            "location": {
                "type": "Point",
                "coordinates": [77.20845, 28.61345]
            },
            "last_gps_ping": now,
            "active_tasks_count": 0,
            "tasks_completed_today": 2,
            "missed_alerts_count": 0,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "staff_id": "WRK-203",
            "name": "Suresh Yadav",
            "phone": "9876543203",
            "role": UserRole.GROUND_WORKER.value,
            "department": DepartmentType.HVAC_AC.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "pin_hash": hash_secret("2222"),
            "demo_plain_secret": "2222",
            "pin_demo_ref": "2222",
            "current_block": "Block-B",
            "current_floor": 1,
            "lat": 28.61410,
            "lng": 77.20918,
            "gps_accuracy": 4.0,
            "accuracy": 4.0,
            "location": {
                "type": "Point",
                "coordinates": [77.20918, 28.61410]
            },
            "last_gps_ping": now,
            "active_tasks_count": 0,
            "tasks_completed_today": 5,
            "missed_alerts_count": 0,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "staff_id": "WRK-204",
            "name": "Deepak Verma",
            "phone": "9876543204",
            "role": UserRole.GROUND_WORKER.value,
            "department": DepartmentType.PLUMBING.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "pin_hash": hash_secret("2222"),
            "demo_plain_secret": "2222",
            "pin_demo_ref": "2222",
            "current_block": "Block-C",
            "current_floor": 2,
            "lat": 28.61455,
            "lng": 77.20955,
            "gps_accuracy": 4.5,
            "accuracy": 4.5,
            "location": {
                "type": "Point",
                "coordinates": [77.20955, 28.61455]
            },
            "last_gps_ping": now,
            "active_tasks_count": 0,
            "tasks_completed_today": 1,
            "missed_alerts_count": 0,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "staff_id": "WRK-205",
            "name": "Karan Nair",
            "phone": "9876543205",
            "role": UserRole.GROUND_WORKER.value,
            "department": DepartmentType.IT_AV.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "pin_hash": hash_secret("2222"),
            "demo_plain_secret": "2222",
            "pin_demo_ref": "2222",
            "current_block": "Block-A",
            "current_floor": 1,
            "lat": 28.61355,
            "lng": 77.20855,
            "gps_accuracy": 3.0,
            "accuracy": 3.0,
            "location": {
                "type": "Point",
                "coordinates": [77.20855, 28.61355]
            },
            "last_gps_ping": now,
            "active_tasks_count": 1,
            "tasks_completed_today": 3,
            "missed_alerts_count": 0,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "staff_id": "WRK-206",
            "name": "Manoj Mistri",
            "phone": "9876543206",
            "role": UserRole.GROUND_WORKER.value,
            "department": DepartmentType.CIVIL_CARPENTRY.value,
            "duty_state": DutyState.ONLINE_FREE.value,
            "pin_hash": hash_secret("2222"),
            "demo_plain_secret": "2222",
            "pin_demo_ref": "2222",
            "current_block": "Block-C",
            "current_floor": 1,
            "lat": 28.61465,
            "lng": 77.20965,
            "gps_accuracy": 4.0,
            "accuracy": 4.0,
            "location": {
                "type": "Point",
                "coordinates": [77.20965, 28.61465]
            },
            "last_gps_ping": now,
            "active_tasks_count": 0,
            "tasks_completed_today": 2,
            "missed_alerts_count": 0,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
    ]

    worker_id_map: Dict[str, str] = {}
    for worker in workers:
        existing = await users_col.find_one({"staff_id": worker["staff_id"]})
        if not existing:
            res = await users_col.insert_one(worker)
            worker_id_map[worker["staff_id"]] = str(res.inserted_id)
            results["workers_seeded"] += 1
        else:
            worker_id_map[worker["staff_id"]] = str(existing["_id"])

    # =========================================================================
    # 4. CAMPUS BLOCKS (with 2dsphere GeoJSON boundary polygons)
    # =========================================================================
    campus_blocks = [
        {
            "block_name": "Block-A",
            "gps_lat": 28.6135,
            "gps_lng": 77.2085,
            "radius_meters": 65.0,
            "total_floors": 3,
            "center_location": {
                "type": "Point",
                "coordinates": [77.2085, 28.6135]
            },
            "boundary_polygon": {
                "type": "Polygon",
                "coordinates": [[
                    [77.2082, 28.6132],
                    [77.2088, 28.6132],
                    [77.2088, 28.6138],
                    [77.2082, 28.6138],
                    [77.2082, 28.6132],
                ]]
            },
            "status": RoomHealthStatus.NORMAL.value,
            "created_at": now,
            "updated_at": now,
        },
        {
            "block_name": "Block-B",
            "gps_lat": 28.6139,
            "gps_lng": 77.2090,
            "radius_meters": 70.0,
            "total_floors": 3,
            "center_location": {
                "type": "Point",
                "coordinates": [77.2090, 28.6139]
            },
            "boundary_polygon": {
                "type": "Polygon",
                "coordinates": [[
                    [77.2087, 28.6136],
                    [77.2094, 28.6136],
                    [77.2094, 28.6143],
                    [77.2087, 28.6143],
                    [77.2087, 28.6136],
                ]]
            },
            "status": RoomHealthStatus.GHOST_ENERGY_ALERT.value,
            "created_at": now,
            "updated_at": now,
        },
        {
            "block_name": "Block-C",
            "gps_lat": 28.6145,
            "gps_lng": 77.2095,
            "radius_meters": 60.0,
            "total_floors": 3,
            "center_location": {
                "type": "Point",
                "coordinates": [77.2095, 28.6145]
            },
            "boundary_polygon": {
                "type": "Polygon",
                "coordinates": [[
                    [77.2092, 28.6142],
                    [77.2098, 28.6142],
                    [77.2098, 28.6148],
                    [77.2092, 28.6148],
                    [77.2092, 28.6142],
                ]]
            },
            "status": RoomHealthStatus.NORMAL.value,
            "created_at": now,
            "updated_at": now,
        },
        {
            "block_name": "Central Library",
            "gps_lat": 28.6130,
            "gps_lng": 77.2094,
            "radius_meters": 55.0,
            "total_floors": 2,
            "center_location": {
                "type": "Point",
                "coordinates": [77.2094, 28.6130]
            },
            "boundary_polygon": {
                "type": "Polygon",
                "coordinates": [[
                    [77.2091, 28.6127],
                    [77.2097, 28.6127],
                    [77.2097, 28.6133],
                    [77.2091, 28.6133],
                    [77.2091, 28.6127],
                ]]
            },
            "status": RoomHealthStatus.NORMAL.value,
            "created_at": now,
            "updated_at": now,
        },
        {
            "block_name": "Gate-2 Corridor",
            "gps_lat": 28.6140,
            "gps_lng": 77.2091,
            "radius_meters": 45.0,
            "total_floors": 1,
            "center_location": {
                "type": "Point",
                "coordinates": [77.2091, 28.6140]
            },
            "boundary_polygon": {
                "type": "Polygon",
                "coordinates": [[
                    [77.2089, 28.6138],
                    [77.2093, 28.6138],
                    [77.2093, 28.6143],
                    [77.2089, 28.6143],
                    [77.2089, 28.6138],
                ]]
            },
            "status": RoomHealthStatus.ALERT.value,
            "created_at": now,
            "updated_at": now,
        },
    ]

    for block in campus_blocks:
        existing = await blocks_col.find_one({"block_name": block["block_name"]})
        if not existing:
            await blocks_col.insert_one(block)
            results["blocks_seeded"] += 1

    # =========================================================================
    # 5. CAMPUS ROOMS (8 Pre-Configured Rooms & Digital Twin Video Feeds)
    # =========================================================================
    rooms = [
        # Room 1: Key Digital Twin Demo Room - Block-B Room 204
        {
            "block_name": "Block-B",
            "floor_number": 2,
            "room_number": "Room 204",
            "room_type": "CLASSROOM",
            "gps_lat": 28.6139,
            "gps_lng": 77.2090,
            "location": {
                "type": "Point",
                "coordinates": [77.2090, 28.6139]
            },
            "appliances": [
                {"name": "Split AC", "count": 2, "power_rating_kw_total": 3.0, "kw": 3.0},
                {"name": "LED Tube Lights", "count": 6, "power_rating_kw_total": 0.24, "kw": 0.24},
                {"name": "Ceiling Fans", "count": 4, "power_rating_kw_total": 0.30, "kw": 0.30},
            ],
            "total_kw_rating": 3.54,
            "camera_tag": CameraTag.INDOOR_FACILITY.value,
            "rtsp_url": "rtsp://192.168.1.204:554/stream1",
            "seating_capacity": 60,
            "current_status": RoomHealthStatus.GHOST_ENERGY_ALERT.value,
            "timetable_slots": [
                {
                    "day_of_week": "Monday",
                    "start_hour": 10,
                    "end_hour": 11,
                    "subject_or_event": "Digital Signal Processing",
                    "faculty_name": "Dr. K. Sharma",
                    "is_lecture_scheduled": False,
                }
            ],
            "created_at": now,
            "updated_at": now,
        },
        # Room 2: Block-A Lab 102
        {
            "block_name": "Block-A",
            "floor_number": 1,
            "room_number": "Lab 102",
            "room_type": "LAB",
            "gps_lat": 28.6135,
            "gps_lng": 77.2085,
            "location": {
                "type": "Point",
                "coordinates": [77.2085, 28.6135]
            },
            "appliances": [
                {"name": "Smart Projector", "count": 1, "power_rating_kw_total": 0.40, "kw": 0.40},
                {"name": "Split AC", "count": 3, "power_rating_kw_total": 4.50, "kw": 4.50},
                {"name": "Workstation PCs", "count": 10, "power_rating_kw_total": 0.90, "kw": 0.90},
            ],
            "total_kw_rating": 5.80,
            "camera_tag": CameraTag.INDOOR_FACILITY.value,
            "rtsp_url": "rtsp://192.168.1.102:554/stream1",
            "seating_capacity": 40,
            "current_status": RoomHealthStatus.NORMAL.value,
            "created_at": now,
            "updated_at": now,
        },
        # Room 3: Block-C Washroom-2B
        {
            "block_name": "Block-C",
            "floor_number": 2,
            "room_number": "Washroom-2B",
            "room_type": "WASHROOM",
            "gps_lat": 28.6145,
            "gps_lng": 77.2095,
            "location": {
                "type": "Point",
                "coordinates": [77.2095, 28.6145]
            },
            "appliances": [
                {"name": "Exhaust Fans", "count": 2, "power_rating_kw_total": 0.25, "kw": 0.25},
                {"name": "LED Bulkheads", "count": 4, "power_rating_kw_total": 0.10, "kw": 0.10},
            ],
            "total_kw_rating": 0.35,
            "camera_tag": CameraTag.INDOOR_FACILITY.value,
            "rtsp_url": "rtsp://192.168.1.302:554/stream1",
            "seating_capacity": 0,
            "current_status": RoomHealthStatus.NORMAL.value,
            "created_at": now,
            "updated_at": now,
        },
        # Room 4: Gate-2 Corridor (Outdoor Security)
        {
            "block_name": "Gate-2 Corridor",
            "floor_number": 0,
            "room_number": "Gate-2 Checkpoint",
            "room_type": "GATE",
            "gps_lat": 28.6141,
            "gps_lng": 77.2091,
            "location": {
                "type": "Point",
                "coordinates": [77.2091, 28.6141]
            },
            "appliances": [
                {"name": "LED Flood Lights", "count": 4, "power_rating_kw_total": 0.80, "kw": 0.80},
                {"name": "Security Turnstiles", "count": 2, "power_rating_kw_total": 0.30, "kw": 0.30},
            ],
            "total_kw_rating": 1.10,
            "camera_tag": CameraTag.OUTDOOR_SECURITY.value,
            "rtsp_url": "rtsp://192.168.1.201:554/stream1",
            "seating_capacity": 0,
            "current_status": RoomHealthStatus.ALERT.value,
            "created_at": now,
            "updated_at": now,
        },
        # Room 5: Main Gate-1
        {
            "block_name": "Gate-1",
            "floor_number": 0,
            "room_number": "Main Entrance Gate-1",
            "room_type": "GATE",
            "gps_lat": 28.6126,
            "gps_lng": 77.2075,
            "location": {
                "type": "Point",
                "coordinates": [77.2075, 28.6126]
            },
            "appliances": [
                {"name": "Automatic Boom Barrier", "count": 2, "power_rating_kw_total": 0.50, "kw": 0.50},
                {"name": "High-Mast Flood Lights", "count": 2, "power_rating_kw_total": 1.00, "kw": 1.00},
            ],
            "total_kw_rating": 1.50,
            "camera_tag": CameraTag.OUTDOOR_SECURITY.value,
            "rtsp_url": "rtsp://192.168.1.202:554/stream1",
            "seating_capacity": 0,
            "current_status": RoomHealthStatus.NORMAL.value,
            "created_at": now,
            "updated_at": now,
        },
        # Room 6: Block-B Corridor
        {
            "block_name": "Block-B",
            "floor_number": 1,
            "room_number": "Ground Corridor",
            "room_type": "CORRIDOR",
            "gps_lat": 28.6138,
            "gps_lng": 77.2091,
            "location": {
                "type": "Point",
                "coordinates": [77.2091, 28.6138]
            },
            "appliances": [
                {"name": "Corridor LED Tubes", "count": 12, "power_rating_kw_total": 0.48, "kw": 0.48},
            ],
            "total_kw_rating": 0.48,
            "camera_tag": CameraTag.OUTDOOR_SECURITY.value,
            "rtsp_url": "rtsp://192.168.1.205:554/stream1",
            "seating_capacity": 0,
            "current_status": RoomHealthStatus.ALERT.value,
            "created_at": now,
            "updated_at": now,
        },
        # Room 7: Cafeteria Plaza
        {
            "block_name": "Block-C",
            "floor_number": 0,
            "room_number": "Cafeteria Plaza",
            "room_type": "CORRIDOR",
            "gps_lat": 28.6143,
            "gps_lng": 77.2093,
            "location": {
                "type": "Point",
                "coordinates": [77.2093, 28.6143]
            },
            "appliances": [
                {"name": "Industrial Exhaust Hoods", "count": 2, "power_rating_kw_total": 2.00, "kw": 2.00},
                {"name": "High-Bay Warm Lighting", "count": 8, "power_rating_kw_total": 0.80, "kw": 0.80},
            ],
            "total_kw_rating": 2.80,
            "camera_tag": CameraTag.OUTDOOR_SECURITY.value,
            "rtsp_url": "rtsp://192.168.1.206:554/stream1",
            "seating_capacity": 150,
            "current_status": RoomHealthStatus.NORMAL.value,
            "created_at": now,
            "updated_at": now,
        },
        # Room 8: Central Library Reading Hall
        {
            "block_name": "Central Library",
            "floor_number": 1,
            "room_number": "Main Reading Hall",
            "room_type": "CLASSROOM",
            "gps_lat": 28.6130,
            "gps_lng": 77.2094,
            "location": {
                "type": "Point",
                "coordinates": [77.2094, 28.6130]
            },
            "appliances": [
                {"name": "Central Chiller AC Air Ducts", "count": 2, "power_rating_kw_total": 3.50, "kw": 3.50},
                {"name": "Dimmable Acoustic Reading Lamps", "count": 30, "power_rating_kw_total": 0.60, "kw": 0.60},
            ],
            "total_kw_rating": 4.10,
            "camera_tag": CameraTag.INDOOR_FACILITY.value,
            "rtsp_url": "rtsp://192.168.1.208:554/stream1",
            "seating_capacity": 120,
            "current_status": RoomHealthStatus.NORMAL.value,
            "created_at": now,
            "updated_at": now,
        },
    ]

    for room in rooms:
        existing = await rooms_col.find_one({
            "block_name": room["block_name"],
            "room_number": room["room_number"],
        })
        if not existing:
            await rooms_col.insert_one(room)
            results["rooms_seeded"] += 1

    # =========================================================================
    # 6. INITIAL LIVE SECURITY INCIDENT (Violence Alert with Pre-computed Proximity)
    # =========================================================================
    existing_incident = await security_incidents_col.find_one({"incident_code": "SEC-INC-1001"})
    if not existing_incident:
        primary_guard_id = guard_id_map.get("SEC-101")
        backup_guard_id = guard_id_map.get("SEC-104")
        sec_incident = {
            "incident_code": "SEC-INC-1001",
            "threat_type": SecurityThreatType.VIOLENCE_FIGHT.value,
            "incident_type": SecurityThreatType.VIOLENCE_FIGHT.value,
            "status": SecurityIncidentStatus.PENDING_VERIFICATION.value,
            "severity": SecuritySeverity.HIGH.value,
            "block_name": "Gate-2 Corridor",
            "floor_number": 0,
            "location_name": "Block-B Ground Corridor (Near Gate-2)",
            "location_description": "Block-B Ground Corridor (Near Gate-2)",
            "lat": 28.61405,
            "lng": 77.20912,
            "location": {
                "type": "Point",
                "coordinates": [77.20912, 28.61405]
            },
            "camera_id": "CAM-GATE2-NORTH",
            "rtsp_url": "rtsp://192.168.1.201:554/stream1",
            "preview_clip_url": "https://assets.smartcampus.io/clips/gate2_fight_demo.mp4",
            "ai_confidence": 94.6,
            "multi_frame_verified": True,
            "triggered_by_user": {
                "id": "AI_VISION_YOLO_V8",
                "name": "Edge YOLOv8 Threat Engine",
                "role": "SYSTEM_DETECTOR",
            },
            "recommended_guards": [
                {
                    "guard_id": primary_guard_id or "SEC-101",
                    "guard_name": "Vikram Singh",
                    "staff_id": "SEC-101",
                    "badge": "SEC-GATE-NORTH",
                    "phone": "9876543101",
                    "distance_meters": 19.2,
                    "duty_state": "ONLINE_FREE",
                    "eta_seconds": 25,
                },
                {
                    "guard_id": backup_guard_id or "SEC-104",
                    "guard_name": "Rajesh Kumar",
                    "staff_id": "SEC-104",
                    "badge": "SEC-QUAD-ALPHA",
                    "phone": "9876543104",
                    "distance_meters": 112.5,
                    "duty_state": "ONLINE_FREE",
                    "eta_seconds": 95,
                },
            ],
            "assigned_guard_id": None,
            "assigned_guard_name": None,
            "assigned_guard_Badge": None,
            "assigned_guard_phone": None,
            "backup_guards": [],
            "backup_guard_ids": [],
            "dispatched_at": None,
            "accepted_at": None,
            "resolved_at": None,
            "proof_photo_url": None,
            "notes": "Physical altercation detected between 3 individuals near Gate-2 exit with 94.6% confidence.",
            "timeline_steps": [
                {
                    "timestamp": now - timedelta(minutes=2),
                    "status": SecurityIncidentStatus.PENDING_VERIFICATION.value,
                    "actor_name": "AI Vision Engine (YOLOv8)",
                    "notes": "Violence fight detected across 15 consecutive frames.",
                }
            ],
            "timeline": [
                {
                    "timestamp": now - timedelta(minutes=2),
                    "status": SecurityIncidentStatus.PENDING_VERIFICATION.value,
                    "actor_name": "AI Vision Engine (YOLOv8)",
                    "notes": "Violence fight detected across 15 consecutive frames.",
                }
            ],
            "created_at": now - timedelta(minutes=2),
            "updated_at": now - timedelta(minutes=2),
        }
        await security_incidents_col.insert_one(sec_incident)
        results["security_incidents_seeded"] += 1

    # =========================================================================
    # 7. INITIAL FACILITY WORKORDERS (1 Ghost Energy + 1 Student Grievance)
    # =========================================================================
    # Workorder 1: Ghost Energy in Room 204
    existing_wo1 = await facility_workorders_col.find_one({"workorder_code": "FAC-WO-2001"})
    if not existing_wo1:
        top_worker_id = worker_id_map.get("WRK-201")
        wo_ghost = {
            "workorder_code": "FAC-WO-2001",
            "source": WorkorderSource.AI_GHOST_ENERGY.value,
            "ticket_source": WorkorderSource.AI_GHOST_ENERGY.value,
            "category": FacilityCategory.HVAC_AC.value,
            "required_department": FacilityCategory.HVAC_AC.value,
            "status": WorkorderStatus.SUBMITTED.value,
            "block_name": "Block-B",
            "floor_number": 2,
            "room_number": "Room 204",
            "lat": 28.6139,
            "lng": 77.2090,
            "location": {
                "type": "Point",
                "coordinates": [77.2090, 28.6139]
            },
            "title": "Ghost Energy Wastage Alert: Room 204",
            "description": "Room 204 vacant for 12 minutes with 2 AC units and 6 lights running (3.54 kW load).",
            "instruction_hindi": "Kamra khali hai. Main switchboard se 2 AC aur 6 Lights band karein.",
            "wasted_power_kw": 3.54,
            "wasted_kw": 3.54,
            "vacant_duration_minutes": 12,
            "cctv_verification_data": {
                "headcount": 0,
                "room_luminance": 218.5,
                "appliances_on": [
                    "2 Split AC (3.0 kW)",
                    "6 LED Lights (0.24 kW)",
                    "4 Fans (0.30 kW)"
                ],
                "timetable_status": "NO_LECTURE_SCHEDULED",
                "clip_duration_sec": 5,
            },
            "complaint_photo_url": "https://assets.smartcampus.io/photos/room204_empty_ac_on.jpg",
            "recommended_workers": [
                {
                    "worker_id": top_worker_id or "WRK-201",
                    "worker_name": "Ramesh Kumar",
                    "staff_id": "WRK-201",
                    "department": "HOUSEKEEPING",
                    "phone": "9876543201",
                    "distance_meters": 18.0,
                    "current_block": "Block-B",
                    "current_floor": 2,
                    "match_score": 98.0,
                    "active_tasks": 0,
                    "eta_seconds": 35,
                },
                {
                    "worker_id": worker_id_map.get("WRK-203") or "WRK-203",
                    "worker_name": "Suresh Yadav",
                    "staff_id": "WRK-203",
                    "department": "HVAC_AC",
                    "phone": "9876543203",
                    "distance_meters": 28.5,
                    "current_block": "Block-B",
                    "current_floor": 1,
                    "match_score": 94.0,
                    "active_tasks": 0,
                    "eta_seconds": 60,
                },
            ],
            "assigned_worker_id": None,
            "assigned_worker_name": None,
            "assigned_worker_staff_id": None,
            "assigned_worker_dept": None,
            "assigned_worker_phone": None,
            "supervisor_autopilot_deadline": now + timedelta(seconds=60),
            "sla_accept_deadline": None,
            "sla_deadline": now + timedelta(seconds=600),
            "sla_resolve_deadline": now + timedelta(seconds=600),
            "reassigned_history": [],
            "proof_photo_url": None,
            "post_close_cctv_verified": False,
            "post_close_luminance": None,
            "energy_saved_kwh": 0.0,
            "money_saved_rupees": 0.0,
            "rupees_saved": 0.0,
            "timeline_steps": [
                {
                    "step_key": "SUBMITTED",
                    "title": "Ghost Energy Alert Detected",
                    "description": "Zero occupancy confirmed with 3.54 kW active electrical consumption.",
                    "completed": True,
                    "timestamp": now - timedelta(minutes=1),
                    "actor_name": "Digital Twin Power Analyzer",
                },
                {
                    "step_key": "VERIFIED_ASSIGNED",
                    "title": "Awaiting Supervisor Dispatch",
                    "description": "60s supervisor auto-dispatch countdown in progress.",
                    "completed": False,
                    "timestamp": None,
                    "actor_name": None,
                },
                {
                    "step_key": "WORKER_EN_ROUTE",
                    "title": "Worker En Route",
                    "description": "Technician navigating to Room 204.",
                    "completed": False,
                    "timestamp": None,
                    "actor_name": None,
                },
                {
                    "step_key": "RESOLVED",
                    "title": "Resolved with Proof Photo",
                    "description": "Verified appliances shutdown and power cut.",
                    "completed": False,
                    "timestamp": None,
                    "actor_name": None,
                },
            ],
            "created_at": now - timedelta(minutes=1),
            "dispatched_at": None,
            "accepted_at": None,
            "resolved_at": None,
            "updated_at": now - timedelta(minutes=1),
        }
        await facility_workorders_col.insert_one(wo_ghost)
        results["facility_workorders_seeded"] += 1

    # Workorder 2: Student Grievance in Lab 102
    existing_wo2 = await facility_workorders_col.find_one({"workorder_code": "FAC-WO-2002"})
    if not existing_wo2:
        it_worker_id = worker_id_map.get("WRK-205")
        wo_grievance = {
            "workorder_code": "FAC-WO-2002",
            "source": WorkorderSource.USER_GRIEVANCE.value,
            "ticket_source": WorkorderSource.USER_GRIEVANCE.value,
            "category": FacilityCategory.IT_AV.value,
            "required_department": FacilityCategory.IT_AV.value,
            "status": WorkorderStatus.VERIFIED_ASSIGNED.value,
            "block_name": "Block-A",
            "floor_number": 1,
            "room_number": "Lab 102",
            "lat": 28.6135,
            "lng": 77.2085,
            "location": {
                "type": "Point",
                "coordinates": [77.2085, 28.6135]
            },
            "title": "Lab 102 Smart Projector Not Turning On",
            "description": "HDMI signal and lamp power failing repeatedly during scheduled lab presentation.",
            "instruction_hindi": "Smart Projector ka HDMI port aur power cord check karein.",
            "reported_by_user": {
                "id": "STU-2026-001",
                "name": "Rahul Sharma (B.Tech CSE 3rd Yr)",
                "roll_or_emp_id": "STU-2026-001",
                "phone": "9876500001",
                "role": "STUDENT_FACULTY",
            },
            "complaint_photo_url": "https://assets.smartcampus.io/photos/projector_fault.jpg",
            "assigned_worker_id": it_worker_id or "WRK-205",
            "assigned_worker_name": "Karan Nair",
            "assigned_worker_staff_id": "WRK-205",
            "assigned_worker_dept": "IT_AV",
            "assigned_worker_phone": "9876543205",
            "supervisor_autopilot_deadline": None,
            "sla_accept_deadline": now + timedelta(seconds=180),
            "sla_deadline": now + timedelta(seconds=600),
            "sla_resolve_deadline": now + timedelta(seconds=600),
            "reassigned_history": [],
            "proof_photo_url": None,
            "post_close_cctv_verified": False,
            "energy_saved_kwh": 0.0,
            "money_saved_rupees": 0.0,
            "rupees_saved": 0.0,
            "timeline_steps": [
                {
                    "step_key": "SUBMITTED",
                    "title": "Complaint Submitted by Student",
                    "description": "Rahul Sharma reported Smart Projector malfunction.",
                    "completed": True,
                    "timestamp": now - timedelta(minutes=5),
                    "actor_name": "Rahul Sharma",
                },
                {
                    "step_key": "VERIFIED_ASSIGNED",
                    "title": "Assigned to IT / AV Technician",
                    "description": "Assigned to Karan Nair (Block-A, Floor 1).",
                    "completed": True,
                    "timestamp": now - timedelta(minutes=3),
                    "actor_name": "Er. Manish Verma",
                },
                {
                    "step_key": "WORKER_EN_ROUTE",
                    "title": "Worker En Route",
                    "description": "Worker accepting task and heading to Lab 102.",
                    "completed": False,
                    "timestamp": None,
                    "actor_name": "Karan Nair",
                },
                {
                    "step_key": "RESOLVED",
                    "title": "Resolved with Proof Photo",
                    "description": "Pending component test and confirmation.",
                    "completed": False,
                    "timestamp": None,
                    "actor_name": None,
                },
            ],
            "created_at": now - timedelta(minutes=5),
            "dispatched_at": now - timedelta(minutes=3),
            "accepted_at": None,
            "resolved_at": None,
            "updated_at": now - timedelta(minutes=3),
        }
        await facility_workorders_col.insert_one(wo_grievance)
        results["facility_workorders_seeded"] += 1

    # =========================================================================
    # 8. LIVE ATTENDANCE ROLL-CALL (All 9 Field Guards & Workers for Today)
    # =========================================================================
    staff_roster = [
        # 3 Security Guards
        {
            "staff_id": "SEC-101",
            "name": "Vikram Singh",
            "role": UserRole.SECURITY_GUARD.value,
            "department": DepartmentType.SECURITY.value,
            "live_gps_zone": "Gate-2 (Block-B Corridor)",
            "lat": 28.61405,
            "lng": 77.20912,
            "current_state": DutyState.ONLINE_FREE.value,
            "tasks_completed_count": 3,
            "missed_sla_count": 0,
        },
        {
            "staff_id": "SEC-104",
            "name": "Rajesh Kumar",
            "role": UserRole.SECURITY_GUARD.value,
            "department": DepartmentType.SECURITY.value,
            "live_gps_zone": "Block-A Quadrangle",
            "lat": 28.61320,
            "lng": 77.20820,
            "current_state": DutyState.ONLINE_FREE.value,
            "tasks_completed_count": 2,
            "missed_sla_count": 0,
        },
        {
            "staff_id": "SEC-102",
            "name": "Sandeep Tiwari",
            "role": UserRole.SECURITY_GUARD.value,
            "department": DepartmentType.SECURITY.value,
            "live_gps_zone": "Main Gate-1 Checkpoint",
            "lat": 28.61260,
            "lng": 77.20750,
            "current_state": DutyState.ONLINE_FREE.value,
            "tasks_completed_count": 1,
            "missed_sla_count": 0,
        },
        # 6 Ground Technicians
        {
            "staff_id": "WRK-201",
            "name": "Ramesh Kumar",
            "role": UserRole.GROUND_WORKER.value,
            "department": DepartmentType.HOUSEKEEPING.value,
            "live_gps_zone": "Block-B (Floor 2)",
            "lat": 28.61395,
            "lng": 77.20905,
            "current_state": DutyState.ONLINE_FREE.value,
            "tasks_completed_count": 4,
            "missed_sla_count": 0,
        },
        {
            "staff_id": "WRK-202",
            "name": "Amit Patel",
            "role": UserRole.GROUND_WORKER.value,
            "department": DepartmentType.ELECTRICAL.value,
            "live_gps_zone": "Block-A (Floor 1)",
            "lat": 28.61345,
            "lng": 77.20845,
            "current_state": DutyState.ONLINE_FREE.value,
            "tasks_completed_count": 2,
            "missed_sla_count": 0,
        },
        {
            "staff_id": "WRK-203",
            "name": "Suresh Yadav",
            "role": UserRole.GROUND_WORKER.value,
            "department": DepartmentType.HVAC_AC.value,
            "live_gps_zone": "Block-B (Floor 1)",
            "lat": 28.61410,
            "lng": 77.20918,
            "current_state": DutyState.ONLINE_FREE.value,
            "tasks_completed_count": 5,
            "missed_sla_count": 0,
        },
        {
            "staff_id": "WRK-204",
            "name": "Deepak Verma",
            "role": UserRole.GROUND_WORKER.value,
            "department": DepartmentType.PLUMBING.value,
            "live_gps_zone": "Block-C (Floor 2)",
            "lat": 28.61455,
            "lng": 77.20955,
            "current_state": DutyState.ONLINE_FREE.value,
            "tasks_completed_count": 1,
            "missed_sla_count": 0,
        },
        {
            "staff_id": "WRK-205",
            "name": "Karan Nair",
            "role": UserRole.GROUND_WORKER.value,
            "department": DepartmentType.IT_AV.value,
            "live_gps_zone": "Block-A (Floor 1)",
            "lat": 28.61355,
            "lng": 77.20855,
            "current_state": DutyState.BUSY_ON_TASK.value,
            "tasks_completed_count": 3,
            "missed_sla_count": 0,
        },
        {
            "staff_id": "WRK-206",
            "name": "Manoj Mistri",
            "role": UserRole.GROUND_WORKER.value,
            "department": DepartmentType.CIVIL_CARPENTRY.value,
            "live_gps_zone": "Block-C (Floor 1)",
            "lat": 28.61465,
            "lng": 77.20965,
            "current_state": DutyState.ONLINE_FREE.value,
            "tasks_completed_count": 2,
            "missed_sla_count": 0,
        },
    ]

    for member in staff_roster:
        user_doc = await users_col.find_one({"staff_id": member["staff_id"]})
        user_id = str(user_doc["_id"]) if user_doc else member["staff_id"]

        existing_att = await attendance_col.find_one({
            "user_id": user_id,
            "date_str": today_str
        })
        if not existing_att:
            # Also check legacy date field
            existing_att = await attendance_col.find_one({
                "user_id": user_id,
                "date": today_str
            })

        if not existing_att:
            attendance_record = {
                "user_id": user_id,
                "staff_id": member["staff_id"],
                "name": member["name"],
                "role": member["role"],
                "department": member["department"],
                "date_str": today_str,
                "date": today_str,
                "check_in_time": now - timedelta(hours=3),
                "check_out_time": None,
                "live_gps_zone": member["live_gps_zone"],
                "live_zone": member["live_gps_zone"],
                "lat": member["lat"],
                "lng": member["lng"],
                "current_state": member["current_state"],
                "tasks_completed_count": member["tasks_completed_count"],
                "tasks_completed": member["tasks_completed_count"],
                "missed_sla_count": member["missed_sla_count"],
                "total_hours_worked": 3.0,
                "last_updated": now,
                "created_at": now - timedelta(hours=3),
                "updated_at": now,
            }
            await attendance_col.insert_one(attendance_record)
            results["attendance_seeded"] += 1

    # =========================================================================
    # 9. INITIAL GLOBAL AUDIT LOGS
    # =========================================================================
    initial_logs = [
        {
            "event_id": f"EVT-{uuid.uuid4().hex[:8].upper()}",
            "event_type": AuditEventType.SYSTEM_INITIALIZED.value,
            "severity": AuditSeverity.INFO.value,
            "title": "Phase 1 Smart Campus Database Seeded",
            "description": "All 5 administrative roles, 9 field staff, 5 campus blocks, 8 digital twin streams, and initial demo alerts successfully provisioned.",
            "actor_id": "SYSTEM_BOOTSTRAP",
            "actor_name": "System Engine",
            "actor_role": UserRole.SUPER_ADMIN.value,
            "role": UserRole.SUPER_ADMIN.value,
            "target_id": "DATABASE_INIT",
            "metadata": {
                "version": "1.0.0",
                "blocks_count": 5,
                "staff_count": 9,
            },
            "timestamp": now - timedelta(minutes=15),
        },
        {
            "event_id": f"EVT-{uuid.uuid4().hex[:8].upper()}",
            "event_type": AuditEventType.AI_THREAT_DETECTED.value,
            "severity": AuditSeverity.HIGH.value,
            "title": "CCTV Edge AI Detected Violent Altercation",
            "description": "YOLOv8 Edge Vision flagged violent altercation at Gate-2 Corridor Main Passage (Confidence: 94.6%).",
            "actor_id": "AI_VISION_YOLO_V8",
            "actor_name": "Edge YOLOv8 Threat Engine",
            "actor_role": None,
            "role": None,
            "target_id": "SEC-INC-1001",
            "metadata": {"camera_id": "CAM-GATE2-NORTH", "frames_confirmed": 15},
            "timestamp": now - timedelta(minutes=2),
        },
        {
            "event_id": f"EVT-{uuid.uuid4().hex[:8].upper()}",
            "event_type": AuditEventType.GHOST_ENERGY_DETECTED.value,
            "severity": AuditSeverity.WARNING.value,
            "title": "Ghost Energy Wastage Detected in Room 204",
            "description": "Digital twin detected 3.54 kW wastage with zero room occupancy for >10 minutes.",
            "actor_id": "GHOST_ENERGY_ENGINE",
            "actor_name": "Digital Twin Power Analyzer",
            "actor_role": None,
            "role": None,
            "target_id": "FAC-WO-2001",
            "metadata": {"wasted_kw": 3.54, "room": "Room 204", "block": "Block-B"},
            "timestamp": now - timedelta(minutes=1),
        },
    ]

    for log_item in initial_logs:
        existing_log = await audit_logs_col.find_one({"event_type": log_item["event_type"], "title": log_item["title"]})
        if not existing_log:
            await audit_logs_col.insert_one(log_item)
            results["audit_logs_seeded"] += 1

    logger.info(f"Phase 1 Smart Campus Database Seed Completed Successfully: {results}")
    return results
