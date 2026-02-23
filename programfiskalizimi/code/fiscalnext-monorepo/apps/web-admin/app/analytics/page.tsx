'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [summaryRes, trendsRes, productsRes] = await Promise.all([
        apiRequest('/analytics/dashboard-summary'),
        apiRequest('/analytics/sales-trends?period=daily&days=30'),
        apiRequest('/analytics/top-products?limit=10'),
      ]);

      if (summaryRes.success) setSummary(summaryRes.summary);
      if (trendsRes.success) setTrends(trendsRes.data);
      if (productsRes.success) setTopProducts(productsRes.products);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportSales = async (format: 'xlsx' | 'csv') => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/v1/analytics/export/sales?format=${format}`, '_blank');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={() => exportSales('xlsx')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">📊 Export Excel</button>
          <button onClick={() => exportSales('csv')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">📄 Export CSV</button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-500 mb-1">Today's Sales</h3>
            <p className="text-3xl font-bold">${summary.today.revenue.toFixed(2)}</p>
            <p className="text-sm text-gray-600">{summary.today.transactions} transactions</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-500 mb-1">Total Products</h3>
            <p className="text-3xl font-bold">{summary.inventory.totalProducts}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-500 mb-1">Low Stock Items</h3>
            <p className="text-3xl font-bold text-red-600">{summary.inventory.lowStockProducts}</p>
          </div>
        </div>
      )}

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Top 10 Products (Last 30 Days)</h2>
        {topProducts.length === 0 ? (
          <p className="text-gray-500">No sales data yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Product</th>
                <th className="text-right py-2">Quantity</th>
                <th className="text-right py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{product.product.name}</td>
                  <td className="text-right">{product.quantity}</td>
                  <td className="text-right font-semibold">${product.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sales Trends */}
      {trends && trends.summary && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Sales Summary (Last 30 Days)</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">${trends.summary.totalRevenue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold">{trends.summary.totalTransactions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold">${trends.summary.averageOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
