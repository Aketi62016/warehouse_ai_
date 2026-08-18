import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import {
  Order,
  Product,
  WarehouseHealth,
  AllocationConflict,
  PickingTask,
  PackingStation,
  QualityCheck,
  DispatchRecord,
  WarehouseException,
  Alert,
  ReorderRecommendation,
  PickerLeaderboardEntry,
  BottleneckInfo,
  DashboardKPIs,
  AuditLog,
  User,
  UserRole
} from './types/warehouse';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { CommandCenterView } from './components/dashboard/CommandCenterView';
import { OrdersView, CreateOrderModal } from './components/orders/OrdersView';
import { InventoryView } from './components/inventory/InventoryView';
import { AllocationCenterView } from './components/allocation/AllocationCenterView';
import { PickingView } from './components/picking/PickingView';
import { PackingView } from './components/packing/PackingView';
import { QualityCheckView } from './components/qc/QualityCheckView';
import { DispatchView } from './components/dispatch/DispatchView';
import { ExceptionsView } from './components/exceptions/ExceptionsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AICopilotView } from './components/ai/AICopilotView';
import { WhatIfSimulatorView } from './components/simulator/WhatIfSimulatorView';
import { AlertsView } from './components/alerts/AlertsView';
import { SettingsView } from './components/settings/SettingsView';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { Zap, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<NavView>('dashboard');

  // Active User Profile / Role
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'USR-01',
    name: 'Alex Morgan',
    role: 'WAREHOUSE_MANAGER',
    email: 'alex.morgan@warehouse.ai',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
  });

  // Global State
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [health, setHealth] = useState<WarehouseHealth | null>(null);
  const [bottlenecks, setBottlenecks] = useState<BottleneckInfo[]>([]);
  const [conflicts, setConflicts] = useState<AllocationConflict[]>([]);
  const [delayedOrders, setDelayedOrders] = useState<Order[]>([]);
  const [recentAudit, setRecentAudit] = useState<AuditLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockoutPredictions, setStockoutPredictions] = useState<ReorderRecommendation[]>([]);
  const [pickingTasks, setPickingTasks] = useState<PickingTask[]>([]);
  const [pickerLeaderboard, setPickerLeaderboard] = useState<PickerLeaderboardEntry[]>([]);
  const [packingStations, setPackingStations] = useState<PackingStation[]>([]);
  const [qcLogs, setQcLogs] = useState<QualityCheck[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [exceptions, setExceptions] = useState<WarehouseException[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // UI Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  // Load all telemetry
  const loadData = useCallback(async () => {
    try {
      const [
        dashRes,
        ordersRes,
        invRes,
        pickingRes,
        packingRes,
        qcRes,
        dispRes,
        excRes,
        alertsRes,
        analyticsRes
      ] = await Promise.all([
        api.getDashboard(),
        api.getOrders(),
        api.getInventory(),
        api.getPicking(),
        api.getPacking(),
        api.getQualityChecks(),
        api.getDispatch(),
        api.getExceptions(),
        api.getAlerts(),
        api.getAnalytics()
      ]);

      setKpis(dashRes.kpis);
      setHealth(dashRes.health);
      setBottlenecks(dashRes.bottlenecks || []);
      setConflicts(dashRes.conflicts || []);
      setDelayedOrders(dashRes.delayedOrders || []);
      setRecentAudit(dashRes.recentAudit || []);
      setOrders(ordersRes.orders || []);
      setProducts(invRes.products || []);
      setStockoutPredictions(invRes.stockoutPredictions || []);
      setPickingTasks(pickingRes.tasks || []);
      setPickerLeaderboard(pickingRes.leaderboard || []);
      setPackingStations(packingRes.stations || []);
      setQcLogs(qcRes || []);
      setDispatches(dispRes.dispatches || []);
      setExceptions(excRes || []);
      setAlerts(alertsRes || []);
      setAnalyticsData(analyticsRes || null);
    } catch (err) {
      console.error('Error fetching warehouse state:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Trigger Hackathon Demo simulation scenario
  const handleTriggerSimulation = async () => {
    try {
      const res = await api.triggerDemoEvent();
      setSimulationToast(`Simulation triggered: ${res.message}`);
      await loadData();
      setTimeout(() => setSimulationToast(null), 8000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentUser(prev => ({
      ...prev,
      role
    }));
  };

  if (isLoading && !kpis) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Initializing Warehouse Decision Engine...
        </div>
      </div>
    );
  }

  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        badgeCounts={{
          urgentOrders: kpis?.criticalOrdersCount,
          conflicts: conflicts.length,
          exceptions: exceptions.filter(e => e.status !== 'RESOLVED').length,
          alerts: unreadAlertsCount,
          lowStock: kpis?.lowStockCount
        }}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <Topbar
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
          onOpenSearch={() => setIsSearchOpen(true)}
          onTriggerSimulation={handleTriggerSimulation}
          onCreateOrderClick={() => setIsCreateOrderOpen(true)}
          unreadAlertsCount={unreadAlertsCount}
          onOpenAlerts={() => setCurrentView('alerts')}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Global Simulation Alert Notification */}
        {simulationToast && (
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white px-6 py-2.5 flex items-center justify-between text-xs font-semibold shadow-md animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 fill-current" />
              <span>{simulationToast}</span>
            </div>
            <button
              onClick={() => setCurrentView('allocation')}
              className="px-3 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
            >
              Open Allocation Center
            </button>
          </div>
        )}

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {currentView === 'dashboard' && kpis && health && (
            <CommandCenterView
              kpis={kpis}
              health={health}
              bottlenecks={bottlenecks}
              conflicts={conflicts}
              delayedOrders={delayedOrders}
              recentAudit={recentAudit}
              activeAlerts={alerts}
              onNavigate={setCurrentView}
              onSelectOrder={order => {
                setSelectedOrder(order);
                setCurrentView('orders');
              }}
              onQuickRebalance={async () => {
                await api.rebalancePacking();
                await loadData();
              }}
              onTriggerHackathonDemo={handleTriggerSimulation}
            />
          )}

          {currentView === 'orders' && (
            <OrdersView
              orders={orders}
              products={products}
              selectedOrder={selectedOrder}
              onSelectOrder={setSelectedOrder}
              onCreateOrderClick={() => setIsCreateOrderOpen(true)}
              onOrderUpdated={loadData}
            />
          )}

          {currentView === 'inventory' && (
            <InventoryView
              products={products}
              stockoutPredictions={stockoutPredictions}
              onTriggerReorder={async (sku, qty, supplier) => {
                const res = await api.triggerReorder({ sku, quantity: qty, supplier });
                await loadData();
                return res;
              }}
            />
          )}

          {currentView === 'allocation' && (
            <AllocationCenterView
              conflicts={conflicts}
              onExecuteAllocation={async (conflictId, allocations) => {
                const res = await api.executeAllocation({ conflictId, allocations, actorName: currentUser.name });
                await loadData();
                return res;
              }}
            />
          )}

          {currentView === 'picking' && (
            <PickingView
              tasks={pickingTasks}
              leaderboard={pickerLeaderboard}
              onCompleteTask={async taskId => {
                const res = await api.completePickingTask(taskId);
                await loadData();
                return res;
              }}
            />
          )}

          {currentView === 'packing' && (
            <PackingView
              stations={packingStations}
              onCompletePacking={async (stationId, orderId) => {
                const res = await api.completePacking(stationId, orderId);
                await loadData();
                return res;
              }}
              onRebalance={async () => {
                const res = await api.rebalancePacking();
                await loadData();
                return res;
              }}
            />
          )}

          {currentView === 'qc' && (
            <QualityCheckView
              qcLogs={qcLogs}
              orders={orders}
              onSubmitQC={async payload => {
                const res = await api.submitQualityCheck(payload);
                await loadData();
                return res;
              }}
            />
          )}

          {currentView === 'dispatch' && (
            <DispatchView
              dispatches={dispatches}
              readyOrders={orders.filter(o => o.status === 'DISPATCH_READY' || o.status === 'QC_CHECK')}
              onDispatchOrder={async (orderId, carrier, trackingNumber) => {
                const res = await api.dispatchOrder({ orderId, carrier, trackingNumber });
                await loadData();
                return res;
              }}
            />
          )}

          {currentView === 'exceptions' && (
            <ExceptionsView
              exceptions={exceptions}
              onResolveException={async (excId, payload) => {
                const res = await api.resolveException(excId, payload);
                await loadData();
                return res;
              }}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView analyticsData={analyticsData} />
          )}

          {currentView === 'ai-insights' && (
            <AICopilotView
              onAskAI={async q => {
                return await api.askAI(q);
              }}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'simulator' && (
            <WhatIfSimulatorView
              onRunSimulation={async input => {
                return await api.runSimulation(input);
              }}
            />
          )}

          {currentView === 'alerts' && (
            <AlertsView
              alerts={alerts}
              onMarkRead={async id => {
                await api.markAlertRead(id);
                await loadData();
              }}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onRoleChange={handleRoleChange}
            />
          )}
        </main>
      </div>

      {/* Global Search Modal (⌘K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        orders={orders}
        products={products}
        exceptions={exceptions}
        onSelectOrder={order => {
          setSelectedOrder(order);
          setCurrentView('orders');
        }}
        onSelectProduct={prod => {
          setCurrentView('inventory');
        }}
      />

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        products={products}
        onOrderCreated={newOrder => {
          loadData();
          setSelectedOrder(newOrder);
          setCurrentView('orders');
        }}
      />
    </div>
  );
}
