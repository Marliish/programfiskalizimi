// Kitchen Display System - With Navigation
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout';

interface KitchenStation {
  id: string;
  name: string;
  stationType: string;
  color: string;
}

interface KitchenOrderItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableNumber: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  priority: number;
  items: KitchenOrderItem[];
  notes?: string;
  createdAt: string;
  station: KitchenStation;
}

const statusStyles = {
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/50',
    border: 'border-yellow-500',
    text: 'text-yellow-800 dark:text-yellow-200',
    badge: 'bg-yellow-500',
  },
  preparing: {
    bg: 'bg-blue-100 dark:bg-blue-900/50',
    border: 'border-blue-500',
    text: 'text-blue-800 dark:text-blue-200',
    badge: 'bg-blue-500',
  },
  ready: {
    bg: 'bg-green-100 dark:bg-green-900/50',
    border: 'border-green-500',
    text: 'text-green-800 dark:text-green-200',
    badge: 'bg-green-500 animate-pulse',
  },
  served: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-400',
    text: 'text-gray-600 dark:text-gray-400',
    badge: 'bg-gray-400',
  },
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [stations, setStations] = useState<KitchenStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0, averagePrepTime: 0 });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchStations = useCallback(async () => {
    try {
      const response = await api.get('/kitchen/stations');
      if (response.data.success && response.data.stations) {
        setStations(response.data.stations);
      }
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const params: any = {};
      if (selectedStation) params.stationId = selectedStation;
      const response = await api.get('/kitchen/orders', { params });
      if (response.data.success && response.data.orders) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/kitchen/stats');
      if (response.data.success && response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [selectedStation, fetchOrders, fetchStats]);

  // Auto refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchStats]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/kitchen/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Failed to update status:', error);
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const handleBump = async (orderId: string) => {
    try {
      await api.post('/kitchen/bump', { kitchenOrderId: orderId });
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Failed to bump order:', error);
    }
  };

  // Complete order and create transaction
  const handleComplete = async (orderId: string) => {
    try {
      const response = await api.post('/kitchen/complete-order', { 
        kitchenOrderId: orderId, 
        paymentMethod: 'cash' 
      });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: `✅ ${response.data.message}` });
        fetchOrders();
        fetchStats();
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error('Failed to complete order:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to complete order' });
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  if (loading) {
    return (
      <DashboardLayout title="Kitchen Display">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading kitchen display...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Kitchen Display">
      <div className="space-y-4">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Link 
              href="/restaurant" 
              className="px-4 py-2 bg-blue-500 rounded-lg font-bold hover:bg-blue-600"
            >
              ← Restaurant
            </Link>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 bg-gray-600 rounded-lg font-bold hover:bg-gray-500"
            >
              Dashboard
            </Link>
          </div>

          {/* Station Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStation(null)}
              className={cn(
                'px-3 py-2 rounded-lg font-bold transition-all',
                !selectedStation ? 'bg-white text-gray-900' : 'bg-gray-700 hover:bg-gray-600'
              )}
            >
              All
            </button>
            {stations.map(station => (
              <button
                key={station.id}
                onClick={() => setSelectedStation(station.id)}
                className={cn(
                  'px-3 py-2 rounded-lg font-bold transition-all',
                  selectedStation === station.id ? 'bg-white text-gray-900' : 'bg-gray-700 hover:bg-gray-600'
                )}
              >
                {station.name}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm font-bold">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>{stats.pending} Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>{stats.preparing} Cooking</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>{stats.ready} Ready</span>
            </div>
          </div>

          {/* Clock */}
          <div className="text-xl font-mono">{currentTime.toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={cn(
            'p-3 rounded-lg text-center font-bold cursor-pointer',
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          )}
          onClick={() => setMessage(null)}
        >
          {message.text}
        </div>
      )}

      {/* Orders Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Pending */}
        <div className="space-y-3">
          <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
            🆕 PENDING ({pendingOrders.length})
          </div>
          {pendingOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              onBump={handleBump}
              onComplete={handleComplete}
            />
          ))}
          {pendingOrders.length === 0 && (
            <div className="text-center text-gray-500 py-8">No pending orders</div>
          )}
        </div>

        {/* Cooking */}
        <div className="space-y-3">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
            👨‍🍳 COOKING ({preparingOrders.length})
          </div>
          {preparingOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              onBump={handleBump}
              onComplete={handleComplete}
            />
          ))}
          {preparingOrders.length === 0 && (
            <div className="text-center text-gray-500 py-8">No orders cooking</div>
          )}
        </div>

        {/* Ready */}
        <div className="space-y-3">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg animate-pulse">
            ✅ READY ({readyOrders.length})
          </div>
          {readyOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              onBump={handleBump}
              onComplete={handleComplete}
            />
          ))}
          {readyOrders.length === 0 && (
            <div className="text-center text-gray-500 py-8">No orders ready</div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👨‍🍳</div>
          <div className="text-xl font-bold text-gray-500">No active orders</div>
          <div className="text-gray-400 mb-4">Go to Restaurant page to create orders</div>
          <Link 
            href="/restaurant" 
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600"
          >
            Go to Restaurant →
          </Link>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}

function OrderCard({
  order,
  onStatusChange,
  onBump,
  onComplete,
}: {
  order: KitchenOrder;
  onStatusChange: (orderId: string, status: string) => void;
  onBump: (orderId: string) => void;
  onComplete: (orderId: string) => void;
}) {
  const styles = statusStyles[order.status];
  const elapsedTime = formatDistanceToNow(new Date(order.createdAt), { addSuffix: false });
  
  // Calculate total
  const total = order.items.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);

  const handleNext = () => {
    const statusFlow: Record<string, string> = {
      pending: 'preparing',
      preparing: 'ready',
    };
    const nextStatus = statusFlow[order.status];
    if (nextStatus) {
      onStatusChange(order.id, nextStatus);
    }
  };

  return (
    <div className={cn('rounded-xl border-2 shadow-lg overflow-hidden', styles.bg, styles.border)}>
      {/* Header */}
      <div className={cn('p-3 border-b', styles.border)}>
        <div className="flex justify-between items-start">
          <div>
            <div className={cn('text-xl font-black', styles.text)}>TABLE {order.tableNumber}</div>
            <div className={cn('text-xs font-mono', styles.text)}>#{order.orderNumber.slice(-6)}</div>
          </div>
          <div className="text-right">
            <div className={cn('px-2 py-1 rounded text-white text-xs font-bold', styles.badge)}>
              {order.status.toUpperCase()}
            </div>
            <div className={cn('text-xs mt-1', styles.text)}>⏱️ {elapsedTime}</div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-3 space-y-2">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded">
            <span className="w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-bold">
              {item.quantity}
            </span>
            <div className="flex-1">
              <div className="font-bold text-sm">{item.productName}</div>
              {item.notes && <div className="text-xs text-orange-600">📝 {item.notes}</div>}
            </div>
            {item.unitPrice && (
              <div className="text-sm font-bold text-green-600">€{(item.unitPrice * item.quantity).toFixed(2)}</div>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="px-3 pb-2">
          <div className="p-2 bg-red-100 border-l-4 border-red-500 rounded text-red-800 text-sm font-bold">
            🔴 {order.notes}
          </div>
        </div>
      )}

      {/* Total */}
      {total > 0 && (
        <div className="px-3 pb-2">
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span className="text-green-600">€{(total * 1.2).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-3 border-t bg-white dark:bg-gray-800 space-y-2">
        {order.status === 'pending' && (
          <button
            onClick={handleNext}
            className="w-full py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600"
          >
            👨‍🍳 Start Cooking
          </button>
        )}
        {order.status === 'preparing' && (
          <button
            onClick={handleNext}
            className="w-full py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600"
          >
            ✅ Mark Ready
          </button>
        )}
        {order.status === 'ready' && (
          <>
            <button
              onClick={() => onComplete(order.id)}
              className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-emerald-700"
            >
              💰 Complete & Pay
            </button>
            <button
              onClick={() => onBump(order.id)}
              className="w-full py-1 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300"
            >
              Skip payment
            </button>
          </>
        )}
      </div>
    </div>
  );
}
