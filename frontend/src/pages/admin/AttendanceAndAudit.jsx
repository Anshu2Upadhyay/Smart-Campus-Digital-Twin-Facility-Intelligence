import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import Navbar from '../../components/Navbar';
import AdminLayout from '../../components/AdminLayout';
import {
  Clock,
  Activity,
  Shield,
  Zap,
  Users,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  Layers,
  MapPin,
  Send,
  Coffee,
  Check,
  Building,
  UserCheck,
} from 'lucide-react';

export const AttendanceAndAudit = ({ initialTab = 'attendance', standalone = false }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'attendance' | 'audit'
  const [attendance, setAttendance] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [workorders, setWorkorders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

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
      const [attRes, logRes, incRes, woRes] = await Promise.all([
        axiosClient.get('/admin/attendance/live').catch(() => ({ data: [] })),
        axiosClient.get('/admin/audit-logs?limit=100').catch(() => ({ data: [] })),
        axiosClient.get('/security/incidents').catch(() => ({ data: [] })),
        axiosClient.get('/facility/workorders').catch(() => ({ data: [] })),
      ]);

      const attendanceData = attRes.data?.ledger || (Array.isArray(attRes.data) ? attRes.data : []);
      setAttendance(attendanceData);

      const logsData = Array.isArray(logRes.data) ? logRes.data : (logRes.data?.logs || []);
      setAuditLogs(logsData);

      const rawIncs = Array.isArray(incRes.data) ? incRes.data : (incRes.data?.incidents || []);
      const activeIncs = rawIncs.filter(
        (i) => i.status !== 'RESOLVED' && i.status !== 'DISMISSED'
      );
      setIncidents(activeIncs);

      const rawWos = Array.isArray(woRes.data) ? woRes.data : (woRes.data?.workorders || []);
      const activeWos = rawWos.filter((w) => w.status !== 'RESOLVED');
      setWorkorders(activeWos);

      // Pre-select first pending ticket if available
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
      console.error('Error fetching attendance & audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live WebSocket update sync
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
        message: `⚡ Successfully force-assigned ${overrideModal.ticketType} ticket to ${overrideModal.assignedToId}!`,
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

  // Safe Arrays for KPI Calculations
  const attendanceList = Array.isArray(attendance) ? attendance : [];
  const auditLogsList = Array.isArray(auditLogs) ? auditLogs : [];

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
    const matchesDept = deptFilter === 'ALL' || (staff.department || '').toUpperCase() === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || staff.current_state === statusFilter;
    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogsList.filter((log) => {
    const matchesSearch =
      (log.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actor_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const content = (
    <div className="space-y-6">
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

      {/* Header and Mode Selector */}
      <div className="glass-panel rounded-2xl p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
            {activeTab === 'attendance' ? (
              <Clock className="w-5 h-5 text-purple-400" />
            ) : (
              <Activity className="w-5 h-5 text-purple-400" />
            )}
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold font-heading text-white">
              {activeTab === 'attendance' ? (
                <>Live Attendance & <span className="text-purple-400">Roll-Call Ledger</span></>
              ) : (
                <>Global Notification & <span className="text-purple-400">Audit Stream</span></>
              )}
            </h1>
            <p className="text-xs text-slate-400">
              {activeTab === 'attendance'
                ? 'Real-time GPS geofence roll-call, duty states & task metrics'
                : 'Immutable second-by-second event telemetry & supervisor override'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'attendance'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Live Roll-Call</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'audit'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Audit Stream</span>
            </button>
          </div>

          {/* Trigger Force-Assign Override Button */}
          <button
            onClick={() => setOverrideModal({ ...overrideModal, open: true })}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Global Force-Assign</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* PART A: LIVE ATTENDANCE & ROLL-CALL TABLE */}
      {/* =================================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-5">
          {/* Attendance KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="glass-panel rounded-2xl p-4 border-slate-800">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total On-Duty</div>
              <div className="text-2xl font-extrabold text-white mt-1 font-heading">
                {totalStaff - offDutyCount} / {totalStaff}
              </div>
              <div className="text-[10px] text-purple-400 mt-1 font-mono">{attendanceRate}% Roll-Call Rate</div>
            </div>

            <div className="glass-panel rounded-2xl p-4 border-slate-800">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>🟢 Free for Tasks</span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-heading">{onlineFreeCount}</div>
              <div className="text-[10px] text-slate-500 mt-1">Ready for instant dispatch</div>
            </div>

            <div className="glass-panel rounded-2xl p-4 border-slate-800">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>🟡 Active on Task</span>
              </div>
              <div className="text-2xl font-extrabold text-amber-400 mt-1 font-heading">{busyCount}</div>
              <div className="text-[10px] text-slate-500 mt-1">Responding / In-progress</div>
            </div>

            <div className="glass-panel rounded-2xl p-4 border-slate-800">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Coffee className="w-3 h-3 text-cyan-400" />
                <span>☕ On Break</span>
              </div>
              <div className="text-2xl font-extrabold text-cyan-400 mt-1 font-heading">{onBreakCount}</div>
              <div className="text-[10px] text-slate-500 mt-1">Authorized rest period</div>
            </div>

            <div className="glass-panel rounded-2xl p-4 border-slate-800">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                <span>🔴 Off-Duty</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-400 mt-1 font-heading">{offDutyCount}</div>
              <div className="text-[10px] text-slate-500 mt-1">Not clocked-in today</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="glass-panel rounded-2xl p-4 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, ID, or zone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300"
              >
                <option value="ALL">All Roles</option>
                <option value="SECURITY_GUARD">Security Guards</option>
                <option value="GROUND_WORKER">Ground Technicians</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300"
              >
                <option value="ALL">All States</option>
                <option value="ONLINE_FREE">🟢 Free</option>
                <option value="BUSY_ON_TASK">🟡 On-Task</option>
                <option value="ON_BREAK">☕ Break</option>
                <option value="OFF_DUTY">🔴 Off-Duty</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Staff Personnel</th>
                    <th className="py-3 px-4">Role & Trade</th>
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
                      <tr key={staff.user_id || staff.staff_id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{staff.name}</div>
                          <div className="text-[11px] text-cyan-400 font-mono font-semibold">{staff.staff_id}</div>
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
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition-all"
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
        </div>
      )}

      {/* =================================================================== */}
      {/* PART B: GLOBAL AUDIT STREAM & EVENT BUS */}
      {/* =================================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-5">
          {/* Audit Controls & Severity Filter */}
          <div className="glass-panel rounded-2xl p-4 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audit stream events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-xs font-mono">Severity:</span>
              {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                    severityFilter === sev
                      ? sev === 'CRITICAL'
                        ? 'bg-red-600 text-white'
                        : sev === 'WARNING'
                        ? 'bg-amber-500 text-slate-950'
                        : sev === 'INFO'
                        ? 'bg-blue-600 text-white'
                        : 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Stream Feed */}
          <div className="glass-panel rounded-2xl p-5 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Second-by-Second Campus Audit Stream ({filteredAuditLogs.length} events)</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">Live WebSocket Ingestion</span>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-2">
              {filteredAuditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  No audit log records found matching current criteria.
                </div>
              ) : (
                filteredAuditLogs.map((log) => {
                  const isCrit = log.severity === 'CRITICAL';
                  const isWarn = log.severity === 'WARNING';

                  return (
                    <div
                      key={log.id || log._id}
                      className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isCrit
                          ? 'bg-red-950/30 border-red-500/50 hover:bg-red-950/40'
                          : isWarn
                          ? 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-950/40'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                              isCrit
                                ? 'bg-red-600 text-white animate-pulse'
                                : isWarn
                                ? 'bg-amber-500 text-slate-950 font-extrabold'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {log.severity || 'INFO'}
                          </span>
                          <span className="font-bold text-slate-200 text-sm">{log.title}</span>
                          {log.event_type && (
                            <span className="text-[10px] text-cyan-400 font-mono">[{log.event_type}]</span>
                          )}
                        </div>

                        <p className="text-slate-400 text-xs leading-relaxed">{log.description}</p>

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="text-[10px] text-slate-500 font-mono pt-1">
                            {Object.entries(log.metadata)
                              .slice(0, 3)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' | ')}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[11px] text-slate-400 font-mono">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {log.actor_name || 'System Auto-Pilot'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* GLOBAL OVERRIDE FORCE ASSIGN MODAL */}
      {/* =================================================================== */}
      {overrideModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 border-amber-500/50 max-w-lg w-full space-y-4 text-xs shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Super Admin Ticket Override</h3>
                  <p className="text-[11px] text-slate-400">Force-assign pending incidents directly to any guard or technician.</p>
                </div>
              </div>
              <button
                onClick={() => setOverrideModal({ ...overrideModal, open: false })}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteOverride} className="space-y-3.5">
              {/* Ticket Type */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Incident Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOverrideModal({ ...overrideModal, ticketType: 'SECURITY', ticketId: '' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                      overrideModal.ticketType === 'SECURITY'
                        ? 'bg-red-600/30 border-red-500 text-red-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Security Threat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideModal({ ...overrideModal, ticketType: 'FACILITY', ticketId: '' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                      overrideModal.ticketType === 'FACILITY'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Facility Workorder</span>
                  </button>
                </div>
              </div>

              {/* Select Active Ticket */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Select Pending Target Ticket</label>
                <select
                  value={overrideModal.ticketId}
                  onChange={(e) => setOverrideModal({ ...overrideModal, ticketId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                >
                  <option value="">-- Choose Active Ticket --</option>
                  {overrideModal.ticketType === 'SECURITY'
                    ? incidents.map((inc) => (
                        <option key={inc.id || inc._id} value={inc.id || inc._id}>
                          {inc.incident_type} @ {inc.location_name} ({inc.status})
                        </option>
                      ))
                    : workorders.map((wo) => (
                        <option key={wo.id || wo._id} value={wo.id || wo._id}>
                          {wo.title || wo.category} @ {wo.location_name || wo.block_name} ({wo.status})
                        </option>
                      ))}
                </select>
                <div className="mt-1 text-[10px] text-slate-400 font-mono">
                  Or type custom ID:{' '}
                  <input
                    type="text"
                    value={overrideModal.ticketId}
                    onChange={(e) => setOverrideModal({ ...overrideModal, ticketId: e.target.value })}
                    placeholder="e.g. 660f... / INC-101"
                    className="ml-1 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-cyan-300 font-mono w-48"
                  />
                </div>
              </div>

              {/* Target Staff Member */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Designate Target Staff ID</label>
                <select
                  value={overrideModal.assignedToId}
                  onChange={(e) => setOverrideModal({ ...overrideModal, assignedToId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                >
                  <option value="">-- Choose On-Duty Staff Personnel --</option>
                  {attendance
                    .filter((s) =>
                      overrideModal.ticketType === 'SECURITY'
                        ? s.role === 'SECURITY_GUARD'
                        : s.role === 'GROUND_WORKER'
                    )
                    .map((s) => (
                      <option key={s.staff_id} value={s.staff_id}>
                        {s.name} ({s.staff_id}) - {s.current_state} - {s.live_zone}
                      </option>
                    ))}
                </select>
                <div className="mt-1 text-[10px] text-slate-400 font-mono">
                  Or manual Staff Code:{' '}
                  <input
                    type="text"
                    value={overrideModal.assignedToId}
                    onChange={(e) => setOverrideModal({ ...overrideModal, assignedToId: e.target.value })}
                    placeholder="SEC-101, WRK-201..."
                    className="ml-1 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-cyan-300 font-mono font-bold w-40"
                  />
                </div>
              </div>

              {/* Justification Notes */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Admin Operational Justification</label>
                <input
                  type="text"
                  value={overrideModal.notes}
                  onChange={(e) => setOverrideModal({ ...overrideModal, notes: e.target.value })}
                  placeholder="Reason for immediate force override..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModal({ ...overrideModal, open: false })}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOverride}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow-lg shadow-amber-400/20 flex items-center justify-center space-x-1.5"
                >
                  {submittingOverride ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Execute Force Assign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (standalone) {
    return (
      <AdminLayout>
        <div className="max-w-7xl w-full mx-auto">{content}</div>
      </AdminLayout>
    );
  }

  return content;
};

export default AttendanceAndAudit;
