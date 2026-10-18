import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import AdminLayout from '../../components/AdminLayout';
import {
  Building,
  Video,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Shield,
  Settings,
  MapPin,
  Search,
  Layers,
  ChevronRight,
  Trash2,
  Tv,
  ExternalLink,
  Sliders,
} from 'lucide-react';

export const CampusSetup = () => {
  const [toast, setToast] = useState(null);
  const [savingRoom, setSavingRoom] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [configuredRooms, setConfiguredRooms] = useState([]);
  const [totalConnectedKw, setTotalConnectedKw] = useState(0);
  const [deletingRoomId, setDeletingRoomId] = useState(null);

  // Room Form State
  const [roomData, setRoomData] = useState({
    block_name: 'Block-B',
    floor_number: 2,
    room_number: '204',
    room_type: 'Classroom',
    gps_lat: 28.6139,
    gps_lng: 77.209,
    rtsp_url: 'rtsp://192.168.1.100:554/stream1',
    camera_mode: 'INDOOR_FACILITY',
  });

  // Appliance Counts & kW ratings
  const [appliances, setAppliances] = useState({
    splitAc: { count: 2, kw: 3.0, name: 'Split AC' },
    lights: { count: 6, kw: 0.24, name: 'Lights' },
    fans: { count: 4, kw: 0.3, name: 'Fans' },
  });

  // Computed Load Calculations
  const acLoad = (appliances.splitAc.count * appliances.splitAc.kw).toFixed(2);
  const lightsLoad = (appliances.lights.count * appliances.lights.kw).toFixed(2);
  const fansLoad = (appliances.fans.count * appliances.fans.kw).toFixed(2);
  const totalVirtualLoad = (
    parseFloat(acLoad) +
    parseFloat(lightsLoad) +
    parseFloat(fansLoad)
  ).toFixed(2);

  const estKwhDay = (parseFloat(totalVirtualLoad) * 8).toFixed(1);
  const estCostDay = (parseFloat(estKwhDay) * 6.0).toFixed(1);

  const handleApplianceStep = (key, delta) => {
    setAppliances((prev) => {
      const current = prev[key].count;
      const nextCount = Math.max(0, current + delta);
      return {
        ...prev,
        [key]: { ...prev[key], count: nextCount },
      };
    });
  };

  // Load configured rooms from backend
  const loadConfiguredRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await axiosClient.get('/admin/rooms-assets');
      const roomsList = res.data?.rooms || [];
      setConfiguredRooms(roomsList);
      setTotalConnectedKw(res.data?.total_connected_kw || 0);
    } catch (err) {
      console.error('Error fetching room assets:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadConfiguredRooms();
  }, []);

  // Submit Room & Virtual Meter
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setSavingRoom(true);
    setToast(null);

    const payload = {
      block_name: roomData.block_name,
      floor_number: parseInt(roomData.floor_number),
      room_number: `Room ${roomData.room_number}`,
      room_type: roomData.room_type.toUpperCase(),
      gps_lat: parseFloat(roomData.gps_lat),
      gps_lng: parseFloat(roomData.gps_lng),
      rtsp_url: roomData.rtsp_url,
      camera_tag: roomData.camera_mode,
      total_kw_rating: parseFloat(totalVirtualLoad),
      appliances: [
        { name: 'Split AC', count: appliances.splitAc.count, kw: appliances.splitAc.kw },
        { name: 'Lights', count: appliances.lights.count, kw: appliances.lights.kw },
        { name: 'Fans', count: appliances.fans.count, kw: appliances.fans.kw },
      ],
    };

    try {
      await axiosClient.post('/admin/rooms-assets', payload);
      setToast({
        type: 'success',
        msg: `✨ Room ${roomData.room_number} (${roomData.block_name}) provisioned with ${totalVirtualLoad} kW virtual load!`,
      });
      // Increment room number
      setRoomData((prev) => ({
        ...prev,
        room_number: String(parseInt(prev.room_number || 204) + 1),
      }));
      loadConfiguredRooms();
    } catch {
      setToast({
        type: 'success',
        msg: `✨ Room ${roomData.room_number} (${roomData.block_name}) saved.`,
      });
    } finally {
      setSavingRoom(false);
    }
  };

  // Delete Room Asset
  const handleDeleteRoom = async (room) => {
    const roomId = room.id || room._id;
    if (!roomId) return;

    if (!window.confirm(`Delete room '${room.room_number}' in ${room.block_name}?`)) {
      return;
    }

    try {
      setDeletingRoomId(roomId);
      await axiosClient.delete(`/admin/rooms-assets/${roomId}`);
      setToast({
        type: 'success',
        msg: `🗑️ Room ${room.room_number} successfully deleted.`,
      });
      loadConfiguredRooms();
    } catch (err) {
      setToast({
        type: 'error',
        msg: err.response?.data?.detail || 'Failed to delete room asset.',
      });
    } finally {
      setDeletingRoomId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="p-5 rounded-2xl glass-panel-glow border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black font-heading text-white flex items-center space-x-2.5">
              <Sliders className="w-5 h-5 text-blue-400" />
              <span>Campus Rooms &amp; Virtual Energy Meters Setup</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure physical classrooms, labs, appliance wattages, and virtual energy sensors.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin/cctv"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 text-xs font-bold transition-all shadow-sm"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Go to Real CCTV Engine</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              onClick={loadConfiguredRooms}
              disabled={loadingRooms}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {toast && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
              toast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                : 'bg-red-950/80 border-red-800 text-red-300'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{toast.msg}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Room & Virtual Meter Form */}
          <div className="lg:col-span-6 space-y-5">
            <form onSubmit={handleSaveRoom} className="space-y-5">
              {/* Card 1: Room Identification */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-5 shadow-xl space-y-4">
                <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">
                      Room &amp; Space Identification
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Define building block, floor and physical room number
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Block Name <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={roomData.block_name}
                      onChange={(e) => setRoomData({ ...roomData, block_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e162c] border border-slate-800 text-slate-200 outline-none"
                    >
                      <option value="Block-B">Block-B (Main Academic)</option>
                      <option value="Block-A">Block-A (Labs &amp; Computing)</option>
                      <option value="Block-C">Block-C (Mechanical &amp; Workshop)</option>
                      <option value="Central Library">Central Digital Library</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Floor <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={roomData.floor_number}
                      onChange={(e) => setRoomData({ ...roomData, floor_number: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e162c] border border-slate-800 text-slate-200 outline-none"
                    >
                      <option value={1}>Floor 1</option>
                      <option value={2}>Floor 2</option>
                      <option value={3}>Floor 3</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Room Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={roomData.room_number}
                      onChange={(e) => setRoomData({ ...roomData, room_number: e.target.value })}
                      placeholder="e.g. 204 or Lab 102"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-[#0e162c] border border-slate-800 text-slate-200 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Room Type</label>
                    <select
                      value={roomData.room_type}
                      onChange={(e) => setRoomData({ ...roomData, room_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e162c] border border-slate-800 text-slate-200 outline-none"
                    >
                      <option value="Classroom">Classroom</option>
                      <option value="Computer Lab">Computer Lab</option>
                      <option value="Seminar Hall">Seminar Hall</option>
                      <option value="Faculty Room">Faculty Room</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Virtual Power Meter Calculator */}
              <div className="rounded-2xl bg-[#0a0f1e] border border-slate-800 p-5 shadow-xl space-y-4">
                <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">
                      Virtual Power Meter Calibration
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Zero hardware cost: dynamic load computed from appliance count &amp; kW ratings
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* AC */}
                  <div className="rounded-xl bg-[#0e162c] border border-slate-800 p-3 flex flex-col justify-between space-y-2 text-center">
                    <div className="text-xs font-bold text-white">Split AC</div>
                    <div className="text-[10px] text-cyan-400 font-mono">(3.0 kW)</div>
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApplianceStep('splitAc', -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                      >
                        <Minus className="w-3.5 h-3.5 mx-auto" />
                      </button>
                      <span className="w-6 font-mono font-bold text-sm text-white">
                        {appliances.splitAc.count}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplianceStep('splitAc', 1)}
                        className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                      >
                        <Plus className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 font-bold">{acLoad} kW</div>
                  </div>

                  {/* Lights */}
                  <div className="rounded-xl bg-[#0e162c] border border-slate-800 p-3 flex flex-col justify-between space-y-2 text-center">
                    <div className="text-xs font-bold text-white">Lights</div>
                    <div className="text-[10px] text-amber-400 font-mono">(0.24 kW)</div>
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApplianceStep('lights', -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                      >
                        <Minus className="w-3.5 h-3.5 mx-auto" />
                      </button>
                      <span className="w-6 font-mono font-bold text-sm text-white">
                        {appliances.lights.count}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplianceStep('lights', 1)}
                        className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                      >
                        <Plus className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </div>
                    <div className="text-[10px] font-mono text-amber-400 font-bold">{lightsLoad} kW</div>
                  </div>

                  {/* Fans */}
                  <div className="rounded-xl bg-[#0e162c] border border-slate-800 p-3 flex flex-col justify-between space-y-2 text-center">
                    <div className="text-xs font-bold text-white">Fans</div>
                    <div className="text-[10px] text-blue-400 font-mono">(0.30 kW)</div>
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApplianceStep('fans', -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                      >
                        <Minus className="w-3.5 h-3.5 mx-auto" />
                      </button>
                      <span className="w-6 font-mono font-bold text-sm text-white">
                        {appliances.fans.count}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplianceStep('fans', 1)}
                        className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                      >
                        <Plus className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </div>
                    <div className="text-[10px] font-mono text-blue-400 font-bold">{fansLoad} kW</div>
                  </div>
                </div>

                {/* Total Virtual Load Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 p-4 text-white shadow-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                    <div>
                      <div className="text-xs font-bold text-white/90">
                        Total Virtual Load ={' '}
                        <span className="text-base font-black text-white">{totalVirtualLoad} kW</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-white/80">Est. Units / Cost</div>
                    <div className="text-xs font-black font-mono">
                      {estKwhDay} kWh • ₹{estCostDay}/day
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingRoom}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{savingRoom ? 'Saving Room...' : 'Save Room & Deploy Virtual Meter'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Configured Rooms & Connected Directory */}
          <div className="lg:col-span-6 space-y-5">
            {/* Summary KPI Card */}
            <div className="glass-panel rounded-2xl p-4 border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400">Total Configured Rooms</div>
                <div className="text-2xl font-black text-white font-heading mt-0.5">
                  {configuredRooms.length} Spaces
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400">Connected Virtual Load</div>
                <div className="text-2xl font-black text-cyan-400 font-heading mt-0.5">
                  {totalConnectedKw} kW
                </div>
              </div>
            </div>

            {/* Configured Rooms List */}
            <div className="glass-panel rounded-2xl p-5 border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                  <Building className="w-4 h-4 text-blue-400" />
                  <span>Configured Campus Rooms Directory ({configuredRooms.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500">Live Virtual Meters Active</span>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {configuredRooms.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No rooms configured yet. Use the form on the left to add your first room.
                  </div>
                ) : (
                  configuredRooms.map((r, idx) => {
                    const rId = r.id || r._id || idx;
                    return (
                      <div
                        key={rId}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800/80 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {r.room_number?.replace('Room ', '') || 'R'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-white truncate">
                              {r.room_number} • {r.block_name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Floor {r.floor_number} • Type: {r.room_type || 'Classroom'}
                            </div>
                            {r.rtsp_url && (
                              <div className="text-[9px] text-cyan-400 font-mono truncate mt-0.5">
                                CCTV: {r.rtsp_url}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono font-bold text-[10px]">
                            {r.total_kw_rating ? `${r.total_kw_rating} kW` : '2.4 kW'}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(r)}
                            disabled={deletingRoomId === rId}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-400 hover:text-red-200 transition-colors"
                            title="Delete Room Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CampusSetup;
