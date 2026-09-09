import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Printer,
  FileDown,
  Share2,
  CheckCircle2,
  RefreshCw,
  UserPlus,
  CreditCard,
  Banknote,
  Smartphone,
  RotateCcw,
  Boxes,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { config } from '../config';
import { useShop } from '../context/ShopContext';
import { formatCurrency, formatDate, generateWhatsAppBillLink } from '../utils/formatters';
import { cn } from '../utils/cn';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import PrintableInvoice from '../components/billing/PrintableInvoice';

export const BillingPage = () => {
  const { shopSettings } = useShop();

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Cart state
  const [cart, setCart] = useState([]);
  const [mobileTab, setMobileTab] = useState('products'); // 'products' or 'cart' (on mobile)
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [billNotes, setBillNotes] = useState('');

  // Customer state
  const [customerInfo, setCustomerInfo] = useState({
    name: 'Walk-in Customer',
    phone: '',
    email: '',
    address: '',
    gstNumber: ''
  });

  // Completed Invoice Modal state
  const [completedBill, setCompletedBill] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const barcodeInputRef = useRef(null);

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['billing-categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data || [];
    }
  });

  // Fetch Products
  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['billing-products', searchQuery, selectedCategory],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: {
          search: searchQuery,
          category: selectedCategory || undefined,
          limit: 30
        }
      });
      return res.data || [];
    }
  });

  const products = productsData || [];

  // Barcode Scanner Handler (Direct Enter Key)
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      const res = await api.get(`/products/code/${barcodeInput.trim()}`);
      if (res.data) {
        addToCart(res.data);
        setBarcodeInput('');
        toast.success(`Added ${res.data.name}`);
      }
    } catch (err) {
      toast.error(`No product found for barcode: ${barcodeInput}`);
    }
  };

  // Add Product to Cart
  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error(`"${product.name}" is out of stock!`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product === product._id);
      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        if (existing.qty >= product.stock) {
          toast.error(`Cannot add more. Available stock: ${product.stock}`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          qty: existing.qty + 1,
          total: (existing.qty + 1) * existing.unitPrice
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product: product._id,
            name: product.name,
            barcode: product.barcode,
            sku: product.sku,
            buyPrice: product.buyPrice,
            unitPrice: product.sellingPrice,
            stock: product.stock,
            qty: 1,
            gstRate: shopSettings?.defaultGstRate || 18,
            total: product.sellingPrice
          }
        ];
      }
    });
  };

  // Update Cart Quantity
  const updateQty = (index, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newQty = item.qty + delta;

      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }

      if (newQty > item.stock) {
        toast.error(`Only ${item.stock} units in stock!`);
        return prev;
      }

      updated[index] = {
        ...item,
        qty: newQty,
        total: newQty * item.unitPrice
      };
      return updated;
    });
  };

  // Remove Item from Cart
  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subTotal = cart.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  // Total Tax / GST
  const taxAmount = cart.reduce((sum, item) => {
    const itemSub = item.qty * item.unitPrice;
    return sum + (itemSub * (item.gstRate || 0)) / 100;
  }, 0);

  // Discount Calculation
  const discountAmount =
    discountType === 'percentage'
      ? (subTotal * Number(discountValue || 0)) / 100
      : Number(discountValue || 0);

  const grandTotal = Math.max(0, subTotal + taxAmount - discountAmount);

  // Effective Paid Amount
  const effectivePaid = paidAmount === '' ? grandTotal : Math.max(0, Number(paidAmount));
  const dueAmount = Math.max(0, grandTotal - effectivePaid);

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/bills', payload);
      return res.data;
    },
    onSuccess: (newBill) => {
      toast.success(`Invoice #${newBill.invoiceNumber} generated!`);
      setCompletedBill(newBill);
      setIsInvoiceModalOpen(true);
      // Reset cart and customer
      setCart([]);
      setDiscountValue(0);
      setPaidAmount('');
      setBillNotes('');
      setCustomerInfo({
        name: 'Walk-in Customer',
        phone: '',
        email: '',
        address: '',
        gstNumber: ''
      });
      refetchProducts();
    },
    onError: (err) => {
      toast.error(err.message || 'Checkout failed');
    }
  });

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your shopping cart is empty');
      return;
    }

    const payload = {
      customerSnapshot: customerInfo,
      items: cart,
      discountType,
      discountValue: Number(discountValue) || 0,
      paymentMode,
      paidAmount: effectivePaid,
      notes: billNotes
    };

    checkoutMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            POS Billing Terminal
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Barcode quick-scan, category filter, instant GST receipt, and inventory reduction
          </p>
        </div>

        {/* Barcode Quick Scan Input */}
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 max-w-md w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan Barcode / SKU (Enter)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono"
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Scan
          </Button>
        </form>
      </div>

      {/* Mobile Tab Switcher (< lg screens) */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('products')}
          className={cn(
            'py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
            mobileTab === 'products'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Products ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={cn(
            'py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
            mobileTab === 'cart'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Cart ({cart.length})</span>
          {cart.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-600 text-white font-mono">
              {cart.reduce((sum, item) => sum + item.qty, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Main Grid: Left Products Grid (60%), Right Cart & Checkout (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Product Catalogue & Search */}
        <div className={cn('lg:col-span-7 space-y-4', mobileTab !== 'products' && 'hidden lg:block')}>
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {productsLoading ? (
              <div className="col-span-full py-12 text-center text-slate-400">Loading products...</div>
            ) : products.length > 0 ? (
              products.map((product) => {
                const inStock = product.stock > 0;
                return (
                  <div
                    key={product._id}
                    onClick={() => inStock && addToCart(product)}
                    className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between select-none ${
                      inStock
                        ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md cursor-pointer group'
                        : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 truncate">
                          {product.category?.name || 'General'}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                            inStock
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {inStock ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <h4 className="font-medium text-xs text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {formatCurrency(product.sellingPrice, shopSettings?.currencySymbol)}
                      </span>
                      <button
                        type="button"
                        disabled={!inStock}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center text-slate-400">
                No matching products found. Try changing filters or search terms.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart, Customer Details & Checkout Summary */}
        <div className={cn('lg:col-span-5 space-y-4', mobileTab !== 'cart' && 'hidden lg:block')}>
          <Card className="p-4 space-y-4">
            {/* Customer Details Accordion / Form */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-blue-500" />
                  Customer Details
                </span>
                {customerInfo.phone && (
                  <span className="text-[11px] text-blue-600 dark:text-blue-400">Saved</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Phone (10 Digits)"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileTab('products')}
                    className="lg:hidden text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 p-1 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <Boxes className="w-3.5 h-3.5" /> + Add More
                  </button>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Shopping Cart ({cart.length})
                  </h3>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[220px] overflow-y-auto pr-1">
                {cart.length > 0 ? (
                  cart.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatCurrency(item.unitPrice, shopSettings?.currencySymbol)} × {item.qty}
                        </p>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateQty(idx, -1)}
                          className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-1 text-slate-900 dark:text-slate-100">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(idx, 1)}
                          className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.total, shopSettings?.currencySymbol)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(idx)}
                          className="text-[10px] text-rose-500 hover:text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Cart is empty. Click items or scan barcode to add.
                  </div>
                )}
              </div>
            </div>

            {/* Calculations & Discounts */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(subTotal, shopSettings?.currencySymbol)}
                </span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-400">Discount</span>
                <div className="flex items-center gap-1">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="px-1.5 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="fixed">{shopSettings?.currencySymbol || '₹'}</option>
                    <option value="percentage">%</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-16 px-1.5 py-1 text-right text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* GST Tax */}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Estimated GST</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(taxAmount, shopSettings?.currencySymbol)}
                </span>
              </div>

              {/* Grand Total */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl flex items-center justify-between">
                <span className="text-sm font-bold text-blue-900 dark:text-blue-200">Grand Total</span>
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                  {formatCurrency(grandTotal, shopSettings?.currencySymbol)}
                </span>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Payment Mode
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['Cash', 'UPI', 'Card', 'Credit/Due'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        paymentMode === mode
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Paid / Due */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Amount Paid</label>
                  <input
                    type="number"
                    placeholder={grandTotal.toString()}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Due Balance</label>
                  <div
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border ${
                      dueAmount > 0
                        ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900'
                    }`}
                  >
                    {formatCurrency(dueAmount, shopSettings?.currencySymbol)}
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full mt-2 font-bold shadow-md shadow-blue-500/20"
                disabled={cart.length === 0 || checkoutMutation.isPending}
                loading={checkoutMutation.isPending}
                onClick={handleCheckout}
              >
                Complete Bill & Print Invoice
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Invoice Success & Print / WhatsApp Modal */}
      {completedBill && (
        <Modal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          title={`Invoice Generated: ${completedBill.invoiceNumber}`}
          subtitle={`Billed to: ${completedBill.customerSnapshot?.name || 'Customer'}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                    Payment Recorded Successfully
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Total: {formatCurrency(completedBill.grandTotal, shopSettings?.currencySymbol)} • Mode: {completedBill.paymentMode}
                  </p>
                </div>
              </div>
              <Badge variant="green" size="md">
                {completedBill.status}
              </Badge>
            </div>

            {/* Invoice Breakdown Details */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold">Item Description</span>
                <span className="font-bold">Total</span>
              </div>
              {(completedBill.items || []).map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.name} (x{it.qty})</span>
                  <span>{formatCurrency(it.total, shopSettings?.currencySymbol)}</span>
                </div>
              ))}
              <div className="border-t pt-2 space-y-1 font-semibold">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(completedBill.subTotal, shopSettings?.currencySymbol)}</span>
                </div>
                {completedBill.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount:</span>
                    <span>- {formatCurrency(completedBill.discountAmount, shopSettings?.currencySymbol)}</span>
                  </div>
                )}
                {completedBill.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>GST:</span>
                    <span>{formatCurrency(completedBill.taxAmount, shopSettings?.currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-blue-600 pt-1 border-t">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(completedBill.grandTotal, shopSettings?.currencySymbol)}</span>
                </div>
              </div>
            </div>

            {/* Actions: Download PDF, WhatsApp Share, Thermal Print */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* PDF Download Button */}
              <a
                href={config.endpoints.billPdf(completedBill._id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Download PDF
              </a>

              {/* Direct Print Button */}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>

              {/* WhatsApp Share Button */}
              {completedBill.customerSnapshot?.phone ? (
                <a
                  href={generateWhatsAppBillLink(completedBill.customerSnapshot.phone, completedBill, shopSettings)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Send WhatsApp
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Customer phone not provided"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 font-medium text-xs cursor-not-allowed"
                >
                  <Share2 className="w-4 h-4" />
                  No Phone for WA
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Exclusively visible when printing */}
      {completedBill && (
        <PrintableInvoice bill={completedBill} shopSettings={shopSettings} />
      )}

      {/* Mobile Sticky Quick Cart Summary Bar */}
      {mobileTab === 'products' && cart.length > 0 && (
        <aside
          aria-label="Mobile Cart Quick Summary"
          className="fixed bottom-14 left-0 right-0 z-20 p-2.5 lg:hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-900/40 flex items-center justify-between no-print animate-scaleUp"
        >
          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">
                {cart.reduce((sum, item) => sum + item.qty, 0)} item(s) in Cart
              </p>
              <p className="text-xs text-blue-100 font-mono font-semibold">
                Total: {formatCurrency(grandTotal, shopSettings?.currencySymbol)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="py-1.5 px-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}
    </div>
  );
};

export default BillingPage;
