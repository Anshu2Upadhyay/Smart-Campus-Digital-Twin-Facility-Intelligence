import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase animate-pulse">
            AUTHENTICATING DIGITAL TWIN ACCESS
          </p>
          <p className="text-slate-500 text-[11px] mt-1">Verifying campus security credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const isStaffRoute = location.pathname.includes('/guard') || location.pathname.includes('/worker');
    return <Navigate to={isStaffRoute ? '/staff-login' : '/login'} state={{ from: location }} replace />;
  }

  // Seamless access: role-blocking removed so all consoles and sectors are directly accessible
  return children;
};

export default ProtectedRoute;
