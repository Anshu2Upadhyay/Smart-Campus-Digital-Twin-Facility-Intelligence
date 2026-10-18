import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MOCK_ASSETS from '../utils/mockAssets';
import {
  GraduationCap,
  Shield,
  Zap,
  Radio,
  Users,
  Building,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Smartphone,
  Rocket,
  Check,
  Send,
  FileText,
  Clock,
  Wrench,
  Search,
  Bot,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export const LandingPage = () => {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-gradient-to-br from-indigo-200/40 via-sky-200/30 to-purple-200/20 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-[500px] h-[450px] bg-gradient-to-bl from-teal-100/40 via-emerald-100/30 to-sky-100/20 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* ============================================================= */}
      {/* 1. TOP NAVBAR                                                 */}
      {/* ============================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Crest */}
          <Link to="/" className="flex items-center space-x-3 group shrink-0">
            {/* University Crest Ornate Emblem */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] p-0.5 shadow-md flex items-center justify-center border border-amber-400/50">
              <div className="w-full h-full rounded-full border border-amber-400/30 flex items-center justify-center text-amber-300">
                <Building className="w-5 h-5 text-amber-300 group-hover:scale-105 transition-transform" />
              </div>
            </div>
            <div>
              <div className="text-base font-extrabold font-heading text-[#1e1b4b] tracking-tight leading-tight">
                Smart Campus
              </div>
              <div className="text-[11px] font-semibold text-slate-500 tracking-wide">
                Digital Twin
              </div>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold">
            {['Home', 'Features', 'About', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setActiveTab(item)}
                className={`relative py-1 transition-colors ${
                  activeTab === item
                    ? 'text-[#1e1b4b] font-bold'
                    : 'text-slate-600 hover:text-[#1e1b4b]'
                }`}
              >
                <span>{item}</span>
                {activeTab === item && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#3b82f6] rounded-full" />
                )}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            {/* Official Portal Login */}
            <Link
              to="/login"
              className="py-2.5 px-4 sm:px-5 rounded-full bg-gradient-to-r from-[#6366f1] via-[#4f46e5] to-[#2563eb] hover:from-[#4f46e5] hover:to-[#1d4ed8] text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-indigo-500/25 transition-all active:scale-95"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Official Portal Login</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>

            {/* Staff Quick PIN */}
            <Link
              to="/staff-login"
              className="py-2.5 px-4 sm:px-5 rounded-full bg-[#064e3b] hover:bg-[#065f46] text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-emerald-950/20 transition-all active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
              <span>Staff Quick PIN</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================= */}
      {/* 2. HERO SECTION (2-COLUMN MATCHING MOCKUP)                    */}
      {/* ============================================================= */}
      <section id="home" className="pt-8 sm:pt-12 pb-16 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Headlines & Stats */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#e0f2fe] border border-[#bae6fd] text-[#0369a1] text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>100% Software Intelligence • Live Campus Ecosystem</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black font-heading text-[#0f172a] tracking-tight leading-[1.12]">
              Next-Gen <br />
              <span className="bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#06b6d4] bg-clip-text text-transparent">
                Smart Campus
              </span>{' '}
              <br />
              Safety, Energy &amp; <br />
              Student Experience.
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
              A unified digital twin platform for safer campuses, smarter operations, greener
              facilities and a better student experience powered by AI, real-time data and campus
              intelligence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/campus/portal"
                className="py-3.5 px-6 rounded-full bg-gradient-to-r from-[#6366f1] via-[#4f46e5] to-[#2563eb] hover:from-[#4f46e5] hover:to-[#1d4ed8] text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-95"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Explore Student &amp; Faculty Portal</span>
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                to="/staff-login"
                className="py-3.5 px-6 rounded-full bg-[#ecfdf5] hover:bg-[#d1fae5] border border-emerald-200/90 text-[#065f46] font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-sm transition-all hover:scale-[1.02] active:scale-95"
              >
                <Users className="w-4 h-4 text-[#059669]" />
                <span>Staff Quick Access</span>
                <ChevronRight className="w-4 h-4 text-[#059669]" />
              </Link>
            </div>

            {/* 4 Stat Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-3">
              {/* Stat 1 */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">1</div>
                  <div className="text-[11px] font-bold text-slate-700 leading-tight">Campus</div>
                  <div className="text-[9px] text-slate-500 leading-tight">Digitally Connected</div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">10K+</div>
                  <div className="text-[11px] font-bold text-slate-700 leading-tight">Students</div>
                  <div className="text-[9px] text-slate-500 leading-tight">Better Experience</div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">30%</div>
                  <div className="text-[11px] font-bold text-slate-700 leading-tight">Energy Saving</div>
                  <div className="text-[9px] text-slate-500 leading-tight">with Smart AI</div>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">24/7</div>
                  <div className="text-[11px] font-bold text-slate-700 leading-tight">Campus Safety</div>
                  <div className="text-[9px] text-slate-500 leading-tight">Always On</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Isometric Map Visual Container */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            {/* Decorative Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 via-indigo-400/20 to-purple-400/20 blur-3xl rounded-full -z-10" />

            {/* Isometric Campus Card */}
            <div className="w-full relative rounded-3xl bg-gradient-to-b from-white to-slate-100 border border-slate-200/90 shadow-2xl overflow-hidden p-3 sm:p-4">
              {/* Top Floating Badge 1: One-Tap SOS Active (Red) */}
              <div className="absolute top-5 left-5 z-20">
                <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xl shadow-red-500/30 border border-red-300 flex items-center space-x-2 animate-bounce-subtle">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <div className="text-left">
                    <div className="text-[11px] font-black leading-tight">One-Tap</div>
                    <div className="text-[10px] font-bold text-red-100 leading-tight">SOS Active</div>
                  </div>
                </div>
              </div>

              {/* Top Floating Badge 2: Saved Today ₹4,200 (Green) */}
              <div className="absolute top-5 right-5 z-20">
                <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-xl shadow-emerald-500/30 border border-emerald-300 flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                    🍃
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-bold text-emerald-100 flex items-center space-x-1">
                      <span>Saved Today:</span>
                      <TrendingUp className="w-3 h-3 text-emerald-200" />
                    </div>
                    <div className="text-sm font-black leading-tight">₹4,200</div>
                    <div className="text-[9px] text-emerald-200 leading-none">(Energy AI)</div>
                  </div>
                </div>
              </div>

              {/* Central Map Image with SVG Overlay */}
              <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 via-sky-50 to-indigo-50 border border-slate-200">
                <img
                  src={MOCK_ASSETS.campus3dMap}
                  alt="3D Campus Digital Twin"
                  className="w-full h-full object-cover filter contrast-[1.08] saturate-[1.15]"
                />

                {/* SVG Route Overlay connecting Student and Guard */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 500 350">
                  <defs>
                    <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  {/* Dashed Dispatch Trail */}
                  <path
                    d="M 180 180 Q 240 160 300 200 T 380 130"
                    fill="none"
                    stroke="url(#routeGrad)"
                    strokeWidth="3.5"
                    strokeDasharray="6,6"
                    className="animate-pulse"
                  />
                </svg>

                {/* Student SOS Pin & Radar */}
                <div className="absolute top-[48%] left-[28%] z-20 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative flex flex-col items-center">
                    <div className="absolute -inset-4 rounded-full bg-red-500/30 animate-ping" />
                    <div className="absolute -inset-8 rounded-full border border-red-500/40 animate-pulse" />
                    <div className="px-3 py-1.5 rounded-2xl bg-red-600 text-white shadow-xl flex items-center space-x-2 border-2 border-white">
                      <img
                        src={MOCK_ASSETS.avatars.nehaVerma}
                        alt="Student"
                        className="w-7 h-7 rounded-full object-cover border border-white"
                      />
                      <div className="text-left text-white">
                        <div className="text-[10px] font-black leading-tight">Student SOS</div>
                        <div className="text-[9px] font-bold text-red-100 leading-tight">Help Needed!</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Guard Arriving Pin */}
                <div className="absolute top-[32%] right-[16%] z-20">
                  <div className="px-3 py-1.5 rounded-2xl bg-[#1e293b] text-white shadow-xl flex items-center space-x-2 border-2 border-sky-400">
                    <img
                      src={MOCK_ASSETS.avatars.vikramSingh}
                      alt="Guard"
                      className="w-7 h-7 rounded-full object-cover border border-white"
                    />
                    <div className="text-left">
                      <div className="text-[10px] font-bold text-white leading-tight">Security Guard</div>
                      <div className="text-[9px] font-mono text-cyan-300 leading-tight">
                        Arriving... 120 meters
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Floating Glass Card: Live Staff GPS Connected */}
                <div className="absolute bottom-4 right-4 z-20">
                  <div className="px-3.5 py-2 rounded-2xl bg-[#0369a1]/90 backdrop-blur-md text-white border border-sky-300/40 shadow-2xl flex items-center space-x-2.5">
                    <Radio className="w-4 h-4 text-cyan-200 animate-pulse" />
                    <div>
                      <div className="text-[11px] font-black text-white leading-tight flex items-center space-x-1">
                        <span>Live Staff GPS Connected</span>
                        <ChevronRight className="w-3 h-3 text-cyan-300" />
                      </div>
                      <div className="flex items-center -space-x-1.5 mt-1">
                        <img
                          src={MOCK_ASSETS.avatars.amitSharma}
                          alt="avatar"
                          className="w-4 h-4 rounded-full object-cover border border-white"
                        />
                        <img
                          src={MOCK_ASSETS.avatars.rohitYadav}
                          alt="avatar"
                          className="w-4 h-4 rounded-full object-cover border border-white"
                        />
                        <img
                          src={MOCK_ASSETS.avatars.sureshKumar}
                          alt="avatar"
                          className="w-4 h-4 rounded-full object-cover border border-white"
                        />
                        <span className="w-4 h-4 rounded-full bg-cyan-500 text-[8px] font-bold text-white flex items-center justify-center border border-white">
                          +18
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 3. FEATURE CARDS (2x2 GRID MATCHING MOCKUP)                   */}
      {/* ============================================================= */}
      <section id="features" className="py-12 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* ----------------------------------------------------------- */}
          {/* Card 1: Instant Geotagged SOS & Campus Safety (Pink/Rose)   */}
          {/* ----------------------------------------------------------- */}
          <div className="rounded-3xl bg-gradient-to-br from-[#fff1f2] via-[#ffe4e6] to-[#fecdd3]/40 border border-rose-200/90 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
            <div className="space-y-4">
              {/* Header Badge & Title */}
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-xl shadow-md shadow-rose-500/25 shrink-0">
                  🚨
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black font-heading text-[#0f172a] leading-snug">
                    Instant Geotagged SOS &amp; Campus Safety
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    One-tap SOS, real-time location sharing, nearest security guard dispatch and
                    complete incident tracking.
                  </p>
                </div>
              </div>

              {/* 4 Feature Checkpoints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-slate-700 font-semibold">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-[10px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Live Location &amp; Alert</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-[10px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Nearest Guard in Seconds</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-[10px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Incident History &amp; Reports</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-[10px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Safer Campus for Everyone</span>
                </div>
              </div>
            </div>

            {/* Bottom: Action Link & Character Visual */}
            <div className="flex items-center justify-between pt-3 border-t border-rose-200/80">
              <Link
                to="/campus/portal"
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1 group"
              >
                <span>See Safety Features</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Mini Visual Badge */}
              <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-rose-200 shadow-sm flex items-center space-x-2 text-[11px] font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Guard Arriving 120 meters</span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* Card 2: Zero-Waste Smart Classrooms (Mint/Green)            */}
          {/* ----------------------------------------------------------- */}
          <div className="rounded-3xl bg-gradient-to-br from-[#ecfdf5] via-[#f0fdf4] to-[#dcfce7]/40 border border-emerald-200/90 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
            <div className="space-y-4">
              {/* Header Badge & Title */}
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/25 shrink-0">
                  🍃
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black font-heading text-[#0f172a] leading-snug">
                    Zero-Waste Smart Classrooms
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    AI-powered energy management automatically controls AC, lights and devices based
                    on real-time occupancy.
                  </p>
                </div>
              </div>

              {/* 4 Feature Checkpoints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-slate-700 font-semibold">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-[10px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Auto On/Off with AI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-[10px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Real-time Energy Monitoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-[10px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Lower Electricity Bills</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-[10px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Greener &amp; Sustainable Campus</span>
                </div>
              </div>
            </div>

            {/* Bottom: Action Link & Toggle Badge */}
            <div className="flex items-center justify-between pt-3 border-t border-emerald-200/80">
              <Link
                to="/facility-head/console"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 group"
              >
                <span>Explore Energy Features</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Auto OFF Toggle Badge */}
              <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-emerald-200 shadow-sm flex items-center space-x-2 text-[11px] font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Auto OFF • No Occupancy</span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* Card 3: Swiggy-Style Live Complaint Tracker (Peach/Amber)   */}
          {/* ----------------------------------------------------------- */}
          <div className="rounded-3xl bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fed7aa]/30 border border-amber-200/90 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
            <div className="space-y-4">
              {/* Header Badge & Title */}
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/25 shrink-0">
                  🛠️
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black font-heading text-[#0f172a] leading-snug">
                    Swiggy-Style Live Complaint Tracker
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Raise complaints for maintenance, infrastructure or facilities and track in
                    real-time with full transparency.
                  </p>
                </div>
              </div>

              {/* Step Tracker Visual (Submitted -> Assigned -> In Progress -> Resolved) */}
              <div className="grid grid-cols-4 gap-1.5 py-2">
                <div className="p-2 rounded-xl bg-white border border-amber-200 text-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1" />
                  <div className="text-[10px] font-bold text-slate-800 leading-tight">Submitted</div>
                  <div className="text-[9px] text-slate-500 leading-tight">10:24 AM</div>
                </div>

                <div className="p-2 rounded-xl bg-white border border-amber-200 text-center">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mx-auto mb-1" />
                  <div className="text-[10px] font-bold text-slate-800 leading-tight">Assigned</div>
                  <div className="text-[9px] text-slate-500 leading-tight">to Staff</div>
                </div>

                <div className="p-2 rounded-xl bg-white border border-amber-200 text-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mx-auto mb-1" />
                  <div className="text-[10px] font-bold text-slate-800 leading-tight">In Progress</div>
                  <div className="text-[9px] text-slate-500 leading-tight">Work Started</div>
                </div>

                <div className="p-2 rounded-xl bg-white border border-amber-200 text-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto mb-1 flex items-center justify-center text-white text-[7px] font-bold">
                    ✓
                  </div>
                  <div className="text-[10px] font-bold text-slate-800 leading-tight">Resolved</div>
                  <div className="text-[9px] text-slate-500 leading-tight">with Photo</div>
                </div>
              </div>
            </div>

            {/* Bottom: Action Link & Photo Verification */}
            <div className="flex items-center justify-between pt-3 border-t border-amber-200/80">
              <Link
                to="/campus/portal"
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1 group"
              >
                <span>Raise a Complaint</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Photo Attached Card */}
              <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-amber-200 shadow-sm flex items-center space-x-2 text-[11px] font-bold text-slate-800">
                <span className="text-xs">📸</span>
                <span>Work Completed Photo Attached</span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* Card 4: CampusGPT 24x7 AI Assistant (Lavender/Purple)       */}
          {/* ----------------------------------------------------------- */}
          <div className="rounded-3xl bg-gradient-to-br from-[#eff6ff] via-[#f5f3ff] to-[#ede9fe]/40 border border-indigo-200/90 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
            <div className="space-y-4">
              {/* Header Badge & Title */}
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-600/25 shrink-0">
                  🤖
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black font-heading text-[#0f172a] leading-snug">
                    CampusGPT 24x7 AI Assistant
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Get instant answers about academics, facilities, events, rules and more — anytime,
                    anywhere.
                  </p>
                </div>
              </div>

              {/* 4 Feature Checkpoints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-slate-700 font-semibold">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Academic &amp; Campus Queries</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Document-based Answers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Multi-role Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Always Available 24x7</span>
                </div>
              </div>
            </div>

            {/* Bottom: Action Link & Chat Bubble Mockup */}
            <div className="flex items-center justify-between pt-3 border-t border-indigo-200/80">
              <Link
                to="/campus/portal"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 group"
              >
                <span>Try CampusGPT Now</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Chat Input Pill Preview */}
              <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-indigo-200 shadow-sm flex items-center space-x-2 text-[11px] font-bold text-indigo-700">
                <span className="text-xs">💬</span>
                <span>Ask anything about campus...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 4. FOOTER (DEEP NAVY EXACT MATCH TO SCREENSHOT)              */}
      {/* ============================================================= */}
      <footer id="contact" className="bg-[#090e1d] text-slate-300 pt-14 pb-8 px-4 sm:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Main 4-Column Footer */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Column 1: Brand & Bio */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1e1b4b] to-[#3b82f6] p-0.5 flex items-center justify-center border border-amber-400/60 shadow-md">
                  <Building className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-base font-heading">Smart Campus</div>
                  <div className="text-[11px] font-semibold text-slate-400">Digital Twin</div>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
                Building a safer, smarter, greener and more connected campus with AI, IoT and real-time intelligence.
              </p>
              {/* Social Media Icons */}
              <div className="flex items-center space-x-3 text-slate-400 pt-1">
                <a href="#youtube" className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-colors">
                  ▶
                </a>
                <a href="#linkedin" className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-colors font-bold text-xs">
                  in
                </a>
                <a href="#twitter" className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-colors font-bold text-xs">
                  𝕏
                </a>
                <a href="#instagram" className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-colors text-xs">
                  📷
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <div className="font-bold text-white uppercase text-xs font-mono tracking-wider">
                Quick Links
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#home" className="hover:text-white transition-colors">
                    • Home
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    • Features
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    • Roles &amp; Portals
                  </Link>
                </li>
                <li>
                  <a href="#about" className="hover:text-white transition-colors">
                    • About Us
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition-colors">
                    • Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Role Portals */}
            <div className="space-y-3">
              <div className="font-bold text-white uppercase text-xs font-mono tracking-wider">
                Role Portals
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link to="/campus/portal" className="hover:text-cyan-400 flex items-center justify-between group">
                    <span className="flex items-center space-x-2">
                      <span>🎓</span>
                      <span>Student Portal</span>
                    </span>
                    <span className="text-slate-600 group-hover:text-cyan-400">&gt;</span>
                  </Link>
                </li>
                <li>
                  <Link to="/campus/portal" className="hover:text-cyan-400 flex items-center justify-between group">
                    <span className="flex items-center space-x-2">
                      <span>👨‍🏫</span>
                      <span>Faculty Portal</span>
                    </span>
                    <span className="text-slate-600 group-hover:text-cyan-400">&gt;</span>
                  </Link>
                </li>
                <li>
                  <Link to="/admin/dashboard" className="hover:text-cyan-400 flex items-center justify-between group">
                    <span className="flex items-center space-x-2">
                      <span>👑</span>
                      <span>Admin Portal</span>
                    </span>
                    <span className="text-slate-600 group-hover:text-cyan-400">&gt;</span>
                  </Link>
                </li>
                <li>
                  <Link to="/security-head/console" className="hover:text-cyan-400 flex items-center justify-between group">
                    <span className="flex items-center space-x-2">
                      <span>👮</span>
                      <span>Security Head Portal</span>
                    </span>
                    <span className="text-slate-600 group-hover:text-cyan-400">&gt;</span>
                  </Link>
                </li>
                <li>
                  <Link to="/guard/mobile-app" className="hover:text-cyan-400 flex items-center justify-between group">
                    <span className="flex items-center space-x-2">
                      <span>🛡️</span>
                      <span>Security Guard Portal</span>
                    </span>
                    <span className="text-slate-600 group-hover:text-cyan-400">&gt;</span>
                  </Link>
                </li>
                <li>
                  <Link to="/worker/mobile-app" className="hover:text-cyan-400 flex items-center justify-between group">
                    <span className="flex items-center space-x-2">
                      <span>👷</span>
                      <span>Staff Portal</span>
                    </span>
                    <span className="text-slate-600 group-hover:text-cyan-400">&gt;</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Emergency Helpline */}
            <div className="space-y-3">
              <div className="font-bold text-white uppercase text-xs font-mono tracking-wider">
                Emergency Helpline
              </div>

              {/* SOS Safety Pill Card */}
              <div className="p-3 rounded-2xl bg-[#131d36] border border-red-500/30 flex items-center space-x-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-lg shadow-red-600/30">
                  SOS
                </div>
                <div>
                  <div className="text-[11px] text-slate-300 font-medium">24x7 Campus Safety</div>
                  <div className="text-sm font-black text-white font-mono tracking-tight">+91 1122 334 555</div>
                </div>
              </div>

              {/* Ambulance Helpline Card */}
              <div className="p-3 rounded-2xl bg-[#131d36] border border-blue-500/30 flex items-center space-x-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 text-white text-base flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
                  🚑
                </div>
                <div>
                  <div className="text-[11px] text-slate-300 font-medium">Medical Emergency</div>
                  <div className="text-sm font-black text-white font-mono tracking-tight">+91 1122 334 556</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>© 2026 Smart Campus Digital Twin. All rights reserved.</div>

            <div className="flex items-center space-x-4">
              <span>Powered by AI</span>
              <span>|</span>
              <span>Built for a Safer, Smarter Future</span>
              <span>|</span>
              <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live System</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
