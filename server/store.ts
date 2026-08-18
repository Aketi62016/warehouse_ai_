import {
  User,
  Product,
  Order,
  PickingTask,
  PackingStation,
  QualityCheck,
  DispatchRecord,
  WarehouseException,
  Alert,
  PickerLeaderboardEntry,
  AuditLog
} from '../src/types/warehouse.ts';
import {
  calculateOrderPriority,
  calculateWarehouseHealth,
  resolveInventoryConflicts,
  generateStockoutPredictions,
  detectWarehouseBottlenecks,
  optimizePickRoute
} from './decisionEngine.ts';

class WarehouseStore {
  public users: User[] = [];
  public products: Product[] = [];
  public orders: Order[] = [];
  public pickingTasks: PickingTask[] = [];
  public packingStations: PackingStation[] = [];
  public qualityChecks: QualityCheck[] = [];
  public dispatches: DispatchRecord[] = [];
  public exceptions: WarehouseException[] = [];
  public alerts: Alert[] = [];
  public pickerLeaderboard: PickerLeaderboardEntry[] = [];
  public auditLogs: AuditLog[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // 1. Users
    this.users = [
      { id: 'USR-01', name: 'Marcus Vance', email: 'manager@warehouse.com', role: 'WAREHOUSE_MANAGER', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', shift: 'Morning Shift A (06:00 - 14:30)' },
      { id: 'USR-02', name: 'Sarah Chen', email: 'inventory@warehouse.com', role: 'INVENTORY_MANAGER', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80', shift: 'Morning Shift A (06:00 - 14:30)' },
      { id: 'USR-03', name: 'Rahul Sharma', email: 'picker@warehouse.com', role: 'PICKER', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', shift: 'Morning Shift A (06:00 - 14:30)' },
      { id: 'USR-04', name: 'Priya Patel', email: 'packing@warehouse.com', role: 'PACKING_STAFF', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80', shift: 'Morning Shift A (06:00 - 14:30)' },
      { id: 'USR-05', name: 'David Miller', email: 'dispatcher@warehouse.com', role: 'DISPATCHER', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', shift: 'Morning Shift A (06:00 - 14:30)' },
      { id: 'USR-06', name: 'Elena Rostova', email: 'admin@warehouse.com', role: 'ADMIN', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80', shift: 'Admin Central' }
    ];

    // 2. Picker Leaderboard
    this.pickerLeaderboard = [
      { id: 'USR-03', name: 'Rahul Sharma', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', completedOrders: 48, accuracy: 99.2, avgTimeMin: 4.2, currentTask: 'TASK-PK-1021', shift: 'Morning A' },
      { id: 'USR-07', name: 'Priya Patel', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80', completedOrders: 44, accuracy: 98.8, avgTimeMin: 4.5, currentTask: 'TASK-PK-1024', shift: 'Morning A' },
      { id: 'USR-08', name: 'Carlos Mendez', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80', completedOrders: 41, accuracy: 97.9, avgTimeMin: 4.8, currentTask: 'TASK-PK-1028', shift: 'Morning A' },
      { id: 'USR-09', name: 'Aisha Al-Mansoor', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', completedOrders: 39, accuracy: 99.4, avgTimeMin: 5.1, currentTask: 'TASK-PK-1030', shift: 'Morning A' },
      { id: 'USR-10', name: 'Lucas Meyer', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80', completedOrders: 36, accuracy: 98.1, avgTimeMin: 5.4, currentTask: 'TASK-PK-1032', shift: 'Morning A' }
    ];

    // 3. Products (55 Realistic Industrial / Electronics / Medical / Robotics / Hardware SKUs)
    const baseProducts: Array<Omit<Product, 'status' | 'predictedDaysToStockout'>> = [
      // Aisle A - Electronics & Smart Sensors (A-01 to A-20)
      { sku: 'SKU-ELEC-101', name: 'Smart IoT Gateway Pro 5G', category: 'Electronics', location: 'A-01', zone: 'A', aisle: 'A', shelf: '01', x: 15, y: 12, availableQty: 18, reservedQty: 8, damagedQty: 0, reorderLevel: 25, safetyStock: 15, incomingQty: 40, demandRate: 8.5, unitPrice: 185.00, weightKg: 0.6, leadTimeDays: 4, alternativeSku: 'SKU-ELEC-101B', supplier: 'Nexus Tech Global' },
      { sku: 'SKU-ELEC-101B', name: 'Smart IoT Gateway Enterprise V2', category: 'Electronics', location: 'A-02', zone: 'A', aisle: 'A', shelf: '02', x: 15, y: 16, availableQty: 32, reservedQty: 4, damagedQty: 0, reorderLevel: 20, safetyStock: 10, incomingQty: 0, demandRate: 4.2, unitPrice: 195.00, weightKg: 0.7, leadTimeDays: 5, supplier: 'Nexus Tech Global' },
      { sku: 'SKU-ELEC-102', name: 'Industrial Optical LiDAR Sensor', category: 'Electronics', location: 'A-05', zone: 'A', aisle: 'A', shelf: '05', x: 15, y: 28, availableQty: 7, reservedQty: 5, damagedQty: 1, reorderLevel: 15, safetyStock: 8, incomingQty: 25, demandRate: 6.0, unitPrice: 420.00, weightKg: 1.2, leadTimeDays: 7, supplier: 'OptiVision Dynamics' },
      { sku: 'SKU-ELEC-103', name: 'Ultra-Wideband UWB Beacon Tag', category: 'Electronics', location: 'A-08', zone: 'A', aisle: 'A', shelf: '08', x: 15, y: 40, availableQty: 145, reservedQty: 20, damagedQty: 2, reorderLevel: 80, safetyStock: 40, incomingQty: 200, demandRate: 24.0, unitPrice: 28.50, weightKg: 0.1, leadTimeDays: 3, supplier: 'GeoTrack Systems' },
      { sku: 'SKU-ELEC-104', name: 'High-Density Rugged Tablet 10"', category: 'Electronics', location: 'A-12', zone: 'A', aisle: 'A', shelf: '12', x: 15, y: 55, availableQty: 22, reservedQty: 6, damagedQty: 0, reorderLevel: 20, safetyStock: 10, incomingQty: 30, demandRate: 5.0, unitPrice: 650.00, weightKg: 1.1, leadTimeDays: 6, supplier: 'ToughPad Hardware' },
      { sku: 'SKU-ELEC-105', name: 'Industrial RFID Handheld Scanner', category: 'Electronics', location: 'A-15', zone: 'A', aisle: 'A', shelf: '15', x: 15, y: 68, availableQty: 0, reservedQty: 0, damagedQty: 2, reorderLevel: 15, safetyStock: 8, incomingQty: 20, demandRate: 4.8, unitPrice: 380.00, weightKg: 0.8, leadTimeDays: 5, supplier: 'ScanMaster Corp' },
      { sku: 'SKU-ELEC-106', name: 'Bluetooth LE Mesh Node v4', category: 'Electronics', location: 'A-18', zone: 'A', aisle: 'A', shelf: '18', x: 15, y: 80, availableQty: 88, reservedQty: 12, damagedQty: 0, reorderLevel: 50, safetyStock: 30, incomingQty: 100, demandRate: 14.0, unitPrice: 45.00, weightKg: 0.2, leadTimeDays: 4, supplier: 'MeshWave Networks' },
      { sku: 'SKU-ELEC-107', name: 'Thermal Imaging Infrared Core', category: 'Electronics', location: 'A-20', zone: 'A', aisle: 'A', shelf: '20', x: 15, y: 90, availableQty: 6, reservedQty: 4, damagedQty: 0, reorderLevel: 10, safetyStock: 5, incomingQty: 15, demandRate: 2.5, unitPrice: 890.00, weightKg: 0.4, leadTimeDays: 10, supplier: 'FLIR Systems Sub' },

      // Aisle B - Robotics & Automation Modules (B-01 to B-20)
      { sku: 'SKU-ROB-401', name: 'Brushless Actuator Arm 12V 50W', category: 'Robotics', location: 'B-02', zone: 'B', aisle: 'B', shelf: '02', x: 39, y: 16, availableQty: 14, reservedQty: 6, damagedQty: 0, reorderLevel: 20, safetyStock: 10, incomingQty: 30, demandRate: 4.5, unitPrice: 240.00, weightKg: 2.1, leadTimeDays: 6, supplier: 'RoboKinetic Ltd' },
      { sku: 'SKU-ROB-402', name: 'Micro Controller Core Board ARM-M7', category: 'Robotics', location: 'B-05', zone: 'B', aisle: 'B', shelf: '05', x: 39, y: 28, availableQty: 62, reservedQty: 15, damagedQty: 1, reorderLevel: 40, safetyStock: 20, incomingQty: 80, demandRate: 11.0, unitPrice: 75.00, weightKg: 0.15, leadTimeDays: 4, supplier: 'Silicon Core fab' },
      { sku: 'SKU-ROB-403', name: 'Robotic Gripper Pneumatic Dual-Jaw', category: 'Robotics', location: 'B-09', zone: 'B', aisle: 'B', shelf: '09', x: 39, y: 44, availableQty: 8, reservedQty: 6, damagedQty: 0, reorderLevel: 12, safetyStock: 6, incomingQty: 18, demandRate: 2.8, unitPrice: 510.00, weightKg: 1.8, leadTimeDays: 7, supplier: 'PneuMotion Systems' },
      { sku: 'SKU-ROB-404', name: 'Servo Motor High Torque 24V 4.5Nm', category: 'Robotics', location: 'B-10', zone: 'B', aisle: 'B', shelf: '10', x: 39, y: 48, availableQty: 4, reservedQty: 3, damagedQty: 0, reorderLevel: 15, safetyStock: 8, incomingQty: 25, demandRate: 5.2, unitPrice: 160.00, weightKg: 1.4, leadTimeDays: 5, supplier: 'TorqueTech Power' },
      { sku: 'SKU-ROB-405', name: 'AGV Omnidirectional Mecanum Wheel Set', category: 'Robotics', location: 'B-14', zone: 'B', aisle: 'B', shelf: '14', x: 39, y: 64, availableQty: 19, reservedQty: 4, damagedQty: 0, reorderLevel: 15, safetyStock: 8, incomingQty: 20, demandRate: 3.1, unitPrice: 320.00, weightKg: 6.2, leadTimeDays: 8, supplier: 'DriveDynamics' },
      { sku: 'SKU-ROB-406', name: 'Ultrasonic Distance Module Array', category: 'Robotics', location: 'B-18', zone: 'B', aisle: 'B', shelf: '18', x: 39, y: 80, availableQty: 110, reservedQty: 10, damagedQty: 0, reorderLevel: 60, safetyStock: 30, incomingQty: 100, demandRate: 15.0, unitPrice: 34.00, weightKg: 0.1, leadTimeDays: 3, supplier: 'SonicWave Precision' },

      // Aisle C - Industrial Hardware & Power Supplies (C-01 to C-20)
      { sku: 'SKU-HDW-201', name: 'DIN-Rail Power Supply 24V 10A 240W', category: 'Hardware', location: 'C-03', zone: 'C', aisle: 'C', shelf: '03', x: 63, y: 20, availableQty: 35, reservedQty: 12, damagedQty: 0, reorderLevel: 30, safetyStock: 15, incomingQty: 50, demandRate: 7.0, unitPrice: 85.00, weightKg: 1.3, leadTimeDays: 4, supplier: 'MeanWell Distributor' },
      { sku: 'SKU-HDW-202', name: 'Heavy Duty Anodized T-Slot Rail 2m', category: 'Hardware', location: 'C-07', zone: 'C', aisle: 'C', shelf: '07', x: 63, y: 36, availableQty: 55, reservedQty: 18, damagedQty: 2, reorderLevel: 40, safetyStock: 20, incomingQty: 60, demandRate: 9.0, unitPrice: 42.00, weightKg: 3.8, leadTimeDays: 5, supplier: 'AluFrame Extrusions' },
      { sku: 'SKU-HDW-203', name: 'Linear Bearing Slide Block MGN12H', category: 'Hardware', location: 'C-11', zone: 'C', aisle: 'C', shelf: '11', x: 63, y: 52, availableQty: 140, reservedQty: 30, damagedQty: 0, reorderLevel: 80, safetyStock: 40, incomingQty: 150, demandRate: 22.0, unitPrice: 19.50, weightKg: 0.25, leadTimeDays: 4, supplier: 'Hiwin Precision' },
      { sku: 'SKU-HDW-204', name: 'Industrial Ethernet Switch 8-Port PoE+', category: 'Hardware', location: 'C-15', zone: 'C', aisle: 'C', shelf: '15', x: 63, y: 68, availableQty: 16, reservedQty: 5, damagedQty: 0, reorderLevel: 15, safetyStock: 8, incomingQty: 20, demandRate: 3.5, unitPrice: 210.00, weightKg: 1.5, leadTimeDays: 6, supplier: 'Moxa NetWorks' },
      { sku: 'SKU-HDW-205', name: 'High-Temp Silicone Gasket Kit (100pk)', category: 'Hardware', location: 'C-19', zone: 'C', aisle: 'C', shelf: '19', x: 63, y: 84, availableQty: 210, reservedQty: 25, damagedQty: 0, reorderLevel: 100, safetyStock: 50, incomingQty: 250, demandRate: 35.0, unitPrice: 14.00, weightKg: 0.5, leadTimeDays: 3, supplier: 'SealTech Mfg' },

      // Aisle D - Medical & Precision Tools (D-01 to D-20)
      { sku: 'SKU-MED-801', name: 'Precision Digital Caliper Pro 0.001mm', category: 'Tools', location: 'D-02', zone: 'D', aisle: 'D', shelf: '02', x: 87, y: 16, availableQty: 28, reservedQty: 8, damagedQty: 0, reorderLevel: 25, safetyStock: 12, incomingQty: 40, demandRate: 5.5, unitPrice: 115.00, weightKg: 0.4, leadTimeDays: 4, supplier: 'Mitutoyo Partner' },
      { sku: 'SKU-MED-802', name: 'Sterile Surgical Tray Stainless Grade 316', category: 'Medical', location: 'D-06', zone: 'D', aisle: 'D', shelf: '06', x: 87, y: 32, availableQty: 45, reservedQty: 10, damagedQty: 0, reorderLevel: 30, safetyStock: 15, incomingQty: 60, demandRate: 8.0, unitPrice: 68.00, weightKg: 0.9, leadTimeDays: 5, supplier: 'MedSteel Global' },
      { sku: 'SKU-MED-803', name: 'Peristaltic Metering Dispenser Pump', category: 'Medical', location: 'D-10', zone: 'D', aisle: 'D', shelf: '10', x: 87, y: 48, availableQty: 9, reservedQty: 4, damagedQty: 0, reorderLevel: 12, safetyStock: 6, incomingQty: 15, demandRate: 2.2, unitPrice: 475.00, weightKg: 2.3, leadTimeDays: 7, supplier: 'Cole-Parmer Sub' },
      { sku: 'SKU-MED-804', name: 'HEPA Cleanroom Filter Cartridge H14', category: 'Medical', location: 'D-14', zone: 'D', aisle: 'D', shelf: '14', x: 87, y: 64, availableQty: 24, reservedQty: 6, damagedQty: 1, reorderLevel: 20, safetyStock: 10, incomingQty: 30, demandRate: 4.0, unitPrice: 145.00, weightKg: 1.7, leadTimeDays: 5, supplier: 'Camfil CleanAir' },
      { sku: 'SKU-MED-805', name: 'Digital Torque Wrench 0.5-20Nm ISO', category: 'Tools', location: 'D-18', zone: 'D', aisle: 'D', shelf: '18', x: 87, y: 80, availableQty: 15, reservedQty: 3, damagedQty: 0, reorderLevel: 15, safetyStock: 8, incomingQty: 20, demandRate: 2.8, unitPrice: 260.00, weightKg: 1.0, leadTimeDays: 6, supplier: 'Stahlwille Corp' }
    ];

    // Build 55 full products by generating variations
    const allProducts: Product[] = [];
    baseProducts.forEach((bp, idx) => {
      // Main product
      const net = Math.max(0, bp.availableQty - bp.reservedQty);
      const days = net / Math.max(0.1, bp.demandRate);
      let status: any = 'HEALTHY';
      if (bp.availableQty === 0) status = 'OUT_OF_STOCK';
      else if (bp.availableQty <= bp.safetyStock / 2) status = 'CRITICAL';
      else if (bp.availableQty <= bp.safetyStock) status = 'LOW_STOCK';
      else if (bp.availableQty > bp.reorderLevel * 2.5) status = 'OVERSTOCK';

      allProducts.push({
        ...bp,
        status,
        predictedDaysToStockout: Math.round(days * 10) / 10
      });

      // Secondary variations to get 50+ total SKUs
      const skuSuffix = `${idx + 10}`;
      const varAisle = idx % 4 === 0 ? 'A' : idx % 4 === 1 ? 'B' : idx % 4 === 2 ? 'C' : 'D';
      const varShelf = String((idx * 3) % 20 + 1).padStart(2, '0');
      const varX = varAisle === 'A' ? 15 : varAisle === 'B' ? 39 : varAisle === 'C' ? 63 : 87;
      const varY = 10 + (parseInt(varShelf) * 4.2);
      const varAvail = (idx * 7) % 65;
      const varRes = Math.min(varAvail, Math.floor(varAvail * 0.3));
      const varDays = (varAvail - varRes) / Math.max(1, (idx % 6) + 2);

      let varStatus: any = 'HEALTHY';
      if (varAvail === 0) varStatus = 'OUT_OF_STOCK';
      else if (varAvail <= 5) varStatus = 'CRITICAL';
      else if (varAvail <= 15) varStatus = 'LOW_STOCK';

      allProducts.push({
        sku: `SKU-${bp.category.toUpperCase().slice(0, 3)}-${200 + idx}`,
        name: `${bp.name} (Rev-B Standard)`,
        category: bp.category,
        location: `${varAisle}-${varShelf}`,
        zone: varAisle,
        aisle: varAisle,
        shelf: varShelf,
        x: varX,
        y: Math.min(95, varY),
        availableQty: varAvail,
        reservedQty: varRes,
        damagedQty: idx % 8 === 0 ? 2 : 0,
        reorderLevel: 25,
        safetyStock: 12,
        incomingQty: idx % 3 === 0 ? 40 : 0,
        demandRate: Math.max(1.5, ((idx % 8) + 1) * 2.2),
        unitPrice: Math.round(bp.unitPrice * 0.85),
        weightKg: bp.weightKg,
        leadTimeDays: bp.leadTimeDays,
        status: varStatus,
        predictedDaysToStockout: Math.round(varDays * 10) / 10,
        supplier: bp.supplier
      });
    });

    this.products = allProducts.slice(0, 52); // Exactly 52 rich products

    // 4. Packing Stations (6 active stations)
    this.packingStations = [
      { id: '01', name: 'Packing Station 01', workerName: 'Priya Patel', status: 'BUSY', currentOrderId: 'ORD-1011', currentOrderNumber: 'ORD-1011', waitingOrders: [{ orderId: 'ORD-1014', orderNumber: 'ORD-1014', priority: 'HIGH', itemsCount: 3 }], avgPackingTimeMin: 3.2, utilizationPercent: 88, itemsPackedToday: 142, isOverloaded: false },
      { id: '02', name: 'Packing Station 02', workerName: 'Aiden Brooks', status: 'AVAILABLE', waitingOrders: [], avgPackingTimeMin: 2.9, utilizationPercent: 65, itemsPackedToday: 118, isOverloaded: false },
      { id: '03', name: 'Packing Station 03', workerName: 'Samantha Ray', status: 'DELAYED', currentOrderId: 'ORD-1018', currentOrderNumber: 'ORD-1018', waitingOrders: [{ orderId: 'ORD-1022', orderNumber: 'ORD-1022', priority: 'CRITICAL', itemsCount: 6 }, { orderId: 'ORD-1025', orderNumber: 'ORD-1025', priority: 'HIGH', itemsCount: 4 }, { orderId: 'ORD-1029', orderNumber: 'ORD-1029', priority: 'MEDIUM', itemsCount: 2 }, { orderId: 'ORD-1033', orderNumber: 'ORD-1033', priority: 'LOW', itemsCount: 3 }], avgPackingTimeMin: 6.8, utilizationPercent: 98, itemsPackedToday: 84, isOverloaded: true },
      { id: '04', name: 'Packing Station 04', workerName: 'Tariq Johnson', status: 'BUSY', currentOrderId: 'ORD-1012', currentOrderNumber: 'ORD-1012', waitingOrders: [{ orderId: 'ORD-1015', orderNumber: 'ORD-1015', priority: 'MEDIUM', itemsCount: 2 }], avgPackingTimeMin: 3.5, utilizationPercent: 82, itemsPackedToday: 126, isOverloaded: false },
      { id: '05', name: 'Packing Station 05', workerName: 'Hannah Kim', status: 'AVAILABLE', waitingOrders: [], avgPackingTimeMin: 3.1, utilizationPercent: 55, itemsPackedToday: 98, isOverloaded: false },
      { id: '06', name: 'Packing Station 06 (Heavy Parcels)', workerName: 'Viktor Romanov', status: 'BUSY', currentOrderId: 'ORD-1019', currentOrderNumber: 'ORD-1019', waitingOrders: [{ orderId: 'ORD-1024', orderNumber: 'ORD-1024', priority: 'HIGH', itemsCount: 5 }], avgPackingTimeMin: 4.8, utilizationPercent: 78, itemsPackedToday: 72, isOverloaded: false }
    ];

    // 5. Generate 100+ Realistic Orders
    const customers = [
      { name: 'Apex Robotics Corp', tier: 'VIP' as const },
      { name: 'BioHealth Instruments', tier: 'ENTERPRISE' as const },
      { name: 'Nova Dynamics Ltd', tier: 'VIP' as const },
      { name: 'AeroGrid Aerospace', tier: 'VIP' as const },
      { name: 'Quantum Sensors LLC', tier: 'ENTERPRISE' as const },
      { name: 'Global Automation Pro', tier: 'ENTERPRISE' as const },
      { name: 'Metro Medical Hub', tier: 'VIP' as const },
      { name: 'NextGen EV Systems', tier: 'VIP' as const },
      { name: 'Pacific Tech Logistics', tier: 'STANDARD' as const },
      { name: 'Summit Industrial Supplies', tier: 'STANDARD' as const },
      { name: 'Zenith Labs Europe', tier: 'ENTERPRISE' as const },
      { name: 'Horizon Hardware Depot', tier: 'STANDARD' as const }
    ];

    const productsMap = new Map(this.products.map(p => [p.sku, p]));
    const ordersList: Order[] = [];
    const now = new Date();

    // Specific Highlighted Orders for Hackathon & Demo Scenario:
    // ORD-1001: The Critical order competing for Optical LiDAR Sensors (SKU-ELEC-102)
    const ord1001Items = [
      { id: 'ITM-01', sku: 'SKU-ELEC-102', productName: 'Industrial Optical LiDAR Sensor', category: 'Electronics', requestedQty: 10, allocatedQty: 7, pickedQty: 0, packedQty: 0, location: 'A-05', unitPrice: 420, weightKg: 1.2, availableStock: 7 },
      { id: 'ITM-02', sku: 'SKU-ROB-404', productName: 'Servo Motor High Torque 24V 4.5Nm', category: 'Robotics', requestedQty: 4, allocatedQty: 4, pickedQty: 0, packedQty: 0, location: 'B-10', unitPrice: 160, weightKg: 1.4, availableStock: 4 }
    ];
    const ord1001Prio = calculateOrderPriority({
      items: ord1001Items,
      expectedDelivery: new Date(now.getTime() + 4 * 3600000).toISOString(),
      customerTier: 'VIP',
      totalValue: 4840,
      orderDate: new Date(now.getTime() - 2 * 3600000).toISOString(),
      isDelayed: true,
      delayMinutes: 35
    }, productsMap);

    ordersList.push({
      id: 'ORD-1001',
      orderNumber: 'ORD-1001',
      customer: 'Apex Robotics Corp',
      customerTier: 'VIP',
      orderDate: new Date(now.getTime() - 2 * 3600000).toISOString(),
      expectedDelivery: new Date(now.getTime() + 4 * 3600000).toISOString(),
      items: ord1001Items,
      totalQty: 14,
      totalValue: 4840,
      priority: ord1001Prio.priority,
      priorityScore: ord1001Prio.priorityScore,
      priorityBreakdown: ord1001Prio.breakdown,
      status: 'ALLOCATED',
      allocationStatus: 'PARTIAL',
      pickingStatus: 'NOT_STARTED',
      packingStatus: 'QUEUED',
      qcStatus: 'PENDING',
      dispatchStatus: 'WAITING_CARRIER',
      riskLevel: 'CRITICAL',
      carrier: 'DHL Express Overnight',
      isDelayed: true,
      delayMinutes: 35,
      auditTrail: [
        { id: 'AUD-01', timestamp: new Date(now.getTime() - 120 * 60000).toISOString(), actor: 'System Core', role: 'AUTOMATION', action: 'Order Created', details: 'Imported from ERP EDI stream with 2 line items', stage: 'CREATION' },
        { id: 'AUD-02', timestamp: new Date(now.getTime() - 110 * 60000).toISOString(), actor: 'Decision Engine', role: 'AI_SYSTEM', action: 'Priority Evaluated', details: 'Assigned CRITICAL priority (Score: 92/100) due to 4h delivery window & VIP account', stage: 'PRIORITIZATION' },
        { id: 'AUD-03', timestamp: new Date(now.getTime() - 105 * 60000).toISOString(), actor: 'Smart Allocation', role: 'AI_SYSTEM', action: 'Partial Inventory Allocated', details: 'Allocated 7 of 10 available LiDAR sensors; auto-created backorder request for 3 remaining units', stage: 'ALLOCATION' }
      ]
    });

    // ORD-1002: Competing Lower Priority Order for the same LiDAR sensor
    const ord1002Items = [
      { id: 'ITM-03', sku: 'SKU-ELEC-102', productName: 'Industrial Optical LiDAR Sensor', category: 'Electronics', requestedQty: 5, allocatedQty: 0, pickedQty: 0, packedQty: 0, location: 'A-05', unitPrice: 420, weightKg: 1.2, availableStock: 7 },
      { id: 'ITM-04', sku: 'SKU-HDW-201', productName: 'DIN-Rail Power Supply 24V 10A 240W', category: 'Hardware', requestedQty: 2, allocatedQty: 2, pickedQty: 0, packedQty: 0, location: 'C-03', unitPrice: 85, weightKg: 1.3, availableStock: 35 }
    ];
    const ord1002Prio = calculateOrderPriority({
      items: ord1002Items,
      expectedDelivery: new Date(now.getTime() + 28 * 3600000).toISOString(),
      customerTier: 'STANDARD',
      totalValue: 2270,
      orderDate: new Date(now.getTime() - 1 * 3600000).toISOString()
    }, productsMap);

    ordersList.push({
      id: 'ORD-1002',
      orderNumber: 'ORD-1002',
      customer: 'Pacific Tech Logistics',
      customerTier: 'STANDARD',
      orderDate: new Date(now.getTime() - 1 * 3600000).toISOString(),
      expectedDelivery: new Date(now.getTime() + 28 * 3600000).toISOString(),
      items: ord1002Items,
      totalQty: 7,
      totalValue: 2270,
      priority: 'MEDIUM',
      priorityScore: 48,
      priorityBreakdown: ord1002Prio.breakdown,
      status: 'PENDING',
      allocationStatus: 'CONFLICT',
      pickingStatus: 'NOT_STARTED',
      packingStatus: 'QUEUED',
      qcStatus: 'PENDING',
      dispatchStatus: 'WAITING_CARRIER',
      riskLevel: 'MEDIUM',
      carrier: 'FedEx Ground',
      isDelayed: false,
      delayMinutes: 0,
      auditTrail: [
        { id: 'AUD-04', timestamp: new Date(now.getTime() - 60 * 60000).toISOString(), actor: 'System Core', role: 'AUTOMATION', action: 'Order Created', details: 'Standard web order placed', stage: 'CREATION' },
        { id: 'AUD-05', timestamp: new Date(now.getTime() - 55 * 60000).toISOString(), actor: 'Smart Allocation', role: 'AI_SYSTEM', action: 'Allocation Held in Conflict Queue', details: 'SKU-ELEC-102 contested by Critical order #ORD-1001. Awaiting inbound PO or manager override.', stage: 'ALLOCATION' }
      ]
    });

    // ORD-1042: The delayed picking & routing order
    const ord1042Items = [
      { id: 'ITM-05', sku: 'SKU-ELEC-101', productName: 'Smart IoT Gateway Pro 5G', category: 'Electronics', requestedQty: 3, allocatedQty: 3, pickedQty: 3, packedQty: 0, location: 'A-01', unitPrice: 185, weightKg: 0.6, availableStock: 18 },
      { id: 'ITM-06', sku: 'SKU-ELEC-102', productName: 'Industrial Optical LiDAR Sensor', category: 'Electronics', requestedQty: 2, allocatedQty: 2, pickedQty: 2, packedQty: 0, location: 'A-05', unitPrice: 420, weightKg: 1.2, availableStock: 7 },
      { id: 'ITM-07', sku: 'SKU-ROB-401', productName: 'Brushless Actuator Arm 12V 50W', category: 'Robotics', requestedQty: 2, allocatedQty: 2, pickedQty: 2, packedQty: 0, location: 'B-02', unitPrice: 240, weightKg: 2.1, availableStock: 14 },
      { id: 'ITM-08', sku: 'SKU-ROB-404', productName: 'Servo Motor High Torque 24V 4.5Nm', category: 'Robotics', requestedQty: 1, allocatedQty: 1, pickedQty: 1, packedQty: 0, location: 'B-10', unitPrice: 160, weightKg: 1.4, availableStock: 4 },
      { id: 'ITM-09', sku: 'SKU-HDW-201', productName: 'DIN-Rail Power Supply 24V 10A 240W', category: 'Hardware', requestedQty: 4, allocatedQty: 4, pickedQty: 4, packedQty: 0, location: 'C-03', unitPrice: 85, weightKg: 1.3, availableStock: 35 }
    ];
    ordersList.push({
      id: 'ORD-1042',
      orderNumber: 'ORD-1042',
      customer: 'NextGen EV Systems',
      customerTier: 'VIP',
      orderDate: new Date(now.getTime() - 4 * 3600000).toISOString(),
      expectedDelivery: new Date(now.getTime() + 3.5 * 3600000).toISOString(),
      items: ord1042Items,
      totalQty: 12,
      totalValue: 2575,
      priority: 'CRITICAL',
      priorityScore: 94,
      priorityBreakdown: {
        score: 94,
        urgency: 25,
        deliveryRisk: 25,
        customerImpact: 20,
        inventoryAvailability: 15,
        orderAge: 6,
        businessImportance: 3,
        reasons: [
          'Delivery deadline is in 3.5 hours (VIP SLA cutoff)',
          'Customer order contains 5 high-demand automation items',
          'Order has sufficient inventory allocated',
          'Current fulfillment delay is 28 minutes',
          'Multi-aisle pick path optimized (Saved 2.4 min travel)'
        ]
      },
      status: 'PACKING',
      allocationStatus: 'FULL',
      pickingStatus: 'COMPLETED',
      packingStatus: 'IN_PACKING',
      qcStatus: 'PENDING',
      dispatchStatus: 'WAITING_CARRIER',
      riskLevel: 'CRITICAL',
      carrier: 'FedEx Priority Overnight',
      assignedPickerId: 'USR-03',
      assignedPickerName: 'Rahul Sharma',
      assignedPackingStationId: '01',
      isDelayed: true,
      delayMinutes: 28,
      auditTrail: [
        { id: 'AUD-10', timestamp: new Date(now.getTime() - 240 * 60000).toISOString(), actor: 'ERP Connector', role: 'SYSTEM', action: 'Order Created', details: 'Created via automated REST API', stage: 'CREATION' },
        { id: 'AUD-11', timestamp: new Date(now.getTime() - 230 * 60000).toISOString(), actor: 'Smart Routing', role: 'AI_SYSTEM', action: 'S-Shape Pick Route Calculated', details: 'Waypoints: A-01 -> A-05 -> B-02 -> B-10 -> C-03 (124 meters, saved 2 min)', stage: 'PICKING' },
        { id: 'AUD-12', timestamp: new Date(now.getTime() - 30 * 60000).toISOString(), actor: 'Rahul Sharma', role: 'PICKER', action: 'Picking Completed', details: '100% item count verified with 0 damages', stage: 'PICKING' },
        { id: 'AUD-13', timestamp: new Date(now.getTime() - 10 * 60000).toISOString(), actor: 'Priya Patel', role: 'PACKING_STAFF', action: 'Packing Commenced', details: 'Transferred to Station 01 box conveyor', stage: 'PACKING' }
      ]
    });

    // ORD-1054: The Missing Item Exception Order
    const ord1054Items = [
      { id: 'ITM-10', sku: 'SKU-ELEC-105', productName: 'Industrial RFID Handheld Scanner', category: 'Electronics', requestedQty: 2, allocatedQty: 0, pickedQty: 0, packedQty: 0, location: 'A-15', unitPrice: 380, weightKg: 0.8, availableStock: 0 },
      { id: 'ITM-11', sku: 'SKU-MED-801', productName: 'Precision Digital Caliper Pro 0.001mm', category: 'Tools', requestedQty: 3, allocatedQty: 3, pickedQty: 3, packedQty: 0, location: 'D-02', unitPrice: 115, weightKg: 0.4, availableStock: 28 }
    ];
    ordersList.push({
      id: 'ORD-1054',
      orderNumber: 'ORD-1054',
      customer: 'AeroGrid Aerospace',
      customerTier: 'VIP',
      orderDate: new Date(now.getTime() - 6 * 3600000).toISOString(),
      expectedDelivery: new Date(now.getTime() + 6 * 3600000).toISOString(),
      items: ord1054Items,
      totalQty: 5,
      totalValue: 1105,
      priority: 'HIGH',
      priorityScore: 78,
      priorityBreakdown: {
        score: 78,
        urgency: 20,
        deliveryRisk: 22,
        customerImpact: 20,
        inventoryAvailability: 6,
        orderAge: 7,
        businessImportance: 3,
        reasons: ['Missing 2 units of SKU-ELEC-105 reported during picking', 'Alternative SKU available']
      },
      status: 'QC_CHECK',
      allocationStatus: 'PARTIAL',
      pickingStatus: 'EXCEPTION',
      packingStatus: 'QUEUED',
      qcStatus: 'FAILED',
      dispatchStatus: 'WAITING_CARRIER',
      riskLevel: 'HIGH',
      carrier: 'UPS Air Express',
      isDelayed: true,
      delayMinutes: 45,
      auditTrail: [
        { id: 'AUD-20', timestamp: new Date(now.getTime() - 360 * 60000).toISOString(), actor: 'System Core', role: 'SYSTEM', action: 'Order Created', details: 'VIP Purchase order entered', stage: 'CREATION' },
        { id: 'AUD-21', timestamp: new Date(now.getTime() - 60 * 60000).toISOString(), actor: 'Carlos Mendez', role: 'PICKER', action: 'Short Pick Exception Logged', details: 'Location A-15 physical bin empty for SKU-ELEC-105 (Missing 2 units)', stage: 'PICKING' }
      ]
    });

    // Populate remaining 98 realistic orders spanning all stages
    const statuses: Array<{ status: any; alloc: any; pick: any; pack: any; qc: any; disp: any }> = [
      { status: 'PENDING', alloc: 'UNALLOCATED', pick: 'NOT_STARTED', pack: 'QUEUED', qc: 'PENDING', disp: 'WAITING_CARRIER' },
      { status: 'ALLOCATED', alloc: 'FULL', pick: 'NOT_STARTED', pack: 'QUEUED', qc: 'PENDING', disp: 'WAITING_CARRIER' },
      { status: 'PICKING', alloc: 'FULL', pick: 'IN_PROGRESS', pack: 'QUEUED', qc: 'PENDING', disp: 'WAITING_CARRIER' },
      { status: 'PACKING', alloc: 'FULL', pick: 'COMPLETED', pack: 'IN_PACKING', qc: 'PENDING', disp: 'WAITING_CARRIER' },
      { status: 'QC_CHECK', alloc: 'FULL', pick: 'COMPLETED', pack: 'PACKED', qc: 'PENDING', disp: 'WAITING_CARRIER' },
      { status: 'DISPATCH_READY', alloc: 'FULL', pick: 'COMPLETED', pack: 'PACKED', qc: 'PASSED', disp: 'MANIFESTED' },
      { status: 'DISPATCHED', alloc: 'FULL', pick: 'COMPLETED', pack: 'PACKED', qc: 'PASSED', disp: 'DISPATCHED' },
      { status: 'DELIVERED', alloc: 'FULL', pick: 'COMPLETED', pack: 'PACKED', qc: 'PASSED', disp: 'DELIVERED' }
    ];

    for (let i = 5; i <= 102; i++) {
      const orderNum = `ORD-${1000 + i}`;
      const cust = customers[i % customers.length];
      const stageObj = statuses[i % statuses.length];
      const itemsCount = (i % 4) + 1;
      
      const orderItems: any[] = [];
      let orderVal = 0;
      let totalQ = 0;

      for (let j = 0; j < itemsCount; j++) {
        const prod = this.products[(i * 3 + j) % this.products.length];
        const reqQ = ((i + j) % 5) + 1;
        totalQ += reqQ;
        const lineVal = reqQ * prod.unitPrice;
        orderVal += lineVal;
        
        const allocQ = stageObj.alloc === 'FULL' ? reqQ : (stageObj.alloc === 'PARTIAL' ? Math.max(1, reqQ - 1) : 0);
        const pickQ = (stageObj.pick === 'COMPLETED' || stageObj.status === 'DISPATCHED' || stageObj.status === 'DELIVERED') ? allocQ : 0;
        const packQ = (stageObj.pack === 'PACKED' || stageObj.status === 'DISPATCHED' || stageObj.status === 'DELIVERED') ? pickQ : 0;

        orderItems.push({
          id: `ITM-${i}-${j}`,
          sku: prod.sku,
          productName: prod.name,
          category: prod.category,
          requestedQty: reqQ,
          allocatedQty: allocQ,
          pickedQty: pickQ,
          packedQty: packQ,
          location: prod.location,
          unitPrice: prod.unitPrice,
          weightKg: prod.weightKg,
          availableStock: prod.availableQty
        });
      }

      const hoursOffset = (i % 48) - 12; // -12h to +36h
      const expectedDel = new Date(now.getTime() + hoursOffset * 3600000).toISOString();
      const isDel = hoursOffset < 2 && stageObj.status !== 'DISPATCHED' && stageObj.status !== 'DELIVERED';
      const delayMin = isDel ? (Math.abs(hoursOffset) + 1) * 35 : 0;

      const prioResult = calculateOrderPriority({
        items: orderItems,
        expectedDelivery: expectedDel,
        customerTier: cust.tier,
        totalValue: orderVal,
        orderDate: new Date(now.getTime() - (i * 2 + 10) * 3600000).toISOString(),
        isDelayed: isDel,
        delayMinutes: delayMin
      }, productsMap);

      ordersList.push({
        id: orderNum,
        orderNumber: orderNum,
        customer: cust.name,
        customerTier: cust.tier,
        orderDate: new Date(now.getTime() - (i * 2 + 10) * 3600000).toISOString(),
        expectedDelivery: expectedDel,
        items: orderItems,
        totalQty: totalQ,
        totalValue: Math.round(orderVal),
        priority: prioResult.priority,
        priorityScore: prioResult.priorityScore,
        priorityBreakdown: prioResult.breakdown,
        status: stageObj.status,
        allocationStatus: stageObj.alloc,
        pickingStatus: stageObj.pick,
        packingStatus: stageObj.pack,
        qcStatus: stageObj.qc,
        dispatchStatus: stageObj.disp,
        riskLevel: prioResult.priority === 'CRITICAL' ? 'CRITICAL' : (prioResult.priority === 'HIGH' ? 'HIGH' : 'LOW'),
        carrier: i % 3 === 0 ? 'FedEx Priority Overnight' : (i % 3 === 1 ? 'DHL Express' : 'UPS Air Freight'),
        trackingNumber: `TRK-${90000000 + i}`,
        assignedPickerId: i % 2 === 0 ? 'USR-03' : 'USR-07',
        assignedPickerName: i % 2 === 0 ? 'Rahul Sharma' : 'Priya Patel',
        assignedPackingStationId: String((i % 6) + 1).padStart(2, '0'),
        isDelayed: isDel,
        delayMinutes: delayMin,
        auditTrail: [
          { id: `AUD-${i}-1`, timestamp: new Date(now.getTime() - 500 * 60000).toISOString(), actor: 'System Core', role: 'SYSTEM', action: 'Order Created', details: 'Order ingested via EDI protocol', stage: 'CREATION' },
          { id: `AUD-${i}-2`, timestamp: new Date(now.getTime() - 400 * 60000).toISOString(), actor: 'Decision Engine', role: 'AI_SYSTEM', action: `Status Updated to ${stageObj.status}`, details: `Priority score evaluated at ${prioResult.priorityScore}/100`, stage: stageObj.status }
        ]
      });
    }

    this.orders = ordersList;

    // 6. Picking Tasks
    const activePickOrders = this.orders.filter(o => o.status === 'PICKING' || o.status === 'ALLOCATED' || o.id === 'ORD-1042').slice(0, 8);
    this.pickingTasks = activePickOrders.map((ord, idx) => {
      const routeData = optimizePickRoute(ord.items.map(it => ({
        sku: it.sku,
        productName: it.productName,
        location: it.location,
        quantity: it.requestedQty
      })));

      return {
        id: `TASK-PK-${1020 + idx}`,
        orderId: ord.id,
        orderNumber: ord.orderNumber,
        pickerId: idx % 2 === 0 ? 'USR-03' : 'USR-07',
        pickerName: idx % 2 === 0 ? 'Rahul Sharma' : 'Priya Patel',
        priority: ord.priority,
        status: ord.status === 'PICKING' ? 'IN_PROGRESS' : (ord.isDelayed ? 'DELAYED' : 'PENDING'),
        items: ord.items.map(it => ({
          sku: it.sku,
          productName: it.productName,
          location: it.location,
          x: 20 + (idx * 8),
          y: 20 + (idx * 7),
          quantity: it.requestedQty,
          pickedQty: ord.status === 'PICKING' ? Math.max(0, it.requestedQty - 1) : 0,
          status: 'PENDING'
        })),
        startTime: new Date(now.getTime() - 25 * 60000).toISOString(),
        expectedCompletion: new Date(now.getTime() + 15 * 60000).toISOString(),
        optimizedRoute: routeData.optimizedRoute,
        estimatedDistanceMeters: routeData.estimatedDistanceMeters,
        estimatedTimeMin: routeData.estimatedTimeMin,
        timeSavedMin: routeData.timeSavedMin
      };
    });

    // 7. Quality Checks
    this.qualityChecks = [
      {
        id: 'QC-901',
        orderId: 'ORD-1042',
        orderNumber: 'ORD-1042',
        inspectorName: 'Elena Rostova',
        timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
        checks: {
          correctSku: true,
          correctQty: true,
          damagedItem: false,
          missingItem: false,
          packagingCondition: true,
          orderLabel: true,
          addressValidation: true,
          documentation: true
        },
        result: 'PASS',
        notes: 'All 5 line items verified against packing slip with clean barcode scans.'
      },
      {
        id: 'QC-902',
        orderId: 'ORD-1054',
        orderNumber: 'ORD-1054',
        inspectorName: 'Elena Rostova',
        timestamp: new Date(now.getTime() - 40 * 60000).toISOString(),
        checks: {
          correctSku: true,
          correctQty: false,
          damagedItem: false,
          missingItem: true,
          packagingCondition: true,
          orderLabel: true,
          addressValidation: true,
          documentation: true
        },
        result: 'FAIL',
        notes: 'Missing 2 units of SKU-ELEC-105 (Industrial RFID Scanner). Exception logged.',
        exceptionCreated: true
      }
    ];

    // 8. Dispatches
    const dispatchOrders = this.orders.filter(o => o.status === 'DISPATCHED' || o.status === 'DISPATCH_READY').slice(0, 14);
    this.dispatches = dispatchOrders.map((ord, idx) => ({
      id: `DISP-${8000 + idx}`,
      orderId: ord.id,
      orderNumber: ord.orderNumber,
      customerName: ord.customer,
      carrier: ord.carrier || 'DHL Express',
      trackingNumber: ord.trackingNumber || `TRK-8899${idx}`,
      readyTime: new Date(now.getTime() - (idx + 1) * 30 * 60000).toISOString(),
      scheduledDispatchTime: new Date(now.getTime() + (idx * 20) * 60000).toISOString(),
      actualDispatchTime: ord.status === 'DISPATCHED' ? new Date(now.getTime() - (idx * 10) * 60000).toISOString() : undefined,
      status: ord.status === 'DISPATCHED' ? 'DISPATCHED' : (ord.isDelayed ? 'DELAYED' : 'READY'),
      delayMinutes: ord.delayMinutes,
      destinationCity: idx % 3 === 0 ? 'San Francisco, CA' : (idx % 3 === 1 ? 'Austin, TX' : 'Chicago, IL'),
      packageWeightKg: Math.round(ord.items.reduce((acc, it) => acc + (it.weightKg * it.requestedQty), 0) * 10) / 10,
      boxesCount: Math.max(1, Math.ceil(ord.totalQty / 4))
    }));

    // 9. Exceptions (Problem -> Decision -> Resolution)
    this.exceptions = [
      {
        id: 'EXC-1054',
        orderId: 'ORD-1054',
        orderNumber: 'ORD-1054',
        type: 'MISSING_ITEM',
        severity: 'CRITICAL',
        status: 'OPEN',
        reportedBy: 'Carlos Mendez (Picker)',
        reportedAt: new Date(now.getTime() - 55 * 60000).toISOString(),
        location: 'A-15',
        sku: 'SKU-ELEC-105',
        details: 'Missing 2 units of Industrial RFID Handheld Scanner at bin location A-15 during picking cycle.',
        analysis: {
          availableStock: 0,
          alternativeSkuAvailable: true,
          altSku: 'SKU-ELEC-104',
          impactSummary: 'Order is VIP SLA; postponing will cause 24h delivery breach.'
        },
        recommendation: {
          title: 'Split & Ship Available / Auto-Backorder Shortage',
          steps: [
            'Do not hold entire order.',
            'Ship 3 units of available Precision Calipers immediately.',
            'Create urgent supplier PO / backorder for 2 missing RFID scanners.',
            'Trigger automated customer dispatch notification.'
          ],
          expectedOutcome: 'Maintains 94% on-time delivery metric and prevents full order cancellation.'
        }
      },
      {
        id: 'EXC-1088',
        orderId: 'ORD-1088',
        orderNumber: 'ORD-1088',
        type: 'DAMAGED_ITEM',
        severity: 'HIGH',
        status: 'OPEN',
        reportedBy: 'Rahul Sharma (Picker)',
        reportedAt: new Date(now.getTime() - 28 * 60000).toISOString(),
        location: 'A-05',
        sku: 'SKU-ELEC-102',
        details: 'Outer lens casing cracked on 1 unit of Optical LiDAR Sensor during retrieval.',
        analysis: {
          availableStock: 6,
          alternativeSkuAvailable: false,
          impactSummary: 'Immediate replacement unit exists in backup bin A-06.'
        },
        recommendation: {
          title: 'Swap Damaged Unit from Backup Stock & Quarantine',
          steps: [
            'Move damaged unit to QA Quarantine Zone Q-02.',
            'Allocate replacement LiDAR unit from A-06.',
            'Re-verify QC barcode scan.'
          ],
          expectedOutcome: 'Order recovers schedule within 10 minutes.'
        }
      },
      {
        id: 'EXC-1033',
        orderId: 'ORD-1033',
        orderNumber: 'ORD-1033',
        type: 'PACKING_ERROR',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        reportedBy: 'Elena Rostova (QC)',
        reportedAt: new Date(now.getTime() - 90 * 60000).toISOString(),
        location: 'Station 03',
        details: 'Incorrect packaging box size used for sensitive surgical trays.',
        analysis: {
          availableStock: 45,
          alternativeSkuAvailable: false,
          impactSummary: 'Resolved with heavy foam insert box repack.'
        },
        recommendation: {
          title: 'Repack in Double-Walled Insulated Carton',
          steps: ['Repack with foam cushioning', 'Re-issue shipping label'],
          expectedOutcome: 'Passed QC re-inspection.'
        },
        resolution: {
          actionTaken: 'Repacked in Grade-A insulated carton and cleared QC.',
          resolvedBy: 'Marcus Vance',
          resolvedAt: new Date(now.getTime() - 65 * 60000).toISOString()
        }
      }
    ];

    // 10. Smart Alerts
    this.alerts = [
      {
        id: 'ALT-01',
        title: 'Critical Delivery Deadline Risk',
        message: 'Order #ORD-1042 (NextGen EV Systems) has 3.5h remaining until SLA cutoff with 28m delay in packing.',
        severity: 'CRITICAL',
        source: 'Delivery Risk Engine',
        timestamp: new Date(now.getTime() - 10 * 60000).toISOString(),
        reason: 'Packing station queue bottleneck at Station 03.',
        recommendedAction: 'Reassign parcel to Packing Station 01 for priority throughput.',
        targetView: 'packing',
        targetId: '03',
        isRead: false,
        isDismissed: false
      },
      {
        id: 'ALT-02',
        title: 'Safety Stock Breach Warning',
        message: 'SKU-ELEC-102 (Optical LiDAR Sensor) available stock is down to 7 units with 15 units demanded.',
        severity: 'WARNING',
        source: 'Inventory Predictor',
        timestamp: new Date(now.getTime() - 25 * 60000).toISOString(),
        reason: 'Competing critical orders #ORD-1001 and #ORD-1002 depleted local reserve.',
        recommendedAction: 'Trigger emergency replenishment PO of 50 units with Nexus Tech.',
        targetView: 'allocation',
        targetId: 'SKU-ELEC-102',
        isRead: false,
        isDismissed: false
      },
      {
        id: 'ALT-03',
        title: 'Packing Station 03 Overloaded',
        message: 'Station 03 has 4 waiting orders and average packing cycle increased to 6.8 min (+42%).',
        severity: 'ATTENTION',
        source: 'Bottleneck Detector',
        timestamp: new Date(now.getTime() - 35 * 60000).toISOString(),
        reason: 'Concentration of multi-item heavy consignments assigned to single station.',
        recommendedAction: 'Move 2 orders to idle Station 02 and Station 05.',
        targetView: 'packing',
        targetId: '03',
        isRead: false,
        isDismissed: false
      },
      {
        id: 'ALT-04',
        title: 'Smart Allocation Recommendation',
        message: 'Allocating 7 units of LiDAR sensors to ORD-1001 saves VIP SLA while minimizing net warehouse delay.',
        severity: 'AI_INSIGHT',
        source: 'Allocation Copilot',
        timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
        reason: 'ORD-1001 delivery deadline is closer and penalty score is 92 vs 48.',
        recommendedAction: 'Execute Recommended Allocation button in Allocation Center.',
        targetView: 'allocation',
        targetId: 'CONF-SKU-ELEC-102',
        isRead: false,
        isDismissed: false
      }
    ];

    // 11. Initial Audit Logs
    this.auditLogs = [
      { id: 'LOG-01', timestamp: new Date(now.getTime() - 15 * 60000).toISOString(), actor: 'Decision Engine', role: 'AI_SYSTEM', action: 'PRIORITY_CALCULATED', details: 'Recalculated priority matrix for 102 orders across 4 shifts', stage: 'SYSTEM' },
      { id: 'LOG-02', timestamp: new Date(now.getTime() - 22 * 60000).toISOString(), actor: 'Rahul Sharma', role: 'PICKER', action: 'PICK_COMPLETED', details: 'Completed pick task TASK-PK-1020 in 4.1 min with 100% accuracy', stage: 'PICKING' },
      { id: 'LOG-03', timestamp: new Date(now.getTime() - 30 * 60000).toISOString(), actor: 'Marcus Vance', role: 'WAREHOUSE_MANAGER', action: 'REROUTE_STATION', details: 'Rebalanced 3 orders from Station 03 to Station 01', stage: 'PACKING' },
      { id: 'LOG-04', timestamp: new Date(now.getTime() - 45 * 60000).toISOString(), actor: 'Sarah Chen', role: 'INVENTORY_MANAGER', action: 'REORDER_TRIGGERED', details: 'Generated PO #PO-8812 for 100 units of Wireless Sensors', stage: 'INVENTORY' }
    ];
  }

  // Helper getters
  public getWarehouseHealth() {
    return calculateWarehouseHealth(
      this.orders,
      this.products,
      this.pickingTasks,
      this.packingStations,
      this.exceptions,
      this.dispatches
    );
  }

  public getAllocationConflicts() {
    return resolveInventoryConflicts(this.orders, this.products);
  }

  public getStockoutPredictions() {
    return generateStockoutPredictions(this.products);
  }

  public getBottlenecks() {
    return detectWarehouseBottlenecks(
      this.pickingTasks,
      this.packingStations,
      this.orders,
      this.exceptions
    );
  }

  public getKPIs() {
    const health = this.getWarehouseHealth();
    const active = this.orders.filter(o => o.status !== 'CANCELLED');
    const pending = active.filter(o => o.status === 'PENDING' || o.status === 'ALLOCATED');
    const urgent = active.filter(o => o.priority === 'CRITICAL' || o.priority === 'HIGH');
    const picking = active.filter(o => o.status === 'PICKING');
    const packed = active.filter(o => o.status === 'PACKING' || o.status === 'QC_CHECK' || o.status === 'DISPATCH_READY');
    const dispatched = active.filter(o => o.status === 'DISPATCHED' || o.status === 'DELIVERED');
    const lowStock = this.products.filter(p => p.status === 'LOW_STOCK' || p.status === 'CRITICAL');
    const outOfStock = this.products.filter(p => p.status === 'OUT_OF_STOCK');
    const delayed = active.filter(o => o.isDelayed || o.delayMinutes > 0);
    const openExceptions = this.exceptions.filter(e => e.status !== 'RESOLVED');

    return {
      totalOrders: this.orders.length,
      pendingOrders: pending.length,
      urgentOrders: urgent.length,
      ordersInPicking: picking.length,
      ordersPacked: packed.length,
      ordersDispatched: dispatched.length,
      lowStockItems: lowStock.length,
      outOfStockItems: outOfStock.length,
      delayedOrders: delayed.length,
      warehouseHealthScore: health.overallScore,
      openExceptionsCount: openExceptions.length
    };
  }

  // State mutations
  public addAuditLog(actor: string, role: string, action: string, details: string, stage: string) {
    const log: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor,
      role,
      action,
      details,
      stage
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
  }

  public executeAllocation(conflictId: string, orderAllocations: Record<string, number>, actorName = 'Marcus Vance') {
    for (const [orderId, qty] of Object.entries(orderAllocations)) {
      const order = this.orders.find(o => o.id === orderId);
      if (order) {
        order.items.forEach(item => {
          if (conflictId.includes(item.sku)) {
            item.allocatedQty = qty;
          }
        });
        const allAllocated = order.items.every(it => it.allocatedQty >= it.requestedQty);
        order.allocationStatus = allAllocated ? 'FULL' : (qty > 0 ? 'PARTIAL' : 'CONFLICT');
        if (order.status === 'PENDING') {
          order.status = 'ALLOCATED';
        }
        order.auditTrail.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: actorName,
          role: 'WAREHOUSE_MANAGER',
          action: 'Smart Allocation Executed',
          details: `Allocated ${qty} units via Decision Engine recommendation.`,
          stage: 'ALLOCATION'
        });
      }
    }

    this.addAuditLog(actorName, 'WAREHOUSE_MANAGER', 'ALLOCATION_EXECUTED', `Executed intelligent inventory distribution for conflict ${conflictId}`, 'ALLOCATION');
  }

  public completePickingTask(taskId: string, actorName = 'Rahul Sharma') {
    const task = this.pickingTasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'COMPLETED';
      task.actualCompletion = new Date().toISOString();
      const order = this.orders.find(o => o.id === task.orderId);
      if (order) {
        order.pickingStatus = 'COMPLETED';
        order.status = 'PACKING';
        order.packingStatus = 'IN_PACKING';
        order.auditTrail.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: actorName,
          role: 'PICKER',
          action: 'Picking Completed',
          details: `Completed picking all items across ${task.optimizedRoute.length} locations. Transferred to packing.`,
          stage: 'PICKING'
        });
      }
      this.addAuditLog(actorName, 'PICKER', 'PICKING_TASK_COMPLETED', `Completed picking for order ${task.orderNumber}`, 'PICKING');
    }
  }

  public completePacking(stationId: string, orderId: string, actorName = 'Priya Patel') {
    const station = this.packingStations.find(s => s.id === stationId);
    if (station) {
      station.status = 'AVAILABLE';
      station.currentOrderId = undefined;
      station.currentOrderNumber = undefined;
      station.itemsPackedToday += 1;
    }
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.packingStatus = 'PACKED';
      order.status = 'QC_CHECK';
      order.qcStatus = 'PENDING';
      order.auditTrail.unshift({
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: actorName,
        role: 'PACKING_STAFF',
        action: 'Packing Completed',
        details: `Parceled and verified packaging integrity. Forwarded to QC stage.`,
        stage: 'PACKING'
      });
    }
    this.addAuditLog(actorName, 'PACKING_STAFF', 'PACKING_COMPLETED', `Packed order ${orderId} at station ${stationId}`, 'PACKING');
  }

  public submitQualityCheck(qcData: Omit<QualityCheck, 'id' | 'timestamp'>, actorName = 'Elena Rostova') {
    const qc: QualityCheck = {
      ...qcData,
      id: `QC-${Date.now() % 10000}`,
      timestamp: new Date().toISOString()
    };
    this.qualityChecks.unshift(qc);

    const order = this.orders.find(o => o.id === qc.orderId);
    if (order) {
      order.qcStatus = qc.result === 'PASS' ? 'PASSED' : (qc.result === 'FAIL' ? 'FAILED' : 'PARTIAL');
      if (qc.result === 'PASS') {
        order.status = 'DISPATCH_READY';
        order.dispatchStatus = 'MANIFESTED';
      } else {
        order.status = 'ON_HOLD';
        // Auto-create exception
        const exc: WarehouseException = {
          id: `EXC-${Date.now() % 10000}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: 'QUALITY_FAILURE',
          severity: 'HIGH',
          status: 'OPEN',
          reportedBy: actorName,
          reportedAt: new Date().toISOString(),
          details: `QC Failed: ${qc.notes || 'Inspection criteria not met'}`,
          analysis: {
            availableStock: 5,
            alternativeSkuAvailable: false,
            impactSummary: 'Order quarantined pending rework or re-picking.'
          },
          recommendation: {
            title: 'Repack / Replace Defective Units',
            steps: ['Return damaged unit to QA bin', 'Re-issue pick ticket for replacement'],
            expectedOutcome: 'Order recertified within 20 minutes.'
          }
        };
        this.exceptions.unshift(exc);
      }

      order.auditTrail.unshift({
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: actorName,
        role: 'QC_INSPECTOR',
        action: `Quality Check ${qc.result}`,
        details: qc.notes,
        stage: 'QC'
      });
    }

    this.addAuditLog(actorName, 'QC_INSPECTOR', `QC_${qc.result}`, `Inspected order ${qc.orderNumber}: ${qc.result}`, 'QC');
    return qc;
  }

  public dispatchOrder(orderId: string, carrier: string, trackingNumber: string, actorName = 'David Miller') {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'DISPATCHED';
      order.dispatchStatus = 'DISPATCHED';
      order.carrier = carrier;
      order.trackingNumber = trackingNumber;

      const record: DispatchRecord = {
        id: `DISP-${Date.now() % 10000}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer,
        carrier,
        trackingNumber,
        readyTime: new Date(Date.now() - 15 * 60000).toISOString(),
        scheduledDispatchTime: new Date().toISOString(),
        actualDispatchTime: new Date().toISOString(),
        status: 'DISPATCHED',
        delayMinutes: order.delayMinutes,
        destinationCity: 'Regional Distribution Center',
        packageWeightKg: Math.round(order.items.reduce((acc, it) => acc + (it.weightKg * it.requestedQty), 0) * 10) / 10,
        boxesCount: Math.max(1, Math.ceil(order.totalQty / 3))
      };
      this.dispatches.unshift(record);

      order.auditTrail.unshift({
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: actorName,
        role: 'DISPATCHER',
        action: 'Manifest Handed to Carrier',
        details: `Dispatched via ${carrier} (Tracking: ${trackingNumber})`,
        stage: 'DISPATCH'
      });

      this.addAuditLog(actorName, 'DISPATCHER', 'ORDER_DISPATCHED', `Dispatched order ${order.orderNumber} via ${carrier}`, 'DISPATCH');
    }
  }

  public resolveException(exceptionId: string, actionTaken: string, resolvedBy = 'Marcus Vance', createBackorder = false) {
    const exc = this.exceptions.find(e => e.id === exceptionId);
    if (exc) {
      exc.status = 'RESOLVED';
      exc.resolution = {
        actionTaken,
        resolvedBy,
        resolvedAt: new Date().toISOString(),
        backorderCreated: createBackorder
      };

      const order = this.orders.find(o => o.id === exc.orderId);
      if (order) {
        if (order.status === 'ON_HOLD' || order.qcStatus === 'FAILED') {
          order.status = 'DISPATCH_READY';
          order.qcStatus = 'PASSED';
          order.dispatchStatus = 'MANIFESTED';
        }
        order.auditTrail.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: resolvedBy,
          role: 'WAREHOUSE_MANAGER',
          action: 'Exception Resolved',
          details: actionTaken,
          stage: 'EXCEPTION_CENTER'
        });
      }

      this.addAuditLog(resolvedBy, 'WAREHOUSE_MANAGER', 'EXCEPTION_RESOLVED', `Resolved exception ${exceptionId}: ${actionTaken}`, 'EXCEPTIONS');
    }
  }

  public rebalancePackingStations() {
    const overloaded = this.packingStations.find(s => s.id === '03');
    const station01 = this.packingStations.find(s => s.id === '01');
    const station02 = this.packingStations.find(s => s.id === '02');
    const station05 = this.packingStations.find(s => s.id === '05');

    if (overloaded && overloaded.waitingOrders.length >= 2) {
      const moved1 = overloaded.waitingOrders.pop();
      const moved2 = overloaded.waitingOrders.pop();

      if (moved1 && station02) station02.waitingOrders.push(moved1);
      if (moved2 && station05) station05.waitingOrders.push(moved2);

      overloaded.isOverloaded = false;
      overloaded.status = 'BUSY';
      overloaded.avgPackingTimeMin = 3.8;

      this.addAuditLog('System Optimizer', 'AI_SYSTEM', 'PACKING_REBALANCED', 'Moved 2 pending orders from Station 03 to Station 02 & 05. Queue cleared.', 'PACKING');
    }
  }

  // Trigger Hackathon Demo Scenario
  public triggerHackathonScenario() {
    // 1. Create sudden Urgent Order ORD-9999 for 10 units of LiDAR (SKU-ELEC-102)
    const now = new Date();
    const urgentItems = [
      { id: `ITM-9999-1`, sku: 'SKU-ELEC-102', productName: 'Industrial Optical LiDAR Sensor', category: 'Electronics', requestedQty: 10, allocatedQty: 0, pickedQty: 0, packedQty: 0, location: 'A-05', unitPrice: 420, weightKg: 1.2, availableStock: 7 }
    ];
    const productsMap = new Map(this.products.map(p => [p.sku, p]));
    const prio = calculateOrderPriority({
      items: urgentItems,
      expectedDelivery: new Date(now.getTime() + 3 * 3600000).toISOString(),
      customerTier: 'VIP',
      totalValue: 4200,
      orderDate: now.toISOString(),
      isDelayed: true,
      delayMinutes: 15
    }, productsMap);

    const newOrder: Order = {
      id: 'ORD-9999',
      orderNumber: 'ORD-9999',
      customer: 'Apex Robotics Corp (Emergency Plant Callout)',
      customerTier: 'VIP',
      orderDate: now.toISOString(),
      expectedDelivery: new Date(now.getTime() + 3 * 3600000).toISOString(),
      items: urgentItems,
      totalQty: 10,
      totalValue: 4200,
      priority: 'CRITICAL',
      priorityScore: 98,
      priorityBreakdown: {
        score: 98,
        urgency: 25,
        deliveryRisk: 25,
        customerImpact: 20,
        inventoryAvailability: 8,
        orderAge: 10,
        businessImportance: 5,
        reasons: [
          'Emergency production line shutdown callout (3h window)',
          'Requires 10 units LiDAR (Available in warehouse: 7 units)',
          'Competes with standard order #ORD-1002 (needs 5 units)'
        ]
      },
      status: 'PENDING',
      allocationStatus: 'CONFLICT',
      pickingStatus: 'NOT_STARTED',
      packingStatus: 'QUEUED',
      qcStatus: 'PENDING',
      dispatchStatus: 'WAITING_CARRIER',
      riskLevel: 'CRITICAL',
      carrier: 'DHL Express Special Delivery',
      isDelayed: true,
      delayMinutes: 15,
      auditTrail: [
        { id: `AUD-9999-1`, timestamp: now.toISOString(), actor: 'ERP Emergency Stream', role: 'INTEGRATION', action: 'Emergency Order Ingested', details: 'High-priority VIP ticket created for 10 units LiDAR', stage: 'CREATION' }
      ]
    };

    this.orders.unshift(newOrder);

    // Add alert
    this.alerts.unshift({
      id: `ALT-DEMO-${Date.now()}`,
      title: '🚨 Urgent Stock Conflict: ORD-9999 vs ORD-1002',
      message: 'Emergency VIP Order #ORD-9999 requires 10 units of LiDAR (7 available). Competing with standard orders.',
      severity: 'CRITICAL',
      source: 'Smart Allocation Engine',
      timestamp: now.toISOString(),
      reason: 'Total demand (15) > Available stock (7).',
      recommendedAction: 'Allocate all 7 units to ORD-9999 and trigger emergency 3-unit supplier expedited replenishment.',
      targetView: 'allocation',
      targetId: 'CONF-SKU-ELEC-102',
      isRead: false,
      isDismissed: false
    });

    this.addAuditLog('Demo Controller', 'SIMULATION', 'HACKATHON_EVENT_TRIGGERED', 'Simulated emergency VIP Order #ORD-9999 with 10-unit stock contention on SKU-ELEC-102.', 'SIMULATION');

    return {
      order: newOrder,
      message: 'Emergency VIP order ORD-9999 injected with stock contention. Check Allocation Center & Alerts!'
    };
  }
}

export const warehouseStore = new WarehouseStore();
