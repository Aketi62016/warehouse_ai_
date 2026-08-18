import React from 'react';
import { WarehouseHealth } from '../../types/warehouse';
import { ShieldCheck, AlertTriangle, AlertOctagon, TrendingUp, Sparkles } from 'lucide-react';

interface Props {
  health: WarehouseHealth;
  compact?: boolean;
  onDrillDown?: () => void;
}

export const HealthScoreGauge: React.FC<Props> = ({ health, compact = false, onDrillDown }) => {
  const score = health?.overallScore ?? 88;
  const metrics = health?.metrics || {
    orderFulfillmentRate: 95.8,
    inventoryHealth: 91.2,
    pickingEfficiency: 94.0,
    dispatchPerformance: 96.5,
    exceptionRate: 1.8,
    delayedOrdersRate: 3.2,
    stockoutFrequency: 1.1
  };
  const recommendations = health?.recommendations || [];
  const status = health?.status || 'OPTIMAL';

  let colorClasses = {
    ring: 'stroke-emerald-600',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badge: 'bg-emerald-600 text-white',
    icon: ShieldCheck,
    label: 'Optimal Operating State'
  };

  if (score < 50) {
    colorClasses = {
      ring: 'stroke-rose-600',
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      badge: 'bg-rose-600 text-white',
      icon: AlertOctagon,
      label: 'Critical Bottlenecks Active'
    };
  } else if (score < 70) {
    colorClasses = {
      ring: 'stroke-amber-500',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: 'bg-amber-600 text-white',
      icon: AlertTriangle,
      label: 'Operational Friction Detected'
    };
  } else if (score < 85) {
    colorClasses = {
      ring: 'stroke-blue-600',
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      badge: 'bg-blue-600 text-white',
      icon: TrendingUp,
      label: 'Stable Throughput'
    };
  }

  const Icon = colorClasses.icon;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  if (compact) {
    return (
      <div 
        id="widget-health-compact"
        onClick={onDrillDown}
        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${colorClasses.bg}`}
      >
        <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
          <svg className="w-12 h-12 -rotate-90">
            <circle cx="24" cy="24" r="20" className="stroke-slate-200 fill-none" strokeWidth="4" />
            <circle
              cx="24"
              cy="24"
              r="20"
              className={`${colorClasses.ring} fill-none transition-all duration-1000 ease-out`}
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 - (score / 100) * (2 * Math.PI * 20)}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute font-bold text-sm text-slate-900">{score}</span>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Warehouse Health</div>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
            <Icon className="w-3.5 h-3.5 inline" />
            {status}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="card-warehouse-health-score" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Real-Time Operational Index</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${colorClasses.badge}`}>
              {status}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Warehouse Health Score</h2>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">Updated: Just now</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Gauge Center */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-32 h-32 -rotate-90">
              <circle cx="64" cy="64" r="48" className="stroke-slate-200 fill-none" strokeWidth="9" />
              <circle
                cx="64"
                cy="64"
                r="48"
                className={`${colorClasses.ring} fill-none transition-all duration-1000 ease-out`}
                strokeWidth="9"
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 - (score / 100) * (2 * Math.PI * 48)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{score}</span>
              <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">/ 100 PTS</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-2 text-center">{colorClasses.label}</p>
        </div>

        {/* Sub-Score Bars */}
        <div className="md:col-span-8 space-y-3">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Order Fulfillment Rate</span>
              <span className="font-bold text-slate-900">{metrics.orderFulfillmentRate}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${metrics.orderFulfillmentRate}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Inventory Availability Health</span>
              <span className="font-bold text-slate-900">{metrics.inventoryHealth}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${metrics.inventoryHealth}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Picking Route Efficiency</span>
              <span className="font-bold text-slate-900">{metrics.pickingEfficiency}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${metrics.pickingEfficiency}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Dispatch On-Time Performance</span>
              <span className="font-bold text-slate-900">{metrics.dispatchPerformance}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: `${metrics.dispatchPerformance}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-medium">
            <span>Exception Rate: <strong className="text-slate-800">{metrics.exceptionRate}%</strong></span>
            <span>Delayed Orders: <strong className="text-slate-800">{metrics.delayedOrdersRate}%</strong></span>
            <span>Stockout Freq: <strong className="text-slate-800">{metrics.stockoutFrequency}%</strong></span>
          </div>
        </div>
      </div>

      {/* Health Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-5 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            AI Operational Recovery Recommendation
          </div>
          <ul className="space-y-1 text-xs text-amber-900/90 list-disc list-inside">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
