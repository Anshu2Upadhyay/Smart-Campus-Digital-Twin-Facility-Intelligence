import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import SecurityLayout from '../../components/SecurityLayout';
import CampusMap from '../../components/CampusMap';
import {
  Shield,
  UserPlus,
  Radio,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  ArrowLeft,
  Users,
  Compass,
  Key,
} from 'lucide-react';

export const ManageGuards = () => {
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Guard Form Data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    staff_id: 'SEC-105',
    default_gate: 'Gate-2',
    pin: '1111',
    lat: 28.6141,
    lng: 77.2091,
  });
  const [submitting, setSubmitting] = useState(false);

  const { notifications, liveStaffLocations } = useSocket();

  const loadGuards = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/security/guards');
      setGuards(res.data || []);
    } catch (err) {
      console.error('Error fetching guards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuards();
  }, []);

  // Sync on live WebSocket events or location updates
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      loadGuards();
    }
  }, [notifications]);

  // Create & Enroll Security Guard
  const handleCreateGuard = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);
      await axiosClient.post('/security/create-guard', {
        name: formData.name,
        phone: formData.phone,
        badge_id: formData.staff_id,
        staff_id: formData.staff_id,
        default_gate: formData.default_gate,
        pin: formData.pin,
        lat: parseFloat(formData.lat) || 28.6141,
        lng: parseFloat(formData.lng) || 77.2091,
      });

      setFeedback({
        type: 'success',
        message: `🛡️ Security Officer '${formData.name}' successfully enrolled with Badge ID ${formData.staff_id}!`,
      });
      setShowAddModal(false);

      // Auto-increment badge ID for next officer
      const nextIdNum = Math.floor(106 + Math.random() * 20);
      setFormData({
        name: '',
        phone: '',
        staff_id: `SEC-${nextIdNum}`,
        default_gate: 'Gate-2',
        pin: '1111',
        lat: 28.6141,
        lng: 77.2091,
      });

      loadGuards();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to enroll security guard.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalGuards = guards.length;
  const freeGuards = guards.filter(
    (g) => g.duty_state === 'ONLINE_FREE' || g.status === 'ONLINE_FREE'
  ).length;
  const busyGuards = guards.filter(
    (g) => g.duty_state === 'BUSY_ON_TASK' || g.status === 'BUSY_ON_TASK'
  ).length;
  const breakGuards = guards.filter(
    (g) => g.duty_state === 'ON_BREAK' || g.status === 'ON_BREAK'
  ).length;

  // Filter Guards List
  const filteredGuards = guards.filter((guard) => {
    const matchesSearch =
      (guard.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guard.staff_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guard.default_gate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guard.current_block || '').toLowerCase().includes(searchTerm.toLowerCase());
    const duty = guard.duty_state || guard.status || 'OFF_DUTY';
    const matchesStatus = statusFilter === 'ALL' || duty === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <SecurityLayout>
      <div className="max-w-7xl w-full mx-auto space-y-6">
        {/* Banner Alert Feedback */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/80 border-red-500/50 text-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Top Header & Fast Action Strip */}
        <div className="glass-panel rounded-2xl p-4 lg:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-slate-800">
          <div className="flex items-center space-x-3.5">
            <Link
              to="/security-head/console"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all"
              title="Back to SOC Threat Console"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold font-heading text-white">
                Security Guard <span className="text-blue-400">Tactical Roster & GPS Radar</span>
              </h1>
              <p className="text-xs text-slate-400">Personnel Onboarding, Live Geofence Positioning & Status Telemetry</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/security-head/console"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center space-x-1.5 transition-all"
            >
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span>SOC Threat Console</span>
            </Link>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-blue-600/25 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Enroll Security Guard</span>
            </button>

            <button
              onClick={loadGuards}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Refresh Roster"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Guard Status KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-4 border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Enrolled Officers</div>
            <div className="text-3xl font-extrabold text-white mt-1 font-heading">{totalGuards}</div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">B-Shield Certified Patrol</div>
          </div>

          <div className="glass-panel rounded-2xl p-4 border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>🟢 Online & Free</span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1 font-heading">{freeGuards}</div>
            <div className="text-[10px] text-emerald-500/80 mt-1">Available for 1-click dispatch</div>
          </div>

          <div className="glass-panel rounded-2xl p-4 border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>🟡 On Active Incident</span>
            </div>
            <div className="text-3xl font-extrabold text-amber-400 mt-1 font-heading">{busyGuards}</div>
            <div className="text-[10px] text-slate-500 mt-1">Responding to threat or SOS</div>
          </div>

          <div className="glass-panel rounded-2xl p-4 border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>☕ On Patrol Break</span>
            </div>
            <div className="text-3xl font-extrabold text-cyan-400 mt-1 font-heading">{breakGuards}</div>
            <div className="text-[10px] text-slate-500 mt-1">Post-patrol 15-min recovery</div>
          </div>
        </div>

        {/* Live Guard GPS Tactical Map */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
              <span>Live Guard GPS Roster (Haversine 5-Second Tactical Radar)</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">Blue Markers (🔵) = Security Force Positions</span>
          </div>

          <CampusMap guards={guards} workers={[]} incidents={[]} facilityAlerts={[]} />
        </div>

        {/* Search & Filter Bar */}
        <div className="glass-panel rounded-2xl p-4 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search guards by name, badge ID, gate, or block..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-slate-400 font-mono">Filter Status:</span>
            {['ALL', 'ONLINE_FREE', 'BUSY_ON_TASK', 'ON_BREAK', 'OFF_DUTY'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st === 'ALL'
                  ? 'All'
                  : st === 'ONLINE_FREE'
                  ? '🟢 Free'
                  : st === 'BUSY_ON_TASK'
                  ? '🟡 Busy'
                  : st === 'ON_BREAK'
                  ? '☕ Break'
                  : '🔴 Off'}
              </button>
            ))}
          </div>
        </div>

        {/* Guard Roster Table */}
        <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Officer Information</th>
                  <th className="py-3 px-4">Badge / Staff Code</th>
                  <th className="py-3 px-4">Default Gate / Post</th>
                  <th className="py-3 px-4">Live GPS Position</th>
                  <th className="py-3 px-4">Duty State</th>
                  <th className="py-3 px-4">Phone / Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredGuards.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      No guards match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredGuards.map((guard) => {
                    const dutyState = guard.duty_state || guard.status || 'OFF_DUTY';
                    const isFree = dutyState === 'ONLINE_FREE';
                    const isBusy = dutyState === 'BUSY_ON_TASK';
                    const isBreak = dutyState === 'ON_BREAK';

                    return (
                      <tr key={guard.id || guard._id || guard.staff_id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-blue-300">
                              {guard.name ? guard.name.charAt(0).toUpperCase() : 'G'}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{guard.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Registered Security Guard
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded text-[11px]">
                            {guard.staff_id || guard.badge_id}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-300 font-medium">{guard.default_gate || 'Gate-2'}</div>
                          <div className="text-[10px] text-slate-500">Designated Patrol Post</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-cyan-300 font-medium flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{guard.current_block || guard.default_gate || 'Campus Grounds'}</span>
                          </div>
                          {guard.lat && guard.lng && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              {Number(guard.lat).toFixed(4)}, {Number(guard.lng).toFixed(4)}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 border ${
                              isFree
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : isBusy
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : isBreak
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <span>
                              {isFree
                                ? '🟢 Free'
                                : isBusy
                                ? '🟡 Busy'
                                : isBreak
                                ? '☕ Break'
                                : '🔴 Off-Duty'}
                            </span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{guard.phone || '9876543101'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to="/security-head/console"
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold transition-all"
                          >
                            View in SOC
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Guard Onboarding Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel rounded-2xl p-6 border-blue-500/50 max-w-md w-full space-y-4 text-xs shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Enroll Security Guard Officer</h3>
                    <p className="text-[11px] text-slate-400">Issues 4-digit PIN for quick PWA app login.</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateGuard} className="space-y-3.5">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Guard Officer Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Vikram Singh"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9876543105"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Badge ID</label>
                    <input
                      type="text"
                      required
                      value={formData.staff_id}
                      onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                      placeholder="SEC-105"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Default Patrol Gate</label>
                    <select
                      value={formData.default_gate}
                      onChange={(e) => setFormData({ ...formData, default_gate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Gate-2">Gate-2 (Main Exit)</option>
                      <option value="Gate-1">Gate-1 (Academic Front)</option>
                      <option value="Block-A">Block-A (Patrol Post)</option>
                      <option value="Block-B">Block-B (Patrol Post)</option>
                      <option value="Library">Library Perimeter</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">4-Digit Security PIN</label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      placeholder="1111"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">GPS Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 28.6141 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">GPS Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 77.2091 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-1.5"
                  >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    <span>Confirm Enrollment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SecurityLayout>
  );
};

export default ManageGuards;
