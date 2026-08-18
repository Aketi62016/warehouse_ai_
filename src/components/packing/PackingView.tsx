import React, { useState } from 'react';
import { PackingStation } from '../../types/warehouse';
import {
  PackageCheck,
  AlertTriangle,
  Users,
  Timer,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  Boxes
} from 'lucide-react';

interface Props {
  stations: PackingStation[];
  onCompletePacking: (stationId: string, orderId: string) => Promise<any>;
  onRebalance: () => Promise<any>;
}

export const PackingView: React.FC<Props> = ({
  stations = [],
  onCompletePacking,
  onRebalance
}) => {
  const safeStations = stations || [];
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [completingStationId, setCompletingStationId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleRebalance = async () => {
    setIsRebalancing(true);
    try {
      await onRebalance();
      setSuccessToast('Packing station conveyor lines dynamically rebalanced. Backlog cleared on overloaded stations.');
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRebalancing(false);
    }
  };

  const handleComplete = async (stationId: string, orderId: string) => {
    setCompletingStationId(stationId);
    try {
      await onCompletePacking(stationId, orderId);
      setSuccessToast(`Order ${orderId} successfully packed and routed to QC Check.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingStationId(null);
    }
  };

  const overloadedStations = safeStations.filter(s => s.isOverloaded);

  return (
    <div id="view-packing-management" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
              Packing Station Operations
            </span>
            <span className="text-xs text-slate-400">Load Balancer & Conveyor Dispatch</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Packing Stations & Conveyor Routing</h1>
          <p className="text-xs text-slate-500">
            Monitors parceling velocity, station queue depths, and automatically balances throughput across active lines.
          </p>
        </div>

        <button
          id="btn-rebalance-packing-stations"
          onClick={handleRebalance}
          disabled={isRebalancing}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Zap className="w-4 h-4 fill-current text-amber-400" />
          <span>{isRebalancing ? 'Rebalancing Lines...' : '1-Click Line Rebalancer'}</span>
        </button>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Overload Alert Strip */}
      {overloadedStations.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-rose-950 font-semibold">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>
              <strong>Station Overload Warning:</strong> {overloadedStations.map(s => `${s.name} (${s.utilizationPercent}% capacity)`).join(', ')} has exceeded standard throughput thresholds.
            </span>
          </div>
          <button
            onClick={handleRebalance}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer"
          >
            Rebalance Now
          </button>
        </div>
      )}

      {/* 6 Packing Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {safeStations.map(station => {
          const isOverloaded = station.isOverloaded;
          const isCompleting = completingStationId === station.id;

          return (
            <div
              key={station.id}
              id={`card-packing-station-${station.id}`}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                isOverloaded
                  ? 'border-rose-300 ring-2 ring-rose-100'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                {/* Station Title & Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-sm text-slate-900">{station.name}</h2>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Operator: <strong>{station.assignedStaff}</strong></span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isOverloaded
                        ? 'bg-rose-100 text-rose-800'
                        : station.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {station.status}
                  </span>
                </div>

                {/* Utilization Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Station Load</span>
                    <span className={isOverloaded ? 'text-rose-600 font-bold' : 'text-slate-900 font-bold'}>
                      {station.utilizationPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isOverloaded
                          ? 'bg-rose-500'
                          : station.utilizationPercent > 70
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(station.utilizationPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Turnaround Time & Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">AVG PACK TIME</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5 text-slate-500" />
                      {station.avgPackingTimeMin} min / order
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">QUEUE DEPTH</span>
                    <span className={`font-bold ${(station.queuedOrders?.length || 0) > 3 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {station.queuedOrders?.length || 0} orders waiting
                    </span>
                  </div>
                </div>

                {/* Current Active Order */}
                {station.currentOrderId ? (
                  <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-indigo-950">
                      <span>Currently Packing:</span>
                      <span className="font-mono">{station.currentOrderId}</span>
                    </div>
                    <p className="text-[11px] text-indigo-900/80">
                      Standard bubble-wrap cushioning & reinforced outer carton.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                    Station idle · Ready for infeed parcel
                  </div>
                )}
              </div>

              {/* Action Button */}
              {station.currentOrderId && (
                <button
                  id={`btn-complete-packing-${station.id}`}
                  onClick={() => handleComplete(station.id, station.currentOrderId!)}
                  disabled={isCompleting}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{isCompleting ? 'Finalizing QC Routing...' : 'Complete Packing & Send to QC'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
