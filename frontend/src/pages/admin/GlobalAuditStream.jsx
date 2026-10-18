import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import AdminLayout from '../../components/AdminLayout';
import {
  Activity,
  Shield,
  Zap,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  Layers,
  Clock,
  Terminal,
  FileText
} from 'lucide-react';

export const GlobalAuditStream = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  const { notifications } = useSocket();

  const loadLogs = async () => {
    try {
      setLoading(true);
      const logRes = await axiosClient.get('/admin/audit-logs?limit=100').catch(() => ({ data: [] }));
      const logsData = Array.isArray(logRes.data) ? logRes.data : (logRes.data?.logs || []);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Error fetching global audit stream:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      loadLogs();
    }
  }, [notifications]);

  const auditLogsList = Array.isArray(auditLogs) ? auditLogs : [];

  // KPI Calculations
  const totalEvents = auditLogsList.length;
  const criticalCount = auditLogsList.filter((l) => l.severity === 'CRITICAL' || l.severity === 'ERROR').length;
  const warningCount = auditLogsList.filter((l) => l.severity === 'WARNING').length;
  const infoCount = auditLogsList.filter((l) => l.severity === 'INFO' || !l.severity).length;

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogsList.filter((log) => {
    const matchesSearch =
      (log.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.event_type || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
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
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Dedicated Header */}
        <div className="rounded-2xl p-5 border border-slate-800 bg-[#0a0f1d] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black font-heading text-white">
                  Global Audit Stream
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                  Tamper-Evident Ledger
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Immutable second-by-second security, energy, camera, and system operations event stream.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer"
              title="Refresh Audit Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Live Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Audit Stream KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-2xl p-4 border border-slate-800 bg-[#0c1222] shadow-md">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Stream Events</div>
            <div className="text-2xl font-extrabold text-white mt-1 font-heading">{totalEvents}</div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">Last 100 ingested entries</div>
          </div>

          <div className="rounded-2xl p-4 border border-slate-800 bg-[#0c1222] shadow-md">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>🔴 Critical Incidents</span>
            </div>
            <div className="text-2xl font-extrabold text-rose-400 mt-1 font-heading">{criticalCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">High-priority breach / alarm</div>
          </div>

          <div className="rounded-2xl p-4 border border-slate-800 bg-[#0c1222] shadow-md">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>🟡 Warning Signals</span>
            </div>
            <div className="text-2xl font-extrabold text-amber-400 mt-1 font-heading">{warningCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Ghost loads / geofence exits</div>
          </div>

          <div className="rounded-2xl p-4 border border-slate-800 bg-[#0c1222] shadow-md">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>🔵 Info & Telemetry</span>
            </div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-1 font-heading">{infoCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Check-ins & system heartbeats</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl p-4 border border-slate-800 bg-[#0a0f1d] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search audit events, actors, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-slate-400 text-xs font-mono mr-1">Severity:</span>
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                  severityFilter === sev
                    ? sev === 'CRITICAL'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                      : sev === 'WARNING'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                      : sev === 'INFO'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Stream List */}
        <div className="rounded-2xl p-5 border border-slate-800/80 bg-[#0a0f1d] space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">
                Live Chronological Event Log ({filteredAuditLogs.length} events)
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-slate-400 font-mono">Live Ingestion Active</span>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-2">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                No audit events found matching query.
              </div>
            ) : (
              filteredAuditLogs.map((log, index) => {
                const sev = log.severity || 'INFO';
                const isCrit = sev === 'CRITICAL' || sev === 'ERROR';
                const isWarn = sev === 'WARNING';

                return (
                  <div
                    key={log.id || log._id || index}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isCrit
                        ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-500/60'
                        : isWarn
                        ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-500/60'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isCrit
                            ? 'bg-rose-500/20 text-rose-400'
                            : isWarn
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-cyan-500/20 text-cyan-400'
                        }`}
                      >
                        {isCrit ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : isWarn ? (
                          <Zap className="w-4 h-4" />
                        ) : (
                          <Activity className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-xs">
                            {log.title || log.event_type || 'System Event'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              isCrit
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : isWarn
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            }`}
                          >
                            {sev}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {log.description || log.message || 'No description recorded.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0 text-right font-mono text-[11px] text-slate-400">
                      <div>
                        <div className="text-white font-medium">
                          {log.actor_name || log.created_by || 'SYSTEM_DAEMON'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {log.timestamp
                            ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : 'Live'}
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-600 -rotate-90" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Log Detail Inspector Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">Audit Event Inspector</h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Event Title:</span>
                  <div className="text-white font-bold mt-0.5">{selectedLog.title || selectedLog.event_type}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold">Description:</span>
                  <div className="text-slate-200 mt-0.5">{selectedLog.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-slate-400 font-semibold">Actor / System:</span>
                    <div className="text-cyan-400 font-mono mt-0.5">{selectedLog.actor_name || 'SYSTEM_DAEMON'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Severity:</span>
                    <div className="text-white font-mono mt-0.5">{selectedLog.severity || 'INFO'}</div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold">Raw Ingested Payload:</span>
                  <pre className="mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-emerald-400 font-mono overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default GlobalAuditStream;
