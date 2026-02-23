// Tip Report Dashboard - View & Distribute Tips
// Built by: Mela (Frontend Developer)

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface TipStats {
  totalTips: string;
  totalCount: number;
  directTips: string;
  distributedTips: string;
  averageTip: string;
}

interface Tip {
  id: string;
  amount: number;
  tipType: string;
  isPooled: boolean;
  createdAt: string;
  order: {
    orderNumber: string;
    total: number;
    table?: { tableNumber: string };
  };
}

export function TipReportDashboard() {
  const [stats, setStats] = useState<TipStats | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [pooledTips, setPooledTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tips/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Fetch tips
  const fetchTips = async () => {
    try {
      const response = await fetch('/api/tips');
      const data = await response.json();
      if (data.success) {
        setTips(data.tips);
        setPooledTips(data.tips.filter((tip: Tip) => tip.isPooled && !tip.distributions?.length));
      }
    } catch (error) {
      console.error('Failed to fetch tips:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTips();
  }, [dateRange]);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tips & Gratuities</h1>
        
        {/* Date Range Selector */}
        <div className="flex gap-2">
          {['today', 'week', 'month'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-500 mb-1">Total Tips</div>
          <div className="text-3xl font-bold text-green-600">
            ${stats?.totalTips}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-500 mb-1">Tip Count</div>
          <div className="text-3xl font-bold">{stats?.totalCount}</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-500 mb-1">Direct Tips</div>
          <div className="text-3xl font-bold text-blue-600">
            ${stats?.directTips}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-500 mb-1">Pooled & Distributed</div>
          <div className="text-3xl font-bold text-purple-600">
            ${stats?.distributedTips}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-500 mb-1">Average Tip</div>
          <div className="text-3xl font-bold text-orange-600">
            ${stats?.averageTip}
          </div>
        </Card>
      </div>

      {/* Pooled Tips Section */}
      {pooledTips.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              💰 Pooled Tips (Pending Distribution)
            </h2>
            <Button>Distribute Tips</Button>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-300 dark:border-yellow-700 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🤝</span>
              <span className="font-bold">
                ${pooledTips.reduce((sum, tip) => sum + tip.amount, 0).toFixed(2)}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ({pooledTips.length} tips awaiting distribution)
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Click "Distribute Tips" to allocate these tips to staff members
            </div>
          </div>

          <div className="space-y-2">
            {pooledTips.map(tip => (
              <div
                key={tip.id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    Order #{tip.order.orderNumber.slice(-6)}
                    {tip.order.table && ` - Table ${tip.order.table.tableNumber}`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(tip.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-xl font-bold text-green-600">
                  ${tip.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Tips */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Recent Tips</h2>
        <div className="space-y-2">
          {tips.slice(0, 10).map(tip => (
            <div
              key={tip.id}
              className="flex justify-between items-center p-3 border-b last:border-b-0"
            >
              <div className="flex-1">
                <div className="font-medium">
                  Order #{tip.order.orderNumber.slice(-6)}
                  {tip.order.table && ` - Table ${tip.order.table.tableNumber}`}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(tip.createdAt).toLocaleString()} •{' '}
                  <span className="capitalize">{tip.tipType}</span>
                  {tip.isPooled && ' • Pooled'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  ${tip.amount.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {((tip.amount / tip.order.total) * 100).toFixed(1)}% of order
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
