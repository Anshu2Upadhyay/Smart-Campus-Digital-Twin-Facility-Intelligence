import React, { useState, useEffect } from 'react';
import FacilityLayout from '../../components/FacilityLayout';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import MOCK_ASSETS from '../../utils/mockAssets';
import {
  Video,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  Maximize2,
  Tv,
  Camera,
  Layers,
  Building,
} from 'lucide-react';

export const FacilityCctvVerify = () => {
  const { notifications } = useSocket();
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState('');
  const [toast, setToast] = useState(null);

  const loadFacilityCameras = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/facility/cameras');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((c, idx) => ({
          id: c.camera_id || c.id,
          title: c.title || `${c.block_name} • Camera ${c.camera_id}`,
          location: c.location || `${c.block_name} Floor ${c.floor_number ?? 0}`,
          status: c.status || 'NORMAL',
          image: idx % 3 === 0
            ? (MOCK_ASSETS.evidencePhoto || MOCK_ASSETS.classroomFeed)
            : idx % 3 === 1
            ? MOCK_ASSETS.corridorCam
            : MOCK_ASSETS.groundsCam,
          ticket: c.ticket || `TK-${(c.camera_id || '1000').slice(-4)}`,
          details: c.details || 'Visual verification of indoor equipment and appliances.',
        }));
        setFeeds(mapped);
        setSelectedFeed(prev => (mapped.some(m => m.id === prev) ? prev : mapped[0].id));
      } else {
        setFeeds([]);
      }
    } catch (err) {
      console.error('Failed to load facility cameras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilityCameras();
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      loadFacilityCameras();
    }
  }, [notifications]);

  const current = feeds.find((f) => f.id === selectedFeed) || feeds[0] || {
    id: 'NONE',
    title: 'No Permitted Cameras',
    location: 'Campus',
    status: 'NORMAL',
    image: MOCK_ASSETS.classroomFeed,
    ticket: 'N/A',
    details: 'Admin has not granted access to any CCTV cameras for this account, or no cameras are connected.',
  };

  const handleApprove = () => {
    setToast({
      type: 'success',
      msg: `✅ Visual quality approved for ${current.title}. Ticket marked completed!`,
    });
  };

  return (
    <FacilityLayout>
      <div className="space-y-6">
        {/* Toast Feedback */}
        {toast && (
          <div className="p-3.5 rounded-xl border border-emerald-500/50 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toast.msg}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading text-slate-900">CCTV Facility Verification</h1>
              <p className="text-xs text-slate-500">Live Visual Inspection of Physical Equipment Before & After Repairs</p>
            </div>
          </div>
        </div>

        {/* Main Feed + Inspection Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Live Video Canvas (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{current.title}</h3>
                <p className="text-xs text-slate-500 font-mono">{current.location}</p>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
                TICKET: {current.ticket}
              </span>
            </div>

            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-200">
              <img src={current.image} alt={current.title} className="w-full h-full object-cover" />

              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-sm text-cyan-400 text-xs font-mono border border-cyan-500/30">
                LIVE HD VERIFICATION STREAM
              </div>

              <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded bg-black/75 text-slate-300 text-[10px] font-mono">
                {new Date().toLocaleTimeString()} • 30 FPS
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block">Inspection Note:</span>
              <p>{current.details}</p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setToast({ type: 'info', msg: 'Re-visit request sent to ground technician.' })}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Request Re-visit
              </button>
              <button
                onClick={handleApprove}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Approve Maintenance Quality</span>
              </button>
            </div>
          </div>

          {/* Camera Selection List (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
              Active Verification Feeds
            </h3>

            <div className="space-y-2.5">
              {feeds.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFeed(f.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedFeed === f.id
                      ? 'bg-blue-50/70 border-blue-500 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="truncate">{f.title}</span>
                    <span className="text-[10px] text-blue-600 font-mono shrink-0 ml-1">#{f.ticket}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{f.location}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FacilityLayout>
  );
};

export default FacilityCctvVerify;
