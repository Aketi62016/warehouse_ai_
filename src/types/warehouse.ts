export type UserRole = 
  | 'WAREHOUSE_MANAGER' 
  | 'INVENTORY_MANAGER' 
  | 'PICKER' 
  | 'PACKING_STAFF' 
  | 'DISPATCHER' 
  | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  shift?: string;
}

export type OrderPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type OrderStatus = 
  | 'PENDING' 
  | 'ALLOCATED' 
  | 'PICKING' 
  | 'PACKING' 
  | 'QC_CHECK' 
  | 'DISPATCH_READY' 
  | 'DISPATCHED' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'ON_HOLD';

export type AllocationStatus = 'UNALLOCATED' | 'PARTIAL' | 'FULL' | 'CONFLICT';
export type PickingStatus = 'NOT_STARTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXCEPTION';
export type PackingStatus = 'QUEUED' | 'IN_PACKING' | 'PACKED' | 'DELAYED';
export type QCStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'PARTIAL';
export type DispatchStatus = 'WAITING_CARRIER' | 'MANIFESTED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface OrderItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  requestedQty: number;
  allocatedQty: number;
  pickedQty: number;
  packedQty: number;
  location: string;
  unitPrice: number;
  weightKg: number;
  availableStock: number;
}

export interface PriorityBreakdown {
  score: number;
  urgency: number;
  deliveryRisk: number;
  customerImpact: number;
  inventoryAvailability: number;
  orderAge: number;
  businessImportance: number;
  reasons: string[];
  deliveryUrgencyPoints?: number;
  customerTierPoints?: number;
  orderValuePoints?: number;
  itemAvailabilityPoints?: number;
  slaPenaltyRiskPoints?: number;
  delayPenaltyPoints?: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  details: string;
  stage: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  customerTier: 'VIP' | 'ENTERPRISE' | 'STANDARD';
  orderDate: string;
  expectedDelivery: string;
  items: OrderItem[];
  totalQty: number;
  totalValue: number;
  priority: OrderPriority;
  priorityScore: number;
  priorityBreakdown: PriorityBreakdown;
  status: OrderStatus;
  allocationStatus: AllocationStatus;
  pickingStatus: PickingStatus;
  packingStatus: PackingStatus;
  qcStatus: QCStatus;
  dispatchStatus: DispatchStatus;
  riskLevel: RiskLevel;
  carrier?: string;
  trackingNumber?: string;
  assignedPickerId?: string;
  assignedPickerName?: string;
  assignedPackingStationId?: string;
  auditTrail: AuditLog[];
  isDelayed: boolean;
  delayMinutes: number;
  notes?: string;
}

export type InventoryStatus = 'HEALTHY' | 'LOW_STOCK' | 'CRITICAL' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'DAMAGED';

export interface Product {
  sku: string;
  name: string;
  category: string;
  location: string;
  zone: string;
  aisle: string;
  shelf: string;
  x: number;
  y: number;
  availableQty: number;
  reservedQty: number;
  damagedQty: number;
  totalQty?: number;
  reorderLevel: number;
  safetyStock: number;
  incomingQty: number;
  expectedArrivalDate?: string;
  demandRate: number;
  unitPrice: number;
  weightKg: number;
  leadTimeDays: number;
  status: InventoryStatus;
  alternativeSku?: string;
  predictedDaysToStockout: number;
  supplier: string;
}

export interface AllocationConflict {
  id: string;
  sku: string;
  productName: string;
  availableStock: number;
  totalDemand: number;
  deficit: number;
  competingOrders: Array<{
    orderId: string;
    orderNumber?: string;
    customer: string;
    customerTier?: string;
    priority: OrderPriority;
    priorityScore: number;
    requestedQty: number;
    allocatedQty: number;
    deliveryDeadline?: string;
    expectedDelivery?: string;
    hoursRemaining?: number;
    orderValue?: number;
  }>;
  recommendedAllocation: Record<string, number>;
  recommendedAllocations?: Record<string, number>;
  explanation: string[];
  reasoning?: string;
  expectedImpact: string;
  backorderNeeded: number;
  resolved: boolean;
  totalRequested?: number;
  shortageQty?: number;
  createdAt?: string;
}

export interface PickingTaskItem {
  sku: string;
  productName: string;
  location: string;
  x: number;
  y: number;
  quantity: number;
  pickedQty: number;
  status: 'PENDING' | 'PICKED' | 'SHORT' | 'DAMAGED';
}

export interface PickingRoute {
  algorithm?: string;
  totalDistanceMeters?: number;
  estimatedTimeMinutes?: number;
  sequence?: Array<{
    location: string;
    sku: string;
    productName: string;
    quantity: number;
    x: number;
    y: number;
    step?: number;
  }>;
}

export interface PickingTask {
  id: string;
  taskNumber?: string;
  orderId: string;
  orderNumber: string;
  pickerId: string;
  pickerName: string;
  priority: OrderPriority;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  items: PickingTaskItem[];
  startTime?: string;
  expectedCompletion?: string;
  actualCompletion?: string;
  createdAt?: string;
  completedAt?: string;
  totalItemsCount?: number;
  pickedItemsCount?: number;
  optimizedRoute?: Array<{ location: string; sku: string; step: number; x: number; y: number }>;
  route?: PickingRoute;
  estimatedDistanceMeters?: number;
  estimatedTimeMin?: number;
  timeSavedMin?: number;
}

export interface PackingStation {
  id: string;
  name: string;
  workerName?: string;
  assignedStaff?: string;
  status: 'AVAILABLE' | 'BUSY' | 'DELAYED' | 'MAINTENANCE' | 'ACTIVE' | 'IDLE';
  currentOrderId?: string | null;
  currentOrderNumber?: string | null;
  waitingOrders?: Array<{ orderId: string; orderNumber: string; priority: OrderPriority; itemsCount: number }>;
  queuedOrders?: string[];
  avgPackingTimeMin: number;
  utilizationPercent: number;
  itemsPackedToday?: number;
  isOverloaded: boolean;
}

export interface QualityCheck {
  id: string;
  orderId: string;
  orderNumber: string;
  inspectorName: string;
  timestamp: string;
  checks?: {
    correctSku: boolean;
    correctQty: boolean;
    damagedItem: boolean;
    missingItem: boolean;
    packagingCondition: boolean;
    orderLabel: boolean;
    addressValidation: boolean;
    documentation: boolean;
  };
  result?: 'PASS' | 'FAIL' | 'PARTIAL';
  status?: 'PASSED' | 'FAILED' | 'PARTIAL';
  defectsFound?: string[];
  notes: string;
  exceptionCreated?: boolean;
}

export interface DispatchRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customer?: string;
  customerName?: string;
  carrier: string;
  trackingNumber: string;
  readyTime?: string;
  scheduledDispatchTime?: string;
  actualDispatchTime?: string;
  dispatchedAt?: string;
  dockGate?: string;
  status: 'READY' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | string;
  delayMinutes?: number;
  destinationCity?: string;
  packageWeightKg?: number;
  boxesCount?: number;
}

export type ExceptionType = 
  | 'MISSING_ITEM' 
  | 'DAMAGED_ITEM' 
  | 'WRONG_ITEM' 
  | 'SHORT_PICK' 
  | 'INVENTORY_CONFLICT' 
  | 'DELAYED_ORDER' 
  | 'PACKING_ERROR' 
  | 'QUALITY_FAILURE' 
  | 'DISPATCH_DELAY'
  | 'INVENTORY_DISCREPANCY'
  | 'ADDRESS_ERROR'
  | 'CARRIER_DELAY';

export type ExceptionResolutionType =
  | 'PARTIAL_SHIP'
  | 'SUBSTITUTE_SKU'
  | 'REROUTE_BIN'
  | 'EXPEDITE_REORDER'
  | 'HOLD_ORDER'
  | string;

export interface WarehouseException {
  id: string;
  orderId: string;
  orderNumber: string;
  type: ExceptionType;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'RESOLVING' | 'RESOLVED';
  reportedBy: string;
  reportedAt: string;
  location?: string;
  sku?: string;
  stage?: string;
  details: string;
  analysis?: {
    availableStock: number;
    alternativeSkuAvailable: boolean;
    altSku?: string;
    impactSummary: string;
  };
  recommendation?: {
    title: string;
    steps: string[];
    expectedOutcome: string;
  };
  recommendedResolutions?: ExceptionResolutionType[];
  resolution?: {
    actionTaken: string;
    resolvedBy: string;
    resolvedAt?: string;
    backorderCreated?: boolean;
    createBackorder?: boolean;
    notes?: string;
  };
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'ATTENTION' | 'AI_INSIGHT' | 'INFO';
  source?: string;
  type?: string;
  timestamp: string;
  reason?: string;
  recommendedAction?: string;
  targetView?: string;
  targetId?: string;
  isRead: boolean;
  isDismissed?: boolean;
  actionUrl?: string;
}

export interface WarehouseHealth {
  overallScore: number;
  status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  metrics: {
    orderFulfillmentRate: number;
    inventoryHealth: number;
    pickingEfficiency: number;
    packingEfficiency?: number;
    dispatchPerformance: number;
    exceptionRate: number;
    delayedOrdersRate: number;
    stockoutFrequency: number;
  };
  recommendations: string[];
  lastUpdated: string;
}

export interface PickerLeaderboardEntry {
  id?: string;
  pickerId?: string;
  name: string;
  avatar?: string;
  completedOrders?: number;
  completedPicks?: number;
  accuracy?: number;
  accuracyRate?: number;
  avgTimeMin?: number;
  picksPerHour?: number;
  currentTask?: string;
  shift?: string;
  activeWave?: string;
}

export interface BottleneckInfo {
  location: string;
  stage: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  issue: string;
  impact?: string;
  ordersDelayedCount: number;
  likelyCause?: string;
  recommendedAction: string;
  actionType?: string;
}

export interface ReorderRecommendation {
  id?: string;
  sku: string;
  productName: string;
  currentStock: number;
  reorderLevel?: number;
  safetyStock?: number;
  dailyDemand: number;
  recommendedQuantity: number;
  expectedStockoutDate?: string;
  daysUntilStockout?: number;
  demandTrend?: 'RISING' | 'STABLE' | 'DECLINING';
  reason: string;
  supplier?: string;
  unitCost?: number;
  totalCost?: number;
  status?: 'PENDING' | 'ORDERED' | 'DISMISSED';
}

export interface WhatIfSimulationInput {
  scenario?: 'URGENT_SURGE' | 'INVENTORY_DROP' | 'PACKING_OFFLINE' | 'SUPPLIER_DELAY' | 'DEMAND_SPIKE' | 'CUSTOM';
  scenarioName?: string;
  urgentOrdersCount?: number;
  urgentOrderSurge?: number;
  workersAbsent?: number;
  packingStationOffline?: number;
  inventoryDropPercent?: number;
  inventoryDropPercentage?: number;
  offlineStationId?: string;
  supplierDelayDays?: number;
  carrierCutoffEarlierHours?: number;
  demandIncreasePercent?: number;
}

export interface WhatIfSimulationResult {
  scenarioTitle?: string;
  scenarioName?: string;
  affectedOrdersCount?: number;
  expectedDelayMinutes?: number;
  bottleneckRisk?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  healthScoreImpact?: {
    current: number;
    simulated: number;
    diff: number;
  };
  currentScore?: number;
  projectedScore?: number;
  scoreDelta?: number;
  projectedDelayedOrders?: number;
  projectedBottleneckStage?: string;
  slaBreachRiskPercent?: number;
  impactedSkus?: Array<{ sku: string; name: string; stockAfter: number; status: string }>;
  recommendedActions?: string[];
  recommendedRecoveryActions?: string[];
  expectedRecoveryMinutes?: number;
  recoverySteps?: Array<{ step: number; action: string; impact: string }>;
}

export interface DashboardKPIs {
  totalOrders: number;
  pendingOrders: number;
  urgentOrders?: number;
  criticalOrdersCount?: number;
  delayedOrders?: number;
  delayedOrdersCount?: number;
  ordersInPicking?: number;
  pickingQueueCount?: number;
  ordersPacked?: number;
  packingQueueCount?: number;
  ordersDispatched?: number;
  lowStockItems?: number;
  lowStockCount?: number;
  outOfStockItems?: number;
  warehouseHealthScore?: number;
  fulfillmentRate?: number;
  openExceptionsCount: number;
  avgCycleTimeMinutes?: number;
  onTimeDispatchRate?: number;
}
