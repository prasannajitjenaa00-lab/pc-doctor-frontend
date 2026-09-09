import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Truck, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../components/common/Table';
import { TableSkeleton } from '../components/common/Skeleton';

export const SuppliersPage = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    notes: ''
  });

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers-list', search],
    queryFn: async () => {
      const res = await api.get('/suppliers', { params: { search } });
      return res.data || [];
    }
  });

  const saveSupplierMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingSupplier) {
        const res = await api.put(`/suppliers/${editingSupplier._id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/suppliers', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success(editingSupplier ? 'Supplier updated' : 'Supplier added');
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      setIsModalOpen(false);
      setEditingSupplier(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to save supplier')
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/suppliers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Supplier removed');
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
    },
    onError: (err) => toast.error(err.message || 'Cannot delete supplier')
  });

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({ name: '', company: '', phone: '', email: '', address: '', gstNumber: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      company: s.company,
      phone: s.phone,
      email: s.email || '',
      address: s.address || '',
      gstNumber: s.gstNumber || '',
      notes: s.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.phone.trim()) {
      toast.error('Company name and phone number are required');
      return;
    }
    saveSupplierMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Supplier Directory
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Hardware distributors, component vendors, and procurement contacts
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenAdd} className="w-full sm:w-auto">
          Add Supplier
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search suppliers by company or contact name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Company / Firm</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Phone / Mobile</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Address</TableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {suppliers.length > 0 ? (
              suppliers.map((s) => (
                <TableRow key={s._id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{s.company}</div>
                    {s.email && <div className="text-xs text-slate-400">{s.email}</div>}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{s.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{s.phone}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-500">{s.gstNumber || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500 truncate max-w-xs block">{s.address || '-'}</span>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete supplier "${s.company}"?`)) {
                            deleteSupplierMutation.mutate(s._id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableEmpty message="No suppliers registered" colSpan={6} />
            )}
          </TableBody>
        </Table>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Company / Firm Name *"
            required
            placeholder="e.g. Silicon Tech Distributers"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />
          <Input
            label="Contact Person Name *"
            required
            placeholder="e.g. Anand Kumar"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone Number *"
              required
              placeholder="10 Digits"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Email"
              placeholder="sales@supplier.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <Input
            label="GSTIN (Optional)"
            placeholder="e.g. 29ABCDE1234F1Z5"
            value={formData.gstNumber}
            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
          />
          <Input
            label="Address / Market Location"
            placeholder="Shop #, Market, City"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saveSupplierMutation.isPending}>
              {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuppliersPage;
