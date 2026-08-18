import React, { useState } from 'react';
import { AllocationConflict } from '../../types/warehouse';
import { PriorityBadge } from '../common/StatusBadge';
import {
  GitMerge,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sliders,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface Props {
  conflicts: AllocationConflict[];
  onExecuteAllocation: (conflictId: string, allocations: Record<string, number>) => Promise<any>;
}

export const AllocationCenterView: React.FC<Props> = ({
  conflicts = [],
  onExecuteAllocation
}) => {
  const safeConflicts = conflicts || [];
  const [selectedConflictId, setSelectedConflictId] = useState<string>(safeConflicts[0]?.id || '');
  const [manualAllocations, setManualAllocations] = useState<Record<string, number>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync selected conflict
  React.useEffect(() => {
    if (!selectedConflictId && safeConflicts.length > 0) {
      setSelectedConflictId(safeConflicts[0].id);
    }
  }, [safeConflicts, selectedConflictId]);

  const currentConflict = safeConflicts.find(c => c.id === selectedConflictId) || safeConflicts[0];

  const handleSliderChange = (orderId: string, value: number) => {
    setManualAllocations(prev => ({
      ...prev,
      [orderId]: value
    }));
  };

  const handleExecute = async () => {
    if (!currentConflict) return;
    setIsExecuting(true);
    try {
      const payloadAllocations = Object.keys(manualAllocations).length > 0
        ? manualAllocations
        : (currentConflict.recommendedAllocations || {});

      await onExecuteAllocation(currentConflict.id, payloadAllocations);
      setSuccessToast(`Smart allocation successfully executed for ${currentConflict.sku} (${currentConflict.productName}).`);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecuting(false);
    }
  };

  if (!currentConflict || safeConflicts.length === 0) {
    return (
      <div id="view-allocation-empty" className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Zero Inventory Contention Detected</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          All pending warehouse orders have 100% available stock in their respective bins. Decision Engine continues continuous monitoring.
        </p>
      </div>
    );
  }

  const currentAllocMap = Object.keys(manualAllocations).length > 0
    ? manualAllocations
    : (currentConflict.recommendedAllocations || {});

  const totalAllocated = Object.values(currentAllocMap).reduce<number>((a, b) => a + Number(b || 0), 0);

  return (
    <div id="view-allocation-center" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Smart Resource Allocation
            </span>
            <span className="text-xs text-slate-400">Inventory Contention Resolver</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Allocation Intelligence Center</h1>
          <p className="text-xs text-slate-500">
            Resolves stock conflicts when multiple high-priority orders compete for scarce inventory using SLA penalties and VIP customer tier ranking.
          </p>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Conflict Selector Tabs */}
      {conflicts.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {conflicts.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedConflictId(c.id);
                setManualAllocations({});
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                (selectedConflictId === c.id || (!selectedConflictId && c.id === conflicts[0].id))
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{c.sku} · {c.productName}</span>
              <span className="ml-2 px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded-full text-[10px]">
                {c.shortageQty} Short
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Conflict Summary Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">PRODUCT & SKU</span>
          <div className="text-sm font-bold text-slate-900 mt-0.5">{currentConflict.productName}</div>
          <span className="font-mono text-xs text-slate-500">{currentConflict.sku}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">ON-HAND AVAILABLE</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">{currentConflict.availableStock} pcs</div>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">TOTAL DEMAND FROM ORDERS</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-0.5">{currentConflict.totalRequested} pcs</div>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">NET DEFICIT / SHORTAGE</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-0.5">-{currentConflict.shortageQty} pcs</div>
        </div>
      </div>

      {/* Main Grid: Competing Orders & Explainable AI Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Competing Orders List */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Contenders</span>
              <h2 className="text-lg font-bold text-slate-900">Competing Orders for Stock</h2>
            </div>
            <span className="text-xs text-slate-500">
              Allocated: <strong className={totalAllocated > currentConflict.availableStock ? 'text-rose-600' : 'text-slate-900'}>{totalAllocated} / {currentConflict.availableStock}</strong>
            </span>
          </div>

          <div className="space-y-3.5">
            {(currentConflict.competingOrders || []).map(order => {
              const allocated = currentAllocMap[order.orderId] ?? currentConflict.recommendedAllocations?.[order.orderId] ?? 0;
              const isFull = allocated === order.requestedQty;
              const isPartial = allocated > 0 && allocated < order.requestedQty;

              return (
                <div
                  key={order.orderId}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{order.orderNumber}</span>
                        <span className="text-xs text-slate-700 font-semibold">· {order.customer}</span>
                        <PriorityBadge priority={order.priority} score={order.priorityScore} />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Customer Tier: <strong className="text-slate-700">{order.customerTier}</strong> · Consignment Value: ${order.orderValue.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Delivery Deadline: <strong>{new Date(order.expectedDelivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> ({order.hoursRemaining.toFixed(1)}h remaining)
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${isFull ? 'bg-emerald-100 text-emerald-800' : isPartial ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                        {isFull ? '100% Fulfilled' : isPartial ? `Partial (${allocated}/${order.requestedQty})` : 'Deferred / Backordered'}
                      </span>
                    </div>
                  </div>

                  {/* Allocation Slider Control */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Assigned Units</span>
                      <span>
                        <strong className="text-slate-900 text-sm">{allocated}</strong> / {order.requestedQty} requested
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={order.requestedQty}
                      value={allocated}
                      onChange={e => handleSliderChange(order.orderId, Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explainable AI Decision Card */}
        <div className="lg:col-span-5 bg-gradient-to-b from-purple-50/50 to-white rounded-2xl p-6 border border-purple-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">Explainable Decision Engine</h2>
            </div>

            <div className="p-4 bg-white rounded-xl border border-purple-100 shadow-2xs space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                Primary Recommendation
              </span>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {currentConflict.reasoning}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Decision Factors
              </span>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>SLA Penalty Avoidance:</strong> Prioritizes tightest delivery window (&lt;4h).</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>VIP Retention:</strong> Zero penalty tolerance for Tier 1 contract accounts.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Partial Shipment Optimization:</strong> Sends in-stock critical components immediately to unblock downstream assembly.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-purple-100 space-y-3">
            <button
              id="btn-execute-allocation"
              onClick={handleExecute}
              disabled={isExecuting || totalAllocated > currentConflict.availableStock}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isExecuting ? 'Allocating Inventory...' : 'Execute Intelligent Allocation'}</span>
            </button>
            {totalAllocated > currentConflict.availableStock && (
              <p className="text-[11px] font-semibold text-rose-600 text-center">
                Allocated units ({totalAllocated}) exceed available stock ({currentConflict.availableStock}). Please reduce slider values.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
