import React, { useState, useEffect } from 'react';
import FacilityLayout from '../../components/FacilityLayout';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import { playWorkorderAlert } from '../../utils/soundEffects';
import MOCK_ASSETS from '../../utils/mockAssets';
import {
  ClipboardCheck,
  Zap,
  Snowflake,
  Droplets,
  Brush,
  Tv,
  Armchair,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  Filter,
  Search,
  Check,
  User,
  Image as ImageIcon,
  ChevronRight,
  Flame,
} from 'lucide-react';

export const FacilityWorkorders = () => {
  const { notifications } = useSocket();
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [toast, setToast] = useState(null);
  const [inspectPhoto, setInspectPhoto] = useState(null);

  const [workorders, setWorkorders] = useState([
    {
      id: 'TK-1042',
      title: 'AC Ghost Energy Drain & Coil Overheat',
      category: 'HVAC_AC',
      room: 'Block-B • Room 204',
      reportedBy: 'AI Energy Sentinel (Automated)',
      priority: 'HIGH',
      slaRemaining: '02:45 min',
      status: 'DISPATCHED',
      assignedTo: 'Ramesh Kumar (WRK-201)',
      notes: 'AC left running with 0 occupancy. 3.54 kW ghost load verified. Technician dispatched to reset thermostat.',
      proofPhoto: MOCK_ASSETS.evidencePhoto || MOCK_ASSETS.classroomFeed,
    },
    {
      id: 'TK-1041',
      title: 'Water Pipe Seepage Near Washroom Basin',
      category: 'PLUMBING',
      room: 'Block-A • 1st Floor East Washroom',
      reportedBy: 'Dr. Sunita Rao (Faculty)',
      priority: 'CRITICAL',
      slaRemaining: '08:12 min',
      status: 'OPEN',
      assignedTo: 'Unassigned',
      notes: 'Water continuously dripping from connector elbow. Slippage hazard near corridor.',
      proofPhoto: null,
    },
    {
      id: 'TK-1040',
      title: 'Auditorium Ceiling Projector HDMI Link Loss',
      category: 'IT_AV',
      room: 'Block-C • Main Auditorium',
      reportedBy: 'Prof. Alok Mehta (HOD CS)',
      priority: 'MEDIUM',
      slaRemaining: '24:00 min',
      status: 'OPEN',
      assignedTo: 'Unassigned',
      notes: 'Overhead projector flickering during guest lecture preparation. Cable socket check needed.',
      proofPhoto: null,
    },
    {
      id: 'TK-1039',
      title: 'Broken Desk Leg & Wooden Splinter',
      category: 'CIVIL_CARPENTRY',
      room: 'Block-B • Room 102',
      reportedBy: 'Student Council Rep',
      priority: 'LOW',
      slaRemaining: '45:00 min',
      status: 'RESOLVED',
      assignedTo: 'Suresh Patel (WRK-204)',
      notes: 'Carpentry repair completed and bolt reinforced. Tested for student seating.',
      proofPhoto: MOCK_ASSETS.classroomFeed,
    },
  ]);

  const handleDispatchRamesh = (ticketId) => {
    playWorkorderAlert();
    setWorkorders((prev) =>
      prev.map((tk) =>
        tk.id === ticketId
          ? { ...tk, status: 'DISPATCHED', assignedTo: 'Ramesh Kumar (WRK-201)' }
          : tk
      )
    );
    setToast({
      type: 'success',
      msg: `⚡ Ramesh Kumar (WRK-201) dispatched to ${ticketId}! SLA timer engaged.`,
    });
  };

  const handleResolve = (ticketId) => {
    setWorkorders((prev) =>
      prev.map((tk) => (tk.id === ticketId ? { ...tk, status: 'RESOLVED' } : tk))
    );
    setToast({
      type: 'success',
      msg: `✅ Ticket ${ticketId} signed off as RESOLVED. Evidence stored in facility log.`,
    });
  };

  const filtered = workorders.filter((tk) => {
    if (filterCategory === 'ALL') return true;
    return tk.category === filterCategory;
  });

  return (
    <FacilityLayout>
      <div className="space-y-6">
        {/* Banner Alert Feedback */}
        {toast && (
          <div className="p-3.5 rounded-xl border border-emerald-500/50 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toast.msg}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading text-slate-900">Workorders & Maintenance Operations</h1>
              <p className="text-xs text-slate-500">Autonomous Dispatching, AI Smart Worker Allocation & SLA Escalations</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['ALL', 'HVAC_AC', 'PLUMBING', 'IT_AV', 'CIVIL_CARPENTRY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Workorders List */}
        <div className="space-y-3.5">
          {filtered.map((tk) => {
            const isCritical = tk.priority === 'CRITICAL' || tk.priority === 'HIGH';
            return (
              <div
                key={tk.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                        tk.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : tk.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {tk.priority}
                    </span>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                        <span>{tk.title}</span>
                        <span className="text-[11px] font-mono text-slate-400 font-normal">#{tk.id}</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{tk.room}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">SLA TIMER</span>
                      <span className="text-xs font-bold font-mono text-amber-600">{tk.slaRemaining}</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                        tk.status === 'OPEN'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                          : tk.status === 'DISPATCHED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {tk.status}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  {tk.notes}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="text-[11px] text-slate-500">
                    Assigned: <strong className="text-blue-600 font-semibold">{tk.assignedTo}</strong> • Reporter: {tk.reportedBy}
                  </div>

                  <div className="flex items-center space-x-2">
                    {tk.proofPhoto && (
                      <button
                        onClick={() => setInspectPhoto(tk.proofPhoto)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Inspect Proof Photo</span>
                      </button>
                    )}

                    {tk.status === 'OPEN' && (
                      <button
                        onClick={() => handleDispatchRamesh(tk.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
                      >
                        <Send className="w-3 h-3" />
                        <span>AI Dispatch Ramesh</span>
                      </button>
                    )}

                    {tk.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolve(tk.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Proof Photo Modal */}
        {inspectPhoto && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-800">Technician Camera Proof Photo</span>
                <button onClick={() => setInspectPhoto(null)} className="text-slate-400 hover:text-slate-800">✕</button>
              </div>
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <img src={inspectPhoto} alt="Proof" className="w-full h-full object-cover" />
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                GPS Lat: 28.6142 N • Lng: 77.2091 E • Timestamp: Verified Live by Vision AI
              </p>
            </div>
          </div>
        )}
      </div>
    </FacilityLayout>
  );
};

export default FacilityWorkorders;
