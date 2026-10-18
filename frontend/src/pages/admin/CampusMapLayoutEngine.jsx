import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import {
  Building,
  Layers,
  Save,
  RotateCcw,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Move,
  Hand,
  Square,
  Minus,
  Maximize2,
  Video,
  Cpu,
  Type,
  Ruler,
  Eraser,
  ChevronRight,
  ChevronDown,
  DoorOpen,
  ArrowRight,
  Check,
  AlertTriangle,
  Flame,
  Eye,
  Sliders,
  Sparkles,
  HelpCircle,
  Pencil,
} from 'lucide-react';

// Room Type Options
const ROOM_TYPES = [
  'Classroom / Lecture Hall',
  'Lab (AI/ML / CS / IT)',
  'Faculty Room / Cabins',
  'Seminar Hall / Auditorium',
  'Washroom / Restrooms',
  'Library / Reading Room',
  'Server Room',
];

// Status Colors
const STATUS_COLORS = {
  Normal: { bg: '#ecfdf5', border: '#10b981', text: '#047857', badge: 'bg-emerald-100 text-emerald-800' },
  Alert: { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c', badge: 'bg-rose-100 text-rose-800' },
  Occupied: { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', badge: 'bg-blue-100 text-blue-800' },
  Maintenance: { bg: '#fffbeb', border: '#f59e0b', text: '#b45309', badge: 'bg-amber-100 text-amber-800' },
  Offline: { bg: '#f8fafc', border: '#94a3b8', text: '#475569', badge: 'bg-slate-100 text-slate-800' },
};

export const CampusMapLayoutEngine = () => {
  const navigate = useNavigate();

  // Active Tool Mode
  const [activeTool, setActiveTool] = useState('select'); // 'select', 'pan', 'draw_room', etc.
  const [zoomLevel, setZoomLevel] = useState(100);

  // Campus Hierarchy Tree State
  const [expandedBlocks, setExpandedBlocks] = useState({ 'Block-B': true });
  const [selectedBlock, setSelectedBlock] = useState('Block-B');
  const [selectedFloor, setSelectedFloor] = useState('Floor 2');

  // Rooms State (Exact layout matching Screen 2 mockup)
  const [rooms, setRooms] = useState([
    {
      id: '201',
      name: 'Classroom',
      type: 'Classroom / Lecture Hall',
      block: 'Block-B',
      floor: 'Floor 2',
      dimensions: { length: 8.0, width: 6.0 },
      position: { x: 98, y: 25 },
      width: 132,
      height: 120,
      capacity: 60,
      status: 'Normal',
      appliancesCount: 6,
      cctvCount: 1,
      assetsCount: 2,
    },
    {
      id: '202',
      name: 'Classroom',
      type: 'Classroom / Lecture Hall',
      block: 'Block-B',
      floor: 'Floor 2',
      dimensions: { length: 8.0, width: 6.0 },
      position: { x: 238, y: 25 },
      width: 132,
      height: 120,
      capacity: 60,
      status: 'Normal',
      appliancesCount: 6,
      cctvCount: 1,
      assetsCount: 2,
    },
    {
      id: '203',
      name: 'Lab (AI/ML)',
      type: 'Lab (AI/ML / CS / IT)',
      block: 'Block-B',
      floor: 'Floor 2',
      dimensions: { length: 8.0, width: 6.0 },
      position: { x: 378, y: 25 },
      width: 132,
      height: 120,
      capacity: 40,
      status: 'Occupied',
      appliancesCount: 12,
      cctvCount: 1,
      assetsCount: 4,
    },
    {
      id: '204',
      name: 'Classroom',
      type: 'Classroom / Lecture Hall',
      block: 'Block-B',
      floor: 'Floor 2',
      dimensions: { length: 8.0, width: 6.0 },
      position: { x: 518, y: 25 },
      width: 135,
      height: 120,
      capacity: 60,
      status: 'Alert',
      appliancesCount: 8,
      cctvCount: 1,
      assetsCount: 2,
    },
    {
      id: '205',
      name: 'Seminar Hall',
      type: 'Seminar Hall / Auditorium',
      block: 'Block-B',
      floor: 'Floor 2',
      dimensions: { length: 8.0, width: 6.0 },
      position: { x: 661, y: 25 },
      width: 135,
      height: 120,
      capacity: 80,
      status: 'Normal',
      appliancesCount: 10,
      cctvCount: 1,
      assetsCount: 3,
    },
    {
      id: 'Washroom-M',
      name: 'Washroom (M)',
      type: 'Washroom / Restrooms',
      block: 'Block-B',
      floor: 'Floor 2',
      dimensions: { length: 4.0, width: 3.0 },
      position: { x: 804, y: 25 },
      width: 85,
      height: 120,
      capacity: 6,
      status: 'Occupied',
      appliancesCount: 2,
      cctvCount: 0,
      assetsCount: 1,
    },
    {
      id: '206',
      name: 'Faculty Room',
      type: 'Faculty Room / Cabins',
      block: 'Block-B',
      floor: 'Floor 2',
      dimensions: { length: 6.0, width: 5.0 },
      position: { x: 35, y: 255 },
      width: 130,
      height: 125,
      capacity: 20,
      status: 'Normal',
      appliancesCount: 4,
      cctvCount: 1,
      assetsCount: 2,
    },
    {
      id: '207',
      name: 'Lab',
      type: 'Lab (AI/ML / CS / IT)',
      block: 'Block-B',
      floor: 'Floor 2',
      dimensions: { length: 8.0, width: 6.0 },
      position: { x: 173, y: 255 },
      width: 135,
      height: 125,
      capacity: 40,
      status: 'Occupied',
      appliancesCount: 14,
      cctvCount: 1,
      assetsCount: 5,
    },
    {
      id: '208',
      name: 'Classroom',
      type: 'Classroom / Lecture Hall',
      block: 'Block-B',
      floor: 'Floor 2',
      dimensions: { length: 8.0, width: 6.0 },
      position: { x: 316, y: 255 },
      width: 135,
      height: 125,
      capacity: 60,
      status: 'Normal',
      appliancesCount: 6,
      cctvCount: 1,
      assetsCount: 2,
    },
    {
      id: 'Washroom',
      name: 'Washroom',
      type: 'Washroom / Restrooms',
      block: 'Block-B',
      floor: 'Floor 2',
      dimensions: { length: 6.0, width: 5.0 },
      position: { x: 459, y: 255 },
      width: 100,
      height: 125,
      capacity: 10,
      status: 'Occupied',
      appliancesCount: 2,
      cctvCount: 0,
      assetsCount: 1,
    },
    {
      id: '210',
      name: 'Lab',
      type: 'Lab (AI/ML / CS / IT)',
      block: 'Block-B',
      floor: 'Floor 2',
      dimensions: { length: 8.0, width: 6.0 },
      position: { x: 567, y: 255 },
      width: 135,
      height: 125,
      capacity: 40,
      status: 'Normal',
      appliancesCount: 12,
      cctvCount: 1,
      assetsCount: 4,
    },
  ]);

  // Selected Room ID (Default to 204 matching Screen 2)
  const [selectedRoomId, setSelectedRoomId] = useState('204');
  const [inspectorTab, setInspectorTab] = useState('Appliances (8)');
  const [draggingRoom, setDraggingRoom] = useState(null);
  const [toast, setToast] = useState(null);

  // Undo/Redo stack
  const [history, setHistory] = useState([rooms]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Selected room object
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Push to history
  const pushHistory = (newRooms) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push(JSON.parse(JSON.stringify(newRooms)));
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setRooms(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      showToast('↩️ Undone');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setRooms(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      showToast('↪️ Redone');
    }
  };

  const handleResetView = () => {
    setZoomLevel(100);
    showToast('View Reset to 100%');
  };

  // Room Inspector field updates
  const handleUpdateRoom = (field, value) => {
    const updated = rooms.map((r) => {
      if (r.id === selectedRoomId) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          return { ...r, [parent]: { ...r[parent], [child]: value } };
        }
        return { ...r, [field]: value };
      }
      return r;
    });
    setRooms(updated);
    pushHistory(updated);
  };

  // Save & Apply Layout Action (Synchronizes layout across all roles & dashboards!)
  const handleSaveAndApply = async () => {
    // Build canonical spatial digital twin model matching backend & SpatialDigitalTwin2D format
    const updatedSpatialModel = {
      campus_name: 'Smart Campus Digital Twin & Facility Intelligence Platform',
      center_gps: { lat: 28.6139, lng: 77.209 },
      blocks: [
        {
          block_name: selectedBlock || 'Block-B',
          gps_lat: 28.6139,
          gps_lng: 77.209,
          total_floors: 2,
          floors: [
            {
              floor_number: selectedFloor === 'Floor 1' ? 1 : 2,
              name: `${selectedFloor || 'Floor 2'} (Academic Wing)`,
              width: 1000,
              height: 600,
              rooms: [
                ...rooms.map((r) => ({
                  room_number: String(r.id),
                  room_type: r.type || 'CLASSROOM',
                  name: r.name || r.id,
                  x: r.position?.x ?? 50,
                  y: r.position?.y ?? 50,
                  width: r.width ?? 140,
                  height: r.height ?? 120,
                  seating_capacity: r.capacity ?? 50,
                  color: r.status === 'Alert' ? '#3b1419' : '#0f172a',
                  total_kw: Number((Number(r.appliancesCount || 4) * 0.42).toFixed(2)),
                  status: (r.status || 'NORMAL').toUpperCase(),
                  appliances: Array.from({ length: r.appliancesCount || 4 }).map((_, idx) => ({
                    name: idx === 0 ? 'Split AC' : idx === 1 ? 'LED Panel Lights' : 'Fan / Workstation',
                    count: 1,
                    kw: 0.35,
                  })),
                  cctv_ids: [`CAM-${r.id}`],
                })),
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
                  room_number: 'Washroom-M',
                  room_type: 'WASHROOM',
                  name: 'Washroom (M)',
                  x: 804,
                  y: 25,
                  width: 85,
                  height: 120,
                  seating_capacity: 6,
                  total_kw: 0.6,
                  status: 'OCCUPIED',
                  appliances: [],
                  cctv_ids: [],
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
                  name: 'Lab 202 AI Camera',
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
                  y: 158,
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
      updated_at: new Date().toISOString(),
      updated_by: 'Super Admin',
    };

    // 1. Save to localStorage for instant cross-tab & cross-component sync
    try {
      localStorage.setItem('campus_master_spatial_layout', JSON.stringify(updatedSpatialModel));
      localStorage.setItem(
        'campus_spatial_layout_applied',
        JSON.stringify({
          block: selectedBlock,
          floor: selectedFloor,
          roomsCount: rooms.length,
          timestamp: new Date().toISOString(),
        })
      );
      // Dispatch custom event for real-time live map updates across open tabs & roles
      window.dispatchEvent(new CustomEvent('campus_layout_updated', { detail: updatedSpatialModel }));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 2. Persist to Backend MongoDB API
    try {
      await axiosClient.post('/spatial/save-layout', updatedSpatialModel);
    } catch (err) {
      console.warn('Backend layout save fallback:', err);
    }

    // 3. Navigate back to Super Admin Dashboard with applied state
    navigate('/admin/dashboard', {
      state: { applied: true },
    });
  };

  // Delete Room
  const handleDeleteRoom = (roomId) => {
    const updated = rooms.filter((r) => r.id !== roomId);
    setRooms(updated);
    pushHistory(updated);
    if (selectedRoomId === roomId && updated.length > 0) {
      setSelectedRoomId(updated[0].id);
    }
    showToast(`Room ${roomId} deleted`);
  };

  // Dragging handlers for interactive SVG canvas
  const handleRoomMouseDown = (e, room) => {
    if (activeTool !== 'select') return;
    setSelectedRoomId(room.id);
    const startX = e.clientX;
    const startY = e.clientY;
    setDraggingRoom({
      id: room.id,
      startX,
      startY,
      origX: room.position.x,
      origY: room.position.y,
    });
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggingRoom) return;
    const dx = e.clientX - draggingRoom.startX;
    const dy = e.clientY - draggingRoom.startY;
    const nextX = Math.max(10, Math.min(950, draggingRoom.origX + dx));
    const nextY = Math.max(10, Math.min(420, draggingRoom.origY + dy));

    setRooms((prev) =>
      prev.map((r) =>
        r.id === draggingRoom.id ? { ...r, position: { x: nextX, y: nextY } } : r
      )
    );
  };

  const handleCanvasMouseUp = () => {
    if (draggingRoom) {
      pushHistory(rooms);
      setDraggingRoom(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans select-none overflow-x-hidden"
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
    >
      {/* ============================================================= */}
      {/* 1. TOP HEADER BAR                                             */}
      {/* ============================================================= */}
      <header className="bg-white border-b border-slate-200/90 px-5 py-2.5 flex items-center justify-between shadow-sm sticky top-0 z-30">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] p-0.5 shadow-md flex items-center justify-center border border-amber-400/50">
            <Building className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="text-sm font-black font-heading text-[#1e1b4b] leading-tight">
              Smart Campus
            </div>
            <div className="text-[10px] font-semibold text-slate-400 tracking-wide">
              Map Builder
            </div>
          </div>
        </div>

        {/* Center-Left: Breadcrumb & Sector Title */}
        <div className="flex items-center space-x-3 border-l border-slate-200 pl-4 shrink-0">
          <Building className="w-4 h-4 text-blue-600" />
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-black text-slate-900">
              <span>{selectedBlock}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span>{selectedFloor}</span>
              <Pencil className="w-3 h-3 text-slate-400 hover:text-blue-600 cursor-pointer ml-1" />
            </div>
            <div className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
              Engineering Block • Second Floor
            </div>
          </div>
        </div>

        {/* Center: Status Legend Pills */}
        <div className="hidden xl:flex items-center space-x-3 text-[11px] font-medium text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Normal</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Alert</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Maintenance</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Offline</span>
          </div>
        </div>

        {/* Right: Actions (Undo, Redo, Reset, Save & Apply) */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span>Redo</span>
          </button>

          <button
            onClick={handleResetView}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>

          {/* MAIN CTA: Save & Apply Layout (Returns to Dashboard!) */}
          <button
            onClick={handleSaveAndApply}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ml-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save &amp; Apply Layout</span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 right-8 z-50 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center space-x-2 animate-bounce-subtle">
          <span>{toast}</span>
        </div>
      )}

      {/* ============================================================= */}
      {/* 2. MAIN 4-PANEL WORKSPACE                                     */}
      {/* ============================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ----------------------------------------------------------- */}
        {/* PANEL 1: CAMPUS STRUCTURE TREE (WIDTH ~230px)               */}
        {/* ----------------------------------------------------------- */}
        <aside className="w-56 bg-white border-r border-slate-200 p-3.5 flex flex-col shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-heading">
              Campus Structure
            </h3>
            <button
              onClick={() => showToast('Add Block modal opened')}
              className="px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          {/* Hierarchy Tree */}
          <div className="space-y-1 text-xs">
            {/* College Root */}
            <div className="flex items-center space-x-1.5 py-1 text-slate-800 font-bold">
              <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Smart Engineering College</span>
            </div>

            {/* Block A */}
            <div className="pl-3 space-y-1">
              <div
                onClick={() =>
                  setExpandedBlocks((p) => ({ ...p, 'Block-A': !p['Block-A'] }))
                }
                className="flex items-center space-x-1 py-1 text-slate-700 font-semibold hover:text-blue-600 cursor-pointer"
              >
                {expandedBlocks['Block-A'] ? (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                )}
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span>Block-A</span>
              </div>
              {expandedBlocks['Block-A'] && (
                <div className="pl-5 space-y-0.5 text-slate-600 text-[11px]">
                  {['Floor 1', 'Floor 2', 'Floor 3'].map((f) => (
                    <div
                      key={f}
                      onClick={() => {
                        setSelectedBlock('Block-A');
                        setSelectedFloor(f);
                      }}
                      className={`px-2 py-1 rounded cursor-pointer ${
                        selectedBlock === 'Block-A' && selectedFloor === f
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      • {f}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Block B (Expanded by default) */}
            <div className="pl-3 space-y-1">
              <div
                onClick={() =>
                  setExpandedBlocks((p) => ({ ...p, 'Block-B': !p['Block-B'] }))
                }
                className="flex items-center space-x-1 py-1 text-slate-800 font-bold cursor-pointer"
              >
                {expandedBlocks['Block-B'] ? (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                )}
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Block-B</span>
              </div>
              {expandedBlocks['Block-B'] && (
                <div className="pl-5 space-y-0.5 text-slate-600 text-[11px]">
                  {['Floor 1', 'Floor 2', 'Floor 3'].map((f) => (
                    <div
                      key={f}
                      onClick={() => {
                        setSelectedBlock('Block-B');
                        setSelectedFloor(f);
                      }}
                      className={`px-2.5 py-1 rounded-lg cursor-pointer flex items-center justify-between ${
                        selectedBlock === 'Block-B' && selectedFloor === f
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>• {f}</span>
                      {selectedBlock === 'Block-B' && selectedFloor === f && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Block C */}
            <div className="pl-3 space-y-1">
              <div
                onClick={() =>
                  setExpandedBlocks((p) => ({ ...p, 'Block-C': !p['Block-C'] }))
                }
                className="flex items-center space-x-1 py-1 text-slate-700 font-semibold hover:text-blue-600 cursor-pointer"
              >
                {expandedBlocks['Block-C'] ? (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                )}
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span>Block-C</span>
              </div>
              {expandedBlocks['Block-C'] && (
                <div className="pl-5 space-y-0.5 text-slate-600 text-[11px]">
                  {['Floor 1', 'Floor 2'].map((f) => (
                    <div
                      key={f}
                      onClick={() => {
                        setSelectedBlock('Block-C');
                        setSelectedFloor(f);
                      }}
                      className={`px-2 py-1 rounded cursor-pointer ${
                        selectedBlock === 'Block-C' && selectedFloor === f
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      • {f}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ----------------------------------------------------------- */}
        {/* PANEL 2: DRAWING TOOLS (WIDTH ~150px)                       */}
        {/* ----------------------------------------------------------- */}
        <aside className="w-40 bg-white border-r border-slate-200 p-2.5 flex flex-col shrink-0 overflow-y-auto">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-heading mb-2 px-1">
            Drawing Tools
          </h3>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {/* Select / Move */}
            <button
              onClick={() => setActiveTool('select')}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition text-center cursor-pointer ${
                activeTool === 'select'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Move className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] leading-tight font-medium">Select / Move</span>
            </button>

            {/* Pan */}
            <button
              onClick={() => setActiveTool('pan')}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition text-center cursor-pointer ${
                activeTool === 'pan'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Hand className="w-4 h-4 text-slate-600" />
              <span className="text-[10px] leading-tight font-medium">Pan</span>
            </button>

            {/* Draw Room */}
            <button
              onClick={() => {
                setActiveTool('draw_room');
                showToast('Click and drag on canvas to draw a room');
              }}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition text-center cursor-pointer ${
                activeTool === 'draw_room'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Square className="w-4 h-4 text-slate-600" />
              <span className="text-[10px] leading-tight font-medium">Draw Room</span>
            </button>

            {/* Draw Corridor */}
            <button
              onClick={() => setActiveTool('draw_corridor')}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition text-center cursor-pointer ${
                activeTool === 'draw_corridor'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Minus className="w-4 h-4 text-slate-600" />
              <span className="text-[10px] leading-tight font-medium">Draw Corridor</span>
            </button>

            {/* Draw Building */}
            <button
              onClick={() => setActiveTool('draw_building')}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition text-center cursor-pointer ${
                activeTool === 'draw_building'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Building className="w-4 h-4 text-slate-600" />
              <span className="text-[10px] leading-tight font-medium">Draw Building</span>
            </button>

            {/* + Add Floor */}
            <button
              onClick={() => showToast('New Floor Added')}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex flex-col items-center justify-center space-y-1 text-center cursor-pointer"
            >
              <Layers className="w-4 h-4 text-slate-600" />
              <span className="text-[10px] leading-tight font-medium">+ Add Floor</span>
            </button>

            {/* Stairs */}
            <button
              onClick={() => setActiveTool('stairs')}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex flex-col items-center justify-center space-y-1 text-center cursor-pointer"
            >
              <span className="text-xs">🪜</span>
              <span className="text-[10px] leading-tight font-medium">Stairs</span>
            </button>

            {/* Elevator */}
            <button
              onClick={() => setActiveTool('elevator')}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex flex-col items-center justify-center space-y-1 text-center cursor-pointer"
            >
              <span className="text-xs">🛗</span>
              <span className="text-[10px] leading-tight font-medium">Elevator</span>
            </button>

            {/* Gate */}
            <button
              onClick={() => setActiveTool('gate')}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex flex-col items-center justify-center space-y-1 text-center cursor-pointer"
            >
              <DoorOpen className="w-4 h-4 text-slate-600" />
              <span className="text-[10px] leading-tight font-medium">Gate</span>
            </button>

            {/* CCTV Camera */}
            <button
              onClick={() => {
                setActiveTool('camera');
                showToast('Click anywhere on canvas to drop a camera');
              }}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex flex-col items-center justify-center space-y-1 text-center cursor-pointer"
            >
              <Video className="w-4 h-4 text-purple-600" />
              <span className="text-[10px] leading-tight font-medium">CCTV Camera</span>
            </button>

            {/* Asset / Appliance */}
            <button
              onClick={() => setActiveTool('appliance')}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex flex-col items-center justify-center space-y-1 text-center cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] leading-tight font-medium">Asset / Appliance</span>
            </button>

            {/* Text Label */}
            <button
              onClick={() => setActiveTool('text')}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex flex-col items-center justify-center space-y-1 text-center cursor-pointer"
            >
              <Type className="w-4 h-4 text-slate-600" />
              <span className="text-[10px] leading-tight font-medium">Text Label</span>
            </button>

            {/* Measure */}
            <button
              onClick={() => setActiveTool('measure')}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex flex-col items-center justify-center space-y-1 text-center cursor-pointer"
            >
              <Ruler className="w-4 h-4 text-slate-600" />
              <span className="text-[10px] leading-tight font-medium">Measure</span>
            </button>

            {/* Eraser */}
            <button
              onClick={() => setActiveTool('eraser')}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex flex-col items-center justify-center space-y-1 text-center cursor-pointer"
            >
              <Eraser className="w-4 h-4 text-slate-600" />
              <span className="text-[10px] leading-tight font-medium">Eraser</span>
            </button>

            {/* Delete (Red) */}
            <button
              onClick={() => handleDeleteRoom(selectedRoomId)}
              className="col-span-2 p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center space-x-1.5 transition text-center cursor-pointer font-bold"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-[11px]">Delete</span>
            </button>
          </div>
        </aside>

        {/* ----------------------------------------------------------- */}
        {/* PANEL 3: INTERACTIVE FLOOR-PLAN CANVAS                      */}
        {/* ----------------------------------------------------------- */}
        <main className="flex-1 bg-[#f1f5f9] p-4 relative overflow-auto flex items-center justify-center">
          {/* Floating Zoom Controls (Top-Right) */}
          <div className="absolute top-5 right-5 z-20 flex items-center bg-white border border-slate-200 rounded-xl shadow-md p-1 space-x-1 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center font-black cursor-pointer text-slate-700"
            >
              -
            </button>
            <span className="px-2 font-mono font-bold text-slate-700 text-[11px]">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center font-black cursor-pointer text-slate-700"
            >
              +
            </button>
          </div>

          {/* SVG CAD Architectural Canvas */}
          <div
            className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden relative"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
          >
            <svg viewBox="0 0 980 430" className="w-full h-auto select-none">
              <defs>
                {/* Architectural Grid Pattern */}
                <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect width="980" height="430" fill="url(#cadGrid)" />

              {/* Outer Wall Perimeter */}
              <rect
                x="20"
                y="15"
                width="940"
                height="400"
                fill="none"
                stroke="#64748b"
                strokeWidth="4"
                rx="6"
              />

              {/* CENTRAL CORRIDOR (C-1) */}
              <g>
                <rect x="24" y="165" width="932" height="90" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                <text
                  x="490"
                  y="205"
                  fill="#475569"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  Corridor (C-1)
                </text>
                <text
                  x="490"
                  y="222"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  Width: 2.5 m
                </text>

                {/* Corridor Items: Fire Extinguishers */}
                <g transform="translate(60, 200)">
                  <circle cx="0" cy="0" r="6" fill="#ef4444" />
                  <text x="0" y="3" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">🧯</text>
                </g>
                <g transform="translate(930, 200)">
                  <circle cx="0" cy="0" r="6" fill="#ef4444" />
                  <text x="0" y="3" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">🧯</text>
                </g>

                {/* Potted Plants */}
                <g transform="translate(340, 195)">
                  <circle cx="0" cy="0" r="7" fill="#10b981" opacity="0.8" />
                  <text x="0" y="3" fill="#ffffff" fontSize="8" textAnchor="middle">🪴</text>
                </g>
                <g transform="translate(680, 195)">
                  <circle cx="0" cy="0" r="7" fill="#10b981" opacity="0.8" />
                  <text x="0" y="3" fill="#ffffff" fontSize="8" textAnchor="middle">🪴</text>
                </g>

                {/* CCTV Cameras */}
                <g transform="translate(200, 180)">
                  <polygon points="0,0 20,-10 20,10" fill="#a855f7" opacity="0.25" />
                  <circle cx="0" cy="0" r="5" fill="#9333ea" />
                  <text x="0" y="3" fill="#ffffff" fontSize="7" textAnchor="middle">📹</text>
                </g>
                <g transform="translate(540, 180)">
                  <polygon points="0,0 20,-10 20,10" fill="#a855f7" opacity="0.25" />
                  <circle cx="0" cy="0" r="5" fill="#9333ea" />
                  <text x="0" y="3" fill="#ffffff" fontSize="7" textAnchor="middle">📹</text>
                </g>

                {/* Plants, Cameras & Extinguishers */}
              </g>

              {/* Stairs-1 (Top-Left Architectural Section) */}
              <g transform="translate(35, 25)">
                <rect x="0" y="0" width="55" height="120" rx="4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
                <line x1="0" y1="20" x2="55" y2="20" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="0" y1="40" x2="55" y2="40" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="0" y1="60" x2="55" y2="60" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="0" y1="80" x2="55" y2="80" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="0" y1="100" x2="55" y2="100" stroke="#cbd5e1" strokeWidth="1" />
                <text x="27" y="114" fill="#475569" fontSize="9" fontWeight="bold" textAnchor="middle">Stairs-1</text>
              </g>

              {/* Lift-1 (Bottom-Right Section) */}
              <g transform="translate(710, 255)">
                <rect x="0" y="0" width="85" height="125" rx="6" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                <rect x="15" y="25" width="55" height="65" rx="4" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
                <text x="42" y="58" fill="#1e293b" fontSize="16" textAnchor="middle">🛗</text>
                <text x="42" y="78" fill="#1e293b" fontSize="10" fontWeight="bold" textAnchor="middle">Lift-1</text>
              </g>

              {/* Stairs-2 (Far Bottom-Right Section) */}
              <g transform="translate(803, 255)">
                <rect x="0" y="0" width="86" height="125" rx="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
                <line x1="0" y1="20" x2="86" y2="20" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="0" y1="40" x2="86" y2="40" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="0" y1="60" x2="86" y2="60" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="0" y1="80" x2="86" y2="80" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="0" y1="100" x2="86" y2="100" stroke="#cbd5e1" strokeWidth="1" />
                <text x="43" y="118" fill="#475569" fontSize="9" fontWeight="bold" textAnchor="middle">Stairs-2</text>
              </g>

              {/* RENDER ALL ROOMS */}
              {rooms.map((room) => {
                const isSelected = room.id === selectedRoomId;
                const statusTheme = STATUS_COLORS[room.status] || STATUS_COLORS.Normal;

                return (
                  <g
                    key={room.id}
                    onMouseDown={(e) => handleRoomMouseDown(e, room)}
                    className="cursor-pointer group"
                  >
                    {/* Selected Glow Ring */}
                    {isSelected && (
                      <rect
                        x={room.position.x - 3}
                        y={room.position.y - 3}
                        width={room.width + 6}
                        height={room.height + 6}
                        rx="8"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                      />
                    )}

                    {/* Room Box Body */}
                    <rect
                      x={room.position.x}
                      y={room.position.y}
                      width={room.width}
                      height={room.height}
                      rx="6"
                      fill={statusTheme.bg}
                      stroke={isSelected ? '#2563eb' : statusTheme.border}
                      strokeWidth={isSelected ? '2.5' : '1.8'}
                      className="transition-colors group-hover:brightness-95"
                    />

                    {/* Alert Badge on Top-Right Corner */}
                    {room.status === 'Alert' && (
                      <g transform={`translate(${room.position.x + room.width - 16}, ${room.position.y + 16})`}>
                        <circle cx="0" cy="0" r="8" fill="#ef4444" className="animate-ping opacity-60" />
                        <circle cx="0" cy="0" r="8" fill="#ef4444" />
                        <text x="0" y="3" fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">!</text>
                      </g>
                    )}

                    {/* Room Header Label (ID + Name) */}
                    <text
                      x={room.position.x + 12}
                      y={room.position.y + 22}
                      fill={statusTheme.text}
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {room.id} {room.name}
                    </text>

                    {/* Dimensions & Capacity */}
                    <text
                      x={room.position.x + 12}
                      y={room.position.y + 38}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {room.dimensions.length}.0 x {room.dimensions.width}.0 m
                    </text>
                    <text
                      x={room.position.x + 12}
                      y={room.position.y + 50}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="sans-serif"
                    >
                      {room.capacity} seats
                    </text>

                    {/* Door Icon Outline */}
                    <rect
                      x={room.position.x + 15}
                      y={room.position.y + room.height - 4}
                      width="20"
                      height="4"
                      fill="#ffffff"
                      stroke="#94a3b8"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </main>

        {/* ----------------------------------------------------------- */}
        {/* PANEL 4: ROOM INSPECTOR (WIDTH ~280px)                      */}
        {/* ----------------------------------------------------------- */}
        <aside className="w-72 bg-white border-l border-slate-200 p-4 flex flex-col shrink-0 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-heading">
              Room Inspector
            </h3>
            <button
              onClick={() => handleDeleteRoom(selectedRoom.id)}
              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
              title="Delete Room"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5 text-xs">
            {/* Room ID */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Room ID</label>
              <input
                type="text"
                value={selectedRoom.id}
                onChange={(e) => handleUpdateRoom('id', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-xs"
              />
            </div>

            {/* Room Name */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Room Name</label>
              <input
                type="text"
                value={selectedRoom.name}
                onChange={(e) => handleUpdateRoom('name', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-xs font-semibold"
              />
            </div>

            {/* Room Type Dropdown */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Room Type</label>
              <select
                value={selectedRoom.type}
                onChange={(e) => handleUpdateRoom('type', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-xs"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Block & Floor Dropdowns */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Block</label>
                <select
                  value={selectedRoom.block}
                  onChange={(e) => handleUpdateRoom('block', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-900 bg-slate-50 focus:bg-white outline-none text-xs"
                >
                  <option value="Block-A">Block-A</option>
                  <option value="Block-B">Block-B</option>
                  <option value="Block-C">Block-C</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Floor</label>
                <select
                  value={selectedRoom.floor}
                  onChange={(e) => handleUpdateRoom('floor', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-900 bg-slate-50 focus:bg-white outline-none text-xs"
                >
                  <option value="Floor 1">Floor 1</option>
                  <option value="Floor 2">Floor 2</option>
                  <option value="Floor 3">Floor 3</option>
                </select>
              </div>
            </div>

            {/* Dimensions (meters) */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Dimensions (meters)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    value={selectedRoom.dimensions.length}
                    onChange={(e) =>
                      handleUpdateRoom('dimensions.length', parseFloat(e.target.value) || 0)
                    }
                    className="w-full pl-3 pr-7 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-slate-50 focus:bg-white outline-none"
                  />
                  <span className="absolute right-2.5 top-1.5 text-slate-400 text-xs">m</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={selectedRoom.dimensions.width}
                    onChange={(e) =>
                      handleUpdateRoom('dimensions.width', parseFloat(e.target.value) || 0)
                    }
                    className="w-full pl-3 pr-7 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-slate-50 focus:bg-white outline-none"
                  />
                  <span className="absolute right-2.5 top-1.5 text-slate-400 text-xs">m</span>
                </div>
              </div>
            </div>

            {/* Position (meters from origin) */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Position (meters from origin)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    value={(selectedRoom.position.x / 10).toFixed(1)}
                    onChange={(e) =>
                      handleUpdateRoom('position.x', (parseFloat(e.target.value) || 0) * 10)
                    }
                    className="w-full pl-3 pr-7 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-slate-50 focus:bg-white outline-none"
                  />
                  <span className="absolute right-2.5 top-1.5 text-slate-400 text-xs">m</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={(selectedRoom.position.y / 10).toFixed(1)}
                    onChange={(e) =>
                      handleUpdateRoom('position.y', (parseFloat(e.target.value) || 0) * 10)
                    }
                    className="w-full pl-3 pr-7 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-slate-50 focus:bg-white outline-none"
                  />
                  <span className="absolute right-2.5 top-1.5 text-slate-400 text-xs">m</span>
                </div>
              </div>
            </div>

            {/* Seating Capacity & Status */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  value={selectedRoom.capacity}
                  onChange={(e) =>
                    handleUpdateRoom('capacity', parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Status</label>
                <select
                  value={selectedRoom.status}
                  onChange={(e) => handleUpdateRoom('status', e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                    selectedRoom.status === 'Alert'
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : selectedRoom.status === 'Occupied'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  }`}
                >
                  <option value="Normal">🟢 Normal</option>
                  <option value="Alert">🔴 Alert</option>
                  <option value="Occupied">🔵 Occupied</option>
                  <option value="Maintenance">🟡 Maintenance</option>
                  <option value="Offline">⚪ Offline</option>
                </select>
              </div>
            </div>

            {/* Tabs at Bottom (Appliances / CCTV / Assets) */}
            <div className="pt-2">
              <div className="flex border-b border-slate-200 text-[11px] font-bold">
                {['Appliances (8)', 'CCTV (1)', 'Assets (2)'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setInspectorTab(tab)}
                    className={`pb-2 px-2 transition border-b-2 cursor-pointer ${
                      inspectorTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content Preview */}
              <div className="pt-3 space-y-2 text-xs">
                {inspectorTab.includes('Appliances') && (
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                      <span>⚡ 2x Split AC (1.5 Ton)</span>
                      <span className="font-bold text-emerald-600">3.0 kW</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                      <span>💡 6x LED Battens</span>
                      <span className="font-bold text-emerald-600">0.24 kW</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                      <span>🌀 4x Ceiling Fans</span>
                      <span className="font-bold text-emerald-600">0.30 kW</span>
                    </div>
                  </div>
                )}

                {inspectorTab.includes('CCTV') && (
                  <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 space-y-1 text-[11px]">
                    <div className="font-bold flex items-center space-x-1">
                      <Video className="w-3.5 h-3.5 text-purple-600" />
                      <span>CAM-B204 (Indoor Dome)</span>
                    </div>
                    <div className="text-[10px] text-purple-700 font-mono">
                      rtsp://192.168.1.104/stream1 • 1080p
                    </div>
                  </div>
                )}

                {inspectorTab.includes('Assets') && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span>Smart 4K Projector</span>
                      <span className="font-mono text-slate-500">AST-401</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span>Audio PA System</span>
                      <span className="font-mono text-slate-500">AST-402</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CampusMapLayoutEngine;
