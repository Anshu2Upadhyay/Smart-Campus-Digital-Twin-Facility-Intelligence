import os
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_indexes, close_database, client
from app.seed import seed_initial_data
from app.routers import (
    auth_router,
    admin_router,
    security_router,
    security_alias_router,
    guard_router,
    facility_router,
    facility_alias_router,
    worker_router,
    student_router,
    campus_gpt_router,
    spatial_router,
)
from app.services.websocket_manager import ws_manager
from app.services.sla_scheduler import run_sla_monitor
from app.services.campus_gpt_rag import campus_gpt, campus_rag
from app.services.autonomous_ai_sentinel import run_autonomous_ai_sentinel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("smart_campus.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Context Manager:
      1. Ensures upload directories (proofs, complaints, clips) exist
      2. Creates MongoDB 2dsphere geospatial and compound indexes
      3. Seeds initial data (6 roles, users, PINs, blocks, rooms with Room 204 virtual meter, alerts)
      4. Initializes CampusGPT RAG knowledge base (the 6 official campus circulars)
      5. Launches 3-Tier SLA monitoring & auto-pilot background loop
      6. Graceful shutdown on termination
    """
    logger.info("Initializing Smart Campus Digital Twin & Facility Intelligence Platform (Phase 5)...")

    # 1. Ensure upload storage directories exist
    os.makedirs("uploads/proofs", exist_ok=True)
    os.makedirs("uploads/complaints", exist_ok=True)
    os.makedirs("uploads/clips", exist_ok=True)

    # 2. Database Indexes
    await init_indexes()

    # 3. Database Seeding
    await seed_initial_data()

    # 4. Initialize CampusGPT RAG Vector Base (6 Official Circulars)
    await campus_gpt.initialize_knowledge_base()

    # 5. Start Background SLA Monitoring Task (10-second tick)
    sla_task = asyncio.create_task(run_sla_monitor(check_interval_seconds=10))
    logger.info("Background SLA Auto-Pilot & Escalation Monitor active.")

    # 6. Start Autonomous Multimodal AI Sentinel (15-second tick)
    sentinel_task = asyncio.create_task(run_autonomous_ai_sentinel(interval_seconds=15))
    logger.info("Autonomous AI Sentinel (YOLOv8 + Gemini Multimodal Vision) active.")

    yield

    # Clean Shutdown
    logger.info("Gracefully terminating background services and database connections...")
    sla_task.cancel()
    sentinel_task.cancel()
    try:
        await asyncio.gather(sla_task, sentinel_task, return_exceptions=True)
    except Exception:
        pass
    await close_database()
    logger.info("Smart Campus Platform shutdown complete.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for Real-Time Digital Twin, Proximity Security Dispatch, and Facility Intelligence",
    lifespan=lifespan,
)

# Robust CORS Configuration supporting local Vite frontend (5173), production bundles, and PWA clients
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Static file serving for uploaded resolution proof photos and circulars
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount All Core REST Routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(security_router)
app.include_router(security_alias_router)
app.include_router(guard_router)
app.include_router(facility_router)
app.include_router(facility_alias_router)
app.include_router(worker_router)
app.include_router(student_router)
app.include_router(campus_gpt_router)
app.include_router(spatial_router)


# =============================================================================
# REAL-TIME WEBSOCKET GATEWAYS
# =============================================================================
@app.websocket("/ws/{role}/{user_id}")
async def root_websocket_endpoint(websocket: WebSocket, role: str, user_id: str):
    """
    Primary WebSocket gateway for all 6 roles:
      - SUPER_ADMIN
      - SECURITY_HEAD
      - SECURITY_GUARD
      - FACILITY_SUPERVISOR
      - GROUND_WORKER
      - STUDENT_FACULTY
    Receives live 5-second GPS telemetry heartbeats, task card events, and system alerts.
    """
    await ws_manager.connect(websocket, role=role, user_id=user_id)
    try:
        while True:
            raw_text = await websocket.receive_text()
            await ws_manager.handle_incoming_message(websocket, raw_text)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as exc:
        logger.error(f"WebSocket error ({role}/{user_id}): {exc}")
        ws_manager.disconnect(websocket)


@app.websocket("/ws/admin")
async def admin_global_websocket(websocket: WebSocket):
    """
    Dedicated global WebSocket gateway for Super Admin Command Center:
    Streams platform-wide audit events, incident sirens, and telemetry feeds.
    """
    admin_id = "admin-global"
    await ws_manager.connect(websocket, role="SUPER_ADMIN", user_id=admin_id)
    try:
        while True:
            raw_text = await websocket.receive_text()
            await ws_manager.handle_incoming_message(websocket, raw_text)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as exc:
        logger.error(f"Admin WebSocket error: {exc}")
        ws_manager.disconnect(websocket)


# =============================================================================
# HEALTH CHECK & SYSTEM DIAGNOSTICS
# =============================================================================
@app.get("/", tags=["Health Check"])
async def root():
    """System information and operational status."""
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "active_ws_users": len(ws_manager.active_user_connections),
        "supported_roles": [
            "SUPER_ADMIN",
            "SECURITY_HEAD",
            "SECURITY_GUARD",
            "FACILITY_SUPERVISOR",
            "GROUND_WORKER",
            "STUDENT_FACULTY",
        ],
    }


@app.get("/health", tags=["Health Check"])
@app.get("/api/v1/health", tags=["Health Check"])
async def health_check():
    """Full platform diagnostic health check."""
    mongo_status = "connected"
    try:
        await client.admin.command("ping")
    except Exception:
        mongo_status = "degraded_or_offline"

    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": {
            "name": settings.DB_NAME,
            "status": mongo_status,
        },
        "active_websocket_connections": len(ws_manager.connection_meta),
        "active_users_connected": len(ws_manager.active_user_connections),
        "vision_engine": "ready",
        "campus_gpt_rag": "ready",
    }
