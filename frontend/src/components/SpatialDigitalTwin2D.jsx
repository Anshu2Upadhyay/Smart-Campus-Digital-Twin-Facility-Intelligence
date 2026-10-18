import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import MOCK_ASSETS from '../utils/mockAssets';
import {
  Building,
  Video,
  Zap,
  Shield,
  Wrench,
  AlertTriangle,
  Radio,
  Eye,
  Maximize2,
  RefreshCw,
  Info,
  CheckCircle2,
  X,
  Play,
  RotateCw,
  Search,
  Filter,
  Navigation,
  Flame,
  Users,
  UserCheck,
} from 'lucide-react';

/**
 * DEFAULT CANONICAL SPATIAL LAYOUT
 * Exactly matches the architectural floor plan from the campus blueprint.
 */
const DEFAULT_SPATIAL_LAYOUT = {
  campus_name: 'Smart Campus Digital Twin & Facility Intelligence Platform',
  center_gps: { lat: 28.6139, lng: 77.209 },
  blocks: [
    {
      block_name: 'Block-B',
      gps_lat: 28.6139,
      gps_lng: 77.209,
      total_floors: 2,
      floors: [
        {
          floor_number: 1,
          name: 'Floor 1 (Ground Floor)',
          width: 1000,
          height: 600,
          rooms: [
            {
              room_number: '101',
              room_type: 'CLASSROOM',
              x: 50,
              y: 50,
              width: 175,
              height: 125,
              seating_capacity: 60,
              color: '#0f172a',
              total_kw: 1.85,
              status: 'NORMAL',
              appliances: [{ name: 'AC Unit', count: 1, kw: 1.5 }],
              cctv_ids: ['CAM-B-101'],
            },
            {
              room_number: '102',
              room_type: 'LAB',
              x: 245,
              y: 50,
              width: 195,
              height: 125,
              seating_capacity: 40,
              color: '#0f172a',
              total_kw: 4.2,
              status: 'NORMAL',
              appliances: [{ name: 'Lab Workstations', count: 20, kw: 3.5 }],
              cctv_ids: ['CAM-B-102'],
            },
            {
              room_number: 'CORRIDOR-1',
              room_type: 'CORRIDOR',
              x: 50,
              y: 205,
              width: 790,
              height: 55,
              seating_capacity: 30,
              color: '#0d1527',
              total_kw: 0.45,
              status: 'NORMAL',
              appliances: [{ name: 'Emergency Lights', count: 4, kw: 0.08 }],
              cctv_ids: ['CAM-101'],
            },
          ],
          cameras: [],
        },
        {
          floor_number: 2,
          name: 'Floor 2 (Academic Wing)',
          width: 960,
          height: 420,
          rooms: [
            // Top Row (y: 25, height: 120)
            {
              room_number: 'STAIRS-1',
              room_type: 'STAIRS',
              name: 'Stairs-1',
              x: 35,
              y: 25,
              width: 55,
              height: 120,
              seating_capacity: 0,
              total_kw: 0.1,
              status: 'NORMAL',
              appliances: [],
              cctv_ids: [],
            },
            {
              room_number: '201',
              room_type: 'CLASSROOM',
              name: 'Classroom',
              x: 98,
              y: 25,
              width: 132,
              height: 120,
              seating_capacity: 60,
              dimensions: '8.0 x 6.0 m',
              total_kw: 2.06,
              status: 'NORMAL',
              appliances: [
                { name: 'Split AC (1.5 Ton)', count: 1, kw: 1.5 },
                { name: 'LED Tube Lights', count: 6, kw: 0.24 },
                { name: 'Ceiling Fans', count: 4, kw: 0.32 },
              ],
              cctv_ids: ['CAM-B-201'],
            },
            {
              room_number: '202',
              room_type: 'CLASSROOM',
              name: 'Classroom',
              x: 238,
              y: 25,
              width: 132,
              height: 120,
              seating_capacity: 60,
              dimensions: '8.0 x 6.0 m',
              total_kw: 2.15,
              status: 'NORMAL',
              appliances: [
                { name: 'Split AC (1.5 Ton)', count: 1, kw: 1.5 },
                { name: 'LED Lights', count: 6, kw: 0.25 },
              ],
              cctv_ids: ['CAM-B-202'],
            },
            {
              room_number: '203',
              room_type: 'LAB',
              name: 'Lab (AI/ML)',
              x: 378,
              y: 25,
              width: 132,
              height: 120,
              seating_capacity: 40,
              dimensions: '8.0 x 6.0 m',
              total_kw: 4.82,
              status: 'OCCUPIED',
              appliances: [
                { name: 'Precision AC', count: 1, kw: 2.2 },
                { name: 'Workstations', count: 20, kw: 2.3 },
              ],
              cctv_ids: ['CAM-B-203'],
            },
            {
              room_number: '204',
              room_type: 'CLASSROOM',
              name: 'Classroom',
              x: 518,
              y: 25,
              width: 135,
              height: 120,
              seating_capacity: 60,
              dimensions: '8.0 x 6.0 m',
              total_kw: 3.54,
              status: 'ALERT',
              appliances: [
                { name: 'Dual Inverter AC (2.0 Ton)', count: 1, kw: 2.8 },
                { name: 'LED Panel Fixtures', count: 8, kw: 0.44 },
                { name: 'Projector', count: 1, kw: 0.3 },
              ],
              cctv_ids: ['CAM-01'],
            },
            {
              room_number: '205',
              room_type: 'AUDITORIUM',
              name: 'Seminar Hall',
              x: 661,
              y: 25,
              width: 135,
              height: 120,
              seating_capacity: 80,
              dimensions: '8.0 x 6.0 m',
              total_kw: 5.6,
              status: 'NORMAL',
              appliances: [
                { name: 'Central Chiller', count: 1, kw: 4.5 },
                { name: 'Stage Acoustics', count: 1, kw: 1.1 },
              ],
              cctv_ids: ['CAM-B-205'],
            },
            {
              room_number: 'Washroom-M',
              room_type: 'WASHROOM',
              name: 'Washroom (M)',
              x: 804,
              y: 25,
              width: 85,
              height: 120,
              seating_capacity: 6,
              dimensions: '4.0 x 3.0 m',
              total_kw: 0.6,
              status: 'OCCUPIED',
              appliances: [],
              cctv_ids: [],
            },
            // Middle Corridor
            {
              room_number: 'CORRIDOR-2',
              room_type: 'CORRIDOR',
              name: 'Corridor (C-1) Width: 2.5 m',
              x: 35,
              y: 155,
              width: 854,
              height: 85,
              seating_capacity: 40,
              total_kw: 0.56,
              status: 'NORMAL',
              appliances: [
                { name: 'Corridor Lighting Grid', count: 12, kw: 0.48 },
                { name: 'Emergency Exit Beacons', count: 4, kw: 0.08 },
              ],
              cctv_ids: ['CAM-01'],
            },
            // Bottom Row (y: 250, height: 125)
            {
              room_number: '206',
              room_type: 'FACULTY',
              name: 'Faculty Room',
              x: 35,
              y: 250,
              width: 130,
              height: 125,
              seating_capacity: 20,
              dimensions: '6.0 x 5.0 m',
              total_kw: 1.6,
              status: 'NORMAL',
              appliances: [
                { name: 'Split AC', count: 1, kw: 1.2 },
                { name: 'LED Fixtures', count: 4, kw: 0.16 },
              ],
              cctv_ids: [],
            },
            {
              room_number: '207',
              room_type: 'LAB',
              name: 'Lab',
              x: 173,
              y: 250,
              width: 135,
              height: 125,
              seating_capacity: 40,
              dimensions: '8.0 x 6.0 m',
              total_kw: 5.2,
              status: 'OCCUPIED',
              appliances: [
                { name: 'Precision AC', count: 1, kw: 2.5 },
                { name: 'Workstations', count: 20, kw: 2.4 },
              ],
              cctv_ids: ['CAM-B-207'],
            },
            {
              room_number: '208',
              room_type: 'CLASSROOM',
              name: 'Classroom',
              x: 316,
              y: 250,
              width: 135,
              height: 125,
              seating_capacity: 60,
              dimensions: '8.0 x 6.0 m',
              total_kw: 2.2,
              status: 'NORMAL',
              appliances: [
                { name: 'Split AC', count: 1, kw: 1.5 },
                { name: 'LED Lights', count: 6, kw: 0.24 },
              ],
              cctv_ids: ['CAM-B-208'],
            },
            {
              room_number: 'Washroom',
              room_type: 'WASHROOM',
              name: 'Washroom',
              x: 459,
              y: 250,
              width: 100,
              height: 125,
              seating_capacity: 10,
              dimensions: '6.0 x 5.0 m',
              total_kw: 0.6,
              status: 'OCCUPIED',
              appliances: [],
              cctv_ids: [],
            },
            {
              room_number: '210',
              room_type: 'LAB',
              name: 'Lab',
              x: 567,
              y: 250,
              width: 135,
              height: 125,
              seating_capacity: 40,
              dimensions: '8.0 x 6.0 m',
              total_kw: 4.5,
              status: 'NORMAL',
              appliances: [
                { name: 'Split AC', count: 1, kw: 2.0 },
                { name: 'Workstations', count: 20, kw: 2.2 },
              ],
              cctv_ids: ['CAM-B-210'],
            },
            {
              room_number: 'Lift-1',
              room_type: 'ELEVATOR',
              name: 'Lift-1',
              x: 710,
              y: 250,
              width: 85,
              height: 125,
              seating_capacity: 8,
              total_kw: 1.2,
              status: 'NORMAL',
              appliances: [],
              cctv_ids: [],
            },
            {
              room_number: 'Stairs-2',
              room_type: 'STAIRS',
              name: 'Stairs-2',
              x: 803,
              y: 250,
              width: 86,
              height: 125,
              seating_capacity: 0,
              total_kw: 0.1,
              status: 'NORMAL',
              appliances: [],
              cctv_ids: [],
            },
          ],
          cameras: [
            {
              camera_id: 'CAM-B-201',
              name: 'Room 201 Overhead Dome',
              x: 164,
              y: 35,
              angle: 60,
              fov: 65,
              status: 'ONLINE',
              room_number: '201',
            },
            {
              camera_id: 'CAM-B-202',
              name: 'Room 202 AI Camera',
              x: 304,
              y: 35,
              angle: 60,
              fov: 65,
              status: 'ONLINE',
              room_number: '202',
            },
            {
              camera_id: 'CAM-01',
              name: 'Central Corridor Cam',
              x: 585,
              y: 195,
              angle: 80,
              fov: 70,
              status: 'ONLINE',
              room_number: 'CORRIDOR-2',
            },
          ],
        },
      ],
    },
  ],
};

/**
 * SpatialDigitalTwin2D
 * Master 2D Architectural Campus Blueprint & Telemetry Engine.
 * Read-only layout shared across Super Admin, Facility Head, Security Head,
 * Guards, Workers, and Students. Automatically syncs edits from Campus Map Builder
 * and visualizes active incidents with real-time room beacons.
 */
export const SpatialDigitalTwin2D = ({
  height = '520px',
  activeRole = 'ADMIN',
  showControls = true,
  highlightRoomId = null,
  onRoomSelect = null,
  externalLayout = null,
}) => {
  const { isDarkMode } = useTheme();
  const { notifications = [], lastEvent = null } = useSocket();

  // Initialize from cache or canonical default
  const getInitialLayout = () => {
    if (externalLayout) return externalLayout;
    try {
      const cached = localStorage.getItem('campus_master_spatial_layout');
      if (cached) {
        const parsed = JSON.parse(cached);
        const f2 = parsed?.blocks?.[0]?.floors?.find((f) => f.floor_number === 2);
        // Only use cache if it has the complete layout (at least 12 rooms)
        if (f2 && f2.rooms && f2.rooms.length >= 12) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_SPATIAL_LAYOUT;
  };

  const [layout, setLayout] = useState(getInitialLayout);
  const [loading, setLoading] = useState(false);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(0);
  const [selectedFloorIdx, setSelectedFloorIdx] = useState(1); // Default to Floor 2 (index 1)

  // Active Incidents State (Shared across all roles)
  const [activeIncidents, setActiveIncidents] = useState([
    {
      id: 'INC-2026-904',
      room_number: '204',
      block_name: 'Block-B',
      floor_number: 2,
      severity: 'CRITICAL',
      type: 'CRITICAL LOAD / SOS',
      title: 'Altercation & High Ghost Load Alert',
      time: 'Active Now',
      guardDispatched: 'Vikram Singh (SEC-101)',
      workerPresent: 'Ramesh Kumar (WRK-201)',
      status: 'OPEN',
    },
  ]);

  // Inspector & Preview States
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeCameraModal, setActiveCameraModal] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Simulated live staff locations mapped to 2D canvas coordinates
  const [staffRadar] = useState([
    {
      id: 'SEC-101',
      name: 'Vikram Singh',
      role: 'SECURITY',
      room_number: 'CORRIDOR-2',
      x: 520,
      y: 215,
      status: 'RESPONDING',
      avatar: MOCK_ASSETS.avatars.vikramSingh,
      floor: 2,
      block: 'Block-B',
    },
    {
      id: 'WRK-201',
      name: 'Ramesh Kumar',
      role: 'WORKER',
      room_number: 'CORRIDOR-2',
      x: 240,
      y: 215,
      status: 'ON_TASK',
      avatar: MOCK_ASSETS.avatars.rameshKumar,
      floor: 2,
      block: 'Block-B',
    },
    {
      id: 'SEC-102',
      name: 'Rajat Kumar',
      role: 'SECURITY',
      room_number: 'CORRIDOR-2',
      x: 760,
      y: 215,
      status: 'PATROL',
      avatar: MOCK_ASSETS.avatars.rajatKumar,
      floor: 2,
      block: 'Block-B',
    },
  ]);

  // 1. Synchronize Layout with Backend & LocalStorage
  const loadMasterLayout = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/spatial/layout');
      if (res.data && res.data.blocks && res.data.blocks.length > 0) {
        setLayout(res.data);
        try {
          localStorage.setItem('campus_master_spatial_layout', JSON.stringify(res.data));
        } catch {
          // ignore storage error
        }
      }
    } catch (err) {
      // If backend is down or offline, ensure fallback layout is preserved
      console.warn('Using local cached/canonical spatial layout:', err);
      const cached = localStorage.getItem('campus_master_spatial_layout');
      if (cached) {
        try {
          setLayout(JSON.parse(cached));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  // Listen for layout edits from Campus Map Builder in real-time
  useEffect(() => {
    const handleLayoutUpdate = (e) => {
      if (e.detail) {
        setLayout(e.detail);
      } else {
        try {
          const cached = localStorage.getItem('campus_master_spatial_layout');
          if (cached) setLayout(JSON.parse(cached));
        } catch {}
      }
    };

    window.addEventListener('campus_layout_updated', handleLayoutUpdate);
    window.addEventListener('storage', handleLayoutUpdate);

    // Initial load
    if (!externalLayout) {
      loadMasterLayout();
    } else {
      setLayout(externalLayout);
    }

    return () => {
      window.removeEventListener('campus_layout_updated', handleLayoutUpdate);
      window.removeEventListener('storage', handleLayoutUpdate);
    };
  }, [externalLayout]);

  // 2. Real-time Incident Detection from WebSocket & Storage
  useEffect(() => {
    if (!lastEvent) return;
    const { type, data } = lastEvent;

    if (
      [
        'PANIC_SOS_TRIGGERED',
        'AI_THREAT_DETECTED',
        'EMERGENCY_DISPATCH',
        'INCIDENT_CREATED',
        'SLA_ESCALATED_CRITICAL',
      ].includes(type)
    ) {
      const targetRoom = data?.room_number || data?.room || (data?.location?.includes('204') ? '204' : '204');
      const newInc = {
        id: `INC-${Date.now()}`,
        room_number: String(targetRoom),
        block_name: data?.block || 'Block-B',
        floor_number: data?.floor || 2,
        severity: 'CRITICAL',
        type: type.replace(/_/g, ' '),
        title: data?.notes || data?.description || 'Emergency Alert Dispatched',
        time: 'Just now',
        status: 'OPEN',
      };

      setActiveIncidents((prev) => {
        const filtered = prev.filter((i) => i.room_number !== String(targetRoom));
        return [newInc, ...filtered];
      });
    } else if (type === 'INCIDENT_RESOLVED') {
      const resolvedRoom = data?.room_number || data?.room;
      if (resolvedRoom) {
        setActiveIncidents((prev) => prev.filter((i) => i.room_number !== String(resolvedRoom)));
      }
    }
  }, [lastEvent]);

  const currentBlock = layout?.blocks?.[selectedBlockIdx] || layout?.blocks?.[0] || DEFAULT_SPATIAL_LAYOUT.blocks[0];
  const currentFloor = currentBlock?.floors?.[selectedFloorIdx] || currentBlock?.floors?.[0] || currentBlock?.floors?.[1];

  const roomsList = currentFloor?.rooms || [];
  const camerasList = currentFloor?.cameras || [];

  // Filtered rooms
  const filteredRooms = roomsList.filter((r) => {
    const isAlert = activeIncidents.some((inc) => String(inc.room_number) === String(r.room_number)) || r.status === 'ALERT' || r.room_number === '204';
    const matchesSearch =
      !searchQuery ||
      r.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.room_type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedCategoryFilter === 'ALL' ||
      (selectedCategoryFilter === 'ALERT' && isAlert) ||
      (selectedCategoryFilter === 'CLASSROOM' && r.room_type?.toUpperCase().includes('CLASS')) ||
      (selectedCategoryFilter === 'LAB' && r.room_type?.toUpperCase().includes('LAB'));
    return matchesSearch && matchesFilter;
  });

  // Top Active Incident for current floor
  const currentFloorIncident = activeIncidents.find(
    (inc) =>
      (!inc.floor_number || inc.floor_number === currentFloor?.floor_number) &&
      (!inc.block_name || inc.block_name === currentBlock?.block_name)
  );

  return (
    <div
      className={`relative flex-1 flex flex-col w-full overflow-hidden transition-colors duration-200 ${
        isDarkMode ? 'bg-[#060a14] text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
      style={{ minHeight: height }}
    >
      {/* ============================================================= */}
      {/* TOP HEADER / SWITCHER BAR                                     */}
      {/* ============================================================= */}
      {showControls && (
        <div
          className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDarkMode ? 'bg-[#0a0f1d] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {/* Left: Campus Twin Tag, Block & Floor Selector */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 font-bold text-xs">
              <Building className="w-3.5 h-3.5 text-blue-500" />
              <span>Campus Twin</span>
            </div>

            {/* Block Selector */}
            <select
              value={selectedBlockIdx}
              onChange={(e) => {
                setSelectedBlockIdx(Number(e.target.value));
                setSelectedFloorIdx(0);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none transition-colors cursor-pointer ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              {(layout?.blocks || DEFAULT_SPATIAL_LAYOUT.blocks).map((b, idx) => (
                <option key={b.block_name || idx} value={idx}>
                  🏢 {b.block_name || `Block ${idx + 1}`} ({b.floors?.length || 2} Floors)
                </option>
              ))}
            </select>

            {/* Floor Selector Pills */}
            <div
              className={`flex items-center p-1 rounded-xl border ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {(currentBlock?.floors || DEFAULT_SPATIAL_LAYOUT.blocks[0].floors).map((flr, fIdx) => (
                <button
                  key={flr.floor_number ?? fIdx}
                  onClick={() => setSelectedFloorIdx(fIdx)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedFloorIdx === fIdx
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {flr.name ? flr.name.split(' ')[0] : `Floor ${flr.floor_number}`}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Search & Refresh */}
          <div className="flex items-center space-x-2">
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Find Room / Lab..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none w-36 focus:w-48 transition-all ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <button
              onClick={loadMasterLayout}
              title="Refresh Blueprint & Sensor Telemetry"
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* ACTIVE INCIDENT TICKER BAR (Visible to ALL Roles)             */}
      {/* ============================================================= */}
      {currentFloorIncident && (
        <div className="bg-rose-950/80 border-b border-rose-800/80 px-4 py-2 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-bold text-white">ACTIVE INCIDENT DETECTED:</span>
            <span>
              {currentBlock?.block_name} • Floor {currentFloor?.floor_number} • Room {currentFloorIncident.room_number} (
              {currentFloorIncident.title})
            </span>
          </div>
          <span className="text-[11px] font-mono bg-rose-900/80 px-2 py-0.5 rounded border border-rose-700 font-bold text-white">
            🚨 Security & Facility Teams Responding
          </span>
        </div>
      )}

      {/* ============================================================= */}
      {/* MAIN ARCHITECTURAL SVG BLUEPRINT CANVAS AREA                  */}
      {/* ============================================================= */}
      <div
        className={`relative flex-1 w-full overflow-hidden select-none transition-colors ${
          isDarkMode ? 'bg-[#070b14]' : 'bg-[#f8fafc]'
        }`}
      >
        {loading ? (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center space-y-3 z-20 ${
              isDarkMode ? 'bg-[#070b14]/90' : 'bg-white/90'
            }`}
          >
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Loading Campus Spatial Blueprint...
            </p>
          </div>
        ) : (
          <svg
            viewBox="0 0 925 400"
            className="w-full h-full filter drop-shadow-sm"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* SVG Blueprint Grid Lines */}
            <defs>
              <pattern id="gridPattern2D" width="30" height="30" patternUnits="userSpaceOnUse">
                <path
                  d="M 30 0 L 0 0 0 30"
                  fill="none"
                  stroke={isDarkMode ? '#1e293b' : '#e2e8f0'}
                  strokeWidth="0.8"
                  opacity={isDarkMode ? 0.6 : 0.9}
                />
              </pattern>
              {/* Camera FOV Gradient */}
              <linearGradient id="camFovGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Background Grid */}
            <rect width="925" height="400" fill={isDarkMode ? '#070b14' : '#f8fafc'} />
            <rect width="925" height="400" fill="url(#gridPattern2D)" />

            {/* Outer Architectural Perimeter */}
            <rect
              x="18"
              y="12"
              width="888"
              height="376"
              fill="none"
              stroke={isDarkMode ? '#334155' : '#cbd5e1'}
              strokeWidth="2"
              strokeDasharray="6 3"
              rx="10"
            />

            {/* Central Corridor Zone Marker */}
            <line
              x1="25"
              y1="152"
              x2="900"
              y2="152"
              stroke={isDarkMode ? '#1e293b' : '#e2e8f0'}
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            <line
              x1="25"
              y1="246"
              x2="900"
              y2="246"
              stroke={isDarkMode ? '#1e293b' : '#e2e8f0'}
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />

            {/* Corridor Signage & Telemetry Banner (Upper Track y: 172) */}
            <text
              x="462"
              y="172"
              fill={isDarkMode ? '#64748b' : '#94a3b8'}
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              letterSpacing="2"
            >
              CORRIDOR (C-1) • WIDTH: 2.5 M • RFID &amp; CCTV ACTIVE
            </text>

            {/* Corridor Fixtures along perimeter walls */}
            <g>
              {/* Plants */}
              <text x="60" y="172" fontSize="12">🪴</text>
              <text x="360" y="172" fontSize="12">🪴</text>
              <text x="660" y="172" fontSize="12">🪴</text>
              <text x="885" y="172" fontSize="12">🪴</text>

              {/* Fire Extinguishers mounted on wall */}
              <g transform="translate(180, 156)">
                <rect x="-1" y="0" width="14" height="14" rx="3" fill="#ef4444" />
                <text x="1" y="11" fontSize="9" fill="#ffffff">🧯</text>
              </g>
              <g transform="translate(810, 156)">
                <rect x="-1" y="0" width="14" height="14" rx="3" fill="#ef4444" />
                <text x="1" y="11" fontSize="9" fill="#ffffff">🧯</text>
              </g>
            </g>

            {/* Fallback Architectural Sections if omitted from custom layouts */}
            {!filteredRooms.some((r) => String(r.room_number || r.id).toUpperCase().includes('STAIRS-1')) && (
              <g transform="translate(35, 25)" opacity="0.85">
                <rect x="0" y="0" width="55" height="120" rx="6" fill={isDarkMode ? '#131b2e' : '#f8fafc'} stroke={isDarkMode ? '#475569' : '#94a3b8'} strokeWidth="1.5" />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((s) => (
                  <line key={s} x1="8" y1={36 + s * 10} x2="47" y2={36 + s * 10} stroke={isDarkMode ? '#64748b' : '#94a3b8'} strokeWidth="1.2" />
                ))}
                <text x="27" y="20" fill={isDarkMode ? '#cbd5e1' : '#475569'} fontSize="9" fontWeight="bold" textAnchor="middle">Stairs-1</text>
              </g>
            )}
            {!filteredRooms.some((r) => String(r.room_number || r.id).toUpperCase().includes('LIFT-1')) && (
              <g transform="translate(710, 250)" opacity="0.85">
                <rect x="0" y="0" width="85" height="125" rx="6" fill={isDarkMode ? '#131b2e' : '#f1f5f9'} stroke={isDarkMode ? '#475569' : '#94a3b8'} strokeWidth="1.5" />
                <rect x="15" y="25" width="55" height="65" rx="4" fill={isDarkMode ? '#1e293b' : '#e2e8f0'} stroke={isDarkMode ? '#475569' : '#94a3b8'} strokeWidth="1" />
                <text x="42" y="62" fontSize="20" textAnchor="middle">🛗</text>
                <text x="42" y="112" fill={isDarkMode ? '#cbd5e1' : '#475569'} fontSize="9.5" fontWeight="bold" textAnchor="middle">Lift-1</text>
              </g>
            )}
            {!filteredRooms.some((r) => String(r.room_number || r.id).toUpperCase().includes('STAIRS-2')) && (
              <g transform="translate(803, 250)" opacity="0.85">
                <rect x="0" y="0" width="86" height="125" rx="6" fill={isDarkMode ? '#131b2e' : '#f8fafc'} stroke={isDarkMode ? '#475569' : '#94a3b8'} strokeWidth="1.5" />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((s) => (
                  <line key={s} x1="8" y1={36 + s * 10} x2="78" y2={36 + s * 10} stroke={isDarkMode ? '#64748b' : '#94a3b8'} strokeWidth="1.2" />
                ))}
                <text x="43" y="20" fill={isDarkMode ? '#cbd5e1' : '#475569'} fontSize="9" fontWeight="bold" textAnchor="middle">Stairs-2</text>
              </g>
            )}
            {!filteredRooms.some((r) => String(r.room_number || r.id).toUpperCase().includes('WASHROOM-M')) && (
              <g transform="translate(804, 25)" opacity="0.85">
                <rect x="0" y="0" width="85" height="120" rx="6" fill={isDarkMode ? '#131b2e' : '#f8fafc'} stroke={isDarkMode ? '#475569' : '#94a3b8'} strokeWidth="1.5" />
                <text x="42" y="60" fontSize="22" textAnchor="middle">🚻</text>
                <text x="42" y="85" fill={isDarkMode ? '#cbd5e1' : '#475569'} fontSize="9.5" fontWeight="bold" textAnchor="middle">Washroom (M)</text>
              </g>
            )}

            {/* ========================================================= */}
            {/* RENDER ALL ROOMS ON CURRENT FLOOR                         */}
            {/* ========================================================= */}
            {filteredRooms.map((room) => {
              const roomIncident = activeIncidents.find(
                (inc) => String(inc.room_number) === String(room.room_number)
              );
              const isAlert =
                !!roomIncident ||
                room.room_number === '204' ||
                room.status === 'ALERT' ||
                room.status === 'CRITICAL_GHOST_LOAD';
              const isSelected = activeRoom?.room_number === room.room_number;
              const isTargetHighlight = highlightRoomId === room.room_number;

              const isStairs = room.room_type === 'STAIRS';
              const isElevator = room.room_type === 'ELEVATOR';
              const isWashroom = room.room_type === 'WASHROOM';
              const isOccupied = room.status === 'OCCUPIED';

              // Determine color themes based on status and dark mode
              let roomBg = isDarkMode ? '#0c1f1c' : '#ecfdf5';
              let roomBorder = isDarkMode ? '#059669' : '#10b981';
              let headerBg = isDarkMode ? '#14352e' : '#d1fae5';
              let titleColor = isDarkMode ? '#6ee7b7' : '#065f46';
              let subColor = isDarkMode ? '#34d399' : '#047857';

              if (isAlert) {
                roomBg = isDarkMode ? '#3b1419' : '#fef2f2';
                roomBorder = '#ef4444';
                headerBg = isDarkMode ? '#501820' : '#fee2e2';
                titleColor = isDarkMode ? '#fca5a5' : '#991b1b';
                subColor = isDarkMode ? '#f87171' : '#b91c1c';
              } else if (isOccupied) {
                roomBg = isDarkMode ? '#0f1d36' : '#eff6ff';
                roomBorder = '#3b82f6';
                headerBg = isDarkMode ? '#1a2e54' : '#dbeafe';
                titleColor = isDarkMode ? '#93c5fd' : '#1e40af';
                subColor = isDarkMode ? '#60a5fa' : '#2563eb';
              } else if (isStairs || isElevator || isWashroom) {
                roomBg = isDarkMode ? '#131b2e' : '#f1f5f9';
                roomBorder = isDarkMode ? '#475569' : '#94a3b8';
                headerBg = isDarkMode ? '#1e293b' : '#e2e8f0';
                titleColor = isDarkMode ? '#cbd5e1' : '#334155';
                subColor = isDarkMode ? '#94a3b8' : '#64748b';
              }

              if (isSelected) {
                roomBorder = '#0284c7';
              }

              return (
                <g
                  key={room.room_number}
                  onClick={() => {
                    setActiveRoom(room);
                    if (onRoomSelect) onRoomSelect(room);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Alert Beacons for incident/ghost load rooms */}
                  {isAlert && (
                    <rect
                      x={room.x - 3}
                      y={room.y - 3}
                      width={room.width + 6}
                      height={room.height + 6}
                      rx="10"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      className="animate-pulse"
                    />
                  )}

                  {/* Room Container Body */}
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.width}
                    height={room.height}
                    rx="8"
                    fill={roomBg}
                    stroke={roomBorder}
                    strokeWidth={isSelected ? '2.5' : isAlert ? '2' : '1.5'}
                    className="transition-all duration-200 group-hover:filter group-hover:brightness-105"
                  />

                  {/* Room Header Strip */}
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.width}
                    height="24"
                    rx="8"
                    fill={headerBg}
                  />

                  {/* Room Number & Title */}
                  <text
                    x={room.x + 8}
                    y={room.y + 16}
                    fill={titleColor}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {room.name || room.room_number}
                  </text>

                  {/* Alert Icon Badge in Header */}
                  {isAlert && (
                    <text
                      x={room.x + room.width - 12}
                      y={room.y + 16}
                      fontSize="12"
                      textAnchor="end"
                    >
                      🚨
                    </text>
                  )}

                  {/* SPECIAL RENDER: STAIRS ARCHITECTURAL TREADS */}
                  {isStairs ? (
                    <g opacity="0.6">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((s) => (
                        <line
                          key={s}
                          x1={room.x + 8}
                          y1={room.y + 36 + s * 10}
                          x2={room.x + room.width - 8}
                          y2={room.y + 36 + s * 10}
                          stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                          strokeWidth="1.2"
                        />
                      ))}
                    </g>
                  ) : isElevator ? (
                    /* SPECIAL RENDER: ELEVATOR */
                    <g transform={`translate(${room.x + room.width / 2}, ${room.y + 60})`}>
                      <rect
                        x="-20"
                        y="-15"
                        width="40"
                        height="40"
                        rx="6"
                        fill={isDarkMode ? '#1e293b' : '#e2e8f0'}
                        stroke={isDarkMode ? '#475569' : '#94a3b8'}
                      />
                      <text x="0" y="10" fontSize="16" textAnchor="middle">
                        🛗
                      </text>
                    </g>
                  ) : isWashroom ? (
                    /* SPECIAL RENDER: WASHROOM */
                    <g transform={`translate(${room.x + room.width / 2}, ${room.y + 65})`}>
                      <text x="0" y="0" fontSize="20" textAnchor="middle">
                        🚻
                      </text>
                      <text
                        x="0"
                        y="22"
                        fontSize="9"
                        fill={subColor}
                        fontWeight="bold"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                      >
                        {room.dimensions || '6.0 x 5.0 m'}
                      </text>
                    </g>
                  ) : (
                    /* STANDARD ROOM DETAILS */
                    <>
                      {/* Room Dimensions & Capacity */}
                      <g transform={`translate(${room.x + 8}, ${room.y + 42})`}>
                        <text
                          x="0"
                          y="0"
                          fill={isDarkMode ? '#94a3b8' : '#475569'}
                          fontSize="9.5"
                          fontFamily="sans-serif"
                          fontWeight="medium"
                        >
                          {room.dimensions || '8.0 x 6.0 m'}
                        </text>
                        <text
                          x="0"
                          y="15"
                          fill={subColor}
                          fontSize="9.5"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {room.seating_capacity ? `${room.seating_capacity} seats` : 'Active'}
                        </text>
                      </g>

                      {/* Power Telemetry Load Badge */}
                      {room.total_kw && (
                        <g transform={`translate(${room.x + 8}, ${room.y + 75})`}>
                          <rect
                            x="0"
                            y="0"
                            width={room.width - 16}
                            height="18"
                            rx="5"
                            fill={isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)'}
                            stroke={isDarkMode ? '#334155' : '#cbd5e1'}
                            strokeWidth="0.8"
                          />
                          <text
                            x="6"
                            y="12"
                            fill={isAlert ? '#ef4444' : isDarkMode ? '#38bdf8' : '#0284c7'}
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            ⚡ {room.total_kw} kW
                          </text>
                          <text
                            x={room.width - 22}
                            y="12"
                            fill={isDarkMode ? '#94a3b8' : '#64748b'}
                            fontSize="8"
                            fontFamily="sans-serif"
                            textAnchor="end"
                          >
                            {room.appliances?.length || 4} units
                          </text>
                        </g>
                      )}

                      {/* Status Tag Pill at bottom */}
                      <rect
                        x={room.x + 8}
                        y={room.y + room.height - 20}
                        width={room.width - 16}
                        height="14"
                        rx="4"
                        fill={isAlert ? '#ef4444' : isOccupied ? '#3b82f6' : isDarkMode ? '#064e3b' : '#d1fae5'}
                      />
                      <text
                        x={room.x + room.width / 2}
                        y={room.y + room.height - 10}
                        fill={isAlert || isOccupied ? '#ffffff' : isDarkMode ? '#a7f3d0' : '#065f46'}
                        fontSize="8"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {isAlert ? '🚨 CRITICAL ALERT' : isOccupied ? '● OCCUPIED' : '✓ NORMAL'}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* ========================================================= */}
            {/* RENDER CCTV CAMERAS WITH FOV CONES                        */}
            {/* ========================================================= */}
            {camerasList.map((cam) => {
              const camAngle = cam.angle || 60;
              const fovSpan = cam.fov || 70;
              const radius = 80;

              // Compute SVG Arc for FOV cone
              const startAngle = (camAngle - fovSpan / 2) * (Math.PI / 180);
              const endAngle = (camAngle + fovSpan / 2) * (Math.PI / 180);
              const x1 = cam.x + radius * Math.cos(startAngle);
              const y1 = cam.y + radius * Math.sin(startAngle);
              const x2 = cam.x + radius * Math.cos(endAngle);
              const y2 = cam.y + radius * Math.sin(endAngle);

              const pathData = `M ${cam.x} ${cam.y} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

              return (
                <g
                  key={cam.camera_id}
                  onClick={() => setActiveCameraModal(cam)}
                  className="cursor-pointer group"
                >
                  {/* FOV Cone (Revealed smoothly on hover so rooms remain clear) */}
                  <path
                    d={pathData}
                    fill="url(#camFovGrad)"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className="opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
                  />

                  {/* Camera Pin Base */}
                  <circle
                    cx={cam.x}
                    cy={cam.y}
                    r="8"
                    fill={isDarkMode ? '#0284c7' : '#0ea5e9'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="filter drop-shadow-md group-hover:fill-sky-400 transition-colors"
                  />
                  <circle cx={cam.x} cy={cam.y} r="2.5" fill="#22c55e" />
                </g>
              );
            })}

            {/* ========================================================= */}
            {/* RENDER LIVE GPS / RFID STAFF RADAR BEACONS                */}
            {/* ========================================================= */}
            {staffRadar.map((staff) => (
              <g
                key={staff.id}
                className="cursor-pointer group"
                onClick={() =>
                  setActiveRoom({
                    room_number: staff.room_number,
                    room_type: `Staff: ${staff.name}`,
                    total_kw: 0.1,
                    seating_capacity: 1,
                  })
                }
              >
                {/* Fixed In-Place Pulse Wave (Native SVG SMIL - never travels/drifts) */}
                <circle
                  cx={staff.x}
                  cy={staff.y}
                  r="8"
                  fill="none"
                  stroke={staff.role === 'SECURITY' ? '#38bdf8' : '#fbbf24'}
                  strokeWidth="2"
                >
                  <animate
                    attributeName="r"
                    values="8;20"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.85;0"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Staff Dot Base */}
                <circle
                  cx={staff.x}
                  cy={staff.y}
                  r="8"
                  fill={staff.role === 'SECURITY' ? '#1d4ed8' : '#d97706'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Staff Label Pill */}
                <rect
                  x={staff.x - 28}
                  y={staff.y + 10}
                  width="56"
                  height="14"
                  rx="4"
                  fill={isDarkMode ? '#020617' : '#ffffff'}
                  stroke={staff.role === 'SECURITY' ? '#3b82f6' : '#f59e0b'}
                  strokeWidth="1"
                  className="shadow-sm"
                />
                <text
                  x={staff.x}
                  y={staff.y + 20}
                  fill={isDarkMode ? '#ffffff' : '#0f172a'}
                  fontSize="7.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  {staff.role === 'SECURITY' ? '🛡️ ' : '🔧 '}
                  {staff.name.split(' ')[0]}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>

      {/* ============================================================= */}
      {/* BOTTOM TELEMETRY LEGEND DOCK                                  */}
      {/* ============================================================= */}
      <div
        className={`px-4 py-2 border-t text-xs flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDarkMode
            ? 'bg-[#0a1022] border-slate-800 text-slate-300'
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center space-x-4 flex-wrap gap-y-1">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
            <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Security Guard (5 online)</span>
          </span>

          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
            <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Ground Worker (3 online)</span>
          </span>

          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="font-bold text-rose-500 dark:text-rose-400">Incident / Alert ({activeIncidents.length} active)</span>
          </span>

          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
            <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>CCTV Camera (12 online)</span>
          </span>
        </div>

        <div className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-800/80 dark:bg-slate-800/90 border border-slate-700/60 text-slate-300 dark:text-slate-300 font-mono font-bold">
          🏢 {currentBlock?.block_name} • Floor {currentFloor?.floor_number || 2}
        </div>
      </div>

      {/* ============================================================= */}
      {/* SELECTED ROOM TELEMETRY & INCIDENT INSPECTOR DRAWER           */}
      {/* ============================================================= */}
      {activeRoom && (
        <div
          className={`p-4 border-t flex flex-wrap items-center justify-between gap-4 animate-fade-in ${
            isDarkMode ? 'bg-[#0b1329] border-slate-800' : 'bg-blue-50/50 border-blue-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-sm">
              {activeRoom.room_number}
            </div>
            <div>
              <div className="text-xs font-bold font-heading flex items-center space-x-2">
                <span>
                  Room {activeRoom.room_number} ({activeRoom.room_type})
                </span>
                {activeIncidents.some((i) => String(i.room_number) === String(activeRoom.room_number)) && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] font-bold animate-pulse">
                    🚨 CRITICAL INCIDENT / SOS ACTIVE
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-3 mt-0.5 font-mono">
                <span>⚡ Power: {activeRoom.total_kw || 1.8} kW</span>
                <span>👥 Cap: {activeRoom.seating_capacity || 40} pax</span>
                <span>🌡️ Temp: 21°C</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {activeIncidents.some((i) => String(i.room_number) === String(activeRoom.room_number)) && (
              <button
                onClick={() => {
                  setActiveIncidents((prev) =>
                    prev.filter((i) => String(i.room_number) !== String(activeRoom.room_number))
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
              >
                Mark Incident Resolved
              </button>
            )}
            <button
              onClick={() => setActiveRoom(null)}
              className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* REAL RTSP CAMERA STREAM MODAL                                 */}
      {/* ============================================================= */}
      {activeCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#0b1329] border border-cyan-500/40 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Video className="w-4 h-4 text-cyan-400" />
                  <span>{activeCameraModal.name || activeCameraModal.camera_id}</span>
                </h3>
              </div>
              <button
                onClick={() => setActiveCameraModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Live RTSP Feed with YOLO detections */}
            <div className="relative h-64 rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
              <img
                src={MOCK_ASSETS.corridorCctv}
                alt="Live Camera Feed"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-black/70 border border-slate-700 text-[10px] font-mono text-emerald-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>LIVE RTSP 1080p @ 30FPS</span>
              </div>

              {/* Bounding Box Simulation */}
              <div className="absolute top-1/4 left-1/3 w-32 h-36 border-2 border-emerald-400 rounded bg-emerald-500/10 flex flex-col justify-between p-1">
                <span className="text-[9px] font-mono font-bold bg-emerald-500 text-black px-1 rounded self-start">
                  Student (0.94)
                </span>
                <span className="text-[8px] font-mono text-emerald-300 self-end">Normal</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div>
                Stream: <span className="text-cyan-400">{activeCameraModal.stream_url || 'rtsp://192.168.1.100:554/live'}</span>
              </div>
              <div>Angle: <span className="text-white">{activeCameraModal.angle || 60}°</span></div>
              <div>FOV: <span className="text-white">{activeCameraModal.fov || 65}°</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpatialDigitalTwin2D;
