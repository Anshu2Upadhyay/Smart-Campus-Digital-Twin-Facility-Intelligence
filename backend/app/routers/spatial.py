import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query, Body

from app.database import spatial_layout_col, rooms_col, cameras_col, blocks_col, serialize_doc, serialize_list
from app.models.spatial import CampusSpatialLayout, SpatialBlock, SpatialFloor, SpatialRoom, SpatialCamera
from app.models.campus import ApplianceItem
from app.routers.auth import get_current_user, require_roles
from app.services.websocket_manager import ws_manager

logger = logging.getLogger("smart_campus.spatial")

spatial_router = APIRouter(prefix="/api/v1/spatial", tags=["Spatial Campus Digital Twin Engine"])
router = spatial_router


def get_default_spatial_layout() -> Dict[str, Any]:
    """Generates the canonical spatial digital twin floor-plan model."""
    return {
        "campus_name": "Smart Campus Digital Twin & Facility Intelligence Platform",
        "center_gps": {"lat": 28.6139, "lng": 77.2090},
        "blocks": [
            {
                "block_name": "Block-B",
                "gps_lat": 28.6139,
                "gps_lng": 77.2090,
                "total_floors": 3,
                "floors": [
                    {
                        "floor_number": 2,
                        "name": "Floor 2 (Academic Wing)",
                        "width": 1000,
                        "height": 600,
                        "rooms": [
                            {
                                "room_number": "201",
                                "room_type": "CLASSROOM",
                                "x": 50,
                                "y": 60,
                                "width": 180,
                                "height": 130,
                                "seating_capacity": 60,
                                "color": "#1e293b",
                                "appliances": [
                                    {"name": "Split AC (1.5 Ton)", "count": 1, "power_rating_kw_total": 1.5, "kw": 1.5},
                                    {"name": "LED Tube Lights", "count": 6, "power_rating_kw_total": 0.24, "kw": 0.24},
                                    {"name": "Ceiling Fans", "count": 4, "power_rating_kw_total": 0.32, "kw": 0.32},
                                ],
                                "total_kw": 2.06,
                                "status": "NORMAL",
                                "cctv_ids": ["CAM-B-201"],
                            },
                            {
                                "room_number": "202",
                                "room_type": "LAB",
                                "x": 250,
                                "y": 60,
                                "width": 200,
                                "height": 130,
                                "seating_capacity": 35,
                                "color": "#1e293b",
                                "appliances": [
                                    {"name": "Split AC (2.0 Ton)", "count": 2, "power_rating_kw_total": 3.6, "kw": 3.6},
                                    {"name": "Workstations", "count": 30, "power_rating_kw_total": 4.5, "kw": 4.5},
                                    {"name": "LED Lights", "count": 8, "power_rating_kw_total": 0.32, "kw": 0.32},
                                ],
                                "total_kw": 8.42,
                                "status": "NORMAL",
                                "cctv_ids": ["CAM-B-202"],
                            },
                            {
                                "room_number": "203",
                                "room_type": "OFFICE",
                                "x": 470,
                                "y": 60,
                                "width": 140,
                                "height": 130,
                                "seating_capacity": 12,
                                "color": "#1e293b",
                                "appliances": [
                                    {"name": "Window AC", "count": 1, "power_rating_kw_total": 1.2, "kw": 1.2},
                                    {"name": "LED Lights", "count": 4, "power_rating_kw_total": 0.16, "kw": 0.16},
                                ],
                                "total_kw": 1.36,
                                "status": "NORMAL",
                                "cctv_ids": [],
                            },
                            {
                                "room_number": "204",
                                "room_type": "CLASSROOM",
                                "x": 630,
                                "y": 60,
                                "width": 220,
                                "height": 140,
                                "seating_capacity": 50,
                                "color": "#3b1e1e",
                                "appliances": [
                                    {"name": "Dual Inverter AC (2.0 Ton)", "count": 1, "power_rating_kw_total": 2.80, "kw": 2.80},
                                    {"name": "LED Panel Fixtures", "count": 8, "power_rating_kw_total": 0.44, "kw": 0.44},
                                    {"name": "Smart Interactive Projector", "count": 1, "power_rating_kw_total": 0.30, "kw": 0.30},
                                ],
                                "total_kw": 3.54,
                                "status": "GHOST_ENERGY_ALERT",
                                "cctv_ids": ["CAM-01"],
                            },
                            {
                                "room_number": "CORRIDOR-2",
                                "room_type": "CORRIDOR",
                                "x": 50,
                                "y": 210,
                                "width": 800,
                                "height": 60,
                                "seating_capacity": 0,
                                "color": "#0f172a",
                                "appliances": [
                                    {"name": "Corridor LED Strips", "count": 12, "power_rating_kw_total": 0.48, "kw": 0.48},
                                ],
                                "total_kw": 0.48,
                                "status": "NORMAL",
                                "cctv_ids": ["CAM-01"],
                            },
                            {
                                "room_number": "205",
                                "room_type": "AUDITORIUM",
                                "x": 50,
                                "y": 290,
                                "width": 380,
                                "height": 220,
                                "seating_capacity": 150,
                                "color": "#1e293b",
                                "appliances": [
                                    {"name": "Central Chiller Duct", "count": 1, "power_rating_kw_total": 12.5, "kw": 12.5},
                                    {"name": "Stage Lighting", "count": 1, "power_rating_kw_total": 3.2, "kw": 3.2},
                                ],
                                "total_kw": 15.7,
                                "status": "NORMAL",
                                "cctv_ids": ["CAM-B-205"],
                            },
                            {
                                "room_number": "206",
                                "room_type": "LAB",
                                "x": 450,
                                "y": 290,
                                "width": 240,
                                "height": 220,
                                "seating_capacity": 40,
                                "color": "#1e293b",
                                "appliances": [
                                    {"name": "Split AC", "count": 2, "power_rating_kw_total": 3.2, "kw": 3.2},
                                    {"name": "Robotics Kits", "count": 10, "power_rating_kw_total": 1.5, "kw": 1.5},
                                ],
                                "total_kw": 4.7,
                                "status": "NORMAL",
                                "cctv_ids": ["CAM-B-206"],
                            },
                        ],
                        "cameras": [
                            {
                                "camera_id": "CAM-01",
                                "name": "Block-B Corridor & Room 204 Eye",
                                "room_number": "CORRIDOR-2",
                                "x": 630,
                                "y": 215,
                                "angle": 45,
                                "fov": 80,
                                "rtsp_url": "rtsp://192.168.1.100:554/stream1",
                                "detection_mode": "VIOLENCE_FIGHT",
                                "status": "ALERT",
                                "fps": 30,
                                "resolution": "1920x1080 (1080p)",
                            },
                            {
                                "camera_id": "CAM-B-201",
                                "name": "Room 201 Overhead Angle",
                                "room_number": "201",
                                "x": 140,
                                "y": 70,
                                "angle": 135,
                                "fov": 75,
                                "rtsp_url": "rtsp://192.168.1.101:554/stream1",
                                "detection_mode": "GENERAL",
                                "status": "ONLINE",
                                "fps": 25,
                                "resolution": "1920x1080 (1080p)",
                            },
                            {
                                "camera_id": "CAM-B-202",
                                "name": "Lab 202 Server Rack View",
                                "room_number": "202",
                                "x": 350,
                                "y": 70,
                                "angle": 180,
                                "fov": 75,
                                "rtsp_url": "rtsp://192.168.1.102:554/stream1",
                                "detection_mode": "INTRUSION",
                                "status": "ONLINE",
                                "fps": 30,
                                "resolution": "1920x1080 (1080p)",
                            },
                        ],
                    },
                    {
                        "floor_number": 1,
                        "name": "Floor 1 (Lecture Theatres)",
                        "width": 1000,
                        "height": 600,
                        "rooms": [
                            {
                                "room_number": "101",
                                "room_type": "CLASSROOM",
                                "x": 60,
                                "y": 60,
                                "width": 240,
                                "height": 160,
                                "seating_capacity": 80,
                                "color": "#1e293b",
                                "appliances": [
                                    {"name": "Split AC (2.0 Ton)", "count": 2, "power_rating_kw_total": 3.6, "kw": 3.6},
                                    {"name": "LED Lights", "count": 10, "power_rating_kw_total": 0.4, "kw": 0.4},
                                ],
                                "total_kw": 4.0,
                                "status": "NORMAL",
                                "cctv_ids": ["CAM-B-101"],
                            },
                        ],
                        "cameras": [],
                    },
                ],
            },
            {
                "block_name": "Gate-1",
                "gps_lat": 28.6135,
                "gps_lng": 77.2082,
                "total_floors": 1,
                "floors": [
                    {
                        "floor_number": 0,
                        "name": "Ground Entry Plaza",
                        "width": 800,
                        "height": 400,
                        "rooms": [
                            {
                                "room_number": "GUARD-BOOTH-1",
                                "room_type": "GATE",
                                "x": 100,
                                "y": 100,
                                "width": 120,
                                "height": 100,
                                "seating_capacity": 4,
                                "color": "#1e293b",
                                "appliances": [
                                    {"name": "Boom Barrier Motor", "count": 2, "power_rating_kw_total": 0.75, "kw": 0.75},
                                ],
                                "total_kw": 0.75,
                                "status": "NORMAL",
                                "cctv_ids": ["CAM-02"],
                            },
                        ],
                        "cameras": [
                            {
                                "camera_id": "CAM-02",
                                "name": "Gate-1 Turnstile & Vehicle Boom",
                                "room_number": "GUARD-BOOTH-1",
                                "x": 220,
                                "y": 150,
                                "angle": 90,
                                "fov": 95,
                                "rtsp_url": "rtsp://192.168.1.101:554/stream1",
                                "detection_mode": "OVERCROWDING",
                                "status": "ONLINE",
                                "fps": 30,
                                "resolution": "1920x1080 (1080p)",
                            },
                        ],
                    },
                ],
            },
        ],
        "version": 2,
        "updated_at": datetime.utcnow().isoformat(),
    }


@spatial_router.get("/layout", summary="Get Master Campus Spatial Digital Twin Layout")
async def get_campus_spatial_layout():
    """
    Returns the complete hierarchical spatial model of the campus:
    Blocks -> Floors -> Rooms/Spaces (with 2D/3D coordinates, appliances & virtual meters)
    and plotted CCTV cameras with real RTSP streams.
    """
    layout_doc = await spatial_layout_col.find_one()
    if not layout_doc:
        default_layout = get_default_spatial_layout()
        default_layout["created_at"] = datetime.utcnow()
        default_layout["updated_at"] = datetime.utcnow()
        await spatial_layout_col.insert_one(default_layout)
        layout_doc = await spatial_layout_col.find_one()

    return serialize_doc(layout_doc)


@spatial_router.post("/save-layout", summary="Save / Update Campus Spatial Digital Twin Layout")
async def save_campus_spatial_layout(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(require_roles(["SUPER_ADMIN"]))
):
    """
    Saves and publishes the entire visual floor-plan layout from the Map & Layout Engine.
    Also synchronizes rooms and cameras into standard relational collections.
    """
    payload["updated_at"] = datetime.utcnow().isoformat()
    payload["updated_by"] = current_user.get("email") or current_user.get("name") or "admin"

    # Upsert single master layout doc
    existing = await spatial_layout_col.find_one()
    if existing:
        await spatial_layout_col.update_one({"_id": existing["_id"]}, {"$set": payload})
    else:
        await spatial_layout_col.insert_one(payload)

    # Cross-sync rooms into campus_rooms collection so all legacy & facility endpoints reflect changes
    blocks = payload.get("blocks", [])
    for blk in blocks:
        b_name = blk.get("block_name")
        for flr in blk.get("floors", []):
            f_num = flr.get("floor_number", 0)
            for rm in flr.get("rooms", []):
                r_num = rm.get("room_number")
                if b_name and r_num:
                    await rooms_col.update_one(
                        {"block_name": b_name, "floor_number": f_num, "room_number": r_num},
                        {
                            "$set": {
                                "block_name": b_name,
                                "floor_number": f_num,
                                "room_number": r_num,
                                "room_type": rm.get("room_type", "CLASSROOM"),
                                "appliances": rm.get("appliances", []),
                                "total_kw_rating": rm.get("total_kw", 0.0),
                                "seating_capacity": rm.get("seating_capacity", 50),
                                "current_status": rm.get("status", "NORMAL"),
                                "updated_at": datetime.utcnow(),
                            }
                        },
                        upsert=True
                    )

    # Cross-sync cameras into campus_cctv_cameras
    active_camera_ids = []
    for blk in blocks:
        b_name = blk.get("block_name")
        for flr in blk.get("floors", []):
            f_num = flr.get("floor_number", 0)
            for cam in flr.get("cameras", []):
                c_id = cam.get("camera_id")
                if c_id:
                    active_camera_ids.append(c_id)
                    await cameras_col.update_one(
                        {"camera_id": c_id},
                        {
                            "$set": {
                                "camera_id": c_id,
                                "name": cam.get("name", c_id),
                                "camera_name": cam.get("name", c_id),
                                "block_name": b_name,
                                "floor_number": f_num,
                                "room_number": cam.get("room_number", ""),
                                "rtsp_url": cam.get("rtsp_url") or cam.get("stream_url", ""),
                                "detection_mode": cam.get("detection_mode", "GENERAL"),
                                "status": cam.get("status", "ONLINE"),
                                "x": cam.get("x", 0),
                                "y": cam.get("y", 0),
                                "angle": cam.get("angle", 0),
                                "updated_at": datetime.utcnow(),
                            }
                        },
                        upsert=True
                    )

    # Purge any cameras from cameras_col that were removed by admin from the layout
    if active_camera_ids:
        await cameras_col.delete_many({"camera_id": {"$nin": active_camera_ids}})
    else:
        await cameras_col.delete_many({})

    # Broadcast live sync to all connected Security and Facility dashboards
    try:
        await ws_manager.broadcast({
            "type": "CCTV_LAYOUT_UPDATED",
            "total_cameras": len(active_camera_ids),
            "camera_ids": active_camera_ids,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.warning(f"Could not broadcast CCTV layout update: {e}")

    logger.info(f"Spatial Digital Twin published by {payload['updated_by']} with {len(active_camera_ids)} cameras.")
    return {
        "status": "success",
        "message": f"Campus Digital Twin layout synchronized successfully ({len(active_camera_ids)} cameras live).",
        "total_cameras": len(active_camera_ids)
    }


@spatial_router.post("/room", summary="Add or Update a Spatial Room")
async def add_or_update_spatial_room(
    block_name: str = Body(...),
    floor_number: int = Body(...),
    room: SpatialRoom = Body(...),
    current_user: Dict[str, Any] = Depends(require_roles(["SUPER_ADMIN"]))
):
    """
    Adds or updates a single room's spatial footprint, appliances, and virtual meters.
    """
    layout_doc = await spatial_layout_col.find_one()
    if not layout_doc:
        layout_doc = get_default_spatial_layout()
        await spatial_layout_col.insert_one(layout_doc)

    blocks = layout_doc.get("blocks", [])
    target_block = next((b for b in blocks if b["block_name"] == block_name), None)
    if not target_block:
        target_block = {
            "block_name": block_name,
            "gps_lat": 28.6139,
            "gps_lng": 77.2090,
            "total_floors": 3,
            "floors": [],
        }
        blocks.append(target_block)

    target_floor = next((f for f in target_block.get("floors", []) if f["floor_number"] == floor_number), None)
    if not target_floor:
        target_floor = {
            "floor_number": floor_number,
            "name": f"Floor {floor_number}",
            "width": 1000,
            "height": 600,
            "rooms": [],
            "cameras": [],
        }
        target_block["floors"].append(target_floor)

    # Compute total_kw automatically from appliances
    computed_kw = round(sum(float(a.power_rating_kw_total or a.kw or 0.0) for a in room.appliances), 3)
    if computed_kw > 0:
        room.total_kw = computed_kw

    room_dict = room.model_dump()
    existing_idx = next(
        (i for i, r in enumerate(target_floor["rooms"]) if r["room_number"] == room.room_number),
        None
    )

    if existing_idx is not None:
        target_floor["rooms"][existing_idx] = room_dict
    else:
        target_floor["rooms"].append(room_dict)

    await spatial_layout_col.update_one(
        {"_id": layout_doc["_id"]},
        {"$set": {"blocks": blocks, "updated_at": datetime.utcnow().isoformat()}}
    )

    # Sync with relational collection
    await rooms_col.update_one(
        {"block_name": block_name, "floor_number": floor_number, "room_number": room.room_number},
        {
            "$set": {
                "block_name": block_name,
                "floor_number": floor_number,
                "room_number": room.room_number,
                "room_type": room.room_type,
                "appliances": room_dict["appliances"],
                "total_kw_rating": room.total_kw,
                "seating_capacity": room.seating_capacity,
                "current_status": room.status,
                "updated_at": datetime.utcnow(),
            }
        },
        upsert=True
    )

    return {"status": "success", "room": room_dict}


@spatial_router.delete("/room/{block_name}/{floor_number}/{room_number}", summary="Delete a Spatial Room")
async def delete_spatial_room(
    block_name: str,
    floor_number: int,
    room_number: str,
    current_user: Dict[str, Any] = Depends(require_roles(["SUPER_ADMIN"]))
):
    """Deletes a room from the digital twin layout and database."""
    layout_doc = await spatial_layout_col.find_one()
    if layout_doc:
        blocks = layout_doc.get("blocks", [])
        for b in blocks:
            if b["block_name"] == block_name:
                for f in b.get("floors", []):
                    if f["floor_number"] == floor_number:
                        f["rooms"] = [r for r in f.get("rooms", []) if r["room_number"] != room_number]
        await spatial_layout_col.update_one({"_id": layout_doc["_id"]}, {"$set": {"blocks": blocks}})

    await rooms_col.delete_one({"block_name": block_name, "floor_number": floor_number, "room_number": room_number})
    return {"status": "success", "message": f"Room {room_number} deleted successfully."}


@spatial_router.post("/camera", summary="Plot or Update a CCTV Camera Pin")
async def plot_spatial_camera(
    block_name: str = Body(...),
    floor_number: int = Body(...),
    camera: SpatialCamera = Body(...),
    current_user: Dict[str, Any] = Depends(require_roles(["SUPER_ADMIN"]))
):
    """Plots a CCTV camera pin on the floor canvas with coordinates, angle & RTSP link."""
    layout_doc = await spatial_layout_col.find_one()
    if not layout_doc:
        layout_doc = get_default_spatial_layout()
        await spatial_layout_col.insert_one(layout_doc)

    blocks = layout_doc.get("blocks", [])
    target_block = next((b for b in blocks if b["block_name"] == block_name), None)
    if not target_block:
        raise HTTPException(status_code=404, detail=f"Block {block_name} not found.")

    target_floor = next((f for f in target_block.get("floors", []) if f["floor_number"] == floor_number), None)
    if not target_floor:
        raise HTTPException(status_code=404, detail=f"Floor {floor_number} not found in {block_name}.")

    cam_dict = camera.model_dump()
    existing_idx = next(
        (i for i, c in enumerate(target_floor.get("cameras", [])) if c["camera_id"] == camera.camera_id),
        None
    )

    if existing_idx is not None:
        target_floor["cameras"][existing_idx] = cam_dict
    else:
        target_floor.setdefault("cameras", []).append(cam_dict)

    await spatial_layout_col.update_one(
        {"_id": layout_doc["_id"]},
        {"$set": {"blocks": blocks, "updated_at": datetime.utcnow().isoformat()}}
    )

    # Sync to cameras collection
    await cameras_col.update_one(
        {"camera_id": camera.camera_id},
        {
            "$set": {
                "camera_id": camera.camera_id,
                "name": camera.name,
                "block_name": block_name,
                "floor_number": floor_number,
                "room_number": camera.room_number,
                "rtsp_url": camera.rtsp_url,
                "detection_mode": camera.detection_mode,
                "status": camera.status,
                "x": camera.x,
                "y": camera.y,
                "angle": camera.angle,
                "updated_at": datetime.utcnow(),
            }
        },
        upsert=True
    )

    return {"status": "success", "camera": cam_dict}


@spatial_router.delete("/camera/{camera_id}", summary="Remove a CCTV Camera Pin")
async def delete_spatial_camera(
    camera_id: str,
    current_user: Dict[str, Any] = Depends(require_roles(["SUPER_ADMIN"]))
):
    """Removes a CCTV camera from spatial layout and camera stream registry."""
    layout_doc = await spatial_layout_col.find_one()
    if layout_doc:
        blocks = layout_doc.get("blocks", [])
        for b in blocks:
            for f in b.get("floors", []):
                f["cameras"] = [c for c in f.get("cameras", []) if c["camera_id"] != camera_id]
        await spatial_layout_col.update_one({"_id": layout_doc["_id"]}, {"$set": {"blocks": blocks}})

    await cameras_col.delete_one({"camera_id": camera_id})
    return {"status": "success", "message": f"Camera {camera_id} removed."}


@spatial_router.post("/reset-default", summary="Reset Campus Layout to Default Template")
async def reset_campus_layout_default(
    current_user: Dict[str, Any] = Depends(require_roles(["SUPER_ADMIN"]))
):
    """Resets digital twin spatial blueprint back to canonical multi-building reference template."""
    default_layout = get_default_spatial_layout()
    default_layout["updated_at"] = datetime.utcnow().isoformat()
    default_layout["updated_by"] = current_user.get("email") or "admin"

    existing = await spatial_layout_col.find_one()
    if existing:
        await spatial_layout_col.update_one({"_id": existing["_id"]}, {"$set": default_layout})
    else:
        await spatial_layout_col.insert_one(default_layout)

    return {"status": "success", "message": "Campus layout reset to reference multi-block template.", "layout": default_layout}

