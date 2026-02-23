// Orders Management Page
// Built by: Tafa, Mela, Gesa

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/v1/orders?${params}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    sent_to_kitchen: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    ready: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Button>+ New Order</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'open', 'sent_to_kitchen', 'ready', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === status
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
            }`}
          >
            {status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => (
          <Card key={order.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold text-lg">Order #{order.orderNumber.slice(-6)}</div>
                {order.table && (
                  <div className="text-sm text-gray-500">Table {order.table.tableNumber}</div>
                )}
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[order.status]}`}>
                {order.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Guests:</span>
                <span className="font-medium">{order.guestCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{order.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-lg">${Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              {new Date(order.createdAt).toLocaleString()}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                View
              </Button>
              {order.status === 'open' && (
                <Button size="sm">
                  Send to Kitchen
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No orders found
        </div>
      )}
    </div>
  );
}
