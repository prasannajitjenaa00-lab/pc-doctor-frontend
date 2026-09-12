import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  History,
  SlidersHorizontal,
  FileSpreadsheet,
  Plus,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import { config } from '../config';
import { useShop } from '../context/ShopContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../components/common/Table';
import { TableSkeleton } from '../components/common/Skeleton';

export const InventoryPage = () => {
  const queryClient = useQueryClient();
  const { shopSettings } = useShop();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Adjustment Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    changeQty: 1,
    type: 'Restock',
    notes: ''
  });

  // Delete Modal State
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['inv-categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data || [];
    }
  });

  // Fetch Products for Inventory
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['inventory-products', search, categoryFilter, lowStockOnly],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: {
          search,
          category: categoryFilter || undefined,
          lowStock: lowStockOnly ? 'true' : undefined,
          limit: 100
        }
      });
      return res.data || [];
    }
  });

  const products = productsData || [];

  // Stock Adjustment Mutation
  const adjustMutation = useMutation({
    mutationFn: async ({ id, changeQty, type, notes }) => {
      const res = await api.post(`/products/${id}/adjust-stock`, { changeQty, type, notes });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Stock adjusted successfully');
      setIsAdjustModalOpen(false);
      setSelectedProduct(null);
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Stock adjustment failed');
    }
  });

  // Seed Dummy / Demo Products Mutation
  const seedDemoProductsMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/products/seed');
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Dummy products added successfully!');
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['inv-categories'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to seed dummy products');
    }
  });

  // Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/products/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Product deleted from inventory');
      setIsDeleteModalOpen(false);
      setDeleteConfirmProduct(null);
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['billing-products'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete product');
    }
  });

  // Open History Audit
  const handleOpenHistory = async (product) => {
    setHistoryProduct(product);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/products/${product._id}/stock-history`);
      setStockHistory(res.data || []);
    } catch (err) {
      toast.error('Failed to load stock history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    adjustMutation.mutate({
      id: selectedProduct._id,
      changeQty: Number(adjustmentData.changeQty),
      type: adjustmentData.type,
      notes: adjustmentData.notes
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Inventory & Stock Control
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time stock monitoring, audit logs, low-stock alerts, and manual adjustments
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            icon={Sparkles}
            loading={seedDemoProductsMutation.isPending}
            onClick={() => seedDemoProductsMutation.mutate()}
            title="Populate inventory with realistic demo products"
            className="w-full sm:w-auto text-xs sm:text-sm px-2.5 sm:px-4"
          >
            Dummy Stock
          </Button>

          {/* Export Excel Button */}
          <a
            href={config.endpoints.inventoryExcel()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors w-full sm:w-auto text-center"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Export</span>
          </a>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, barcode, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setLowStockOnly((prev) => !prev)}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
            lowStockOnly
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          Low Stock Only
        </button>
      </div>

      {/* Inventory Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Product</TableHead>
              <TableHead>Barcode / SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead align="right">Buy Price</TableHead>
              <TableHead align="right">Selling Price</TableHead>
              <TableHead align="center">Stock Status</TableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
              products.map((product) => {
                const isLow = (product.stock || 0) <= (product.minStock || 5);
                return (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{product.name}</div>
                      <div className="text-xs text-slate-400">Min Stock Threshold: {product.minStock}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs text-slate-600 dark:text-slate-300">{product.barcode || '-'}</div>
                      <div className="font-mono text-[11px] text-slate-400">{product.sku || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(product.buyPrice, shopSettings?.currencySymbol)}
                    </TableCell>
                    <TableCell align="right" className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(product.sellingPrice, shopSettings?.currencySymbol)}
                    </TableCell>
                    <TableCell align="center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`text-sm font-extrabold px-3 py-0.5 rounded-full border ${
                            isLow
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900'
                          }`}
                        >
                          {product.stock} Units
                        </span>
                        {isLow && (
                          <span className="text-[10px] text-rose-500 font-bold mt-0.5 flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3" /> Low Stock
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedProduct(product);
                            setAdjustmentData({ changeQty: 1, type: 'Restock', notes: '' });
                            setIsAdjustModalOpen(true);
                          }}
                          className="text-xs py-1 px-2.5"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-blue-500" />
                          Adjust
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenHistory(product)}
                          className="text-xs py-1 px-2"
                          title="Stock Audit History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDeleteConfirmProduct(product);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-xs py-1 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Package className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                        No inventory stock registered
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        Track stock levels, adjustments, and reorder alerts by populating dummy products or adding products in catalogue.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        variant="secondary"
                        icon={Sparkles}
                        loading={seedDemoProductsMutation.isPending}
                        onClick={() => seedDemoProductsMutation.mutate()}
                      >
                        Add Dummy Products
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* MODAL: Adjust Stock */}
      {selectedProduct && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title={`Adjust Stock: ${selectedProduct.name}`}
          subtitle={`Current stock in system: ${selectedProduct.stock} units`}
          size="md"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Adjustment Reason / Type *
              </label>
              <select
                value={adjustmentData.type}
                onChange={(e) => setAdjustmentData({ ...adjustmentData, type: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="Restock">Restock (Received new shipment)</option>
                <option value="Recount">Inventory Recount / Audit Correction</option>
                <option value="Damage">Damaged / Defective Stock</option>
                <option value="Purchase">Supplier Purchase Addition</option>
                <option value="Return">Customer Return</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Quantity Change (+ to add, - to reduce) *
              </label>
              <input
                type="number"
                required
                value={adjustmentData.changeQty}
                onChange={(e) => setAdjustmentData({ ...adjustmentData, changeQty: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
              <p className="text-xs text-slate-500 mt-1">
                Resulting stock will be: <strong>{selectedProduct.stock + Number(adjustmentData.changeQty)}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Audit Notes / Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Verified by technician, Supplier invoice #442"
                value={adjustmentData.notes}
                onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsAdjustModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={adjustMutation.isPending}>
                Save Adjustment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Stock Audit History */}
      {historyProduct && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Stock History: ${historyProduct.name}`}
          subtitle={`Audit trail of all sales, repairs and adjustments`}
          size="lg"
        >
          {historyLoading ? (
            <div className="py-8 text-center text-slate-400">Loading audit history...</div>
          ) : stockHistory.length > 0 ? (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {stockHistory.map((item) => (
                <div
                  key={item._id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{item.type}</span>
                      {item.referenceId && (
                        <span className="text-slate-500 font-mono text-[11px]">
                          Ref: #{item.referenceId}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">{item.notes || 'Manual stock update'}</p>
                    <span className="text-[10px] text-slate-400">{formatDate(item.date || item.createdAt, true)}</span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-sm ${
                        item.changeQty > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {item.changeQty > 0 ? `+${item.changeQty}` : item.changeQty}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {item.previousStock} → {item.newStock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">No audit history entries for this item.</div>
          )}
        </Modal>
      )}

      {/* MODAL: Delete Confirmation */}
      {deleteConfirmProduct && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title={`Delete Product`}
          subtitle={`Are you sure you want to remove '${deleteConfirmProduct.name}'?`}
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-800 dark:text-rose-300">
                This item will be removed from active inventory and billing catalog. Existing invoice records referencing this product will be preserved.
              </p>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={deleteProductMutation.isPending}
                onClick={() => deleteProductMutation.mutate(deleteConfirmProduct._id)}
              >
                Delete Product
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InventoryPage;
