import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const ROLE_REDIRECTS = {
  SUPER_ADMIN: '/admin/map-engine',
  SECURITY_HEAD: '/security-head/console',
  SECURITY_GUARD: '/guard/mobile-app',
  FACILITY_SUPERVISOR: '/facility-head/console',
  FACILITY_HEAD: '/facility-head/console',
  GROUND_WORKER: '/worker/mobile-app',
  WORKER: '/worker/mobile-app',
  STAFF: '/worker/mobile-app',
  STUDENT_FACULTY: '/campus/portal',
  STUDENT: '/campus/portal',
  FACULTY: '/campus/portal',
};

export const getRedirectPathForRole = (role) => {
  return ROLE_REDIRECTS[role] || '/campus/portal';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved =
        localStorage.getItem('campus_user') ||
        localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return (
      localStorage.getItem('campus_jwt_token') ||
      localStorage.getItem('token') ||
      null
    );
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync token and user profile to localStorage
  const _persistAuth = (accessToken, userData) => {
    localStorage.setItem('campus_jwt_token', accessToken);
    localStorage.setItem('campus_user', JSON.stringify(userData));
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
    setError(null);
  };

  const _clearAuth = () => {
    localStorage.removeItem('campus_jwt_token');
    localStorage.removeItem('campus_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Verify and sync session on initial mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        const activeToken =
          localStorage.getItem('campus_jwt_token') ||
          localStorage.getItem('token');

        if (activeToken) {
          const res = await axiosClient.get('/auth/me');
          // Backend returns { user: clean_user, attendance: ..., server_time: ... }
          const userData = res.data?.user || res.data;
          if (userData && (userData.role || userData.id || userData._id)) {
            setUser(userData);
            localStorage.setItem('campus_user', JSON.stringify(userData));
            localStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } catch (err) {
        console.warn('Session verification notice (clearing stale credentials):', err);
        _clearAuth();
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // 1. Official Web Portal Login (Admin, Heads, Faculty, Students)
  const loginOfficial = async (identifier, password) => {
    setError(null);
    try {
      const res = await axiosClient.post('/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      const { access_token, user: userData, redirect_url } = res.data;
      _persistAuth(access_token, userData);

      const targetPath = redirect_url || getRedirectPathForRole(userData?.role);
      return {
        success: true,
        redirectUrl: targetPath,
        redirect_url: targetPath,
        user: userData,
      };
    } catch (err) {
      const msg =
        err.extractedDetail ||
        err.response?.data?.detail ||
        err.message ||
        'Authentication failed. Please verify credentials.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // 2. Field Staff 4-Digit Quick PIN Login (Guards & Workers)
  const loginStaffPin = async (identifier, pin) => {
    setError(null);
    try {
      const res = await axiosClient.post('/auth/staff-login', {
        identifier: identifier.trim(),
        pin: pin.trim(),
      });

      const { access_token, user: userData, redirect_url } = res.data;
      _persistAuth(access_token, userData);

      const targetPath = redirect_url || getRedirectPathForRole(userData?.role);
      return {
        success: true,
        redirectUrl: targetPath,
        redirect_url: targetPath,
        user: userData,
      };
    } catch (err) {
      const msg =
        err.extractedDetail ||
        err.response?.data?.detail ||
        err.message ||
        'Invalid Staff ID or 4-Digit PIN.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // 3. Refresh Profile: fetches latest duty state, GPS zone, tasks completed
  const refreshProfile = async () => {
    try {
      const res = await axiosClient.get('/auth/me');
      const userData = res.data?.user || res.data;
      if (userData && (userData.role || userData.id || userData._id)) {
        setUser(userData);
        localStorage.setItem('campus_user', JSON.stringify(userData));
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
    } catch (err) {
      console.debug('Failed to refresh profile:', err);
    }
    return user;
  };

  // 4. Update in-memory user fields
  const updateUserProfile = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('campus_user', JSON.stringify(updated));
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  // 5. Logout
  const logout = () => {
    _clearAuth();
    window.location.href = '/login';
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    loading,
    error,
    loginOfficial,
    loginStaffPin,
    refreshProfile,
    updateUserProfile,
    logout,
    getRedirectPathForRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
