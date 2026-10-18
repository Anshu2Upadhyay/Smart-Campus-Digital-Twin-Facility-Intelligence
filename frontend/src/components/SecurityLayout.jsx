import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { playEmergencySiren, isAudioMuted, toggleAudioMute } from '../utils/soundEffects';
import {
  Shield,
  Video,
  Users,
  MapPin,
  AlertTriangle,
  Radio,
  Search,
  Bell,
  LogOut,
  Volume2,
  VolumeX,
  Menu,
  X,
  ChevronRight,
  Flame,
  CheckCircle2,
  Compass,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const SecurityLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications = [], unreadCount = 0, markNotificationsRead, connected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [muted, setMuted] = useState(isAudioMuted());
  const [alertFeedback, setAlertFeedback] = useState(null);
  const { isDarkMode, toggleTheme } = useTheme();

  const handleToggleSound = () => {
    const newState = toggleAudioMute();
    setMuted(newState);
  };

  const handleTriggerSiren = () => {
    playEmergencySiren();
    setAlertFeedback('🚨 CAMPUS EMERGENCY BROADCAST: High-priority acoustic siren & guard mobilization active!');
    setTimeout(() => setAlertFeedback(null), 6000);
  };

  const navLinks = [
    {
      to: '/security-head/console',
      label: 'Live Console',
      sub: 'SOC Threat Matrix',
      icon: Radio,
    },
    {
      to: '/security-head/cctv',
      label: 'CCTV Monitoring',
      sub: 'Multi-Camera AI Grid',
      icon: Video,
    },
    {
      to: '/security-head/guards',
      label: 'Guard Management',
      sub: 'Roster & Gate Allocation',
      icon: Users,
    },
    {
      to: '/security-head/gps-radar',
      label: 'Live GPS Tracking',
      sub: 'Real-Time Patrol Radar',
      icon: MapPin,
    },
    {
      to: '/security-head/incidents',
      label: 'Incidents & SOS',
      sub: 'Emergency Logs & Audit',
      icon: AlertTriangle,
      badge: '3',
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col antialiased transition-colors duration-200 ${
      isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Alert Banner */}
      {alertFeedback && (
        <div className="bg-rose-600 text-white font-bold text-xs px-4 py-2 text-center animate-pulse flex items-center justify-center space-x-2 shadow-lg z-50">
          <span>{alertFeedback}</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ============================================================= */}
        {/* LEFT SIDEBAR: SECURITY SOC HEAD                              */}
        {/* ============================================================= */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 border-r flex flex-col justify-between transition-all duration-300 lg:static lg:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } ${
            isDarkMode ? 'bg-[#0a0f1d] border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          {/* Top Brand Logo Section */}
          <div className={`p-4 border-b flex items-center justify-between ${
            isDarkMode ? 'border-slate-800/70' : 'border-slate-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 via-blue-600/30 to-indigo-600/40 p-0.5 border border-amber-400/40 shadow-lg flex items-center justify-center">
                <div className={`w-full h-full rounded-[10px] flex items-center justify-center text-amber-300 ${
                  isDarkMode ? 'bg-[#0c1222]' : 'bg-slate-900'
                }`}>
                  <Shield className="w-5 h-5 text-amber-300" />
                </div>
              </div>
              <div>
                <h1 className={`text-sm font-black font-heading tracking-tight leading-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Smart Campus
                </h1>
                <p className="text-[11px] font-semibold text-blue-500 tracking-wide">
                  Security SOC Head
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className={`lg:hidden p-1.5 rounded-lg ${
                isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Scroll Container */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider px-3 mb-2 font-bold">
                SOC Core Modules
              </div>
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 font-bold border border-blue-400/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                        }`}
                      />
                      <div className="truncate">
                        <div className="leading-snug">{item.label}</div>
                        <div
                          className={`text-[9px] font-mono leading-none mt-0.5 ${
                            isActive ? 'text-blue-100/80' : 'text-slate-500'
                          }`}
                        >
                          {item.sub}
                        </div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Bottom Security Emergency Controls */}
          <div className="p-3 border-t border-slate-800/80 space-y-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-1 font-bold">
              SOC Quick Actions
            </div>

            <button
              onClick={handleTriggerSiren}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-rose-600/30"
            >
              <Flame className="w-4 h-4 animate-bounce" />
              <span>Broadcast Campus Siren</span>
            </button>

            <button
              onClick={() => {
                setAlertFeedback('📢 Mobilization order transmitted to all active duty guards.');
                setTimeout(() => setAlertFeedback(null), 4000);
              }}
              className="w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Mobilize All Guards</span>
            </button>

            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>DEFCON STATUS</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>LEVEL 1 SECURE</span>
              </span>
            </div>
          </div>
        </aside>

        {/* ============================================================= */}
        {/* MAIN SOC CONTENT VIEW                                        */}
        {/* ============================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header Bar */}
          <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4 transition-colors duration-200 ${
            isDarkMode ? 'bg-[#090d1a]/95 border-slate-800/80' : 'bg-white/95 border-slate-200 shadow-sm'
          }`}>
            {/* Left Hamburger & Search */}
            <div className="flex items-center space-x-3 flex-1 max-w-xl">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden p-2 rounded-xl border ${
                  isDarkMode ? 'text-slate-400 hover:text-white bg-slate-900 border-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200'
                }`}
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="relative w-full">
                <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cameras, guards, incident codes, gates..."
                  className={`w-full pl-10 pr-16 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-blue-500/20 transition-all font-sans ${
                    isDarkMode
                      ? 'bg-[#0e1426] border-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500/70'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                  }`}
                />
                <kbd className={`absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border pointer-events-none ${
                  isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700/60' : 'bg-white text-slate-500 border-slate-200'
                }`}>
                  Ctrl K
                </kbd>
              </div>
            </div>

            {/* Right Quick Controls */}
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

              {/* Audio Alarm Toggle */}
              <button
                onClick={handleToggleSound}
                title={muted ? 'Unmute Security Sirens' : 'Mute Security Sirens'}
                className={`p-2 rounded-xl border transition-colors ${
                  isDarkMode
                    ? 'bg-[#0e1426] hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-blue-400'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-blue-600'
                }`}
              >
                {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
              </button>

              {/* WebSocket Telemetry Status */}
              <div className={`hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[10px] font-mono ${
                isDarkMode ? 'bg-[#0e1426] border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
                <span className={connected ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                  {connected ? 'SOC TELEMETRY LIVE' : 'WS RECONNECT'}
                </span>
              </div>

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) markNotificationsRead();
                  }}
                  className="relative p-2 rounded-xl bg-[#0e1426] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0d1428] border border-slate-700/90 shadow-2xl p-3 z-50 text-xs space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center space-x-2 font-bold text-slate-200">
                        <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                        <span>Security Incidents Stream</span>
                      </div>
                      <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white text-xs">
                        ✕
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2">
                      <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-rose-400">
                          <span>🚨 VIOLENCE_FIGHT DETECTED</span>
                          <span className="text-slate-400">Just now</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          Block-B Corridor CAM-01: AI Vision detected physical altercation. Guard SEC-101 dispatched.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-400">
                          <span>⚠️ OVERCROWDING ALERT</span>
                          <span className="text-slate-400">4 min ago</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          Gate-1 Main Entry CAM-02: Crowd density exceeded 80 persons/sqm threshold.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Head Profile Badge */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2.5 pl-2 py-1 pr-3 rounded-xl bg-[#0e1426] hover:bg-slate-800 border border-slate-800 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold font-heading text-xs flex items-center justify-center border border-blue-400/40 shadow-sm shadow-blue-500/20">
                    SH
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-white leading-tight">
                      {user?.name || 'Security Head'}
                    </div>
                    <div className="text-[10px] text-blue-400 leading-tight">
                      SOC Commander
                    </div>
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0d1428] border border-slate-700/80 shadow-2xl p-2 z-50 text-xs space-y-1">
                    <div className="p-2 border-b border-slate-800">
                      <div className="font-bold text-white">{user?.name || 'Security Head'}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {user?.staff_id || user?.email || 'sec.head@campus.edu'}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/security-head/guards');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      Manage Guard Roster
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Top-Bar Sign Out Button */}
              <button
                onClick={logout}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                title="Sign Out of Security Console"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </header>

          {/* Main Content Body */}
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default SecurityLayout;
