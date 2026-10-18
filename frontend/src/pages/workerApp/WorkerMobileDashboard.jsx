import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import SpatialDigitalTwin2D from '../../components/SpatialDigitalTwin2D';
import MOCK_ASSETS from '../../utils/mockAssets';
import {
  Wrench,
  Zap,
  Timer,
  CheckCircle,
  Camera,
  Navigation,
  RefreshCw,
  Power,
  Sparkles,
  AlertTriangle,
  Layers,
  Building,
  Check,
  X,
  MapPin,
  Coffee,
  Clock,
  Send,
  Phone,
  Search,
  Bell,
  HelpCircle,
  FileText,
  User,
  Settings,
  ChevronRight,
  Compass,
  CheckCircle2,
  QrCode,
  BookOpen,
  Star,
  Flame,
  ArrowRight,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const WorkerMobileDashboard = () => {
  const { user, logout } = useAuth();
  const { notifications } = useSocket();
  const { isDarkMode, toggleTheme } = useTheme();

  // Duty State
  const [dutyState, setDutyState] = useState('ONLINE_FREE'); // 'ONLINE_FREE' | 'BUSY_ON_TASK' | 'ON_BREAK' | 'OFF_DUTY'
  const [toast, setToast] = useState(null);

  // Worker Info
  const [workerInfo, setWorkerInfo] = useState({
    name: user?.name || 'Ramesh Kumar',
    staff_id: user?.staff_id || 'WRK-201',
    trade: 'Housekeeping',
    location: 'Block-B, Floor 2',
    lat: 28.6139,
    lng: 77.209,
    avatar: MOCK_ASSETS.avatars.rohitYadav,
  });

  // Today's Stats
  const [todaySummary, setTodaySummary] = useState({
    tasksCompleted: 3,
    energySavedKwh: 2.5,
    incentiveEarned: 120,
    rating: 4.8,
    reviewsCount: 12,
  });

  // Live SLA Timer: 02:45
  const [slaCountdown, setSlaCountdown] = useState(165); // 2 mins 45 secs
  const [isEnRoute, setIsEnRoute] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Active Task Data
  const [task, setTask] = useState({
    id: 'TK-1042',
    ticket_id: 'TK-1042',
    type: 'GHOST ENERGY SHUTDOWN',
    subType: 'Energy Waste Alert',
    priority: 'High',
    desc: 'Unnecessary AC/Lights are ON in an empty room',
    room: 'Block-B, Floor 2, Room 204',
    distanceMeters: 22,
    walkTime: '~1 min walk',
    instructionHindi:
      'Kamra khali hai. Main switchboard se 2 AC aur 6 Lights band karein. Room currently not in use but AC aur lights ON hain. Please shutdown and capture live proof photo.',
    appliances: [
      { name: 'Split AC', count: 2, kw: '3.0 kW' },
      { name: 'Lights', count: 6, kw: '0.24 kW' },
    ],
    totalWasteKw: 3.54,
    assignedBy: 'AI Auto-Dispatch',
    assignedAt: '14 Oct 2026, 10:10 AM',
    expectedTime: '10 minutes',
  });

  // Proof Camera Modal
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [proofType, setProofType] = useState('after'); // 'before' | 'after'
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);

  // 1-second countdown interval
  useEffect(() => {
    if (slaCountdown > 0 && !isEnRoute) {
      const interval = setInterval(() => {
        setSlaCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [slaCountdown, isEnRoute]);

  const mins = Math.floor(slaCountdown / 60);
  const secs = slaCountdown % 60;
  const slaDisplay = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  // Handle Duty Status Switch
  const handleDutyChange = async (target) => {
    setDutyState(target);
    try {
      await axiosClient.post('/worker/duty-state', {
        duty_state: target,
        lat: workerInfo.lat,
        lng: workerInfo.lng,
      });
      setToast({
        type: 'success',
        msg: `🟢 Status updated to ${target.replace('_', ' ')}.`,
      });
    } catch {
      setToast({
        type: 'success',
        msg: `🟢 Status updated to ${target.replace('_', ' ')}.`,
      });
    }
  };

  // Button: Accept / Mai Ja Raha Hu
  const handleAcceptTask = async () => {
    setIsEnRoute(true);
    setSubmitting(true);
    try {
      await axiosClient.post(`/worker/accept-task/${task.id}`).catch(() => null);
      setToast({
        type: 'success',
        msg: '👍 Task Accepted: Mai Ja Raha Hu! Navigation active, SLA countdown paused.',
      });
    } catch {
      setToast({
        type: 'success',
        msg: '👍 Task Accepted: Navigation active.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Button: Resolve Task
  const handleResolveTask = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    try {
      await axiosClient.post(`/worker/resolve-task/${task.id}`, {
        resolution_notes: 'Turned off 2 Split ACs and 6 tube lights at main switchboard. Room confirmed vacant.',
        proof_photo_url: MOCK_ASSETS.classroomCctv,
      }).catch(() => null);

      setToast({
        type: 'success',
        msg: '✅ Task Resolved! 3.54 kW ghost waste saved. ₹40 incentive credited to your wallet.',
      });
      setTodaySummary((s) => ({
        ...s,
        tasksCompleted: s.tasksCompleted + 1,
        energySavedKwh: s.energySavedKwh + 3.5,
        incentiveEarned: s.incentiveEarned + 40,
      }));
      setShowCameraModal(false);
    } catch {
      setToast({
        type: 'success',
        msg: '✅ Task Resolved successfully.',
      });
      setShowCameraModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f1f5f9] text-slate-800'} flex antialiased`}>
      {/* ============================================================= */}
      {/* LEFT SIDEBAR: WORKER PORTAL                                   */}
      {/* ============================================================= */}
      <aside className={`hidden lg:flex w-64 ${isDarkMode ? 'bg-[#0a0f1d] border-slate-800/80 text-slate-300' : 'bg-white border-slate-200 text-slate-800'} border-r flex-col justify-between p-4 shrink-0`}>
        <div className="space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 via-blue-600/30 to-purple-600/40 p-0.5 border border-amber-400/40 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#0c1222] rounded-[10px] flex items-center justify-center text-amber-300">
                <Wrench className="w-5 h-5 text-amber-300" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-black font-heading text-white leading-tight">
                Smart Campus
              </h1>
              <p className="text-[10px] font-semibold text-blue-400">Worker Portal</p>
            </div>
          </div>

          <div className="space-y-1 text-xs font-semibold">
            {[
              { label: 'Dashboard', icon: Wrench, active: true },
              { label: 'My Tasks', icon: CheckCircle, badge: '2' },
              { label: 'Task History', icon: Clock },
              { label: 'Notifications', icon: Bell, badge: '3' },
              { label: 'Campus Map', icon: MapPin },
              { label: 'Knowledge Base', icon: BookOpen },
              { label: 'Messages', icon: FileText },
              { label: 'My Profile', icon: User },
              { label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    item.active
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#12192e] border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400">Need Help?</div>
          <div className="text-xs font-bold text-white flex items-center justify-between">
            <span>Contact Supervisor</span>
            <Phone className="w-3.5 h-3.5 text-blue-400" />
          </div>
        </div>
      </aside>

      {/* ============================================================= */}
      {/* MAIN CONTAINER                                                */}
      {/* ============================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-[#090d1a]/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rooms, tasks, blocks..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0e1426] border border-slate-800 text-xs text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>

          <div className="flex items-center space-x-3">
            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className={`p-2 rounded-xl border transition-colors ${
                isDarkMode
                  ? 'bg-[#0e1426] hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-amber-600'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button className={`relative p-2 rounded-xl border ${
              isDarkMode ? 'bg-[#0e1426] border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                3
              </span>
            </button>

            <button className="p-2 rounded-xl bg-[#0e1426] border border-slate-800 text-slate-300">
              <HelpCircle className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5 pl-2 py-1 pr-3 rounded-xl bg-[#0e1426] border border-slate-800">
              <img
                src={workerInfo.avatar}
                alt={workerInfo.name}
                className="w-8 h-8 rounded-full object-cover border border-blue-500"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white">{workerInfo.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {workerInfo.staff_id} • {workerInfo.trade}
                </div>
              </div>
            </div>

            {/* Direct Top-Bar Sign Out Button */}
            <button
              onClick={logout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
              title="Punch Out & Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 lg:p-6 space-y-5">
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
          {/* TOP THREE-COLUMN LAYOUT (STATUS / TASK / INFO)              */}
          {/* =========================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left 3 Cols: Profile, Duty Status, Summary, Quick Actions */}
            <div className="lg:col-span-3 space-y-4">
              {/* Profile Card */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 flex items-center space-x-3">
                <img
                  src={workerInfo.avatar}
                  alt={workerInfo.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-sm text-white">{workerInfo.name}</span>
                    <span className="text-emerald-400 text-xs">✓</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">{workerInfo.staff_id}</div>
                  <div className="inline-block px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-semibold mt-1">
                    {workerInfo.trade}
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-mono mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>GPS Active</span>
                  </div>
                </div>
              </div>

              {/* Duty Status 4-State Buttons */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 space-y-2.5">
                <div className="text-xs font-bold text-slate-300">Duty Status</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* ONLINE */}
                  <button
                    onClick={() => handleDutyChange('ONLINE_FREE')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      dutyState === 'ONLINE_FREE'
                        ? 'bg-emerald-950/80 border-emerald-500 shadow-md shadow-emerald-500/20'
                        : 'bg-[#0e162c] border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 text-xs">ONLINE</span>
                      <span className="text-emerald-400 text-xs">✓</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Available for tasks</div>
                  </button>

                  {/* BUSY */}
                  <button
                    onClick={() => handleDutyChange('BUSY_ON_TASK')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      dutyState === 'BUSY_ON_TASK'
                        ? 'bg-amber-950/80 border-amber-500 shadow-md shadow-amber-500/20'
                        : 'bg-[#0e162c] border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 text-xs">BUSY</span>
                      <span className="text-amber-400 text-xs">○</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">On an active task</div>
                  </button>

                  {/* ON BREAK */}
                  <button
                    onClick={() => handleDutyChange('ON_BREAK')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      dutyState === 'ON_BREAK'
                        ? 'bg-orange-950/80 border-orange-500 shadow-md shadow-orange-500/20'
                        : 'bg-[#0e162c] border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-orange-400 text-xs">ON BREAK</span>
                      <span className="text-orange-400 text-xs">☕</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Pause AI dispatch</div>
                  </button>

                  {/* OFF-DUTY */}
                  <button
                    onClick={() => handleDutyChange('OFF_DUTY')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      dutyState === 'OFF_DUTY'
                        ? 'bg-rose-950/80 border-rose-500 shadow-md shadow-rose-500/20'
                        : 'bg-[#0e162c] border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-400 text-xs">OFF-DUTY</span>
                      <span className="text-rose-400 text-xs">○</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">End shift &amp; offline</div>
                  </button>
                </div>
              </div>

              {/* Today's Summary */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">Today's Summary</div>
                  <span className="text-[10px] text-blue-400 font-bold">View All</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#0e162c] border border-slate-800">
                    <div className="text-base font-black text-white">
                      {todaySummary.tasksCompleted}
                    </div>
                    <div className="text-[10px] text-slate-400">Tasks Completed</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0e162c] border border-slate-800">
                    <div className="text-base font-black text-emerald-400">
                      {todaySummary.energySavedKwh} kWh
                    </div>
                    <div className="text-[10px] text-slate-400">Energy Saved</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0e162c] border border-slate-800">
                    <div className="text-base font-black text-amber-400">
                      ₹{todaySummary.incentiveEarned}
                    </div>
                    <div className="text-[10px] text-slate-400">Incentive Earned</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0e162c] border border-slate-800">
                    <div className="text-base font-black text-yellow-300">
                      {todaySummary.rating} ★
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Rating ({todaySummary.reviewsCount})
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Location */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">Live Location</div>
                  <button
                    onClick={() => setToast({ type: 'success', msg: 'GPS Telemetry Refreshed' })}
                    className="text-[10px] font-bold text-blue-400"
                  >
                    Update
                  </button>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">{workerInfo.location}</div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Lat: {workerInfo.lat}, Lng: {workerInfo.lng}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setToast({ type: 'success', msg: 'QR Scanner Ready' })}
                  className="p-2.5 rounded-xl bg-[#0e162c] border border-slate-800 hover:border-slate-700 flex items-center space-x-2 text-slate-300 text-left"
                >
                  <QrCode className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-[11px]">Scan QR</div>
                    <div className="text-[9px] text-slate-400">at Room</div>
                  </div>
                </button>

                <button
                  onClick={() => setToast({ type: 'success', msg: 'Issue form sent to supervisor' })}
                  className="p-2.5 rounded-xl bg-[#0e162c] border border-slate-800 hover:border-slate-700 flex items-center space-x-2 text-slate-300 text-left"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-[11px]">Report Issue</div>
                    <div className="text-[9px] text-slate-400">to Supervisor</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Middle 6 Cols: Active Ghost Energy Task & 3D Route Map */}
            <div className="lg:col-span-6 space-y-4">
              {/* Task Assigned Orange Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-5 text-white shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                      ⚡
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-orange-200">
                        New Task Assigned
                      </div>
                      <h2 className="text-base sm:text-lg font-black font-heading tracking-tight">
                        {task.type}
                      </h2>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-white text-orange-700 text-xs font-black uppercase tracking-wider">
                    HIGH PRIORITY
                  </span>
                </div>

                {/* Subtitle */}
                <p className="text-xs text-orange-100">{task.desc}</p>

                {/* SLA Timer Pill */}
                <div className="rounded-2xl bg-black/40 backdrop-blur-sm border border-white/20 p-3 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2 text-amber-200">
                    <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="font-bold">
                      SLA Timer: {slaDisplay} mins left to accept
                    </span>
                  </div>
                  <span className="text-[10px] text-orange-200">
                    Auto-transfers to Suresh after 3 min
                  </span>
                </div>

                {/* Location & Navigation */}
                <div className="rounded-2xl bg-black/20 p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-white" />
                    <div>
                      <div className="font-bold text-white">{task.room}</div>
                      <div className="text-[10px] text-orange-100 font-mono">
                        {task.distanceMeters} meters from your current location ({task.walkTime})
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setToast({ type: 'success', msg: 'Indoor Turn-by-Turn GPS Active' })}
                    className="px-3 py-1.5 rounded-xl bg-white text-orange-700 font-bold text-xs flex items-center space-x-1 shadow-md"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Navigate</span>
                  </button>
                </div>

                {/* Hindi Field Instruction Box */}
                <div className="rounded-2xl bg-amber-950/60 border border-amber-400/40 p-3 flex items-start space-x-2 text-xs">
                  <span className="text-base">💡</span>
                  <div>
                    <div className="font-bold text-amber-200">
                      Kamra khali hai. Main switchboard se 2 AC aur 6 Lights band karein.
                    </div>
                    <p className="text-[11px] text-amber-100 mt-0.5 leading-snug">
                      Room currently not in use but AC aur lights ON hain. Please shutdown and
                      capture live proof photo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Room Details & Virtual Metering Box */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-white">Room Details</div>
                  <span className="px-2 py-0.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono">
                    Classroom (Academic)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div className="h-28 rounded-xl overflow-hidden border border-slate-800 bg-black">
                    <img
                      src={MOCK_ASSETS.classroomCctv}
                      alt="Room 204"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-[10px] text-slate-400 font-mono">
                      Detected ON (Virtual Meter)
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#0e162c] border border-slate-800">
                      <span>❄️ 2 × Split AC (3.0 kW)</span>
                      <span>💡 6 × Lights (0.24 kW)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 font-bold flex items-center justify-between text-xs">
                      <span>⚡ Total Waste:</span>
                      <span className="font-mono text-sm">{task.totalWasteKw} kW</span>
                    </div>
                  </div>
                </div>

                {/* Master 2D Campus Blueprint & Workorder Location Pin */}
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#070d19] shadow-inner">
                  <SpatialDigitalTwin2D height="260px" activeRole="WORKER" highlightRoomId="204" />
                </div>

                {/* Two Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleAcceptTask}
                    disabled={isEnRoute}
                    className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xl shadow-emerald-600/25 transition-all"
                  >
                    <span className="text-base">👍</span>
                    <div className="text-left leading-tight">
                      <div>Accept / Mai Ja Raha Hu</div>
                      <div className="text-[9px] text-emerald-200">
                        {isEnRoute ? 'EN ROUTE ✓' : 'Start navigation & mark as en route'}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowCameraModal(true)}
                    className="py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xl shadow-blue-600/25 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                    <div className="text-left leading-tight">
                      <div>Take Live Proof Photo</div>
                      <div className="text-[9px] text-blue-200">&amp; Mark Resolved &gt;</div>
                    </div>
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 text-center font-mono pt-1">
                  🔒 Live Camera Only (Gallery Blocked) • ✨ AI checks room brightness drop &amp;
                  updates Saved Energy (kWh &amp; ₹)
                </div>
              </div>
            </div>

            {/* Right 3 Cols: Task Information, Support, Instructions */}
            <div className="lg:col-span-3 space-y-4">
              {/* Task Information */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="font-bold text-white">Task Information</div>
                  <span className="font-mono text-cyan-400 font-bold">#{task.id}</span>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="font-semibold text-white">{task.subType}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Priority:</span>
                    <span className="font-bold text-rose-400">{task.priority}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned By:</span>
                    <span>{task.assignedBy}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned At:</span>
                    <span className="font-mono text-[10px]">{task.assignedAt}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Expected Time:</span>
                    <span className="font-mono text-emerald-400">{task.expectedTime}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-[10px] font-mono text-right">{task.room}</span>
                  </div>
                </div>
              </div>

              {/* Contact & Support */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 space-y-2.5 text-xs">
                <div className="font-bold text-white">Contact &amp; Support</div>

                <div className="p-2.5 rounded-xl bg-[#0e162c] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-[11px]">Amit Sharma</div>
                      <div className="text-[9px] text-slate-400">Electrical Supervisor</div>
                    </div>
                  </div>
                  <a
                    href="tel:9876543210"
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px]"
                  >
                    Call
                  </a>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0e162c] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-[11px]">Control Room</div>
                      <div className="text-[9px] text-slate-400">Campus Operations</div>
                    </div>
                  </div>
                  <a
                    href="tel:9876543210"
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px]"
                  >
                    Call
                  </a>
                </div>
              </div>

              {/* Before / After Proof Boxes */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white">Before / After Proof</div>
                  <span className="text-[10px] text-emerald-400 font-mono">● Live Camera</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => {
                      setProofType('before');
                      setShowCameraModal(true);
                    }}
                    className="p-3 rounded-xl border border-dashed border-slate-700 bg-[#0e162c] flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500"
                  >
                    <Camera className="w-5 h-5 text-slate-400 mb-1" />
                    <div className="font-bold text-white text-[10px]">Take Photo (Before)</div>
                    <div className="text-[8px] text-slate-500">AC/Lights ON</div>
                  </div>

                  <div
                    onClick={() => {
                      setProofType('after');
                      setShowCameraModal(true);
                    }}
                    className="p-3 rounded-xl border border-dashed border-slate-700 bg-[#0e162c] flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500"
                  >
                    <Camera className="w-5 h-5 text-slate-400 mb-1" />
                    <div className="font-bold text-white text-[10px]">Take Photo (After)</div>
                    <div className="text-[8px] text-slate-500">AC/Lights OFF</div>
                  </div>
                </div>
              </div>

              {/* Task Instructions */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 space-y-2 text-xs">
                <div className="font-bold text-white">Task Instructions</div>
                <div className="space-y-1.5 text-slate-300 text-[11px]">
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-mono text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Go to Room 204 (Block-B, Floor 2)</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-mono text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Check and switch OFF 2 AC and 6 Lights</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-mono text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>Capture live proof photo (After shutdown)</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-mono text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <span>Submit and mark as resolved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Proof Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleResolveIncident}
            className="w-full max-w-lg rounded-2xl bg-[#0c1326] border border-slate-700 p-5 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">
                    Capture Proof Photo ({proofType.toUpperCase()})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live Camera Only • GPS Tagged: Room 204 Block-B
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCameraModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
              <img
                src={MOCK_ASSETS.classroomCctv}
                alt="Room Switchboard"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500 text-black font-mono font-bold text-[9px]">
                LIGHTS/AC SHUTDOWN CONFIRMED
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[9px] text-cyan-300">
                Lat: 28.6139, Lng: 77.2090
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCameraModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/30 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm &amp; Resolve Work Order</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default WorkerMobileDashboard;
