'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { FiDownload, FiTrendingUp, FiDollarSign, FiShoppingCart, FiPackage } from 'react-icons/fi';
import { reportsApi, transactionsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CurrencySummary {
  currency: string;
  totalSales: number;
  totalTransactions: number;
  totalItems: number;
  averageOrderValue: number;
  totalTax: number;
  totalDiscount: number;
}

interface SalesReport {
  period: string;
  startDate: string;
  endDate: string;
  summary: {
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    averageOrderValue: number;
    totalTax: number;
    totalDiscount: number;
  };
  byCurrency?: CurrencySummary[];
  data: Array<{
    period: string;
    revenue: number;
    transactions: number;
    items: number;
    tax: number;
  }>;
  paymentBreakdown: Array<{
    method: string;
    totalAmount: number;
    count: number;
  }>;
}

interface ProductsReport {
  bestSellers?: Array<{
    productId: string;
    productName: string;
    totalQuantitySold: number;
    totalRevenue: number;
    transactionCount: number;
  }>;
  lowStock?: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    lowStockThreshold: number;
    locationName: string;
    needsRestock: boolean;
  }>;
}

interface RevenueReport {
  startDate: string;
  endDate: string;
  groupBy: string;
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averageRevenuePerDay: number;
  };
  timeSeries: Array<{
    period: string;
    revenue: number;
    transactions: number;
    items: number;
    cumulativeRevenue: number;
  }>;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0], // Default to today
    endDate: new Date().toISOString().split('T')[0],
  });
  
  // Quick date presets
  const setDatePreset = (preset: 'today' | 'week' | 'month' | 'year') => {
    const end = new Date();
    let start = new Date();
    
    switch (preset) {
      case 'today':
        start = new Date();
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setDate(end.getDate() - 30);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [productsReport, setProductsReport] = useState<ProductsReport | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  
  // Supported currencies
  const currencies = [
    { code: 'ALL', name: 'Lek', symbol: 'L' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'Dollar', symbol: '$' },
  ];

  // Fetch all reports
  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch transactions directly (same as dashboard) for accurate currency data
      const startOfDay = new Date(dateRange.startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateRange.endDate);
      endOfDay.setHours(23, 59, 59, 999);

      const [salesRes, productsRes, revenueRes, transactionsRes] = await Promise.all([
        reportsApi.sales({
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
          period,
        }),
        reportsApi.products({
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
          type: 'all',
        }),
        reportsApi.revenue({
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
          groupBy: 'day',
        }),
        transactionsApi.getAll({
          fromDate: startOfDay.toISOString(),
          toDate: endOfDay.toISOString(),
          limit: 1000,
        }),
      ]);

      // Calculate revenue by currency from transactions (same logic as dashboard)
      const transactions = transactionsRes.data.data || [];
      const revenueByCurrency: Record<string, { totalSales: number; totalTransactions: number; totalItems: number }> = {
        'ALL': { totalSales: 0, totalTransactions: 0, totalItems: 0 },
        'EUR': { totalSales: 0, totalTransactions: 0, totalItems: 0 },
        'USD': { totalSales: 0, totalTransactions: 0, totalItems: 0 },
      };
      const txByCurrency: Record<string, Set<string>> = { 'ALL': new Set(), 'EUR': new Set(), 'USD': new Set() };

      transactions.forEach((t: any) => {
        if (t.status === 'completed' && t.items) {
          t.items.forEach((item: any) => {
            const currency = item.product?.currency || 'EUR';
            if (!revenueByCurrency[currency]) {
              revenueByCurrency[currency] = { totalSales: 0, totalTransactions: 0, totalItems: 0 };
              txByCurrency[currency] = new Set();
            }
            const itemTotal = Number(item.unitPrice || 0) * Number(item.quantity || 0);
            revenueByCurrency[currency].totalSales += itemTotal;
            revenueByCurrency[currency].totalItems += Number(item.quantity || 1);
            txByCurrency[currency].add(t.id);
          });
        }
      });

      // Set transaction counts
      Object.keys(revenueByCurrency).forEach(currency => {
        revenueByCurrency[currency].totalTransactions = txByCurrency[currency]?.size || 0;
      });

      // Build byCurrency array
      const byCurrency = Object.entries(revenueByCurrency).map(([currency, data]) => ({
        currency,
        ...data,
        averageOrderValue: data.totalTransactions > 0 ? data.totalSales / data.totalTransactions : 0,
        totalTax: 0,
        totalDiscount: 0,
      }));

      if (salesRes.data.success) {
        const report = salesRes.data.report;
        report.byCurrency = byCurrency; // Override with our calculated data
        setSalesReport(report);
      }
      if (productsRes.data.success) setProductsReport(productsRes.data.report);
      if (revenueRes.data.success) setRevenueReport(revenueRes.data.report);
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Export to CSV
  const handleExportCSV = async (reportType: 'sales' | 'products' | 'revenue') => {
    try {
      const params = {
        startDate: new Date(dateRange.startDate).toISOString(),
        endDate: new Date(dateRange.endDate).toISOString(),
        exportFormat: 'csv',
      };

      let response;
      if (reportType === 'sales') {
        response = await reportsApi.sales({ ...params, period });
      } else if (reportType === 'products') {
        response = await reportsApi.products({ ...params, type: 'all' });
      } else {
        response = await reportsApi.revenue({ ...params, groupBy: 'day' });
      }

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
    } catch (error: any) {
      toast.error('Failed to export report');
    }
  };

  // Format currency (supports product-specific currency)
  const formatCurrency = (amount: number, currency: string = 'ALL') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <DashboardLayout title="Reports & Analytics" subtitle="View your business performance">
      <div className="space-y-6">

        {/* Date Range Filter */}
        <Card>
          {/* Quick Presets */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setDatePreset('today')}
              className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              Today
            </button>
            <button
              onClick={() => setDatePreset('week')}
              className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDatePreset('month')}
              className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDatePreset('year')}
              className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Last Year
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <Button onClick={fetchReports} disabled={loading}>
              {loading ? 'Loading...' : 'Apply Filters'}
            </Button>
          </div>
        </Card>

        {/* Multi-Currency Summary Cards */}
        {salesReport && (
          <>
            {/* Currency Tabs */}
            <div className="flex gap-2 border-b pb-2">
              {currencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => setSelectedCurrency(curr.code)}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                    selectedCurrency === curr.code
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {curr.symbol} {curr.name}
                </button>
              ))}
            </div>

            {/* Summary Cards for Selected Currency */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FiDollarSign className="text-2xl text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Sales ({selectedCurrency})</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        salesReport.byCurrency?.find(c => c.currency === selectedCurrency)?.totalSales || salesReport.summary.totalSales,
                        selectedCurrency
                      )}
                    </p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FiShoppingCart className="text-2xl text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold">
                      {salesReport.byCurrency?.find(c => c.currency === selectedCurrency)?.totalTransactions || salesReport.summary.totalTransactions}
                    </p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <FiTrendingUp className="text-2xl text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        salesReport.byCurrency?.find(c => c.currency === selectedCurrency)?.averageOrderValue || salesReport.summary.averageOrderValue,
                        selectedCurrency
                      )}
                    </p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <FiPackage className="text-2xl text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Items Sold</p>
                    <p className="text-2xl font-bold">
                      {salesReport.byCurrency?.find(c => c.currency === selectedCurrency)?.totalItems || salesReport.summary.totalItems}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* All Currencies Overview */}
            <Card>
              <h2 className="text-lg font-semibold mb-4">Sales by Currency</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currencies.map((curr) => {
                  const currData = salesReport.byCurrency?.find(c => c.currency === curr.code);
                  const total = currData?.totalSales || (curr.code === 'ALL' ? salesReport.summary.totalSales : 0);
                  const transactions = currData?.totalTransactions || (curr.code === 'ALL' ? salesReport.summary.totalTransactions : 0);
                  return (
                    <div
                      key={curr.code}
                      className={`p-4 rounded-lg border-2 ${
                        selectedCurrency === curr.code ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{curr.symbol}</span>
                        <span className="text-sm text-gray-500">{curr.name}</span>
                      </div>
                      <p className="text-xl font-bold">{formatCurrency(total, curr.code)}</p>
                      <p className="text-sm text-gray-600">{transactions} transactions</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        {/* Revenue Trend Chart */}
        {revenueReport && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Revenue Trend</h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleExportCSV('revenue')}
                className="flex items-center gap-2"
              >
                <FiDownload /> Export CSV
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueReport.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeRevenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Cumulative"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Best Selling Products */}
        {productsReport?.bestSellers && productsReport.bestSellers.length > 0 && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Best Selling Products</h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleExportCSV('products')}
                className="flex items-center gap-2"
              >
                <FiDownload /> Export CSV
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productsReport.bestSellers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="totalRevenue" fill="#3B82F6" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Payment Method Breakdown */}
        {salesReport?.paymentBreakdown && salesReport.paymentBreakdown.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={salesReport.paymentBreakdown}
                    dataKey="totalAmount"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.method}: ${formatCurrency(entry.totalAmount)}`}
                  >
                    {salesReport.paymentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Low Stock Products */}
            {productsReport?.lowStock && productsReport.lowStock.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold mb-4">Low Stock Alert</h2>
                <div className="space-y-3">
                  {productsReport.lowStock.map((product) => (
                    <div key={product.productId} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-red-900">{product.productName}</p>
                        <p className="text-sm text-red-600">{product.locationName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{product.currentStock} units</p>
                        <p className="text-xs text-red-500">Threshold: {product.lowStockThreshold}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Sales Data Table */}
        {salesReport && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Sales Breakdown</h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleExportCSV('sales')}
                className="flex items-center gap-2"
              >
                <FiDownload /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Period</th>
                    <th className="text-right p-3 font-semibold">Revenue</th>
                    <th className="text-right p-3 font-semibold">Transactions</th>
                    <th className="text-right p-3 font-semibold">Items</th>
                    <th className="text-right p-3 font-semibold">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReport.data.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">{row.period}</td>
                      <td className="p-3 text-right font-semibold text-green-600">
                        {formatCurrency(row.revenue)}
                      </td>
                      <td className="p-3 text-right">{row.transactions}</td>
                      <td className="p-3 text-right">{row.items}</td>
                      <td className="p-3 text-right">{formatCurrency(row.tax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
