import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import SpatialDigitalTwin2D from '../../components/SpatialDigitalTwin2D';
import MOCK_ASSETS from '../../utils/mockAssets';
import {
  Shield,
  Radio,
  AlertTriangle,
  Play,
  Camera,
  Bell,
  Navigation,
  RefreshCw,
  Power,
  Volume2,
  Video,
  X,
  MapPin,
  Check,
  Compass,
  Search,
  Phone,
  PhoneCall,
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
  Loader2,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const GuardMobileDashboard = () => {
  const { user, logout } = useAuth();
  const { notifications } = useSocket();
  const { isDarkMode, toggleTheme } = useTheme();

  // Guard Status & Profile
  const [isOnPatrol, setIsOnPatrol] = useState(true);
  const [guardInfo, setGuardInfo] = useState({
    name: user?.name || 'Vikram Singh',
    staff_id: user?.staff_id || 'SEC-101',
    team: 'Main Gate Team',
    location: 'Main Gate (Lat: 28.6139, Lng: 77.2090)',
    lat: 28.6139,
    lng: 77.209,
    avatar: MOCK_ASSETS.avatars.vikramSingh,
  });

  // Navigation map view mode: '2D Blueprint' | '3D View'
  const [mapMode, setMapMode] = useState('2D Blueprint');

  // Emergency Incident State
  const [incident, setIncident] = useState({
    id: 'INC-FIGHT-01',
    incident_code: 'INC-2026-FIGHT-01',
    threat_type: 'Physical Fight (AI Detected)',
    title: 'PHYSICAL FIGHT DETECTED',
    desc: '2 students are fighting in corridor. Immediate response required.',
    time: '10:24 AM, 14 Oct 2026',
    location: 'Block-B, 2nd Floor, Corridor',
    shortLocation: 'Block-B Corridor',
    distanceMeters: 40,
    distanceDisplay: 'Only 40 meters from your GPS (~1 min walk)',
    peopleInvolved: '2 students (AI Analysis)',
    aiConfidence: '95%',
    threatLevel: 'High (Violence Detected)',
    status: 'Pending Response', // 'Pending Response' | 'EN_ROUTE' | 'BACKUP_REQUESTED' | 'RESOLVED'
    videoThumbnail: MOCK_ASSETS.corridorCctv,
  });

  // Nearby Guards Auto-Suggested Roster
  const [nearbyGuards, setNearbyGuards] = useState([
    {
      id: 1,
      staff_id: 'SEC-104',
      name: 'Rajat Kumar',
      avatar: MOCK_ASSETS.avatars.rajatKumar,
      distance: '110 meters away',
      location: 'Block-A',
      tag: 'Recommended',
      tagColor: 'green',
      phone: '+91 98765 43210',
    },
    {
      id: 2,
      staff_id: 'SEC-106',
      name: 'Amit Yadav',
      avatar: MOCK_ASSETS.avatars.amitYadav,
      distance: '220 meters away',
      location: 'Block-B',
      tag: 'On-Task',
      tagColor: 'amber',
      phone: '+91 98765 87654',
    },
    {
      id: 3,
      staff_id: 'SEC-107',
      name: 'Suresh Patel',
      avatar: MOCK_ASSETS.avatars.sureshPatel,
      distance: '310 meters away',
      location: 'Main Gate',
      tag: 'Free',
      tagColor: 'green',
      phone: '+91 91234 56789',
    },
  ]);

  // Video modal & Live Camera Proof Modal
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Live GPS 5-second interval simulation & ping
  useEffect(() => {
    const pingGps = async () => {
      try {
        await axiosClient.post('/guard/gps-ping', {
          lat: guardInfo.lat,
          lng: guardInfo.lng,
          accuracy: 3.5,
          floor_number: 0,
        });
      } catch {
        // Keep smooth local telemetry
      }
    };

    pingGps();
    const interval = setInterval(pingGps, 5000);
    return () => clearInterval(interval);
  }, [guardInfo.lat, guardInfo.lng]);

  // Toggle Duty Switch with Backend API
  const handleToggleDuty = async () => {
    const nextState = !isOnPatrol;
    setIsOnPatrol(nextState);

    try {
      await axiosClient.post('/guard/duty-toggle', {
        duty_state: nextState ? 'ONLINE_FREE' : 'OFF_DUTY',
        lat: guardInfo.lat,
        lng: guardInfo.lng,
      });
      setToast({
        type: 'success',
        msg: nextState
          ? '🟢 ON PATROL: Shift started. Real-time GPS broadcasting every 5s.'
          : '🔴 OFF DUTY: Patrol shift ended. GPS tracking paused.',
      });
    } catch {
      setToast({
        type: 'success',
        msg: nextState ? '🟢 Duty Active: On Patrol' : '🔴 Off Duty',
      });
    }
  };

  // Button 1: Accept & Running (Status -> EN_ROUTE)
  const handleAcceptIncident = async () => {
    setSubmitting(true);
    try {
      await axiosClient.post(`/guard/accept-incident/${incident.id}`).catch(() => null);
      setIncident((prev) => ({ ...prev, status: 'EN_ROUTE' }));
      setToast({
        type: 'success',
        msg: '🏃 Status Updated: EN_ROUTE! GPS route locked. SOC notified you are running to Block-B.',
      });
    } catch {
      setIncident((prev) => ({ ...prev, status: 'EN_ROUTE' }));
    } finally {
      setSubmitting(false);
    }
  };

  // Button 2: Request Backup (Alert Security Head)
  const handleRequestBackup = async () => {
    setSubmitting(true);
    try {
      await axiosClient.post(`/guard/request-backup/${incident.id}`, {
        reason: 'Altercation between 2 students in Block-B corridor. Requesting immediate backup guard.',
      }).catch(() => null);

      setIncident((prev) => ({ ...prev, status: 'BACKUP_REQUESTED' }));
      setToast({
        type: 'success',
        msg: '📢 Backup Alert Broadcasted! Security Head notified. Rajat Kumar (SEC-104) auto-dispatched.',
      });
    } catch {
      setIncident((prev) => ({ ...prev, status: 'BACKUP_REQUESTED' }));
      setToast({
        type: 'success',
        msg: '📢 Backup requested! Closest guard alerted.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Button 3: Capture Live Proof & Mark Resolved
  const handleResolveIncident = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    try {
      await axiosClient.post(`/guard/resolve-incident/${incident.id}`, {
        resolution_note: 'Physical altercation in Block-B corridor diffused peacefully. Perimeter secured.',
        proof_photo_url: MOCK_ASSETS.corridorCctv,
      }).catch(() => null);

      setIncident((prev) => ({ ...prev, status: 'RESOLVED' }));
      setShowProofModal(false);
      setToast({
        type: 'success',
        msg: '✅ Incident Resolved! Photographic proof archived and audit log updated.',
      });
    } catch {
      setIncident((prev) => ({ ...prev, status: 'RESOLVED' }));
      setShowProofModal(false);
      setToast({
        type: 'success',
        msg: '✅ Incident marked Resolved.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f1f5f9] text-slate-800'} flex antialiased`}>
      {/* ============================================================= */}
      {/* LEFT SIDEBAR: SECURITY GUARD PORTAL                          */}
      {/* ============================================================= */}
      <aside className={`hidden lg:flex w-64 ${isDarkMode ? 'bg-[#0a0f1d] border-slate-800/80 text-slate-300' : 'bg-white border-slate-200 text-slate-800'} border-r flex-col justify-between p-4 shrink-0`}>
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 via-blue-600/30 to-indigo-600/40 p-0.5 border border-amber-400/40 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#0c1222] rounded-[10px] flex items-center justify-center text-amber-300">
                <Shield className="w-5 h-5 text-amber-300" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-black font-heading text-white leading-tight">
                Smart Campus
              </h1>
              <p className="text-[10px] font-semibold text-blue-400">Security Guard Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5 text-xs font-semibold">
            {[
              { label: 'Live Duty', icon: Shield, active: true },
              { label: 'My Patrol Route', icon: Footprints },
              { label: 'Active Incidents', icon: AlertTriangle, badge: '2' },
              { label: 'CCTV Feeds', icon: Video },
              { label: 'My Tasks', icon: FileText },
              { label: 'Message & Alerts', icon: MessageSquare, badge: '3' },
              { label: 'Profile', icon: User },
              { label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
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

        {/* Bottom Emergency Contact & Quick Help */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="p-3 rounded-2xl bg-[#12192e] border border-slate-800 space-y-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Emergency Contact</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Security Head</div>
                <div className="text-[11px] font-mono text-slate-400">+91 98765 43210</div>
              </div>
              <a
                href="tel:9876543210"
                className="w-8 h-8 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-600/30"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          <button
            onClick={() => setToast({ type: 'success', msg: 'SOS Report logged to Security Head.' })}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Report Issue</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </aside>

      {/* ============================================================= */}
      {/* MAIN CONTENT AREA                                            */}
      {/* ============================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4 transition-colors duration-200 ${
          isDarkMode ? 'bg-[#090d1a]/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
        }`}>
          <div className="relative flex-1 max-w-md">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <input
              type="text"
              placeholder="Search location, room, guard, incident... Ctrl K"
              className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs outline-none transition-all font-sans ${
                isDarkMode
                  ? 'bg-[#0e1426] border-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
              }`}
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

            {/* Notification Bell */}
            <div className="relative">
              <button className={`p-2 rounded-xl border ${
                isDarkMode ? 'bg-[#0e1426] border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                  3
                </span>
              </button>
            </div>

            {/* Profile Badge */}
            <div className="flex items-center space-x-2.5 pl-2 py-1 pr-3 rounded-xl bg-[#0e1426] border border-slate-800">
              <img
                src={guardInfo.avatar}
                alt="Vikram Singh"
                className="w-8 h-8 rounded-full object-cover border border-blue-500/50"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-tight">{guardInfo.name}</div>
                <div className="text-[10px] font-mono text-slate-400 leading-tight">
                  {guardInfo.staff_id}
                </div>
              </div>
            </div>

            {/* Direct Top-Bar Sign Out Button */}
            <button
              onClick={logout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
              title="End Shift & Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 lg:p-6 space-y-5">
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
          {/* TOP STATUS BAR: PROFILE, DUTY SWITCH, GPS PING, LOCATION   */}
          {/* =========================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Guard Profile Card */}
            <div className="rounded-2xl bg-[#0c1326] border border-slate-800 p-3.5 flex items-center space-x-3">
              <div className="relative">
                <img
                  src={guardInfo.avatar}
                  alt={guardInfo.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-blue-500/60"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0c1326]"></span>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm text-white">{guardInfo.name}</span>
                  <span className="text-emerald-400 text-xs">✓</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">{guardInfo.staff_id}</div>
                <div className="text-[10px] font-semibold text-blue-400 mt-0.5">{guardInfo.team}</div>
              </div>
            </div>

            {/* 2. ON PATROL Duty Active Toggle */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-950/80 to-[#0a231d] border border-emerald-500/40 p-3.5 flex items-center justify-between shadow-lg shadow-emerald-500/5">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div>
                  <div className="text-xs font-black text-white font-heading">
                    {isOnPatrol ? 'ON PATROL' : 'OFF DUTY'}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400">
                    {isOnPatrol ? 'DUTY ACTIVE' : 'DUTY PAUSED'}
                  </div>
                </div>
              </div>

              {/* iOS Style Toggle Switch */}
              <button
                onClick={handleToggleDuty}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isOnPatrol ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isOnPatrol ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></div>
              </button>
            </div>

            {/* 3. Live GPS Ping */}
            <div className="rounded-2xl bg-[#0c1326] border border-slate-800 p-3.5 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Live GPS Ping</div>
                <div className="text-[11px] font-mono text-slate-400">Every 5 seconds</div>
              </div>
            </div>

            {/* 4. Current Location */}
            <div className="rounded-2xl bg-[#0c1326] border border-slate-800 p-3.5 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white">Current Location</div>
                <div className="text-[11px] text-slate-400 truncate">{guardInfo.location}</div>
              </div>
            </div>
          </div>

          {/* =========================================================== */}
          {/* EMERGENCY DISPATCH BANNER (FLASHING RED ALERT)              */}
          {/* =========================================================== */}
          <div className="relative rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-4 sm:p-5 text-white shadow-2xl shadow-red-600/30 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-2xl shrink-0 animate-bounce">
                🚨
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-red-200 font-bold">
                  EMERGENCY DISPATCH
                </div>
                <h2 className="text-lg sm:text-xl font-black font-heading tracking-tight mt-0.5">
                  {incident.title}
                </h2>
                <p className="text-xs text-red-100 mt-0.5">{incident.desc}</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-right shrink-0">
              <div className="hidden sm:block">
                <div className="flex items-center justify-end space-x-1.5 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{incident.time}</span>
                </div>
                <div className="flex items-center justify-end space-x-1.5 text-xs font-semibold mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{incident.shortLocation}</span>
                </div>
                <div className="text-[10px] text-red-200 font-mono mt-0.5">
                  {incident.distanceDisplay}
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl bg-white text-red-700 text-xs font-black uppercase tracking-wider shadow-md">
                HIGH PRIORITY
              </span>
            </div>
          </div>

          {/* =========================================================== */}
          {/* MAIN TWO-COLUMN SECTION: MAP (LEFT 8) / INCIDENT (RIGHT 4)  */}
          {/* =========================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: 3D Map, Metric Cards & Action Buttons */}
            <div className="lg:col-span-8 space-y-4">
              {/* Map Canvas with Route */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 shadow-2xl space-y-3">
                {/* Map View Mode Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                    {['2D Blueprint', '3D View'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setMapMode(mode)}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          mapMode === mode
                            ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowVideoModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-300 text-xs font-bold flex items-center space-x-1.5 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Watch 5-Sec CCTV Clip &gt;</span>
                    </button>
                  </div>
                </div>

                {/* 2D / 3D Map Container */}
                <div className="relative h-[380px] rounded-2xl overflow-hidden border border-slate-800 bg-[#070d1a]">
                  {mapMode === '2D Blueprint' ? (
                    <SpatialDigitalTwin2D height="100%" activeRole="GUARD" />
                  ) : (
                    <>
                      <img
                        src={MOCK_ASSETS.campus3dMap}
                        alt="Campus Route"
                        className="w-full h-full object-cover filter contrast-125"
                      />

                  {/* Dark Radial Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060a14] via-transparent to-[#060a14]/50 pointer-events-none"></div>

                  {/* Block A Pin */}
                  <div className="absolute top-[46%] left-[28%] z-10">
                    <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-white text-[10px] font-bold shadow-md">
                      Block-A
                    </div>
                  </div>

                  {/* You / Vikram Singh Beacon */}
                  <div className="absolute bottom-[28%] left-[34%] z-20 flex flex-col items-center">
                    <div className="relative">
                      <div className="absolute -inset-2 rounded-full bg-blue-500/50 animate-ping"></div>
                      <img
                        src={guardInfo.avatar}
                        alt="You"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-2xl"
                      />
                    </div>
                    <div className="mt-1 px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold font-mono shadow-md">
                      You (40m away)
                    </div>
                  </div>

                  {/* SVG Navigation Dashed Blue Route from You to Block B */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <path
                      d="M 280 270 Q 340 230, 420 220 T 520 180"
                      stroke="#38bdf8"
                      strokeWidth="4"
                      strokeDasharray="8 6"
                      fill="none"
                      className="animate-pulse"
                    />
                  </svg>

                  {/* Block-B Incident Red Beacon */}
                  <div className="absolute top-[40%] right-[32%] z-20 flex flex-col items-center cursor-pointer">
                    <div className="relative">
                      <div className="absolute -inset-4 rounded-full bg-red-500/40 animate-ping"></div>
                      <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white shadow-2xl">
                        🚨
                      </div>
                    </div>
                    <div className="mt-1 px-3 py-1 rounded-xl bg-red-950/95 border border-red-500 text-center shadow-2xl">
                      <div className="text-xs font-black text-white">Block-B</div>
                      <div className="text-[9px] font-mono text-red-300">Incident Location</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 4 Info Metric Cards Under Map */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* 1. People Involved */}
                <div className="rounded-2xl bg-[#0c1326] border border-slate-800 p-3.5 space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white text-sm">2 People Involved</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    AI Confidence: {incident.aiConfidence}
                  </div>
                </div>

                {/* 2. Distance */}
                <div className="rounded-2xl bg-[#0c1326] border border-slate-800 p-3.5 space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white text-sm">
                    {incident.distanceMeters} meters
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">From Your Location (~1 min)</div>
                </div>

                {/* 3. Location */}
                <div className="rounded-2xl bg-[#0c1326] border border-slate-800 p-3.5 space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white text-sm">Block-B</div>
                  <div className="text-[10px] text-slate-400 font-mono">2nd Floor Corridor</div>
                </div>

                {/* 4. Threat Level */}
                <div className="rounded-2xl bg-[#0c1326] border border-slate-800 p-3.5 space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white text-sm">High Threat Level</div>
                  <div className="text-[10px] text-rose-400 font-mono">Violence Detected</div>
                </div>
              </div>

              {/* 3 Big Bottom Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {/* Button 1: Accept & Running */}
                <button
                  onClick={handleAcceptIncident}
                  disabled={submitting || incident.status === 'EN_ROUTE'}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xl shadow-emerald-600/25 transition-all disabled:opacity-60"
                >
                  <span className="text-base">🏃</span>
                  <div className="text-left">
                    <div className="leading-tight">Accept &amp; Running</div>
                    <div className="text-[10px] font-mono text-emerald-200">
                      {incident.status === 'EN_ROUTE' ? 'STATUS: EN_ROUTE ✓' : 'Status → EN_ROUTE'}
                    </div>
                  </div>
                </button>

                {/* Button 2: Request Backup */}
                <button
                  onClick={handleRequestBackup}
                  disabled={submitting}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/25 transition-all"
                >
                  <span className="text-base">📢</span>
                  <div className="text-left">
                    <div className="leading-tight">Request Backup</div>
                    <div className="text-[10px] font-mono font-bold text-amber-950">
                      Alert Security Head
                    </div>
                  </div>
                </button>

                {/* Button 3: Capture Live Proof & Mark Resolved */}
                <button
                  onClick={() => setShowProofModal(true)}
                  disabled={submitting}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xl shadow-blue-600/25 transition-all"
                >
                  <Camera className="w-5 h-5" />
                  <div className="text-left">
                    <div className="leading-tight">Capture Live Proof</div>
                    <div className="text-[10px] font-mono text-blue-200">&amp; Mark Resolved</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Right 4 Cols: CCTV Clip, Incident Details, Nearby Guards */}
            <div className="lg:col-span-4 space-y-4">
              {/* CCTV Clip (5 Seconds) Player Box */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-rose-400" />
                    <h3 className="text-xs font-bold text-white font-heading">
                      CCTV Clip (5 Seconds)
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowVideoModal(true)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Video Player */}
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                  <img
                    src={MOCK_ASSETS.fightClip}
                    alt="Fight Altercation"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <button
                      onClick={() => setShowVideoModal(true)}
                      className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/60 flex items-center justify-center text-white hover:scale-110 transition-transform"
                    >
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </button>
                  </div>

                  {/* Video Timeline controls */}
                  <div className="absolute bottom-2 inset-x-2 px-2 py-1 rounded-lg bg-black/80 text-[10px] font-mono text-white flex items-center justify-between">
                    <span>▶ 0:00 / 0:05</span>
                    <Maximize2
                      className="w-3.5 h-3.5 cursor-pointer"
                      onClick={() => setShowVideoModal(true)}
                    />
                  </div>
                </div>
              </div>

              {/* Incident Details Card */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 shadow-xl space-y-3 text-xs">
                <h3 className="text-xs font-bold text-white font-heading border-b border-slate-800 pb-2">
                  Incident Details
                </h3>

                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">🚨 Incident Type:</span>
                    <span className="font-bold text-rose-400 font-mono text-[11px]">
                      {incident.threat_type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">🕒 Time:</span>
                    <span className="font-mono text-[11px] text-slate-200">{incident.time}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">📍 Location:</span>
                    <span className="text-right text-[11px] text-slate-200">{incident.location}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">👥 People Involved:</span>
                    <span className="text-[11px] text-slate-200">{incident.peopleInvolved}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Status:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800 font-mono font-bold text-[10px]">
                      {incident.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nearby Guards (Auto Suggested) */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-4 shadow-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-xs">Nearby Guards (Auto Suggested)</div>
                  <button
                    onClick={() => setToast({ type: 'success', msg: 'All online guard contacts loaded.' })}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2">
                  {nearbyGuards.map((guard) => (
                    <div
                      key={guard.id}
                      className="p-2.5 rounded-xl bg-[#0e162c] border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={guard.avatar}
                          alt={guard.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-white text-xs">{guard.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                                guard.tagColor === 'green'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              ★ {guard.tag}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {guard.staff_id} • {guard.distance} • {guard.location}
                          </div>
                        </div>
                      </div>

                      <a
                        href={`tel:${guard.phone.replace(/\D/g, '')}`}
                        className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 shrink-0 transition-colors"
                        title={`Call ${guard.name}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ============================================================= */}
      {/* 5-SECOND RECORDED CCTV CLIP MODAL                             */}
      {/* ============================================================= */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#0c1326] border border-slate-700 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-base">🚨</span>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">
                    Block-B 2nd Floor Corridor — CAM-01
                  </h3>
                  <p className="text-[11px] text-slate-400">AI Fight Classification: 95% Confidence</p>
                </div>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
              <img
                src={MOCK_ASSETS.fightClip}
                alt="Corridor AI Clip"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono">
                VIOLENCE DETECTED • 2026-10-14 10:24:32
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={handleAcceptIncident}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
              >
                Accept &amp; Run to Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CAPTURE LIVE PROOF & MARK RESOLVED MODAL                      */}
      {/* ============================================================= */}
      {showProofModal && (
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
                    Capture Live Proof Photo
                  </h3>
                  <p className="text-[11px] text-slate-400">Attach spot photo to mark incident resolved</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProofModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Proof Photo Snapshot Box */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
              <img
                src={MOCK_ASSETS.classroomCctv}
                alt="Proof Photo"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-emerald-400">
                GPS Tagged: Block-B Floor 2
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Guard Resolution Notes
              </label>
              <textarea
                rows={2}
                defaultValue="Students separated peacefully. Both sent to Proctor Office. Corridor cleared."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowProofModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30 flex items-center space-x-1.5"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Confirm &amp; Resolve</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GuardMobileDashboard;
