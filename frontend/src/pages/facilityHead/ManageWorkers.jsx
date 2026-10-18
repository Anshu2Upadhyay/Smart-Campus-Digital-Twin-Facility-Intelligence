import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import FacilityLayout from '../../components/FacilityLayout';
import {
  Wrench,
  Zap,
  Droplet,
  Sparkles,
  Tv,
  Hammer,
  UserPlus,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Users,
  Check,
  Building,
  Activity,
  Layers,
} from 'lucide-react';

const DEPARTMENT_CONFIG = {
  ELECTRICAL: { label: 'Electrical & Power', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  HVAC_AC: { label: 'HVAC & Air Conditioning', icon: Building, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  PLUMBING: { label: 'Plumbing & Drainage', icon: Droplet, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  HOUSEKEEPING: { label: 'Housekeeping & Sanitation', icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  IT_AV: { label: 'IT Infrastructure & AV', icon: Tv, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  CIVIL_CARPENTRY: { label: 'Civil & Carpentry', icon: Hammer, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
};

export const ManageWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [departmentSummary, setDepartmentSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // New Worker Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    staff_id: 'WRK-207',
    department: 'ELECTRICAL',
    pin: '2222',
    default_block: 'Block-A',
    floor: 1,
    lat: 28.6135,
    lng: 77.2085,
  });
  const [submitting, setSubmitting] = useState(false);

  const { notifications } = useSocket();

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/facility/workers');
      const data = res.data;

      const workerList = Array.isArray(data) ? data : data?.workers || [];
      setWorkers(workerList);

      if (data?.department_summary) {
        setDepartmentSummary(data.department_summary);
      } else {
        // Fallback aggregate from workerList
        const summary = {};
        Object.keys(DEPARTMENT_CONFIG).forEach((dept) => {
          summary[dept] = { ONLINE_FREE: 0, BUSY_ON_TASK: 0, ON_BREAK: 0, OFF_DUTY: 0, total: 0 };
        });
        workerList.forEach((w) => {
          const dept = (w.department || 'HOUSEKEEPING').toUpperCase();
          const state = (w.duty_state || w.status || 'ONLINE_FREE').toUpperCase();
          if (summary[dept]) {
            if (summary[dept][state] !== undefined) summary[dept][state]++;
            summary[dept].total++;
          }
        });
        setDepartmentSummary(summary);
      }
    } catch (err) {
      console.error('Error fetching facility workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  // Sync on live WebSocket alerts
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      loadWorkers();
    }
  }, [notifications]);

  // Create Ground Worker
  const handleCreateWorker = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);
      await axiosClient.post('/facility/create-worker', {
        name: formData.name,
        phone: formData.phone,
        badge_id: formData.staff_id,
        staff_id: formData.staff_id,
        department: formData.department,
        pin: formData.pin,
        default_block: formData.default_block,
        floor: parseInt(formData.floor) || 1,
        lat: parseFloat(formData.lat) || 28.6135,
        lng: parseFloat(formData.lng) || 77.2085,
      });

      setFeedback({
        type: 'success',
        message: `🔧 Ground Technician '${formData.name}' registered under ${formData.department} trade with PIN ${formData.pin}!`,
      });
      setShowAddModal(false);

      const nextId = Math.floor(208 + Math.random() * 20);
      setFormData({
        name: '',
        phone: '',
        staff_id: `WRK-${nextId}`,
        department: 'ELECTRICAL',
        pin: '2222',
        default_block: 'Block-A',
        floor: 1,
        lat: 28.6135,
        lng: 77.2085,
      });

      loadWorkers();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to enroll ground technician.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalWorkers = workers.length;
  const freeWorkers = workers.filter(
    (w) => (w.duty_state || w.status) === 'ONLINE_FREE'
  ).length;
  const busyWorkers = workers.filter(
    (w) => (w.duty_state || w.status) === 'BUSY_ON_TASK'
  ).length;

  // Filtered workers list
  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      (worker.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (worker.staff_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (worker.current_block || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (worker.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      selectedDeptFilter === 'ALL' || (worker.department || '').toUpperCase() === selectedDeptFilter;
    const duty = (worker.duty_state || worker.status || 'ONLINE_FREE').toUpperCase();
    const matchesStatus = selectedStatusFilter === 'ALL' || duty === selectedStatusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <FacilityLayout>
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

        {/* Top Header */}
        <div className="glass-panel rounded-2xl p-4 lg:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-slate-800">
          <div className="flex items-center space-x-3.5">
            <Link
              to="/facility-head/console"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all"
              title="Back to Facility Supervisor Console"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold font-heading text-white">
                6-Department <span className="text-emerald-400">Ground Workforce Matrix</span>
              </h1>
              <p className="text-xs text-slate-400">Trade Personnel Onboarding, Live GPS Zoning & Multi-Trade Roster</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/facility-head/console"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center space-x-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Facility Console</span>
            </Link>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-600/25 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Enroll Ground Worker</span>
            </button>

            <button
              onClick={loadWorkers}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Refresh Roster"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* 6-DEPARTMENT WORKFORCE SUMMARY MATRIX */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>6-Trade Workforce Capacity Matrix (Click card to filter table)</span>
            </h2>
            <div className="text-xs text-slate-400 font-mono">
              Total Force: <strong className="text-white">{totalWorkers}</strong> | Free:{' '}
              <strong className="text-emerald-400">{freeWorkers}</strong> | Busy:{' '}
              <strong className="text-amber-400">{busyWorkers}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {Object.entries(DEPARTMENT_CONFIG).map(([deptKey, config]) => {
              const IconComp = config.icon;
              const stats = departmentSummary[deptKey] || { ONLINE_FREE: 0, BUSY_ON_TASK: 0, total: 0 };
              const isSelected = selectedDeptFilter === deptKey;

              return (
                <div
                  key={deptKey}
                  onClick={() => setSelectedDeptFilter(isSelected ? 'ALL' : deptKey)}
                  className={`glass-panel rounded-2xl p-3.5 border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-xl ${config.bg}`}>
                      <IconComp className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {stats.total || 0} Staff
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <div className="text-[11px] font-bold text-slate-200 truncate">{config.label}</div>
                    <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">{stats.ONLINE_FREE || 0} Free</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-amber-400 font-bold">{stats.BUSY_ON_TASK || 0} Busy</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="glass-panel rounded-2xl p-4 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search technician by name, staff ID, or trade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Trade Filter Dropdown */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300"
            >
              <option value="ALL">All 6 Departments</option>
              <option value="ELECTRICAL">⚡ Electrical & Power</option>
              <option value="HVAC_AC">❄️ HVAC & Air Conditioning</option>
              <option value="PLUMBING">🚰 Plumbing & Drainage</option>
              <option value="HOUSEKEEPING">✨ Housekeeping & Sanitation</option>
              <option value="IT_AV">💻 IT & AV Infrastructure</option>
              <option value="CIVIL_CARPENTRY">🔨 Civil & Carpentry</option>
            </select>

            {/* Duty Status Filter Dropdown */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300"
            >
              <option value="ALL">All States</option>
              <option value="ONLINE_FREE">🟢 Free</option>
              <option value="BUSY_ON_TASK">🟡 Busy</option>
              <option value="ON_BREAK">☕ Break</option>
              <option value="OFF_DUTY">🔴 Off-Duty</option>
            </select>
          </div>
        </div>

        {/* Worker Roster Table */}
        <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Ground Technician</th>
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Department / Trade</th>
                  <th className="py-3 px-4">Live Building & Floor Zone</th>
                  <th className="py-3 px-4">Duty State</th>
                  <th className="py-3 px-4">Phone / Contact</th>
                  <th className="py-3 px-4">Tasks Done</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500">
                      <Wrench className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      No ground technicians match current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => {
                    const dutyState = (worker.duty_state || worker.status || 'ONLINE_FREE').toUpperCase();
                    const isFree = dutyState === 'ONLINE_FREE';
                    const isBusy = dutyState === 'BUSY_ON_TASK';
                    const isBreak = dutyState === 'ON_BREAK';
                    const deptKey = (worker.department || 'HOUSEKEEPING').toUpperCase();
                    const deptCfg = DEPARTMENT_CONFIG[deptKey] || DEPARTMENT_CONFIG.HOUSEKEEPING;

                    return (
                      <tr key={worker.id || worker._id || worker.staff_id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300">
                              {worker.name ? worker.name.charAt(0).toUpperCase() : 'W'}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{worker.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Certified Ground Technician
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded text-[11px]">
                            {worker.staff_id || worker.badge_id}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                            <deptCfg.icon className={`w-3.5 h-3.5 ${deptCfg.color}`} />
                            <span>{deptCfg.label}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-cyan-300 font-medium flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>
                              {worker.current_block || worker.default_block || 'Block-B'} • Floor{' '}
                              {worker.floor || worker.current_floor || 1}
                            </span>
                          </div>
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
                            <span>{worker.phone || '9876543201'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                          {worker.tasks_completed || 0}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to="/facility-head/console"
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold transition-all"
                          >
                            View Console
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

        {/* Worker Onboarding Modal Form */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel rounded-2xl p-6 border-emerald-500/50 max-w-md w-full space-y-4 text-xs shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Enroll Ground Worker</h3>
                    <p className="text-[11px] text-slate-400">Assigns trade department & 4-digit PIN for mobile app.</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateWorker} className="space-y-3.5">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Worker Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
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
                      placeholder="9876543205"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Staff Code / Badge ID</label>
                    <input
                      type="text"
                      required
                      value={formData.staff_id}
                      onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                      placeholder="WRK-207"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                  </div>
                </div>

                {/* 6 Trade Department Dropdown */}
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Maintenance Trade Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    <option value="ELECTRICAL">⚡ ELECTRICAL (AC, Wiring, Sub-Stations, Lighting)</option>
                    <option value="HVAC_AC">❄️ HVAC_AC (Chillers, Ducting, Central Air)</option>
                    <option value="PLUMBING">🚰 PLUMBING (Pipes, Taps, Tanks, Drainage)</option>
                    <option value="HOUSEKEEPING">✨ HOUSEKEEPING (Sanitation, Waste, Disinfection)</option>
                    <option value="IT_AV">💻 IT_AV (Projectors, Smart Boards, Wi-Fi, Racks)</option>
                    <option value="CIVIL_CARPENTRY">🔨 CIVIL_CARPENTRY (Desks, Doors, Locks, Windows)</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Default Block</label>
                    <select
                      value={formData.default_block}
                      onChange={(e) => setFormData({ ...formData, default_block: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white"
                    >
                      <option value="Block-A">Block-A</option>
                      <option value="Block-B">Block-B</option>
                      <option value="Block-C">Block-C</option>
                      <option value="Central Library">Library</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Floor</label>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white"
                    >
                    </input>
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">4-Digit PIN</label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      placeholder="2222"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white font-mono text-center tracking-widest font-bold"
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
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-1.5"
                  >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                    <span>Confirm Enrollment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </FacilityLayout>
  );
};

export default ManageWorkers;
