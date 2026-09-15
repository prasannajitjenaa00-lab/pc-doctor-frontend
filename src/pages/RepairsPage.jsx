import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Laptop,
  Printer,
  FileDown,
  Share2,
  Camera,
  Trash2,
  ChevronRight,
  Sliders,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { config } from '../config';
import { useShop } from '../context/ShopContext';
import {
  formatCurrency,
  formatDate,
  getRepairStatusBadge,
  generateWhatsAppRepairLink
} from '../utils/formatters';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';

const STATUS_PIPELINE = [
  'Received',
  'Diagnosing',
  'Waiting Approval',
  'Waiting Parts',
  'Repairing',
  'Quality Check',
  'Ready Pickup',
  'Delivered',
  'Cancelled'
];

export const RepairsPage = () => {
  const queryClient = useQueryClient();
  const { shopSettings } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDeviceType, setSelectedDeviceType] = useState('');

  // Modals
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [activeRepairJob, setActiveRepairJob] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // New Ticket Form State
  const [formData, setFormData] = useState({
    customerDetails: { name: '', phone: '', email: '', address: '' },
    deviceDetails: {
      deviceType: 'Laptop',
      brand: '',
      model: '',
      serialNumber: '',
      color: '',
      devicePassword: '',
      accessoriesReceived: ['Power Adapter'],
      condition: {
        screen: 'Good',
        body: 'Good',
        keyboard: 'Working',
        battery: 'Working',
        camera: 'Working',
        speakers: 'Working',
        usbPorts: 'Working',
        hdmi: 'Working',
        wifi: 'Working',
        touchpad: 'Working',
        powerButton: 'Working'
      }
    },
    problemDescription: '',
    selectedServices: ['Windows Installation'],
    estimatedCost: 500,
    advancePaid: 0,
    expectedDeliveryDate: ''
  });

  // Fetch Service Checklist Templates
  const { data: templates = {} } = useQuery({
    queryKey: ['repair-templates'],
    queryFn: async () => {
      const res = await api.get('/repairs/templates');
      return res.data || {};
    }
  });

  // Fetch Repair Jobs
  const { data: repairsData, isLoading } = useQuery({
    queryKey: ['repair-jobs', searchQuery, selectedStatus, selectedDeviceType],
    queryFn: async () => {
      const res = await api.get('/repairs', {
        params: {
          search: searchQuery,
          status: selectedStatus || undefined,
          deviceType: selectedDeviceType || undefined
        }
      });
      return res.data || [];
    }
  });

  const repairJobs = repairsData || [];

  // Fetch Inventory Products for Parts Selector
  const { data: inventoryProducts = [] } = useQuery({
    queryKey: ['repair-inventory-products'],
    queryFn: async () => {
      const res = await api.get('/products?limit=100');
      return res.data || [];
    }
  });

  // Create Job Ticket Mutation
  const createJobMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/repairs', payload);
      return res.data;
    },
    onSuccess: (newJob) => {
      toast.success(`Ticket #${newJob.ticketNumber} created!`);
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] });
      setIsNewTicketModalOpen(false);
      // Reset form
      setFormData({
        customerDetails: { name: '', phone: '', email: '', address: '' },
        deviceDetails: {
          deviceType: 'Laptop',
          brand: '',
          model: '',
          serialNumber: '',
          color: '',
          devicePassword: '',
          accessoriesReceived: ['Power Adapter'],
          condition: {
            screen: 'Good',
            body: 'Good',
            keyboard: 'Working',
            battery: 'Working',
            camera: 'Working',
            speakers: 'Working',
            usbPorts: 'Working',
            hdmi: 'Working',
            wifi: 'Working',
            touchpad: 'Working',
            powerButton: 'Working'
          }
        },
        problemDescription: '',
        selectedServices: ['Windows Installation'],
        estimatedCost: 500,
        advancePaid: 0,
        expectedDeliveryDate: ''
      });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create job ticket');
    }
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }) => {
      const res = await api.patch(`/repairs/${id}/status`, { status, notes });
      return res.data;
    },
    onSuccess: (updated) => {
      toast.success(`Status moved to ${updated.status}`);
      setActiveRepairJob(updated);
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] });
    }
  });

  // Toggle Checklist Mutation
  const toggleChecklistMutation = useMutation({
    mutationFn: async ({ id, serviceIndex, taskIndex, completed }) => {
      const res = await api.patch(`/repairs/${id}/checklist`, { serviceIndex, taskIndex, completed });
      return res.data;
    },
    onSuccess: (updated) => {
      setActiveRepairJob(updated);
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] });
    }
  });

  // Add Part Mutation
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [partPrice, setPartPrice] = useState(0);

  const addPartMutation = useMutation({
    mutationFn: async ({ id, productId, quantity, unitPrice }) => {
      const res = await api.post(`/repairs/${id}/parts`, { productId, quantity, unitPrice });
      return res.data;
    },
    onSuccess: (updated) => {
      toast.success('Part added to repair and stock reduced!');
      setActiveRepairJob(updated);
      setSelectedPartId('');
      setPartPrice(0);
      setPartQty(1);
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['repair-inventory-products'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to add part')
  });

  // Remove Part Mutation
  const removePartMutation = useMutation({
    mutationFn: async ({ id, partId }) => {
      const res = await api.delete(`/repairs/${id}/parts/${partId}`);
      return res.data;
    },
    onSuccess: (updated) => {
      toast.success('Part removed and stock restored');
      setActiveRepairJob(updated);
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['repair-inventory-products'] });
    }
  });

  const handleOpenDetail = async (job) => {
    try {
      const res = await api.get(`/repairs/${job._id}`);
      setActiveRepairJob(res.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      toast.error('Failed to load repair details');
    }
  };

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!formData.customerDetails.name?.trim() || !formData.customerDetails.phone?.trim()) {
      toast.error('Customer name and phone number are required');
      return;
    }

    createJobMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-teal-600" />
            Repair Jobs Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Device intake ticketing, inspection checklist, parts consumption & timeline tracking
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsNewTicketModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 focus:ring-teal-500 shadow-md shadow-teal-500/20 w-full sm:w-auto"
        >
          New Job Ticket
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by ticket #, customer name, phone, serial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All Statuses</option>
          {STATUS_PIPELINE.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        <select
          value={selectedDeviceType}
          onChange={(e) => setSelectedDeviceType(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All Devices</option>
          <option value="Laptop">Laptop</option>
          <option value="Desktop">Desktop</option>
          <option value="Printer">Printer</option>
          <option value="CCTV">CCTV</option>
          <option value="Networking">Networking</option>
          <option value="Mobile">Mobile</option>
          <option value="Tablet">Tablet</option>
        </select>
      </div>

      {/* Repair Tickets Grid/List */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : repairJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {repairJobs.map((job) => {
            const badge = getRepairStatusBadge(job.status);
            return (
              <Card
                key={job._id}
                hover
                onClick={() => handleOpenDetail(job)}
                className="cursor-pointer border-t-4 border-t-teal-600 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-mono font-bold text-xs text-teal-700 dark:text-teal-400">
                      {job.ticketNumber}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                    {job.deviceDetails?.brand} {job.deviceDetails?.model}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {job.deviceDetails?.deviceType} • S/N: {job.deviceDetails?.serialNumber || 'N/A'}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300 mb-3">
                    <p className="font-semibold text-rose-600 dark:text-rose-400 mb-0.5">Problem:</p>
                    <p className="line-clamp-2">{job.problemDescription}</p>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <p>
                      <strong className="text-slate-900 dark:text-slate-200">Customer:</strong> {job.customerDetails?.name} ({job.customerDetails?.phone})
                    </p>
                    <p>
                      <strong className="text-slate-900 dark:text-slate-200">Received:</strong> {formatDate(job.receivedDate || job.createdAt)}
                    </p>
                    {job.expectedDeliveryDate && (
                      <p className="text-amber-600 dark:text-amber-400">
                        <strong>Target Delivery:</strong> {formatDate(job.expectedDeliveryDate)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Estimate / Total</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(job.financials?.grandTotal || job.financials?.estimatedCost || 0, shopSettings?.currencySymbol)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs py-1 px-2.5">
                    View Details →
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="py-16 text-center text-slate-400">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-600" />
          <p className="text-base font-medium text-slate-700 dark:text-slate-300">No repair jobs found</p>
          <p className="text-xs text-slate-400 mt-1">Create a new job ticket to begin tracking repairs</p>
        </Card>
      )}

      {/* MODAL 1: Create New Repair Intake Ticket */}
      <Modal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        title="New Repair Job Intake Ticket"
        subtitle="Capture device specs, physical inspection checklist, and selected service presets"
        size="xl"
      >
        <form onSubmit={handleCreateTicket} className="space-y-6">
          {/* Section A: Customer Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-2">
              1. Customer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input
                label="Customer Name"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.customerDetails.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customerDetails: { ...formData.customerDetails, name: e.target.value }
                  })
                }
              />
              <Input
                label="Phone Number"
                required
                placeholder="10 Digits"
                value={formData.customerDetails.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customerDetails: { ...formData.customerDetails, phone: e.target.value }
                  })
                }
              />
              <Input
                label="Email (Optional)"
                placeholder="customer@email.com"
                value={formData.customerDetails.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customerDetails: { ...formData.customerDetails, email: e.target.value }
                  })
                }
              />
              <Input
                label="Address / Area"
                placeholder="Apartment, City"
                value={formData.customerDetails.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customerDetails: { ...formData.customerDetails, address: e.target.value }
                  })
                }
              />
            </div>
          </div>

          {/* Section B: Device Specifications */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-2">
              2. Device Specifications & Problem
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Device Type
                </label>
                <select
                  value={formData.deviceDetails.deviceType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deviceDetails: { ...formData.deviceDetails, deviceType: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Printer">Printer</option>
                  <option value="CCTV">CCTV</option>
                  <option value="Networking">Networking</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <Input
                label="Brand"
                placeholder="e.g. Dell, HP, Lenovo"
                value={formData.deviceDetails.brand}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deviceDetails: { ...formData.deviceDetails, brand: e.target.value }
                  })
                }
              />
              <Input
                label="Model / Series"
                placeholder="e.g. Inspiron 15 3501"
                value={formData.deviceDetails.model}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deviceDetails: { ...formData.deviceDetails, model: e.target.value }
                  })
                }
              />
              <Input
                label="Serial Number / Service Tag"
                placeholder="e.g. 7X9K2B3"
                value={formData.deviceDetails.serialNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deviceDetails: { ...formData.deviceDetails, serialNumber: e.target.value }
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <Input
                label="Accessories Received (comma separated)"
                placeholder="e.g. Power Adapter, Laptop Bag, Wireless Mouse"
                value={formData.deviceDetails.accessoriesReceived.join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deviceDetails: {
                      ...formData.deviceDetails,
                      accessoriesReceived: e.target.value.split(',').map((s) => s.trim())
                    }
                  })
                }
              />
              <Input
                label="Device Unlock PIN / Password"
                placeholder="e.g. 1234 or 'None'"
                value={formData.deviceDetails.devicePassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deviceDetails: { ...formData.deviceDetails, devicePassword: e.target.value }
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Problem Description & Symptoms
              </label>
              <textarea
                rows={2}
                placeholder="Detail customer complaints (e.g. No display, blue screen error 0x0000007B, liquid spill on keyboard...)"
                value={formData.problemDescription}
                onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          {/* Section C: Preset Services & Auto-Checklist Selection */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-2">
              3. Preset Services (Auto-Loads Technician Checklists)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
              {Object.keys(templates).map((serviceName) => {
                const isSelected = formData.selectedServices.includes(serviceName);
                return (
                  <button
                    key={serviceName}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        selectedServices: isSelected
                          ? prev.selectedServices.filter((s) => s !== serviceName)
                          : [...prev.selectedServices, serviceName]
                      }));
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left truncate transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {serviceName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section D: Physical Inspection Checklist Matrix */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-2">
              4. Physical Condition Matrix (At Receiving)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
              {[
                { key: 'screen', label: 'Screen', options: ['Good', 'Scratched', 'Cracked', 'No Display'] },
                { key: 'body', label: 'Body/Hinges', options: ['Good', 'Minor Scratches', 'Broken Hinges', 'Dented'] },
                { key: 'keyboard', label: 'Keyboard', options: ['Working', 'Keys Missing', 'Faulty', 'N/A'] },
                { key: 'battery', label: 'Battery', options: ['Working', 'Degraded', 'Dead', 'Swollen'] },
                { key: 'usbPorts', label: 'USB Ports', options: ['Working', 'Loose', 'Damaged'] },
                { key: 'powerButton', label: 'Power Button', options: ['Working', 'Stuck', 'Broken'] },
                { key: 'wifi', label: 'Wi-Fi / BT', options: ['Working', 'Weak', 'Not Working'] },
                { key: 'touchpad', label: 'Touchpad', options: ['Working', 'Dead', 'Erratic'] }
              ].map(({ key, label, options }) => (
                <div key={key} className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{label}</span>
                  <select
                    value={formData.deviceDetails.condition[key]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deviceDetails: {
                          ...formData.deviceDetails,
                          condition: { ...formData.deviceDetails.condition, [key]: e.target.value }
                        }
                      })
                    }
                    className="w-full text-xs py-1 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Section E: Estimates & Schedule */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Estimated Cost (₹)"
              type="number"
              value={formData.estimatedCost}
              onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
            />
            <Input
              label="Advance Paid (₹)"
              type="number"
              value={formData.advancePaid}
              onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })}
            />
            <Input
              label="Expected Delivery Date"
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsNewTicketModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createJobMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Generate Ticket & Checklist
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Full Repair Job Detail & Workflow Management */}
      {activeRepairJob && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Ticket #${activeRepairJob.ticketNumber} • ${activeRepairJob.deviceDetails?.brand} ${activeRepairJob.deviceDetails?.model}`}
          subtitle={`Customer: ${activeRepairJob.customerDetails?.name} (${activeRepairJob.customerDetails?.phone})`}
          size="2xl"
        >
          <div className="space-y-6">
            {/* Top Pipeline Status Bar */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Status Pipeline
                </span>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  {activeRepairJob.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_PIPELINE.map((st) => {
                  const isActive = activeRepairJob.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: activeRepairJob._id, status: st })}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isActive ? '✓ ' : ''}{st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Two Column Workspace: Left Checklists & Parts; Right Financials & Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 cols): Checklists & Parts Used */}
              <div className="lg:col-span-7 space-y-4">
                {/* Auto Checklists Accordion */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Technician Service Checklists ({activeRepairJob.services?.length || 0})
                  </h4>

                  {(activeRepairJob.services || []).map((srv, srvIdx) => (
                    <div
                      key={srvIdx}
                      className="p-3.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-sm text-teal-700 dark:text-teal-400">
                          {srv.serviceName}
                        </h5>
                        <span className="text-xs text-slate-400">
                          {srv.checklist?.filter((t) => t.completed).length} / {srv.checklist?.length || 0} Done
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {(srv.checklist || []).map((task, tIdx) => (
                          <label
                            key={tIdx}
                            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={(e) =>
                                toggleChecklistMutation.mutate({
                                  id: activeRepairJob._id,
                                  serviceIndex: srvIdx,
                                  taskIndex: tIdx,
                                  completed: e.target.checked
                                })
                              }
                              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 rounded border-slate-300"
                            />
                            <span
                              className={task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}
                            >
                              {task.task}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Parts Used & Stock Deduction */}
                <div className="p-3.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Parts Consumed (Inventory Auto-Deduction)
                  </h4>

                  {/* Add Part Selector */}
                  <div className="flex gap-2">
                    <select
                      value={selectedPartId}
                      onChange={(e) => {
                        setSelectedPartId(e.target.value);
                        const found = inventoryProducts.find((p) => p._id === e.target.value);
                        if (found) setPartPrice(found.sellingPrice);
                      }}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="">Select component from inventory...</option>
                      {inventoryProducts.map((p) => (
                        <option key={p._id} value={p._id} disabled={p.stock <= 0}>
                          {p.name} ({formatCurrency(p.sellingPrice, shopSettings?.currencySymbol)} • {p.stock} in stock)
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={partQty}
                      onChange={(e) => setPartQty(Number(e.target.value))}
                      className="w-14 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                    />

                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!selectedPartId || addPartMutation.isPending}
                      loading={addPartMutation.isPending}
                      onClick={() =>
                        addPartMutation.mutate({
                          id: activeRepairJob._id,
                          productId: selectedPartId,
                          quantity: partQty,
                          unitPrice: partPrice
                        })
                      }
                      className="text-xs"
                    >
                      Add Part
                    </Button>
                  </div>

                  {/* Parts List */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {(activeRepairJob.partsUsed || []).length > 0 ? (
                      activeRepairJob.partsUsed.map((part) => (
                        <div key={part._id} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {part.name}
                            </span>
                            <span className="text-slate-400 ml-2">
                              {formatCurrency(part.unitPrice, shopSettings?.currencySymbol)} × {part.quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">
                              {formatCurrency(part.total, shopSettings?.currencySymbol)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                removePartMutation.mutate({
                                  id: activeRepairJob._id,
                                  partId: part._id
                                })
                              }
                              className="text-rose-500 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-4 text-center text-slate-400 text-xs">No spare parts used yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Financials, PDF Documents & WhatsApp */}
              <div className="lg:col-span-5 space-y-4">
                {/* Financial Summary Card */}
                <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-200 dark:border-teal-900/60 space-y-2.5 text-xs">
                  <h4 className="font-bold text-sm text-teal-900 dark:text-teal-200">
                    Settlement & Financials
                  </h4>

                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Labour / Service Charge:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(activeRepairJob.financials?.labourCharge || 0, shopSettings?.currencySymbol)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Parts Hardware Cost:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(activeRepairJob.financials?.partsCost || 0, shopSettings?.currencySymbol)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Advance Received:</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(activeRepairJob.financials?.advancePaid || 0, shopSettings?.currencySymbol)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-teal-200 dark:border-teal-800 flex justify-between text-sm font-bold text-teal-900 dark:text-teal-100">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(activeRepairJob.financials?.grandTotal || 0, shopSettings?.currencySymbol)}</span>
                  </div>

                  <div className="flex justify-between text-xs font-bold pt-1">
                    <span>Balance Due:</span>
                    <span
                      className={
                        (activeRepairJob.financials?.dueAmount || 0) > 0
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }
                    >
                      {formatCurrency(activeRepairJob.financials?.dueAmount || 0, shopSettings?.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Document Downloads & WhatsApp */}
                <div className="space-y-2 pt-2">
                  {/* Download Intake Token PDF */}
                  <a
                    href={config.endpoints.repairTokenPdf(activeRepairJob._id)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Intake Token / Receipt
                  </a>

                  {/* Download Final Tax Invoice PDF */}
                  <a
                    href={config.endpoints.repairInvoicePdf(activeRepairJob._id)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Print Final Repair Tax Invoice
                  </a>

                  {/* Send Status Update on WhatsApp */}
                  {activeRepairJob.customerDetails?.phone && (
                    <a
                      href={generateWhatsAppRepairLink(activeRepairJob, shopSettings)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Send Status Update on WhatsApp
                    </a>
                  )}
                </div>

                {/* Timeline History */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Status Timeline
                  </h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs">
                    {(activeRepairJob.timeline || []).map((tl, i) => (
                      <div key={i} className="flex items-start gap-2 border-l-2 border-teal-500 pl-2">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{tl.status}</p>
                          <p className="text-[11px] text-slate-500">{tl.notes}</p>
                          <span className="text-[10px] text-slate-400">{formatDate(tl.timestamp, true)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RepairsPage;
