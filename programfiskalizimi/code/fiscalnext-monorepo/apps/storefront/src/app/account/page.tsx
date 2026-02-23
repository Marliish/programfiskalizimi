'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { User, Package, MapPin, Heart, Settings, LogOut } from 'lucide-react';
import type { Customer, OnlineOrder } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';

export default function AccountPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recentOrders, setRecentOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    const [profileRes, ordersRes] = await Promise.all([
      api.getProfile(),
      api.getOrders({ limit: 5 }),
    ]);

    if (profileRes.success && profileRes.data) {
      setCustomer(profileRes.data);
    }

    if (ordersRes.success && ordersRes.data) {
      setRecentOrders(ordersRes.data.data);
    }

    setLoading(false);
  };

  const handleLogout = () => {
    api.logout();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to log in to view your account</p>
          <Link href="/login">
            <Button size="lg" fullWidth>Log In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">
            Welcome back, {customer.firstName || customer.email}!
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <Card className="p-6">
              <nav className="space-y-2">
                <Link
                  href="/account"
                  className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-600 font-medium"
                >
                  <User className="w-5 h-5" />
                  Dashboard
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  <Package className="w-5 h-5" />
                  My Orders
                </Link>
                <Link
                  href="/account/addresses"
                  className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  <MapPin className="w-5 h-5" />
                  Addresses
                </Link>
                <Link
                  href="/account/wishlist"
                  className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  <Heart className="w-5 h-5" />
                  Wishlist
                </Link>
                <Link
                  href="/account/settings"
                  className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-5 h-5" />
                  Log Out
                </button>
              </nav>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Account Overview */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {recentOrders.length}
                </h3>
                <p className="text-gray-600">Total Orders</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">💰</div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {formatPrice(customer.totalSpent || 0)}
                </h3>
                <p className="text-gray-600">Total Spent</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">⭐</div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {customer.loyaltyPoints || 0}
                </h3>
                <p className="text-gray-600">Loyalty Points</p>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                <Link href="/account/orders">
                  <Button variant="ghost">View All</Button>
                </Link>
              </div>

              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">
                            #{order.orderNumber}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              order.status === 'delivered'
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'shipped'
                                ? 'bg-blue-100 text-blue-700'
                                : order.status === 'processing'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatDate(order.createdAt)} • {order.items.length} items
                        </p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-xl font-bold text-gray-900">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                      <Link href={`/account/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No orders yet</p>
                  <Link href="/products">
                    <Button>Start Shopping</Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* Account Details */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Account Details</h2>
                <Link href="/account/settings">
                  <Button variant="ghost">Edit</Button>
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Name
                  </label>
                  <p className="text-gray-900">
                    {customer.firstName} {customer.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{customer.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Phone
                  </label>
                  <p className="text-gray-900">{customer.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Member Since
                  </label>
                  <p className="text-gray-900">{formatDate(customer.createdAt)}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
