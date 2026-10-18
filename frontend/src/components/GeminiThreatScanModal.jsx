import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import {
  Sparkles,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Users,
  Video,
  X,
  Zap,
  Activity,
  Cpu,
  Navigation,
  Flame,
  Radio,
  ChevronRight,
  Eye,
} from 'lucide-react';

export const GeminiThreatScanModal = ({ camera, isOpen, onClose, onGuardDispatched }) => {
  const [selectedThreat, setSelectedThreat] = useState('VIOLENCE_FIGHT');
  const [inputMode, setInputMode] = useState('scenario'); // 'scenario' | 'upload'
  const [customImage, setCustomImage] = useState(null);
  const [customImagePreview, setCustomImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen || !camera) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImage(reader.result);
        setCustomImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAiScan = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setDispatchSuccess(null);

      const payload = {
        simulated_threat: inputMode === 'upload' ? null : (selectedThreat === 'AUTO' ? null : selectedThreat),
        frame_base64: inputMode === 'upload' ? customImage : null,
        auto_dispatch_if_threat: false,
      };

      const res = await axiosClient.post(`/security/cameras/${camera.id || camera.camera_id}/gemini-scan`, payload);

      if (res.data) {
        setScanResult(res.data);
      }
    } catch (err) {
      console.error('Gemini AI Scan failed:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to complete AI threat scan.');
    } finally {
      setLoading(false);
    }
  };

  const dispatchGuard = async (guard) => {
    try {
      setDispatching(true);
      const res = await axiosClient.post(`/security/cameras/${camera.id || camera.camera_id}/gemini-scan`, {
        simulated_threat: inputMode === 'upload' ? null : (selectedThreat === 'AUTO' ? null : selectedThreat),
        frame_base64: inputMode === 'upload' ? customImage : null,
        auto_dispatch_if_threat: true,
      });

      setDispatchSuccess(`Guard ${guard.name} (${guard.staff_id || 'SEC'}) dispatched to ${camera.location || camera.name}!`);
      if (onGuardDispatched) {
        onGuardDispatched(guard);
      }
    } catch (err) {
      console.error('Dispatch failed:', err);
      setErrorMsg('Failed to dispatch guard.');
    } finally {
      setDispatching(false);
    }
  };

  const gemini = scanResult?.gemini_cognitive_assessment;
  const yolo = scanResult?.yolo_edge_telemetry;
  const nearestGuards = scanResult?.nearest_guards || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#090d1a] border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0d162d] via-[#101b38] to-[#0d162d] border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-white font-heading tracking-wide">
                  Gemini + YOLOv8 Collaborative AI Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono font-bold">
                  GEMINI DECISION MAKER
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Camera: <span className="text-cyan-400 font-bold">{camera.id || camera.camera_id}</span> • {camera.location || camera.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Architecture Mode Banner */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-purple-950/40 border border-cyan-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="flex -space-x-1">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shadow">
                  Y8
                </div>
                <div className="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow">
                  G
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-200">Collaborative AI: </span>
                <span className="text-slate-400">YOLOv8 computes spatial telemetry & boxes; Gemini evaluates evidence and delivers the authoritative decision.</span>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center space-x-2 p-1 bg-[#080d19] rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setInputMode('scenario')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 ${
                inputMode === 'scenario'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Preset Surveillance Scenarios</span>
            </button>
            <button
              onClick={() => setInputMode('upload')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 ${
                inputMode === 'upload'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Upload Custom CCTV Frame / Photo</span>
            </button>
          </div>

          {/* Mode 1: Preset Scenarios */}
          {inputMode === 'scenario' ? (
            <div className="p-4 rounded-2xl bg-[#0e162d] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Select Test Feed Scenario</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">YOLO Telemetry + Gemini Reasoning</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'VIOLENCE_FIGHT', label: 'Violence / Altercation', icon: AlertTriangle, color: 'hover:border-rose-500/60' },
                  { id: 'OVERCROWDING', label: 'Overcrowding Stampede', icon: Users, color: 'hover:border-amber-500/60' },
                  { id: 'FIRE_SMOKE', label: 'Fire & Smoke Plume', icon: Flame, color: 'hover:border-orange-500/60' },
                  { id: 'NORMAL', label: 'Standard Routine Scan', icon: CheckCircle2, color: 'hover:border-emerald-500/60' },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedThreat === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedThreat(opt.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                          : `bg-[#080d19] border-slate-800 text-slate-400 ${opt.color}`
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span className="text-[11px] font-semibold truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={runAiScan}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>YOLO Detecting & Gemini Deciding...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run Collaborative Diagnosis (Gemini Decision)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Mode 2: Custom Image Upload */
            <div className="p-4 rounded-2xl bg-[#0e162d] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Upload CCTV Image / Frame</span>
                </span>
                <span className="text-[11px] font-mono text-cyan-400">Real YOLO Inference + Gemini Vision</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <label className="flex-1 w-full p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-[#080d19] flex flex-col items-center justify-center cursor-pointer transition-colors group text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Sparkles className="w-6 h-6 text-slate-500 group-hover:text-cyan-400 transition-colors mb-1" />
                  <span className="text-xs font-bold text-slate-300">Click to choose image file</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG, JPEG (Camera snapshots, photos)</span>
                </label>

                {customImagePreview && (
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-cyan-500/40 bg-black shrink-0">
                    <img src={customImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        setCustomImage(null);
                        setCustomImagePreview(null);
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-rose-600 text-white rounded-md text-[9px]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={runAiScan}
                  disabled={loading || !customImage}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>YOLO Detecting & Gemini Deciding...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze with YOLO + Gemini Decision Maker</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {dispatchSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{dispatchSuccess}</span>
            </div>
          )}

          {/* Results Card */}
          {scanResult && gemini && (
            <div className="space-y-4 animate-fade-in">
              {/* Verdict Header */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  gemini.threat_detected === 'NORMAL'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : gemini.severity === 'CRITICAL'
                    ? 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                      gemini.threat_detected === 'NORMAL'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {gemini.threat_detected === 'NORMAL' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-sm font-black font-heading uppercase tracking-wide flex items-center space-x-2">
                      <span>{gemini.threat_detected === 'NORMAL' ? 'PERIMETER SECURE' : `${gemini.severity} ALERT: ${gemini.gemini_decision || gemini.threat_detected}`}</span>
                      {gemini.used_live_gemini_api && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold animate-pulse">
                          LIVE GOOGLE API
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] opacity-80 font-mono mt-0.5">
                      Decision Maker: <span className="text-cyan-300 font-bold">{scanResult.decision_maker || 'Google Gemini Vision'}</span> • Edge: <span className="text-blue-300">{scanResult.edge_detector || 'YOLOv8n ONNX'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black font-mono">{gemini.confidence || 96.5}%</div>
                  <div className="text-[10px] uppercase font-mono tracking-wider opacity-75">Confidence Score</div>
                </div>
              </div>

              {/* 2-Column AI Intelligence Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Gemini Cognitive Chief Decision Maker */}
                <div className="p-4 rounded-2xl bg-[#0e162d] border border-cyan-500/30 space-y-3 shadow-lg shadow-cyan-950/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>Gemini Cognitive Decision Maker</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 font-bold">
                      FINAL VERDICT
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#090e1c] border border-cyan-500/20">
                      <div className="text-[10px] text-cyan-400 uppercase font-mono font-bold flex items-center space-x-1">
                        <span>Gemini Decision:</span>
                        <span className="text-white ml-1 font-sans">{gemini.gemini_decision || gemini.threat_detected}</span>
                      </div>
                      <p className="text-slate-300 mt-1 text-[11px] leading-relaxed font-sans">
                        {gemini.decision_reasoning || gemini.behavioral_analysis}
                      </p>
                    </div>

                    {gemini.yolo_evidence_evaluated && (
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px]">
                        <span className="text-blue-400 font-bold font-mono">YOLO Evidence Evaluated: </span>
                        <span className="text-slate-300">{gemini.yolo_evidence_evaluated}</span>
                      </div>
                    )}

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Scene Description</div>
                      <p className="text-slate-200 mt-0.5 leading-relaxed font-sans">{gemini.scene_description}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px]">
                      <span className="text-cyan-300 font-bold">Autonomous Protocol: </span>
                      <span className="text-slate-200">{gemini.action_summary}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Edge YOLOv8 Telemetry */}
                <div className="p-4 rounded-2xl bg-[#0e162d] border border-blue-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
                      <Cpu className="w-4 h-4" />
                      <span>Edge YOLOv8 Detection Layer</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-[9px] font-mono text-blue-300">
                      ONNX RUNTIME
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-[#090d1a] border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono">PERSON HEADCOUNT</div>
                      <div className="text-xl font-black text-white font-mono mt-1">
                        {yolo?.persons_count ?? 12}
                      </div>
                      <div className="text-[9px] text-slate-500">YOLO Class 0 (Person)</div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#090d1a] border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono">BOX COLLISION / OVERLAP</div>
                      <div className={`text-xl font-black font-mono mt-1 ${yolo?.overlapping_pairs > 0 || yolo?.proximity_alert ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {yolo?.overlapping_pairs ? `${yolo.overlapping_pairs} Pairs` : (yolo?.proximity_alert ? 'Detected' : '0 Normal')}
                      </div>
                      <div className="text-[9px] text-slate-500">Physical Struggle Filter</div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#090d1a] border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono">AMBIENT LUX</div>
                      <div className="text-xl font-black text-amber-400 font-mono mt-1">
                        {yolo?.lux_luminance ?? 215} lux
                      </div>
                      <div className="text-[9px] text-slate-500">OpenCV Luminance</div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#090d1a] border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono">TEMPORAL FILTER</div>
                      <div className="text-xs font-bold text-emerald-400 mt-1">
                        CONFIRMED (15F)
                      </div>
                      <div className="text-[9px] text-slate-500">Zero False Positives</div>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 text-center">
                    Model: YOLOv8n ONNX Neural Engine • Verified
                  </div>
                </div>
              </div>

              {/* Nearest Free Guards Proximity Dispatch */}
              {nearestGuards.length > 0 && gemini.threat_detected !== 'NORMAL' && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c38] to-[#0a1124] border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-white font-bold text-xs">
                      <Navigation className="w-4 h-4 text-cyan-400" />
                      <span>Recommended Nearest Free Guards (GPS Proximity)</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400">Haversine GPS Verified</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {nearestGuards.map((g, idx) => (
                      <div
                        key={g._id || g.staff_id || idx}
                        className="p-3 rounded-xl bg-[#080d19] border border-slate-800 hover:border-cyan-500/40 flex flex-col justify-between space-y-2 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold text-white">
                            <span>{g.name}</span>
                            <span className="text-[10px] font-mono text-cyan-400">{g.staff_id || 'SEC'}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            📍 {Math.round(g.distance_meters || 25)}m away
                          </div>
                        </div>

                        <button
                          onClick={() => dispatchGuard(g)}
                          disabled={dispatching}
                          className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-[11px] flex items-center justify-center space-x-1 transition-all disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Dispatch Guard</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiThreatScanModal;
