import React, { useState } from 'react';
import { DispatchRecord, Order } from '../../types/warehouse';
import { PriorityBadge, StatusBadge } from '../common/StatusBadge';
import {
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  PackageCheck,
  FileCheck,
  ShieldCheck,
  Send,
  Boxes,
  Sparkles
} from 'lucide-react';

interface Props {
  dispatches: DispatchRecord[];
  readyOrders: Order[];
  onDispatchOrder: (orderId: string, carrier: string, trackingNumber: string) => Promise<any>;
}

export const DispatchView: React.FC<Props> = ({
  dispatches = [],
  readyOrders = [],
  onDispatchOrder
}) => {
  const safeDispatches = dispatches || [];
  const safeReadyOrders = readyOrders || [];
  const [selectedOrderId, setSelectedOrderId] = useState<string>(safeReadyOrders[0]?.id || '');
  const [carrier, setCarrier] = useState('FedEx Priority Overnight');
  const [trackingNumber, setTrackingNumber] = useState(`TRK-FDX-${Date.now() % 1000000}`);
  const [isDispatching, setIsDispatching] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync selectedOrderId if readyOrders changes
  React.useEffect(() => {
    if (!selectedOrderId && safeReadyOrders.length > 0) {
      setSelectedOrderId(safeReadyOrders[0].id);
    }
  }, [safeReadyOrders, selectedOrderId]);

  const lifecycleStages = [
    { label: 'Order Created', icon: Boxes },
    { label: 'Priority Scored', icon: Sparkles },
    { label: 'Stock Allocated', icon: CheckCircle2 },
    { label: 'Wave Picked', icon: Clock },
    { label: 'Station Packed', icon: PackageCheck },
    { label: 'QC Verified', icon: ShieldCheck },
    { label: 'Carrier Dispatch', icon: Truck },
    { label: 'Inventory Settled', icon: FileCheck }
  ];

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setIsDispatching(true);
    try {
      await onDispatchOrder(selectedOrderId, carrier, trackingNumber);
      setSuccessToast(`Order ${selectedOrderId} manifested with ${carrier} (Tracking: ${trackingNumber}) and dispatched.`);
      setTimeout(() => setSuccessToast(null), 5000);
      setTrackingNumber(`TRK-FDX-${(Date.now() + 1) % 1000000}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div id="view-dispatch-management" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
              Outbound Logistics & Carrier Integration
            </span>
            <span className="text-xs text-slate-400">Dock Loading & SLA Guarantee</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Dispatch Tracking & Carrier Manifests</h1>
          <p className="text-xs text-slate-500">
            Final stage of warehouse fulfillment lifecycle: carrier manifest generation, bill of lading, and real-time outbound tracking.
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

      {/* Visual Fulfillment Lifecycle Strip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Complete Warehouse Fulfillment Lifecycle Sequence
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {lifecycleStages.map((stage, sIdx) => {
            const Icon = stage.icon;
            return (
              <div
                key={sIdx}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col items-center text-center space-y-1"
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">{stage.label}</span>
                <span className="text-[9px] text-slate-400 font-mono">Stage 0{sIdx + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Manifest Action Terminal & Dispatched Outbound Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dispatch Action Terminal */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Outbound Dock</span>
              <h2 className="text-lg font-bold text-slate-900">Manifest Ready Orders</h2>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl font-bold">
              {safeReadyOrders.length} Orders Staged
            </span>
          </div>

          {safeReadyOrders.length > 0 ? (
            <form onSubmit={handleDispatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Staged Order</label>
                <select
                  value={selectedOrderId}
                  onChange={e => setSelectedOrderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                >
                  {safeReadyOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customer} ({o.items?.length || 0} items · ${(o.totalValue || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Carrier</label>
                  <select
                    value={carrier}
                    onChange={e => setCarrier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  >
                    <option value="FedEx Priority Overnight">FedEx Priority Overnight (Direct)</option>
                    <option value="UPS Next Day Air">UPS Next Day Air Saver</option>
                    <option value="DHL Express Worldwide">DHL Express Worldwide</option>
                    <option value="DHL Freight Direct">DHL Freight Dedicated Truckload</option>
                    <option value="USPS Priority Express">USPS Priority Express</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Carrier Tracking / AWB #</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-slate-700 font-semibold">
                  <span>Dock Gate:</span>
                  <span className="font-bold text-slate-900">Bay 04 (South Outbound)</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 font-semibold">
                  <span>Carrier Pickup Cutoff:</span>
                  <span className="font-bold text-slate-900">17:30 PST (In 2.5 hours)</span>
                </div>
              </div>

              <button
                id="btn-manifest-dispatch-order"
                type="submit"
                disabled={isDispatching}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isDispatching ? 'Manifesting Bill of Lading...' : 'Generate Manifest & Complete Dispatch'}</span>
              </button>
            </form>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-xs text-slate-500">
              No orders currently waiting at dock. Complete packing & QC checks to stage next outbound wave.
            </div>
          )}
        </div>

        {/* Right: Dispatched Outbound Board */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Outbound Log</span>
              <h2 className="text-lg font-bold text-slate-900">Dispatched Consignments Today</h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{safeDispatches.length} Outbound</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {safeDispatches.map(disp => (
              <div
                key={disp.id}
                className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{disp.orderNumber} · {disp.customer}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                    {disp.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Carrier: <strong>{disp.carrier}</strong></span>
                  <span className="font-mono text-slate-500">{disp.trackingNumber}</span>
                </div>

                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Dock Gate {disp.dockGate}</span>
                  <span>Dispatched: {disp.dispatchedAt ? new Date(disp.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
