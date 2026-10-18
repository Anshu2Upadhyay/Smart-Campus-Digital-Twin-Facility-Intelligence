"""
Smart Campus Digital Twin & Facility Intelligence Platform
Unified Router Package
"""

from app.routers.auth import (
    router as auth_router,
    get_current_user,
    require_roles,
    create_access_token,
    verify_secret,
    ROLE_REDIRECT_MAP,
)
from app.routers.admin import router as admin_router
from app.routers.security_head import router as security_router, alias_router as security_alias_router
from app.routers.guard_app import router as guard_router
from app.routers.facility_head import router as facility_router, alias_router as facility_alias_router
from app.routers.worker_app import router as worker_router
from app.routers.student_portal import router as student_router
from app.routers.campus_gpt import router as campus_gpt_router
from app.routers.spatial import router as spatial_router

__all__ = [
    "auth_router",
    "admin_router",
    "security_router",
    "security_alias_router",
    "guard_router",
    "facility_router",
    "facility_alias_router",
    "worker_router",
    "student_router",
    "campus_gpt_router",
    "spatial_router",
    "get_current_user",
    "require_roles",
    "create_access_token",
    "verify_secret",
    "ROLE_REDIRECT_MAP",
]
