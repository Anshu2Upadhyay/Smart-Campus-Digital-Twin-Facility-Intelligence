import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import axiosClient from '../api/axiosClient';
import {
  playEmergencySiren,
  playWorkorderAlert,
  playResolvedSuccess,
} from '../utils/soundEffects';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [liveStaffLocations, setLiveStaffLocations] = useState({});
  const [lastGps, setLastGps] = useState(null);

  const socketRef = useRef(null);
  const gpsIntervalRef = useRef(null);
  const watchIdRef = useRef(null);
  const currentCoordsRef = useRef({ lat: 28.6139, lng: 77.2090 });
  const walkIntervalRef = useRef(null);

  // Initialize coordinates from user profile if available
  useEffect(() => {
    if (user?.lat && user?.lng) {
      currentCoordsRef.current = { lat: parseFloat(user.lat), lng: parseFloat(user.lng) };
    }
  }, [user?.lat, user?.lng]);

  // =========================================================================
  // 1. WEBSOCKET CONNECTION LIFECYCLE (WITH AUTO-RECONNECT)
  // =========================================================================
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      setConnected(false);
      return;
    }

    const rawUserId = user.staff_id || user.id || user._id;
    const role = user.role || 'GUEST';
    const userId = rawUserId || (role === 'SUPER_ADMIN' ? 'admin-global' : 'anonymous');
    const wsBase =
      import.meta.env.VITE_WS_URL ||
      (window.location.protocol === 'https:' ? 'wss:' : 'ws:') +
        '//' +
        (window.location.hostname || 'localhost') +
        ':8000';

    const wsUrl = `${wsBase}/ws/${encodeURIComponent(role)}/${encodeURIComponent(userId)}`;
    let isSubscribed = true;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          setConnected(true);
          console.log(`[WebSocket] 🟢 Live connection established: role=${role}, user=${userId}`);
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const payload = JSON.parse(event.data);
            handleIncomingMessage(payload);
          } catch (err) {
            console.error('Error parsing incoming WebSocket frame:', err);
          }
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          setConnected(false);
          console.log('[WebSocket] 🔴 Connection closed. Auto-reconnecting in 3 seconds...');
          setTimeout(() => {
            if (isSubscribed && isAuthenticated) {
              connectWebSocket();
            }
          }, 3000);
        };

        ws.onerror = (err) => {
          if (isSubscribed) {
            console.warn('[WebSocket] Warning/error event:', err);
          }
        };

        setSocket(ws);
      } catch (err) {
        console.error('[WebSocket] Initialization error:', err);
      }
    };

    connectWebSocket();

    return () => {
      isSubscribed = false;
      if (socketRef.current) {
        const currentWs = socketRef.current;
        if (currentWs.readyState === WebSocket.OPEN) {
          currentWs.close(1000, 'Component unmounted');
        } else if (currentWs.readyState === WebSocket.CONNECTING) {
          currentWs.onopen = () => {
            try {
              currentWs.close(1000, 'Component unmounted');
            } catch {
              // ignore
            }
          };
        }
      }
    };
  }, [isAuthenticated, user?.id, user?.staff_id, user?.role]);

  // =========================================================================
  // 2. INCOMING EVENT DISPATCHER & ACOUSTIC SIREN TRIGGER
  // =========================================================================
  const handleIncomingMessage = (payload) => {
    const { type, data } = payload;
    const timestamp = new Date().toLocaleTimeString();

    setLastEvent({ type, data, timestamp: new Date().toISOString() });

    // Sound triggers based on urgency
    if (
      [
        'PANIC_SOS_TRIGGERED',
        'AI_THREAT_DETECTED',
        'EMERGENCY_DISPATCH',
        'BACKUP_REQUESTED_ALERT',
        'SLA_ESCALATED_CRITICAL',
      ].includes(type)
    ) {
      playEmergencySiren();
    } else if (
      [
        'NEW_TASK_DISPATCHED',
        'NEW_FACILITY_WORKORDER',
        'WORKORDER_DISPATCHED',
        'SLA_MISSED_REASSIGNED',
      ].includes(type)
    ) {
      playWorkorderAlert();
    } else if (
      ['WORKORDER_RESOLVED', 'INCIDENT_RESOLVED'].includes(type)
    ) {
      playResolvedSuccess();
    }

    // Update real-time staff locations cache
    if (type === 'STAFF_GPS_UPDATED' || type === 'GPS_UPDATED') {
      if (data) {
        const staffKey = data.staff_id || data.user_id;
        if (staffKey) {
          setLiveStaffLocations((prev) => ({
            ...prev,
            [staffKey]: data,
          }));
        }
      }
      return; // Location update handled without triggering heavy component re-renders
    }

    // Ignore raw keepalive frames
    if (type === 'PING' || type === 'PONG') {
      return;
    }

    // Append to live notifications list (only for high-level events/alerts)
    const newNotice = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      data: data || {},
      timestamp,
      read: false,
    };
    setNotifications((prev) => [newNotice, ...prev.slice(0, 49)]);
  };

  // =========================================================================
  // 3. CONTINUOUS 5-SECOND GPS TRANSMITTER FOR GUARDS & WORKERS
  // =========================================================================
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const isFieldStaff = user.role === 'SECURITY_GUARD' || user.role === 'GROUND_WORKER';
    const isDutyActive = user.duty_state !== 'OFF_DUTY';

    if (isFieldStaff && isDutyActive) {
      const sendGpsPing = (lat, lng, accuracy = 4.0, floor = user.current_floor || 1) => {
        currentCoordsRef.current = { lat, lng };

        const pingPayload = {
          type: 'GPS_PING',
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          accuracy: parseFloat(accuracy),
          floor_number: parseInt(floor),
          floor: parseInt(floor),
        };

        // 1. Send over WebSocket for sub-100ms map sync
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify(pingPayload));
        }

        // 2. Transmit to REST endpoint for guaranteed database persistence
        const endpoint = user.role === 'SECURITY_GUARD' ? '/guard/gps-ping' : '/worker/gps-ping';
        axiosClient
          .post(endpoint, pingPayload)
          .catch((err) => console.debug('REST GPS ping fallback notice:', err.message));

        setLastGps({ lat, lng, accuracy, floor, timestamp: new Date() });
      };

      // Watch physical device position if supported
      if ('geolocation' in navigator) {
        try {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              sendGpsPing(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
            },
            () => {
              // Geolocation denied or indoor testing fallback: use current coords with patrol jitter
            },
            { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 }
          );
        } catch (e) {
          console.debug('Geolocation watch exception:', e);
        }
      }

      // Periodic 5-second guarantee loop (ensures map stays alive even on desktop testing)
      gpsIntervalRef.current = setInterval(() => {
        const { lat, lng } = currentCoordsRef.current;
        // Minor realistic patrol jitter (± 3 meters)
        const jitterLat = lat + (Math.random() - 0.5) * 0.00005;
        const jitterLng = lng + (Math.random() - 0.5) * 0.00005;
        sendGpsPing(jitterLat, jitterLng, 3.8);
      }, 5000);
    }

    return () => {
      if (gpsIntervalRef.current) {
        clearInterval(gpsIntervalRef.current);
      }
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isAuthenticated, user?.role, user?.duty_state, user?.current_floor]);

  // =========================================================================
  // 4. SIMULATE WALK TOWARDS INCIDENT / ROOM (FOR 1-CLICK DEMO TESTING)
  // =========================================================================
  const simulateWalkTowards = (targetLat, targetLng, steps = 10, intervalMs = 800) => {
    if (!targetLat || !targetLng) return;

    if (walkIntervalRef.current) {
      clearInterval(walkIntervalRef.current);
    }

    let currentStep = 0;
    const startLat = currentCoordsRef.current.lat;
    const startLng = currentCoordsRef.current.lng;

    const dLat = (targetLat - startLat) / steps;
    const dLng = (targetLng - startLng) / steps;

    walkIntervalRef.current = setInterval(() => {
      currentStep += 1;
      const nextLat = startLat + dLat * currentStep;
      const nextLng = startLng + dLng * currentStep;
      currentCoordsRef.current = { lat: nextLat, lng: nextLng };

      const pingPayload = {
        type: 'GPS_PING',
        lat: nextLat,
        lng: nextLng,
        accuracy: 2.5,
        floor_number: user?.current_floor || 1,
      };

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(pingPayload));
      }

      setLastGps({ lat: nextLat, lng: nextLng, timestamp: new Date() });

      if (currentStep >= steps) {
        clearInterval(walkIntervalRef.current);
      }
    }, intervalMs);
  };

  // Notification actions
  const clearNotifications = () => setNotifications([]);

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    socket,
    connected,
    lastEvent,
    notifications,
    unreadCount,
    liveStaffLocations,
    lastGps,
    clearNotifications,
    markNotificationsRead,
    simulateWalkTowards,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
