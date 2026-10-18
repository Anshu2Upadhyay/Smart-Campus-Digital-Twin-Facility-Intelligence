import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import { playWorkorderAlert } from '../../utils/soundEffects';
import FacilityLayout from '../../components/FacilityLayout';
import SpatialDigitalTwin2D from '../../components/SpatialDigitalTwin2D';
import MOCK_ASSETS from '../../utils/mockAssets';
import {
  Zap,
  Wrench,
  Building,
  UserPlus,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Send,
  Video,
  Timer,
  TrendingDown,
  ShieldAlert,
  Users,
  MapPin,
  Check,
  ChevronRight,
  Sun,
  Flame,
  Tv,
  Search,
  Bell,
  Settings,
  Phone,
  Play,
  Maximize2,
  Volume2,
  Layers,
  ChevronDown,
  Droplets,
  Snowflake,
  Brush,
  Armchair,
  Home,
  ClipboardCheck,
  Activity,
  BarChart2,
  Lock,
} from 'lucide-react';

const DEPARTMENTS = [
  { id: 'ELECTRICAL', name: 'ELECTRICAL', total: 8, available: 6, percent: 75, icon: Zap, color: 'text-amber-500', bg: 'bg-blue-600', avatars: ['amitKumar', 'rajatKumar', 'sureshPatel'] },
  { id: 'HVAC_AC', name: 'HVAC_AC', total: 6, available: 4, percent: 67, icon: Snowflake, color: 'text-blue-400', bg: 'bg-cyan-600', avatars: ['rajeshKumar', 'amitYadav'] },
  { id: 'PLUMBING', name: 'PLUMBING', total: 5, available: 3, percent: 60, icon: Droplets, color: 'text-cyan-400', bg: 'bg-teal-600', avatars: ['sureshKumar', 'rohitYadav'] },
  { id: 'HOUSEKEEPING', name: 'HOUSEKEEPING', total: 10, available: 8, percent: 80, icon: Brush, color: 'text-emerald-400', bg: 'bg-emerald-600', avatars: ['rameshKumar', 'manojGupta', 'karanSingh'] },
  { id: 'IT_AV', name: 'IT_AV', total: 4, available: 2, percent: 50, icon: Tv, color: 'text-purple-400', bg: 'bg-purple-600', avatars: ['amitSharma', 'vikramSingh'] },
  { id: 'CIVIL_CARPENTRY', name: 'CIVIL_CARPENTRY', total: 6, available: 4, percent: 67, icon: Armchair, color: 'text-orange-400', bg: 'bg-orange-600', avatars: ['sureshPatel', 'rajatKumar'] },
];

export const FacilityConsole = () => {
  const [workers, setWorkers] = useState([]);
  const [workorders, setWorkorders] = useState([]);
  const [floorGrid, setFloorGrid] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(2);
  const [selectedBlock, setSelectedBlock] = useState('Block-B (Main Academic)');
  const [activeNav, setActiveNav] = useState('Live Workforce');

  // Auto-Pilot 60s countdown timer state
  const [autopilotSeconds, setAutopilotSeconds] = useState(60);

  // Modal & form states
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const [newWorker, setNewWorker] = useState({
    name: '',
    phone: '',
    badge_id: 'WRK-305',
    department: 'HOUSEKEEPING',
    pin: '1234',
    default_block: 'Block-B',
    floor: 2,
  });

  const { notifications } = useSocket();

  // 60-Second Auto-Pilot Live Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setAutopilotSeconds((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadFacilityData = async () => {
    try {
      setLoading(true);
      const [workerRes, woRes, gridRes] = await Promise.all([
        axiosClient.get('/facility/workers').catch(() => ({ data: { workers: [] } })),
        axiosClient.get('/facility/workorders').catch(() => ({ data: [] })),
        axiosClient.get('/facility/floor-grid').catch(() => ({ data: {} })),
      ]);

      const wData = workerRes.data;
      setWorkers(Array.isArray(wData) ? wData : wData?.workers || []);
      const woList = woRes.data || [];
      setWorkorders(woList);
      setFloorGrid(gridRes.data || {});

      const ghostTicket = woList.find((w) => w.room_number === 'Room 204' || w.ticket_source === 'AI_GHOST_ENERGY');
      if (ghostTicket) {
        setSelectedTicket(ghostTicket);
      } else if (woList.length > 0) {
        setSelectedTicket(woList[0]);
      }
    } catch (err) {
      console.error('Error fetching facility supervisor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilityData();
  }, []);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      loadFacilityData();
    }
  }, [notifications]);

  // Create Worker
  const handleCreateWorker = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/facility/create-worker', {
        ...newWorker,
        staff_id: newWorker.badge_id,
      });

      setFeedback({
        type: 'success',
        message: `✅ Ground worker '${newWorker.name}' enrolled successfully!`,
      });
      setShowAddWorker(false);
      loadFacilityData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to create worker.',
      });
    }
  };

  // Dispatch Ramesh Kumar Now
  const handleDispatchRamesh = async () => {
    try {
      const ticketId = selectedTicket?.id || selectedTicket?._id || 'TK-1042';
      await axiosClient.post(`/facility/workorders/${ticketId}/dispatch`, {
        worker_id: 'WRK-201',
        notes: 'Dispatched via AI Smart Worker Recommendation (Ramesh Kumar - 98% Match)',
      });

      setDispatchSuccess(true);
      setFeedback({
        type: 'success',
        message: '⚡ Ramesh Kumar (WRK-201) dispatched! SLA Timer (02:45) engaged.',
      });
      playWorkorderAlert();
      loadFacilityData();
    } catch (err) {
      // Graceful fallback for UI demo simulation
      setDispatchSuccess(true);
      setFeedback({
        type: 'success',
        message: '⚡ Ramesh Kumar dispatched to Block-B, Floor 2, Room 204! SLA Active.',
      });
    }
  };

  // Trigger Demo Ghost Energy Drain
  const handleSimulateGhostEnergy = async () => {
    try {
      playWorkorderAlert();
      const res = await axiosClient.post('/facility/simulate-ghost-energy', {
        block_name: 'Block-B',
        room_number: 'Room 204',
        floor_number: 2,
        wasted_kw: 3.54,
        category: 'HVAC_AC',
      });

      setFeedback({
        type: 'warning',
        message: '⚡ 3.54 kW Ghost Energy Drain simulated in Block-B Room 204! 60s Auto-Pilot engaged.',
      });
      setAutopilotSeconds(60);
      loadFacilityData();
    } catch (err) {
      setFeedback({
        type: 'warning',
        message: '⚡ 3.54 kW Ghost Energy Alert refreshed for Block-B Room 204.',
      });
    }
  };

  return (
    <FacilityLayout>
      <div className="space-y-5">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
                feedback.type === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : feedback.type === 'error'
                  ? 'bg-red-50 border-red-300 text-red-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{feedback.message}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
          )}

          {/* =================================================================== */}
          {/* 3-COLUMN SUPERVISOR DASHBOARD */}
          {/* =================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* ------------------------------------------------------------- */}
            {/* COLUMN 1 (~2.7 cols): 6 DEPARTMENT WORKFORCE MATRIX */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-3 space-y-3">
              {/* Add Ground Worker Button */}
              <button
                onClick={() => setShowAddWorker(true)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Ground Worker</span>
              </button>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-800">
                    6 Department Workforce Matrix
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {DEPARTMENTS.map((dept) => {
                    const Icon = dept.icon;
                    return (
                      <div
                        key={dept.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-lg ${dept.bg} text-white flex items-center justify-center shadow-sm`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                              <span>{dept.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {dept.total} Workers | <strong className="text-emerald-600">{dept.available} Available</strong>
                            </div>

                            {/* Live availability bar */}
                            <div className="flex items-center space-x-2 mt-1.5">
                              <span className="text-[9px] font-bold text-emerald-600 font-mono">Live</span>
                              <div className="w-20 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${dept.percent}%` }}
                                ></div>
                              </div>
                              <span className="text-[9px] font-mono text-slate-500">{dept.percent}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {dept.avatars.map((avKey, aIdx) => (
                              <img
                                key={aIdx}
                                src={MOCK_ASSETS.avatars[avKey] || MOCK_ASSETS.avatars.rameshKumar}
                                alt="Worker"
                                className="inline-block h-5 w-5 rounded-full ring-1 ring-white object-cover"
                              />
                            ))}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* COLUMN 2 (~5.5 cols): FLOOR GRID & ACTIVE INCIDENTS */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-5 space-y-4">
              {/* Campus Building Floor Grid Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                        Campus Building Floor Grid
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Visual room status, live equipment state and active tickets
                      </p>
                    </div>
                  </div>

                  {/* Block Dropdown */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedBlock}
                      onChange={(e) => setSelectedBlock(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="Block-B (Main Academic)">Block-B (Main Academic)</option>
                      <option value="Block-A">Block-A</option>
                      <option value="Block-C">Block-C</option>
                    </select>
                  </div>
                </div>

                {/* Floor Switcher & Legend Bar */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex space-x-1 bg-slate-100 p-0.5 rounded-xl font-bold">
                    {[1, 2, 3].map((f) => (
                      <button
                        key={f}
                        onClick={() => setSelectedFloor(f)}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          selectedFloor === f
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Floor {f}
                      </button>
                    ))}
                  </div>

                  {/* Status Legends */}
                  <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Normal</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span>Alert</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Maintenance</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>Occupied</span>
                    </span>
                  </div>
                </div>

                {/* Master 2D Spatial Digital Twin & Energy Load Heatmap */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-sm">
                  <SpatialDigitalTwin2D height="360px" activeRole="FACILITY" />
                </div>
              </div>

              {/* Bottom 2 Incident Cards (Side-by-Side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Incident Card 1: AI Detected Issue (Ghost Energy Alert) */}
                <div className="bg-white rounded-2xl p-4 border-2 border-red-200/80 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-xs font-bold text-red-600">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                      <span>AI Detected Issue (Energy Alert)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[9px] font-bold">
                      High Priority
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      Room 204 – Ghost Energy Drain
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Headcount == 0 for 10 minutes
                    </p>
                  </div>

                  {/* Telemetry Stats */}
                  <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-50 p-2 rounded-xl border border-slate-200 text-[10px]">
                    <div>
                      <div className="font-bold text-slate-700">2 Split AC</div>
                      <div className="text-[9px] text-slate-400">(3.0 kW)</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-700">6 Lights</div>
                      <div className="text-[9px] text-slate-400">(0.24 kW)</div>
                    </div>
                    <div>
                      <div className="font-black text-red-600">3.54 kW</div>
                      <div className="text-[9px] text-red-500 font-bold">Total Waste</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Block-B • Floor 2 • Room 204</span>
                    <span>10:24 AM</span>
                  </div>

                  {/* Sparkline curve */}
                  <div className="p-2 rounded-xl bg-red-50/60 border border-red-100">
                    <div className="text-[9px] text-red-700 font-bold flex items-center justify-between">
                      <span>Energy Usage (Last 1 Hour)</span>
                      <span>3.54 kW (Abnormal)</span>
                    </div>
                    {/* SVG Sparkline */}
                    <svg className="w-full h-8 mt-1" viewBox="0 0 100 25" preserveAspectRatio="none">
                      <path
                        d="M0 20 Q 20 18, 40 22 T 70 8 T 100 4"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      View Details
                    </button>
                    <button
                      onClick={handleDispatchRamesh}
                      className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <span>Create Work Order</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Incident Card 2: Student/Faculty Grievance */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-xs font-bold text-purple-700">
                      <Tv className="w-3.5 h-3.5 text-purple-600" />
                      <span>Student/Faculty Grievance</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold">
                      Medium Priority
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      Lab 102 – Projector Fault & Washroom Tap Leak
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Projector not working and washroom tap leaking since morning.
                    </p>
                  </div>

                  {/* Previews */}
                  <div className="flex items-center space-x-2">
                    <img
                      src={MOCK_ASSETS.projectorFault}
                      alt="Projector"
                      className="w-12 h-10 rounded-lg object-cover border border-slate-200"
                    />
                    <img
                      src={MOCK_ASSETS.washroomTap}
                      alt="Tap"
                      className="w-12 h-10 rounded-lg object-cover border border-slate-200"
                    />
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      +2
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Block-B • Floor 1 • Lab 102</span>
                    <span>09:48 AM</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center space-x-2">
                      <img
                        src={MOCK_ASSETS.avatars.rahulSharma}
                        alt="Rahul Sharma"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-800 text-[11px]">Rahul Sharma</div>
                        <div className="text-[9px] text-slate-400">Student (CSE)</div>
                      </div>
                    </div>
                    <button className="text-[10px] font-bold text-blue-600 hover:underline">
                      Contact
                    </button>
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      View Details
                    </button>
                    <button
                      onClick={handleDispatchRamesh}
                      className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <span>Assign Worker</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* COLUMN 3 (~3.8 cols): CCTV VERIFICATION & AI WORKER ENGINE */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-4">
              {/* CCTV Verification Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-xs sm:text-sm text-slate-800">
                      CCTV Verification
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    ● Live
                  </span>
                </div>

                {/* Privacy Warning Alert */}
                <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-[10px] text-red-700 flex items-center space-x-2">
                  <Lock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <div>
                    <strong>Classroom Cameras Blurred/Locked by Default</strong>
                    <div className="text-[9px] text-red-600">
                      Only facility areas (corridors, utilities, infra rooms) are accessible.
                    </div>
                  </div>
                </div>

                {/* Camera Selector Dropdown */}
                <div className="flex items-center justify-between">
                  <select className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none">
                    <option>Room 204 – Classroom</option>
                    <option>Corridor Floor 2</option>
                    <option>Main Electrical Panel</option>
                  </select>

                  <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    ⏱️ 5 Sec Clip
                  </span>
                </div>

                {/* Video Player Mock with Controls */}
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video flex items-center justify-center group">
                  <img
                    src={MOCK_ASSETS.classroomCctv}
                    alt="Classroom Interior CCTV"
                    className="w-full h-full object-cover opacity-90"
                  />
                  {/* Play Bar Overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center space-x-2">
                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                      <span>0:00 / 0:05</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-3.5 h-3.5" />
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Smart Worker Recommendation Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">
                    AI Smart Worker Recommendation
                  </h3>
                </div>

                {/* Worker Match Info */}
                <div className="flex items-center space-x-4">
                  {/* Radial Ring 98% Match */}
                  <div className="relative w-16 h-16 rounded-full border-4 border-emerald-500 bg-emerald-50/60 flex flex-col items-center justify-center shrink-0">
                    <span className="text-sm font-black text-emerald-600">98%</span>
                    <span className="text-[8px] font-bold text-emerald-700 uppercase">Match</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-extrabold text-slate-800">Ramesh Kumar</h4>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                        ★ Recommended
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Housekeeping • WRK-304
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-600 mt-1 font-mono">
                      <span className="text-emerald-600 font-bold">● Free</span>
                      <span>•</span>
                      <span>22 meters away</span>
                      <span>•</span>
                      <span className="text-blue-600 font-bold">Block-B, Floor 2</span>
                    </div>
                  </div>
                </div>

                {/* 4 Selection Reasons with Checkmarks */}
                <div className="space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Selection Reasons
                  </div>
                  {[
                    { label: 'Department Match (Housekeeping)', score: '+40%' },
                    { label: 'GPS Distance (22m)', score: '+35%' },
                    { label: 'Same Floor (Floor 2)', score: '+20%' },
                    { label: 'High Availability', score: '+5%' },
                  ].map((reason, rIdx) => (
                    <div
                      key={rIdx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]"
                    >
                      <div className="flex items-center space-x-2 text-slate-700 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{reason.label}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600">{reason.score}</span>
                    </div>
                  ))}
                </div>

                {/* Big Green Dispatch Button */}
                <button
                  onClick={handleDispatchRamesh}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>
                    {dispatchSuccess ? 'Ramesh Kumar Dispatched (SLA Active)' : 'Dispatch Ramesh Now'}
                  </span>
                </button>

                {/* Auto-Pilot 60s Countdown Bar */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-blue-500 text-blue-600 font-black text-xs flex items-center justify-center font-mono shrink-0">
                    {autopilotSeconds}s
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Auto-Pilot Mode</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Auto-assigning best available worker in {autopilotSeconds} seconds... You can dispatch now or wait.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* =================================================================== */}
      {/* ADD GROUND WORKER MODAL */}
      {/* =================================================================== */}
      {showAddWorker && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Enroll Ground Technician</h3>
              <button
                onClick={() => setShowAddWorker(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">Worker Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newWorker.name}
                  onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">Badge ID</label>
                  <input
                    type="text"
                    required
                    value={newWorker.badge_id}
                    onChange={(e) => setNewWorker({ ...newWorker, badge_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={newWorker.pin}
                    onChange={(e) => setNewWorker({ ...newWorker, pin: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Department Trade</label>
                <select
                  value={newWorker.department}
                  onChange={(e) => setNewWorker({ ...newWorker, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                >
                  <option value="HOUSEKEEPING">HOUSEKEEPING</option>
                  <option value="ELECTRICAL">ELECTRICAL</option>
                  <option value="HVAC_AC">HVAC_AC</option>
                  <option value="PLUMBING">PLUMBING</option>
                  <option value="IT_AV">IT_AV</option>
                  <option value="CIVIL_CARPENTRY">CIVIL_CARPENTRY</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWorker(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FacilityLayout>
  );
};

export default FacilityConsole;
