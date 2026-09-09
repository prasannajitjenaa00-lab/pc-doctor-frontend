import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  TrendingUp,
  Wrench,
  Package,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Boxes,
  ArrowUpRight,
  Receipt,
  Plus
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import api from '../services/api';
import { useShop } from '../context/ShopContext';
import { formatCurrency, formatDate, getRepairStatusBadge } from '../utils/formatters';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeleton';

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { isDarkMode, shopSettings } = useShop();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data;
    }
  });

  const cards = data?.cards || {};
  const charts = data?.charts || {};
  const recent = data?.recent || {};

  // Sales Trend Chart Data
  const salesChartData = {
    labels: charts.salesChart?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sales Revenue',
        data: charts.salesChart?.sales || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#2563eb',
        borderWidth: 2
      },
      {
        label: 'Gross Profit',
        data: charts.salesChart?.profit || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#10b981',
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDarkMode ? '#cbd5e1' : '#475569',
          font: { family: 'Inter', size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.raw, shopSettings?.currencySymbol)}`
        }
      }
    },
    scales: {
      x: {
        grid: { color: isDarkMode ? '#334155' : '#f1f5f9' },
        ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' }
      },
      y: {
        grid: { color: isDarkMode ? '#334155' : '#f1f5f9' },
        ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' }
      }
    }
  };

  // Repair Status Doughnut Chart Data
  const repairLabels = Object.keys(charts.repairStatistics || {});
  const repairCounts = Object.values(charts.repairStatistics || {});

  const repairDoughnutData = {
    labels: repairLabels.length > 0 ? repairLabels : ['No Repairs'],
    datasets: [
      {
        data: repairCounts.length > 0 ? repairCounts : [1],
        backgroundColor: [
          '#3b82f6', // Received - Blue
          '#6366f1', // Diagnosing - Indigo
          '#f59e0b', // Waiting Approval - Amber
          '#f97316', // Waiting Parts - Orange
          '#a855f7', // Repairing - Purple
          '#06b6d4', // Quality Check - Cyan
          '#10b981', // Ready Pickup - Emerald
          '#22c55e', // Delivered - Green
          '#ef4444'  // Cancelled - Rose
        ],
        borderWidth: 0
      }
    ]
  };

  // Top Products Bar Chart
  const topProductsLabels = (charts.topSellingProducts || []).map((p) => p._id);
  const topProductsQty = (charts.topSellingProducts || []).map((p) => p.totalQty);

  const topProductsData = {
    labels: topProductsLabels.length > 0 ? topProductsLabels : ['No Sales Yet'],
    datasets: [
      {
        label: 'Units Sold',
        data: topProductsQty.length > 0 ? topProductsQty : [0],
        backgroundColor: '#3b82f6',
        borderRadius: 6
      }
    ]
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Operations Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time sales, repair intake, and stock performance overview
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/billing')}
            className="w-full sm:w-auto justify-center text-xs sm:text-sm"
          >
            Create Bill
          </Button>
          <Button
            variant="secondary"
            icon={Wrench}
            onClick={() => navigate('/repairs')}
            className="w-full sm:w-auto justify-center text-xs sm:text-sm"
          >
            New Ticket
          </Button>
        </div>
      </div>

      {/* Row 1: Core Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <Card hover className="relative overflow-hidden border-l-4 border-l-blue-600">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Today's Sales
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                {formatCurrency(cards.todaySales, shopSettings?.currencySymbol)}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                Profit: {formatCurrency(cards.todayProfit, shopSettings?.currencySymbol)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Monthly Sales */}
        <Card hover className="relative overflow-hidden border-l-4 border-l-indigo-600">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                This Month's Sales
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                {formatCurrency(cards.monthlySales, shopSettings?.currencySymbol)}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                Profit: {formatCurrency(cards.monthlyProfit, shopSettings?.currencySymbol)}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Repair Revenue */}
        <Card hover className="relative overflow-hidden border-l-4 border-l-teal-600">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Repair Revenue
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                {formatCurrency(cards.repairRevenue, shopSettings?.currencySymbol)}
              </h3>
              <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-1">
                From completed jobs
              </p>
            </div>
            <div className="p-3 bg-teal-50 dark:bg-teal-950/60 rounded-xl text-teal-600 dark:text-teal-400">
              <Wrench className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Total Lifetime Sales */}
        <Card hover className="relative overflow-hidden border-l-4 border-l-purple-600">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Lifetime Sales
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                {formatCurrency(cards.totalSales, shopSettings?.currencySymbol)}
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
                Profit: {formatCurrency(cards.totalProfit, shopSettings?.currencySymbol)}
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Operational Counters (Repair Queue, Alerts, Inventory) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Pending Repairs */}
        <Card
          hover
          onClick={() => navigate('/repairs')}
          className="cursor-pointer bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/60 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {cards.pendingRepairs || 0}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">In Progress</p>
            </div>
          </div>
        </Card>

        {/* Ready For Pickup */}
        <Card
          hover
          onClick={() => navigate('/repairs')}
          className="cursor-pointer bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {cards.readyForPickup || 0}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Ready Pickup</p>
            </div>
          </div>
        </Card>

        {/* Low Stock Alert */}
        <Card
          hover
          onClick={() => navigate('/inventory')}
          className="cursor-pointer bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-900/60 rounded-xl text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                {cards.lowStock || 0}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Low Stock</p>
            </div>
          </div>
        </Card>

        {/* Total Products */}
        <Card
          hover
          onClick={() => navigate('/products')}
          className="cursor-pointer p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {cards.productsCount || 0}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Products</p>
            </div>
          </div>
        </Card>

        {/* Total Customers */}
        <Card
          hover
          onClick={() => navigate('/customers')}
          className="cursor-pointer p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {cards.customersCount || 0}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Customers</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3: Interactive Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit 7-day Trend Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Sales & Profit Trend (Last 7 Days)"
            subtitle="Continuous revenue performance"
          />
          <div className="h-72 w-full pt-2">
            <Line data={salesChartData} options={chartOptions} />
          </div>
        </Card>

        {/* Repair Status Doughnut */}
        <Card>
          <CardHeader
            title="Repair Status Pipeline"
            subtitle="Device workload breakdown"
          />
          <div className="h-72 w-full flex items-center justify-center p-2">
            {repairLabels.length > 0 ? (
              <Doughnut
                data={repairDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { boxWidth: 12, font: { size: 11 }, color: isDarkMode ? '#cbd5e1' : '#475569' }
                    }
                  }
                }}
              />
            ) : (
              <div className="text-center text-slate-400">
                <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No repair records yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Row 4: Recent Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <Card>
          <CardHeader
            title="Recent Billing Transactions"
            subtitle="Latest POS sales"
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/billing')}
                className="text-blue-600 text-xs gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            }
          />
          <div className="space-y-3">
            {(recent.bills || []).length > 0 ? (
              (recent.bills || []).map((bill) => (
                <div
                  key={bill._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {bill.invoiceNumber}
                      </span>
                      <Badge size="sm" variant={bill.status === 'Paid' ? 'green' : 'amber'}>
                        {bill.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {bill.customerSnapshot?.name || 'Walk-in Customer'} • {formatDate(bill.date, true)}
                    </p>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {formatCurrency(bill.grandTotal, shopSettings?.currencySymbol)}
                    </p>
                    <span className="text-[11px] text-slate-400">{bill.paymentMode}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">No recent bills found</div>
            )}
          </div>
        </Card>

        {/* Recent Repairs */}
        <Card>
          <CardHeader
            title="Recent Repair Jobs"
            subtitle="Latest device intakes"
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/repairs')}
                className="text-blue-600 text-xs gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            }
          />
          <div className="space-y-3">
            {(recent.repairs || []).length > 0 ? (
              (recent.repairs || []).map((rep) => {
                const badge = getRepairStatusBadge(rep.status);
                return (
                  <div
                    key={rep._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {rep.ticketNumber}
                        </span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {rep.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                        {rep.deviceDetails?.brand} {rep.deviceDetails?.model} ({rep.deviceDetails?.deviceType})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {rep.customerDetails?.name} • {formatDate(rep.receivedDate)}
                      </p>
                    </div>
                    <div className="text-right pl-3 shrink-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {formatCurrency(rep.financials?.grandTotal || 0, shopSettings?.currencySymbol)}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/repairs`)}
                        className="text-xs py-1 px-2 mt-1"
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">No recent repairs found</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
