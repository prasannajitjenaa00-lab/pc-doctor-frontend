import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  WalletCards,
  Plus,
  Trash2,
  Calendar,
  PieChart as PieIcon,
  DollarSign
} from 'lucide-react';
import api from '../services/api';
import { useShop } from '../context/ShopContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../components/common/Table';

const EXPENSE_CATEGORIES = [
  'Shop Rent',
  'Electricity & Utilities',
  'Staff Salary',
  'Tools & Equipment',
  'Repair Components',
  'Tea & Refreshments',
  'Internet & Phone',
  'Marketing & Ads',
  'Shop Maintenance',
  'Taxes & Software',
  'Miscellaneous'
];

export const ExpensesPage = () => {
  const queryClient = useQueryClient();
  const { shopSettings } = useShop();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Tea & Refreshments',
    amount: '',
    paymentMode: 'Cash',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch Expenses
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses-list', selectedCategory],
    queryFn: async () => {
      const res = await api.get('/expenses', {
        params: { category: selectedCategory || undefined }
      });
      return res.data || [];
    }
  });

  const expenses = expensesData || [];

  // Fetch Monthly Analytics
  const { data: analytics } = useQuery({
    queryKey: ['expense-analytics'],
    queryFn: async () => {
      const res = await api.get('/expenses/analytics');
      return res.data || {};
    }
  });

  // Create Expense Mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/expenses', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Expense recorded');
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      queryClient.invalidateQueries({ queryKey: ['expense-analytics'] });
      setIsModalOpen(false);
      setFormData({
        title: '',
        category: 'Tea & Refreshments',
        amount: '',
        paymentMode: 'Cash',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
    },
    onError: (err) => toast.error(err.message || 'Failed to record expense')
  });

  // Delete Expense Mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/expenses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Expense deleted');
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      queryClient.invalidateQueries({ queryKey: ['expense-analytics'] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) {
      toast.error('Expense title and amount are required');
      return;
    }
    createExpenseMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <WalletCards className="w-6 h-6 text-blue-600" />
            Shop Expense Tracking
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track daily operating costs, rent, utilities, tea, tools, and calculate net profits
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          Record Expense
        </Button>
      </div>

      {/* Monthly Category Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-rose-500">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Spent This Month
          </span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(analytics?.totalMonthExpense || 0, shopSettings?.currencySymbol)}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Operating expenses for {analytics?.period}</p>
        </Card>

        {(analytics?.breakdown || []).slice(0, 3).map((item) => (
          <Card key={item._id}>
            <span className="text-xs font-semibold text-slate-500 truncate block">
              {item._id}
            </span>
            <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatCurrency(item.totalAmount, shopSettings?.currencySymbol)}
            </h4>
            <span className="text-[11px] text-slate-400">{item.count} transactions</span>
          </Card>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border whitespace-nowrap transition-all ${
            selectedCategory === ''
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          All Categories
        </button>
        {EXPENSE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Expense Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Payment Mode</TableHead>
            <TableHead align="right">Amount</TableHead>
            <TableHead align="right">Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {expenses.length > 0 ? (
            expenses.map((exp) => (
              <TableRow key={exp._id}>
                <TableCell>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{exp.title}</div>
                  {exp.notes && <div className="text-xs text-slate-400">{exp.notes}</div>}
                </TableCell>
                <TableCell>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-medium">
                    {exp.category}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {formatDate(exp.date)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{exp.paymentMode}</span>
                </TableCell>
                <TableCell align="right" className="font-bold text-rose-600">
                  {formatCurrency(exp.amount, shopSettings?.currencySymbol)}
                </TableCell>
                <TableCell align="right">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete expense "${exp.title}"?`)) {
                        deleteExpenseMutation.mutate(exp._id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableEmpty message="No expenses recorded for this selection" colSpan={6} />
          )}
        </TableBody>
      </Table>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Expense"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title / Purpose *"
            required
            placeholder="e.g. Shop monthly internet fiber bill"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Amount (₹) *"
              type="number"
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Mode
              </label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <Input
              label="Expense Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <Input
            label="Notes (Optional)"
            placeholder="Receipt reference or vendor details"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createExpenseMutation.isPending}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
