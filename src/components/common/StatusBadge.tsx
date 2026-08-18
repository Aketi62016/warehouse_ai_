import React from 'react';
import { OrderPriority, OrderStatus, InventoryStatus, RiskLevel } from '../../types/warehouse';

export const PriorityBadge: React.FC<{ priority: OrderPriority; score?: number; className?: string }> = ({ priority, score, className = '' }) => {
  const configs = {
    CRITICAL: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-600',
      label: 'Critical'
    },
    HIGH: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'High'
    },
    MEDIUM: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      label: 'Medium'
    },
    LOW: {
      bg: 'bg-slate-50 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      label: 'Low'
    }
  };

  const config = configs[priority] || configs.LOW;

  return (
    <span id={`badge-priority-${priority.toLowerCase()}`} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} whitespace-nowrap ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
      {score !== undefined && <span className="opacity-75 font-normal">({score})</span>}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: OrderStatus | string; className?: string }> = ({ status, className = '' }) => {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700', label: 'Pending' },
    ALLOCATED: { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', label: 'Allocated' },
    PICKING: { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', label: 'Picking' },
    PACKING: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'text-indigo-700', label: 'Packing' },
    QC_CHECK: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', label: 'QC Check' },
    DISPATCH_READY: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'Ready for Dispatch' },
    DISPATCHED: { bg: 'bg-teal-50 text-teal-700 border-teal-200', text: 'text-teal-700', label: 'Dispatched' },
    DELIVERED: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', text: 'text-emerald-800', label: 'Delivered' },
    CANCELLED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', label: 'Cancelled' },
    ON_HOLD: { bg: 'bg-amber-100 text-amber-800 border-amber-300', text: 'text-amber-800', label: 'On Hold (Exception)' }
  };

  const config = configs[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700', label: status };

  return (
    <span id={`badge-status-${status.toLowerCase()}`} className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${config.bg} whitespace-nowrap ${className}`}>
      {config.label}
    </span>
  );
};

export const InventoryStatusBadge: React.FC<{ status: InventoryStatus; className?: string }> = ({ status, className = '' }) => {
  const configs: Record<InventoryStatus, { bg: string; dot: string; label: string }> = {
    HEALTHY: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Healthy Stock' },
    LOW_STOCK: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Low Stock' },
    CRITICAL: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-600', label: 'Critical Shortage' },
    OUT_OF_STOCK: { bg: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-700', label: 'Out of Stock' },
    OVERSTOCK: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Overstocked' },
    DAMAGED: { bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-600', label: 'Damaged Units' }
  };

  const config = configs[status] || configs.HEALTHY;

  return (
    <span id={`badge-inv-${status.toLowerCase()}`} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} whitespace-nowrap ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const RiskBadge: React.FC<{ risk: RiskLevel; className?: string }> = ({ risk, className = '' }) => {
  const configs = {
    CRITICAL: 'bg-rose-100 text-rose-800 border-rose-300',
    HIGH: 'bg-rose-50 text-rose-700 border-rose-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  return (
    <span id={`badge-risk-${risk.toLowerCase()}`} className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${configs[risk]} whitespace-nowrap ${className}`}>
      {risk} RISK
    </span>
  );
};
