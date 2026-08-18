import React from 'react';
import { Alert } from '../../types/warehouse';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface Props {
  alerts: Alert[];
  onMarkRead: (id: string) => Promise<any>;
  onNavigate: (view: any) => void;
}

export const AlertsView: React.FC<Props> = ({ alerts = [], onMarkRead, onNavigate }) => {
  const safeAlerts = alerts || [];
  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return { bg: 'bg-rose-50 border-rose-200 text-rose-950', badge: 'bg-rose-600 text-white', icon: AlertOctagon };
      case 'WARNING':
        return { bg: 'bg-amber-50 border-amber-200 text-amber-950', badge: 'bg-amber-600 text-white', icon: AlertTriangle };
      default:
        return { bg: 'bg-blue-50 border-blue-200 text-blue-950', badge: 'bg-blue-600 text-white', icon: Info };
    }
  };

  return (
    <div id="view-smart-alerts" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
              Real-Time Notifications
            </span>
            <span className="text-xs text-slate-400">Actionable Event Bus</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Smart Warehouse Alerts</h1>
          <p className="text-xs text-slate-500">
            Automated notifications for SLA breaches, stockout thresholds, conveyor bottlenecks, and QC defect flags.
          </p>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {safeAlerts.map(alert => {
          const style = getSeverityStyle(alert.severity);
          const Icon = style.icon;

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${style.bg} ${
                alert.isRead ? 'opacity-70' : 'ring-1 ring-current/10'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-white/80 shrink-0 shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">{alert.title}</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${style.badge}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 bg-white/60 rounded">
                      {alert.type}
                    </span>
                  </div>
                  <p className="text-xs mt-1 opacity-90">{alert.message}</p>
                  <span className="text-[10px] opacity-75 mt-1 block">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {alert.actionUrl && (
                  <button
                    onClick={() => {
                      onMarkRead(alert.id);
                      if (alert.actionUrl?.includes('allocation')) onNavigate('allocation');
                      else if (alert.actionUrl?.includes('packing')) onNavigate('packing');
                      else if (alert.actionUrl?.includes('exceptions')) onNavigate('exceptions');
                      else if (alert.actionUrl?.includes('inventory')) onNavigate('inventory');
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Take Action</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {!alert.isRead && (
                  <button
                    onClick={() => onMarkRead(alert.id)}
                    className="px-2.5 py-1.5 bg-white/80 hover:bg-white text-slate-700 rounded-xl text-xs font-semibold border border-current/10 transition-all cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
