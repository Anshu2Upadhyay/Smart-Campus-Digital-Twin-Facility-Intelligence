import React, { useState, useEffect } from 'react';
import FacilityLayout from '../../components/FacilityLayout';
import SpatialDigitalTwin2D from '../../components/SpatialDigitalTwin2D';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import {
  Building,
  Zap,
  Snowflake,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Sliders,
  Tv,
  Layers,
  Check,
  Eye,
} from 'lucide-react';

export const FacilityFloorGrid = () => {
  const { notifications } = useSocket();
  const [selectedBlock, setSelectedBlock] = useState('Block-B');
  const [selectedFloor, setSelectedFloor] = useState(2);
  const [toast, setToast] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [rooms, setRooms] = useState([
    {
      id: '201',
      name: 'Room 201 (Lecture Hall)',
      occupancy: 42,
      capacity: 60,
      temp: '22°C',
      acState: 'ON',
      lights: 'ON (100%)',
      powerKw: 2.1,
      status: 'NORMAL',
    },
    {
      id: '202',
      name: 'Room 202 (Computer Lab)',
      occupancy: 28,
      capacity: 35,
      temp: '20°C',
      acState: 'ON',
      lights: 'ON (100%)',
      powerKw: 4.8,
      status: 'NORMAL',
    },
    {
      id: '203',
      name: 'Room 203 (Faculty Lounge)',
      occupancy: 5,
      capacity: 15,
      temp: '24°C',
      acState: 'ECO',
      lights: 'ON (50%)',
      powerKw: 1.2,
      status: 'NORMAL',
    },
    {
      id: '204',
      name: 'Room 204 (Smart Classroom)',
      occupancy: 0,
      capacity: 50,
      temp: '18°C',
      acState: 'ON (GHOST DRAIN)',
      lights: 'ON (GHOST DRAIN)',
      powerKw: 3.54,
      status: 'CRITICAL_GHOST_LOAD',
      alert: 'AC Running 2+ hrs with 0 occupants detected',
    },
    {
      id: '205',
      name: 'Room 205 (Seminar Hall)',
      occupancy: 0,
      capacity: 80,
      temp: '26°C',
      acState: 'OFF',
      lights: 'OFF',
      powerKw: 0.1,
      status: 'STANDBY',
    },
    {
      id: '206',
      name: 'Room 206 (Robotics Studio)',
      occupancy: 12,
      capacity: 25,
      temp: '21°C',
      acState: 'ON',
      lights: 'ON (100%)',
      powerKw: 3.2,
      status: 'NORMAL',
    },
  ]);

  const handleRemoteShutdown = (roomId) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, acState: 'OFF', lights: 'OFF', powerKw: 0.1, status: 'STANDBY', alert: null }
          : r
      )
    );
    setToast({
      type: 'success',
      msg: `⚡ Remote power cut executed for Room ${roomId}. Ghost drain neutralized!`,
    });
  };

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

        {/* Master 2D Campus Digital Twin & Facility Load Blueprint */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Live 2D Spatial Floor Plan & Thermal Load Mesh</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">Reflecting Master Campus Layout</span>
          </div>
          <SpatialDigitalTwin2D height="460px" activeRole="FACILITY" />
        </div>

        {/* Room Grid (3x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room) => {
            const isCritical = room.status === 'CRITICAL_GHOST_LOAD';
            return (
              <div
                key={room.id}
                className={`rounded-2xl border p-4.5 transition-all shadow-sm space-y-3 relative overflow-hidden bg-white ${
                  isCritical
                    ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-amber-500/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Top strip */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <h3 className="text-xs font-extrabold text-slate-800">{room.name}</h3>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isCritical
                        ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                        : room.status === 'STANDBY'
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {room.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Critical Alert Notice */}
                {isCritical && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{room.alert}</span>
                    </div>
                  </div>
                )}

                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Occupancy</span>
                    <span className="text-xs font-bold text-slate-800">
                      {room.occupancy} / {room.capacity} students
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Room Temp</span>
                    <span className="text-xs font-bold text-slate-800">{room.temp}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">HVAC State</span>
                    <span className={`text-xs font-bold ${isCritical ? 'text-amber-700' : 'text-slate-800'}`}>
                      {room.acState}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Virtual Load</span>
                    <span className="text-xs font-bold font-mono text-blue-600">{room.powerKw} kW</span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedRoom(room)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Sensors</span>
                  </button>

                  {isCritical && (
                    <button
                      onClick={() => handleRemoteShutdown(room.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1 shadow-sm"
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      <span>Remote Cutoff</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FacilityLayout>
  );
};

export default FacilityFloorGrid;
