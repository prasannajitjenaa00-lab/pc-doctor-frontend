import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  Barcode,
  TrendingUp,
  Percent,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useShop } from '../context/ShopContext';
import { formatCurrency } from '../utils/formatters';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../components/common/Table';
import { TableSkeleton } from '../components/common/Skeleton';

export const ProductsPage = () => {
  const queryClient = useQueryClient();
  const { shopSettings } = useShop();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    sku: '',
    category: '',
    buyPrice: 0,
    sellingPrice: 0,
    stock: 0,
    minStock: 5,
    description: '',
    warrantyMonths: 12
  });

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data || [];
    }
  });

  // Fetch Products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products-list', search, categoryFilter],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: { search, category: categoryFilter || undefined, limit: 100 }
      });
      return res.data || [];
    }
  });

  const products = productsData || [];

  // Create/Update Product Mutation
  const saveProductMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct._id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/products', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      setIsModalOpen(false);
      setEditingProduct(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save product');
    }
  });

  // Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/products/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to delete product')
  });

  // Seed Dummy / Demo Products Mutation
  const seedDemoProductsMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/products/seed');
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Dummy products added successfully!');
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to seed dummy products');
    }
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: '',
      sku: '',
      category: categories[0]?._id || '',
      buyPrice: 0,
      sellingPrice: 0,
      stock: 1,
      minStock: 5,
      description: '',
      warrantyMonths: 12
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      barcode: p.barcode || '',
      sku: p.sku || '',
      category: p.category?._id || p.category || '',
      buyPrice: p.buyPrice || 0,
      sellingPrice: p.sellingPrice || 0,
      stock: p.stock || 0,
      minStock: p.minStock || 5,
      description: p.description || '',
      warrantyMonths: p.warrantyMonths || 12
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    saveProductMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-blue-600" />
            Product Catalogue
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage SKU, Barcode, Buy/Sell Pricing, Profit Margins & Thresholds
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            icon={Sparkles}
            loading={seedDemoProductsMutation.isPending}
            onClick={() => seedDemoProductsMutation.mutate()}
            title="Populate catalogue with realistic PC Doctor demo products"
            className="w-full sm:w-auto text-xs sm:text-sm px-2.5 sm:px-4"
          >
            Dummy Products
          </Button>

          <Button
            variant="primary"
            icon={Plus}
            onClick={handleOpenAdd}
            className="w-full sm:w-auto text-xs sm:text-sm px-2.5 sm:px-4"
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by title, barcode, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Product Name</TableHead>
              <TableHead>Identifiers</TableHead>
              <TableHead>Category</TableHead>
              <TableHead align="right">Buy Price</TableHead>
              <TableHead align="right">Selling Price</TableHead>
              <TableHead align="right">Profit / Margin</TableHead>
              <TableHead align="center">Stock</TableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
              products.map((p) => {
                const profit = (p.sellingPrice || 0) - (p.buyPrice || 0);
                const margin = p.sellingPrice ? ((profit / p.sellingPrice) * 100).toFixed(1) : 0;
                return (
                  <TableRow key={p._id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                      {p.description && <div className="text-xs text-slate-400 truncate max-w-xs">{p.description}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                        {p.barcode ? `BC: ${p.barcode}` : '-'}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {p.sku ? `SKU: ${p.sku}` : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {p.category?.name || 'General'}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(p.buyPrice, shopSettings?.currencySymbol)}
                    </TableCell>
                    <TableCell align="right" className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(p.sellingPrice, shopSettings?.currencySymbol)}
                    </TableCell>
                    <TableCell align="right">
                      <span className="text-xs font-bold text-emerald-600 block">
                        +{formatCurrency(profit, shopSettings?.currencySymbol)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{margin}% Margin</span>
                    </TableCell>
                    <TableCell align="center">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          p.stock <= p.minStock
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove "${p.name}"?`)) {
                              deleteProductMutation.mutate(p._id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Boxes className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                        No products in catalogue yet
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        Get started immediately by loading realistic PC Doctor dummy products or creating your own.
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
                      <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
                        Add New Product
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Product Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        subtitle="Catalog details, barcode, buy/sell pricing and stock thresholds"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Product Name"
            required
            placeholder="e.g. Kingston NV2 1TB M.2 PCIe 4.0 NVMe SSD"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Barcode (Leave blank to auto-generate)"
              placeholder="e.g. 890123456789"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            />
            <Input
              label="SKU (Stock Keeping Unit)"
              placeholder="e.g. SSD-KNG-1TB"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Warranty (Months)"
              type="number"
              value={formData.warrantyMonths}
              onChange={(e) => setFormData({ ...formData, warrantyMonths: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input
              label="Buy / Cost Price (₹) *"
              type="number"
              required
              value={formData.buyPrice}
              onChange={(e) => setFormData({ ...formData, buyPrice: Number(e.target.value) })}
            />
            <Input
              label="Selling Price (₹) *"
              type="number"
              required
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
            />
            {!editingProduct && (
              <Input
                label="Initial Stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              />
            )}
            <Input
              label="Low Stock Alert Threshold"
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saveProductMutation.isPending}>
              {editingProduct ? 'Update Product' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductsPage;
