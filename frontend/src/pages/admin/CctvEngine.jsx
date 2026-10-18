import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import MOCK_ASSETS from '../../utils/mockAssets';
import {
  Map as MapIcon,
  Video,
  Radio,
  Play,
  Pause,
  Maximize2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Zap,
  Shield,
  Layers,
  Activity,
  Tv,
  Check,
  X,
  ExternalLink,
  Flame,
  Users,
  Search,
} from 'lucide-react';

const PRESET_STREAMS = [
  {
    label: 'Corridor Security (RTSP AI Simulation)',
    url: 'rtsp://192.168.1.100:554/corridor_stream1',
    block: 'Block-B',
    floor: 2,
    room: 'Corridor',
    mode: 'OUTDOOR_SECURITY',
    thumbnail: MOCK_ASSETS.corridorCctv,
  },
  {
    label: 'Classroom 204 (Smart Facility AI Stream)',
    url: 'rtsp://192.168.1.204:554/room204_stream1',
    block: 'Block-B',
    floor: 2,
    room: 'Room 204',
    mode: 'INDOOR_FACILITY',
    thumbnail: MOCK_ASSETS.normalCorridorCctv,
  },
  {
    label: 'Main Gate 1 (Checkpoint & Bus Radar)',
    url: 'rtsp://192.168.1.10:554/gate1_stream',
    block: 'Gate-1',
    floor: 0,
    room: 'Main Entry',
    mode: 'OUTDOOR_SECURITY',
    thumbnail: MOCK_ASSETS.overcrowdingCctv,
  },
  {
    label: 'Public MP4 Test Stream (H.264 Live)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    block: 'Block-A',
    floor: 1,
    room: 'Lab 101',
    mode: 'INDOOR_FACILITY',
    thumbnail: MOCK_ASSETS.switchboard,
  },
];

export const CctvEngine = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [selectedCamForPreview, setSelectedCamForPreview] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    camera_name: 'CAM-B204-Classroom',
    rtsp_url: 'rtsp://192.168.1.100:554/stream1',
    block_name: 'Block-B',
    floor_number: 2,
    room_number: 'Room 204',
    camera_mode: 'INDOOR_FACILITY', // 'INDOOR_FACILITY' | 'OUTDOOR_SECURITY'
    coverage_tags: ['Classroom', 'Students', 'AC'],
  });

  // Load registered camera streams
  const loadStreams = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/admin/cctv/streams');
      const list = res.data || [];
      setCameras(list);
      if (list.length > 0 && !selectedCamForPreview) {
        setSelectedCamForPreview(list[0]);
      }
    } catch (err) {
      console.error('Error fetching CCTV streams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreams();
  }, []);

  // Quick Preset Selection
  const handleApplyPreset = (preset) => {
    setFormData({
      camera_name: `CAM-${preset.block}-${preset.room.replace(/\s+/g, '')}`,
      rtsp_url: preset.url,
      block_name: preset.block,
      floor_number: preset.floor,
      room_number: preset.room,
      camera_mode: preset.mode,
      coverage_tags: preset.mode === 'OUTDOOR_SECURITY' ? ['Corridor', 'Checkpoint', 'Security'] : ['Classroom', 'AC', 'Lights'],
    });
    setTestResult(null);
  };

  // Test Stream Connection (Handshake)
  const handleTestStream = async () => {
    if (!formData.rtsp_url.trim()) {
      setFeedback({ type: 'error', message: 'Please enter an RTSP or HTTP stream URL to test.' });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      const res = await axiosClient.post('/admin/cctv/test', {
        rtsp_url: formData.rtsp_url.trim(),
      });
      setTestResult(res.data);
      setFeedback({
        type: 'success',
        message: `🟢 Handshake Successful! Stream verified: ${res.data.resolution} @ ${res.data.fps} FPS (${res.data.protocol})`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Handshake failed. Check camera IP, credentials, and port 554.',
      });
    } finally {
      setTesting(false);
    }
  };

  // Connect & Save Stream
  const handleConnectStream = async (e) => {
    if (e) e.preventDefault();
    if (!formData.rtsp_url.trim() || !formData.camera_name.trim()) {
      setFeedback({ type: 'error', message: 'Camera Name and Stream URL are mandatory.' });
      return;
    }

    try {
      setConnecting(true);
      setFeedback(null);
      const res = await axiosClient.post('/admin/cctv/connect', {
        ...formData,
        rtsp_url: formData.rtsp_url.trim(),
      });

      setFeedback({
        type: 'success',
        message: `✨ Camera '${formData.camera_name}' connected to campus AI video pipeline!`,
      });

      loadStreams();
      if (res.data?.camera) {
        setSelectedCamForPreview(res.data.camera);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to connect CCTV stream.',
      });
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect Camera Stream
  const handleDisconnect = async (cam) => {
    const camId = cam.camera_id || cam.id || cam._id;
    if (!camId) return;

    if (!window.confirm(`Disconnect and remove camera feed '${cam.camera_name}'?`)) {
      return;
    }

    try {
      await axiosClient.delete(`/admin/cctv/${camId}`);
      setFeedback({
        type: 'success',
        message: `🗑️ Camera '${cam.camera_name}' disconnected successfully.`,
      });
      if (selectedCamForPreview?.camera_id === camId) {
        setSelectedCamForPreview(null);
      }
      loadStreams();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to disconnect camera.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-5 rounded-2xl glass-panel-glow border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black font-heading text-white flex items-center space-x-2.5">
            <Video className="w-5 h-5 text-cyan-400" />
            <span>Real CCTV AI Engine &amp; Live Stream Control Station</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect any RTSP, HTTP/HLS, or IP camera feed with zero code. Instant AI YOLOv8 computer vision detection.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/admin/map-engine"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Campus Map Engine</span>
          </Link>
          <button
            onClick={loadStreams}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Feeds</span>
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

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Connect Form & Presets */}
        <div className="lg:col-span-5 space-y-5">
          {/* Stream Presets Picker */}
          <div className="glass-panel rounded-2xl p-4 border-slate-800 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
              ⚡ Quick Camera Presets (Click to Auto-Fill)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_STREAMS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-left text-xs transition-all hover:bg-slate-800/60"
                >
                  <div className="font-bold text-slate-200 text-[11px] truncate">{preset.label}</div>
                  <div className="text-[9px] text-slate-500 font-mono truncate">{preset.url}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Connection Form */}
          <form
            onSubmit={handleConnectStream}
            className="glass-panel rounded-2xl p-6 border-slate-800 space-y-4 shadow-xl"
          >
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Mount New CCTV Camera</span>
                </h3>
                <p className="text-[11px] text-slate-400">Configure stream link and deploy AI model</p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Camera Label / Identifier</label>
              <input
                type="text"
                value={formData.camera_name}
                onChange={(e) => setFormData({ ...formData, camera_name: e.target.value })}
                placeholder="e.g. CAM-B204-Classroom"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">Live Stream URL (RTSP / HTTP / HLS)</label>
                <span className="text-[9px] font-mono text-cyan-400">Supports rtsp://, http://, .m3u8, .mp4</span>
              </div>
              <input
                type="text"
                value={formData.rtsp_url}
                onChange={(e) => {
                  setFormData({ ...formData, rtsp_url: e.target.value });
                  setTestResult(null);
                }}
                placeholder="rtsp://admin:pass@192.168.1.100:554/stream1"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none font-mono focus:border-cyan-500"
              />
            </div>

            {/* Test Results Pill */}
            {testResult && (
              <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between font-bold text-cyan-300">
                  <span>Stream Verified: {testResult.status}</span>
                  <span className="font-mono">{testResult.latency_ms}ms latency</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Resolution: {testResult.resolution} • {testResult.fps} FPS • Protocol: {testResult.protocol}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Block</label>
                <select
                  value={formData.block_name}
                  onChange={(e) => setFormData({ ...formData, block_name: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none"
                >
                  <option value="Block-B">Block-B</option>
                  <option value="Block-A">Block-A</option>
                  <option value="Block-C">Block-C</option>
                  <option value="Gate-1">Gate-1</option>
                  <option value="Gate-2">Gate-2</option>
                  <option value="Library">Library</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Floor</label>
                <select
                  value={formData.floor_number}
                  onChange={(e) => setFormData({ ...formData, floor_number: Number(e.target.value) })}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none"
                >
                  <option value={0}>Ground</option>
                  <option value={1}>Floor 1</option>
                  <option value={2}>Floor 2</option>
                  <option value={3}>Floor 3</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Room / Sector</label>
                <input
                  type="text"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  placeholder="Room 204"
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">AI Pipeline Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, camera_mode: 'OUTDOOR_SECURITY' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    formData.camera_mode === 'OUTDOOR_SECURITY'
                      ? 'bg-red-950/80 border-red-500 text-red-300 shadow-md shadow-red-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Security (YOLO Threat)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, camera_mode: 'INDOOR_FACILITY' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    formData.camera_mode === 'INDOOR_FACILITY'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Facility (Occupancy/Energy)</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={handleTestStream}
                disabled={testing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors border border-slate-700"
              >
                <Activity className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing...' : 'Test Handshake'}</span>
              </button>

              <button
                type="submit"
                disabled={connecting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{connecting ? 'Connecting...' : 'Connect Stream'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Video Canvas & Connected Cameras Roster */}
        <div className="lg:col-span-7 space-y-5">
          {/* Live Video Canvas */}
          <div className="glass-panel rounded-2xl p-4 border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-bold text-xs text-white">
                  Live Stream Monitor: {selectedCamForPreview?.camera_name || 'CAM-B204-Classroom'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[9px] font-mono border border-emerald-800">
                  30 FPS • 1080p
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedCamForPreview?.block_name || 'Block-B'} • {selectedCamForPreview?.room_number || 'Room 204'}
              </span>
            </div>

            {/* Video Viewport */}
            <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 h-64 sm:h-80 flex items-center justify-center">
              {/* If it's an MP4 / HTTP direct stream, play directly */}
              {selectedCamForPreview?.rtsp_url?.endsWith('.mp4') ? (
                <video
                  src={selectedCamForPreview.rtsp_url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={
                    selectedCamForPreview?.camera_mode === 'OUTDOOR_SECURITY'
                      ? MOCK_ASSETS.corridorCctv
                      : MOCK_ASSETS.normalCorridorCctv
                  }
                  alt="Live Camera Feed"
                  className="w-full h-full object-cover"
                />
              )}

              {/* AI Detection Overlay */}
              <div className="absolute top-3 left-3 flex flex-col space-y-1.5 pointer-events-none">
                <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-sm border border-emerald-500/60 text-emerald-300 text-[10px] font-mono flex items-center space-x-1.5 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>AI Detection: Nominal</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-black/60 text-cyan-300 text-[9px] font-mono">
                  Occupancy: 12 Persons
                </span>
              </div>

              {/* RTSP Stream Tag Bottom Right */}
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/75 text-[9px] font-mono text-slate-300 border border-slate-700 pointer-events-none">
                {selectedCamForPreview?.rtsp_url || 'rtsp://192.168.1.100:554/stream1'}
              </div>
            </div>
          </div>

          {/* Connected Cameras Roster */}
          <div className="glass-panel rounded-2xl p-4 border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>Connected Camera Streams ({cameras.length})</span>
              </h3>
              <span className="text-[10px] text-slate-400">Click any camera to preview live feed</span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {cameras.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No CCTV cameras mounted yet. Paste an RTSP or HTTP link to connect.
                </div>
              ) : (
                cameras.map((cam, idx) => {
                  const isSelected = selectedCamForPreview?.camera_name === cam.camera_name;
                  return (
                    <div
                      key={cam.camera_id || idx}
                      onClick={() => setSelectedCamForPreview(cam)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-cyan-400">
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate">{cam.camera_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{cam.rtsp_url}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">
                            {cam.block_name} • {cam.room_number || 'Common'} • {cam.camera_mode}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[9px] font-mono border border-emerald-800">
                          ● LIVE
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(cam);
                          }}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-400 hover:text-red-200 transition-colors"
                          title="Disconnect Camera"
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
  );
};

export default CctvEngine;
