import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Receipt,
  Wrench,
  DollarSign,
  Edit2,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import { useShop } from '../context/ShopContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../components/common/Table';
import { TableSkeleton } from '../components/common/Skeleton';

export const CustomersPage = () => {
  const queryClient = useQueryClient();
  const { shopSettings } = useShop();

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLedger, setCustomerLedger] = useState(null);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);

  // Add/Edit Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    notes: ''
  });

  // Due Settlement Modal
  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [dueAmountPaid, setDueAmountPaid] = useState('');

  // Fetch Customers
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers-list', search],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { search } });
      return res.data || [];
    }
  });

  const customers = customersData || [];

  // Create/Update Customer Mutation
  const saveCustomerMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingCustomer) {
        const res = await api.put(`/customers/${editingCustomer._id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/customers', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success(editingCustomer ? 'Customer updated' : 'Customer created');
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to save customer')
  });

  // Settle Due Mutation
  const settleDueMutation = useMutation({
    mutationFn: async ({ id, amountPaid }) => {
      const res = await api.post(`/customers/${id}/settle-due`, { amountPaid });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Payment recorded');
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      setIsDueModalOpen(false);
      if (customerLedger) {
        handleOpenLedger(selectedCustomer);
      }
    },
    onError: (err) => toast.error(err.message || 'Payment recording failed')
  });

  // Open Ledger & History
  const handleOpenLedger = async (cust) => {
    setSelectedCustomer(cust);
    setIsLedgerModalOpen(true);
    try {
      const res = await api.get(`/customers/${cust._id}`);
      setCustomerLedger(res.data);
    } catch (err) {
      toast.error('Failed to load customer profile');
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '', gstNumber: '', notes: '' });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
      gstNumber: c.gstNumber || '',
      notes: c.notes || ''
    });
    setIsCustomerModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Customer name and phone number are required');
      return;
    }
    saveCustomerMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Customer Profiles & Ledger
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track customer purchase history, past repair jobs, and outstanding dues
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenAdd} className="w-full sm:w-auto">
          Add Customer
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by customer name, phone or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Customers Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Customer Name</TableHead>
              <TableHead>Phone / Contact</TableHead>
              <TableHead>Address / Location</TableHead>
              <TableHead align="right">Total Purchases</TableHead>
              <TableHead align="right">Total Spent</TableHead>
              <TableHead align="right">Outstanding Due</TableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {customers.length > 0 ? (
              customers.map((c) => (
                <TableRow key={c._id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</div>
                    {c.email && <div className="text-xs text-slate-400">{c.email}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs text-slate-700 dark:text-slate-300">{c.phone}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500 truncate max-w-xs block">
                      {c.address || '-'}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <span className="text-xs font-semibold">{c.totalPurchases || 0} Bills</span>
                  </TableCell>
                  <TableCell align="right" className="font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(c.totalSpent, shopSettings?.currencySymbol)}
                  </TableCell>
                  <TableCell align="right">
                    {(c.outstandingDue || 0) > 0 ? (
                      <span className="text-xs font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200">
                        {formatCurrency(c.outstandingDue, shopSettings?.currencySymbol)}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-600">No Due</span>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenLedger(c)}
                        className="text-xs py-1 px-2"
                      >
                        Ledger
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableEmpty message="No customers found" colSpan={7} />
            )}
          </TableBody>
        </Table>
      )}

      {/* Customer Ledger & History Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isLedgerModalOpen}
          onClose={() => setIsLedgerModalOpen(false)}
          title={`Customer Ledger: ${selectedCustomer.name}`}
          subtitle={`Phone: ${selectedCustomer.phone} • Address: ${selectedCustomer.address || '-'}`}
          size="xl"
        >
          <div className="space-y-6">
            {/* Top Dues Banner & Settle Button */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Current Outstanding Due
                </span>
                <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {formatCurrency(selectedCustomer.outstandingDue || 0, shopSettings?.currencySymbol)}
                </h3>
              </div>
              {(selectedCustomer.outstandingDue || 0) > 0 && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setDueAmountPaid((selectedCustomer.outstandingDue || 0).toString());
                    setIsDueModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Settle / Record Payment
                </Button>
              )}
            </div>

            {/* Purchases History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-500" />
                POS Purchase Invoices ({customerLedger?.purchaseHistory?.length || 0})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(customerLedger?.purchaseHistory || []).length > 0 ? (
                  customerLedger.purchaseHistory.map((bill) => (
                    <div
                      key={bill._id}
                      className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{bill.invoiceNumber}</span>
                        <p className="text-slate-500">{formatDate(bill.date, true)}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold block">
                          {formatCurrency(bill.grandTotal, shopSettings?.currencySymbol)}
                        </span>
                        <span className="text-[11px] text-slate-400">{bill.paymentMode}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">No POS purchases recorded</p>
                )}
              </div>
            </div>

            {/* Repair Jobs History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-teal-500" />
                Repair Job History ({customerLedger?.repairHistory?.length || 0})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(customerLedger?.repairHistory || []).length > 0 ? (
                  customerLedger.repairHistory.map((rep) => (
                    <div
                      key={rep._id}
                      className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {rep.ticketNumber} • {rep.deviceDetails?.brand} {rep.deviceDetails?.model}
                        </span>
                        <p className="text-slate-500 truncate max-w-sm">{rep.problemDescription}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-teal-600 block">
                          {rep.status}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatCurrency(rep.financials?.grandTotal || 0, shopSettings?.currencySymbol)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">No past repair tickets</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Settle Due Sub-Modal */}
      <Modal
        isOpen={isDueModalOpen}
        onClose={() => setIsDueModalOpen(false)}
        title="Record Due Payment"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Payment Amount (₹) *"
            type="number"
            value={dueAmountPaid}
            onChange={(e) => setDueAmountPaid(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="secondary" onClick={() => setIsDueModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={settleDueMutation.isPending}
              onClick={() =>
                settleDueMutation.mutate({
                  id: selectedCustomer._id,
                  amountPaid: Number(dueAmountPaid)
                })
              }
            >
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Customer Name"
            required
            placeholder="e.g. Ramesh Kumar"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Phone Number"
            required
            placeholder="10 Digits"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email"
            placeholder="customer@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Address"
            placeholder="Full postal address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Input
            label="GSTIN (Optional)"
            placeholder="e.g. 29ABCDE1234F1Z5"
            value={formData.gstNumber}
            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
          />
          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCustomerModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saveCustomerMutation.isPending}>
              {editingCustomer ? 'Update Customer' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomersPage;
