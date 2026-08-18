import React, { useState } from 'react';
import { Order, OrderPriority, OrderStatus, Product } from '../../types/warehouse';
import { PriorityBadge, StatusBadge, RiskBadge } from '../common/StatusBadge';
import {
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Truck,
  Package,
  Layers,
  ChevronRight,
  X,
  Plus
} from 'lucide-react';

interface Props {
  orders: Order[];
  products: Product[];
  selectedOrder: Order | null;
  onSelectOrder: (order: Order | null) => void;
  onCreateOrderClick: () => void;
  onOrderUpdated?: () => void;
}

export const OrdersView: React.FC<Props> = ({
  orders = [],
  products = [],
  selectedOrder,
  onSelectOrder,
  onCreateOrderClick,
  onOrderUpdated
}) => {
  const safeOrders = orders || [];
  const safeProducts = products || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [onlyDelayed, setOnlyDelayed] = useState(false);
  const [sortBy, setSortBy] = useState<'priorityScore' | 'delivery' | 'value'>('priorityScore');

  // Filter orders
  const filteredOrders = safeOrders.filter(order => {
    if (priorityFilter !== 'ALL' && order.priority !== priorityFilter) return false;
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
    if (onlyDelayed && !order.isDelayed && order.delayMinutes === 0) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.orderNumber?.toLowerCase().includes(q);
      const matchCust = order.customer?.toLowerCase().includes(q);
      const matchItems = (order.items || []).some(i => i.productName?.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q));
      if (!matchNum && !matchCust && !matchItems) return false;
    }
    return true;
  });

  // Sort orders
  filteredOrders.sort((a, b) => {
    if (sortBy === 'priorityScore') return (b.priorityScore || 0) - (a.priorityScore || 0);
    if (sortBy === 'delivery') return new Date(a.expectedDelivery || 0).getTime() - new Date(b.expectedDelivery || 0).getTime();
    if (sortBy === 'value') return (b.totalValue || 0) - (a.totalValue || 0);
    return 0;
  });

  return (
    <div id="view-orders-management" className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Orders Management & Dynamic Prioritization</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-factor scoring determines optimal pick/pack sequence based on delivery urgency and customer SLAs.
          </p>
        </div>
        <button
          id="btn-create-order-main"
          onClick={onCreateOrderClick}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Order</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-orders-search"
              type="text"
              placeholder="Search by Order #, Customer, or Product..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-hidden focus:border-slate-400 font-medium"
            />
          </div>

          {/* Priority Filter */}
          <div className="md:col-span-3 flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 px-2">Priority:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                  priorityFilter === p ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium outline-hidden"
            >
              <option value="ALL">All Statuses ({orders.length})</option>
              <option value="PENDING">Pending</option>
              <option value="ALLOCATED">Allocated</option>
              <option value="PICKING">In Picking</option>
              <option value="PACKING">In Packing</option>
              <option value="QC_CHECK">In QC Check</option>
              <option value="DISPATCH_READY">Ready for Dispatch</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="ON_HOLD">On Hold (Exception)</option>
            </select>
          </div>

          {/* Delayed Toggle */}
          <div className="md:col-span-2 flex items-center justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={onlyDelayed}
                onChange={e => setOnlyDelayed(e.target.checked)}
                className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
              />
              <span className="text-rose-600">Delayed Only</span>
            </label>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>Showing <strong className="text-slate-900">{filteredOrders.length}</strong> orders</span>
            <span>Critical: <strong className="text-rose-600">{orders.filter(o => o.priority === 'CRITICAL').length}</strong></span>
            <span>Delayed: <strong className="text-amber-600">{orders.filter(o => o.isDelayed || o.delayMinutes > 0).length}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold">Sort By:</span>
            <button
              onClick={() => setSortBy('priorityScore')}
              className={`text-[11px] font-bold px-2 py-0.5 rounded ${sortBy === 'priorityScore' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Priority Score
            </button>
            <button
              onClick={() => setSortBy('delivery')}
              className={`text-[11px] font-bold px-2 py-0.5 rounded ${sortBy === 'delivery' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Delivery SLA
            </button>
            <button
              onClick={() => setSortBy('value')}
              className={`text-[11px] font-bold px-2 py-0.5 rounded ${sortBy === 'value' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Order Value
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer & Tier</th>
                <th className="py-3 px-4">Priority (Score)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Items / Consignment</th>
                <th className="py-3 px-4">Delivery Cutoff</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.map(order => (
                <tr
                  key={order.id}
                  id={`order-row-${order.id}`}
                  onClick={() => onSelectOrder(order)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    selectedOrder?.id === order.id ? 'bg-slate-100/70' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{order.orderNumber}</span>
                      {order.priorityScore >= 90 && (
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                      )}
                    </div>
                    {order.isDelayed && (
                      <span className="text-[10px] font-bold text-rose-600 block">
                        +{order.delayMinutes}m SLA breach
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800">
                    <div className="font-bold">{order.customer}</div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      {order.customerTier} TIER
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <PriorityBadge priority={order.priority} score={order.priorityScore} />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="font-semibold text-slate-800">${order.totalValue.toLocaleString()}</div>
                    <div className="text-[11px] text-slate-400">{order.items.length} line items ({order.totalQty} pcs)</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="font-bold text-slate-800">
                      {new Date(order.expectedDelivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(order.expectedDelivery).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <RiskBadge risk={order.riskLevel} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(order);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Drawer Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-end bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-slate-400">Order Deep-Dive</span>
                    <PriorityBadge priority={selectedOrder.priority} score={selectedOrder.priorityScore} />
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{selectedOrder.orderNumber}</h2>
                  <p className="text-xs text-slate-500">{selectedOrder.customer} ({selectedOrder.customerTier} Tier)</p>
                </div>
                <button
                  id="btn-close-order-drawer"
                  onClick={() => onSelectOrder(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Priority Calculation Breakdown (Explainable AI / Decision Engine) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Dynamic Priority Score: {selectedOrder.priorityScore}/100
                  </span>
                  <span className="text-[11px] text-slate-500">Decision Engine Breakdown</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">DELIVERY URGENCY</span>
                    <span className="font-extrabold text-slate-900">+{selectedOrder.priorityBreakdown?.deliveryUrgencyPoints ?? 0} pts</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">CUSTOMER TIER</span>
                    <span className="font-extrabold text-slate-900">+{selectedOrder.priorityBreakdown?.customerTierPoints ?? 0} pts</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">CONSIGNMENT VALUE</span>
                    <span className="font-extrabold text-slate-900">+{selectedOrder.priorityBreakdown?.orderValuePoints ?? 0} pts</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">STOCK READINESS</span>
                    <span className="font-extrabold text-slate-900">+{selectedOrder.priorityBreakdown?.itemAvailabilityPoints ?? 0} pts</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">SLA PENALTY RISK</span>
                    <span className="font-extrabold text-slate-900">+{selectedOrder.priorityBreakdown?.slaPenaltyRiskPoints ?? 0} pts</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">DELAY PENALTY</span>
                    <span className="font-extrabold text-rose-600">+{selectedOrder.priorityBreakdown?.delayPenaltyPoints ?? 0} pts</span>
                  </div>
                </div>
              </div>

              {/* Line Items List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Ordered Line Items ({selectedOrder.items?.length || 0})
                </h3>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map(item => (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                          {item.location}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="text-[11px] text-slate-500">
                            SKU: {item.sku} · Qty: {item.requestedQty} pcs (${item.unitPrice}/pc)
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">${(item.requestedQty || 0) * (item.unitPrice || 0)}</span>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          Available: {item.availableStock} in Bin
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Timeline */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Order Lifecycle Timeline
                </h3>
                <div className="space-y-3 border-l-2 border-slate-200 pl-3">
                  {(selectedOrder.auditTrail || []).map(trail => (
                    <div key={trail.id} className="text-xs space-y-0.5">
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span className="font-bold text-slate-800">{trail.action}</span>
                        <span>{trail.timestamp ? new Date(trail.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                      </div>
                      <p className="text-slate-600">{trail.details}</p>
                      <span className="text-[10px] text-slate-400">Actor: {trail.actor} ({trail.role})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => onSelectOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CreateOrderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onOrderCreated: (newOrder: Order) => void;
}> = ({ isOpen, onClose, products, onOrderCreated }) => {
  const [customer, setCustomer] = useState('');
  const [customerTier, setCustomerTier] = useState<'VIP' | 'ENTERPRISE' | 'STANDARD'>('STANDARD');
  const [deliveryHours, setDeliveryHours] = useState(24);
  const [selectedItems, setSelectedItems] = useState<Array<{ sku: string; quantity: number }>>([
    { sku: products[0]?.sku || 'SKU-ELEC-102', quantity: 2 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const addItem = () => {
    setSelectedItems([...selectedItems, { sku: products[0]?.sku || '', quantity: 1 }]);
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const copy = [...selectedItems];
    copy[idx] = { ...copy[idx], [field]: val };
    setSelectedItems(copy);
  };

  const removeItem = (idx: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          customerTier,
          expectedDeliveryHours: deliveryHours,
          items: selectedItems
        })
      });
      const data = await res.json();
      onOrderCreated(data);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create New Warehouse Order</h2>
            <p className="text-xs text-slate-500">Order priority will be automatically computed by the Decision Engine.</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Customer / Consignee Name</label>
            <input
              id="input-new-order-customer"
              type="text"
              required
              placeholder="e.g. NextGen Autonomous Robotics"
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-hidden font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Tier</label>
              <select
                id="select-new-order-tier"
                value={customerTier}
                onChange={e => setCustomerTier(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
              >
                <option value="VIP">VIP Account (+30 pts)</option>
                <option value="ENTERPRISE">Enterprise (+15 pts)</option>
                <option value="STANDARD">Standard (+0 pts)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Delivery SLA Target</label>
              <select
                id="select-new-order-delivery"
                value={deliveryHours}
                onChange={e => setDeliveryHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
              >
                <option value={4}>4 Hours (Urgent Same-Day +40 pts)</option>
                <option value={12}>12 Hours (Next Morning +25 pts)</option>
                <option value={24}>24 Hours (Standard 1-Day +10 pts)</option>
                <option value={48}>48 Hours (Standard 2-Day +0 pts)</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between font-bold text-slate-700 mb-1.5">
              <span>Order Line Items</span>
              <button
                type="button"
                onClick={addItem}
                className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {selectedItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={item.sku}
                    onChange={e => updateItem(idx, 'sku', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium truncate"
                  >
                    {products.map(p => (
                      <option key={p.sku} value={p.sku}>
                        {p.name} ({p.sku}) - Stock: {p.availableQty}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                    className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-900"
                  />
                  {selectedItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-order"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Evaluating...' : 'Create & Score Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
