'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { FiSearch, FiDownload, FiCheckCircle, FiClock, FiXCircle, FiFileText } from 'react-icons/fi';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface FiscalReceipt {
  id: string;
  iic: string;
  submissionStatus: string;
  createdAt: string;
  transaction?: {
    transactionNumber: string;
    total: number;
    createdAt: string;
  };
  transactions?: Array<{
    transactionNumber: string;
    total: number;
    createdAt: string;
  }>;
}

export default function FiscalReceiptsPage() {
  const [receipts, setReceipts] = useState<FiscalReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReceipts();
  }, [statusFilter]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page: 1, limit: 50 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      console.log('[FiscalReceipts] Fetching with params:', params);
      const response = await api.get('/fiscal/receipts', { params });
      console.log('[FiscalReceipts] Response:', response.data);
      
      if (response.data.success) {
        const data = response.data.receipts || response.data.fiscalReceipts || [];
        console.log('[FiscalReceipts] Setting receipts:', data);
        setReceipts(data);
      } else {
        setError(response.data.error || 'Failed to fetch');
        setReceipts([]);
      }
    } catch (err: any) {
      console.error('[FiscalReceipts] Error:', err);
      setError(err.message || 'Failed to fetch receipts');
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    const icons: Record<string, any> = {
      pending: <FiClock className="inline mr-1" />,
      verified: <FiCheckCircle className="inline mr-1" />,
      failed: <FiXCircle className="inline mr-1" />,
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {icons[status]}{status}
      </span>
    );
  };

  const filteredReceipts = receipts.filter(r =>
    r.iic?.toLowerCase().includes(search.toLowerCase()) ||
    r.transaction?.transactionNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.transactions?.[0]?.transactionNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Fiscal Receipts" subtitle="View and manage fiscal receipts">
      <div className="space-y-6">
        {/* Debug info */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}
        
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          Debug: Found {receipts.length} receipts, Loading: {loading.toString()}
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by IIC or transaction..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={fetchReceipts} variant="secondary">
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['all', 'pending', 'verified', 'failed'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiFileText className="text-2xl text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{receipts.length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiClock className="text-2xl text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{receipts.filter(r => r.submissionStatus === 'pending').length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="text-2xl text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold">{receipts.filter(r => r.submissionStatus === 'verified').length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <FiXCircle className="text-2xl text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold">{receipts.filter(r => r.submissionStatus === 'failed').length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Receipts List */}
        <Card>
          {loading ? (
            <div className="text-center p-12 text-gray-500">Loading receipts...</div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              <FiFileText className="text-5xl mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No fiscal receipts found</h3>
              <p className="text-sm">Make a sale in POS to create fiscal receipts.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold">IIC</th>
                    <th className="text-left p-4 font-semibold">Transaction</th>
                    <th className="text-left p-4 font-semibold">Amount</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <span className="font-mono text-sm">{receipt.iic || 'N/A'}</span>
                      </td>
                      <td className="p-4">
                        {receipt.transaction?.transactionNumber || receipt.transactions?.[0]?.transactionNumber || 'N/A'}
                      </td>
                      <td className="p-4">
                        {(() => {
                          const total = receipt.transaction?.total ?? receipt.transactions?.[0]?.total;
                          return total !== undefined ? `€${Number(total).toFixed(2)}` : 'N/A';
                        })()}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(receipt.submissionStatus)}
                      </td>
                      <td className="p-4 text-gray-600">
                        {new Date(receipt.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
