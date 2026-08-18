import React, { useState } from 'react';
import { QualityCheck, Order } from '../../types/warehouse';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Sparkles,
  Search,
  Scale
} from 'lucide-react';

interface Props {
  qcLogs: QualityCheck[];
  orders: Order[];
  onSubmitQC: (payload: any) => Promise<any>;
}

export const QualityCheckView: React.FC<Props> = ({
  qcLogs = [],
  orders = [],
  onSubmitQC
}) => {
  const safeOrders = orders || [];
  const safeQcLogs = qcLogs || [];

  const qcEligibleOrders = safeOrders.filter(o => o.status === 'QC_CHECK' || o.status === 'PACKING' || o.status === 'PENDING').slice(0, 10);
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>(qcEligibleOrders[0] || safeOrders[0]);

  // Sync selectedOrder
  React.useEffect(() => {
    if (!selectedOrder && safeOrders.length > 0) {
      setSelectedOrder(qcEligibleOrders[0] || safeOrders[0]);
    }
  }, [safeOrders, selectedOrder]);
  const [inspectorName, setInspectorName] = useState('Elena Rostova');
  const [status, setStatus] = useState<'PASSED' | 'FAILED' | 'PARTIAL'>('PASSED');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState({
    barcodeMatched: true,
    quantityVerified: true,
    packagingIntegrity: true,
    weightCalibrated: true,
    hazardLabelsAffixed: true,
    invoiceIncluded: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleQCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      const defects = [];
      if (!checklist.barcodeMatched) defects.push('Barcode mismatch or unreadable tag');
      if (!checklist.quantityVerified) defects.push('Discrepancy in physical count');
      if (!checklist.packagingIntegrity) defects.push('Tear or crush damage on outer carton');
      if (!checklist.weightCalibrated) defects.push('Package weight exceeds tolerance threshold');

      await onSubmitQC({
        orderId: selectedOrder.id,
        orderNumber: selectedOrder.orderNumber,
        inspectorName,
        status,
        defectsFound: defects,
        notes: notes || (status === 'PASSED' ? 'All criteria passed standard QC audit.' : 'Defects flagged for exception triage.')
      });

      setSuccessToast(`Quality Check recorded for ${selectedOrder.orderNumber} (${status}).`);
      setTimeout(() => setSuccessToast(null), 5000);
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="view-quality-check" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
              Quality Assurance & Compliance
            </span>
            <span className="text-xs text-slate-400">Zero-Defect Dispatch Verification</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Quality Check Station</h1>
          <p className="text-xs text-slate-500">
            Mandatory inspection before staging at carrier dispatch dock. Failed audits automatically trigger Exception triage.
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

      {/* Main Grid: Inspection Form & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Inspection Terminal */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Inspection Terminal</span>
              <h2 className="text-lg font-bold text-slate-900">Active Parcel Audit</h2>
            </div>
            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 font-bold">
              Station QA-01
            </span>
          </div>

          <form onSubmit={handleQCSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Order for Inspection</label>
                <select
                  value={selectedOrder?.id}
                  onChange={e => {
                    const found = safeOrders.find(o => o.id === e.target.value);
                    if (found) setSelectedOrder(found);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                >
                  {safeOrders.slice(0, 15).map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customer} ({o.items?.length || 0} items)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lead QC Inspector</label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={e => setInspectorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Verification Criteria (6-Point Checklist)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.barcodeMatched}
                    onChange={() => toggleCheck('barcodeMatched')}
                    className="w-4 h-4 rounded text-slate-900"
                  />
                  <span className="font-semibold text-slate-800">1. Barcode / SKU Scan Matched</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.quantityVerified}
                    onChange={() => toggleCheck('quantityVerified')}
                    className="w-4 h-4 rounded text-slate-900"
                  />
                  <span className="font-semibold text-slate-800">2. Physical Unit Count Exact</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.packagingIntegrity}
                    onChange={() => toggleCheck('packagingIntegrity')}
                    className="w-4 h-4 rounded text-slate-900"
                  />
                  <span className="font-semibold text-slate-800">3. Outer Box & Bubble Seal Intact</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.weightCalibrated}
                    onChange={() => toggleCheck('weightCalibrated')}
                    className="w-4 h-4 rounded text-slate-900"
                  />
                  <span className="font-semibold text-slate-800">4. Scale Calibration & Weight Verified</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.hazardLabelsAffixed}
                    onChange={() => toggleCheck('hazardLabelsAffixed')}
                    className="w-4 h-4 rounded text-slate-900"
                  />
                  <span className="font-semibold text-slate-800">5. Fragile & Orientation Labels</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.invoiceIncluded}
                    onChange={() => toggleCheck('invoiceIncluded')}
                    className="w-4 h-4 rounded text-slate-900"
                  />
                  <span className="font-semibold text-slate-800">6. Packing Slip & Invoice Enclosed</span>
                </label>
              </div>
            </div>

            {/* Audit Outcome Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Inspection Outcome</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('PASSED')}
                  className={`py-2.5 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                    status === 'PASSED'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pass (Ready Dock)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('FAILED')}
                  className={`py-2.5 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                    status === 'FAILED'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Fail (Exception)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('PARTIAL')}
                  className={`py-2.5 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                    status === 'PARTIAL'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Partial Pass</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Audit Notes & Observations</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes on parcel condition or seal tape..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium outline-hidden"
              />
            </div>

            <button
              id="btn-submit-qc-result"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Recording Audit...' : 'Submit Quality Audit & Route Order'}
            </button>
          </form>
        </div>

        {/* Right: QC Audit Logs */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Compliance Log</span>
              <h2 className="text-lg font-bold text-slate-900">Recent Inspection Records</h2>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{safeQcLogs.length} Records</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {safeQcLogs.map(qc => (
              <div
                key={qc.id}
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  qc.status === 'PASSED'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{qc.orderNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      qc.status === 'PASSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {qc.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600">{qc.notes}</p>

                {(qc.defectsFound || []).length > 0 && (
                  <div className="text-[10px] text-rose-700 font-medium">
                    Flagged Defects: {(qc.defectsFound || []).join(', ')}
                  </div>
                )}

                <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Inspector: {qc.inspectorName}</span>
                  <span>{qc.timestamp ? new Date(qc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
