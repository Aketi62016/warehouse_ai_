import React, { useState } from 'react';
import { WarehouseException, ExceptionResolutionType } from '../../types/warehouse';
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Split,
  RefreshCw,
  Clock,
  Layers,
  FileText
} from 'lucide-react';

interface Props {
  exceptions: WarehouseException[];
  onResolveException: (exceptionId: string, payload: { actionTaken: string; resolvedBy?: string; createBackorder?: boolean }) => Promise<any>;
}

export const ExceptionsView: React.FC<Props> = ({
  exceptions = [],
  onResolveException
}) => {
  const safeExceptions = exceptions || [];
  const [selectedExceptionId, setSelectedExceptionId] = useState<string>(safeExceptions[0]?.id || '');
  const [selectedAction, setSelectedAction] = useState<ExceptionResolutionType>('PARTIAL_SHIP');
  const [resolverNotes, setResolverNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync selected exception
  React.useEffect(() => {
    if (!selectedExceptionId && safeExceptions.length > 0) {
      setSelectedExceptionId(safeExceptions[0].id);
    }
  }, [safeExceptions, selectedExceptionId]);

  const currentException = safeExceptions.find(e => e.id === selectedExceptionId) || safeExceptions[0];

  const handleResolve = async () => {
    if (!currentException) return;
    setIsResolving(true);
    try {
      await onResolveException(currentException.id, {
        actionTaken: selectedAction,
        resolvedBy: 'Alex Morgan (Ops Manager)',
        createBackorder: selectedAction === 'PARTIAL_SHIP'
      });
      setSuccessToast(`Exception ${currentException.id} successfully resolved via ${selectedAction.replace('_', ' ')}.`);
      setTimeout(() => setSuccessToast(null), 5000);
      setResolverNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsResolving(false);
    }
  };

  const openCount = safeExceptions.filter(e => e.status !== 'RESOLVED').length;

  return (
    <div id="view-exception-control-center" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
              Operational Exception Resolution
            </span>
            <span className="text-xs text-slate-400">Problem → Decision → Resolution Workflow</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Exception Control Center</h1>
          <p className="text-xs text-slate-500">
            Automated exception triage for short-picks, damaged bin inventory, and packing discrepancies with guided resolution paths.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
            {openCount} Open Exceptions
          </span>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Grid: Exception List & Resolution Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Exception Cases List */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Incident Queue</span>
            <span className="text-xs text-slate-400 font-semibold">{safeExceptions.length} Total</span>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {safeExceptions.map(exc => {
              const isSelected = (currentException?.id === exc.id);
              const isResolved = exc.status === 'RESOLVED';

              return (
                <div
                  key={exc.id}
                  id={`card-exception-${exc.id}`}
                  onClick={() => setSelectedExceptionId(exc.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : isResolved
                      ? 'bg-slate-50/60 border-slate-200 text-slate-500'
                      : 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/80 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{exc.id}</span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {exc.type.replace('_', ' ')}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isResolved
                        ? 'bg-emerald-100 text-emerald-800'
                        : isSelected
                        ? 'bg-rose-400 text-slate-950 font-extrabold'
                        : 'bg-rose-200 text-rose-900'
                    }`}>
                      {exc.status}
                    </span>
                  </div>

                  <p className={`text-xs ${isSelected ? 'text-slate-200' : 'text-slate-700'}`}>
                    {exc.details}
                  </p>

                  <div className={`pt-1 border-t flex items-center justify-between text-[10px] ${
                    isSelected ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-400'
                  }`}>
                    <span>Order: <strong>{exc.orderNumber}</strong></span>
                    <span>Stage: {exc.stage}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Resolution Workbench */}
        {currentException && (
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-rose-600">Incident Triage Workbench</span>
                    <span className="text-xs font-mono font-bold text-slate-800">#{currentException.id}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {currentException.type.replace('_', ' ')} on {currentException.orderNumber}
                  </h2>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  currentException.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {currentException.status}
                </span>
              </div>

              {/* Problem Analysis */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  1. Incident Details & Root Cause
                </span>
                <p className="text-xs font-medium text-slate-800">
                  {currentException.details}
                </p>
                <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-4">
                  <span>Reported by: <strong>{currentException.reportedBy}</strong></span>
                  <span>Reported at: <strong>{currentException.reportedAt ? new Date(currentException.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</strong></span>
                </div>
              </div>

              {/* Recommended Action Options */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  2. Select Resolution Action
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {(currentException.recommendedResolutions || ['PARTIAL_SHIP', 'SUBSTITUTE_SKU', 'REROUTE_BIN']).map(resType => {
                    const isPicked = selectedAction === resType;
                    const descriptions: Record<string, string> = {
                      PARTIAL_SHIP: 'Ship in-stock items immediately. Generate automatic backorder for shortage.',
                      SUBSTITUTE_SKU: 'Swap item with pre-approved alternative SKU-ELEC-101B in Bin B-04.',
                      REROUTE_BIN: 'Pick item from secondary reserve overflow rack in Zone 02.',
                      EXPEDITE_REORDER: 'Trigger emergency supplier PO and hold order at staging bay.',
                      HOLD_ORDER: 'Halt processing and notify account manager for customer approval.'
                    };

                    return (
                      <div
                        key={resType}
                        onClick={() => setSelectedAction(resType)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                          isPicked
                            ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-100'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{resType.replace('_', ' ')}</span>
                          {isPicked && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {descriptions[resType] || 'Standard resolution protocol.'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resolution Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Manager Resolution Log Notes
                </label>
                <textarea
                  rows={2}
                  value={resolverNotes}
                  onChange={e => setResolverNotes(e.target.value)}
                  placeholder="e.g. Approved partial shipment to avoid SLA breach. Backorder PO-1092 placed."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium outline-hidden"
                />
              </div>
            </div>

            {/* Resolve Button */}
            {currentException.status !== 'RESOLVED' && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  id="btn-resolve-exception-action"
                  onClick={handleResolve}
                  disabled={isResolving}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isResolving ? 'Executing Resolution...' : `Apply Resolution (${selectedAction.replace('_', ' ')})`}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
