// Kitchen Display System - Full Screen Display
// Built by: Mela (Frontend Developer)

'use client';

import { useState, useEffect } from 'react';
import { KitchenOrderCard } from './KitchenOrderCard';

interface KitchenDisplayProps {
  stationId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function KitchenDisplay({
  stationId,
  autoRefresh = true,
  refreshInterval = 5000,
}: KitchenDisplayProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0, averagePrepTime: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<string | null>(stationId || null);
  const [stations, setStations] = useState<any[]>([]);

  // Fetch kitchen stations
  const fetchStations = async () => {
    try {
      const response = await fetch('/api/kitchen/stations');
      const data = await response.json();
      if (data.success) {
        setStations(data.stations);
        if (!selectedStation && data.stations.length > 0) {
          setSelectedStation(data.stations[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    }
  };

  // Fetch kitchen orders
  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStation) {
        params.append('stationId', selectedStation);
      }
      params.append('status', 'pending');
      params.append('status', 'preparing');
      params.append('status', 'ready');

      const response = await fetch(`/api/kitchen/orders?${params}`);
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

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/kitchen/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStations();
    fetchOrders();
    fetchStats();
  }, [selectedStation]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedStation]);

  // Handle status change
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders();
        fetchStats();
        
        // Play sound effect (optional)
        if (newStatus === 'ready') {
          // new Audio('/sounds/ready.mp3').play();
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // Handle bump
  const handleBump = async (orderId: string) => {
    try {
      const response = await fetch('/api/kitchen/bump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitchenOrderId: orderId }),
      });

      if (response.ok) {
        fetchOrders();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to bump order:', error);
    }
  };

  // Group orders by status
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-2xl font-bold">Loading kitchen display...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header - Stats & Station Selector */}
      <div className="bg-gray-900 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          {/* Station Selector */}
          <div className="flex gap-2">
            {stations.map(station => (
              <button
                key={station.id}
                onClick={() => setSelectedStation(station.id)}
                className={`px-6 py-3 rounded-lg font-bold text-lg transition-all ${
                  selectedStation === station.id
                    ? 'bg-white text-gray-900 shadow-lg scale-105'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                style={{
                  backgroundColor: selectedStation === station.id ? station.color : undefined,
                }}
              >
                {station.name}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-2xl font-bold">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <span>{stats.pending} Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <span>{stats.preparing} Cooking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
              <span>{stats.ready} Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⏱️ Avg: {stats.averagePrepTime}m</span>
            </div>
          </div>

          {/* Clock */}
          <div className="text-3xl font-mono">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Orders Grid - 3 Columns by Status */}
      <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-hidden">
        {/* Pending Column */}
        <div className="flex flex-col h-full">
          <div className="bg-yellow-500 text-white px-4 py-3 rounded-t-lg font-bold text-xl mb-3">
            🆕 PENDING ({pendingOrders.length})
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {pendingOrders.map(order => (
              <KitchenOrderCard
                key={order.id}
                kitchenOrder={order}
                onStatusChange={handleStatusChange}
                onBump={handleBump}
              />
            ))}
            {pendingOrders.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                No pending orders
              </div>
            )}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="flex flex-col h-full">
          <div className="bg-blue-500 text-white px-4 py-3 rounded-t-lg font-bold text-xl mb-3">
            👨‍🍳 COOKING ({preparingOrders.length})
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {preparingOrders.map(order => (
              <KitchenOrderCard
                key={order.id}
                kitchenOrder={order}
                onStatusChange={handleStatusChange}
                onBump={handleBump}
              />
            ))}
            {preparingOrders.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                No orders cooking
              </div>
            )}
          </div>
        </div>

        {/* Ready Column */}
        <div className="flex flex-col h-full">
          <div className="bg-green-500 text-white px-4 py-3 rounded-t-lg font-bold text-xl mb-3 animate-pulse">
            ✅ READY ({readyOrders.length})
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {readyOrders.map(order => (
              <KitchenOrderCard
                key={order.id}
                kitchenOrder={order}
                onStatusChange={handleStatusChange}
                onBump={handleBump}
              />
            ))}
            {readyOrders.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                No orders ready
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
