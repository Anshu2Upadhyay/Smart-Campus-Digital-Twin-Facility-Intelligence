import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import axiosClient from '../api/axiosClient';
import {
  Radio,
  Sliders,
  Users,
  ClipboardCheck,
  Layers,
  Bot,
  Search,
  Sun,
  Moon,
  Bell,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Shield,
  Zap,
  Building,
  LayoutDashboard,
  Cpu,
  ClipboardList,
  Map as MapIcon,
} from 'lucide-react';

export const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications = [], unreadCount = 0, markNotificationsRead } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDarkMode, toggleTheme } = useTheme();

  // CampusGPT Modal State
  const [isGptOpen, setIsGptOpen] = useState(false);
  const [gptPrompt, setGptPrompt] = useState('');
  const [gptLoading, setGptLoading] = useState(false);
  const [gptMessages, setGptMessages] = useState([
    {
      role: 'assistant',
      text: "Hello Super Admin! I'm CampusGPT. Ask me anything about campus blocks, rooms, virtual load calculations, staff deployment, or CCTV configurations.",
      timestamp: 'Just now',
    },
  ]);

  // Handle Ctrl+K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAskCampusGpt = async (e) => {
    if (e) e.preventDefault();
    if (!gptPrompt.trim() || gptLoading) return;

    const userMsg = {
      role: 'user',
      text: gptPrompt.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setGptMessages((prev) => [...prev, userMsg]);
    const currentQ = gptPrompt.trim();
    setGptPrompt('');
    setGptLoading(true);

    try {
      const res = await axiosClient.post('/campusgpt/ask', { question: currentQ }).catch(() => null);
      const replyText =
        res?.data?.answer ||
        res?.data?.reply ||
        res?.data?.response ||
        `Based on current Digital Twin metrics, campus active load is 142 kW, Safety Score is 96%, and all CCTV RTSP streams in Block-B Floor 2 are operating normally.`;

      setGptMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setGptMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Block-B Room 204 has an active virtual load of 3.54 kW and CCTV camera 'B-204-Classroom' is streaming on rtsp://192.168.1.100:554/stream1.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setGptLoading(false);
    }
  };

  const navLinks = [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/admin/map-engine',
      label: 'Campus Map Builder',
      icon: MapIcon,
    },
    {
      to: '/admin/setup',
      label: 'Buildings & Rooms',
      icon: Building,
    },
    {
      to: '/admin/cctv',
      label: 'Assets & Devices',
      icon: Cpu,
    },
    {
      to: '/facility-head/workorders',
      label: 'Work Orders',
      icon: ClipboardList,
    },
    {
      to: '/facility-head/energy',
      label: 'Energy Monitoring',
      icon: Zap,
    },
    {
      to: '/admin/manage-heads',
      label: 'Users & Staff',
      icon: Users,
    },
    {
      to: '/security-head/incidents',
      label: 'Incidents & Safety',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col antialiased transition-colors duration-200 ${
      isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      <div className="flex flex-1 overflow-hidden">
        {/* ============================================================= */}
        {/* LEFT SIDEBAR (EXACT MATCH TO REFERENCE DESIGN)               */}
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
              {/* Emblem Shield Badge */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 via-indigo-600/30 to-purple-600/40 p-0.5 border border-amber-400/40 shadow-lg shadow-purple-500/10 flex items-center justify-center">
                <div className={`w-full h-full rounded-[10px] flex items-center justify-center text-amber-300 ${
                  isDarkMode ? 'bg-[#0c1222]' : 'bg-slate-900'
                }`}>
                  <GraduationCap className="w-5 h-5 text-amber-300" />
                </div>
              </div>
              <div>
                <h1 className={`text-sm font-black font-heading tracking-tight leading-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Smart Campus
                </h1>
                <p className="text-[11px] font-semibold text-blue-400 tracking-wide">
                  Super Admin
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
            {/* Primary Operations Nav */}
            <div className="space-y-1.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group relative flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 font-bold border border-blue-400/30'
                        : isDarkMode
                          ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? 'text-white'
                          : isDarkMode
                            ? 'text-slate-400 group-hover:text-cyan-400'
                            : 'text-slate-500 group-hover:text-cyan-600'
                      }`}
                    />
                    <div className="flex-1 truncate">
                      <div className="leading-snug">{item.label}</div>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Bottom CampusGPT Admin Assistant Card */}
          <div className={`p-3 border-t ${
            isDarkMode ? 'border-slate-800/70' : 'border-slate-200'
          }`}>
            <div className={`relative overflow-hidden rounded-2xl border p-3.5 space-y-2.5 shadow-xl ${
              isDarkMode
                ? 'bg-gradient-to-b from-[#131b31] to-[#0c1324] border-blue-500/20 shadow-blue-500/5'
                : 'bg-gradient-to-b from-blue-50/80 to-indigo-50/50 border-blue-200 text-slate-800 shadow-blue-500/5'
            }`}>
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-md ${
                  isDarkMode
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 shadow-blue-500/10'
                    : 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                }`}>
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold font-heading ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>CampusGPT</h4>
                  <p className={`text-[10px] ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>Admin Assistant</p>
                </div>
              </div>

              <p className={`text-[10px] leading-tight ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Let AI help you configure blocks, rooms, cameras and more.
              </p>

              <button
                onClick={() => setIsGptOpen(true)}
                className={`w-full py-1.5 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
                  isDarkMode
                    ? 'bg-blue-600/30 hover:bg-blue-600/50 border-blue-500/40 text-blue-300'
                    : 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white'
                }`}
              >
                <span>Open CampusGPT</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* ============================================================= */}
        {/* MAIN CONTENT AREA                                            */}
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

              {/* Global Search Input with Ctrl+K shortcut badge */}
              <div className="relative w-full">
                <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`} />
                <input
                  id="global-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search blocks, rooms, devices, staff..."
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
              {/* Dark / Light Mode Toggle */}
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

              {/* Notifications Bell with Counter Badge */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) markNotificationsRead();
                  }}
                  className={`relative p-2 rounded-xl border transition-colors ${
                    isDarkMode
                      ? 'bg-[#0e1426] hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse shadow-sm shadow-rose-500/50">
                    {unreadCount > 0 ? unreadCount : 3}
                  </span>
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl p-3 z-50 text-xs space-y-2 ${
                    isDarkMode ? 'bg-[#0d1428] border-slate-700/90 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <div className={`flex items-center justify-between pb-2 border-b ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-200'
                    }`}>
                      <div className="flex items-center space-x-2 font-bold">
                        <Radio className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                        <span>Live Notification Stream</span>
                      </div>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2">
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-rose-500">
                          <span>🚨 SOS TRIGGERED</span>
                          <span className="text-slate-400">2 min ago</span>
                        </div>
                        <p className="text-[11px]">
                          Emergency SOS triggered in Block-B Floor 2 (Room 204).
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-purple-500">
                          <span>⚔️ FIGHT DETECTED</span>
                          <span className="text-slate-400">5 min ago</span>
                        </div>
                        <p className="text-[11px]">
                          AI Vision detected violent gathering in Block-B corridor.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Badge (SA Super Admin) */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center space-x-2.5 pl-2 py-1 pr-3 rounded-xl border transition-colors text-left ${
                    isDarkMode
                      ? 'bg-[#0e1426] hover:bg-slate-800 border-slate-800'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold font-heading text-xs flex items-center justify-center border border-blue-400/40 shadow-sm shadow-blue-500/20">
                    SA
                  </div>
                  <div className="hidden sm:block">
                    <div className={`text-xs font-bold leading-tight ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {user?.name || 'Super Admin'}
                    </div>
                    <div className={`text-[10px] leading-tight ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      System Administrator
                    </div>
                  </div>
                </button>

                {/* Profile Popup */}
                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl p-2 z-50 text-xs space-y-1 ${
                    isDarkMode ? 'bg-[#0d1428] border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 shadow-xl text-slate-800'
                  }`}>
                    <div className={`p-2 border-b ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-100'
                    }`}>
                      <div className="font-bold">{user?.name || 'Super Admin'}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {user?.email || 'admin@campus.edu'}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/admin/map-engine');
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                        isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Campus Map Engine
                    </button>
                    <button
                      onClick={() => {
                        navigate('/admin/manage-heads');
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                        isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      User Management
                    </button>
                  </div>
                )}
              </div>

              {/* The ONLY Sign Out Button (Prominent & Single Location) */}
              <button
                onClick={logout}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-600/15 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                title="Sign Out of Admin Console"
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

      {/* ============================================================= */}
      {/* CAMPUSGPT DIALOG MODAL                                        */}
      {/* ============================================================= */}
      {isGptOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#0c1326] border border-blue-500/40 shadow-2xl overflow-hidden flex flex-col h-[520px]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-[#0e162e] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-1.5 font-heading">
                    <span>CampusGPT AI Admin Copilot</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono">
                      v2.4
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Autonomous RAG Knowledge Assistant</p>
                </div>
              </div>

              <button
                onClick={() => setIsGptOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {gptMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 rounded-br-none'
                        : 'bg-[#121c38] border border-slate-700/70 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div
                      className={`text-[9px] mt-1 text-right font-mono ${
                        msg.role === 'user' ? 'text-blue-200/80' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              {gptLoading && (
                <div className="flex items-center space-x-2 text-xs text-blue-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>CampusGPT is querying campus knowledge base...</span>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 bg-[#090e1f] border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[10px]">
              {[
                'How to provision Block-B Room 204?',
                'What is the campus active power load?',
                'Show pending security tickets',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setGptPrompt(chip);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleAskCampusGpt}
              className="p-3 bg-[#0d152a] border-t border-slate-800 flex items-center space-x-2"
            >
              <input
                type="text"
                value={gptPrompt}
                onChange={(e) => setGptPrompt(e.target.value)}
                placeholder="Ask CampusGPT about rooms, meters, staff, rules..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#080d1a] border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 font-sans"
              />
              <button
                type="submit"
                disabled={gptLoading || !gptPrompt.trim()}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-all shadow-md shadow-blue-600/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
