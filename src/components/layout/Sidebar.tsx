import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  GitMerge,
  Footprints,
  PackageCheck,
  ShieldAlert,
  Truck,
  AlertTriangle,
  BarChart3,
  Bot,
  FlaskConical,
  Bell,
  Settings,
  Warehouse,
  ChevronRight
} from 'lucide-react';

export type NavView = 
  | 'dashboard'
  | 'orders'
  | 'inventory'
  | 'allocation'
  | 'picking'
  | 'packing'
  | 'qc'
  | 'dispatch'
  | 'exceptions'
  | 'analytics'
  | 'ai-insights'
  | 'simulator'
  | 'alerts'
  | 'settings';

export interface SidebarBadgeCounts {
  urgentOrders?: number;
  conflicts?: number;
  exceptions?: number;
  alerts?: number;
  lowStock?: number;
}

interface Props {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  badgeCounts?: SidebarBadgeCounts;
}

export const Sidebar: React.FC<Props> = ({ currentView, onNavigate, badgeCounts = {} }: Props) => {
  const navItems = [
    {
      group: 'COMMAND & CONTROL',
      items: [
        { id: 'dashboard' as NavView, label: 'Command Center', icon: LayoutDashboard },
        { id: 'orders' as NavView, label: 'Orders Management', icon: ShoppingCart, badge: badgeCounts.urgentOrders ? `${badgeCounts.urgentOrders} urgent` : undefined, badgeColor: 'bg-rose-100 text-rose-700' },
        { id: 'inventory' as NavView, label: 'Inventory & Stockouts', icon: Boxes, badge: badgeCounts.lowStock ? `${badgeCounts.lowStock}` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
        { id: 'allocation' as NavView, label: 'Allocation Center', icon: GitMerge, badge: badgeCounts.conflicts ? `${badgeCounts.conflicts} conflict` : undefined, badgeColor: 'bg-purple-100 text-purple-700' }
      ]
    },
    {
      group: 'WAREHOUSE FULFILLMENT WORKFLOW',
      items: [
        { id: 'picking' as NavView, label: 'Picking & Route Map', icon: Footprints },
        { id: 'packing' as NavView, label: 'Packing Stations', icon: PackageCheck },
        { id: 'qc' as NavView, label: 'Quality Check Station', icon: ShieldAlert },
        { id: 'dispatch' as NavView, label: 'Dispatch Tracking', icon: Truck },
        { id: 'exceptions' as NavView, label: 'Exception Control Center', icon: AlertTriangle, badge: badgeCounts.exceptions ? `${badgeCounts.exceptions}` : undefined, badgeColor: 'bg-rose-100 text-rose-700' }
      ]
    },
    {
      group: 'INTELLIGENCE & SIMULATION',
      items: [
        { id: 'analytics' as NavView, label: 'Operational Analytics', icon: BarChart3 },
        { id: 'ai-insights' as NavView, label: 'AI Warehouse Copilot', icon: Bot, isAi: true },
        { id: 'simulator' as NavView, label: 'What-If Simulator', icon: FlaskConical, badge: 'Interactive', badgeColor: 'bg-indigo-100 text-indigo-700' },
        { id: 'alerts' as NavView, label: 'Smart Alerts', icon: Bell, badge: badgeCounts.alerts ? `${badgeCounts.alerts}` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
        { id: 'settings' as NavView, label: 'Settings & Roles', icon: Settings }
      ]
    }
  ];

  return (
    <aside id="sidebar-navigation" className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
          <Warehouse className="w-5 h-5" />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-sm font-bold text-slate-900 leading-tight truncate">Smart Warehouse</h1>
          <p className="text-[11px] font-medium text-slate-500 truncate">Fulfillment Intelligence</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navItems.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              {group.group}
            </h2>
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-900'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                    {item.isAi && (
                      <span className={`px-1.5 py-0.2 text-[9px] rounded font-bold uppercase tracking-wider ${isActive ? 'bg-purple-400 text-slate-900' : 'bg-purple-100 text-purple-800'}`}>
                        Gemini
                      </span>
                    )}
                    <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-white/50' : 'text-slate-400'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Decision Engine Active</span>
          </div>
          <span className="font-mono text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
};
