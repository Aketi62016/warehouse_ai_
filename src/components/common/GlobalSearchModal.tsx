import React, { useState, useEffect } from 'react';
import { Search, X, ShoppingCart, Boxes, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import { Order, Product, WarehouseException } from '../../types/warehouse';
import { PriorityBadge, StatusBadge } from './StatusBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  products: Product[];
  exceptions: WarehouseException[];
  onSelectOrder: (order: Order) => void;
  onSelectProduct: (product: Product) => void;
}

export const GlobalSearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  orders = [],
  products = [],
  exceptions = [],
  onSelectOrder,
  onSelectProduct
}) => {
  const safeOrders = orders || [];
  const safeProducts = products || [];
  const safeExceptions = exceptions || [];
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedOrders = q
    ? safeOrders.filter(o => 
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customer?.toLowerCase().includes(q) ||
        (o.items || []).some(i => i.sku?.toLowerCase().includes(q) || i.productName?.toLowerCase().includes(q))
      ).slice(0, 5)
    : safeOrders.slice(0, 3);

  const matchedProducts = q
    ? safeProducts.filter(p => 
        p.sku?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      ).slice(0, 5)
    : safeProducts.slice(0, 3);

  const matchedExceptions = q
    ? safeExceptions.filter(e => 
        e.id?.toLowerCase().includes(q) ||
        e.orderNumber?.toLowerCase().includes(q) ||
        e.details?.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            id="input-global-search-query"
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Order (e.g. ORD-1042), SKU (e.g. SKU-ELEC-102), Customer, or Bay location..."
            className="flex-1 text-sm bg-transparent outline-hidden text-slate-900 placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-xs font-mono bg-slate-100 border border-slate-200 rounded text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
          {/* Orders Section */}
          {matchedOrders.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5" />
                Orders ({matchedOrders.length})
              </div>
              <div className="space-y-1">
                {matchedOrders.map(order => (
                  <button
                    key={order.id}
                    id={`search-result-order-${order.id}`}
                    onClick={() => {
                      onSelectOrder(order);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{order.orderNumber}</span>
                        <span className="text-xs text-slate-600 font-medium">· {order.customer}</span>
                        <PriorityBadge priority={order.priority} />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {(order.items || []).length} items · ${(order.totalValue || 0).toLocaleString()} · Expected in {order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.status} />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          {matchedProducts.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5" />
                Inventory & Products ({matchedProducts.length})
              </div>
              <div className="space-y-1">
                {matchedProducts.map(prod => (
                  <button
                    key={prod.sku}
                    id={`search-result-prod-${prod.sku}`}
                    onClick={() => {
                      onSelectProduct(prod);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                        {prod.location}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{prod.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">({prod.sku})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Stock: <strong className="text-slate-800">{prod.availableQty} units</strong> (Reserved: {prod.reservedQty}) · Velocity: {prod.demandRate}/day
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">${prod.unitPrice}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Exceptions */}
          {matchedExceptions.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Active Exceptions ({matchedExceptions.length})
              </div>
              <div className="space-y-1">
                {matchedExceptions.map(exc => (
                  <div key={exc.id} className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-rose-900">
                      <span>{exc.id} · {exc.orderNumber}</span>
                      <span className="uppercase text-[10px] bg-rose-200/70 px-1.5 py-0.5 rounded">{exc.type}</span>
                    </div>
                    <p className="text-[11px] text-rose-800 mt-1">{exc.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Tip: Press <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">Enter</kbd> to view selection or <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">ESC</kbd> to close.
        </div>
      </div>
    </div>
  );
};
