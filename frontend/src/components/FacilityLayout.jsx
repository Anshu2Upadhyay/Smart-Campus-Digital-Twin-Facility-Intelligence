import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axiosClient from '../api/axiosClient';
import {
  Building,
  Users,
  Grid,
  ClipboardCheck,
  Zap,
  Video,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Layers,
  Radio,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const FacilityLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications = [], unreadCount = 0, markNotificationsRead } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const { isDarkMode, toggleTheme } = useTheme();

  const navLinks = [
    {
      to: '/facility-head/console',
      label: 'Live Workforce',
      sub: '6 Department Matrix',
      icon: Users,
    },
    {
      to: '/facility-head/floor-grid',
      label: 'Building & Rooms',
      sub: 'Interactive Floor Status',
      icon: Building,
    },
    {
      to: '/facility-head/workorders',
      label: 'Workorders',
      sub: 'SLA Escalations & Dispatch',
      icon: ClipboardCheck,
      badge: '2',
    },
    {
      to: '/facility-head/energy',
      label: 'Energy Monitoring',
      sub: 'Ghost Load & Power AI',
      icon: Activity,
    },
    {
      to: '/facility-head/cctv-verify',
      label: 'CCTV Verification',
      sub: 'Appliance Visual Proof',
      icon: Video,
    },
  ];

  const handleSimulateGhostDrain = async () => {
    try {
      await axiosClient.post('/facility/simulate-ghost-energy', {
        block_name: 'Block-B',
        room_number: 'Room 204',
        floor_number: 2,
        wasted_kw: 3.54,
        category: 'HVAC_AC',
      }).catch(() => null);

      setToast({
        type: 'warning',
        msg: '⚡ 3.54 kW Ghost Energy alert broadcasted to Block-B Room 204.',
      });
      setTimeout(() => setToast(null), 5000);
    } catch {
      setToast({
        type: 'warning',
        msg: '⚡ Ghost Energy simulation active for Room 204.',
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f1f5f9] text-slate-800'} flex flex-col antialiased`}>
      {/* Toast Feedback */}
      {toast && (
        <div className="bg-amber-500 text-slate-950 font-black text-xs px-4 py-2 text-center animate-fade-in flex items-center justify-center space-x-2 shadow-lg z-50">
          <AlertTriangle className="w-4 h-4" />
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ============================================================= */}
        {/* LEFT SIDEBAR (Dark Navy #0a1128)                             */}
        {/* ============================================================= */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a1128] text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-md">
                <div className="w-full h-full bg-[#0a1128] rounded-[10px] flex items-center justify-center">
                  <Building className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="font-bold text-white text-sm leading-tight">Smart Campus</div>
                <div className="text-[11px] text-amber-400/90 font-semibold tracking-wide">
                  Facility Supervisor
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Scroll Container */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider px-3 mb-2 font-bold">
                Facility Modules
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
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold border border-blue-400/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-amber-400'
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
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-sm shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Bottom Fast Action & Ghost Simulation */}
          <div className="p-3 border-t border-slate-800/80 space-y-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-1 font-bold">
              Energy Auto-Pilot
            </div>

            <button
              onClick={handleSimulateGhostDrain}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center space-x-2 transition-all shadow-md shadow-amber-500/20"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Simulate Ghost Load (3.54 kW)</span>
            </button>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>60s AUTO-PILOT</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>ONLINE & ACTIVE</span>
              </span>
            </div>
          </div>
        </aside>

        {/* ============================================================= */}
        {/* MAIN FACILITY CONTENT VIEW                                   */}
        {/* ============================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header Bar */}
          <header className={`sticky top-0 z-40 ${isDarkMode ? 'bg-[#090d1a]/95 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800 shadow-sm'} backdrop-blur-md border-b px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4 transition-colors duration-200`}>
            {/* Left Hamburger & Search */}
            <div className="flex items-center space-x-3 flex-1 max-w-xl">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workorders, rooms, technicians, electrical load..."
                  className={`w-full pl-10 pr-16 py-2 rounded-xl border text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-sans ${
                    isDarkMode
                      ? 'bg-[#0e1426] border-slate-800 text-slate-100 placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-slate-400 border border-slate-200 pointer-events-none">
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

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) markNotificationsRead();
                  }}
                  className={`relative p-2 rounded-xl transition-colors border ${
                    isDarkMode
                      ? 'bg-[#0e1426] hover:bg-slate-800 text-slate-300 border-slate-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-mono text-[9px] font-black flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 text-xs space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2 font-bold text-slate-800">
                        <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                        <span>Facility Maintenance Feed</span>
                      </div>
                      <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-700 text-xs">
                        ✕
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2">
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-700">
                          <span>⚡ 3.54 kW GHOST DRAIN</span>
                          <span className="text-slate-500">2 min ago</span>
                        </div>
                        <p className="text-slate-700 text-[11px]">
                          Block-B Room 204: AC left ON with 0 occupants detected. Auto-turnoff sequence initiated.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-blue-700">
                          <span>🛠️ TICKET DISPATCHED</span>
                          <span className="text-slate-500">5 min ago</span>
                        </div>
                        <p className="text-slate-700 text-[11px]">
                          Ramesh Kumar (WRK-201) dispatched to Room 204 for AC thermal sensor check.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Facility Supervisor Profile Badge */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center space-x-2.5 pl-2 py-1 pr-3 rounded-xl transition-colors text-left border ${
                    isDarkMode
                      ? 'bg-[#0e1426] hover:bg-slate-800 text-slate-100 border-slate-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black font-heading text-xs flex items-center justify-center shadow-sm">
                    FS
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {user?.name || 'Facility Supervisor'}
                    </div>
                    <div className="text-[10px] text-amber-600 font-semibold leading-tight">
                      Operations In-Charge
                    </div>
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 text-xs space-y-1">
                    <div className="p-2 border-b border-slate-100">
                      <div className="font-bold text-slate-800">{user?.name || 'Facility Supervisor'}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {user?.staff_id || user?.email || 'facility.head@campus.edu'}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/facility-head/workorders');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Active Workorders
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Top-Bar Sign Out Button */}
              <button
                onClick={logout}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 border border-rose-200 text-rose-600 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                title="Sign Out of Facility Console"
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

export default FacilityLayout;
