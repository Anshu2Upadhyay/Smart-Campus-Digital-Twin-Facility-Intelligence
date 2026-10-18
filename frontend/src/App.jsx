import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth, ROLE_REDIRECTS } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

// Public Auth & Landing Pages
import LandingPage from './pages/LandingPage';
import OfficialLogin from './pages/auth/OfficialLogin';
import StaffPinLogin from './pages/auth/StaffPinLogin';

// Role 1: Super Admin Console
import CampusMapLayoutEngine from './pages/admin/CampusMapLayoutEngine';
import AdminDashboard from './pages/admin/AdminDashboard';
import CampusSetup from './pages/admin/CampusSetup';
import ManageHeads from './pages/admin/ManageHeads';
import LiveAttendanceLedger from './pages/admin/LiveAttendanceLedger';
import GlobalAuditStream from './pages/admin/GlobalAuditStream';
import AttendanceAndAudit from './pages/admin/AttendanceAndAudit';
import CctvEngine from './pages/admin/CctvEngine';
import AdminLayout from './components/AdminLayout';

// Role 2: Security Head SOC Console & Sub-Modules
import SecurityConsole from './pages/securityHead/SecurityConsole';
import SecurityCctvMonitoring from './pages/securityHead/SecurityCctvMonitoring';
import ManageGuards from './pages/securityHead/ManageGuards';
import SecurityGpsRadar from './pages/securityHead/SecurityGpsRadar';
import SecurityIncidentsSos from './pages/securityHead/SecurityIncidentsSos';

// Role 4: Facility Operations Supervisor Console & Sub-Modules
import FacilityConsole from './pages/facilityHead/FacilityConsole';
import ManageWorkers from './pages/facilityHead/ManageWorkers';
import FacilityFloorGrid from './pages/facilityHead/FacilityFloorGrid';
import FacilityWorkorders from './pages/facilityHead/FacilityWorkorders';
import FacilityEnergyMonitoring from './pages/facilityHead/FacilityEnergyMonitoring';
import FacilityCctvVerify from './pages/facilityHead/FacilityCctvVerify';

// Role 3 & Role 5: Field Staff PWAs
import GuardMobileDashboard from './pages/guardApp/GuardMobileDashboard';
import WorkerMobileDashboard from './pages/workerApp/WorkerMobileDashboard';

// Role 6: Student & Faculty Portal
import EndUserDashboard from './pages/campusPortal/EndUserDashboard';

// Session-based Root Redirector
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const target = ROLE_REDIRECTS[user?.role] || '/campus/portal';
  return <Navigate to={target} replace />;
};

// 403 Forbidden Access Denied Fallback Page
const AccessDeniedPage = () => (
  <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.15),rgba(255,255,255,0))] flex flex-col items-center justify-center p-4 text-center">
    <div className="glass-panel-glow rounded-3xl p-8 max-w-md w-full border-red-500/50 space-y-5 shadow-2xl">
      <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
        <ShieldAlert className="w-8 h-8 animate-bounce" />
      </div>
      <div>
        <h1 className="text-2xl font-black font-heading text-white">403 • Access Denied</h1>
        <p className="text-xs text-slate-400 mt-1">
          Your credentials do not have security clearance for this terminal sector.
        </p>
      </div>
      <Link
        to="/"
        className="w-full py-3 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-400/20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Authorized Console</span>
      </Link>
    </div>
  </div>
);

export const App = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <Routes>
            {/* ============================================================= */}
            {/* PUBLIC AUTHENTICATION ROUTES */}
            {/* ============================================================= */}
            <Route path="/login" element={<OfficialLogin />} />
            <Route path="/staff-login" element={<StaffPinLogin />} />

            {/* ============================================================= */}
            {/* ROLE 1: SUPER ADMIN CONSOLE (STRICT ISOLATION) */}
            {/* ============================================================= */}
            <Route
              path="/admin/map-engine"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <CampusMapLayoutEngine />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/map-builder"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <CampusMapLayoutEngine />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/setup"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <CampusSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/cctv"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminLayout>
                    <CctvEngine />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-heads"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminLayout>
                    <ManageHeads />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <LiveAttendanceLedger />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <GlobalAuditStream />
                </ProtectedRoute>
              }
            />

            {/* ============================================================= */}
            {/* ROLE 2: SECURITY HEAD SOC CONSOLE (STRICT ISOLATION) */}
            {/* ============================================================= */}
            <Route
              path="/security-head/console"
              element={
                <ProtectedRoute allowedRoles={['SECURITY_HEAD', 'SUPER_ADMIN']}>
                  <SecurityConsole />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security-head/cctv"
              element={
                <ProtectedRoute allowedRoles={['SECURITY_HEAD', 'SUPER_ADMIN']}>
                  <SecurityCctvMonitoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security-head/guards"
              element={
                <ProtectedRoute allowedRoles={['SECURITY_HEAD', 'SUPER_ADMIN']}>
                  <ManageGuards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security-head/gps-radar"
              element={
                <ProtectedRoute allowedRoles={['SECURITY_HEAD', 'SUPER_ADMIN']}>
                  <SecurityGpsRadar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security-head/incidents"
              element={
                <ProtectedRoute allowedRoles={['SECURITY_HEAD', 'SUPER_ADMIN']}>
                  <SecurityIncidentsSos />
                </ProtectedRoute>
              }
            />

            {/* ============================================================= */}
            {/* ROLE 3: SECURITY GUARD MOBILE PWA (STRICT ISOLATION) */}
            {/* ============================================================= */}
            <Route
              path="/guard/mobile-app"
              element={
                <ProtectedRoute allowedRoles={['SECURITY_GUARD', 'SUPER_ADMIN']}>
                  <GuardMobileDashboard />
                </ProtectedRoute>
              }
            />

            {/* ============================================================= */}
            {/* ROLE 4: FACILITY OPERATIONS SUPERVISOR CONSOLE (STRICT ISOLATION) */}
            {/* ============================================================= */}
            <Route
              path="/facility-head/console"
              element={
                <ProtectedRoute allowedRoles={['FACILITY_SUPERVISOR', 'SUPER_ADMIN']}>
                  <FacilityConsole />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facility-head/workers"
              element={
                <ProtectedRoute allowedRoles={['FACILITY_SUPERVISOR', 'SUPER_ADMIN']}>
                  <ManageWorkers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facility-head/floor-grid"
              element={
                <ProtectedRoute allowedRoles={['FACILITY_SUPERVISOR', 'SUPER_ADMIN']}>
                  <FacilityFloorGrid />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facility-head/workorders"
              element={
                <ProtectedRoute allowedRoles={['FACILITY_SUPERVISOR', 'SUPER_ADMIN']}>
                  <FacilityWorkorders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facility-head/energy"
              element={
                <ProtectedRoute allowedRoles={['FACILITY_SUPERVISOR', 'SUPER_ADMIN']}>
                  <FacilityEnergyMonitoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facility-head/cctv-verify"
              element={
                <ProtectedRoute allowedRoles={['FACILITY_SUPERVISOR', 'SUPER_ADMIN']}>
                  <FacilityCctvVerify />
                </ProtectedRoute>
              }
            />

            {/* ============================================================= */}
            {/* ROLE 5: GROUND MAINTENANCE WORKER MOBILE PWA (STRICT ISOLATION) */}
            {/* ============================================================= */}
            <Route
              path="/worker/mobile-app"
              element={
                <ProtectedRoute allowedRoles={['GROUND_WORKER', 'SUPER_ADMIN']}>
                  <WorkerMobileDashboard />
                </ProtectedRoute>
              }
            />

            {/* ============================================================= */}
            {/* ROLE 6: STUDENT & FACULTY UNIFIED PORTAL (STRICT ISOLATION) */}
            {/* ============================================================= */}
            <Route
              path="/campus/portal"
              element={
                <ProtectedRoute allowedRoles={['STUDENT_FACULTY', 'SUPER_ADMIN']}>
                  <EndUserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campus/portal/:tabSlug"
              element={
                <ProtectedRoute allowedRoles={['STUDENT_FACULTY', 'SUPER_ADMIN']}>
                  <EndUserDashboard />
                </ProtectedRoute>
              }
            />

            {/* 403 Forbidden Access Fallback */}
            <Route path="/403" element={<AccessDeniedPage />} />

            {/* Default Catch-Alls: Landing Page opens first */}
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </SocketProvider>
      </ThemeProvider>
    </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
