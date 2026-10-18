import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_REDIRECTS } from '../../context/AuthContext';
import {
  Crown,
  Shield,
  Wrench,
  GraduationCap,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Phone,
  Delete,
  Fingerprint,
  Zap,
  Users,
  HardHat,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

// Official Portal Roles
const OFFICIAL_ROLES = [
  {
    id: 'ADMIN',
    label: 'Admin',
    icon: Crown,
    defaultEmail: 'admin@campus.edu',
    defaultPass: 'Admin@123',
    redirect: '/admin/dashboard',
    color: 'indigo',
  },
  {
    id: 'SECURITY_HEAD',
    label: 'Security Head',
    icon: Shield,
    defaultEmail: 'security.head@campus.edu',
    defaultPass: 'SecHead@123',
    redirect: '/security-head/console',
    color: 'blue',
  },
  {
    id: 'FACILITY_HEAD',
    label: 'Facility Head',
    icon: Wrench,
    defaultEmail: 'facility.head@campus.edu',
    defaultPass: 'FacHead@123',
    redirect: '/facility-head/console',
    color: 'cyan',
  },
  {
    id: 'STUDENT_FACULTY',
    label: 'Student / Faculty',
    icon: GraduationCap,
    defaultEmail: 'rahul@campus.edu',
    defaultPass: 'Student@123',
    redirect: '/campus/portal',
    color: 'emerald',
  },
];

// Quick Demo Field Staff Presets
const FIELD_STAFF_PRESETS = [
  { label: 'Guard Vikram (Gate-2)', staffId: 'SEC-101', pin: '1111' },
  { label: 'Worker Ramesh (Housekeeping)', staffId: 'WRK-201', pin: '2222' },
  { label: 'Worker Amit (Electrician)', staffId: 'WRK-202', pin: '2222' },
];

export const DualLogin = () => {
  const navigate = useNavigate();
  const { loginOfficial, loginStaffPin } = useAuth();

  // --- Official Portal State ---
  const [selectedRole, setSelectedRole] = useState(OFFICIAL_ROLES[0].id);
  const [officialIdentifier, setOfficialIdentifier] = useState(OFFICIAL_ROLES[0].defaultEmail);
  const [officialPassword, setOfficialPassword] = useState(OFFICIAL_ROLES[0].defaultPass);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [officialLoading, setOfficialLoading] = useState(false);
  const [officialError, setOfficialError] = useState('');

  // --- Field Staff PIN State ---
  const [staffIdentifier, setStaffIdentifier] = useState('SEC-101');
  const [staffPin, setStaffPin] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  // Role Tab Click Handler
  const handleSelectRoleTab = (roleObj) => {
    setSelectedRole(roleObj.id);
    setOfficialIdentifier(roleObj.defaultEmail);
    setOfficialPassword(roleObj.defaultPass);
    setOfficialError('');
  };

  // Official Form Submit
  const handleOfficialLogin = async (e) => {
    if (e) e.preventDefault();
    setOfficialError('');
    if (!officialIdentifier.trim() || !officialPassword.trim()) {
      setOfficialError('Please provide your registered ID and password.');
      return;
    }

    setOfficialLoading(true);
    try {
      const res = await loginOfficial(officialIdentifier, officialPassword);
      if (res.success) {
        navigate(res.redirectUrl || '/admin/dashboard');
      } else {
        setOfficialError(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setOfficialError(err.message || 'Server connection error.');
    } finally {
      setOfficialLoading(false);
    }
  };

  // 1-Click Demo Login as Specific Role
  const handleQuickOfficialLogin = async (roleObj) => {
    handleSelectRoleTab(roleObj);
    setOfficialLoading(true);
    try {
      const res = await loginOfficial(roleObj.defaultEmail, roleObj.defaultPass);
      if (res.success) {
        navigate(res.redirectUrl || roleObj.redirect);
      } else {
        setOfficialError(res.error || 'Login failed.');
      }
    } catch (err) {
      setOfficialError(err.message || 'Login failed.');
    } finally {
      setOfficialLoading(false);
    }
  };

  // Staff Keypad Digit Press
  const handleKeypadPress = (val) => {
    let nextPin = staffPin;
    if (staffPin.length >= 4) {
      nextPin = val;
    } else {
      nextPin = staffPin + val;
    }
    setStaffPin(nextPin);
    setStaffError('');
    // Auto-submit if 4 digits reached
    if (nextPin.length === 4) {
      submitStaffLogin(staffIdentifier, nextPin);
    }
  };

  // Staff Keypad Backspace
  const handleKeypadBackspace = () => {
    setStaffPin((prev) => prev.slice(0, -1));
    setStaffError('');
  };

  // Biometric 1-Click Demo Unlock
  const handleBiometricUnlock = () => {
    setBiometricSuccess(true);
    setStaffIdentifier('SEC-101');
    setStaffPin('1111');
    setTimeout(() => {
      setBiometricSuccess(false);
      submitStaffLogin('SEC-101', '1111');
    }, 600);
  };

  // Staff Submit
  const submitStaffLogin = async (idToUse, pinToUse) => {
    const ident = (idToUse || staffIdentifier).trim();
    const pin = (pinToUse || staffPin).trim();

    if (!ident) {
      setStaffError('Please enter your Staff ID or Phone Number.');
      return;
    }
    if (pin.length !== 4) {
      setStaffError('Please enter a 4-digit PIN.');
      return;
    }

    setStaffLoading(true);
    setStaffError('');
    try {
      const res = await loginStaffPin(ident, pin);
      if (res.success) {
        navigate(res.redirectUrl || '/guard/mobile-app');
      } else {
        setStaffError(res.error || 'Incorrect PIN or unregistered staff ID.');
      }
    } catch (err) {
      setStaffError(err.message || 'Server connection error.');
    } finally {
      setStaffLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-slate-50 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* ========================================================================= */}
      {/* PHOTOREALISTIC CAMPUS BACKDROP WITH ETHEREAL ATMOSPHERIC OVERLAYS         */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img
          src="/assets/campus_bg.jpg"
          alt="Modern Campus Digital Twin"
          className="w-full h-full object-cover object-center filter saturate-[1.15] contrast-[1.05]"
          onError={(e) => {
            // Elegant fallback if image is loading
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Soft daylight glow & glass gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100/75 via-white/80 to-slate-100/90 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-300/30 via-indigo-100/20 to-transparent" />
      </div>

      {/* ========================================================================= */}
      {/* TOP HEADER BAR                                                            */}
      {/* ========================================================================= */}
      <header className="relative z-10 w-full px-6 lg:px-12 pt-6 pb-2 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Neoclassical Emblem + Logo Branding */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-indigo-400/50 flex items-center justify-center shadow-md relative overflow-hidden group">
            {/* Laurel Wreath Portico Crest Icon */}
            <svg
              className="w-8 h-8 text-indigo-300 transition-transform group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21h18M4 18h16M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2L3 7h18L12 2z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-1.5 leading-none">
              <span className="text-xl md:text-2xl font-black font-heading text-slate-900 tracking-tight">
                Smart Campus
              </span>
              <span className="text-xl md:text-2xl font-black font-heading text-blue-600 tracking-tight">
                Digital Twin
              </span>
            </div>
            <p className="text-[11px] md:text-xs font-semibold text-slate-500 tracking-wide mt-1">
              Safer Campus &bull; Smarter Operations &bull; Better Student Experience
            </p>
          </div>
        </div>

        {/* Right: AI Powered Campus Slogan */}
        <div className="text-right hidden md:block">
          <p className="text-[11px] font-bold tracking-widest text-indigo-700/80 uppercase font-heading">
            AI Powered Campus
          </p>
          <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            For a Safer, Greener and Smarter Future
          </p>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* AMBIENT CALLIGRAPHIC / HANDWRITTEN ACCENTS                                */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 hidden xl:flex justify-between items-center pointer-events-none -mb-6">
        {/* Left Handwritten Script */}
        <div className="transform -rotate-6 text-blue-900/85">
          <p className="font-handwriting text-3xl font-bold tracking-wide drop-shadow-sm">
            A Smarter Campus
          </p>
          <p className="font-handwriting text-2xl font-bold tracking-wide -mt-1 text-indigo-900/80">
            for a Brighter Tomorrow.
          </p>
        </div>

        {/* Right Paper Airplane with Slanted Script */}
        <div className="transform rotate-3 text-blue-900/85 text-right flex items-center space-x-2">
          <div className="font-handwriting text-xl font-bold leading-tight drop-shadow-sm text-indigo-900/85">
            <div>People &bull; Safety</div>
            <div>Sustainability &bull; Growth</div>
          </div>
          {/* Flying Paper Plane SVG */}
          <div className="text-indigo-600 animate-pulse">
            <svg
              className="w-8 h-8 transform rotate-12"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN DUAL LOGIN CARDS CONTAINER                                           */}
      {/* ========================================================================= */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* ======================================================================= */}
          {/* CARD 1: OFFICIAL PORTAL LOGIN (LEFT CARD)                               */}
          {/* ======================================================================= */}
          <div className="lg:col-span-7 bg-white/95 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 flex flex-col justify-between backdrop-blur-md transition-all hover:shadow-indigo-500/10">
            <div>
              {/* Header Badge & Title */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-inner">
                  <Users className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black font-heading text-slate-900 tracking-tight">
                  Official Portal Login
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Access your role-based dashboard
                </p>
              </div>

              {/* 4 Role Selection Tabs */}
              <div className="grid grid-cols-4 gap-2 mb-6 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60">
                {OFFICIAL_ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectRoleTab(r)}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all duration-200 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-[1.02]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                      <span className="text-[11px] font-bold leading-tight text-center truncate w-full">
                        {r.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Error Alert */}
              {officialError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{officialError}</span>
                </div>
              )}

              {/* Form Inputs */}
              <form onSubmit={handleOfficialLogin} className="space-y-4">
                {/* Identifier Input */}
                <div>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={officialIdentifier}
                      onChange={(e) => setOfficialIdentifier(e.target.value)}
                      placeholder="Email / Roll No / Employee ID"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 pl-1 font-medium">
                    Enter your registered email, roll number or employee ID
                  </p>
                </div>

                {/* Password Input */}
                <div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={officialPassword}
                      onChange={(e) => setOfficialPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-11 pr-11 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 pl-1 font-medium">
                    Enter your password
                  </p>
                </div>

                {/* Remember me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer select-none font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Password reset is managed by University IT Admin. Please contact it-support@smartcampus.edu')}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Gradient Button */}
                <button
                  type="submit"
                  disabled={officialLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
                >
                  {officialLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick 1-Click Role Switcher Divider */}
            <div className="pt-6 mt-6 border-t border-slate-100">
              <div className="relative flex justify-center text-xs uppercase mb-3">
                <span className="bg-white px-3 text-slate-400 font-bold tracking-wider text-[10px]">
                  Or login as
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {OFFICIAL_ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={`quick-${r.id}`}
                      type="button"
                      onClick={() => handleQuickOfficialLogin(r)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/70 hover:border-indigo-300 transition-all text-center group"
                    >
                      <Icon className="w-4 h-4 text-indigo-600 mb-0.5 transition-transform group-hover:scale-110" />
                      <span className="text-[11px] font-bold text-slate-800 leading-tight">
                        {r.label}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {r.redirect.split('/')[1] ? `/${r.redirect.split('/')[1]}` : '/login'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* CARD 2: FIELD STAFF QUICK PIN LOGIN (RIGHT CARD)                       */}
          {/* ======================================================================= */}
          <div className="lg:col-span-5 bg-emerald-50/90 rounded-3xl shadow-2xl p-6 sm:p-8 border border-emerald-100 flex flex-col justify-between backdrop-blur-md transition-all hover:shadow-emerald-500/10">
            <div>
              {/* Header Badge & Title */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/90 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
                  <HardHat className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black font-heading text-slate-900 tracking-tight">
                  Field Staff Quick PIN Login
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  For Security Guards & Ground Workers
                </p>
              </div>

              {/* Staff Error Alert */}
              {staffError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              {/* Biometric Flash Toast */}
              {biometricSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs flex items-center justify-center space-x-2 animate-bounce">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">Biometric Match Verified: Guard Vikram (SEC-101)</span>
                </div>
              )}

              {/* Phone / Staff ID Input */}
              <div className="mb-4">
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-emerald-600 absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    value={staffIdentifier}
                    onChange={(e) => setStaffIdentifier(e.target.value.toUpperCase())}
                    placeholder="Phone Number or Staff ID"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-emerald-200 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-all font-semibold"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 pl-1 pr-1 text-[11px] text-slate-500">
                  <span>e.g. SEC-101 or WRK-205</span>
                  {/* Quick Preset Selector */}
                  <div className="flex space-x-1.5">
                    {FIELD_STAFF_PRESETS.map((p) => (
                      <button
                        key={p.staffId}
                        type="button"
                        onClick={() => {
                          setStaffIdentifier(p.staffId);
                          setStaffPin(p.pin);
                        }}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold underline"
                      >
                        {p.staffId}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4-Digit Security PIN Section */}
              <div className="mb-4">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>4-Digit Security PIN</span>
                </div>

                {/* 4 Square PIN Boxes */}
                <div className="grid grid-cols-4 gap-3 max-w-[280px] mx-auto mb-4">
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = staffPin.length > idx;
                    const isCurrent = staffPin.length === idx;
                    return (
                      <div
                        key={idx}
                        className={`h-14 rounded-2xl bg-white border flex items-center justify-center transition-all ${
                          isFilled
                            ? 'border-emerald-400 shadow-sm'
                            : isCurrent
                            ? 'border-emerald-500 ring-2 ring-emerald-200'
                            : 'border-emerald-200'
                        }`}
                      >
                        {isFilled ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-scale-in" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 3x4 Calculator-Style Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadPress(digit)}
                      className="py-3 bg-white hover:bg-emerald-100/60 active:scale-95 text-slate-800 font-black text-lg rounded-2xl shadow-sm border border-emerald-100 transition-all flex items-center justify-center cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}

                  {/* Backspace Button */}
                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    className="py-3 bg-white hover:bg-emerald-100/60 active:scale-95 text-slate-700 rounded-2xl shadow-sm border border-emerald-100 transition-all flex items-center justify-center cursor-pointer"
                    title="Delete last digit"
                  >
                    <Delete className="w-5 h-5" />
                  </button>

                  {/* Digit 0 */}
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="py-3 bg-white hover:bg-emerald-100/60 active:scale-95 text-slate-800 font-black text-lg rounded-2xl shadow-sm border border-emerald-100 transition-all flex items-center justify-center cursor-pointer"
                  >
                    0
                  </button>

                  {/* Biometric Fingerprint Button */}
                  <button
                    type="button"
                    onClick={handleBiometricUnlock}
                    className="py-3 bg-white hover:bg-emerald-100/80 active:scale-95 text-emerald-600 rounded-2xl shadow-sm border border-emerald-100 transition-all flex items-center justify-center group cursor-pointer"
                    title="1-Click Demo Biometric Instant Unlock"
                  >
                    <Fingerprint className="w-6 h-6 transition-transform group-hover:scale-110" />
                  </button>
                </div>
              </div>

              {/* Submit Emerald Button */}
              <button
                type="button"
                onClick={() => submitStaffLogin()}
                disabled={staffLoading}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none cursor-pointer mt-2"
              >
                {staffLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Unlock Duty App</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-500 font-medium text-center mt-3">
                Quick, Secure and Hassle-Free Access for Field Staff
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM FOOTER BAR                                                         */}
      {/* ========================================================================= */}
      <footer className="relative z-10 w-full px-6 py-4 text-center text-xs text-slate-500 font-medium">
        <span>Smart Campus Digital Twin &bull; Enterprise 24/7 Command Center &bull; High Reliability Architecture</span>
      </footer>
    </div>
  );
};

export default DualLogin;
