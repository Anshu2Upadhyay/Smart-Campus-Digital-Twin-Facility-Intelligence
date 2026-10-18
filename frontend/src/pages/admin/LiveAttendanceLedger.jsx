import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import AdminLayout from '../../components/AdminLayout';
import {
  Clock,
  Shield,
  Zap,
  Users,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Send,
  Coffee,
  Check,
  Building,
  UserCheck,
  ChevronRight,
  Activity,
  Phone
} from 'lucide-react';

export const LiveAttendanceLedger = () => {
  const [attendance, setAttendance] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [workorders, setWorkorders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Global Override Modal State
  const [overrideModal, setOverrideModal] = useState({
    open: false,
    ticketType: 'SECURITY',
    ticketId: '',
    assignedToId: '',
    notes: 'Admin manual force dispatch override via Command Center.',
  });
  const [submittingOverride, setSubmittingOverride] = useState(false);

  const { notifications } = useSocket();

  const loadData = async () => {
    try {
      setLoading(true);
      const [attRes, incRes, woRes] = await Promise.all([
        axiosClient.get('/admin/attendance/live').catch(() => ({ data: [] })),
        axiosClient.get('/security/incidents').catch(() => ({ data: [] })),
        axiosClient.get('/facility/workorders').catch(() => ({ data: [] })),
      ]);

      const attendanceData = attRes.data?.ledger || (Array.isArray(attRes.data) ? attRes.data : []);
      setAttendance(attendanceData);

      const rawIncs = Array.isArray(incRes.data) ? incRes.data : (incRes.data?.incidents || []);
      const activeIncs = rawIncs.filter(
        (i) => i.status !== 'RESOLVED' && i.status !== 'DISMISSED'
      );
      setIncidents(activeIncs);

      const rawWos = Array.isArray(woRes.data) ? woRes.data : (woRes.data?.workorders || []);
      const activeWos = rawWos.filter((w) => w.status !== 'RESOLVED');
      setWorkorders(activeWos);

      if (activeIncs.length > 0 && !overrideModal.ticketId) {
        setOverrideModal((prev) => ({
          ...prev,
          ticketType: 'SECURITY',
          ticketId: activeIncs[0].id || activeIncs[0]._id,
        }));
      } else if (activeWos.length > 0 && !overrideModal.ticketId) {
        setOverrideModal((prev) => ({
          ...prev,
          ticketType: 'FACILITY',
          ticketId: activeWos[0].id || activeWos[0]._id,
        }));
      }
    } catch (err) {
      console.error('Error fetching attendance ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      loadData();
    }
  }, [notifications]);

  // Execute Global Force-Assign Override
  const handleExecuteOverride = async (e) => {
    e.preventDefault();
    if (!overrideModal.ticketId || !overrideModal.assignedToId) {
      setFeedback({ type: 'error', message: 'Please select or provide both a Ticket ID and Target Staff ID.' });
      return;
    }

    try {
      setSubmittingOverride(true);
      setFeedback(null);
      await axiosClient.post('/admin/override-assign', {
        ticket_type: overrideModal.ticketType,
        ticket_id: overrideModal.ticketId,
        assigned_to_id: overrideModal.assignedToId,
        staff_id_or_user_id: overrideModal.assignedToId,
        notes: overrideModal.notes,
      });

      setFeedback({
        type: 'success',
        message: `⚡ Successfully dispatched ${overrideModal.ticketType} ticket to ${overrideModal.assignedToId}!`,
      });
      setOverrideModal((prev) => ({ ...prev, open: false }));
      loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to execute global force assign override.',
      });
    } finally {
      setSubmittingOverride(false);
    }
  };

  const attendanceList = Array.isArray(attendance) ? attendance : [];

  // KPI Calculations
  const totalStaff = attendanceList.length;
  const onlineFreeCount = attendanceList.filter((s) => s.current_state === 'ONLINE_FREE').length;
  const busyCount = attendanceList.filter((s) => s.current_state === 'BUSY_ON_TASK').length;
  const onBreakCount = attendanceList.filter((s) => s.current_state === 'ON_BREAK').length;
  const offDutyCount = attendanceList.filter((s) => s.current_state === 'OFF_DUTY').length;
  const attendanceRate = totalStaff > 0 ? Math.round(((totalStaff - offDutyCount) / totalStaff) * 100) : 100;

  // Filtered Attendance Rows
  const filteredAttendance = attendanceList.filter((staff) => {
    const matchesSearch =
      (staff.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.staff_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.live_zone || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || staff.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || staff.current_state === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 bg-[#070b14] text-slate-100">
        {/* Toast Feedback */}
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

        {/* Dedicated Page Header */}
        <div className="rounded-2xl p-5 border border-slate-800 bg-[#0a0f1d] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black font-heading text-white">
                  Live Attendance Ledger
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono">
                  Real-time Roll-Call
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Live staff attendance, geofence zones, duty states & biometric check-in stream.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Global Force Assign Button */}
            <button
              onClick={() => setOverrideModal({ ...overrideModal, open: true })}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Global Force-Assign</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer"
              title="Refresh Ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Attendance KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="rounded-2xl p-4 border border-slate-800 bg-[#0c1222] shadow-md">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total On-Duty</div>
            <div className="text-2xl font-extrabold text-white mt-1 font-heading">
              {totalStaff - offDutyCount} <span className="text-sm font-normal text-slate-500">/ {totalStaff}</span>
            </div>
            <div className="text-[10px] text-purple-400 mt-1 font-mono font-bold">{attendanceRate}% Roll-Call Rate</div>
          </div>

          <div className="rounded-2xl p-4 border border-slate-800 bg-[#0c1222] shadow-md">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>🟢 Free for Tasks</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-heading">{onlineFreeCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Ready for instant dispatch</div>
          </div>

          <div className="rounded-2xl p-4 border border-slate-800 bg-[#0c1222] shadow-md">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>🟡 Active on Task</span>
            </div>
            <div className="text-2xl font-extrabold text-amber-400 mt-1 font-heading">{busyCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Responding / in-progress</div>
          </div>

          <div className="rounded-2xl p-4 border border-slate-800 bg-[#0c1222] shadow-md">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Coffee className="w-3 h-3 text-cyan-400" />
              <span>☕ On Break</span>
            </div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-1 font-heading">{onBreakCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Authorized rest period</div>
          </div>

          <div className="rounded-2xl p-4 border border-slate-800 bg-[#0c1222] shadow-md">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-600"></span>
              <span>🔴 Off-Duty</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-400 mt-1 font-heading">{offDutyCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Not clocked-in today</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl p-4 border border-slate-800 bg-[#0a0f1d] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, ID, or zone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Roles</option>
              <option value="SECURITY_GUARD">🛡️ Security Guards</option>
              <option value="GROUND_WORKER">🔧 Ground Technicians</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All States</option>
              <option value="ONLINE_FREE">🟢 Free</option>
              <option value="BUSY_ON_TASK">🟡 On-Task</option>
              <option value="ON_BREAK">☕ Break</option>
              <option value="OFF_DUTY">🔴 Off-Duty</option>
            </select>
          </div>
        </div>

        {/* Staff Attendance Ledger Table */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0a0f1d] overflow-hidden shadow-2xl">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Staff Roster & Biometric Status ({filteredAttendance.length})</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Live GPS Geofence Tracked</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Staff Personnel</th>
                  <th className="py-3 px-4">Role & Department</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4">Live GPS Geofence Zone</th>
                  <th className="py-3 px-4">Duty State</th>
                  <th className="py-3 px-4">Tasks Completed</th>
                  <th className="py-3 px-4 text-right">Quick Force Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      No staff records match current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((staff) => (
                    <tr key={staff.user_id || staff.staff_id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                            {staff.name ? staff.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{staff.name}</div>
                            <div className="text-[11px] text-cyan-400 font-mono font-semibold">{staff.staff_id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            staff.role === 'SECURITY_GUARD'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {staff.role === 'SECURITY_GUARD' ? '🛡️ Guard' : '🔧 Technician'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 uppercase font-mono">
                          {staff.department || 'GENERAL'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                        {staff.check_in_time ? (
                          <div className="flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{new Date(staff.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Not Checked In</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-cyan-300 font-medium flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{staff.live_zone || 'Campus Grounds'}</span>
                        </div>
                        {staff.current_floor !== undefined && staff.current_floor > 0 && (
                          <div className="text-[10px] text-slate-400 font-mono">Floor {staff.current_floor}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 border ${
                            staff.current_state === 'ONLINE_FREE'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : staff.current_state === 'BUSY_ON_TASK'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : staff.current_state === 'ON_BREAK'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          <span>
                            {staff.current_state === 'ONLINE_FREE'
                              ? '🟢 Free'
                              : staff.current_state === 'BUSY_ON_TASK'
                              ? '🟡 On-Task'
                              : staff.current_state === 'ON_BREAK'
                              ? '☕ Break'
                              : '🔴 Off-Duty'}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {staff.tasks_completed || 0} tasks
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() =>
                            setOverrideModal({
                              ...overrideModal,
                              open: true,
                              assignedToId: staff.staff_id,
                              ticketType: staff.role === 'SECURITY_GUARD' ? 'SECURITY' : 'FACILITY',
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          ⚡ Assign Ticket
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Force-Assign Override Modal */}
        {overrideModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-base">Global Dispatch Override</h3>
                </div>
                <button
                  onClick={() => setOverrideModal((prev) => ({ ...prev, open: false }))}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleExecuteOverride} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Department</label>
                  <select
                    value={overrideModal.ticketType}
                    onChange={(e) =>
                      setOverrideModal((prev) => ({
                        ...prev,
                        ticketType: e.target.value,
                        ticketId:
                          e.target.value === 'SECURITY'
                            ? incidents[0]?.id || incidents[0]?._id || ''
                            : workorders[0]?.id || workorders[0]?._id || '',
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="SECURITY">🛡️ Security Incident</option>
                    <option value="FACILITY">🔧 Facility Workorder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Staff ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GRD-101 or WKR-201"
                    value={overrideModal.assignedToId}
                    onChange={(e) => setOverrideModal((prev) => ({ ...prev, assignedToId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Active Ticket ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INC-001 or WO-002"
                    value={overrideModal.ticketId}
                    onChange={(e) => setOverrideModal((prev) => ({ ...prev, ticketId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supervisor Directives</label>
                  <textarea
                    rows="2"
                    value={overrideModal.notes}
                    onChange={(e) => setOverrideModal((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOverrideModal((prev) => ({ ...prev, open: false }))}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingOverride}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center space-x-1"
                  >
                    {submittingOverride ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Force Assign</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default LiveAttendanceLedger;
