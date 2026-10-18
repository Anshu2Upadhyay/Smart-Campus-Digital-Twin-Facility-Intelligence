import React, { useState, useEffect } from 'react';
import SecurityLayout from '../../components/SecurityLayout';
import GeminiThreatScanModal from '../../components/GeminiThreatScanModal';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import MOCK_ASSETS from '../../utils/mockAssets';
import {
  Sparkles,
  Video,
  Maximize2,
  AlertTriangle,
  Play,
  Volume2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Radio,
  SlidersHorizontal,
  Eye,
  Shield,
  Layers,
  Camera,
  ChevronDown,
  X,
  Send,
} from 'lucide-react';

export const SecurityCctvMonitoring = () => {
  const { notifications } = useSocket();
  const [filterBlock, setFilterBlock] = useState('All');
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [scanCamera, setScanCamera] = useState(null);
  const [ptzZoom, setPtzZoom] = useState(1);
  const [toast, setToast] = useState(null);

  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCameras = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/security/cameras');
      if (res.data && Array.isArray(res.data)) {
        const mapped = res.data.map((c, idx) => ({
          id: c.camera_id,
          name: c.name || `Camera ${c.camera_id}`,
          block: c.block_name || 'Campus',
          floor: c.floor_number ?? 0,
          location: `${c.block_name || 'Campus'} • Floor ${c.floor_number ?? 0} • ${c.camera_id}`,
          rtsp: c.rtsp_url || `rtsp://demo.smartcampus.io/${c.camera_id}.sdp`,
          status: c.ai_status === 'THREAT_DETECTED' ? 'ALERT' : (c.status || 'NORMAL'),
          alertTitle: c.ai_status === 'THREAT_DETECTED' ? 'THREAT DETECTED' : 'PERIMETER SECURE',
          alertClass: c.ai_status === 'THREAT_DETECTED' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white',
          feedSrc: c.ai_status === 'THREAT_DETECTED'
            ? MOCK_ASSETS.fightClip
            : idx % 2 === 0
            ? MOCK_ASSETS.normalCorridorCctv
            : MOCK_ASSETS.classroomFeed,
          fps: c.fps || 30,
          res: '1920x1080 (1080p)',
          aiActive: true,
          detectionConfidence: '96.2%',
        }));
        setCameras(mapped);
      }
    } catch (err) {
      console.error('Failed to load permitted cameras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCameras();
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      loadCameras();
    }
  }, [notifications]);

  const filteredCameras = cameras.filter((cam) => {
    if (filterBlock === 'All') return true;
    return cam.block === filterBlock;
  });

  return (
    <SecurityLayout>
      <div className="space-y-6">
        {/* Banner Alert Feedback */}
        {toast && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                : 'bg-blue-950/80 border-blue-500/50 text-blue-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toast.msg}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Top Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black font-heading text-white">Live CCTV Monitoring Matrix</h1>
                <p className="text-xs text-slate-400">Autonomous Edge AI Video Analytics & High-Definition RTSP Video Streams</p>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['All', 'Block-B', 'Gate-1', 'Library', 'Block-A', 'Hostel', 'Grounds'].map((blk) => (
              <button
                key={blk}
                onClick={() => setFilterBlock(blk)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  filterBlock === blk
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {blk === 'All' ? 'All Feeds (6)' : blk}
              </button>
            ))}
          </div>
        </div>

        {/* Camera Grid (2x3 or 3x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCameras.map((cam) => (
            <div
              key={cam.id}
              className="group rounded-2xl bg-[#0a0f1d] border border-slate-800 hover:border-blue-500/50 shadow-xl overflow-hidden flex flex-col transition-all duration-300"
            >
              {/* Camera Header Banner */}
              <div className={`px-3 py-2 flex items-center justify-between text-xs font-bold ${cam.alertClass}`}>
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="truncate">{cam.alertTitle}</span>
                </div>
                <span className="font-mono text-[10px] tracking-wider uppercase opacity-90">{cam.id}</span>
              </div>

              {/* Video Player Canvas / Simulation */}
              <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                <img
                  src={cam.feedSrc}
                  alt={cam.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* AI Bounding Box Overlay for Alert Cameras */}
                {cam.status === 'ALERT' && (
                  <div className="absolute inset-8 border-2 border-rose-500 rounded-lg animate-pulse pointer-events-none flex flex-col justify-between p-2">
                    <span className="bg-rose-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded self-start shadow">
                      ALTERCATION DETECTED • {cam.detectionConfidence}
                    </span>
                    <span className="bg-black/70 text-rose-300 text-[8px] font-mono px-1 py-0.5 rounded self-end">
                      GEO: 28.6142 N, 77.2091 E
                    </span>
                  </div>
                )}

                {cam.status === 'WARNING' && (
                  <div className="absolute inset-10 border-2 border-amber-400 rounded-lg pointer-events-none p-1.5">
                    <span className="bg-amber-500 text-slate-950 text-[9px] font-mono font-black px-1.5 py-0.5 rounded shadow">
                      CROWD PACKING &gt; 80/SQM
                    </span>
                  </div>
                )}

                {/* Live Watermark Overlay */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-mono text-cyan-400 border border-cyan-500/30">
                  REC • 1080P • {cam.fps} FPS
                </div>

                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[9px] font-mono text-slate-300">
                  {new Date().toLocaleTimeString()}
                </div>

                {/* Hover Maximize Button */}
                <button
                  onClick={() => setSelectedCamera(cam)}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-blue-600 text-white transition-all shadow-md"
                  title="Expand Fullscreen PTZ View"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Camera Details & Action Footer */}
              <div className="p-3.5 bg-[#0d1428] space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-100">
                    <span>{cam.name}</span>
                    <span className="text-[10px] text-blue-400 font-mono">{cam.block}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{cam.location}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 truncate max-w-[170px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="truncate">{cam.rtsp}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setScanCamera(cam)}
                      className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center space-x-1 shadow-sm transition-all"
                      title="Run Gemini 1.5 Flash + YOLO Threat Diagnosis"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>AI Scan</span>
                    </button>
                    <button
                      onClick={() => {
                        setToast({ type: 'success', msg: `Snapshot captured and archived for ${cam.id}.` });
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                    >
                      Capture
                    </button>
                    <button
                      onClick={() => setSelectedCamera(cam)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold shadow-sm"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fullscreen PTZ Inspection Modal */}
        {selectedCamera && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-[#0a0f1d] rounded-2xl border border-blue-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-5 py-3 border-b border-slate-800 bg-[#0d1428] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
                    {selectedCamera.id}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{selectedCamera.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{selectedCamera.location}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCamera(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
                  <img
                    src={selectedCamera.feedSrc}
                    alt={selectedCamera.name}
                    className="w-full h-full object-cover transition-transform duration-300"
                    style={{ transform: `scale(${ptzZoom})` }}
                  />

                  <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/40 text-xs font-mono text-cyan-300">
                    ZOOM: {ptzZoom}x • RTSP HD STREAM
                  </div>
                </div>

                {/* PTZ Joystick & Telemetry Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#0e162e] border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">OPTICAL PTZ ZOOM</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPtzZoom((z) => Math.max(1, z - 0.25))}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                      >
                        - Zoom
                      </button>
                      <span className="font-mono text-cyan-400 font-bold">{ptzZoom.toFixed(2)}x</span>
                      <button
                        onClick={() => setPtzZoom((z) => Math.min(3, z + 0.25))}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                      >
                        + Zoom
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">AI SENSOR STATUS</span>
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>VISION AI ENGINE: ONLINE</span>
                    </span>
                  </div>

                  <div className="flex items-end justify-end">
                    <button
                      onClick={() => {
                        setToast({ type: 'success', msg: `Security team dispatched to ${selectedCamera.location}.` });
                        setSelectedCamera(null);
                      }}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Nearest Guard</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gemini Multimodal Cognitive Threat Diagnostic Modal */}
        <GeminiThreatScanModal
          camera={scanCamera}
          isOpen={!!scanCamera}
          onClose={() => setScanCamera(null)}
          onGuardDispatched={(guard) => {
            setToast({ type: 'success', msg: `Guard ${guard.name} dispatched immediately via Gemini Autopilot!` });
            setScanCamera(null);
            loadCameras();
          }}
        />
      </div>
    </SecurityLayout>
  );
};

export default SecurityCctvMonitoring;
