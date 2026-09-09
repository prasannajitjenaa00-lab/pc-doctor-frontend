import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  Layers,
  Wrench,
  Package,
  IndianRupee
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import { config } from '../config';
import { useShop } from '../context/ShopContext';
import { formatCurrency } from '../utils/formatters';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { CardSkeleton } from '../components/common/Skeleton';

export const ReportsPage = () => {
  const { isDarkMode, shopSettings } = useShop();
  const [reportPeriod, setReportPeriod] = useState('monthly'); // daily, monthly, yearly

  // Fetch Sales Reports
  const { data: salesReport, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-report', reportPeriod],
    queryFn: async () => {
      const res = await api.get('/reports/sales', { params: { period: reportPeriod } });
      return res.data || {};
    }
  });

  // Fetch Repair Reports
  const { data: repairReport, isLoading: repairLoading } = useQuery({
    queryKey: ['repair-report'],
    queryFn: async () => {
      const res = await api.get('/reports/repairs');
      return res.data || {};
    }
  });

  // Fetch Inventory Valuation
  const { data: inventoryReport, isLoading: invLoading } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: async () => {
      const res = await api.get('/reports/inventory');
      return res.data || {};
    }
  });

  // Sales Trend Chart
  const trendLabels = (salesReport?.trends || []).map((t) => t._id);
  const trendSales = (salesReport?.trends || []).map((t) => t.totalSales);
  const trendProfit = (salesReport?.trends || []).map((t) => t.totalProfit);

  const salesTrendData = {
    labels: trendLabels.length > 0 ? trendLabels : ['No Data'],
    datasets: [
      {
        label: 'Gross Sales',
        data: trendSales.length > 0 ? trendSales : [0],
        backgroundColor: '#3b82f6',
        borderRadius: 6
      },
      {
        label: 'Gross Profit',
        data: trendProfit.length > 0 ? trendProfit : [0],
        backgroundColor: '#10b981',
        borderRadius: 6
      }
    ]
  };

  // Device Breakdown Bar Chart
  const deviceLabels = (repairReport?.byDeviceType || []).map((d) => d._id);
  const deviceCounts = (repairReport?.byDeviceType || []).map((d) => d.count);

  const deviceChartData = {
    labels: deviceLabels.length > 0 ? deviceLabels : ['No Data'],
    datasets: [
      {
        label: 'Repairs by Device Type',
        data: deviceCounts.length > 0 ? deviceCounts : [0],
        backgroundColor: '#0f766e',
        borderRadius: 6
      }
    ]
  };

  if (salesLoading || repairLoading || invLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const summary = salesReport?.summary || {};
  const val = inventoryReport?.valuation || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Financial & Operational Reports
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyze profit margins, sales trends, repair turnaround, and inventory assets
          </p>
        </div>

        {/* Excel Export Quick Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <a
            href={config.endpoints.salesExcel()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors w-full sm:w-auto text-center"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Sales Excel</span>
          </a>
          <a
            href={config.endpoints.inventoryExcel()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors w-full sm:w-auto text-center"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Stock Excel</span>
          </a>
        </div>
      </div>

      {/* Row 1: KPI Asset & Performance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Sales Revenue
          </span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(summary.totalSales, shopSettings?.currencySymbol)}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{summary.totalBills || 0} Total Orders</p>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Gross Profit
          </span>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(summary.totalProfit, shopSettings?.currencySymbol)}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Net margin after product cost</p>
        </Card>

        <Card className="border-l-4 border-l-teal-600">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Repair Service Revenue
          </span>
          <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {formatCurrency(repairReport?.financials?.totalRevenue || 0, shopSettings?.currencySymbol)}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Labour + Replaced Components</p>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Stock Asset Value
          </span>
          <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {formatCurrency(val.totalAssetValue || 0, shopSettings?.currencySymbol)}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{val.totalStockQuantity || 0} items currently on shelves</p>
        </Card>
      </div>

      {/* Row 2: Sales Trends Period Selector & Chart */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Revenue & Gross Profit Performance
            </h3>
            <p className="text-xs text-slate-500">Comparative revenue vs cost margins</p>
          </div>

          {/* Period Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {['daily', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReportPeriod(p)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  reportPeriod === p
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <Bar
            data={salesTrendData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: { color: isDarkMode ? '#cbd5e1' : '#475569' }
                }
              },
              scales: {
                x: { grid: { color: isDarkMode ? '#334155' : '#f1f5f9' }, ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' } },
                y: { grid: { color: isDarkMode ? '#334155' : '#f1f5f9' }, ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' } }
              }
            }}
          />
        </div>
      </Card>

      {/* Row 3: Repairs Distribution & Inventory Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repairs By Device Type */}
        <Card>
          <CardHeader
            title="Repair Volume by Device Category"
            subtitle="Most common device intakes"
          />
          <div className="h-64 w-full pt-2">
            <Bar
              data={deviceChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' } },
                  y: { ticks: { color: isDarkMode ? '#94a3b8' : '#64748b', precision: 0 } }
                }
              }}
            />
          </div>
        </Card>

        {/* Inventory Category Assets Breakdown */}
        <Card>
          <CardHeader
            title="Inventory Asset Value by Category"
            subtitle="Capital invested in hardware"
          />
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {(inventoryReport?.categoryValuation || []).map((cat, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{cat.categoryName}</h4>
                  <p className="text-slate-500">{cat.itemCount} unique products • {cat.stockQty} total units</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    {formatCurrency(cat.assetValue, shopSettings?.currencySymbol)}
                  </span>
                  <span className="text-[11px] text-slate-400">Inventory Cost</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
