import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { warehouseStore } from './server/store.ts';
import { calculateOrderPriority, optimizePickRoute, runWhatIfSimulation } from './server/decisionEngine.ts';
import { askWarehouseCopilot } from './server/geminiService.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Executive Dashboard
  app.get('/api/dashboard', (req, res) => {
    const kpis = warehouseStore.getKPIs();
    const health = warehouseStore.getWarehouseHealth();
    const bottlenecks = warehouseStore.getBottlenecks();
    const conflicts = warehouseStore.getAllocationConflicts();
    const activeAlerts = warehouseStore.alerts.filter(a => !a.isDismissed).slice(0, 6);
    const recentAudit = warehouseStore.auditLogs.slice(0, 10);
    const delayedOrders = warehouseStore.orders.filter(o => o.isDelayed || o.delayMinutes > 0).slice(0, 5);

    res.json({
      kpis,
      health,
      bottlenecks,
      conflicts,
      activeAlerts,
      recentAudit,
      delayedOrders
    });
  });

  // 3. Orders Management
  app.get('/api/orders', (req, res) => {
    const { priority, status, risk, customer, search, delayed } = req.query;
    let list = [...warehouseStore.orders];

    if (priority && priority !== 'ALL') {
      list = list.filter(o => o.priority === priority);
    }
    if (status && status !== 'ALL') {
      list = list.filter(o => o.status === status);
    }
    if (risk && risk !== 'ALL') {
      list = list.filter(o => o.riskLevel === risk);
    }
    if (delayed === 'true') {
      list = list.filter(o => o.isDelayed || o.delayMinutes > 0);
    }
    if (customer) {
      list = list.filter(o => o.customer.toLowerCase().includes(String(customer).toLowerCase()));
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(o => 
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.items.some(it => it.sku.toLowerCase().includes(q) || it.productName.toLowerCase().includes(q))
      );
    }

    res.json({
      orders: list,
      totalCount: list.length
    });
  });

  app.get('/api/orders/:id', (req, res) => {
    const order = warehouseStore.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  });

  app.post('/api/orders', (req, res) => {
    const { customer, customerTier = 'STANDARD', items = [], expectedDeliveryHours = 24 } = req.body;
    const now = new Date();
    const orderNumber = `ORD-${1000 + warehouseStore.orders.length + 1}`;
    const productsMap = new Map(warehouseStore.products.map(p => [p.sku, p]));
    
    let totalVal = 0;
    let totalQty = 0;
    const orderItems = items.map((it: any, idx: number) => {
      const prod = productsMap.get(it.sku) || warehouseStore.products[0];
      const qty = it.quantity || 1;
      totalQty += qty;
      totalVal += qty * prod.unitPrice;
      return {
        id: `ITM-NEW-${idx}`,
        sku: prod.sku,
        productName: prod.name,
        category: prod.category,
        requestedQty: qty,
        allocatedQty: 0,
        pickedQty: 0,
        packedQty: 0,
        location: prod.location,
        unitPrice: prod.unitPrice,
        weightKg: prod.weightKg,
        availableStock: prod.availableQty
      };
    });

    const expectedDelivery = new Date(now.getTime() + expectedDeliveryHours * 3600000).toISOString();
    const prioResult = calculateOrderPriority({
      items: orderItems,
      expectedDelivery,
      customerTier,
      totalValue: totalVal,
      orderDate: now.toISOString(),
      isDelayed: false,
      delayMinutes: 0
    }, productsMap);

    const newOrder: any = {
      id: orderNumber,
      orderNumber,
      customer: customer || 'Industrial Direct Partner',
      customerTier,
      orderDate: now.toISOString(),
      expectedDelivery,
      items: orderItems,
      totalQty,
      totalValue: Math.round(totalVal),
      priority: prioResult.priority,
      priorityScore: prioResult.priorityScore,
      priorityBreakdown: prioResult.breakdown,
      status: 'PENDING',
      allocationStatus: 'UNALLOCATED',
      pickingStatus: 'NOT_STARTED',
      packingStatus: 'QUEUED',
      qcStatus: 'PENDING',
      dispatchStatus: 'WAITING_CARRIER',
      riskLevel: prioResult.priority === 'CRITICAL' ? 'CRITICAL' : 'LOW',
      isDelayed: false,
      delayMinutes: 0,
      auditTrail: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: now.toISOString(),
          actor: 'Operations Portal',
          role: 'MANAGER',
          action: 'Order Created',
          details: `Manual order created with ${orderItems.length} line items`,
          stage: 'CREATION'
        }
      ]
    };

    warehouseStore.orders.unshift(newOrder);
    warehouseStore.addAuditLog('Manager', 'WAREHOUSE_MANAGER', 'ORDER_CREATED', `Created order ${orderNumber}`, 'ORDERS');

    res.status(201).json(newOrder);
  });

  // 4. Inventory Management
  app.get('/api/inventory', (req, res) => {
    const { category, status, search } = req.query;
    let list = [...warehouseStore.products];

    if (category && category !== 'ALL') {
      list = list.filter(p => p.category === category);
    }
    if (status && status !== 'ALL') {
      list = list.filter(p => p.status === status);
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(p => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q));
    }

    const stockoutPredictions = warehouseStore.getStockoutPredictions();
    res.json({
      products: list,
      stockoutPredictions,
      totalCount: list.length
    });
  });

  app.get('/api/inventory/:sku', (req, res) => {
    const prod = warehouseStore.products.find(p => p.sku === req.params.sku);
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    res.json(prod);
  });

  app.post('/api/inventory/reorder', (req, res) => {
    const { sku, quantity, supplier } = req.body;
    const prod = warehouseStore.products.find(p => p.sku === sku);
    if (!prod) return res.status(404).json({ error: 'Product not found' });

    prod.incomingQty += (quantity || 50);
    prod.expectedArrivalDate = new Date(Date.now() + prod.leadTimeDays * 86400000).toLocaleDateString();

    warehouseStore.addAuditLog('Sarah Chen', 'INVENTORY_MANAGER', 'PURCHASE_ORDER_ISSUED', `Ordered ${quantity || 50} units of ${prod.name} from ${supplier || prod.supplier}`, 'INVENTORY');

    res.json({
      success: true,
      message: `Purchase Order PO-${Date.now() % 10000} successfully created for ${quantity || 50} units of ${prod.name}.`,
      product: prod
    });
  });

  // 5. Allocation Center
  app.get('/api/allocation/conflicts', (req, res) => {
    const conflicts = warehouseStore.getAllocationConflicts();
    res.json(conflicts);
  });

  app.post('/api/allocation/execute', (req, res) => {
    const { conflictId, allocations, actorName } = req.body;
    warehouseStore.executeAllocation(conflictId, allocations || {}, actorName);
    res.json({
      success: true,
      message: 'Intelligent inventory distribution executed successfully.',
      conflicts: warehouseStore.getAllocationConflicts(),
      health: warehouseStore.getWarehouseHealth()
    });
  });

  // 6. Picking Management
  app.get('/api/picking', (req, res) => {
    res.json({
      tasks: warehouseStore.pickingTasks,
      leaderboard: warehouseStore.pickerLeaderboard
    });
  });

  app.post('/api/picking/:id/complete', (req, res) => {
    warehouseStore.completePickingTask(req.params.id);
    res.json({
      success: true,
      tasks: warehouseStore.pickingTasks
    });
  });

  app.post('/api/picking/route-optimize', (req, res) => {
    const { items } = req.body;
    const result = optimizePickRoute(items || []);
    res.json(result);
  });

  // 7. Packing Stations
  app.get('/api/packing', (req, res) => {
    res.json({
      stations: warehouseStore.packingStations
    });
  });

  app.post('/api/packing/:id/complete', (req, res) => {
    const { orderId } = req.body;
    warehouseStore.completePacking(req.params.id, orderId);
    res.json({
      success: true,
      stations: warehouseStore.packingStations
    });
  });

  app.post('/api/packing/rebalance', (req, res) => {
    warehouseStore.rebalancePackingStations();
    res.json({
      success: true,
      message: 'Workload rebalanced across packing conveyor stations.',
      stations: warehouseStore.packingStations
    });
  });

  // 8. Quality Check
  app.get('/api/quality-check', (req, res) => {
    res.json(warehouseStore.qualityChecks);
  });

  app.post('/api/quality-check', (req, res) => {
    const qc = warehouseStore.submitQualityCheck(req.body);
    res.json({
      success: true,
      qc,
      orders: warehouseStore.orders.slice(0, 15)
    });
  });

  // 9. Dispatch Management
  app.get('/api/dispatch', (req, res) => {
    res.json({
      dispatches: warehouseStore.dispatches,
      readyOrders: warehouseStore.orders.filter(o => o.status === 'DISPATCH_READY' || o.status === 'QC_CHECK')
    });
  });

  app.post('/api/dispatch', (req, res) => {
    const { orderId, carrier, trackingNumber } = req.body;
    warehouseStore.dispatchOrder(orderId, carrier || 'FedEx Priority', trackingNumber || `TRK-${Date.now() % 1000000}`);
    res.json({
      success: true,
      dispatches: warehouseStore.dispatches
    });
  });

  // 10. Exception Control Center
  app.get('/api/exceptions', (req, res) => {
    res.json(warehouseStore.exceptions);
  });

  app.post('/api/exceptions/:id/resolve', (req, res) => {
    const { actionTaken, resolvedBy, createBackorder } = req.body;
    warehouseStore.resolveException(req.params.id, actionTaken, resolvedBy, createBackorder);
    res.json({
      success: true,
      exceptions: warehouseStore.exceptions
    });
  });

  // 11. Operational Analytics
  app.get('/api/analytics', (req, res) => {
    const orders = warehouseStore.orders;
    const products = warehouseStore.products;
    const packing = warehouseStore.packingStations;

    // Daily fulfillment trend (mock days)
    const dailyVolume = [
      { day: 'Mon', total: 84, onTime: 81, delayed: 3, fulfillmentRate: 96.4 },
      { day: 'Tue', total: 96, onTime: 91, delayed: 5, fulfillmentRate: 94.7 },
      { day: 'Wed', total: 110, onTime: 104, delayed: 6, fulfillmentRate: 94.5 },
      { day: 'Thu', total: 102, onTime: 98, delayed: 4, fulfillmentRate: 96.0 },
      { day: 'Fri', total: 125, onTime: 118, delayed: 7, fulfillmentRate: 94.4 },
      { day: 'Sat', total: 78, onTime: 76, delayed: 2, fulfillmentRate: 97.4 },
      { day: 'Sun', total: 65, onTime: 63, delayed: 2, fulfillmentRate: 96.9 }
    ];

    // Priority breakdown
    const priorityCounts = {
      CRITICAL: orders.filter(o => o.priority === 'CRITICAL').length,
      HIGH: orders.filter(o => o.priority === 'HIGH').length,
      MEDIUM: orders.filter(o => o.priority === 'MEDIUM').length,
      LOW: orders.filter(o => o.priority === 'LOW').length
    };

    // Category stock distribution
    const categories = ['Electronics', 'Robotics', 'Hardware', 'Medical', 'Tools'];
    const categoryDistribution = categories.map(cat => ({
      category: cat,
      healthy: products.filter(p => p.category === cat && (p.status === 'HEALTHY' || p.status === 'OVERSTOCK')).length,
      lowStock: products.filter(p => p.category === cat && (p.status === 'LOW_STOCK' || p.status === 'CRITICAL')).length,
      outOfStock: products.filter(p => p.category === cat && p.status === 'OUT_OF_STOCK').length
    }));

    // Station utilization
    const stationUtilization = packing.map(s => ({
      station: s.name.replace('Packing Station ', 'St-'),
      utilization: s.utilizationPercent,
      avgTime: s.avgPackingTimeMin,
      isOverloaded: s.isOverloaded
    }));

    res.json({
      dailyVolume,
      priorityCounts,
      categoryDistribution,
      stationUtilization,
      pickerLeaderboard: warehouseStore.pickerLeaderboard,
      health: warehouseStore.getWarehouseHealth()
    });
  });

  // 12. AI Copilot / Insights
  app.post('/api/ai/ask', async (req, res) => {
    try {
      const { query } = req.body;
      const result = await askWarehouseCopilot(query || 'What should the warehouse manager do now?');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'AI Copilot error' });
    }
  });

  // 13. What-If Simulator
  app.post('/api/simulation/run', (req, res) => {
    const health = warehouseStore.getWarehouseHealth();
    const result = runWhatIfSimulation(req.body, warehouseStore.orders, warehouseStore.products, health);
    res.json(result);
  });

  // 14. Demo Event / Simulation Scenario Trigger
  app.post('/api/simulation/demo-event', (req, res) => {
    const result = warehouseStore.triggerHackathonScenario();
    res.json(result);
  });

  // 15. Alerts
  app.get('/api/alerts', (req, res) => {
    res.json(warehouseStore.alerts);
  });

  app.post('/api/alerts/:id/read', (req, res) => {
    const alert = warehouseStore.alerts.find(a => a.id === req.params.id);
    if (alert) alert.isRead = true;
    res.json({ success: true });
  });

  // 16. Audit logs & Users
  app.get('/api/audit-logs', (req, res) => {
    res.json(warehouseStore.auditLogs);
  });

  app.get('/api/users', (req, res) => {
    res.json(warehouseStore.users);
  });

  // Vite Middleware (Development) / Static files (Production)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Warehouse Platform server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
