import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import {
  Users,
  UserPlus,
  Shield,
  Zap,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building,
  ArrowRight,
  Trash2,
  Eye,
  EyeOff,
  Search,
  UserX,
  X,
  Check,
  Video,
  Sliders,
  Camera,
  Settings,
} from 'lucide-react';

export const ManageHeads = ({ onRefreshData }) => {
  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmHead, setDeleteConfirmHead] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'SECURITY_HEAD',
    department: 'SECURITY',
  });

  // Camera Access Control States
  const [availableCameras, setAvailableCameras] = useState([]);
  const [cameraAccessMode, setCameraAccessMode] = useState('ALL'); // 'ALL' | 'CUSTOM'
  const [selectedCameraIds, setSelectedCameraIds] = useState([]);

  // Modal to edit camera permissions on existing head
  const [editPermissionsHead, setEditPermissionsHead] = useState(null);
  const [editAccessMode, setEditAccessMode] = useState('ALL');
  const [editSelectedCameraIds, setEditSelectedCameraIds] = useState([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const loadHeads = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/admin/heads');
      setHeads(res.data || []);
    } catch (err) {
      console.error('Error fetching department heads:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCameras = async () => {
    try {
      const res = await axiosClient.get('/admin/cctv/streams');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setAvailableCameras(res.data);
        return;
      }
      const sRes = await axiosClient.get('/spatial/layout');
      if (sRes.data?.blocks) {
        const cams = [];
        sRes.data.blocks.forEach((b) => {
          (b.floors || []).forEach((f) => {
            (f.cameras || []).forEach((c) => {
              cams.push({
                camera_id: c.camera_id,
                camera_name: c.name || c.camera_id,
                block_name: b.block_name,
                floor_number: f.floor_number,
                room_number: c.room_number || '',
              });
            });
          });
        });
        setAvailableCameras(cams);
      }
    } catch (err) {
      console.warn('Could not load camera list:', err);
    }
  };

  useEffect(() => {
    loadHeads();
    loadAvailableCameras();
  }, []);

  const handleRoleChange = (selectedRole) => {
    setFormData((prev) => ({
      ...prev,
      role: selectedRole,
      department: selectedRole === 'SECURITY_HEAD' ? 'SECURITY' : 'FACILITY_MANAGEMENT',
    }));
  };

  const toggleCameraSelection = (camId) => {
    setSelectedCameraIds((prev) =>
      prev.includes(camId) ? prev.filter((id) => id !== camId) : [...prev, camId]
    );
  };

  const selectAllCameras = () => {
    setSelectedCameraIds(availableCameras.map((c) => c.camera_id));
  };

  const clearAllCameras = () => {
    setSelectedCameraIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const payload = {
      ...formData,
      allowed_cameras: cameraAccessMode === 'ALL' ? [] : selectedCameraIds,
    };

    try {
      await axiosClient.post('/admin/create-head', payload);
      setFeedback({
        type: 'success',
        message: `✅ Department Head account created for ${formData.name} (${
          cameraAccessMode === 'ALL'
            ? 'Full Access to All Cameras'
            : `${selectedCameraIds.length} Cameras Assigned`
        })!`,
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'SECURITY_HEAD',
        department: 'SECURITY',
      });
      setCameraAccessMode('ALL');
      setSelectedCameraIds([]);
      loadHeads();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.extractedDetail || err.response?.data?.detail || 'Failed to create department head.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Permissions Modal
  const openEditPermissionsModal = (head) => {
    setEditPermissionsHead(head);
    const existing = head.allowed_cameras || [];
    if (!existing || existing.length === 0 || existing.includes('ALL')) {
      setEditAccessMode('ALL');
      setEditSelectedCameraIds([]);
    } else {
      setEditAccessMode('CUSTOM');
      setEditSelectedCameraIds([...existing]);
    }
  };

  // Save Permissions on Existing Head
  const handleSaveEditPermissions = async () => {
    if (!editPermissionsHead) return;
    const headId = editPermissionsHead.id || editPermissionsHead._id;
    try {
      setSavingPermissions(true);
      const camsToSave = editAccessMode === 'ALL' ? [] : editSelectedCameraIds;
      await axiosClient.patch(`/admin/heads/${headId}/permissions`, {
        allowed_cameras: camsToSave,
      });
      setFeedback({
        type: 'success',
        message: `✅ Camera permissions updated for ${editPermissionsHead.name} (${
          editAccessMode === 'ALL' ? 'Full Access' : `${editSelectedCameraIds.length} cameras`
        })!`,
      });
      setEditPermissionsHead(null);
      loadHeads();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to update camera permissions.',
      });
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleDeleteHead = async (head) => {
    const headId = head.id || head._id;
    if (!headId) return;

    try {
      setDeletingId(headId);
      await axiosClient.delete(`/admin/heads/${headId}`);
      setFeedback({
        type: 'success',
        message: `🗑️ Successfully revoked and deleted administrative account for ${head.name}.`,
      });
      setDeleteConfirmHead(null);
      loadHeads();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to remove department head.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered heads
  const filteredHeads = heads.filter((head) => {
    const matchesSearch =
      (head.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (head.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (head.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'ALL' || head.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const secCount = heads.filter((h) => h.role === 'SECURITY_HEAD').length;
  const facCount = heads.filter((h) => h.role === 'FACILITY_SUPERVISOR').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel-glow border-purple-500/30">
        <div>
          <h2 className="text-lg font-bold font-heading text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Create &amp; Manage Department Heads</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Provision, manage credentials, and revoke administrative authority for Security Officers and Facility Supervisors.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Total Heads:</span>
            <span className="font-bold text-white font-mono">{heads.length}</span>
            <span className="text-slate-600">|</span>
            <span className="text-red-400 font-bold">{secCount} Sec</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">{facCount} Fac</span>
          </div>
          <button
            onClick={loadHeads}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Roster</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
              : 'bg-red-950/80 border-red-800 text-red-300'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Provision Form, Right Active Heads Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Enroll New Department Head */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 glass-panel rounded-2xl p-6 border-slate-800 space-y-4"
        >
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <UserPlus className="w-4 h-4 text-purple-400" />
              <span>Enroll New Department Head</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Generates credentials with portal authorization</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Select Role Authorization</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRoleChange('SECURITY_HEAD')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  formData.role === 'SECURITY_HEAD'
                    ? 'bg-red-950/80 border-red-500 text-red-300 shadow-md shadow-red-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Security Head</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('FACILITY_SUPERVISOR')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  formData.role === 'FACILITY_SUPERVISOR'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Facility Head</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name &amp; Title</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Col. Pratap Singh"
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Official Email (Username)</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="pratap.singh@campus.edu"
                required
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543001"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="SecHead@123"
                  required
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Camera Access Permissions Scope */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
                <Video className="w-3.5 h-3.5 text-purple-400" />
                <span>Camera Surveillance Permissions</span>
              </label>
              <span className="text-[10px] font-mono text-purple-400">
                {cameraAccessMode === 'ALL'
                  ? 'All Cameras Permitted'
                  : `${selectedCameraIds.length}/${availableCameras.length} Selected`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCameraAccessMode('ALL')}
                className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  cameraAccessMode === 'ALL'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Video className="w-3 h-3" />
                <span>All Cameras</span>
              </button>

              <button
                type="button"
                onClick={() => setCameraAccessMode('CUSTOM')}
                className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  cameraAccessMode === 'CUSTOM'
                    ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Custom Cameras</span>
              </button>
            </div>

            {/* Custom Camera Checklist */}
            {cameraAccessMode === 'CUSTOM' && (
              <div className="space-y-1.5 pt-1 animate-fade-in">
                <div className="flex items-center justify-between text-[10px] px-1">
                  <span className="text-slate-400">Pick authorized cameras:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={selectAllCameras}
                      className="text-purple-400 hover:text-purple-300 font-bold"
                    >
                      All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={clearAllCameras}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {availableCameras.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-[11px]">
                      No cameras placed yet. You can place cameras in Campus Map Engine.
                    </div>
                  ) : (
                    availableCameras.map((cam) => {
                      const isChecked = selectedCameraIds.includes(cam.camera_id);
                      return (
                        <div
                          key={cam.camera_id}
                          onClick={() => toggleCameraSelection(cam.camera_id)}
                          className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between text-xs transition-all ${
                            isChecked
                              ? 'bg-purple-950/60 border-purple-500/60 text-purple-200'
                              : 'bg-slate-900/80 border-slate-800/80 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <div
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                isChecked
                                  ? 'bg-purple-600 border-purple-500 text-white'
                                  : 'border-slate-700 bg-slate-950'
                              }`}
                            >
                              {isChecked && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span className="font-mono font-bold text-[11px] text-white shrink-0">
                              {cam.camera_id}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {cam.camera_name || cam.name}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20 transition-all mt-3"
          >
            {submitting ? (
              <span>CREATING ACCOUNT...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Department Head Account</span>
              </>
            )}
          </button>
        </form>

        {/* Right Active Heads List */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Active Department Commanders ({filteredHeads.length})</span>
              </h3>
              <p className="text-[11px] text-slate-400">Security &amp; Facility operations supervisory roster</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search heads..."
                  className="pl-7 pr-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200 outline-none w-32 focus:w-40 transition-all"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-lg px-2 py-1 outline-none font-semibold"
              >
                <option value="ALL">All Roles</option>
                <option value="SECURITY_HEAD">Security Only</option>
                <option value="FACILITY_SUPERVISOR">Facility Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredHeads.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No department heads found matching your criteria.
              </div>
            ) : (
              filteredHeads.map((head) => {
                const isSec = head.role === 'SECURITY_HEAD';
                const headId = head.id || head._id;
                return (
                  <div
                    key={headId || head.email}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSec
                            ? 'bg-red-950/80 text-red-400 border border-red-800/80'
                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                        }`}
                      >
                        {isSec ? <Shield className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate">{head.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{head.email}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Phone: {head.phone || 'N/A'} • Dept: {head.department || (isSec ? 'SECURITY' : 'FACILITY')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {/* Camera Permission Badge & Edit Action */}
                      <button
                        type="button"
                        onClick={() => openEditPermissionsModal(head)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 transition-all ${
                          head.allowed_cameras && head.allowed_cameras.length > 0 && !head.allowed_cameras.includes('ALL')
                            ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900/80 shadow-sm'
                            : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/80'
                        }`}
                        title="Click to assign or restrict permitted cameras"
                      >
                        <Video className="w-3 h-3" />
                        <span>
                          {head.allowed_cameras && head.allowed_cameras.length > 0 && !head.allowed_cameras.includes('ALL')
                            ? `${head.allowed_cameras.length} Cameras`
                            : 'All Cameras'}
                        </span>
                        <Settings className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                      </button>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isSec
                            ? 'bg-red-950 text-red-300 border-red-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {head.role?.replace('_', ' ')}
                      </span>

                      {/* Delete / Revoke Account Button */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmHead(head)}
                        disabled={deletingId === headId}
                        className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-400 hover:text-red-200 transition-colors shadow-sm disabled:opacity-50"
                        title="Revoke & Delete Administrative Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Account Revocation */}
      {deleteConfirmHead && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-red-500/40 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800 flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Revoke Department Head Account?</h3>
                <p className="text-xs text-slate-400">This action will immediately terminate login clearance.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div>
                <span className="text-slate-500">Name:</span>{' '}
                <span className="font-bold text-slate-200">{deleteConfirmHead.name}</span>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>{' '}
                <span className="font-mono text-cyan-400">{deleteConfirmHead.email}</span>
              </div>
              <div>
                <span className="text-slate-500">Role:</span>{' '}
                <span className="font-mono text-red-300 font-bold">{deleteConfirmHead.role}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmHead(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteHead(deleteConfirmHead)}
                disabled={deletingId !== null}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-red-600/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingId ? 'Revoking...' : 'Confirm Revoke & Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Camera Permissions Modal */}
      {editPermissionsHead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-purple-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5 text-purple-400">
                <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-700/80 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Assign Permitted CCTV Cameras</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {editPermissionsHead.name} • {editPermissionsHead.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditPermissionsHead(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Access Mode Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-300">Surveillance Access Scope</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditAccessMode('ALL')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    editAccessMode === 'ALL'
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>All Campus Cameras</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditAccessMode('CUSTOM')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    editAccessMode === 'CUSTOM'
                      ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-md shadow-purple-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Restricted Access</span>
                </button>
              </div>
            </div>

            {/* Checklist of Cameras */}
            {editAccessMode === 'CUSTOM' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-semibold">
                    Select Permitted Cameras ({editSelectedCameraIds.length} of {availableCameras.length} selected)
                  </span>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setEditSelectedCameraIds(availableCameras.map((c) => c.camera_id))}
                      className="text-purple-400 hover:text-purple-300 font-bold"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setEditSelectedCameraIds([])}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {availableCameras.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No cameras currently connected in the Campus Map Engine.
                    </div>
                  ) : (
                    availableCameras.map((cam) => {
                      const isChecked = editSelectedCameraIds.includes(cam.camera_id);
                      return (
                        <div
                          key={cam.camera_id}
                          onClick={() => {
                            setEditSelectedCameraIds((prev) =>
                              prev.includes(cam.camera_id)
                                ? prev.filter((id) => id !== cam.camera_id)
                                : [...prev, cam.camera_id]
                            );
                          }}
                          className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                            isChecked
                              ? 'bg-purple-950/60 border-purple-500/60 text-purple-200'
                              : 'bg-slate-900/80 border-slate-800/80 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isChecked
                                  ? 'bg-purple-600 border-purple-500 text-white'
                                  : 'border-slate-700 bg-slate-950'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <div className="truncate">
                              <span className="font-mono font-bold text-xs text-white mr-2">
                                {cam.camera_id}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {cam.camera_name || cam.name} • {cam.block_name}{' '}
                                {cam.room_number ? `(Room ${cam.room_number})` : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditPermissionsHead(null)}
                className="py-2 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditPermissions}
                disabled={savingPermissions}
                className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-purple-600/30 disabled:opacity-50"
              >
                {savingPermissions ? <span>Saving...</span> : <span>Save Permissions</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageHeads;
