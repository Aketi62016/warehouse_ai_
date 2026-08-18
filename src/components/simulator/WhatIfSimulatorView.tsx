import React, { useState } from 'react';
import { WhatIfSimulationInput, WhatIfSimulationResult } from '../../types/warehouse';
import {
  FlaskConical,
  Play,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

interface Props {
  onRunSimulation: (input: WhatIfSimulationInput) => Promise<WhatIfSimulationResult>;
}

export const WhatIfSimulatorView: React.FC<Props> = ({ onRunSimulation }) => {
  const [scenarioName, setScenarioName] = useState('20 Urgent Orders Surge');
  const [urgentOrderSurge, setUrgentOrderSurge] = useState(20);
  const [workersAbsent, setWorkersAbsent] = useState(2);
  const [packingStationOffline, setPackingStationOffline] = useState(1);
  const [inventoryDropPercentage, setInventoryDropPercentage] = useState(15);
  const [supplierDelayDays, setSupplierDelayDays] = useState(2);
  const [carrierCutoffEarlierHours, setCarrierCutoffEarlierHours] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WhatIfSimulationResult | null>({
    scenarioName: '20 Urgent Orders Surge',
    currentScore: 87,
    projectedScore: 68,
    scoreDelta: -19,
    projectedDelayedOrders: 8,
    projectedBottleneckStage: 'Packing & Station Queues',
    slaBreachRiskPercent: 34,
    recommendedRecoveryActions: [
      'Fast-track wave picking for top 5 critical orders immediately',
      'Temporarily cross-assign 1 picker to Packing Station 03 to balance line velocity',
      'Issue emergency PO for optical sensors to prevent downstream stock depletion',
      'Request carrier window extension by 45 minutes for late evening dispatch'
    ]
  });

  const presets = [
    {
      name: 'Black Friday Rush',
      surge: 35,
      absent: 1,
      offline: 0,
      invDrop: 25,
      delay: 0,
      cutoff: 0
    },
    {
      name: 'Conveyor 03 Breakdown',
      surge: 10,
      absent: 0,
      offline: 2,
      invDrop: 0,
      delay: 0,
      cutoff: 0
    },
    {
      name: 'Global Supply Chain Delay',
      surge: 5,
      absent: 0,
      offline: 0,
      invDrop: 40,
      delay: 4,
      cutoff: 0
    },
    {
      name: 'Severe Staff Shortage',
      surge: 15,
      absent: 4,
      offline: 1,
      invDrop: 10,
      delay: 1,
      cutoff: 2
    }
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setScenarioName(p.name);
    setUrgentOrderSurge(p.surge);
    setWorkersAbsent(p.absent);
    setPackingStationOffline(p.offline);
    setInventoryDropPercentage(p.invDrop);
    setSupplierDelayDays(p.delay);
    setCarrierCutoffEarlierHours(p.cutoff);
  };

  const handleRun = async () => {
    setIsLoading(true);
    try {
      const res = await onRunSimulation({
        scenarioName,
        urgentOrderSurge,
        workersAbsent,
        packingStationOffline,
        inventoryDropPercentage,
        supplierDelayDays,
        carrierCutoffEarlierHours
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="view-what-if-simulator" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
              Scenario Modeling & Resilience
            </span>
            <span className="text-xs text-slate-400">Stress Testing Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">What-If Operational Scenario Simulator</h1>
          <p className="text-xs text-slate-500">
            Simulate operational disruptions, demand spikes, and labor constraints to forecast bottleneck formation and test recovery plans.
          </p>
        </div>
      </div>

      {/* Scenario Presets Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Load Pre-Configured Disruption Scenarios
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                scenarioName === p.name
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Parameter Controls & Simulation Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Controls */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Simulation Variables</span>
              <h2 className="text-lg font-bold text-slate-900">Stress Parameters</h2>
            </div>
            <Sliders className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4 text-xs">
            {/* Surge */}
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Urgent VIP Order Surge</span>
                <span className="text-slate-900">+{urgentOrderSurge} orders</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={urgentOrderSurge}
                onChange={e => setUrgentOrderSurge(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            {/* Workers Absent */}
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Worker Absence / Staff Shortage</span>
                <span className="text-slate-900">-{workersAbsent} workers</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={workersAbsent}
                onChange={e => setWorkersAbsent(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            {/* Packing Stations Offline */}
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Packing Stations Offline / Maintenance</span>
                <span className="text-slate-900">{packingStationOffline} stations down</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                value={packingStationOffline}
                onChange={e => setPackingStationOffline(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            {/* Inventory Shrinkage */}
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Inventory Drop / Physical Discrepancy</span>
                <span className="text-slate-900">-{inventoryDropPercentage}% stock</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={inventoryDropPercentage}
                onChange={e => setInventoryDropPercentage(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            {/* Supplier Delay */}
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Supplier Lead Time Delay</span>
                <span className="text-slate-900">+{supplierDelayDays} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                value={supplierDelayDays}
                onChange={e => setSupplierDelayDays(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            {/* Carrier Cutoff Earlier */}
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Earlier Carrier Dock Cutoff</span>
                <span className="text-slate-900">-{carrierCutoffEarlierHours} hours</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                value={carrierCutoffEarlierHours}
                onChange={e => setCarrierCutoffEarlierHours(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>
          </div>

          <button
            id="btn-run-what-if-simulation"
            onClick={handleRun}
            disabled={isLoading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isLoading ? 'Simulating Dynamic Load...' : 'Run Scenario Simulation'}</span>
          </button>
        </div>

        {/* Right: Simulation Forecast & Recovery Roadmap */}
        {result && (
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Forecast Outcome</span>
                <h2 className="text-lg font-bold text-slate-900">{result.scenarioName}</h2>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                {result.scoreDelta} PTS Impact
              </span>
            </div>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block">PROJECTED HEALTH</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {result.projectedScore} <span className="text-xs text-rose-600 font-bold">({result.scoreDelta})</span>
                </div>
                <span className="text-[10px] text-slate-500">Current baseline: {result.currentScore}</span>
              </div>

              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200">
                <span className="text-[10px] text-rose-700 font-bold block">PROJECTED DELAYED ORDERS</span>
                <div className="text-2xl font-extrabold text-rose-900 mt-0.5">
                  +{result.projectedDelayedOrders} orders
                </div>
                <span className="text-[10px] text-rose-600 font-medium">SLA Risk: {result.slaBreachRiskPercent}%</span>
              </div>
            </div>

            {/* Primary Bottleneck Stage */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Primary Bottleneck Formation:</span>
              </div>
              <p className="text-amber-950 font-semibold">{result.projectedBottleneckStage}</p>
            </div>

            {/* Recommended Recovery Actions */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Prescribed Recovery Roadmap (AI & Rule-Engine Mitigation)
              </span>

              <div className="space-y-2 text-xs">
                {(result.recommendedRecoveryActions || []).map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2.5 font-medium text-slate-800"
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
