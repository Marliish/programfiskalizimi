'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Input } from '@/components/ui';
import { FiDownload, FiSearch, FiClock, FiUser, FiFilter, FiFileText, FiActivity } from 'react-icons/fi';
import { auditLogsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
  });

  // Fetch audit logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await auditLogsApi.getAll({
        ...filters,
        userId: filters.userId || undefined,
        action: filters.action || undefined,
        resourceType: filters.resourceType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });

      if (response.data.success) {
        // Transform snake_case to camelCase
        const rawLogs = response.data.data || [];
        const transformedLogs = rawLogs.map((log: any) => ({
          id: log.id,
          userId: log.user_id,
          userName: log.user_email || [log.user_first_name, log.user_last_name].filter(Boolean).join(' ') || null,
          action: log.action,
          resourceType: log.resource_type,
          resourceId: log.resource_id,
          changes: log.changes,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          createdAt: log.created_at,
        }));
        setLogs(transformedLogs);
      }
    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await auditLogsApi.getStats({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });

      if (response.data.success) {
        // Transform raw summary data into stats format
        const rawData = response.data.data || [];
        const byAction: Record<string, number> = {};
        let totalActions = 0;
        
        rawData.forEach((row: any) => {
          const count = Number(row.count) || 0;
          totalActions += count;
          byAction[row.action] = (byAction[row.action] || 0) + count;
        });

        setStats({
          totalActions,
          byAction,
          topUsers: [], // Summary endpoint doesn't include user breakdown
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const handleSearch = () => {
    fetchLogs();
    fetchStats();
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await auditLogsApi.export({
        ...filters,
        format,
        userId: filters.userId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });

      if (response.data.success) {
        toast.success(`Export started! File: ${response.data.filename}`);
        // In a real app, you would download the file here
        window.open(response.data.url, '_blank');
      }
    } catch (error: any) {
      toast.error('Failed to export audit logs');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'login':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderChanges = (changes: any) => {
    if (!changes) return 'N/A';

    if (changes.before && changes.after) {
      return (
        <div className="text-xs space-y-1">
          <div>
            <span className="text-gray-500">Before:</span>{' '}
            <code className="bg-red-50 px-1 rounded">{JSON.stringify(changes.before)}</code>
          </div>
          <div>
            <span className="text-gray-500">After:</span>{' '}
            <code className="bg-green-50 px-1 rounded">{JSON.stringify(changes.after)}</code>
          </div>
        </div>
      );
    }

    return (
      <code className="text-xs bg-gray-50 px-1 rounded">{JSON.stringify(changes)}</code>
    );
  };

  return (
    <DashboardLayout title="Audit Logs" subtitle="Track all system activities and changes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={() => handleExport('csv')} variant="secondary" className="flex items-center gap-2">
              <FiDownload /> Export CSV
            </Button>
            <Button onClick={() => handleExport('json')} variant="secondary" className="flex items-center gap-2">
              <FiDownload /> Export JSON
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiActivity className="text-2xl text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Actions</p>
                  <p className="text-2xl font-bold">{stats.totalActions}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FiUser className="text-2xl text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Top Users</p>
                  <p className="text-sm font-medium">
                    {stats.topUsers?.[0]?.userName || 'N/A'} ({stats.topUsers?.[0]?.actionCount || 0})
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FiFileText className="text-2xl text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Creates</p>
                  <p className="text-2xl font-bold">{stats.byAction?.create || 0}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <FiFileText className="text-2xl text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deletes</p>
                  <p className="text-2xl font-bold">{stats.byAction?.delete || 0}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FiFilter className="text-gray-500" />
              <h3 className="font-semibold">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">User ID</label>
                <Input
                  value={filters.userId}
                  onChange={(e: any) => setFilters({ ...filters, userId: e.target.value })}
                  placeholder="user-123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="login">Login</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Resource Type</label>
                <select
                  value={filters.resourceType}
                  onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All</option>
                  <option value="product">Product</option>
                  <option value="customer">Customer</option>
                  <option value="transaction">Transaction</option>
                  <option value="inventory">Inventory</option>
                  <option value="promotion">Promotion</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e: any) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e: any) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch}>Apply Filters</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setFilters({
                    userId: '',
                    action: '',
                    resourceType: '',
                    startDate: '',
                    endDate: '',
                  });
                  fetchLogs();
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Timestamp</th>
                  <th className="text-left p-4 font-semibold">User</th>
                  <th className="text-left p-4 font-semibold">Action</th>
                  <th className="text-left p-4 font-semibold">Resource</th>
                  <th className="text-left p-4 font-semibold">Changes</th>
                  <th className="text-left p-4 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">
                      <FiFileText className="text-4xl mx-auto mb-2 text-gray-400" />
                      <p>No audit logs found</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <FiClock className="text-gray-400" />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{log.userName || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{log.userId?.slice(0, 8) || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(
                            log.action || ''
                          )}`}
                        >
                          {log.action?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{log.resourceType}</p>
                          {log.resourceId && (
                            <p className="text-xs text-gray-500">{log.resourceId?.slice(0, 12)}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs">{renderChanges(log.changes)}</div>
                      </td>
                      <td className="p-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.ipAddress || 'N/A'}
                        </code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination would go here */}
          {logs.length > 0 && (
            <div className="p-4 border-t text-center text-sm text-gray-600">
              Showing {logs.length} audit log entries
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
