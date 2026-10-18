import React, { useState, useEffect } from 'react';
import SecurityLayout from '../../components/SecurityLayout';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import {
  AlertTriangle,
  Flame,
  Shield,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  RefreshCw,
  Send,
  Eye,
  Check,
  XCircle,
  FileText,
} from 'lucide-react';

export const SecurityIncidentsSos = () => {
  const { notifications } = useSocket();
  const [filterState, setFilterState] = useState('ALL');
  const [toast, setToast] = useState(null);

  const [incidents, setIncidents] = useState([
    {
      id: 'INC-2026-904',
      type: 'SOS_PANIC_TRIGGER',
      severity: 'CRITICAL',
      source: 'Student Mobile Panic Button',
      location: 'Block-B • 2nd Floor • Corridor (Room 204)',
      time: '10:24:12 AM (2 min ago)',
      reportedBy: 'Aryan Sharma (STU-4912)',
      status: 'OPEN_ALERT',
      guardDispatched: 'Vikram Singh (SEC-101)',
      notes: 'Physical altercation in progress near classroom door. Rapid intervention requested.',
    },
    {
      id: 'INC-2026-903',
      type: 'VIOLENCE_FIGHT_AI',
      severity: 'HIGH',
      source: 'Vision AI Engine (CAM-01)',
      location: 'Block-B • Corridor Main Angle',
      time: '10:24:05 AM (2 min ago)',
      reportedBy: 'Autonomous Edge AI',
      status: 'DISPATCHED',
      guardDispatched: 'Vikram Singh (SEC-101)',
      notes: 'AI model detected aggressive body posturing and impact between 2 individuals with 94.8% confidence.',
    },
    {
      id: 'INC-2026-902',
      type: 'OVERCROWDING_THRESHOLD',
      severity: 'MEDIUM',
      source: 'Vision AI Engine (CAM-02)',
      location: 'Gate-1 • Turnstile & Boom Barrier',
      time: '10:18:40 AM (8 min ago)',
      reportedBy: 'Autonomous Edge AI',
      status: 'RESOLVED',
      guardDispatched: 'Rajat Kumar (SEC-102)',
      notes: 'Morning student influx exceeded 80 persons/sqm. Secondary turnstile opened.',
    },
    {
      id: 'INC-2026-901',
      type: 'PERIMETER_INTRUSION',
      severity: 'LOW',
      source: 'Infrared Fence Sensor #14',
      location: 'Sports Ground • North Boundary Wall',
      time: '08:45:00 AM (1 hr ago)',
      reportedBy: 'Hardware Sensor Mesh',
      status: 'RESOLVED',
      guardDispatched: 'Amit Yadav (SEC-103)',
      notes: 'Stray dog triggered perimeter optical line. Verified and closed.',
    },
  ]);

  const handleResolve = (id) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'RESOLVED' } : inc))
    );
    setToast({ msg: `Incident ${id} marked as RESOLVED and archived to master security audit.` });
  };

  const handleDispatch = (id) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'DISPATCHED' } : inc))
    );
    setToast({ msg: `⚡ Guard dispatched to resolve incident ${id}.` });
  };

  const filtered = incidents.filter((inc) => {
    if (filterState === 'ALL') return true;
    return inc.status === filterState;
  });

  return (
    <SecurityLayout>
      <div className="space-y-6">
        {/* Banner Alert Feedback */}
        {toast && (
          <div className="p-3.5 rounded-xl border border-emerald-500/50 bg-emerald-950/80 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toast.msg}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h1 className="text-xl font-black font-heading text-white">Emergency Incidents & SOS Panic Ledger</h1>
              <p className="text-xs text-slate-400">Real-Time Threat Management, Student Panic Triggers & Guard Response Audits</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {['ALL', 'OPEN_ALERT', 'DISPATCHED', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterState(st)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  filterState === st
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Incidents Table / Cards */}
        <div className="space-y-3">
          {filtered.map((inc) => (
            <div
              key={inc.id}
              className={`rounded-2xl border p-4.5 transition-all shadow-xl space-y-3 ${
                inc.status === 'OPEN_ALERT'
                  ? 'bg-rose-950/25 border-rose-500/50 hover:border-rose-400'
                  : inc.status === 'DISPATCHED'
                  ? 'bg-blue-950/20 border-blue-500/40 hover:border-blue-400'
                  : 'bg-[#0a0f1d] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black border ${
                      inc.severity === 'CRITICAL'
                        ? 'bg-rose-600 text-white border-rose-400 shadow-sm shadow-rose-600/40'
                        : inc.severity === 'HIGH'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>{inc.type.replace(/_/g, ' ')}</span>
                      <span className="text-[11px] font-mono text-slate-400 font-normal">#{inc.id}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>{inc.location}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                      inc.status === 'OPEN_ALERT'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : inc.status === 'DISPATCHED'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {inc.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{inc.time}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-slate-800/80 text-xs text-slate-300 font-sans leading-relaxed">
                {inc.notes}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/60 text-xs">
                <div className="text-[11px] text-slate-400 font-mono">
                  Source: <strong className="text-slate-200">{inc.source}</strong> • Assigned: <strong className="text-cyan-400">{inc.guardDispatched}</strong>
                </div>

                <div className="flex items-center space-x-2">
                  {inc.status === 'OPEN_ALERT' && (
                    <button
                      onClick={() => handleDispatch(inc.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-blue-600/30"
                    >
                      <Send className="w-3 h-3" />
                      <span>Dispatch Guard</span>
                    </button>
                  )}

                  {inc.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolve(inc.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/30"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SecurityLayout>
  );
};

export default SecurityIncidentsSos;
