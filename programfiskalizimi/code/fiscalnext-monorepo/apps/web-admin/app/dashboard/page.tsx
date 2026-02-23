'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { FiDollarSign, FiShoppingBag, FiPackage, FiAlertTriangle } from 'react-icons/fi';
import { productsApi, transactionsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Transaction {
  id: string;
  transactionNumber: string;
  total: number;
  status: string;
  createdAt: string;
  customer?: { firstName?: string; lastName?: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    todaySales: 0,
    todayRevenue: 0,
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
      const products = productsRes.data.products || [];
      const lowStockProducts = products.filter(
        (p: any) => p.stock?.[0]?.quantity <= 10
      );

      // Fetch today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const transactionsRes = await transactionsApi.getAll({
        fromDate: today.toISOString(),
        limit: 100,
      });
      const transactions = transactionsRes.data.transactions || [];
      const todayRevenue = transactions
        .filter((t: any) => t.status === 'completed')
        .reduce((sum: number, t: any) => sum + parseFloat(t.total || 0), 0);

      // Fetch recent transactions (last 5)
      const recentRes = await transactionsApi.getAll({ limit: 5 });
      setRecentTransactions(recentRes.data.transactions || []);

      setStats({
        totalProducts: products.length,
        todaySales: transactions.filter((t: any) => t.status === 'completed').length,
        todayRevenue,
        lowStockCount: lowStockProducts.length,
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statsDisplay = [
    {
      name: 'Total Products',
      value: stats.totalProducts,
      icon: FiPackage,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      name: 'Sales Today',
      value: stats.todaySales,
      icon: FiShoppingBag,
      color: 'text-green-600 bg-green-100',
    },
    {
      name: "Today's Revenue",
      value: `€${stats.todayRevenue.toFixed(2)}`,
      icon: FiDollarSign,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      name: 'Low Stock Items',
      value: stats.lowStockCount,
      icon: FiAlertTriangle,
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  return (
    <DashboardLayout title="Dashboard" subtitle="Welcome back! Here's your overview">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Loading dashboard...
          </div>
        ) : (
          statsDisplay.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.name} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            );
          })
        )}
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

        <button onClick={fetchDashboardData}>
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Refresh Data</h3>
                <p className="text-sm text-gray-600">Update dashboard stats</p>
              </div>
            </div>
          </Card>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        €{parseFloat(transaction.total.toString()).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{timeAgo}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="System Status" subtitle="All systems operational">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Database</p>
                <p className="text-sm text-gray-500">PostgreSQL</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Connected
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">API Server</p>
                <p className="text-sm text-gray-500">localhost:5000</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Online
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Low Stock Alerts</p>
                <p className="text-sm text-gray-500">Items below threshold</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {stats.lowStockCount} items
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Today's Performance</p>
                <p className="text-sm text-gray-500">Sales & revenue</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {stats.todaySales} sales
              </span>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
