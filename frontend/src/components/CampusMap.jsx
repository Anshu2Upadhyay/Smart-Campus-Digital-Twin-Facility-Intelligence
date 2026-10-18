import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, Wrench, AlertTriangle, Zap, Radio, Navigation, Eye, User, Clock } from 'lucide-react';

// Fix Vite default marker icon broken image path
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to dynamically re-center map when props change
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

// Custom SVG DivIcon Generator (No external PNG dependency)
const createDivIcon = ({ bgClass, label, pulse = false, iconSymbol = '' }) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        ${pulse ? '<div class="absolute -inset-2 rounded-full bg-red-500/50 beacon-pulse-fast"></div>' : ''}
        <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-xl border-2 border-white/90 text-white font-mono font-bold text-[10px] ${bgClass}">
          ${iconSymbol || label}
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// Known Campus Building Geofence Polygons
const DEFAULT_CAMPUS_BUILDINGS = [
  {
    name: 'Block-A',
    displayName: 'Block-A (Academic & Computer Labs)',
    coords: [
      [28.6138, 77.2081],
      [28.6138, 77.2089],
      [28.6132, 77.2089],
      [28.6132, 77.2081],
    ],
    defaultColor: '#06b6d4',
  },
  {
    name: 'Block-B',
    displayName: 'Block-B (Smart Classrooms & Demo Room 204)',
    coords: [
      [28.6142, 77.2086],
      [28.6142, 77.2094],
      [28.6136, 77.2094],
      [28.6136, 77.2086],
    ],
    defaultColor: '#10b981',
  },
  {
    name: 'Block-C',
    displayName: 'Block-C (Engineering Workshops & Cafeteria)',
    coords: [
      [28.6148, 77.2091],
      [28.6148, 77.2099],
      [28.6142, 77.2099],
      [28.6142, 77.2091],
    ],
    defaultColor: '#8b5cf6',
  },
  {
    name: 'Central Library',
    displayName: 'Central Digital Library & Reading Hall',
    coords: [
      [28.6133, 77.2090],
      [28.6133, 77.2098],
      [28.6127, 77.2098],
      [28.6127, 77.2090],
    ],
    defaultColor: '#3b82f6',
  },
  {
    name: 'Gate-2 Corridor',
    displayName: 'Gate-2 Security Checkpoint Corridor',
    coords: [
      [28.6143, 77.2089],
      [28.6143, 77.2094],
      [28.6139, 77.2094],
      [28.6139, 77.2089],
    ],
    defaultColor: '#f59e0b',
  },
  {
    name: 'Gate-1',
    displayName: 'Main Entrance Gate-1 & Turnstiles',
    coords: [
      [28.6129, 77.2071],
      [28.6129, 77.2079],
      [28.6123, 77.2079],
      [28.6123, 77.2071],
    ],
    defaultColor: '#64748b',
  },
];

export const CampusMap = ({
  buildings = DEFAULT_CAMPUS_BUILDINGS,
  guards = [],
  workers = [],
  securityIncidents = [],
  facilityWorkorders = [],
  center = [28.6139, 77.2090],
  zoom = 17,
  height = '460px',
  onSelectIncident,
  showLegend = true,
}) => {
  // Normalize security incidents list (handling prop aliases)
  const activeSecurityIncidents = useMemo(() => {
    return (securityIncidents || []).filter(
      (inc) => inc.status !== 'RESOLVED' && inc.status !== 'DISMISSED_FALSE_ALARM'
    );
  }, [securityIncidents]);

  // Normalize facility workorders list
  const activeFacilityWorkorders = useMemo(() => {
    return (facilityWorkorders || []).filter((wo) => wo.status !== 'RESOLVED');
  }, [facilityWorkorders]);

  // Determine active alert blocks
  const alertBlocks = useMemo(() => {
    const set = new Set();
    activeSecurityIncidents.forEach((inc) => {
      if (inc.block_name) set.add(inc.block_name.trim().toLowerCase());
    });
    activeFacilityWorkorders.forEach((wo) => {
      if (wo.block_name) set.add(wo.block_name.trim().toLowerCase());
    });
    return set;
  }, [activeSecurityIncidents, activeFacilityWorkorders]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl dark-tiles" style={{ height }}>
      {/* Top Header Badge */}
      <div className="absolute top-3 left-3 z-[1000] glass-panel px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center space-x-2 text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-bold text-slate-200">Campus Digital Twin</span>
        <span className="text-slate-400 font-mono text-[11px]">| WGS84 2dsphere Grid</span>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%', background: '#020617' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={center} zoom={zoom} />

        {/* High-Contrast Dark CartoDB Matter Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        {/* ================================================================= */}
        {/* 1. BUILDING GEOFENCE POLYGONS (BLINKING RED ON ACTIVE ALERT)     */}
        {/* ================================================================= */}
        {(buildings.length > 0 ? buildings : DEFAULT_CAMPUS_BUILDINGS).map((b, idx) => {
          const isAlert =
            alertBlocks.has(b.name?.toLowerCase()) ||
            b.has_active_alert ||
            b.status === 'ALERT';

          const strokeColor = isAlert ? '#ef4444' : b.defaultColor || '#06b6d4';
          const fillColor = isAlert ? '#ef4444' : b.defaultColor || '#06b6d4';

          return (
            <Polygon
              key={`bld_${b.name || idx}`}
              positions={b.coords || b.coordinates}
              pathOptions={{
                color: strokeColor,
                fillColor: fillColor,
                fillOpacity: isAlert ? 0.45 : 0.20,
                weight: isAlert ? 3 : 2,
                className: isAlert ? 'building-red-alert' : '',
              }}
            >
              <Tooltip sticky>
                <div className="p-1 font-sans text-xs">
                  <div className="font-bold text-slate-100">{b.displayName || b.name}</div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isAlert ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                    {isAlert ? '🚨 ACTIVE ALERT DETECTED' : '🟢 NORMAL STATUS'}
                  </div>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* ================================================================= */}
        {/* 2. LIVE ON-DUTY SECURITY GUARDS (BLUE DOTS 🔵)                    */}
        {/* ================================================================= */}
        {guards.map((guard) => {
          const gLat = parseFloat(guard.lat || (guard.location?.coordinates?.[1]) || 28.6140);
          const gLng = parseFloat(guard.lng || (guard.location?.coordinates?.[0]) || 77.2091);
          if (isNaN(gLat) || isNaN(gLng)) return null;

          const isFree = guard.duty_state === 'ONLINE_FREE';
          const guardIcon = createDivIcon({
            bgClass: isFree ? 'bg-blue-600' : 'bg-amber-600',
            label: 'SEC',
            iconSymbol: '🛡️',
          });

          return (
            <Marker key={`guard_${guard.id || guard.staff_id}`} position={[gLat, gLng]} icon={guardIcon}>
              <Popup>
                <div className="p-2 space-y-1.5 text-slate-200 text-xs font-sans min-w-[180px]">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                    <span className="font-bold text-blue-400">{guard.name || 'Security Guard'}</span>
                    <span className="font-mono text-[10px] text-slate-400">{guard.staff_id}</span>
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <div>
                      Status: <strong className={isFree ? 'text-emerald-400' : 'text-amber-400'}>{guard.duty_state || 'ONLINE_FREE'}</strong>
                    </div>
                    <div>Location: {guard.current_block || 'Campus Grounds'}</div>
                    <div className="font-mono text-[10px] text-slate-400">
                      GPS: {gLat.toFixed(5)}, {gLng.toFixed(5)}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ================================================================= */}
        {/* 3. LIVE ON-DUTY GROUND WORKERS (ORANGE DOTS 🟠)                   */}
        {/* ================================================================= */}
        {workers.map((worker) => {
          const wLat = parseFloat(worker.lat || (worker.location?.coordinates?.[1]) || 28.6139);
          const wLng = parseFloat(worker.lng || (worker.location?.coordinates?.[0]) || 77.2090);
          if (isNaN(wLat) || isNaN(wLng)) return null;

          const workerIcon = createDivIcon({
            bgClass: 'bg-amber-600',
            label: 'WRK',
            iconSymbol: '🔧',
          });

          return (
            <Marker key={`worker_${worker.id || worker.staff_id}`} position={[wLat, wLng]} icon={workerIcon}>
              <Popup>
                <div className="p-2 space-y-1.5 text-slate-200 text-xs font-sans min-w-[180px]">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                    <span className="font-bold text-amber-400">{worker.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{worker.staff_id}</span>
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <div>Trade: <strong className="text-cyan-400">{worker.department}</strong></div>
                    <div>Floor: {worker.current_floor || 1} ({worker.current_block || 'Block-B'})</div>
                    <div>Status: <span className="text-emerald-400">{worker.duty_state}</span></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ================================================================= */}
        {/* 4. ACTIVE SECURITY & PANIC SOS INCIDENTS (BLINKING RED SIREN 🚨)  */}
        {/* ================================================================= */}
        {activeSecurityIncidents.map((inc) => {
          const iLat = parseFloat(inc.lat || (inc.location?.coordinates?.[1]) || 28.61405);
          const iLng = parseFloat(inc.lng || (inc.location?.coordinates?.[0]) || 77.20912);
          if (isNaN(iLat) || isNaN(iLng)) return null;

          const sosIcon = createDivIcon({
            bgClass: 'bg-rose-600',
            label: 'SOS',
            pulse: true,
            iconSymbol: '🚨',
          });

          return (
            <Marker
              key={`inc_${inc.id || inc.incident_code}`}
              position={[iLat, iLng]}
              icon={sosIcon}
              eventHandlers={{
                click: () => onSelectIncident && onSelectIncident(inc),
              }}
            >
              <Popup>
                <div className="p-2 space-y-1.5 text-slate-200 text-xs font-sans min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-red-500/40 pb-1">
                    <span className="font-bold text-rose-400">{inc.threat_type || 'SECURITY ALERT'}</span>
                    <span className="font-mono text-[10px] bg-red-950 px-1 rounded text-red-300">
                      {inc.severity || 'CRITICAL'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">{inc.description || inc.location_name}</p>
                  <div className="text-[10px] text-slate-400">
                    Status: <strong className="text-amber-300">{inc.status}</strong>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ================================================================= */}
        {/* 5. ACTIVE GHOST ENERGY & FAULT TICKETS (AMBER LIGHTNING PIN ⚡)   */}
        {/* ================================================================= */}
        {activeFacilityWorkorders.map((wo) => {
          const fLat = parseFloat(wo.lat || (wo.location?.coordinates?.[1]) || 28.6139);
          const fLng = parseFloat(wo.lng || (wo.location?.coordinates?.[0]) || 77.2090);
          if (isNaN(fLat) || isNaN(fLng)) return null;

          const energyIcon = createDivIcon({
            bgClass: 'bg-yellow-500',
            label: '⚡',
            pulse: true,
            iconSymbol: '⚡',
          });

          return (
            <Marker key={`wo_${wo.id || wo.workorder_code}`} position={[fLat, fLng]} icon={energyIcon}>
              <Popup>
                <div className="p-2 space-y-1 text-slate-200 text-xs font-sans min-w-[190px]">
                  <div className="font-bold text-amber-400 flex items-center justify-between border-b border-amber-500/30 pb-1">
                    <span>{wo.source === 'AI_GHOST_ENERGY' ? 'Ghost Energy Drain' : 'Facility Grievance'}</span>
                    <span className="text-[10px] font-mono text-amber-300">{wo.wasted_power_kw || wo.wasted_kw || 3.54} kW</span>
                  </div>
                  <div className="text-[11px]">{wo.room_number} ({wo.block_name}, Floor {wo.floor_number})</div>
                  <div className="text-[10px] text-slate-400">Status: <span className="text-cyan-400">{wo.status}</span></div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Interactive Legend Bar at Bottom */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] glass-panel px-3 py-2 rounded-xl border border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-2 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500"></span>
              <span className="text-slate-300">Guard (GPS)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500"></span>
              <span className="text-slate-300">Worker (GPS)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-rose-300 font-semibold">Security / SOS Alert</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400"></span>
              <span className="text-yellow-300">Ghost Energy (kW)</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono hidden md:block">
            Sub-millisecond Haversine & Geofence Active
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusMap;
