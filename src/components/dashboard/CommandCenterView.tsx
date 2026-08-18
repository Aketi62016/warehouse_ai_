import React from 'react';
import {
  DashboardKPIs,
  WarehouseHealth,
  BottleneckInfo,
  AllocationConflict,
  Order,
  AuditLog,
  Alert
} from '../../types/warehouse';
import { HealthScoreGauge } from '../common/HealthScoreGauge';
import { PriorityBadge, StatusBadge, RiskBadge } from '../common/StatusBadge';
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Clock,
  Flame,
  GitMerge,
  PackageCheck,
  ShieldAlert,
  Sparkles,
  Timer,
  TrendingDown,
  TrendingUp,
  Truck,
  Zap,
  Footprints
} from 'lucide-react';

interface Props {
  kpis: DashboardKPIs;
  health: WarehouseHealth;
  bottlenecks: BottleneckInfo[];
  conflicts: AllocationConflict[];
  delayedOrders: Order[];
  recentAudit: AuditLog[];
  activeAlerts: Alert[];
  onNavigate: (view: any) => void;
  onSelectOrder: (order: Order) => void;
  onQuickRebalance: () => void;
  onTriggerHackathonDemo: () => void;
}

export const CommandCenterView: React.FC<Props> = ({
  kpis,
  health,
  bottlenecks = [],
  conflicts = [],
  delayedOrders = [],
  recentAudit = [],
  activeAlerts = [],
  onNavigate,
  onSelectOrder,
  onQuickRebalance,
  onTriggerHackathonDemo
}) => {
  const safeBottlenecks = bottlenecks || [];
  const safeConflicts = conflicts || [];
  const safeDelayedOrders = delayedOrders || [];
  const safeRecentAudit = recentAudit || [];

  const safeKpis: DashboardKPIs = kpis || {
    fulfillmentRate: 96.4,
    criticalOrdersCount: 4,
    delayedOrdersCount: 2,
    pickingQueueCount: 6,
    packingQueueCount: 5,
    openExceptionsCount: 2,
    lowStockCount: 3,
    avgCycleTimeMinutes: 28,
    onTimeDispatchRate: 97.1,
    totalOrders: 24,
    inventoryAccuracyRate: 99.2
  };
  return (
    <div id="view-command-center" className="space-y-6">
      {/* Top Banner / Operational Briefing */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Live Warehouse Telemetry
            </span>
            <span className="text-xs text-slate-400">Decision Engine: Active</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Warehouse Command & Operations Center</h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Real-time fulfillment intelligence, dynamic order prioritization, stock conflict resolution, and predictive bottleneck mitigation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-banner-ai-briefing"
            onClick={() => onNavigate('ai-insights')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Manager Briefing</span>
          </button>
          <button
            id="btn-banner-trigger-simulation"
            onClick={onTriggerHackathonDemo}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>Simulate VIP Surge</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (10 Clean Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* KPI 1 */}
        <div
          id="kpi-card-fulfillment-rate"
          onClick={() => onNavigate('analytics')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Fulfillment Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{safeKpis.fulfillmentRate}%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Target: 95.0% (+1.4%)</div>
        </div>

        {/* KPI 2 */}
        <div
          id="kpi-card-critical-orders"
          onClick={() => onNavigate('orders')}
          className="bg-white p-4 rounded-2xl border border-rose-200/90 shadow-xs hover:border-rose-300 transition-all cursor-pointer group bg-rose-50/20"
        >
          <div className="flex items-center justify-between text-xs text-rose-700 font-semibold mb-1">
            <span>Critical Priority</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-900">{safeKpis.criticalOrdersCount}</div>
          <div className="text-[11px] text-rose-700 font-medium mt-1">Requires fast-track wave</div>
        </div>

        {/* KPI 3 */}
        <div
          id="kpi-card-delayed-orders"
          onClick={() => onNavigate('orders')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Delayed Orders</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900">{safeKpis.delayedOrdersCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">{Math.round((safeKpis.delayedOrdersCount / (safeKpis.totalOrders || 1)) * 100)}% of active queue</div>
        </div>

        {/* KPI 4 */}
        <div
          id="kpi-card-picking-queue"
          onClick={() => onNavigate('picking')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>In Picking</span>
            <Footprints className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{safeKpis.pickingQueueCount}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">4 active pickers assigned</div>
        </div>

        {/* KPI 5 */}
        <div
          id="kpi-card-packing-bottleneck"
          onClick={() => onNavigate('packing')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>In Packing</span>
            <PackageCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{safeKpis.packingQueueCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Station 03 at 98% load</div>
        </div>

        {/* KPI 6 */}
        <div
          id="kpi-card-open-exceptions"
          onClick={() => onNavigate('exceptions')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Open Exceptions</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{safeKpis.openExceptionsCount}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">1 short-pick, 1 damaged</div>
        </div>

        {/* KPI 7 */}
        <div
          id="kpi-card-low-stock"
          onClick={() => onNavigate('inventory')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Stockout Risks</span>
            <Boxes className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{safeKpis.lowStockCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">1 critical shortage</div>
        </div>

        {/* KPI 8 */}
        <div
          id="kpi-card-avg-cycle-time"
          onClick={() => onNavigate('analytics')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Avg Cycle Time</span>
            <Timer className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{safeKpis.avgCycleTimeMinutes}m</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Order-to-dock latency</div>
        </div>

        {/* KPI 9 */}
        <div
          id="kpi-card-ontime-dispatch"
          onClick={() => onNavigate('dispatch')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>On-Time SLA</span>
            <Truck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{safeKpis.onTimeDispatchRate}%</div>
          <div className="text-[11px] text-teal-600 font-medium mt-1">Carrier cutoff compliant</div>
        </div>

        {/* KPI 10 */}
        <div
          id="kpi-card-allocation-conflicts"
          onClick={() => onNavigate('allocation')}
          className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs hover:border-purple-300 transition-all cursor-pointer group bg-purple-50/20"
        >
          <div className="flex items-center justify-between text-xs text-purple-800 font-semibold mb-1">
            <span>Stock Conflicts</span>
            <GitMerge className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-900">{safeConflicts.length}</div>
          <div className="text-[11px] text-purple-700 font-medium mt-1">Smart split suggested</div>
        </div>
      </div>

      {/* Main Row: Health Score & Bottleneck Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <HealthScoreGauge health={health} />
        </div>

        {/* Bottleneck & Friction Radar */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Constraint Detector</span>
                <h2 className="text-lg font-bold text-slate-900">Active Bottlenecks</h2>
              </div>
              <button
                id="btn-rebalance-conveyor"
                onClick={onQuickRebalance}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                1-Click Rebalance
              </button>
            </div>

            <div className="space-y-3">
              {safeBottlenecks.map((bottle, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs ${
                    bottle.severity === 'CRITICAL'
                      ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                      : 'bg-amber-50/60 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${bottle.severity === 'CRITICAL' ? 'bg-rose-600' : 'bg-amber-500'}`} />
                      {bottle.location} ({bottle.stage})
                    </span>
                    <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-white/80 border border-current">
                      {bottle.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] opacity-90">{bottle.issue}</p>
                  <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between text-[11px]">
                    <span>Delayed: <strong>{bottle.ordersDelayedCount} orders</strong></span>
                    <span className="font-semibold text-indigo-700 underline cursor-pointer" onClick={() => onNavigate('packing')}>
                      {bottle.recommendedAction}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Conveyor velocity: 1.4 m/s</span>
            <span className="text-emerald-600 font-semibold">Stations 01, 02, 05 Normal</span>
          </div>
        </div>
      </div>

      {/* Row: Urgent Orders + Real-time Allocation Conflicts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Urgent Action Orders */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority Engine</span>
              <h2 className="text-lg font-bold text-slate-900">Urgent & Delayed Orders Requiring Action</h2>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({safeKpis.totalOrders})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3 pl-1">Order</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Delivery Cutoff</th>
                  <th className="pb-3 text-right pr-1">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeDelayedOrders.map(order => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectOrder(order)}
                  >
                    <td className="py-3 pl-1 font-bold text-slate-900">
                      {order.orderNumber}
                      {order.isDelayed && (
                        <span className="block text-[10px] font-medium text-rose-600">
                          +{order.delayMinutes}m delay
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-medium text-slate-700">
                      <div>{order.customer}</div>
                      <span className="text-[10px] text-slate-400">{order.customerTier}</span>
                    </td>
                    <td className="py-3">
                      <PriorityBadge priority={order.priority} score={order.priorityScore} />
                    </td>
                    <td className="py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-slate-600 font-medium">
                      {order.items?.length || 0} items (${(order.totalValue || 0).toLocaleString()})
                    </td>
                    <td className="py-3 text-slate-600">
                      <div className="font-medium text-slate-800">
                        {order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ASAP'}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : 'Today'}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrder(order);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-semibold rounded-lg text-[11px] transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Operational Audit Feed */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Audit & Governance</span>
              <h2 className="text-lg font-bold text-slate-900">Live Activity Feed</h2>
            </div>
          </div>

          <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
            {safeRecentAudit.slice(0, 7).map(log => (
              <div key={log.id} className="text-xs border-l-2 border-slate-200 pl-3 py-0.5 space-y-0.5">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="font-semibold text-slate-700">{log.actor} ({log.role?.replace('_', ' ') || 'SYSTEM'})</span>
                  <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}</span>
                </div>
                <div className="font-medium text-slate-800">{log.details}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
