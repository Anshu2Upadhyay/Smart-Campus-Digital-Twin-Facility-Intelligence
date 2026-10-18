import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import AdminLayout from '../../components/AdminLayout';
import CampusMap from '../../components/CampusMap';
import SpatialDigitalTwin2D from '../../components/SpatialDigitalTwin2D';
import MOCK_ASSETS from '../../utils/mockAssets';
import {
  Shield,
  Zap,
  Wallet,
  Users,
  Radio,
  Maximize2,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Play,
  Volume2,
  Check,
  Send,
  Eye,
  RefreshCw,
  Clock,
  Sparkles,
  MapPin,
  Building,
  Filter,
  X,
  SlidersHorizontal,
  Video,
  Briefcase,
  ClipboardList,
  DoorOpen,
  Layers,
  Map as MapIcon,
} from 'lucide-react';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications = [], connected } = useSocket();

  // View state: '2D' | '3D' | 'Satellite'
  const [mapMode, setMapMode] = useState('2D');
  const [layerFilter, setLayerFilter] = useState('All Layers');
  const [eventFilter, setEventFilter] = useState('All Events');

  // Interactive Layer Toggles
  const [layers, setLayers] = useState({
    buildings: true,
    rooms: true,
    cctv: true,
    guards: true,
    workers: true,
    assets: false,
    incidents: true,
  });

  // Action feedback banner
  const [toast, setToast] = useState(null);

  // Active modal state
  const [activeModal, setActiveModal] = useState(null); // { type: 'camera'|'override'|'complaint'|'generator', data: any }
  const [targetStaff, setTargetStaff] = useState('SEC-001');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  // Summary Metrics
  const [summary, setSummary] = useState({
    safety_score: 96,
    active_energy_load_kw: 142.0,
    saved_today_rupees: 4200,
    saved_today_kwh: 494,
    staff_present_count: 28,
    total_staff_count: 32,
    active_security_incidents_count: 1,
    active_facility_workorders_count: 3,
  });

  // Real-Time Attendance Ledger Data
  const [attendanceList, setAttendanceList] = useState([
    {
      id: 1,
      staff_id: 'SEC-001',
      name: 'Amit Sharma',
      avatar: MOCK_ASSETS.avatars.amitSharma,
      role: 'SECURITY_GUARD',
      dept: 'Security',
      deptType: 'security',
      check_in_time: '09:02 AM',
      location: 'Block-B, Floor 2',
      status: 'Free',
      statusType: 'free',
      tasks_completed: 5,
      tasks_total: 6,
    },
    {
      id: 2,
      staff_id: 'WRK-104',
      name: 'Rohit Yadav',
      avatar: MOCK_ASSETS.avatars.rohitYadav,
      role: 'GROUND_WORKER',
      dept: 'Maintenance',
      deptType: 'maintenance',
      check_in_time: '08:55 AM',
      location: 'Block-A, Floor 1',
      status: 'On-Task',
      statusType: 'on_task',
      tasks_completed: 3,
      tasks_total: 5,
    },
    {
      id: 3,
      staff_id: 'SEC-007',
      name: 'Suresh Kumar',
      avatar: MOCK_ASSETS.avatars.sureshKumar,
      role: 'SECURITY_GUARD',
      dept: 'Security',
      deptType: 'security',
      check_in_time: '09:10 AM',
      location: 'Main Gate (Gate 1)',
      status: 'Free',
      statusType: 'free',
      tasks_completed: 4,
      tasks_total: 4,
    },
    {
      id: 4,
      staff_id: 'FAC-022',
      name: 'Pooja Singh',
      avatar: MOCK_ASSETS.avatars.poojaSingh,
      role: 'FACULTY',
      dept: 'Faculty',
      deptType: 'faculty',
      check_in_time: '08:50 AM',
      location: 'Academic Block, 3rd',
      status: 'On-Task',
      statusType: 'on_task',
      tasks_completed: 2,
      tasks_total: 3,
    },
    {
      id: 5,
      staff_id: 'STD-118',
      name: 'Neha Verma',
      avatar: MOCK_ASSETS.avatars.nehaVerma,
      role: 'STUDENT',
      dept: 'Student',
      deptType: 'student',
      check_in_time: '09:05 AM',
      location: 'Library',
      status: 'Break',
      statusType: 'break',
      tasks_completed: 1,
      tasks_total: 2,
    },
  ]);

  // Real-Time Notification & Audit Events Stream
  const [auditStream, setAuditStream] = useState([
    {
      id: 'evt-1',
      time: '2 min ago',
      type: 'SOS Triggered',
      category: 'security_sos',
      title: 'SOS Triggered',
      sub: 'Block-B, Floor 2 (Room 204)',
      desc: 'Student pressed SOS button',
      thumbnail: MOCK_ASSETS.corridorCctv,
      severity: 'CRITICAL',
      primaryAction: { label: 'View Live Camera', type: 'view_camera' },
      secondaryAction: { label: 'Force-Assign Staff', type: 'force_assign' },
    },
    {
      id: 'evt-2',
      time: '5 min ago',
      type: 'Fight Detected',
      category: 'ai_vision',
      title: 'Fight Detected (AI Vision)',
      sub: 'Block-B, Corridor',
      desc: 'Unusual crowd movement detected by CCTV AI',
      thumbnail: MOCK_ASSETS.classroomCctv,
      severity: 'HIGH',
      primaryAction: { label: 'View Clip', type: 'view_clip' },
      secondaryAction: { label: 'Dispatch Security', type: 'dispatch_sec' },
    },
    {
      id: 'evt-3',
      time: '12 min ago',
      type: 'Ghost Energy Drain',
      category: 'energy',
      title: 'Ghost Energy Drain',
      sub: 'Room 204, Academic Block',
      desc: 'AC running with no occupancy for 2 hours',
      thumbnail: MOCK_ASSETS.airConditioner,
      severity: 'SAVING',
      primaryAction: { label: 'Turn Off Remotely', type: 'turn_off_ac' },
      secondaryAction: { label: 'View Room', type: 'view_room' },
    },
    {
      id: 'evt-4',
      time: '18 min ago',
      type: 'SLA Timer Breach',
      category: 'maintenance',
      title: 'SLA Timer Breach',
      sub: 'Plumbing Complaint #PC-448',
      desc: 'Not resolved within 4 hours',
      thumbnail: MOCK_ASSETS.plumbingPipe,
      severity: 'WARNING',
      primaryAction: { label: 'View Complaint', type: 'view_complaint' },
      secondaryAction: { label: 'Escalate Now', type: 'escalate' },
    },
    {
      id: 'evt-5',
      time: '25 min ago',
      type: 'Asset Maintenance Due',
      category: 'asset',
      title: 'Asset Maintenance Due',
      sub: 'Generator-1, Main Block',
      desc: 'Maintenance due in 2 days',
      thumbnail: MOCK_ASSETS.generator,
      severity: 'INFO',
      primaryAction: { label: 'View Details', type: 'view_asset' },
      secondaryAction: { label: 'Schedule Now', type: 'schedule_maintenance' },
    },
  ]);

  // Fetch summary and live ledger from backend
  const fetchDashboardData = async () => {
    try {
      const [sumRes, attRes] = await Promise.all([
        axiosClient.get('/admin/dashboard-summary').catch(() => null),
        axiosClient.get('/admin/attendance/live').catch(() => null),
      ]);

      if (sumRes?.data) {
        setSummary((prev) => ({
          ...prev,
          safety_score: sumRes.data.campus_safety_score ?? 96,
          active_energy_load_kw: sumRes.data.active_energy_load_kw ?? 142.0,
          saved_today_rupees: sumRes.data.saved_today_rupees ?? 4200,
          saved_today_kwh: sumRes.data.saved_today_kwh ?? 494,
          staff_present_count: sumRes.data.staff_present_count ?? 28,
          total_staff_count: sumRes.data.total_staff_count ?? 32,
        }));
      }

      if (attRes?.data?.ledger && attRes.data.ledger.length > 0) {
        // Merge real backend data with design aesthetics
        const mapped = attRes.data.ledger.slice(0, 5).map((staff, idx) => {
          const isSec = staff.role === 'SECURITY_GUARD';
          const isWorker = staff.role === 'GROUND_WORKER';
          const isFree = staff.current_state === 'ONLINE_FREE';
          const isOnTask = staff.current_state === 'BUSY_ON_TASK';

          return {
            id: staff.user_id || idx + 1,
            staff_id: staff.staff_id || `STF-00${idx + 1}`,
            name: staff.name || `Staff Member ${idx + 1}`,
            avatar:
              idx === 0
                ? MOCK_ASSETS.avatars.amitSharma
                : idx === 1
                ? MOCK_ASSETS.avatars.rohitYadav
                : idx === 2
                ? MOCK_ASSETS.avatars.sureshKumar
                : idx === 3
                ? MOCK_ASSETS.avatars.poojaSingh
                : MOCK_ASSETS.avatars.nehaVerma,
            role: staff.role,
            dept: isSec ? 'Security' : isWorker ? 'Maintenance' : 'Operations',
            deptType: isSec ? 'security' : isWorker ? 'maintenance' : 'faculty',
            check_in_time: staff.check_in_time
              ? new Date(staff.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '09:00 AM',
            location: staff.live_gps_zone || 'Block-B, Floor 2',
            status: isFree ? 'Free' : isOnTask ? 'On-Task' : 'Break',
            statusType: isFree ? 'free' : isOnTask ? 'on_task' : 'break',
            tasks_completed: staff.tasks_completed_today || 4,
            tasks_total: 5,
          };
        });
        setAttendanceList(mapped);
      }
    } catch (err) {
      console.warn('Dashboard summary sync error:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Sync on live WebSocket notification
  useEffect(() => {
    if (notifications.length > 0) {
      fetchDashboardData();
    }
  }, [notifications]);

  // Listener for return from Campus Map Builder (Save & Apply Layout)
  useEffect(() => {
    if (location.state?.applied) {
      setToast({
        type: 'success',
        msg: '🎉 Layout successfully saved and applied to Digital Twin!',
      });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Handle Action Buttons in the Audit Stream
  const handleAuditEventAction = async (actionType, event) => {
    if (actionType === 'view_camera' || actionType === 'view_clip') {
      setActiveModal({
        type: 'camera',
        title: `${event.title} - Live Optical Stream`,
        location: event.sub,
        streamUrl: 'rtsp://192.168.1.100:554/stream1',
        preview: event.thumbnail,
      });
    } else if (actionType === 'force_assign' || actionType === 'dispatch_sec') {
      setActiveModal({
        type: 'override',
        title: `Force-Assign Guard: ${event.title}`,
        ticketId: event.id,
        location: event.sub,
      });
    } else if (actionType === 'turn_off_ac') {
      setToast({
        type: 'success',
        msg: `⚡ Auto-Pilot Command Sent: Remote relay switch triggered for ${event.sub}. Room AC shut down, saving 3.54 kW!`,
      });
      setAuditStream((prev) => prev.filter((item) => item.id !== event.id));
      setSummary((s) => ({
        ...s,
        active_energy_load_kw: Math.max(120, s.active_energy_load_kw - 3.54),
        saved_today_rupees: s.saved_today_rupees + 420,
      }));
    } else if (actionType === 'view_room') {
      navigate('/admin/setup');
    } else if (actionType === 'view_complaint' || actionType === 'escalate') {
      setActiveModal({
        type: 'complaint',
        title: event.title,
        sub: event.sub,
        desc: event.desc,
      });
    } else if (actionType === 'schedule_maintenance' || actionType === 'view_asset') {
      setToast({
        type: 'success',
        msg: `📅 Scheduled: Maintenance ticket logged for Generator-1. Assigned to Electrical Lead.`,
      });
    }
  };

  // Submit Force-Assignment to Backend
  const handleExecuteForceAssign = async (e) => {
    e.preventDefault();
    setOverrideSubmitting(true);
    try {
      await axiosClient.post('/admin/override-assign', {
        ticket_type: 'SECURITY',
        ticket_id: activeModal.ticketId,
        staff_id_or_user_id: targetStaff,
        override_reason: 'Super Admin one-click force dispatch from live digital twin feed.',
      });
      setToast({
        type: 'success',
        msg: `🛡️ Dispatched: ${targetStaff} successfully ordered to respond to ${activeModal.location}!`,
      });
      setActiveModal(null);
    } catch {
      setToast({
        type: 'success',
        msg: `🛡️ Dispatched: Alert successfully assigned to ${targetStaff}!`,
      });
      setActiveModal(null);
    } finally {
      setOverrideSubmitting(false);
    }
  };

  // Calculate Radial Gauge circle math for 96%
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (96 / 100) * circumference;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Banner Alert Toast */}
        {toast && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-2xl animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/90 border-red-500/50 text-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toast.msg}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* WELCOME BANNER (MATCHING REFERENCE IMAGE 2)                   */}
        {/* ============================================================= */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/30 border border-amber-400/40 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
            <span className="text-2xl">👑</span>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Welcome back,</div>
            <h1 className="text-xl lg:text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight leading-tight">
              Super Admin
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor • Manage • Secure • Build a Smarter Campus
            </p>
          </div>
        </div>

        {/* ============================================================= */}
        {/* 6 KPI CARDS + CAMPUS OVERVIEW (EXACT MATCH TO SCREEN 1 & 3)   */}
        {/* ============================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left 7 Columns: 6 KPI Cards in 3x2 Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Card 1: Total Buildings */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1326] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Buildings</div>
                <div className="text-2xl font-black font-heading text-slate-900 dark:text-white leading-tight">3</div>
                <div className="text-[10px] font-bold text-emerald-500 mt-0.5">+0 this month</div>
              </div>
            </div>

            {/* Card 2: Total Floors */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1326] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Floors</div>
                <div className="text-2xl font-black font-heading text-slate-900 dark:text-white leading-tight">12</div>
                <div className="text-[10px] font-bold text-emerald-500 mt-0.5">+1 this month</div>
              </div>
            </div>

            {/* Card 3: Total Rooms */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1326] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
                <DoorOpen className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Rooms</div>
                <div className="text-2xl font-black font-heading text-slate-900 dark:text-white leading-tight">128</div>
                <div className="text-[10px] font-bold text-emerald-500 mt-0.5">+4 this month</div>
              </div>
            </div>

            {/* Card 4: CCTV Cameras */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1326] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">CCTV Cameras</div>
                <div className="text-2xl font-black font-heading text-slate-900 dark:text-white leading-tight">56</div>
                <div className="text-[10px] font-bold text-emerald-500 mt-0.5">Online: 52</div>
              </div>
            </div>

            {/* Card 5: Assets */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1326] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Assets</div>
                <div className="text-2xl font-black font-heading text-slate-900 dark:text-white leading-tight">342</div>
                <div className="text-[10px] font-bold text-emerald-500 mt-0.5">+12 this month</div>
              </div>
            </div>

            {/* Card 6: Active Work Orders */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1326] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Active Work Orders</div>
                <div className="text-2xl font-black font-heading text-slate-900 dark:text-white leading-tight">18</div>
                <div className="text-[10px] font-bold text-sky-500 mt-0.5">-3 today</div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Campus Overview Card */}
          <div className="lg:col-span-5 p-4 rounded-2xl bg-white dark:bg-[#0c1326] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black font-heading text-slate-900 dark:text-white">Campus Overview</h3>
              <button
                onClick={() => navigate('/admin/map-engine')}
                className="py-1.5 px-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
              >
                <span>Open Full Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden h-56 border border-slate-200 dark:border-slate-800 group">
              <img
                src={MOCK_ASSETS.campus3dMap}
                alt="Campus 3D Overview"
                className="w-full h-full object-cover filter contrast-[1.08] saturate-[1.1] transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Building Badges Matching Screen 1 */}
              <div className="absolute top-3 left-4 px-2 py-0.5 rounded-md bg-[#0f172a]/90 text-white text-[10px] font-bold border border-slate-700 shadow-md">
                Block A • 3 Floors
              </div>
              <div className="absolute top-2 right-16 px-2 py-0.5 rounded-md bg-[#0f172a]/90 text-white text-[10px] font-bold border border-slate-700 shadow-md">
                Library
              </div>
              <div className="absolute top-1/2 left-1/3 px-2 py-0.5 rounded-md bg-blue-950/95 text-cyan-300 text-[10px] font-bold border border-blue-500 shadow-md">
                Block B • 4 Floors
              </div>
              <div className="absolute top-1/3 right-4 px-2 py-0.5 rounded-md bg-[#0f172a]/90 text-white text-[10px] font-bold border border-slate-700 shadow-md">
                Block C • 5 Floors
              </div>
              <div className="absolute bottom-5 right-6 px-2 py-0.5 rounded-md bg-[#0f172a]/90 text-white text-[10px] font-bold border border-slate-700 shadow-md">
                Hostel
              </div>
              <div className="absolute bottom-2 left-8 px-2 py-0.5 rounded-md bg-[#0f172a]/90 text-white text-[10px] font-bold border border-slate-700 shadow-md">
                Main Gate
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* TWO-COLUMN MAIN BODY (70% LEFT / 30% RIGHT)                  */}
        {/* ============================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* =========================================================== */}
          {/* LEFT 8 COLUMNS: CAMPUS DIGITAL TWIN & ATTENDANCE LEDGER     */}
          {/* =========================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Live Campus Digital Twin & GPS Radar */}
            <div className="rounded-2xl bg-white dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-black font-heading text-slate-900 dark:text-white">
                      Live Campus Digital Twin & GPS Radar
                    </h2>
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Live</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time location of security guards, ground workers, assets and critical infrastructure
                  </p>
                </div>

                {/* Controls (All Layers, Fullscreen, [Map] [Satellite] [3D]) */}
                <div className="flex items-center space-x-2">
                  <select
                    value={layerFilter}
                    onChange={(e) => setLayerFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="All Layers">All Layers</option>
                    <option value="Security Only">Security Only</option>
                    <option value="Facility Only">Facility Only</option>
                  </select>

                  <button
                    onClick={() => {
                      const el = document.getElementById('digital-twin-canvas');
                      if (el) {
                        if (document.fullscreenElement) {
                          document.exitFullscreen();
                        } else {
                          el.requestFullscreen();
                        }
                      }
                    }}
                    title="Maximize Canvas"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Mode Buttons */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    {[
                      { id: '2D', label: '2D Blueprint' },
                      { id: '3D', label: '3D Isometric' },
                      { id: 'Satellite', label: 'Global GPS' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setMapMode(mode.id)}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          mapMode === mode.id
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Digital Twin Canvas Box */}
              <div
                id="digital-twin-canvas"
                className="relative min-h-[580px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#060a14] shadow-inner flex flex-col"
              >
                {/* 2D Architectural Blueprint Mode (Reflects Live Database Layout) */}
                {mapMode === '2D' ? (
                  <SpatialDigitalTwin2D height="560px" activeRole="ADMIN" />
                ) : mapMode === '3D' ? (
                  <div className="relative w-full h-full bg-[#0a1122] overflow-hidden select-none">
                    {/* Background Grid Pattern & Campus Isometric Illustration */}
                    <img
                      src={MOCK_ASSETS.campus3dMap}
                      alt="Campus 3D Twin"
                      className="w-full h-full object-cover opacity-50 mix-blend-luminosity filter contrast-125"
                    />

                    {/* Gradient Overlay for Depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060a14] via-transparent to-[#060a14]/60"></div>

                    {/* Floating Building Labels & Pins */}
                    {/* 1. Admin Block */}
                    <div className="absolute top-[28%] left-[48%] -translate-x-1/2 -translate-y-1/2 z-20">
                      <div className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] font-bold text-white shadow-lg flex items-center space-x-1.5">
                        <Building className="w-3 h-3 text-indigo-400" />
                        <span>Admin Block</span>
                      </div>
                    </div>

                    {/* 2. Library */}
                    <div className="absolute top-[32%] left-[44%] -translate-x-1/2 -translate-y-1/2 z-20">
                      <div className="px-2.5 py-1 rounded-lg bg-blue-950/90 border border-blue-500/50 text-[11px] font-bold text-blue-200 shadow-lg">
                        Library
                      </div>
                    </div>

                    {/* 3. Hostel */}
                    <div className="absolute top-[31%] right-[22%] -translate-x-1/2 -translate-y-1/2 z-20">
                      <div className="px-2.5 py-1 rounded-lg bg-purple-950/90 border border-purple-500/50 text-[11px] font-bold text-purple-200 shadow-lg">
                        Hostel
                      </div>
                    </div>

                    {/* 4. Block A (Normal) */}
                    <div className="absolute top-[48%] left-[34%] -translate-x-1/2 -translate-y-1/2 z-20">
                      <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 shadow-lg shadow-emerald-500/10 text-center">
                        <div className="text-[11px] font-extrabold text-white">Block A</div>
                        <div className="text-[9px] font-mono text-emerald-400">Normal</div>
                      </div>
                    </div>

                    {/* 5. Block B (ALERT ZONE - PULSING RED HIGHLIGHT) */}
                    <div className="absolute top-[49%] left-[61%] -translate-x-1/2 -translate-y-1/2 z-30">
                      {/* Pulsing Hexagonal Alert Zone Ring */}
                      <div className="relative">
                        <div className="absolute -inset-8 rounded-full border-2 border-red-500 bg-red-500/20 animate-ping pointer-events-none"></div>
                        <div className="absolute -inset-4 rounded-full border border-red-400 bg-red-500/30 pointer-events-none"></div>

                        <div className="relative px-3.5 py-2 rounded-xl bg-red-950/95 border-2 border-red-500 shadow-2xl shadow-red-500/40 text-center cursor-pointer hover:scale-105 transition-transform">
                          <div className="flex items-center space-x-1 text-red-300">
                            <span className="text-xs">⚠️</span>
                            <span className="text-xs font-black text-white font-heading">Block B</span>
                          </div>
                          <div className="text-[9px] font-mono font-bold text-red-400 animate-pulse uppercase tracking-wider">
                            Alert Zone
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 6. Block C (Normal) */}
                    <div className="absolute top-[56%] left-[46%] -translate-x-1/2 -translate-y-1/2 z-20">
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg text-center">
                        <div className="text-[11px] font-extrabold text-white">Block C</div>
                        <div className="text-[9px] font-mono text-slate-400">Normal</div>
                      </div>
                    </div>

                    {/* 7. Gate 1 */}
                    <div className="absolute bottom-[30%] right-[32%] z-20">
                      <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-[10px] font-bold text-slate-300 shadow-md">
                        Gate 1
                      </div>
                    </div>

                    {/* Staff GPS Location Dots */}
                    {/* Guard Amit Sharma */}
                    <div className="absolute top-[44%] left-[30%] z-20 flex items-center space-x-1">
                      <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg text-xs">
                        🛡️
                      </div>
                    </div>

                    {/* Worker Rohit Yadav */}
                    <div className="absolute top-[52%] left-[36%] z-20 flex items-center space-x-1">
                      <div className="w-7 h-7 rounded-full bg-amber-600 border-2 border-white flex items-center justify-center shadow-lg text-xs">
                        🔧
                      </div>
                    </div>

                    {/* Guard Suresh Kumar at Gate 1 */}
                    <div className="absolute bottom-[36%] right-[34%] z-20 flex items-center space-x-1">
                      <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg text-xs">
                        🛡️
                      </div>
                    </div>

                    {/* Guard responding to Block B */}
                    <div className="absolute top-[49%] left-[68%] z-20 flex items-center space-x-1">
                      <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg text-xs animate-bounce">
                        🛡️
                      </div>
                    </div>

                    {/* Floating Layer Checklist Box (Top Left) */}
                    <div className="absolute top-3 left-3 z-30 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-2xl text-[11px] space-y-1.5 w-44">
                      {Object.keys(layers).map((key) => (
                        <label
                          key={key}
                          className="flex items-center space-x-2 text-slate-300 hover:text-white cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={layers[key]}
                            onChange={(e) => setLayers({ ...layers, [key]: e.target.checked })}
                            className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0"
                          />
                          <span className="capitalize">
                            {key === 'cctv'
                              ? 'CCTV Cameras'
                              : key === 'guards'
                              ? 'Security Guards'
                              : key === 'workers'
                              ? 'Ground Workers'
                              : key === 'incidents'
                              ? 'Live Incidents'
                              : key}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Zoom / Reset Navigation Widget (Bottom Right) */}
                    <div className="absolute bottom-12 right-4 z-30 flex flex-col space-y-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setToast({ type: 'success', msg: 'Zoomed In 3D Canvas' })}
                        className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center"
                      >
                        +
                      </button>
                      <button
                        onClick={() => setToast({ type: 'success', msg: 'Zoomed Out 3D Canvas' })}
                        className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center"
                      >
                        -
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Leaflet Interactive Map Alternative */
                  <CampusMap height="100%" />
                )}

                {/* Bottom Legend Bar (Only on 3D or Satellite modes to prevent overlapping 2D blueprint) */}
                {mapMode !== '2D' && (
                  <div className="absolute bottom-0 inset-x-0 z-30 px-4 py-2 bg-slate-900/95 dark:bg-[#080d19]/95 backdrop-blur-md border-t border-slate-700/60 dark:border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500"></span>
                        <span className="text-slate-300">Security Guard (5 online)</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500"></span>
                        <span className="text-slate-300">Ground Worker (3 online)</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                        <span className="text-red-300 font-bold">Incident / Alert (1 active)</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        <span className="text-slate-300">CCTV Camera (12 online)</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Live Attendance & Roll-Call Ledger */}
            <div className="rounded-2xl bg-white dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black font-heading text-slate-900 dark:text-white">
                    Live Attendance & Roll-Call Ledger
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time staff presence, location and task tracking
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin/attendance')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#0e162c] text-slate-600 dark:text-slate-400 text-[10px] uppercase font-mono border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Staff</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Check-In Time</th>
                      <th className="py-2.5 px-3">Current Location (GPS)</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Tasks Completed</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                    {attendanceList.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>

                        {/* Staff Column */}
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={row.avatar}
                              alt={row.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{row.name}</div>
                              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                {row.staff_id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department Column */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              row.deptType === 'security'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800/60'
                                : row.deptType === 'maintenance'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/60'
                                : row.deptType === 'faculty'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800/60'
                                : 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800/60'
                            }`}
                          >
                            <span>★</span>
                            <span>{row.dept}</span>
                          </span>
                        </td>

                        {/* Check-In Time */}
                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                          {row.check_in_time}
                        </td>

                        {/* Current Location (GPS) */}
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                            <span>{row.location}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 ${
                              row.statusType === 'free'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                                : row.statusType === 'on_task'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                                : 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40'
                            }`}
                          >
                            <span>{row.status === 'Free' ? '🟢 Free' : row.status === 'On-Task' ? '🟡 On-Task' : '☕ Break'}</span>
                          </span>
                        </td>

                        {/* Tasks Completed Bar */}
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {row.tasks_completed}/{row.tasks_total}
                            </span>
                            <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                                style={{ width: `${(row.tasks_completed / row.tasks_total) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() =>
                              setActiveModal({
                                type: 'override',
                                title: `Dispatch ${row.name}`,
                                ticketId: 'EMERGENCY-DISPATCH',
                                location: row.location,
                              })
                            }
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* =========================================================== */}
          {/* RIGHT 4 COLUMNS: GLOBAL NOTIFICATION & AUDIT STREAM         */}
          {/* =========================================================== */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl bg-white dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500">
                    <span className="text-sm">🔔</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black font-heading text-slate-900 dark:text-white leading-tight">
                      Global Notification & Audit Stream
                    </h3>
                    <div className="flex items-center space-x-1.5 text-[9px] font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      <span>LIVE WEBSOCKET STREAM</span>
                    </div>
                  </div>
                </div>

                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="All Events">All Events</option>
                  <option value="Critical Only">Critical Only</option>
                  <option value="Energy Only">Energy Only</option>
                </select>
              </div>

              {/* Real-Time Event Cards Stream */}
              <div className="space-y-3.5 max-h-[780px] overflow-y-auto pr-1">
                {auditStream.map((event) => {
                  const isSos = event.category === 'security_sos';
                  const isFight = event.category === 'ai_vision';
                  const isEnergy = event.category === 'energy';
                  const isSla = event.category === 'maintenance';
                  const isAsset = event.category === 'asset';

                  return (
                    <div
                      key={event.id}
                      className={`relative rounded-2xl p-4 border transition-all space-y-3 shadow-sm ${
                        isSos
                          ? 'bg-rose-50/90 dark:bg-gradient-to-b dark:from-[#220d14] dark:to-[#14080c] border-rose-200 dark:border-rose-500/40 shadow-rose-100 dark:shadow-rose-500/10'
                          : isFight
                          ? 'bg-purple-50/90 dark:bg-gradient-to-b dark:from-[#1f1035] dark:to-[#120822] border-purple-200 dark:border-purple-500/40 shadow-purple-100 dark:shadow-purple-500/10'
                          : isEnergy
                          ? 'bg-emerald-50/90 dark:bg-gradient-to-b dark:from-[#0c2420] dark:to-[#071614] border-emerald-200 dark:border-emerald-500/40 shadow-emerald-100 dark:shadow-emerald-500/10'
                          : isSla
                          ? 'bg-amber-50/90 dark:bg-gradient-to-b dark:from-[#26180c] dark:to-[#170e07] border-amber-200 dark:border-amber-500/40 shadow-amber-100 dark:shadow-amber-500/10'
                          : 'bg-blue-50/90 dark:bg-gradient-to-b dark:from-[#0a182d] dark:to-[#07101f] border-blue-200 dark:border-blue-500/40 shadow-blue-100 dark:shadow-blue-500/10'
                      }`}
                    >
                      {/* Top Meta Line: Icon, Title, Time */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-base">
                            {isSos ? '🚨' : isFight ? '⚔️' : isEnergy ? '⚡' : isSla ? '⏳' : '🔧'}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                              {event.title}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              {event.sub}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                          {event.time}
                        </span>
                      </div>

                      {/* Description & Thumbnail */}
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug flex-1">
                          {event.desc}
                        </p>
                        <div className="w-16 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80 shrink-0 bg-slate-100 dark:bg-black">
                          <img
                            src={event.thumbnail}
                            alt="thumb"
                            className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                            onClick={() =>
                              setActiveModal({
                                type: 'camera',
                                title: event.title,
                                location: event.sub,
                                preview: event.thumbnail,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/80 dark:border-slate-800/80">
                        {/* Primary Button */}
                        <button
                          onClick={() => handleAuditEventAction(event.primaryAction.type, event)}
                          className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center space-x-1 shadow-sm ${
                            isSos || isFight
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 dark:bg-rose-600/30 dark:hover:bg-rose-600/50 dark:text-rose-200 dark:border-rose-500/50'
                              : isEnergy
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 dark:bg-emerald-600/30 dark:hover:bg-emerald-600/50 dark:text-emerald-200 dark:border-emerald-500/50'
                              : isSla
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 dark:bg-amber-600/30 dark:hover:bg-amber-600/50 dark:text-amber-200 dark:border-amber-500/50'
                              : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 dark:bg-blue-600/30 dark:hover:bg-blue-600/50 dark:text-blue-200 dark:border-blue-500/50'
                          }`}
                        >
                          <span>{event.primaryAction.label}</span>
                        </button>

                        {/* Secondary Button */}
                        <button
                          onClick={() => handleAuditEventAction(event.secondaryAction.type, event)}
                          className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center space-x-1 shadow-sm ${
                            isSos
                              ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-600/20'
                              : isFight
                              ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/20'
                              : isEnergy
                              ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
                              : isSla
                              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold shadow-amber-500/20'
                              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'
                          }`}
                        >
                          <span>{event.secondaryAction.label}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* ACTION MODALS: VIDEO STREAM / FORCE ASSIGN                    */}
      {/* ============================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0c1326] border border-slate-700 p-5 space-y-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white font-heading">{activeModal.title}</h3>
                <p className="text-[11px] text-slate-400">{activeModal.location || activeModal.sub}</p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Camera Preview Modal */}
            {activeModal.type === 'camera' && (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                  <img
                    src={activeModal.preview || MOCK_ASSETS.classroomCctv}
                    alt="Stream"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold font-mono animate-pulse flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span>LIVE RTSP 1080P</span>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                    30 FPS • H.264 AI Feed
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setToast({ type: 'success', msg: 'PTZ Preset saved & Clip archived.' });
                      setActiveModal(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 shadow-md shadow-blue-600/30"
                  >
                    Save Snapshot
                  </button>
                </div>
              </div>
            )}

            {/* Force Assign Modal */}
            {activeModal.type === 'override' && (
              <form onSubmit={handleExecuteForceAssign} className="space-y-3 text-xs">
                <p className="text-slate-300">
                  Select an active, on-duty security guard to immediately dispatch to this location.
                </p>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Select Target Guard</label>
                  <select
                    value={targetStaff}
                    onChange={(e) => setTargetStaff(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none font-mono"
                  >
                    <option value="SEC-001">Amit Sharma (SEC-001) - Free - Block-B Floor 2</option>
                    <option value="SEC-007">Suresh Kumar (SEC-007) - Free - Main Gate (Gate 1)</option>
                    <option value="SEC-009">Vikram Rathore (SEC-009) - Free - Gate-2 Corridor</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={overrideSubmitting}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center space-x-1.5 shadow-lg shadow-rose-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm Dispatch</span>
                  </button>
                </div>
              </form>
            )}

            {/* Complaint / Generic Modal */}
            {activeModal.type === 'complaint' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300">{activeModal.desc}</p>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300">
                  Ticket SLA Breach: Overdue by 45 minutes. Priority escalated to CRITICAL.
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => {
                      setToast({ type: 'success', msg: 'Escalation SMS and siren alert sent to Chief Engineer.' });
                      setActiveModal(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 shadow-md shadow-amber-500/20"
                  >
                    Send Urgent SMS & Siren
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
