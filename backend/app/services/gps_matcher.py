import math
import logging
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Union
from bson import ObjectId

from app.database import users_col, blocks_col, attendance_col
from app.models.user import UserRole, DutyState

logger = logging.getLogger("smart_campus.gps_matcher")

# Known Campus Landmarks & Geofencing Centers
CAMPUS_ZONES = [
    {"name": "Block-A", "lat": 28.6135, "lng": 77.2085, "radius": 65.0},
    {"name": "Block-B", "lat": 28.6139, "lng": 77.2090, "radius": 70.0},
    {"name": "Block-C", "lat": 28.6145, "lng": 77.2095, "radius": 60.0},
    {"name": "Central Library", "lat": 28.6130, "lng": 77.2094, "radius": 55.0},
    {"name": "Gate-2 Corridor", "lat": 28.6140, "lng": 77.2091, "radius": 45.0},
    {"name": "Gate-1", "lat": 28.6126, "lng": 77.2075, "radius": 50.0},
]


class GeofenceResult(dict):
    """
    Dual-type Geofence Result:
    Behaves as a comprehensive Dictionary (`res["block_name"]`) while supporting
    seamless string coercion and string methods (`res.lower()`, `str(res)`)
    for 100% backward compatibility across all existing routers and services.
    """

    @property
    def block_name(self) -> str:
        return self.get("block_name", "Campus Grounds")

    def __str__(self) -> str:
        return self.get("block_name", "Campus Grounds")

    def lower(self) -> str:
        return str(self).lower()

    def upper(self) -> str:
        return str(self).upper()

    def strip(self, *args) -> str:
        return str(self).strip(*args)

    def startswith(self, *args) -> bool:
        return str(self).startswith(*args)


# =============================================================================
# A. EXACT HAVERSINE FORMULA
# =============================================================================
def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes exact great-circle distance between two GPS coordinates
    using the Haversine formula with WGS84 mean earth radius r = 6,371,000 meters.
    Returns distance rounded to 1 decimal place.
    """
    r_earth = 6371000.0  # Earth's mean radius in meters

    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    delta_phi = math.radians(float(lat2) - float(lat1))
    delta_lambda = math.radians(float(lon2) - float(lon1))

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))

    distance = r_earth * c
    return round(distance, 1)


# =============================================================================
# B. BUILDING GEOFENCING + AUTO ZONE DETECTION
# =============================================================================
def detect_building_geofence(lat: float, lng: float) -> GeofenceResult:
    """
    Identifies which campus block or security gate a given coordinate falls inside
    or is closest to. Returns a GeofenceResult object.
    """
    closest_zone = None
    min_dist = float("inf")
    inside_flag = False

    for zone in CAMPUS_ZONES:
        dist = haversine_distance_meters(lat, lng, zone["lat"], zone["lng"])
        if dist < min_dist:
            min_dist = dist
            closest_zone = zone["name"]
            inside_flag = dist <= zone["radius"]

    if closest_zone and inside_flag:
        result = GeofenceResult({
            "block_name": closest_zone,
            "zone_label": f"Inside {closest_zone}",
            "distance_to_center_m": round(min_dist, 1),
            "is_inside_geofence": True,
        })
    elif closest_zone:
        result = GeofenceResult({
            "block_name": closest_zone,
            "zone_label": f"Near {closest_zone} ({int(min_dist)}m)",
            "distance_to_center_m": round(min_dist, 1),
            "is_inside_geofence": False,
        })
    else:
        result = GeofenceResult({
            "block_name": "Campus Grounds",
            "zone_label": "Campus Grounds",
            "distance_to_center_m": 0.0,
            "is_inside_geofence": False,
        })

    return result


# =============================================================================
# C. LIVE STAFF GPS UPDATER
# =============================================================================
async def update_staff_live_gps(
    user_id: str,
    lat: float,
    lng: float,
    accuracy: float = 5.0,
    floor_number: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Updates live GPS telemetry in MongoDB `users_col` (with 2dsphere Point coordinates)
    and synchronizes today's roll-call record in `attendance_col`.
    """
    now = datetime.utcnow()
    today_str = date.today().isoformat()
    geofence_info = detect_building_geofence(lat, lng)
    detected_block = geofence_info["block_name"]

    user_query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"staff_id": user_id}

    # Fetch existing user to preserve floor if not supplied
    existing_user = await users_col.find_one(user_query)
    current_floor = int(floor_number) if floor_number is not None else (existing_user.get("current_floor", 0) if existing_user else 0)

    update_fields: Dict[str, Any] = {
        "location": {
            "type": "Point",
            "coordinates": [float(lng), float(lat)],  # MongoDB standard [longitude, latitude]
        },
        "lat": float(lat),
        "lng": float(lng),
        "gps_accuracy": float(accuracy),
        "accuracy": float(accuracy),
        "current_block": detected_block,
        "current_floor": current_floor,
        "last_gps_ping": now,
        "updated_at": now,
    }

    updated_user = await users_col.find_one_and_update(
        user_query,
        {"$set": update_fields},
        return_document=True,
    )

    # Synchronize with today's attendance ledger
    zone_label = f"{detected_block} • Floor {current_floor}" if current_floor > 0 else detected_block
    att_update = {
        "live_gps_zone": zone_label,
        "live_zone": zone_label,
        "lat": float(lat),
        "lng": float(lng),
        "last_updated": now,
    }

    await attendance_col.update_one(
        {
            "$or": [
                {"user_id": str(user_id), "date_str": today_str},
                {"user_id": str(user_id), "date": today_str},
                {"staff_id": existing_user.get("staff_id") if existing_user else user_id, "date_str": today_str},
            ]
        },
        {"$set": att_update},
    )

    return {
        "user_id": str(user_id),
        "staff_id": updated_user.get("staff_id") if updated_user else user_id,
        "name": updated_user.get("name") if updated_user else "Staff Member",
        "role": updated_user.get("role") if updated_user else None,
        "department": updated_user.get("department") if updated_user else None,
        "duty_state": updated_user.get("duty_state", "ONLINE_FREE") if updated_user else "ONLINE_FREE",
        "lat": float(lat),
        "lng": float(lng),
        "accuracy": float(accuracy),
        "current_block": detected_block,
        "current_floor": current_floor,
        "zone_label": zone_label,
        "last_gps_ping": now.isoformat(),
    }


# =============================================================================
# D. NEAREST FREE SECURITY GUARDS FINDER
# =============================================================================
async def find_nearest_free_guards(
    incident_lat: float,
    incident_lng: float,
    limit: int = 5,
    include_busy_fallback: bool = True,
) -> List[Dict[str, Any]]:
    """
    Finds nearest security guards to an incident location.
    Prioritizes ONLINE_FREE personnel sorted by exact distance,
    with an optional fallback to BUSY_ON_TASK guards.
    """
    query: Dict[str, Any] = {
        "role": UserRole.SECURITY_GUARD.value,
        "is_active": True,
    }

    if not include_busy_fallback:
        query["duty_state"] = DutyState.ONLINE_FREE.value

    cursor = users_col.find(query)
    guards = await cursor.to_list(length=100)
    guard_candidates: List[Dict[str, Any]] = []

    for guard in guards:
        g_lat = None
        g_lng = None

        if guard.get("location") and guard["location"].get("coordinates"):
            coords = guard["location"]["coordinates"]
            g_lng, g_lat = coords[0], coords[1]
        elif guard.get("lat") and guard.get("lng"):
            g_lat, g_lng = guard["lat"], guard["lng"]

        if g_lat is None or g_lng is None:
            g_lat, g_lng = 28.6140, 77.2091  # Campus Gate-2 default

        dist_meters = haversine_distance_meters(incident_lat, incident_lng, g_lat, g_lng)
        staff_id = guard.get("staff_id", "SEC-UNKNOWN")
        name = guard.get("name", "Guard")
        duty_state = guard.get("duty_state", DutyState.ONLINE_FREE.value)
        block = guard.get("current_block") or str(detect_building_geofence(g_lat, g_lng))
        default_gate = guard.get("default_gate", "Main Campus")

        is_free = (duty_state == DutyState.ONLINE_FREE.value)
        status_badge = "🟢 Free" if is_free else ("🟡 Busy" if duty_state == DutyState.BUSY_ON_TASK.value else "⚪ Break")

        # Estimated Time of Arrival: ~1.2 m/s rapid response sprint speed
        eta_seconds = max(15, int(dist_meters / 1.2))

        guard_candidates.append({
            "guard_id": str(guard.get("_id")),
            "staff_id": staff_id,
            "name": name,
            "phone": guard.get("phone", "N/A"),
            "duty_state": duty_state,
            "status_badge": status_badge,
            "current_block": block,
            "current_floor": guard.get("current_floor", 0),
            "default_gate": default_gate,
            "lat": g_lat,
            "lng": g_lng,
            "distance_meters": dist_meters,
            "eta_seconds": eta_seconds,
            "active_tasks_count": guard.get("active_tasks_count", 0),
            "tasks_completed_today": guard.get("tasks_completed_today", 0),
            "is_free": is_free,
        })

    # Sort Order: Free guards first ascending by distance, then busy guards
    guard_candidates.sort(key=lambda g: (0 if g["is_free"] else 1, g["distance_meters"]))

    results = []
    for rank, g in enumerate(guard_candidates[:limit], start=1):
        g["rank"] = rank
        g["display_label"] = (
            f"⭐ Recommended #{rank}: {g['name']} ({g['staff_id']}) — "
            f"{g['distance_meters']}m away (Near {g['current_block']}) | Status: {g['status_badge']}"
        )
        g["formatted_summary"] = f"{g['name']} ({g['staff_id']}) — {int(g['distance_meters'])}m away | Status: {g['status_badge']}"
        results.append(g)

    return results


# =============================================================================
# E. AI SMART WORKER RECOMMENDATION ENGINE
# =============================================================================
async def recommend_smart_workers(
    target_lat: float,
    target_lng: float,
    required_department: Optional[str] = None,
    target_block: Optional[str] = None,
    target_floor: Optional[int] = 1,
    exclude_worker_ids: Optional[List[str]] = None,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Multi-Factor Optimization Engine for Ground Worker Dispatch:
    Formula:
      Score = w1(ExactDeptMatch: +55)
            + w2(GPSProximityScore: max(0, 30 - dist_meters/6))
            + w3(SameBuildingAndFloorBonus: +15)
            + w4(FreeStateBoost: +10)
            - w5(WorkloadPenalty: tasks*18 + missed*5)

    Returns ranked worker candidates with normalized Match Percentage (e.g. 98% Match).
    """
    exclude_set = set(str(wid).strip().upper() for wid in (exclude_worker_ids or []))

    query: Dict[str, Any] = {
        "role": UserRole.GROUND_WORKER.value,
        "is_active": True,
    }

    cursor = users_col.find(query)
    workers = await cursor.to_list(length=100)
    scored_workers: List[Dict[str, Any]] = []

    for worker in workers:
        wid_str = str(worker.get("_id")).upper()
        staff_id = str(worker.get("staff_id", "WRK-UNKNOWN")).upper()

        if wid_str in exclude_set or staff_id in exclude_set:
            continue

        w_lat = None
        w_lng = None

        if worker.get("location") and worker["location"].get("coordinates"):
            coords = worker["location"]["coordinates"]
            w_lng, w_lat = coords[0], coords[1]
        elif worker.get("lat") and worker.get("lng"):
            w_lat, w_lng = worker["lat"], worker["lng"]

        if w_lat is None or w_lng is None:
            w_lat, w_lng = 28.6139, 77.2090  # Campus center default

        dist_meters = haversine_distance_meters(target_lat, target_lng, w_lat, w_lng)
        worker_dept = str(worker.get("department", "GENERAL")).upper()
        req_dept = str(required_department).upper() if required_department else ""

        worker_block = str(worker.get("current_block") or detect_building_geofence(w_lat, w_lng))
        worker_floor = int(worker.get("current_floor", 0))
        duty_state = str(worker.get("duty_state", DutyState.ONLINE_FREE.value)).upper()
        active_tasks = int(worker.get("active_tasks_count", 0))
        missed_alerts = int(worker.get("missed_alerts_count", 0))

        # 1. Exact Department Match (+55 points)
        w1_dept = 0.0
        if req_dept:
            if worker_dept == req_dept:
                w1_dept = 55.0
            elif worker_dept in ["HOUSEKEEPING", "GENERAL"]:
                w1_dept = 20.0  # General facility support fallback
        else:
            w1_dept = 30.0

        # 2. GPS Proximity Score (Up to +30 points)
        # Closer worker gets higher points: max(0, 30 - dist / 6.0)
        w2_prox = max(0.0, 30.0 - (dist_meters / 6.0))

        # 3. Same Building & Same Floor Bonus (Up to +15 points)
        w3_bonus = 0.0
        same_block = False
        same_floor = False
        if target_block and worker_block.lower() == target_block.lower():
            same_block = True
            w3_bonus += 8.0
            if target_floor is not None and worker_floor == int(target_floor):
                same_floor = True
                w3_bonus += 7.0

        # 4. Duty State Availability (+10 for Free, -30 for Off Duty)
        w4_availability = 10.0 if duty_state == DutyState.ONLINE_FREE.value else (-30.0 if duty_state == DutyState.OFF_DUTY.value else -10.0)

        # 5. Active Tasks & Missed SLA Penalty
        w5_penalty = (active_tasks * 18.0) + (missed_alerts * 5.0)

        raw_score = w1_dept + w2_prox + w3_bonus + w4_availability - w5_penalty

        # Normalize score into realistic match percentage (1% to 99%)
        match_pct = max(1, min(99, int(round(raw_score))))

        status_badge = "🟢 Free" if duty_state == DutyState.ONLINE_FREE.value else ("🟡 Busy" if duty_state == DutyState.BUSY_ON_TASK.value else "⚪ Off")
        eta_seconds = max(20, int(dist_meters / 1.1))

        display_label = (
            f"🤖 {match_pct}% Match: {worker.get('name')} ({worker_dept}) — "
            f"Status: {status_badge} | GPS Distance: {dist_meters}m away "
            f"({'Already in ' + target_block if same_block else 'In ' + worker_block}, Floor {worker_floor})"
        )

        scored_workers.append({
            "worker_id": str(worker.get("_id")),
            "staff_id": staff_id,
            "name": worker.get("name", "Technician"),
            "phone": worker.get("phone", "N/A"),
            "department": worker_dept,
            "duty_state": duty_state,
            "status_badge": status_badge,
            "current_block": worker_block,
            "current_floor": worker_floor,
            "lat": w_lat,
            "lng": w_lng,
            "distance_meters": dist_meters,
            "same_block": same_block,
            "same_floor": same_floor,
            "active_tasks_count": active_tasks,
            "tasks_completed_today": worker.get("tasks_completed_today", 0),
            "missed_alerts_count": missed_alerts,
            "eta_seconds": eta_seconds,
            "raw_score": round(raw_score, 1),
            "match_percentage": f"{match_pct}% Match",
            "match_numeric": match_pct,
            "score_breakdown": {
                "dept_match_score": w1_dept,
                "gps_proximity_score": round(w2_prox, 1),
                "floor_bonus_score": w3_bonus,
                "workload_penalty": round(w5_penalty, 1),
            },
            "display_label": display_label,
        })

    # Sort descending by match score
    scored_workers.sort(key=lambda w: w["raw_score"], reverse=True)
    return scored_workers[:limit]
