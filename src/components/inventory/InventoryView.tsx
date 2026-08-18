import React, { useState } from 'react';
import { Product, ReorderRecommendation, InventoryStatus } from '../../types/warehouse';
import { InventoryStatusBadge } from '../common/StatusBadge';
import {
  Search,
  Boxes,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';

interface Props {
  products: Product[];
  stockoutPredictions: ReorderRecommendation[];
  onTriggerReorder: (sku: string, qty: number, supplier?: string) => Promise<any>;
}

export const InventoryView: React.FC<Props> = ({
  products = [],
  stockoutPredictions = [],
  onTriggerReorder
}) => {
  const safeProducts = products || [];
  const safeStockoutPredictions = stockoutPredictions || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reorderModalItem, setReorderModalItem] = useState<{ product: Product; recQty: number } | null>(null);
  const [reorderQty, setReorderQty] = useState(50);
  const [isReordering, setIsReordering] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const categories = ['ALL', 'Electronics', 'Robotics', 'Hardware', 'Medical', 'Tools'];

  const filteredProducts = safeProducts.filter(p => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleExecuteReorder = async () => {
    if (!reorderModalItem) return;
    setIsReordering(true);
    try {
      const res = await onTriggerReorder(reorderModalItem.product.sku, reorderQty, reorderModalItem.product.supplier);
      setSuccessToast(`Purchase Order created for ${reorderQty} units of ${reorderModalItem.product.name}. Expected in ${reorderModalItem.product.leadTimeDays} days.`);
      setReorderModalItem(null);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div id="view-inventory-management" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Inventory Levels & Predictive Stockout Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-bin stock tracking, demand velocity monitoring, and proactive purchase order automation.
          </p>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="p-1 hover:bg-emerald-100 rounded">
            <X className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      )}

      {/* AI Stockout Prediction Cards */}
      {safeStockoutPredictions.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 rounded-2xl p-5 border border-amber-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Predictive Stockout Intelligence ({safeStockoutPredictions.length} SKUs at immediate risk)</span>
            </div>
            <span className="text-[11px] font-semibold text-amber-700">Calculated based on 7-day velocity & pending reservations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {safeStockoutPredictions.map(pred => {
              const matchedProd = safeProducts.find(p => p.sku === pred.sku);
              return (
                <div
                  key={pred.sku}
                  className="bg-white p-4 rounded-xl border border-amber-200/90 shadow-2xs space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800">{pred.sku}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        {pred.daysUntilStockout <= 1 ? 'Critical <24h' : `${pred.daysUntilStockout} Days Left`}
                      </span>
                    </div>
                    <h3 className="font-bold text-xs text-slate-900 mt-1">{pred.productName}</h3>
                    <p className="text-[11px] text-slate-600 mt-1">{pred.reason}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">
                      Stock: <strong className="text-slate-900">{pred.currentStock}</strong> (Velocity: {pred.dailyDemand}/day)
                    </div>
                    <button
                      id={`btn-reorder-pred-${pred.sku}`}
                      onClick={() => {
                        if (matchedProd) {
                          setReorderModalItem({ product: matchedProd, recQty: pred.recommendedQuantity });
                          setReorderQty(pred.recommendedQuantity);
                        }
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>Reorder {pred.recommendedQuantity}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-inventory-search"
              type="text"
              placeholder="Search by SKU, Product Name, or Bin Location (e.g. A-02)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-hidden font-medium"
            />
          </div>

          {/* Category Tabs */}
          <div className="md:col-span-4 flex items-center gap-1 overflow-x-auto bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition-all ${
                  categoryFilter === cat ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
            >
              <option value="ALL">All Inventory Statuses</option>
              <option value="HEALTHY">Healthy Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="CRITICAL">Critical Shortage</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="OVERSTOCK">Overstocked</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Tracking <strong>{filteredProducts.length}</strong> warehouse inventory items</span>
          <span className="text-slate-700 font-semibold">Total Stock Units: {products.reduce((acc, p) => acc + p.totalQty, 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">SKU & Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Bin Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total Stock</th>
                <th className="py-3 px-4">Available</th>
                <th className="py-3 px-4">Reserved</th>
                <th className="py-3 px-4">Incoming (PO)</th>
                <th className="py-3 px-4">Demand / Day</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProducts.map(prod => (
                <tr key={prod.sku} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div>{prod.name}</div>
                    <span className="font-mono text-[10px] text-slate-400 font-normal">
                      {prod.sku} · ${prod.unitPrice}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{prod.category}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-slate-800">
                      {prod.location}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <InventoryStatusBadge status={prod.status} />
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{prod.totalQty}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">{prod.availableQty}</td>
                  <td className="py-3 px-4 text-slate-600">{prod.reservedQty}</td>
                  <td className="py-3 px-4 text-indigo-600">
                    {prod.incomingQty > 0 ? `+${prod.incomingQty} on order` : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{prod.demandRate} pcs/day</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      id={`btn-reorder-${prod.sku}`}
                      onClick={() => {
                        setReorderModalItem({ product: prod, recQty: 50 });
                        setReorderQty(50);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>Reorder</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reorder Modal */}
      {reorderModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Issue Purchase Order</h2>
                <p className="text-xs text-slate-500">Restock inventory from authorized supplier.</p>
              </div>
              <button onClick={() => setReorderModalItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{reorderModalItem.product.name}</div>
                <div className="text-slate-500">SKU: {reorderModalItem.product.sku} · Supplier: {reorderModalItem.product.supplier}</div>
                <div className="text-slate-500">Lead Time: {reorderModalItem.product.leadTimeDays} days · Current Available: {reorderModalItem.product.availableQty} units</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reorder Quantity (Units)</label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={reorderQty}
                  onChange={e => setReorderQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-hidden"
                />
              </div>

              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900">
                Estimated Consignment Cost: <strong>${(reorderQty * reorderModalItem.product.unitPrice * 0.7).toLocaleString()}</strong> (Wholesale rate)
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setReorderModalItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reorder-po"
                onClick={handleExecuteReorder}
                disabled={isReordering}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50 cursor-pointer"
              >
                {isReordering ? 'Submitting PO...' : 'Issue Purchase Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
