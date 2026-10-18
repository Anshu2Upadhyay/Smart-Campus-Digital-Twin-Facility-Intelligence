import React, { useState, useEffect } from 'react';
import SecurityLayout from '../../components/SecurityLayout';
import CampusMap from '../../components/CampusMap';
import SpatialDigitalTwin2D from '../../components/SpatialDigitalTwin2D';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import MOCK_ASSETS from '../../utils/mockAssets';
import {
  MapPin,
  Compass,
  Radio,
  Shield,
  Users,
  Search,
  RefreshCw,
  Phone,
  BatteryCharging,
  Send,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Eye,
} from 'lucide-react';

export const SecurityGpsRadar = () => {
  const { notifications, liveStaffLocations } = useSocket();
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [toast, setToast] = useState(null);
  const [filterZone, setFilterZone] = useState('ALL');
  const [viewType, setViewType] = useState('2D'); // '2D' (Campus Blueprint) | 'MAP' (Satellite)

  const [guards, setGuards] = useState([
    {
      id: 'SEC-101',
      name: 'Vikram Singh',
      role: 'Senior Security Officer',
      zone: 'Block-B Corridor',
      status: 'RESPONDING',
      lat: 28.6142,
      lng: 77.2091,
      battery: '92%',
      speed: '4.2 km/h',
      signal: '-65 dBm (Strong)',
      avatar: MOCK_ASSETS.avatars.vikramSingh,
      phone: '+91 98765 43101',
    },
    {
      id: 'SEC-102',
      name: 'Rajat Kumar',
      role: 'Patrol Guard',
      zone: 'Gate-1 Entry',
      status: 'ONLINE_FREE',
      lat: 28.6135,
      lng: 77.2082,
      battery: '84%',
      speed: '1.1 km/h',
      signal: '-70 dBm',
      avatar: MOCK_ASSETS.avatars.rajatKumar,
      phone: '+91 98765 43102',
    },
    {
      id: 'SEC-103',
      name: 'Amit Yadav',
      role: 'Hostel Night Watch',
      zone: 'Boys Hostel 3',
      status: 'ONLINE_FREE',
      lat: 28.6148,
      lng: 77.2105,
      battery: '78%',
      speed: '0.0 km/h (Stationary)',
      signal: '-68 dBm',
      avatar: MOCK_ASSETS.avatars.amitYadav,
      phone: '+91 98765 43103',
    },
    {
      id: 'SEC-104',
      name: 'Suresh Patel',
      role: 'Gate Marshal',
      zone: 'Gate-2 Main Boom',
      status: 'BUSY_PATROL',
      lat: 28.6128,
      lng: 77.2078,
      battery: '95%',
      speed: '2.8 km/h',
      signal: '-62 dBm',
      avatar: MOCK_ASSETS.avatars.sureshPatel,
      phone: '+91 98765 43104',
    },
    {
      id: 'SEC-105',
      name: 'Kavita Rawat',
      role: 'Quick Response Team',
      zone: 'Central Library Foyer',
      status: 'ONLINE_FREE',
      lat: 28.6140,
      lng: 77.2098,
      battery: '88%',
      speed: '1.5 km/h',
      signal: '-72 dBm',
      avatar: MOCK_ASSETS.avatars.manojGupta,
      phone: '+91 98765 43105',
    },
  ]);

  const filteredGuards = guards.filter((g) => {
    if (filterZone === 'ALL') return true;
    return g.status === filterZone;
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
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
            <div>
              <h1 className="text-xl font-black font-heading text-white">Live GPS Tracking & Guard Radar</h1>
              <p className="text-xs text-slate-400">High-Precision Field Telemetry • Geofenced Campus Perimeter</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {['ALL', 'RESPONDING', 'ONLINE_FREE', 'BUSY_PATROL'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterZone(status)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  filterZone === status
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Radar Map & Guard Telemetry Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Map Column (8 cols) */}
          <div className="lg:col-span-8 rounded-2xl bg-[#0a0f1d] border border-slate-800 overflow-hidden shadow-2xl relative flex flex-col h-[600px]">
            <div className="p-3 bg-[#0d1428] border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-slate-200">
                  {viewType === '2D' ? 'Live 2D Campus Digital Twin & GPS Radar' : 'Satellite Geofence Radar Mesh'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[11px]">
                  <button
                    onClick={() => setViewType('2D')}
                    className={`px-2.5 py-1 rounded-md font-bold transition ${
                      viewType === '2D' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2D Blueprint
                  </button>
                  <button
                    onClick={() => setViewType('MAP')}
                    className={`px-2.5 py-1 rounded-md font-bold transition ${
                      viewType === 'MAP' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Satellite GPS
                  </button>
                </div>
                <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 hidden sm:inline">
                  ACTIVE PINS: {filteredGuards.length} GUARDS
                </span>
              </div>
            </div>

            <div className="flex-1 relative">
              {viewType === '2D' ? (
                <SpatialDigitalTwin2D height="100%" activeRole="SECURITY" />
              ) : (
                <CampusMap
                  center={{ lat: 28.6139, lng: 77.2090 }}
                  markers={filteredGuards.map((g) => ({
                    id: g.id,
                    lat: g.lat,
                    lng: g.lng,
                    label: `${g.name} (${g.id})`,
                    type: 'guard',
                    status: g.status,
                  }))}
                  onMarkerClick={(m) => {
                    const found = guards.find((x) => x.id === m.id);
                    if (found) setSelectedGuard(found);
                  }}
                />
              )}

              {/* Floating Radar Legend */}
              <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-[#0a0f1d]/90 backdrop-blur-md border border-slate-800 text-[11px] font-mono space-y-1.5 shadow-xl">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-slate-300">Responding to Emergency</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-slate-300">Patrol Ready / Free</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-slate-300">Active Perimeter Walk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guard Roster & Telemetry Card (4 cols) */}
          <div className="lg:col-span-4 space-y-3 flex flex-col h-[600px]">
            <div className="p-3 bg-[#0a0f1d] border border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Guard Telemetry Feed</span>
                <span className="font-mono text-[10px] text-blue-400">5 ONLINE</span>
              </h3>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {filteredGuards.map((g) => {
                  const isSelected = selectedGuard?.id === g.id;
                  return (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGuard(g)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={g.avatar}
                            alt={g.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="text-xs font-bold text-white leading-tight">{g.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{g.id} • {g.role}</div>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            g.status === 'RESPONDING'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : g.status === 'ONLINE_FREE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {g.status}
                        </span>
                      </div>

                      <div className="mt-2.5 grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                        <div>
                          <span className="text-slate-500 block text-[9px]">ZONE</span>
                          <span className="text-slate-200 truncate block">{g.zone}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">SPEED</span>
                          <span className="text-cyan-400 block">{g.speed}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">BATTERY</span>
                          <span className="text-emerald-400 block">{g.battery}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Direct Command Button */}
              {selectedGuard && (
                <div className="pt-3 border-t border-slate-800 mt-2 space-y-2">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Order: {selectedGuard.name}</span>
                    <a href={`tel:${selectedGuard.phone}`} className="text-[11px] text-blue-400 flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span>{selectedGuard.phone}</span>
                    </a>
                  </div>
                  <button
                    onClick={() => {
                      setToast({ msg: `⚡ Tactical order transmitted to ${selectedGuard.name} (${selectedGuard.id}).` });
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Re-Route Waypoint</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SecurityLayout>
  );
};

export default SecurityGpsRadar;
