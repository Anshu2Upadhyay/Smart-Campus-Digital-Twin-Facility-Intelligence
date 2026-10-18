import React, { useState } from 'react';
import FacilityLayout from '../../components/FacilityLayout';
import {
  Activity,
  Zap,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Sun,
  BatteryCharging,
  Power,
  RefreshCw,
  TrendingDown,
  Building,
  Sliders,
} from 'lucide-react';

export const FacilityEnergyMonitoring = () => {
  const [toast, setToast] = useState(null);
  const [breakerStates, setBreakerStates] = useState({
    'B-204-HVAC': true,
    'B-204-LIGHTS': true,
    'A-LAB-COMPUTERS': true,
    'C-AUD-AV': false,
  });

  const toggleBreaker = (breakerId) => {
    const newState = !breakerStates[breakerId];
    setBreakerStates((prev) => ({ ...prev, [breakerId]: newState }));
    setToast({
      type: newState ? 'info' : 'warning',
      msg: `Breaker ${breakerId} turned ${newState ? 'ON' : 'OFF (CUTOFF)'}.`,
    });
  };

  return (
    <FacilityLayout>
      <div className="space-y-6">
        {/* Toast Feedback */}
        {toast && (
          <div className="p-3.5 rounded-xl border border-blue-500/50 bg-blue-50 text-blue-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{toast.msg}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading text-slate-900">Energy & Ghost Load AI Sentinel</h1>
              <p className="text-xs text-slate-500">Autonomous Power Telemetry • Phantom Load Detection • Remote Circuit Breakers</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>GRID STABLE • 50.02 Hz</span>
            </span>
          </div>
        </div>

        {/* Key Power Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Active Campus Load</span>
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">142.4 <span className="text-sm font-normal text-slate-500">kW</span></div>
            <p className="text-[10px] text-emerald-600 font-bold">-4.2% vs yesterday peak</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Rooftop Solar Yield</span>
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">48.6 <span className="text-sm font-normal text-slate-500">kW</span></div>
            <p className="text-[10px] text-amber-600 font-bold">Supplying 34% total power</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Identified Ghost Drain</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-600">3.54 <span className="text-sm font-normal text-slate-500">kW</span></div>
            <p className="text-[10px] text-rose-600 font-bold">Block-B Room 204 Active</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Estimated Cost Savings</span>
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">₹ 14,280 <span className="text-sm font-normal text-slate-500">/mo</span></div>
            <p className="text-[10px] text-emerald-600 font-bold">Via AI Auto-cutoff</p>
          </div>
        </div>

        {/* Ghost Load Alert Panel */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-50 border border-amber-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md shadow-amber-500/20">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                  ACTIVE GHOST DRAIN
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">3.54 kW WASTED</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Block-B Room 204: AC Running with Zero Occupancy
              </h3>
              <p className="text-xs text-slate-600">
                PIR Motion Sensor + Vision AI confirmed 0 persons inside for &gt; 120 minutes. Thermostat set to 18°C.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => toggleBreaker('B-204-HVAC')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md ${
                breakerStates['B-204-HVAC']
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{breakerStates['B-204-HVAC'] ? 'Cutoff AC Breaker' : 'Restore AC Breaker'}</span>
            </button>
          </div>
        </div>

        {/* Remote Smart Breaker Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Virtual IoT Circuit Breakers & Remote Relays</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {[
              { id: 'B-204-HVAC', name: 'Block-B Room 204 (HVAC AC)', load: '3.10 kW' },
              { id: 'B-204-LIGHTS', name: 'Block-B Room 204 (Lighting)', load: '0.44 kW' },
              { id: 'A-LAB-COMPUTERS', name: 'Block-A Lab 101 (Workstations)', load: '4.80 kW' },
              { id: 'C-AUD-AV', name: 'Block-C Auditorium (Sound & Lights)', load: '0.00 kW' },
            ].map((brk) => {
              const isOn = breakerStates[brk.id];
              return (
                <div key={brk.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] leading-tight truncate">{brk.name}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isOn ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  <div className="text-[10px] font-mono text-slate-500">
                    Load: <strong className="text-slate-800">{isOn ? brk.load : '0.00 kW'}</strong>
                  </div>

                  <button
                    onClick={() => toggleBreaker(brk.id)}
                    className={`w-full py-1.5 px-3 rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1.5 transition-colors ${
                      isOn
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{isOn ? 'Remote Turn OFF' : 'Remote Turn ON'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </FacilityLayout>
  );
};

export default FacilityEnergyMonitoring;
