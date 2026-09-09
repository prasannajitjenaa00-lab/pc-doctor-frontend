import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Settings, Save, Store, ShieldCheck, Receipt, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useShop } from '../context/ShopContext';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export const SettingsPage = () => {
  const { shopSettings, refreshSettings } = useShop();

  const [formData, setFormData] = useState({
    shopName: '',
    tagline: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    invoicePrefix: 'INV',
    repairPrefix: 'REP',
    defaultGstRate: 18,
    currencySymbol: '₹',
    upiId: '',
    invoiceFooter: '',
    termsAndConditions: ''
  });

  useEffect(() => {
    if (shopSettings) {
      setFormData({
        shopName: shopSettings.shopName || 'PC Doctor',
        tagline: shopSettings.tagline || '',
        phone: shopSettings.phone || '',
        alternatePhone: shopSettings.alternatePhone || '',
        email: shopSettings.email || '',
        address: shopSettings.address || '',
        city: shopSettings.city || '',
        state: shopSettings.state || '',
        pincode: shopSettings.pincode || '',
        gstNumber: shopSettings.gstNumber || '',
        invoicePrefix: shopSettings.invoicePrefix || 'INV',
        repairPrefix: shopSettings.repairPrefix || 'REP',
        defaultGstRate: shopSettings.defaultGstRate !== undefined ? shopSettings.defaultGstRate : 18,
        currencySymbol: shopSettings.currencySymbol || '₹',
        upiId: shopSettings.upiId || '',
        invoiceFooter: shopSettings.invoiceFooter || '',
        termsAndConditions: shopSettings.termsAndConditions || ''
      });
    }
  }, [shopSettings]);

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put('/settings', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Shop settings updated successfully!');
      refreshSettings();
    },
    onError: (err) => toast.error(err.message || 'Failed to update settings')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Shop & Invoice Settings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure store branding, GST details, invoice numbering prefixes, and legal terms
          </p>
        </div>

        <Button
          variant="primary"
          icon={Save}
          loading={updateMutation.isPending}
          onClick={handleSubmit}
          className="w-full sm:w-auto"
        >
          Save Changes
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Shop Profile & Identity */}
        <Card>
          <CardHeader
            title="Shop Identity & Branding"
            subtitle="Displayed at the top of printable invoices, tickets and receipts"
          />
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Shop Business Name *"
                required
                placeholder="e.g. PC Doctor - Computer & Laptop Solutions"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              />
              <Input
                label="Tagline / Specialty"
                placeholder="e.g. Laptop, CCTV & Networking Solutions"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Primary Phone / Helpline *"
                required
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Alternate Phone"
                placeholder="+91 98765 00000"
                value={formData.alternatePhone}
                onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
              />
              <Input
                label="Shop Email"
                placeholder="support@pcdoctor.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <Input
              label="Shop Physical Address"
              placeholder="Shop #, Street / Road, Market Name"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City"
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <Input
                label="State"
                placeholder="e.g. Maharashtra"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
              <Input
                label="Postal / PIN Code"
                placeholder="e.g. 400001"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Card 2: GSTIN, Tax & Numbering Prefixes */}
        <Card>
          <CardHeader
            title="GST, Taxes & Invoice Configuration"
            subtitle="Prefix rules for auto-generated billing and repair numbers"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Shop GST Number (GSTIN)"
              placeholder="e.g. 27ABCDE1234F1Z5"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            />
            <Input
              label="Default GST Rate (%)"
              type="number"
              value={formData.defaultGstRate}
              onChange={(e) => setFormData({ ...formData, defaultGstRate: Number(e.target.value) })}
            />
            <Input
              label="Sales Invoice Prefix"
              placeholder="INV"
              value={formData.invoicePrefix}
              onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
            />
            <Input
              label="Repair Ticket Prefix"
              placeholder="REP"
              value={formData.repairPrefix}
              onChange={(e) => setFormData({ ...formData, repairPrefix: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Input
              label="Currency Symbol"
              placeholder="₹"
              value={formData.currencySymbol}
              onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
            />
            <Input
              label="UPI ID (for payments)"
              placeholder="e.g. shopname@okaxis"
              value={formData.upiId}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
            />
          </div>
        </Card>

        {/* Card 3: Invoices & Repair Terms */}
        <Card>
          <CardHeader
            title="Invoice Footer & Repair Terms"
            subtitle="Appears on generated PDFs and printouts"
          />
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Invoice Footer Note
              </label>
              <textarea
                rows={2}
                value={formData.invoiceFooter}
                onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Repair Terms & Conditions
              </label>
              <textarea
                rows={4}
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs"
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Save}
            loading={updateMutation.isPending}
          >
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
