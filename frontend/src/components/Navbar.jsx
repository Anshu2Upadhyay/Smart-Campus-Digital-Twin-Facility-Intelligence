import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Zap,
  LogOut,
  MapPin,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle2,
  AlertTriangle,
  X,
  Info,
} from 'lucide-react';
import {
  isAudioMuted,
  toggleAudioMute,
} from '../utils/soundEffects';

export const Navbar = () => {
  const { user, role, logout } = useAuth();
  const { connected, notifications, unreadCount, clearNotifications, markNotificationsRead } = useSocket();
  const [muted, setMuted] = useState(isAudioMuted());
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const handleToggleSound = () => {
    const newState = toggleAudioMute();
    setMuted(newState);
  };

  const getRoleBadgeStyle = (userRole) => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60 shadow-purple-500/10';
      case 'SECURITY_HEAD':
        return 'bg-red-950/80 text-red-300 border-red-700/60 shadow-red-500/10';
      case 'SECURITY_GUARD':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60 shadow-blue-500/10';
      case 'FACILITY_SUPERVISOR':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 shadow-emerald-500/10';
      case 'GROUND_WORKER':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60 shadow-amber-500/10';
      case 'STUDENT_FACULTY':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60 shadow-cyan-500/10';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const currentZone = user?.current_block
    ? `${user.current_block}${user.current_floor ? ` • Floor ${user.current_floor}` : ''}`
    : null;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Digital Twin Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-400 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base lg:text-lg font-black font-heading tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Smart Campus
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-sm shadow-cyan-500/10">
                Digital Twin
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">AI Command Center & Facility Intelligence</p>
          </div>
        </div>

        {/* Right Section: GPS Zone, WebSocket Status, Audio Siren, Notifications, Profile & Logout */}
        {user && (
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            {/* Live GPS Zone Badge (Field Personnel) */}
            {currentZone && (
              <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-mono shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>{currentZone}</span>
              </div>
            )}

            {/* WebSocket Telemetry Status */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  connected
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse'
                    : 'bg-red-500 animate-ping'
                }`}
              ></span>
              <span className={`text-[10px] font-bold hidden sm:inline ${connected ? 'text-emerald-300' : 'text-red-400'}`}>
                {connected ? 'WS LIVE' : 'WS RECONNECTING'}
              </span>
            </div>

            {/* Audio Siren Mute / Unmute Button */}
            <button
              onClick={handleToggleSound}
              title={muted ? 'Unmute Acoustic Alarms' : 'Mute Acoustic Alarms'}
              className={`p-2 rounded-xl border transition-all ${
                muted
                  ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  : 'bg-cyan-950/60 border-cyan-800/60 text-cyan-400 hover:bg-cyan-900/60 shadow-sm shadow-cyan-500/10'
              }`}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Real-Time Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  if (!showNotifDropdown) markNotificationsRead();
                }}
                title="Notifications"
                className="relative p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel-glow rounded-2xl shadow-2xl p-3 border border-slate-700/80 z-[100] text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                      <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      <span>Live Command Feed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={clearNotifications}
                        className="text-[10px] text-slate-400 hover:text-slate-200"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowNotifDropdown(false)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 py-2">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-slate-500">
                        <CheckCircle2 className="w-7 h-7 mx-auto mb-1 text-slate-600" />
                        No unread command notifications
                      </div>
                    ) : (
                      notifications.slice(0, 15).map((n) => (
                        <div
                          key={n.id}
                          className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[10px] text-cyan-400">
                              {n.type?.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[9px] text-slate-500">{n.timestamp}</span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-tight">
                            {n.data?.title || n.data?.message || n.data?.description || JSON.stringify(n.data).slice(0, 80)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Role Badge */}
            <div className="flex items-center space-x-2.5 pl-1 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {user.staff_id || user.roll_or_emp_id || user.email}
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${getRoleBadgeStyle(role)}`}>
                {role?.replace('_', ' ')}
              </span>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
