import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from fastapi import WebSocket

from app.database import audit_logs_col, serialize_doc
from app.models.user import UserRole
from app.models.attendance import AuditSeverity

logger = logging.getLogger("smart_campus.websocket")


class ConnectionManager:
    """
    Central WebSocket Connection Manager & Real-Time Event Dispatcher.
    Enables low-latency bidirectional communication between field personnel
    and central supervisory dashboards without client polling.
    """

    def __init__(self):
        # Map: user_id -> List[WebSocket] (A user may have multiple active devices/browser tabs)
        self.active_user_connections: Dict[str, List[WebSocket]] = {}
        # Map: role -> List[WebSocket]
        self.active_role_connections: Dict[str, List[WebSocket]] = {}
        # Connection metadata: WebSocket -> {"role": str, "user_id": str}
        self.connection_meta: Dict[WebSocket, Dict[str, str]] = {}

    async def connect(self, websocket: WebSocket, role: str, user_id: str) -> None:
        """Accepts and registers an incoming WebSocket connection."""
        await websocket.accept()

        norm_role = str(role).strip().upper()
        norm_user_id = str(user_id).strip()

        # Track by user_id
        if norm_user_id not in self.active_user_connections:
            self.active_user_connections[norm_user_id] = []
        self.active_user_connections[norm_user_id].append(websocket)

        # Track by role
        if norm_role not in self.active_role_connections:
            self.active_role_connections[norm_role] = []
        self.active_role_connections[norm_role].append(websocket)

        self.connection_meta[websocket] = {"role": norm_role, "user_id": norm_user_id}
        logger.info(f"WebSocket client connected: user_id='{norm_user_id}', role='{norm_role}' (Active users: {len(self.active_user_connections)})")

    def disconnect(self, websocket: WebSocket, role: Optional[str] = None, user_id: Optional[str] = None) -> None:
        """Unregisters and removes a disconnected WebSocket cleanly."""
        meta = self.connection_meta.pop(websocket, None)
        conn_role = meta.get("role") if meta else role
        conn_user = meta.get("user_id") if meta else user_id

        if conn_user and conn_user in self.active_user_connections:
            if websocket in self.active_user_connections[conn_user]:
                self.active_user_connections[conn_user].remove(websocket)
            if not self.active_user_connections[conn_user]:
                del self.active_user_connections[conn_user]

        if conn_role and conn_role in self.active_role_connections:
            if websocket in self.active_role_connections[conn_role]:
                self.active_role_connections[conn_role].remove(websocket)
            if not self.active_role_connections[conn_role]:
                del self.active_role_connections[conn_role]

        logger.info(f"WebSocket client disconnected: user_id='{conn_user}', role='{conn_role}'")

    def _normalize_payload(self, event_or_payload: Union[str, Dict[str, Any]], data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Supports both send(event_type, data) and send(payload_dict) call signatures."""
        if isinstance(event_or_payload, dict):
            payload = event_or_payload
            if "timestamp" not in payload:
                payload["timestamp"] = datetime.utcnow().isoformat()
            return payload
        return {
            "type": str(event_or_payload),
            "data": data or {},
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def send_to_user(
        self,
        user_id: str,
        event_or_payload: Union[str, Dict[str, Any]],
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Sends targeted event directly to all active sockets of a specific user."""
        norm_user_id = str(user_id).strip()
        sockets = self.active_user_connections.get(norm_user_id, [])
        if not sockets:
            logger.debug(f"User '{norm_user_id}' has no active WebSocket connections.")
            return

        payload = self._normalize_payload(event_or_payload, data)
        message_text = json.dumps(payload, default=str)
        dead_sockets: List[WebSocket] = []

        for ws in sockets:
            try:
                await ws.send_text(message_text)
            except Exception as exc:
                logger.warning(f"Error sending message to user '{norm_user_id}': {exc}")
                dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect(ws)

    async def broadcast_to_role(
        self,
        role: str,
        event_or_payload: Union[str, Dict[str, Any]],
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Broadcasts event message to all clients of a given role."""
        norm_role = str(role).strip().upper()
        sockets = self.active_role_connections.get(norm_role, [])
        if not sockets:
            return

        payload = self._normalize_payload(event_or_payload, data)
        message_text = json.dumps(payload, default=str)
        dead_sockets: List[WebSocket] = []

        for ws in sockets:
            try:
                await ws.send_text(message_text)
            except Exception as exc:
                logger.warning(f"Error broadcasting to role '{norm_role}': {exc}")
                dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect(ws)

    async def broadcast_to_roles(
        self,
        roles: List[str],
        event_or_payload: Union[str, Dict[str, Any]],
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Broadcasts event message across multiple roles without duplicate delivery."""
        seen_sockets = set()
        payload = self._normalize_payload(event_or_payload, data)
        message_text = json.dumps(payload, default=str)
        dead_sockets: List[WebSocket] = []

        for r in roles:
            norm_r = str(r).strip().upper()
            for ws in self.active_role_connections.get(norm_r, []):
                if ws not in seen_sockets:
                    seen_sockets.add(ws)
                    try:
                        await ws.send_text(message_text)
                    except Exception as exc:
                        logger.warning(f"Error broadcasting to role '{norm_r}': {exc}")
                        dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect(ws)

    async def broadcast_all(
        self,
        event_or_payload: Union[str, Dict[str, Any]],
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Broadcasts event message to every single connected client across all portals."""
        payload = self._normalize_payload(event_or_payload, data)
        message_text = json.dumps(payload, default=str)
        dead_sockets: List[WebSocket] = []

        for ws in list(self.connection_meta.keys()):
            try:
                await ws.send_text(message_text)
            except Exception as exc:
                logger.warning(f"Error broadcasting to all sockets: {exc}")
                dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect(ws)

    async def emit_audit_and_notify(
        self,
        event_type: str,
        title: str,
        description: str,
        severity: str = "INFO",
        actor_name: str = "System",
        actor_role: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        target_roles: Optional[List[str]] = None,
        target_user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Atomically records an immutable event in global_audit_logs collection
        and simultaneously pushes real-time WebSocket notifications to administrators
        and designated target roles.
        """
        import uuid
        now = datetime.utcnow()
        doc = {
            "event_id": f"EVT-{uuid.uuid4().hex[:8].upper()}",
            "event_type": str(event_type),
            "severity": str(severity),
            "title": title,
            "description": description,
            "actor_name": actor_name,
            "actor_role": actor_role,
            "metadata": metadata or {},
            "timestamp": now,
        }

        try:
            res = await audit_logs_col.insert_one(doc)
            doc["_id"] = res.inserted_id
        except Exception as exc:
            logger.error(f"Failed to record audit log in database: {exc}", exc_info=True)

        clean_doc = serialize_doc(doc) or {}

        # Broadcast AUDIT_LOG_CREATED to Super Admin
        await self.broadcast_to_role(UserRole.SUPER_ADMIN.value, {
            "type": "AUDIT_LOG_CREATED",
            "data": clean_doc,
        })

        # Broadcast to specific target roles if requested
        if target_roles:
            await self.broadcast_to_roles(target_roles, {
                "type": event_type,
                "data": clean_doc,
            })

        # Send to specific user if requested
        if target_user_id:
            await self.send_to_user(target_user_id, {
                "type": event_type,
                "data": clean_doc,
            })

        return clean_doc

    async def handle_incoming_message(self, websocket: WebSocket, raw_text: str) -> None:
        """
        Parses and handles real-time messages transmitted by mobile clients over WebSocket.
        """
        try:
            data = json.loads(raw_text)
        except Exception:
            await websocket.send_text(json.dumps({"error": "Invalid JSON format"}))
            return

        msg_type = data.get("type")
        meta = self.connection_meta.get(websocket, {})
        user_id = meta.get("user_id")
        role = meta.get("role")

        if msg_type == "PING":
            await websocket.send_text(json.dumps({
                "type": "PONG",
                "timestamp": datetime.utcnow().isoformat(),
            }))
            return

        if msg_type == "GPS_PING":
            await self._process_gps_ping(user_id, role, data)
            return

        logger.debug(f"Received custom WebSocket message '{msg_type}' from user_id='{user_id}'")

    async def _process_gps_ping(
        self,
        user_id: Optional[str],
        role: Optional[str],
        data: Dict[str, Any],
    ) -> None:
        """
        Processes live GPS location heartbeat from Mobile Staff Application:
        1. Updates MongoDB users_col and attendance_col with 2dsphere Point coordinates.
        2. Broadcasts STAFF_GPS_UPDATED to Super Admin, Security Head, and Facility Supervisor.
        """
        if not user_id:
            return

        lat = data.get("lat")
        lng = data.get("lng")
        accuracy = data.get("accuracy", 5.0)
        floor_number = data.get("floor_number", data.get("floor", 0))

        if lat is None or lng is None:
            return

        try:
            from app.services.gps_matcher import update_staff_live_gps
            updated_info = await update_staff_live_gps(
                user_id=user_id,
                lat=float(lat),
                lng=float(lng),
                accuracy=float(accuracy),
                floor_number=int(floor_number) if floor_number is not None else None,
            )

            # Broadcast live map updates to all relevant supervisory roles
            broadcast_roles = [
                UserRole.SUPER_ADMIN.value,
                UserRole.SECURITY_HEAD.value,
                UserRole.FACILITY_SUPERVISOR.value,
            ]

            payload = {
                "type": "STAFF_GPS_UPDATED",
                "data": updated_info,
            }

            await self.broadcast_to_roles(broadcast_roles, payload)
            # Legacy alias broadcast for existing frontends expecting GPS_UPDATED
            await self.broadcast_to_roles(broadcast_roles, {
                "type": "GPS_UPDATED",
                "data": updated_info,
            })
        except Exception as exc:
            logger.error(f"Error handling live GPS ping for user '{user_id}': {exc}", exc_info=True)


# Singleton instance for system-wide access
ws_manager = ConnectionManager()
