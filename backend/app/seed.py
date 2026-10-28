import logging
import bcrypt
from datetime import datetime
from typing import Dict, Any

from app.database import users_col
from app.models.user import UserRole, DepartmentType, DutyState

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
    Seeds only required portal accounts. Campus records and operational activity are
    created by real user actions and live system events.
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

    # Field staff accounts are provisioned from real staff onboarding.
    results["guards_seeded"] = 0
    results["workers_seeded"] = 0

    # Campus geometry, rooms, cameras and assets come from Map Engine actions.
    results["blocks_seeded"] = 0
    results["rooms_seeded"] = 0

    # Incidents and work orders come from live system events and user reports.
    results["security_incidents_seeded"] = 0
    results["facility_workorders_seeded"] = 0

    # Attendance and audit history come from live user and system actions.
    results["attendance_seeded"] = 0
    results["audit_logs_seeded"] = 0

    logger.info(f"Required portal account seeding completed: {results}")
    return results
