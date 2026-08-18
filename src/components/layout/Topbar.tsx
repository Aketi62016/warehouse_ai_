import React, { useState } from 'react';
import { User, UserRole } from '../../types/warehouse';
import {
  Search,
  Bell,
  Sparkles,
  Play,
  Building2,
  CheckCircle2,
  ChevronDown,
  Plus,
  Zap,
  RefreshCw
} from 'lucide-react';

interface Props {
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  onOpenSearch: () => void;
  onTriggerSimulation: () => void;
  onCreateOrderClick: () => void;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Topbar: React.FC<Props> = ({
  currentUser,
  onRoleChange,
  onOpenSearch,
  onTriggerSimulation,
  onCreateOrderClick,
  unreadAlertsCount,
  onOpenAlerts,
  onRefresh,
  isRefreshing = false
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('San Francisco Central DC (Bay Area - Zone 01)');

  const roles: Array<{ role: UserRole; title: string; desc: string }> = [
    { role: 'WAREHOUSE_MANAGER', title: 'Warehouse Manager', desc: 'Full operational control & approvals' },
    { role: 'INVENTORY_MANAGER', title: 'Inventory Manager', desc: 'Stock allocation & PO reorders' },
    { role: 'PICKER', title: 'Picker Associate', desc: 'Picking routes & bin scanning' },
    { role: 'PACKING_STAFF', title: 'Packing Staff', desc: 'Station queue packing & parceling' },
    { role: 'DISPATCHER', title: 'Dispatch Lead', desc: 'Carrier manifests & outbound dock' },
    { role: 'ADMIN', title: 'System Admin', desc: 'Global rules & decision parameters' }
  ];

  return (
    <header id="topbar-navigation" className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 z-10">
      {/* Left: Global Search & Warehouse Picker */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          id="btn-global-search-trigger"
          onClick={onOpenSearch}
          className="flex items-center justify-between w-full max-w-md px-3.5 py-2 bg-slate-100/80 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-medium border border-slate-200/60 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search Order ID, SKU, Customer, Location...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-600 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate max-w-[200px]">{selectedWarehouse}</span>
        </div>
      </div>

      {/* Right: Actions, Simulation Trigger, Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Hackathon Demo Simulation Button */}
        <button
          id="btn-run-simulation-demo"
          onClick={onTriggerSimulation}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          title="Simulate sudden urgent VIP order with inventory conflict to test Decision Engine in real-time"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Run Live Simulation</span>
        </button>

        {/* Quick Action: New Order */}
        <button
          id="btn-create-order-quick"
          onClick={onCreateOrderClick}
          className="flex items-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Order</span>
        </button>

        {/* Refresh button */}
        <button
          id="btn-refresh-state"
          onClick={onRefresh}
          className={`p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all ${isRefreshing ? 'animate-spin' : ''}`}
          title="Refresh warehouse telemetry"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Alerts Bell */}
        <button
          id="btn-alerts-toggle"
          onClick={onOpenAlerts}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white" />
          )}
        </button>

        {/* Role Switcher Menu */}
        <div className="relative">
          <button
            id="btn-user-role-menu"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-lg object-cover border border-slate-200"
            />
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-slate-900 leading-none">{currentUser.name}</div>
              <div className="text-[10px] font-medium text-slate-500 mt-0.5">{currentUser.role.replace('_', ' ')}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowRoleMenu(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 space-y-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">Switch Operational Role</div>
                  <div className="text-[11px] text-slate-500">Test role-based access & specialized views</div>
                </div>
                {roles.map(r => (
                  <button
                    key={r.role}
                    id={`role-option-${r.role.toLowerCase()}`}
                    onClick={() => {
                      onRoleChange(r.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-start justify-between ${
                      currentUser.role === r.role ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{r.title}</div>
                      <div className={`text-[10px] ${currentUser.role === r.role ? 'text-slate-300' : 'text-slate-500'}`}>
                        {r.desc}
                      </div>
                    </div>
                    {currentUser.role === r.role && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
