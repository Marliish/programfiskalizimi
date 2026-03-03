'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { FiDollarSign, FiShoppingBag, FiPackage, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { productsApi, transactionsApi, settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Transaction {
  id: string;
  transactionNumber: string;
  total: number;
  status: string;
  createdAt: string;
  customer?: { firstName?: string; lastName?: string };
  items?: Array<{ product?: { currency?: string }; unitPrice: number; quantity: number }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    todaySales: 0,
    revenueByCurrency: {} as Record<string, number>,
    lowStockCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch products
      const productsRes = await productsApi.getAll({ limit: 1000 });
      const products = productsRes.data.data || [];
      const lowStockProducts = products.filter(
        (p: any) => Number(p.stock?.[0]?.quantity || 0) <= 10
      );

      // Fetch today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const transactionsRes = await transactionsApi.getAll({
        fromDate: today.toISOString(),
        limit: 100,
      });
      const transactions = transactionsRes.data.data || [];

      // Calculate revenue by currency
      const revenueByCurrency: Record<string, number> = {};
      
      transactions.forEach((t: any) => {
        if (t.status === 'completed' && t.items) {
          t.items.forEach((item: any) => {
            const currency = item.product?.currency || 'EUR';
            const itemTotal = Number(item.unitPrice || 0) * Number(item.quantity || 0);
            revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + itemTotal;
          });
        }
      });

      // Fetch recent transactions (last 5)
      const recentRes = await transactionsApi.getAll({ limit: 5 });
      setRecentTransactions(recentRes.data.data || []);

      setStats({
        totalProducts: products.length,
        todaySales: transactions.filter((t: any) => t.status === 'completed').length,
        revenueByCurrency,
        lowStockCount: lowStockProducts.length,
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <DashboardLayout title="Dashboard" subtitle="Welcome back! Here's your overview">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Loading dashboard...
          </div>
        ) : (
          <>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100">
                  <FiPackage className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sales Today</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stats.todaySales}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-green-600 bg-green-100">
                  <FiShoppingBag className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stats.lowStockCount}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-orange-600 bg-orange-100">
                  <FiAlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <button onClick={fetchDashboardData} disabled={loading}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Refresh</p>
                    <p className="text-sm text-gray-500 mt-2">Update data</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-purple-600 bg-purple-100">
                    <FiRefreshCw className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            </button>
          </>
        )}
      </div>

      {/* Revenue by Currency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {['ALL', 'EUR', 'USD'].map((currency) => (
          <Card key={currency} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-xs text-gray-500 mt-1">{currency}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.revenueByCurrency[currency] || 0, currency)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-green-600 bg-green-100">
                <FiDollarSign className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/pos">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FiShoppingBag className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">New Sale</h3>
                <p className="text-sm text-gray-600">Start POS transaction</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/products">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiPackage className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Products</h3>
                <p className="text-sm text-gray-600">View & edit inventory</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/inventory">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiAlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Stock Alerts</h3>
                <p className="text-sm text-gray-600">{stats.lowStockCount} items low</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Transactions */}
      <Card title="Recent Transactions" subtitle="Latest sales">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions yet. Start selling!
          </div>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((transaction) => {
              const customerName = transaction.customer
                ? `${transaction.customer.firstName || ''} ${transaction.customer.lastName || ''}`.trim()
                : 'Walk-in Customer';
              const timeAgo = new Date(transaction.createdAt).toLocaleString();
              
              // Get currency from first item
              const currency = transaction.items?.[0]?.product?.currency || 'EUR';

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      #{transaction.transactionNumber}
                    </p>
                    <p className="text-sm text-gray-500">{customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(Number(transaction.total || 0), currency)}
                    </p>
                    <p className="text-xs text-gray-500">{timeAgo}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
