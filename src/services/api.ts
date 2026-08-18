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
  WhatIfSimulationInput,
  WhatIfSimulationResult,
  DashboardKPIs,
  AuditLog
} from '../types/warehouse';

export const api = {
  // Dashboard
  async getDashboard(): Promise<{
    kpis: DashboardKPIs;
    health: WarehouseHealth;
    bottlenecks: BottleneckInfo[];
    conflicts: AllocationConflict[];
    activeAlerts: Alert[];
    recentAudit: AuditLog[];
    delayedOrders: Order[];
  }> {
    const res = await fetch('/api/dashboard');
    return res.json();
  },

  // Orders
  async getOrders(params?: { priority?: string; status?: string; risk?: string; customer?: string; search?: string; delayed?: boolean }): Promise<{ orders: Order[]; totalCount: number }> {
    const query = new URLSearchParams();
    if (params?.priority) query.append('priority', params.priority);
    if (params?.status) query.append('status', params.status);
    if (params?.risk) query.append('risk', params.risk);
    if (params?.customer) query.append('customer', params.customer);
    if (params?.search) query.append('search', params.search);
    if (params?.delayed) query.append('delayed', 'true');

    const res = await fetch(`/api/orders?${query.toString()}`);
    return res.json();
  },

  async getOrder(id: string): Promise<Order> {
    const res = await fetch(`/api/orders/${id}`);
    return res.json();
  },

  async createOrder(payload: { customer: string; customerTier?: string; items: Array<{ sku: string; quantity: number }>; expectedDeliveryHours?: number }): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Inventory
  async getInventory(params?: { category?: string; status?: string; search?: string }): Promise<{ products: Product[]; stockoutPredictions: ReorderRecommendation[]; totalCount: number }> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`/api/inventory?${query.toString()}`);
    return res.json();
  },

  async triggerReorder(payload: { sku: string; quantity: number; supplier?: string }): Promise<{ success: boolean; message: string; product: Product }> {
    const res = await fetch('/api/inventory/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Allocation
  async getAllocationConflicts(): Promise<AllocationConflict[]> {
    const res = await fetch('/api/allocation/conflicts');
    return res.json();
  },

  async executeAllocation(payload: { conflictId: string; allocations: Record<string, number>; actorName?: string }): Promise<any> {
    const res = await fetch('/api/allocation/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Picking
  async getPicking(): Promise<{ tasks: PickingTask[]; leaderboard: PickerLeaderboardEntry[] }> {
    const res = await fetch('/api/picking');
    return res.json();
  },

  async completePickingTask(taskId: string): Promise<any> {
    const res = await fetch(`/api/picking/${taskId}/complete`, { method: 'POST' });
    return res.json();
  },

  // Packing
  async getPacking(): Promise<{ stations: PackingStation[] }> {
    const res = await fetch('/api/packing');
    return res.json();
  },

  async completePacking(stationId: string, orderId: string): Promise<any> {
    const res = await fetch(`/api/packing/${stationId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    return res.json();
  },

  async rebalancePacking(): Promise<any> {
    const res = await fetch('/api/packing/rebalance', { method: 'POST' });
    return res.json();
  },

  // Quality Check
  async getQualityChecks(): Promise<QualityCheck[]> {
    const res = await fetch('/api/quality-check');
    return res.json();
  },

  async submitQualityCheck(payload: Omit<QualityCheck, 'id' | 'timestamp'>): Promise<any> {
    const res = await fetch('/api/quality-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Dispatch
  async getDispatch(): Promise<{ dispatches: DispatchRecord[]; readyOrders: Order[] }> {
    const res = await fetch('/api/dispatch');
    return res.json();
  },

  async dispatchOrder(payload: { orderId: string; carrier: string; trackingNumber: string }): Promise<any> {
    const res = await fetch('/api/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Exceptions
  async getExceptions(): Promise<WarehouseException[]> {
    const res = await fetch('/api/exceptions');
    return res.json();
  },

  async resolveException(exceptionId: string, payload: { actionTaken: string; resolvedBy?: string; createBackorder?: boolean }): Promise<any> {
    const res = await fetch(`/api/exceptions/${exceptionId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Analytics
  async getAnalytics(): Promise<any> {
    const res = await fetch('/api/analytics');
    return res.json();
  },

  // AI Copilot
  async askAI(query: string): Promise<any> {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    return res.json();
  },

  // What-If Simulator
  async runSimulation(payload: WhatIfSimulationInput): Promise<WhatIfSimulationResult> {
    const res = await fetch('/api/simulation/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Demo event simulation
  async triggerDemoEvent(): Promise<any> {
    const res = await fetch('/api/simulation/demo-event', { method: 'POST' });
    return res.json();
  },

  // Alerts
  async getAlerts(): Promise<Alert[]> {
    const res = await fetch('/api/alerts');
    return res.json();
  },

  async markAlertRead(alertId: string): Promise<any> {
    const res = await fetch(`/api/alerts/${alertId}/read`, { method: 'POST' });
    return res.json();
  }
};
