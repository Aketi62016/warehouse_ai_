import React, { useState } from 'react';
import { User, UserRole } from '../../types/warehouse';
import {
  Settings,
  ShieldCheck,
  Sliders,
  Users,
  CheckCircle2,
  Building2,
  Database,
  Cpu
} from 'lucide-react';

interface Props {
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
}

export const SettingsView: React.FC<Props> = ({ currentUser, onRoleChange }) => {
  const [weights, setWeights] = useState({
    deliveryUrgency: 40,
    customerTier: 30,
    orderValue: 15,
    itemAvailability: 15,
    slaPenaltyRisk: 25,
    delayPenalty: 30
  });

  const [savedToast, setSavedToast] = useState(false);

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 4000);
  };

  return (
    <div id="view-settings-configurations" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
              System Governance
            </span>
            <span className="text-xs text-slate-400">Rule Parameters & RBAC</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Platform Settings & Decision Rules</h1>
          <p className="text-xs text-slate-500">
            Configure multi-factor priority algorithm weights, SLA penalty thresholds, and user access permissions.
          </p>
        </div>
      </div>

      {savedToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Decision Engine weights calibrated and synchronized across warehouse microservices.</span>
        </div>
      )}

      {/* Main Grid: Decision Weights & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Priority Engine Tuning */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Algorithm Calibration</span>
              <h2 className="text-lg font-bold text-slate-900">Priority Engine Factor Weights</h2>
            </div>
            <Sliders className="w-4 h-4 text-slate-400" />
          </div>

          <form onSubmit={handleSaveWeights} className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Delivery Urgency (Cutoff Window &lt;4h)</span>
                <span className="text-slate-900 font-bold">{weights.deliveryUrgency} Max Points</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={weights.deliveryUrgency}
                onChange={e => setWeights({ ...weights, deliveryUrgency: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>VIP Customer Tier Weight</span>
                <span className="text-slate-900 font-bold">{weights.customerTier} Max Points</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={weights.customerTier}
                onChange={e => setWeights({ ...weights, customerTier: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Consignment Order Value Weight</span>
                <span className="text-slate-900 font-bold">{weights.orderValue} Max Points</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={weights.orderValue}
                onChange={e => setWeights({ ...weights, orderValue: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Item Bin Availability Readiness</span>
                <span className="text-slate-900 font-bold">{weights.itemAvailability} Max Points</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={weights.itemAvailability}
                onChange={e => setWeights({ ...weights, itemAvailability: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>SLA Contract Penalty Multiplier</span>
                <span className="text-slate-900 font-bold">{weights.slaPenaltyRisk} Max Points</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                value={weights.slaPenaltyRisk}
                onChange={e => setWeights({ ...weights, slaPenaltyRisk: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            <button
              id="btn-save-decision-weights"
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer"
            >
              Save Calibration Parameters
            </button>
          </form>
        </div>

        {/* Right: Operational Facility & Model Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active DC Facility</span>
                <h2 className="text-base font-bold text-slate-900">San Francisco Central DC</h2>
              </div>
              <Building2 className="w-5 h-5 text-slate-500" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Facility Code:</span>
                <strong className="font-mono text-slate-900">SFO-DC-01</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Active Storage Aisles:</span>
                <strong className="text-slate-900">4 Aisles (40 Bins)</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Packing Lines:</span>
                <strong className="text-slate-900">6 Stations (Automated Conveyor)</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Dock Doors:</span>
                <strong className="text-slate-900">8 Outbound Bays</strong>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Intelligence Core</span>
                <h2 className="text-base font-bold text-slate-900">Gemini 3.7 Flash</h2>
              </div>
              <Cpu className="w-5 h-5 text-purple-600" />
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                Decision reasoning is powered by Google DeepMind's Gemini 3.7 Flash model with deterministic mathematical fallback layers.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span>Status: <strong className="text-emerald-600 font-bold">Online & Responsive</strong></span>
                <span>Latency: <strong className="text-slate-900 font-mono">140ms</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
