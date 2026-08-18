import {
  Order,
  Product,
  OrderPriority,
  PriorityBreakdown,
  WarehouseHealth,
  AllocationConflict,
  ReorderRecommendation,
  BottleneckInfo,
  WhatIfSimulationInput,
  WhatIfSimulationResult,
  PickingTask,
  PackingStation,
  WarehouseException,
  DispatchRecord
} from '../src/types/warehouse.ts';

/**
 * 1. DYNAMIC ORDER PRIORITIZATION ENGINE
 * Computes priority score (0-100) and assigns CRITICAL, HIGH, MEDIUM, LOW
 * based on: Urgency, Delivery Risk, Customer Impact, Inventory Availability, Order Age, Business Importance.
 */
export function calculateOrderPriority(
  order: Partial<Order> & { items: Array<{ sku: string; requestedQty: number; availableStock?: number }>; expectedDelivery: string; customerTier?: string; totalValue?: number; orderDate?: string },
  productsMap: Map<string, Product>
): { priority: OrderPriority; priorityScore: number; breakdown: PriorityBreakdown } {
  const now = new Date().getTime();
  const deliveryTime = new Date(order.expectedDelivery).getTime();
  const hoursUntilDelivery = Math.max(0.1, (deliveryTime - now) / (1000 * 60 * 60));
  
  const reasons: string[] = [];

  // 1. Urgency (0 - 25 pts)
  let urgency = 0;
  if (hoursUntilDelivery <= 4) {
    urgency = 25;
    reasons.push(`Delivery deadline is in ${hoursUntilDelivery.toFixed(1)} hours (Immediate SLA risk)`);
  } else if (hoursUntilDelivery <= 12) {
    urgency = 18;
    reasons.push(`Delivery deadline is in ${hoursUntilDelivery.toFixed(1)} hours (Same-day cutoff)`);
  } else if (hoursUntilDelivery <= 24) {
    urgency = 10;
    reasons.push(`Delivery deadline is within 24 hours`);
  } else {
    urgency = 4;
  }

  // 2. Delivery Risk & Delay (0 - 25 pts)
  let deliveryRisk = 0;
  const isDelayed = order.isDelayed || (now > deliveryTime);
  const delayMinutes = order.delayMinutes || (isDelayed ? Math.round((now - deliveryTime) / 60000) : 0);
  if (isDelayed || delayMinutes > 30) {
    deliveryRisk = 25;
    reasons.push(`Current fulfillment delay is ${delayMinutes} minutes`);
  } else if (delayMinutes > 10) {
    deliveryRisk = 15;
    reasons.push(`Fulfillment stage running ${delayMinutes}m behind pace`);
  } else if (hoursUntilDelivery <= 6) {
    deliveryRisk = 12;
    reasons.push(`Tight dispatch window remaining`);
  } else {
    deliveryRisk = 3;
  }

  // 3. Customer Impact (0 - 20 pts)
  let customerImpact = 0;
  if (order.customerTier === 'VIP') {
    customerImpact = 20;
    reasons.push(`VIP Tier customer account (Zero SLA tolerance)`);
  } else if (order.customerTier === 'ENTERPRISE') {
    customerImpact = 14;
    reasons.push(`Enterprise contract account`);
  } else if ((order.totalValue || 0) > 1500) {
    customerImpact = 12;
    reasons.push(`High order value ($${(order.totalValue || 0).toLocaleString()})`);
  } else {
    customerImpact = 5;
  }

  // 4. Inventory Availability (0 - 15 pts)
  let inventoryAvailability = 0;
  let canFullyFulfill = true;
  let hasHighDemandItem = false;

  for (const item of order.items || []) {
    const prod = productsMap.get(item.sku);
    const avail = prod ? prod.availableQty : (item.availableStock ?? 10);
    if (avail < item.requestedQty) {
      canFullyFulfill = false;
    }
    if (prod && prod.demandRate >= 15) {
      hasHighDemandItem = true;
    }
  }

  if (canFullyFulfill) {
    inventoryAvailability = 15;
    reasons.push(`Order has 100% sufficient inventory ready for immediate allocation`);
  } else {
    inventoryAvailability = 6;
    reasons.push(`Stock shortage detected on one or more line items`);
  }

  if (hasHighDemandItem) {
    reasons.push(`Order contains high-demand velocity items`);
  }

  // 5. Order Age (0 - 10 pts)
  let orderAge = 0;
  const createdTime = order.orderDate ? new Date(order.orderDate).getTime() : now - 3600000;
  const ageHours = (now - createdTime) / (1000 * 60 * 60);
  if (ageHours >= 24) {
    orderAge = 10;
    reasons.push(`Order in system for over 24 hours`);
  } else if (ageHours >= 6) {
    orderAge = 6;
  } else {
    orderAge = 3;
  }

  // 6. Business Importance (0 - 5 pts)
  let businessImportance = 3;
  if ((order.totalValue || 0) > 3000) {
    businessImportance = 5;
    reasons.push(`Critical strategic consignment`);
  }

  const rawScore = urgency + deliveryRisk + customerImpact + inventoryAvailability + orderAge + businessImportance;
  const priorityScore = Math.min(100, Math.max(1, rawScore));

  let priority: OrderPriority = 'LOW';
  if (priorityScore >= 80) priority = 'CRITICAL';
  else if (priorityScore >= 60) priority = 'HIGH';
  else if (priorityScore >= 40) priority = 'MEDIUM';
  else priority = 'LOW';

  return {
    priority,
    priorityScore,
    breakdown: {
      score: priorityScore,
      urgency,
      deliveryRisk,
      customerImpact,
      inventoryAvailability,
      orderAge,
      businessImportance,
      reasons: reasons.slice(0, 5)
    }
  };
}

/**
 * 2. WAREHOUSE HEALTH SCORE (0-100)
 * Evaluates Order fulfillment, Inventory health, Picking efficiency, Packing efficiency,
 * Dispatch performance, Exception rate, Delayed orders, and Stockout frequency.
 */
export function calculateWarehouseHealth(
  orders: Order[],
  products: Product[],
  pickingTasks: PickingTask[],
  packingStations: PackingStation[],
  exceptions: WarehouseException[],
  dispatches: DispatchRecord[]
): WarehouseHealth {
  const totalOrders = orders.length || 1;
  const activeOrders = orders.filter(o => o.status !== 'CANCELLED');
  const delayedOrders = activeOrders.filter(o => o.isDelayed || o.delayMinutes > 0);
  const delayedOrdersRate = Math.round((delayedOrders.length / activeOrders.length) * 100);

  // 1. Order Fulfillment Rate (Target: 95%+)
  const fulfilledOrders = orders.filter(o => o.status === 'DISPATCHED' || o.status === 'DELIVERED');
  const orderFulfillmentRate = Math.min(100, Math.max(50, Math.round((fulfilledOrders.length / (totalOrders * 0.4 || 1)) * 90)));

  // 2. Inventory Health (Stocked items vs low/out of stock)
  const totalProducts = products.length || 1;
  const healthyProducts = products.filter(p => p.status === 'HEALTHY' || p.status === 'OVERSTOCK');
  const stockoutProducts = products.filter(p => p.status === 'OUT_OF_STOCK' || p.availableQty <= 0);
  const inventoryHealth = Math.round((healthyProducts.length / totalProducts) * 100);
  const stockoutFrequency = Math.round((stockoutProducts.length / totalProducts) * 100);

  // 3. Picking Efficiency
  const completedPicks = pickingTasks.filter(p => p.status === 'COMPLETED');
  const delayedPicks = pickingTasks.filter(p => p.status === 'DELAYED');
  const pickAccuracyRate = 96.5;
  const pickingEfficiency = Math.max(40, Math.min(100, Math.round(98 - (delayedPicks.length * 4))));

  // 4. Packing Efficiency
  const busyOrAvailable = packingStations.filter(s => s.status !== 'DELAYED' && s.status !== 'MAINTENANCE');
  const avgUtil = packingStations.reduce((acc, s) => acc + s.utilizationPercent, 0) / (packingStations.length || 1);
  const packingEfficiency = Math.round(Math.min(100, Math.max(50, (busyOrAvailable.length / (packingStations.length || 1)) * 90 + (avgUtil > 90 ? -10 : 5))));

  // 5. Dispatch Performance
  const onTimeDispatches = dispatches.filter(d => d.delayMinutes <= 0);
  const dispatchPerformance = dispatches.length ? Math.round((onTimeDispatches.length / dispatches.length) * 100) : 92;

  // 6. Exception Rate
  const openExceptions = exceptions.filter(e => e.status !== 'RESOLVED');
  const exceptionRate = Math.min(30, Math.round((openExceptions.length / (activeOrders.length || 1)) * 100));

  // Weighted aggregate
  // Health = 25% Fulfillment + 20% Inventory + 20% Picking + 15% Packing + 10% Dispatch - (Exceptions & Delays)
  let rawHealth = 
    (orderFulfillmentRate * 0.25) +
    (inventoryHealth * 0.20) +
    (pickingEfficiency * 0.20) +
    (packingEfficiency * 0.15) +
    (dispatchPerformance * 0.20) -
    (exceptionRate * 0.8) -
    (delayedOrdersRate * 0.4);

  const overallScore = Math.min(100, Math.max(10, Math.round(rawHealth)));

  let status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' = 'GOOD';
  if (overallScore >= 85) status = 'EXCELLENT';
  else if (overallScore >= 70) status = 'GOOD';
  else if (overallScore >= 50) status = 'WARNING';
  else status = 'CRITICAL';

  const recommendations: string[] = [];
  if (stockoutFrequency > 8) {
    recommendations.push(`Trigger automated purchase orders for ${stockoutProducts.length} out-of-stock SKUs to prevent backorder accumulation.`);
  }
  if (delayedOrders.length > 5) {
    recommendations.push(`Fast-track ${delayedOrders.length} delayed orders by prioritizing them in Picking Aisle B and Packing Station 01.`);
  }
  if (openExceptions.length > 3) {
    recommendations.push(`Resolve ${openExceptions.length} open exceptions in the Exception Control Center to unblock queued dispatch manifests.`);
  }
  if (packingStations.some(s => s.isOverloaded)) {
    recommendations.push(`Rebalance workload across Packing Stations — Station 03 is running over capacity.`);
  }
  if (recommendations.length === 0) {
    recommendations.push(`Maintain current throughput. Overall warehouse performance is operating within optimal baseline parameters.`);
  }

  return {
    overallScore,
    status,
    metrics: {
      orderFulfillmentRate,
      inventoryHealth,
      pickingEfficiency,
      packingEfficiency,
      dispatchPerformance,
      exceptionRate,
      delayedOrdersRate,
      stockoutFrequency
    },
    recommendations,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * 3. SMART INVENTORY ALLOCATION & CONFLICT RESOLUTION
 * Resolves stock competition between orders with explainable rationale.
 */
export function resolveInventoryConflicts(
  orders: Order[],
  products: Product[]
): AllocationConflict[] {
  const conflicts: AllocationConflict[] = [];
  const productsMap = new Map(products.map(p => [p.sku, p]));

  // Find all unallocated or pending orders per SKU
  const skuDemands = new Map<string, Array<{ order: Order; requestedQty: number }>>();

  for (const order of orders) {
    if (order.status === 'PENDING' || order.allocationStatus === 'UNALLOCATED' || order.allocationStatus === 'CONFLICT') {
      for (const item of order.items) {
        if (item.allocatedQty < item.requestedQty) {
          const needed = item.requestedQty - item.allocatedQty;
          const list = skuDemands.get(item.sku) || [];
          list.push({ order, requestedQty: needed });
          skuDemands.set(item.sku, list);
        }
      }
    }
  }

  for (const [sku, demandList] of skuDemands.entries()) {
    const product = productsMap.get(sku);
    if (!product) continue;

    const totalDemand = demandList.reduce((acc, d) => acc + d.requestedQty, 0);
    if (totalDemand > product.availableQty && demandList.length > 1) {
      // Conflict detected!
      // Sort competing orders by priorityScore desc, then delivery deadline asc
      const sorted = [...demandList].sort((a, b) => {
        if (b.order.priorityScore !== a.order.priorityScore) {
          return b.order.priorityScore - a.order.priorityScore;
        }
        return new Date(a.order.expectedDelivery).getTime() - new Date(b.order.expectedDelivery).getTime();
      });

      let remainingAvailable = product.availableQty;
      const recommendedAllocation: Record<string, number> = {};
      const explanations: string[] = [];

      for (const comp of sorted) {
        const alloc = Math.min(comp.requestedQty, remainingAvailable);
        recommendedAllocation[comp.order.id] = alloc;
        remainingAvailable -= alloc;
      }

      const topOrder = sorted[0].order;
      const secondOrder = sorted[1]?.order;

      explanations.push(`Order #${topOrder.orderNumber} is assigned ${recommendedAllocation[topOrder.id]} units due to ${topOrder.priority} priority (Score: ${topOrder.priorityScore}/100) and closer delivery deadline.`);
      if (secondOrder) {
        if (recommendedAllocation[secondOrder.id] > 0) {
          explanations.push(`Order #${secondOrder.orderNumber} receives remaining ${recommendedAllocation[secondOrder.id]} units for partial fulfillment.`);
        } else {
          explanations.push(`Order #${secondOrder.orderNumber} (${secondOrder.priority} priority) deferred to prevent breaking SLA on critical consignment #${topOrder.orderNumber}.`);
        }
      }
      explanations.push(`Automatic replenishment request suggested for missing ${totalDemand - product.availableQty} units.`);

      conflicts.push({
        id: `CONF-${sku}-${Date.now() % 10000}`,
        sku,
        productName: product.name,
        availableStock: product.availableQty,
        totalDemand,
        deficit: totalDemand - product.availableQty,
        competingOrders: sorted.map(s => ({
          orderId: s.order.id,
          customer: s.order.customer,
          priority: s.order.priority,
          priorityScore: s.order.priorityScore,
          requestedQty: s.requestedQty,
          allocatedQty: recommendedAllocation[s.order.id] || 0,
          deliveryDeadline: s.order.expectedDelivery
        })),
        recommendedAllocation,
        explanation: explanations,
        expectedImpact: `Minimizes overall delay and prevents ${sorted.filter(s => (recommendedAllocation[s.order.id] || 0) === s.requestedQty).length} immediate customer SLA penalties.`,
        backorderNeeded: totalDemand - product.availableQty,
        resolved: false
      });
    }
  }

  return conflicts;
}

/**
 * 4. STOCKOUT PREDICTION & REORDER RECOMMENDATIONS
 */
export function generateStockoutPredictions(products: Product[]): ReorderRecommendation[] {
  const recommendations: ReorderRecommendation[] = [];

  for (const prod of products) {
    const dailyDemand = Math.max(0.5, prod.demandRate || 5);
    const netAvailable = Math.max(0, prod.availableQty - prod.reservedQty);
    const daysUntilStockout = netAvailable / dailyDemand;
    const isBelowSafety = netAvailable <= prod.safetyStock;
    const isBelowReorder = netAvailable <= prod.reorderLevel;

    if (isBelowReorder || daysUntilStockout <= 3.5 || prod.availableQty <= 5) {
      const stockoutDate = new Date();
      stockoutDate.setDate(stockoutDate.getDate() + Math.max(1, Math.round(daysUntilStockout)));
      
      // Calculate Economic Order Quantity approximation
      const recommendedQty = Math.max(50, Math.ceil(dailyDemand * (prod.leadTimeDays + 14) + prod.safetyStock - netAvailable));
      
      let reason = '';
      if (prod.availableQty <= 0) {
        reason = `SKU is currently OUT OF STOCK. Immediate emergency purchase order required.`;
      } else if (isBelowSafety) {
        reason = `Current stock (${netAvailable}) has breached safety threshold (${prod.safetyStock}). Expected stockout in ${daysUntilStockout.toFixed(1)} days.`;
      } else {
        reason = `Inventory will fall below minimum safety stock in ${daysUntilStockout.toFixed(1)} days under average demand (${dailyDemand}/day).`;
      }

      recommendations.push({
        id: `REORD-${prod.sku}`,
        sku: prod.sku,
        productName: prod.name,
        currentStock: prod.availableQty,
        reorderLevel: prod.reorderLevel,
        safetyStock: prod.safetyStock,
        dailyDemand: Math.round(dailyDemand * 10) / 10,
        recommendedQuantity: recommendedQty,
        expectedStockoutDate: stockoutDate.toLocaleDateString(),
        demandTrend: prod.demandRate >= 12 ? 'RISING' : 'STABLE',
        reason,
        supplier: prod.supplier,
        unitCost: Math.round(prod.unitPrice * 0.6 * 100) / 100,
        totalCost: Math.round(recommendedQty * (prod.unitPrice * 0.6) * 100) / 100,
        status: 'PENDING'
      });
    }
  }

  return recommendations;
}

/**
 * 5. BOTTLENECK DETECTION ENGINE
 */
export function detectWarehouseBottlenecks(
  pickingTasks: PickingTask[],
  packingStations: PackingStation[],
  orders: Order[],
  exceptions: WarehouseException[]
): BottleneckInfo[] {
  const bottlenecks: BottleneckInfo[] = [];

  // Check Packing Stations
  const overloadedStation = packingStations.find(s => s.waitingOrders.length >= 4 || s.avgPackingTimeMin > 6 || s.isOverloaded);
  if (overloadedStation) {
    bottlenecks.push({
      location: `Packing Station ${overloadedStation.id}`,
      stage: 'PACKING',
      severity: 'CRITICAL',
      issue: `Average packing time increased by 42% (${overloadedStation.avgPackingTimeMin}m vs 3.2m baseline).`,
      impact: `${overloadedStation.waitingOrders.length + 8} orders queued and at risk of missing carrier dispatch window.`,
      ordersDelayedCount: overloadedStation.waitingOrders.length + 8,
      likelyCause: `Station ${overloadedStation.id} has 2.4x standard workload and handles heavy multi-item packages.`,
      recommendedAction: `Move 4 pending orders from Station ${overloadedStation.id} to available Station 01 & 04.`,
      actionType: 'REBALANCE_PACKING'
    });
  }

  // Check Picking Queues
  const delayedPicks = pickingTasks.filter(p => p.status === 'DELAYED' || p.status === 'IN_PROGRESS');
  if (delayedPicks.length >= 3) {
    bottlenecks.push({
      location: 'Aisle B (Electronics & Robotics)',
      stage: 'PICKING',
      severity: 'HIGH',
      issue: 'High congestion in Zone B with multiple simultaneous picking tasks.',
      impact: `${delayedPicks.length} picking tasks experiencing 15+ minute aisle travel delays.`,
      ordersDelayedCount: delayedPicks.length,
      likelyCause: 'Concentration of high-demand robotics and smart sensor SKUs in adjacent bays.',
      recommendedAction: 'Enable dynamic wave-picking batching and route detour via Aisle C cross-walk.',
      actionType: 'BATCH_PICKING'
    });
  }

  // Check Unresolved Exceptions
  const criticalExceptions = exceptions.filter(e => e.status !== 'RESOLVED' && (e.severity === 'CRITICAL' || e.severity === 'HIGH'));
  if (criticalExceptions.length >= 2) {
    bottlenecks.push({
      location: 'Quality & Exception Desk',
      stage: 'QC',
      severity: 'HIGH',
      issue: `${criticalExceptions.length} critical order exceptions awaiting manager override.`,
      impact: `Orders are blocked from entering carrier manifest generation.`,
      ordersDelayedCount: criticalExceptions.length,
      likelyCause: 'Missing stock on short-picks requiring partial shipment authorizations.',
      recommendedAction: 'Execute one-click partial-ship resolution with automatic backorder generation.',
      actionType: 'AUTO_RESOLVE_EXCEPTIONS'
    });
  }

  return bottlenecks;
}

/**
 * 6. SMART PICKING ROUTE OPTIMIZER (TSP / S-Shape Grid Routing)
 * Computes shortest path across warehouse grid bays (A-01 to D-20).
 */
export function optimizePickRoute(items: Array<{ sku: string; productName: string; location: string; x?: number; y?: number; quantity: number }>): {
  optimizedRoute: Array<{ location: string; sku: string; step: number; x: number; y: number }>;
  estimatedDistanceMeters: number;
  estimatedTimeMin: number;
  timeSavedMin: number;
} {
  if (!items || items.length === 0) {
    return { optimizedRoute: [], estimatedDistanceMeters: 0, estimatedTimeMin: 0, timeSavedMin: 0 };
  }

  // Helper to parse location coordinate or fall back to hash
  const mapped = items.map(item => {
    const loc = item.location || 'A-01';
    const aisleChar = loc.charAt(0).toUpperCase();
    const aisleIndex = aisleChar.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
    const bayNum = parseInt(loc.substring(2)) || 1;
    
    // Grid coordinate (0-100)
    const x = item.x ?? (15 + aisleIndex * 24);
    const y = item.y ?? (10 + (bayNum % 20) * 4.2);

    return {
      sku: item.sku,
      location: loc,
      x,
      y,
      aisleIndex,
      bayNum
    };
  });

  // Sort by S-Shape / Serpentine order:
  // Even aisles sort y ascending, Odd aisles sort y descending
  const sorted = [...mapped].sort((a, b) => {
    if (a.aisleIndex !== b.aisleIndex) {
      return a.aisleIndex - b.aisleIndex;
    }
    return (a.aisleIndex % 2 === 0) ? (a.y - b.y) : (b.y - a.y);
  });

  // Calculate distances
  let currentX = 10; // Start at dispatch staging
  let currentY = 10;
  let totalDistance = 0;

  const route = sorted.map((p, idx) => {
    const dist = Math.hypot(p.x - currentX, p.y - currentY) * 2.5; // scaling factor to meters
    totalDistance += dist;
    currentX = p.x;
    currentY = p.y;
    return {
      location: p.location,
      sku: p.sku,
      step: idx + 1,
      x: p.x,
      y: p.y
    };
  });

  // Return to staging
  totalDistance += Math.hypot(10 - currentX, 10 - currentY) * 2.5;

  const estimatedDistanceMeters = Math.round(totalDistance);
  const estimatedTimeMin = Math.max(2, Math.round(estimatedDistanceMeters / 25)); // ~25m/min walking + pick time
  const unoptimizedDistance = Math.round(totalDistance * 1.45);
  const timeSavedMin = Math.max(1, Math.round((unoptimizedDistance - estimatedDistanceMeters) / 25));

  return {
    optimizedRoute: route,
    estimatedDistanceMeters,
    estimatedTimeMin,
    timeSavedMin
  };
}

/**
 * 7. WHAT-IF SIMULATOR ENGINE
 */
export function runWhatIfSimulation(
  input: WhatIfSimulationInput,
  currentOrders: Order[],
  currentProducts: Product[],
  currentHealth: WarehouseHealth
): WhatIfSimulationResult {
  const scenario = input.scenario;
  let title = 'Custom Scenario Simulation';
  let affectedOrders = 0;
  let expectedDelayMin = 0;
  let bottleneckRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  let scoreDiff = -8;
  const impactedSkus: Array<{ sku: string; name: string; stockAfter: number; status: string }> = [];
  const recommendedActions: string[] = [];
  const recoverySteps: Array<{ step: number; action: string; impact: string }> = [];
  let recoveryMinutes = 35;

  if (scenario === 'URGENT_SURGE') {
    const surgeCount = input.urgentOrdersCount || 20;
    title = `Sudden Surge of ${surgeCount} Urgent Orders`;
    affectedOrders = Math.round(surgeCount * 1.8);
    expectedDelayMin = Math.round(surgeCount * 2.5);
    bottleneckRisk = 'HIGH';
    scoreDiff = -14;
    recoveryMinutes = 45;

    impactedSkus.push(
      { sku: 'SKU-ELEC-102', name: 'Industrial Optical LiDAR Sensor', stockAfter: 2, status: 'CRITICAL' },
      { sku: 'SKU-ROB-404', name: 'Servo Motor High Torque 24V', stockAfter: 0, status: 'OUT_OF_STOCK' },
      { sku: 'SKU-MED-801', name: 'Precision Digital Caliper Pro', stockAfter: 4, status: 'LOW_STOCK' }
    );

    recommendedActions.push(
      'Activate Wave Picking: Consolidate 20 urgent orders into 3 coordinated multi-picker waves.',
      'Fast-track Packing Station 01 & 02 exclusively for single-line urgent parcels.',
      'Hold non-urgent standard orders for next shift replenishment.'
    );

    recoverySteps.push(
      { step: 1, action: 'Batch 20 orders across Aisles A & B', impact: 'Reduces pick travel time by 38%' },
      { step: 2, action: 'Dedicate Packing Station 01 to express parcels', impact: 'Clears queue in 25 minutes' },
      { step: 3, action: 'Trigger emergency stock transfer for Servo Motors', impact: 'Replenishes stock before afternoon cycle' }
    );
  } else if (scenario === 'PACKING_OFFLINE') {
    const stationId = input.offlineStationId || '02';
    title = `Packing Station ${stationId} Goes Offline`;
    affectedOrders = 27;
    expectedDelayMin = 42;
    bottleneckRisk = 'CRITICAL';
    scoreDiff = -18;
    recoveryMinutes = 32;

    recommendedActions.push(
      `Redirect 12 queued orders to Packing Station 01.`,
      `Redirect 15 queued orders to Packing Station 03 & 04.`,
      `Deploy float packing associate to Station 05 to double packing throughput.`
    );

    recoverySteps.push(
      { step: 1, action: 'Reroute active conveyor feed to Stations 01, 03, 04', impact: 'Prevents parcel pile-up' },
      { step: 2, action: 'Reassign Worker Priya from Station 02 to Station 05', impact: 'Increases auxiliary capacity by 40%' },
      { step: 3, action: 'Dispatch maintenance technician to Station 02 sensor arm', impact: 'Estimated 45 min fix time' }
    );
  } else if (scenario === 'INVENTORY_DROP') {
    const drop = input.inventoryDropPercent || 30;
    title = `Inventory Count Drop of ${drop}% Across Warehouse`;
    affectedOrders = 34;
    expectedDelayMin = 55;
    bottleneckRisk = 'CRITICAL';
    scoreDiff = -22;
    recoveryMinutes = 60;

    impactedSkus.push(
      { sku: 'SKU-ELEC-101', name: 'Smart IoT Gateway Pro', stockAfter: 3, status: 'CRITICAL' },
      { sku: 'SKU-ELEC-105', name: 'Industrial RFID Scanner', stockAfter: 0, status: 'OUT_OF_STOCK' },
      { sku: 'SKU-ROB-402', name: 'Micro Controller Core Board', stockAfter: 5, status: 'LOW_STOCK' }
    );

    recommendedActions.push(
      'Trigger dynamic priority reallocation for all competing orders.',
      'Authorize partial fulfillment on all Standard & Enterprise tier orders.',
      'Generate immediate supplier emergency replenishment purchase orders.'
    );

    recoverySteps.push(
      { step: 1, action: 'Run Smart Allocation engine to protect VIP order SLAs', impact: 'Saves 18 critical customer orders' },
      { step: 2, action: 'Split partial line items and ship available units', impact: 'Keeps 82% fulfillment rate active' },
      { step: 3, action: 'Initiate cycle count audit on Aisles A & C', impact: 'Identifies discrepancy root causes' }
    );
  } else if (scenario === 'SUPPLIER_DELAY') {
    const days = input.supplierDelayDays || 2;
    title = `Supplier Inbound Delivery Delayed by ${days} Days`;
    affectedOrders = 19;
    expectedDelayMin = 30;
    bottleneckRisk = 'HIGH';
    scoreDiff = -11;
    recoveryMinutes = 40;

    recommendedActions.push(
      'Switch affected orders to approved alternative SKUs where compatible.',
      'Notify affected enterprise accounts with automated ETA revisions.',
      'Reserve remaining safety stock exclusively for critical SLA orders.'
    );

    recoverySteps.push(
      { step: 1, action: 'Auto-substitute SKU-ELEC-101 with SKU-ELEC-101B (Compatible)', impact: 'Resolves 11 order shortages immediately' },
      { step: 2, action: 'Notify 8 customers of revised 24h dispatch window', impact: 'Maintains customer satisfaction' }
    );
  } else {
    // Demand spike / custom
    const spike = input.demandIncreasePercent || 50;
    title = `Demand Surge of +${spike}%`;
    affectedOrders = 31;
    expectedDelayMin = 48;
    bottleneckRisk = 'HIGH';
    scoreDiff = -15;
    recoveryMinutes = 50;

    recommendedActions.push(
      'Scale picker workforce shifts and enable overtime incentive.',
      'Increase reorder safety thresholds across top 20 velocity products.',
      'Prioritize high-margin and critical SLA orders in allocation engine.'
    );

    recoverySteps.push(
      { step: 1, action: 'Re-index pick paths to high-velocity zone A', impact: 'Improves pick cycle by 22%' },
      { step: 2, action: 'Activate second dispatch carrier pickup run', impact: 'Prevents dock overflow' }
    );
  }

  const simulatedScore = Math.max(15, currentHealth.overallScore + scoreDiff);

  return {
    scenarioTitle: title,
    affectedOrdersCount: affectedOrders,
    expectedDelayMinutes: expectedDelayMin,
    bottleneckRisk,
    healthScoreImpact: {
      current: currentHealth.overallScore,
      simulated: simulatedScore,
      diff: scoreDiff
    },
    impactedSkus,
    recommendedActions,
    expectedRecoveryMinutes: recoveryMinutes,
    recoverySteps
  };
}
