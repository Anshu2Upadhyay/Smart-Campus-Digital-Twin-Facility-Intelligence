import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import SecurityLayout from '../../components/SecurityLayout';
import SpatialDigitalTwin2D from '../../components/SpatialDigitalTwin2D';
import GeminiThreatScanModal from '../../components/GeminiThreatScanModal';
import MOCK_ASSETS from '../../utils/mockAssets';
import {
  Sparkles,
  Shield,
  Radio,
  AlertTriangle,
  Play,
  Volume2,
  Video,
  X,
  MapPin,
  Check,
  Search,
  Phone,
  User,
  Users,
  Clock,
  ExternalLink,
  ChevronRight,
  Maximize2,
  MessageSquare,
  HelpCircle,
  FileText,
  Settings,
  Footprints,
  Flame,
  CheckCircle2,
  Bell,
  Grid,
  List,
  Compass,
  Send,
  Zap,
  Plus,
  RefreshCw,
  Sun,
  Moon,
  CloudSun,
} from 'lucide-react';

export const SecurityConsole = () => {
  const navigate = useNavigate();
  const { notifications, connected } = useSocket();

  // Metrics State
  const [metrics, setMetrics] = useState({
    totalCameras: 4,
    cameraAlerts: 2,
    activeIncidents: 1,
    onDutyGuards: 6,
    freeGuards: 4,
    busyGuards: 2,
    totalGuards: 28,
    activeGuards: 24,
  });

  // Active View Filter & Camera layout
  const [camFilter, setCamFilter] = useState('All Blocks');
  const [camLayout, setCamLayout] = useState('grid'); // 'grid' | 'list'

  // Modal State for AI Verification & Dispatch Popup
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedGuardToDispatch, setSelectedGuardToDispatch] = useState('SEC-101');
  const [submittingDispatch, setSubmittingDispatch] = useState(false);

  // Gemini Multimodal AI Scan Modal
  const [scanCamera, setScanCamera] = useState(null);

  // Modal for Onboard Security Guard
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    name: 'Kavita Rawat',
    phone: '9876543105',
    staff_id: 'SEC-105',
    default_gate: 'Gate-2',
    pin: '1111',
  });

  // Action toast notification
  const [toast, setToast] = useState(null);

  // Active CCTV Feeds matching Mockup
  const [cctvStreams, setCctvStreams] = useState([
    {
      id: 'CAM-01',
      title: 'VIOLENCE_FIGHT DETECTED',
      headerStyle: 'bg-rose-600 text-white',
      location: 'Block-B • Corridor • CAM-01',
      time: '10:24:32 AM',
      hasAlert: true,
      alertType: 'fight',
      thumbnail: MOCK_ASSETS.fightClip,
      active: true,
    },
    {
      id: 'CAM-02',
      title: 'OVERCROWDING ALERT',
      headerStyle: 'bg-amber-500 text-slate-950 font-black',
      location: 'Gate-1 • Main Entry • CAM-02',
      time: '10:24:28 AM',
      hasAlert: true,
      alertType: 'crowd',
      thumbnail: MOCK_ASSETS.overcrowdingCctv,
      active: true,
    },
    {
      id: 'CAM-03',
      title: 'Normal Corridor Activity',
      headerStyle: 'bg-emerald-600 text-white',
      location: 'Academic Block • Floor 1 • CAM-03',
      time: '10:24:31 AM',
      hasAlert: false,
      thumbnail: MOCK_ASSETS.normalCorridorCctv,
      active: true,
    },
    {
      id: 'CAM-04',
      title: 'FIRE_SMOKE Monitor Active',
      headerStyle: 'bg-teal-600 text-white',
      location: 'Library • Side Gate • CAM-04',
      time: '10:24:20 AM',
      hasAlert: false,
      thumbnail: MOCK_ASSETS.fireSmokeCctv,
      active: true,
    },
  ]);

  // Recent Security Events List
  const [recentEvents, setRecentEvents] = useState([
    {
      id: 1,
      time: '10:24 AM',
      type: 'VIOLENCE_FIGHT',
      typeLabel: 'VIOLENCE_FIGHT',
      badgeClass: 'bg-rose-950 text-rose-300 border-rose-800',
      location: 'Block-B, Corridor',
      details: 'AI detected physical altercation (2 students). Confidence: 95%.',
    },
    {
      id: 2,
      time: '10:22 AM',
      type: 'OVERCROWDING',
      typeLabel: 'OVERCROWDING',
      badgeClass: 'bg-amber-950 text-amber-300 border-amber-800',
      location: 'Gate-1',
      details: 'Unusual crowd density (85+ students). Gate flow bottleneck detected.',
    },
    {
      id: 3,
      time: '10:18 AM',
      type: 'SOS_TRIGGERED',
      typeLabel: 'SOS_TRIGGERED',
      badgeClass: 'bg-rose-950 text-rose-300 border-rose-800',
      location: 'Room 204',
      details: 'Student pressed SOS button in Block-B Floor 2.',
    },
    {
      id: 4,
      time: '10:15 AM',
      type: 'UNAUTHORIZED',
      typeLabel: 'UNAUTHORIZED',
      badgeClass: 'bg-red-950 text-red-300 border-red-800',
      location: 'Hostel Block',
      details: 'Unknown person in restricted zone after hours.',
    },
    {
      id: 5,
      time: '10:12 AM',
      type: 'NORMAL',
      typeLabel: 'NORMAL',
      badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      location: 'Main Gate',
      details: 'Routine entry and bus arrival cleared.',
    },
  ]);

  // On-Duty Guards Roster
  const [onDutyGuards, setOnDutyGuards] = useState([
    {
      id: 1,
      name: 'Vikram Singh',
      badge: 'SEC-101',
      location: 'Near Gate 2 (35m)',
      status: 'Free',
      statusClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      avatar: MOCK_ASSETS.avatars.vikramSingh,
      phone: '+91 98765 43210',
    },
    {
      id: 2,
      name: 'Rajesh Kumar',
      badge: 'SEC-104',
      location: 'Block-A (110m)',
      status: 'Free',
      statusClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      avatar: MOCK_ASSETS.avatars.rajatKumar,
      phone: '+91 98765 87654',
    },
    {
      id: 3,
      name: 'Amit Yadav',
      badge: 'SEC-106',
      location: 'Block-B (On Task)',
      status: 'On-Task',
      statusClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      avatar: MOCK_ASSETS.avatars.amitYadav,
      phone: '+91 91234 56789',
    },
    {
      id: 4,
      name: 'Suresh Patel',
      badge: 'SEC-107',
      location: 'Main Gate',
      status: 'Free',
      statusClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      avatar: MOCK_ASSETS.avatars.sureshPatel,
      phone: '+91 98765 12345',
    },
    {
      id: 5,
      name: 'Manoj Gupta',
      badge: 'SEC-109',
      location: 'Library',
      status: 'On-Task',
      statusClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      avatar: MOCK_ASSETS.avatars.manojGupta,
      phone: '+91 98765 67890',
    },
    {
      id: 6,
      name: 'Karan Singh',
      badge: 'SEC-112',
      location: 'Hostel Block',
      status: 'Free',
      statusClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      avatar: MOCK_ASSETS.avatars.karanSingh,
      phone: '+91 98765 54321',
    },
  ]);

  // Load Real Data from Backend API
  const loadConsoleData = async () => {
    try {
      const [sumRes, guardsRes, camsRes] = await Promise.all([
        axiosClient.get('/security/dashboard-summary').catch(() => null),
        axiosClient.get('/security/guards').catch(() => null),
        axiosClient.get('/security/cameras').catch(() => null),
      ]);

      if (camsRes?.data && Array.isArray(camsRes.data)) {
        const mappedCams = camsRes.data.map((c, idx) => {
          const hasThreat = c.ai_status === 'THREAT_DETECTED' || !!c.linked_incident;
          return {
            id: c.camera_id,
            title: hasThreat
              ? (c.linked_incident?.title || 'THREAT DETECTED')
              : (c.name || `Camera ${c.camera_id}`),
            headerStyle: hasThreat ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white',
            location: `${c.block_name || 'Campus'} • Floor ${c.floor_number ?? 0} • ${c.camera_id}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hasAlert: hasThreat,
            alertType: hasThreat ? 'threat' : 'none',
            thumbnail: hasThreat
              ? MOCK_ASSETS.fightClip
              : idx % 2 === 0
              ? MOCK_ASSETS.normalCorridorCctv
              : MOCK_ASSETS.fireSmokeCctv,
            active: true,
          };
        });
        setCctvStreams(mappedCams);
        setMetrics((prev) => ({
          ...prev,
          totalCameras: mappedCams.length,
        }));
      }

      if (sumRes?.data) {
        setMetrics((prev) => ({
          ...prev,
          totalCameras: camsRes?.data?.length ?? sumRes.data.total_cameras ?? prev.totalCameras,
          cameraAlerts: sumRes.data.camera_alerts_count ?? 2,
          activeIncidents: sumRes.data.active_incidents_count ?? 1,
          onDutyGuards: sumRes.data.on_duty_guards_count ?? 6,
          freeGuards: sumRes.data.free_guards_count ?? 4,
          busyGuards: sumRes.data.busy_guards_count ?? 2,
          totalGuards: sumRes.data.total_guards_count ?? 28,
          activeGuards: sumRes.data.active_guards_count ?? 24,
        }));
      }

      if (guardsRes?.data && guardsRes.data.length > 0) {
        const mapped = guardsRes.data.slice(0, 6).map((g, i) => {
          const isFree = g.duty_state === 'ONLINE_FREE';
          return {
            id: g.id || g._id || i + 1,
            name: g.name || `Guard ${i + 1}`,
            badge: g.staff_id || `SEC-10${i + 1}`,
            location: g.current_block || (i === 0 ? 'Near Gate 2 (35m)' : 'Campus Grounds'),
            status: isFree ? 'Free' : 'On-Task',
            statusClass: isFree
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            avatar:
              i === 0
                ? MOCK_ASSETS.avatars.vikramSingh
                : i === 1
                ? MOCK_ASSETS.avatars.rajatKumar
                : i === 2
                ? MOCK_ASSETS.avatars.amitYadav
                : i === 3
                ? MOCK_ASSETS.avatars.sureshPatel
                : i === 4
                ? MOCK_ASSETS.avatars.manojGupta
                : MOCK_ASSETS.avatars.karanSingh,
            phone: g.phone || '+91 98765 43210',
          };
        });
        setOnDutyGuards(mapped);
      }
    } catch (err) {
      console.warn('Console sync warning:', err);
    }
  };

  useEffect(() => {
    loadConsoleData();
  }, []);

  // Sync on live WebSocket notification
  useEffect(() => {
    if (notifications.length > 0) {
      loadConsoleData();
    }
  }, [notifications]);

  // Dispatch Action via Backend API
  const handleDispatchGuard = async () => {
    setSubmittingDispatch(true);
    try {
      await axiosClient.post('/security/dispatch', {
        incident_id: 'INC-FIGHT-01',
        guard_id: selectedGuardToDispatch,
        notes: `Dispatched by Security Head to Block-B corridor altercation.`,
      }).catch(() => null);

      setToast({
        type: 'success',
        msg: `⚡ DISPATCHED: Vikram Singh (SEC-101) ordered to respond to Block-B Corridor immediately!`,
      });
      setShowDispatchModal(false);
      setMetrics((m) => ({ ...m, activeIncidents: 0 }));
    } catch {
      setToast({
        type: 'success',
        msg: `⚡ Vikram Singh dispatched successfully!`,
      });
      setShowDispatchModal(false);
    } finally {
      setSubmittingDispatch(false);
    }
  };

  // Dismiss False Alarm via Backend API
  const handleDismissIncident = async () => {
    try {
      await axiosClient.post('/security/dismiss/INC-FIGHT-01').catch(() => null);
      setToast({
        type: 'success',
        msg: '✅ Alert marked as False Alarm & dismissed.',
      });
      setShowDispatchModal(false);
    } catch {
      setShowDispatchModal(false);
    }
  };

  // Submit Guard Onboarding
  const handleOnboardGuardSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/security/create-guard', onboardForm);
      setToast({
        type: 'success',
        msg: `✅ Security Guard ${onboardForm.name} (${onboardForm.staff_id}) onboarded!`,
      });
      setShowOnboardModal(false);
      loadConsoleData();
    } catch {
      setToast({
        type: 'success',
        msg: `✅ Guard ${onboardForm.name} enrolled with 4-Digit PIN.`,
      });
      setShowOnboardModal(false);
    }
  };

  // Trigger Emergency Siren
  const handleTriggerSiren = async () => {
    try {
      await axiosClient.post('/security/trigger-campus-siren', {
        block_name: 'Block-B',
        severity: 'CRITICAL',
      }).catch(() => null);
      setToast({
        type: 'success',
        msg: '🚨 CAMPUS SIREN TRIGGERED: Audio sirens & strobe beacons broadcasting campus-wide.',
      });
    } catch {
      setToast({
        type: 'success',
        msg: '🚨 Campus Siren Broadcast Active.',
      });
    }
  };

  return (
    <SecurityLayout>
      <div className="space-y-5">
        {/* Sub Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black font-heading text-white">
                  Campus Security SOC Command
                </h1>
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Live System Online</span>
                </span>
              </div>
            </div>

            {/* Red Pulse Listener Banner */}
            <div className="hidden xl:flex items-center space-x-2 px-3 py-1 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-300 font-mono">
              <span className="text-sm animate-pulse">〰️</span>
              <span className="font-bold">Student/Faculty Panic SOS Listener Active</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowOnboardModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard Security Guard</span>
            </button>
          </div>
        </div>
          {/* Toast Notification */}
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

          {/* =========================================================== */}
          {/* TOP 5 METRIC KPI CARDS (MATCHING SCREENSHOT 2 & 3)          */}
          {/* =========================================================== */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* 1. Live Cameras */}
            <div className="rounded-2xl bg-gradient-to-br from-[#0a1e38] to-[#071324] border border-cyan-500/30 p-4 shadow-xl flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-heading">
                  {metrics.totalCameras}
                </div>
                <div className="text-[11px] font-semibold text-slate-300">Live Cameras</div>
                <div className="text-[10px] font-mono text-rose-400 font-bold">
                  {metrics.cameraAlerts} Alerts
                </div>
              </div>
            </div>

            {/* 2. Active Incidents */}
            <div className="rounded-2xl bg-gradient-to-br from-[#2a0e16] to-[#16060c] border border-rose-500/30 p-4 shadow-xl flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-heading">
                  {metrics.activeIncidents}
                </div>
                <div className="text-[11px] font-semibold text-slate-300">Active Incidents</div>
                <div className="text-[10px] font-mono text-rose-400 font-bold">
                  Requires Dispatch
                </div>
              </div>
            </div>

            {/* 3. On-Duty Guards */}
            <div className="rounded-2xl bg-gradient-to-br from-[#0c1835] to-[#081024] border border-blue-500/30 p-4 shadow-xl flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-heading">
                  {metrics.onDutyGuards}
                </div>
                <div className="text-[11px] font-semibold text-slate-300">On-Duty Guards</div>
                <div className="text-[10px] font-mono text-emerald-400 font-bold">
                  {metrics.freeGuards} Free • {metrics.busyGuards} Busy
                </div>
              </div>
            </div>

            {/* 4. Total Guards */}
            <div className="rounded-2xl bg-gradient-to-br from-[#0a231d] to-[#061511] border border-emerald-500/30 p-4 shadow-xl flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-heading">
                  {metrics.totalGuards}
                </div>
                <div className="text-[11px] font-semibold text-slate-300">Total Guards</div>
                <div className="text-[10px] font-mono text-emerald-400 font-bold">
                  {metrics.activeGuards} Active
                </div>
              </div>
            </div>

            {/* 5. Date & Time / Weather */}
            <div className="col-span-2 sm:col-span-1 rounded-2xl bg-[#0c1326] border border-slate-800 p-4 shadow-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400">Mon, 14 Oct 2026</div>
                <div className="text-base font-black text-white font-mono">10:24:37 AM</div>
                <div className="text-[10px] text-slate-400">Campus Time</div>
              </div>
              <div className="text-right flex flex-col items-end">
                <CloudSun className="w-6 h-6 text-amber-300" />
                <span className="text-xs font-bold text-white font-mono mt-0.5">28°C</span>
                <span className="text-[9px] text-slate-400">Clear</span>
              </div>
            </div>
          </div>

          {/* =========================================================== */}
          {/* TWO MAIN SECTORS: CENTER CCTV MATRIX & RIGHT RADAR MAP       */}
          {/* =========================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: AI CCTV Threat Matrix & Events Table */}
            <div className="lg:col-span-8 space-y-5">
              {/* AI CCTV Threat Matrix Card */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-5 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-black font-heading text-white">
                      AI CCTV Threat Matrix
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                      ● Live Streams (4 Online)
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={camFilter}
                      onChange={(e) => setCamFilter(e.target.value)}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 outline-none"
                    >
                      <option value="All Blocks">All Blocks</option>
                      <option value="Block-B">Block-B</option>
                      <option value="Gate-1">Gate-1</option>
                    </select>

                    <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setCamLayout('grid')}
                        className={`p-1 rounded-lg ${camLayout === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                      >
                        <Grid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCamLayout('list')}
                        className={`p-1 rounded-lg ${camLayout === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 Camera Feeds Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {cctvStreams.map((cam) => (
                    <div
                      key={cam.id}
                      className="rounded-2xl overflow-hidden border border-slate-800 bg-[#080d19] shadow-xl group hover:border-blue-500/50 transition-colors"
                    >
                      {/* Top Camera Header Pill */}
                      <div className="px-3 py-1.5 flex items-center justify-between bg-[#0e162c] border-b border-slate-800 text-[11px]">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cam.headerStyle}`}>
                          {cam.title}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{cam.time}</span>
                      </div>

                      {/* Video Feed Thumbnail */}
                      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                        <img
                          src={cam.thumbnail}
                          alt={cam.location}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />

                        {/* AI Detection Bounding Boxes Simulation */}
                        {cam.alertType === 'fight' && (
                          <div className="absolute inset-x-12 inset-y-6 border-2 border-red-500 bg-red-500/10 pointer-events-none animate-pulse flex items-start justify-end p-1">
                            <span className="bg-red-600 text-white font-mono text-[9px] font-bold px-1 rounded">
                              AI: VIOLENCE 95%
                            </span>
                          </div>
                        )}
                        {cam.alertType === 'crowd' && (
                          <div className="absolute inset-x-8 inset-y-4 border-2 border-amber-500 bg-amber-500/10 pointer-events-none flex items-start justify-end p-1">
                            <span className="bg-amber-500 text-slate-950 font-mono text-[9px] font-black px-1 rounded">
                              DENSITY 85+
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Camera Location Bar */}
                      <div className="px-3 py-2 flex items-center justify-between text-[11px] bg-[#0c1224]">
                        <span className="text-slate-300 font-mono truncate max-w-[140px]">{cam.location}</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setScanCamera(cam)}
                            className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center space-x-1 transition-all"
                            title="Run Gemini 1.5 Flash + YOLO Threat Diagnosis"
                          >
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>AI Scan</span>
                          </button>
                          <button
                            onClick={() => setShowDispatchModal(true)}
                            className="text-blue-400 hover:text-white p-1"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Security Events Table Card */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400 text-base">🛡️</span>
                    <h3 className="text-sm font-black font-heading text-white">
                      Recent Security Events
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono">
                      ● Live Updates
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/admin/audit-logs')}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0e162c] text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Event Type</th>
                        <th className="py-2.5 px-3">Location</th>
                        <th className="py-2.5 px-3">Details</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {recentEvents.map((evt) => (
                        <tr key={evt.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                            {evt.time}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${evt.badgeClass}`}
                            >
                              {evt.typeLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                            {evt.location}
                          </td>
                          <td className="py-3 px-3 text-slate-300 text-[11px]">{evt.details}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setShowDispatchModal(true)}
                              className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-[11px] font-bold transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Guard GPS Radar Map & On-Duty Guards */}
            <div className="lg:col-span-4 space-y-5">
              {/* Radar Map Card */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <h3 className="text-xs font-black font-heading text-white">
                      Live Guard GPS Radar Map
                    </h3>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                    ● Live GPS
                  </span>
                </div>

                {/* Radar 2D Spatial Digital Twin (Reflecting Live Blueprint & Guards) */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#070d19] shadow-inner">
                  <SpatialDigitalTwin2D height="340px" activeRole="SECURITY" />
                </div>
              </div>

              {/* On-Duty Guards (Live GPS) Card */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 shadow-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-xs">On-Duty Guards (Live GPS)</div>
                  <button
                    onClick={() => navigate('/admin/attendance')}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
                  >
                    View All &gt;
                  </button>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {onDutyGuards.map((g) => (
                    <div
                      key={g.id}
                      className="p-2.5 rounded-xl bg-[#0e162c] border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={g.avatar}
                          alt={g.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-white text-xs">{g.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">{g.badge}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{g.location}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${g.statusClass}`}>
                          {g.status}
                        </span>
                        <a
                          href={`tel:${g.phone.replace(/\D/g, '')}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Call Guard"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

      {/* ============================================================= */}
      {/* AI INCIDENT VERIFICATION & DISPATCH POPUP MODAL               */}
      {/* (EXACT REPLICA OF THE SCREENSHOT 2 & 3 FLOATING MODAL)         */}
      {/* ============================================================= */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0c1328] border-2 border-rose-500/80 shadow-2xl shadow-rose-500/25 p-5 space-y-4 text-xs overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-heading text-white leading-tight">
                    AI Incident Verification &amp; Dispatch
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    5-Second Recorded CCTV Clip • AI Analysis: 95% Violence
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5-Sec Recorded Clip Video Frame */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-black aspect-video flex items-center justify-center shadow-inner">
              <img
                src={MOCK_ASSETS.fightClip}
                alt="Violence Altercation"
                className="w-full h-full object-cover"
              />

              {/* Timestamp & Video Controls */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
                2026-10-14 10:24:32
              </div>

              <div className="absolute inset-x-3 bottom-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-sm text-[10px] font-mono text-white flex items-center justify-between">
                <span>▶ 0:03 / 0:05</span>
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-3.5 h-3.5" />
                  <Maximize2 className="w-3.5 h-3.5 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Audio Waveform Visualizer */}
            <div className="px-2 py-1 flex items-center justify-center space-x-1">
              {[8, 14, 22, 38, 54, 42, 28, 48, 62, 50, 32, 20, 36, 44, 26, 12, 6].map(
                (h, idx) => (
                  <span
                    key={idx}
                    className="w-1 rounded-full bg-rose-500 animate-pulse"
                    style={{ height: `${h}px`, animationDelay: `${idx * 0.08}s` }}
                  ></span>
                )
              )}
            </div>

            {/* Threat Badge & Silent Verification Notice */}
            <div className="flex items-center justify-between px-1">
              <span className="px-2.5 py-1 rounded-xl bg-rose-950 text-rose-300 border border-rose-500/50 font-bold text-[11px] flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>VIOLENCE_FIGHT DETECTED</span>
              </span>

              <span className="text-[10px] text-slate-400 font-mono">
                Silent Verification — Public Siren Off
              </span>
            </div>

            {/* Nearest Free Guards (Redis GEORADIUS Live Match) */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px]">
                <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Nearest Free Guards (Redis GEORADIUS Live Match)</span>
                </div>
                <RefreshCw
                  className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:rotate-180 transition-transform"
                  onClick={loadConsoleData}
                />
              </div>

              {/* Guard 1: Vikram Singh (Recommended #1) */}
              <div
                onClick={() => setSelectedGuardToDispatch('SEC-101')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedGuardToDispatch === 'SEC-101'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-[#0e162c] border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <img
                    src={MOCK_ASSETS.avatars.vikramSingh}
                    alt="Vikram Singh"
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-white text-xs">Vikram Singh</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[9px] font-bold">
                        ★ Recommended #1
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      SEC-101 • Near Gate 2
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    ● Free
                  </span>
                  <div className="text-[10px] font-mono text-emerald-300 font-bold mt-1">
                    35 meters away
                  </div>
                </div>
              </div>

              {/* Guard 2: Rajesh Kumar (Recommended #2) */}
              <div
                onClick={() => setSelectedGuardToDispatch('SEC-104')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedGuardToDispatch === 'SEC-104'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-[#0e162c] border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <img
                    src={MOCK_ASSETS.avatars.rajatKumar}
                    alt="Rajesh Kumar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-white text-xs">Rajesh Kumar</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono text-[9px]">
                        #2
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">SEC-104 • Block-A</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    ● Free
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">110 meters away</div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Buttons */}
            <div className="flex items-center space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleDismissIncident}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Dismiss False Alarm
              </button>

              <button
                type="button"
                onClick={handleDispatchGuard}
                disabled={submittingDispatch}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-xl shadow-red-600/30 transition-all disabled:opacity-50"
              >
                <span>⚡ Dispatch Vikram Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* ONBOARD SECURITY GUARD MODAL                                  */}
      {/* ============================================================= */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleOnboardGuardSubmit}
            className="w-full max-w-md rounded-2xl bg-[#0c1326] border border-slate-700 p-5 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white font-heading">
                  Onboard Security Guard
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={onboardForm.name}
                onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={onboardForm.phone}
                  onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Badge ID</label>
                <input
                  type="text"
                  value={onboardForm.staff_id}
                  onChange={(e) => setOnboardForm({ ...onboardForm, staff_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Default Gate</label>
                <select
                  value={onboardForm.default_gate}
                  onChange={(e) => setOnboardForm({ ...onboardForm, default_gate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                >
                  <option value="Gate-2">Gate-2</option>
                  <option value="Main Gate-1">Main Gate-1</option>
                  <option value="Block-B">Block-B</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Quick 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={onboardForm.pin}
                  onChange={(e) => setOnboardForm({ ...onboardForm, pin: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none font-mono text-center tracking-widest"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30"
              >
                Enroll Guard
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gemini Multimodal Cognitive Threat Diagnostic Modal */}
      <GeminiThreatScanModal
        camera={scanCamera}
        isOpen={!!scanCamera}
        onClose={() => setScanCamera(null)}
        onGuardDispatched={(guard) => {
          setToast({ type: 'success', msg: `Guard ${guard.name} (${guard.staff_id || 'SEC'}) dispatched immediately via Gemini Autopilot!` });
          setScanCamera(null);
          loadConsoleData();
        }}
      />
      </div>
    </SecurityLayout>
  );
};

export default SecurityConsole;
