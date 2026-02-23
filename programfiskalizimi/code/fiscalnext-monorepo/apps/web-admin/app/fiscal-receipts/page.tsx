'use client';
// Fiscal Receipts Page - Day 4
import { useState, useEffect } from 'react';
import { Search, Calendar, CheckCircle, XCircle, Clock, Download, Printer, QrCode } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface FiscalReceipt {
  id: string;
  iic: string;
  fiscalNumber?: string;
  qrCode?: string;
  submissionStatus: string;
  verificationStatus?: string;
  createdAt: string;
  submittedAt?: string;
  transactions: Array<{
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
  const [selectedReceipt, setSelectedReceipt] = useState<FiscalReceipt | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, [statusFilter]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`http://localhost:5000/v1/fiscal/receipts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch receipts');
      
      const data = await response.json();
      setReceipts(data.receipts || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyReceipt = async (receiptId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/v1/fiscal/receipts/${receiptId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Verification failed');
      
      const data = await response.json();
      alert(data.message || 'Receipt verified successfully!');
      fetchReceipts();
    } catch (error) {
      alert('Failed to verify receipt');
    }
  };

  const viewDetails = async (receiptId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/v1/fiscal/receipts/${receiptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch details');
      
      const data = await response.json();
      setSelectedReceipt(data.receipt);
      setShowDetails(true);
    } catch (error) {
      alert('Failed to load receipt details');
    }
  };

  const printReceipt = () => {
    if (!selectedReceipt) return;
    window.print();
  };

  const exportReceipts = () => {
    const csv = [
      ['IIC', 'Fiscal Number', 'Transaction', 'Amount', 'Status', 'Date'].join(','),
      ...receipts.map(r => [
        r.iic,
        r.fiscalNumber || '',
        r.transactions[0]?.transactionNumber || '',
        r.transactions[0]?.total || '',
        r.submissionStatus,
        new Date(r.createdAt).toLocaleDateString(),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fiscal-receipts-${Date.now()}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      submitted: 'bg-green-500',
      failed: 'bg-red-500',
    };
    return <Badge className={colors[status] || 'bg-gray-500'}>{status}</Badge>;
  };

  const filteredReceipts = receipts.filter(r =>
    r.iic?.toLowerCase().includes(search.toLowerCase()) ||
    r.fiscalNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.transactions[0]?.transactionNumber?.toLowerCase().includes(search.toLowerCase())
  );

  if (showDetails && selectedReceipt) {
    return (
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Fiscal Receipt Details</h1>
          <div className="flex gap-2">
            <Button onClick={printReceipt} variant="outline">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button onClick={() => setShowDetails(false)}>Close</Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">Receipt Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">IIC:</span> {selectedReceipt.iic}</div>
                <div><span className="font-medium">Fiscal Number:</span> {selectedReceipt.fiscalNumber || 'N/A'}</div>
                <div><span className="font-medium">Status:</span> {getStatusBadge(selectedReceipt.submissionStatus)}</div>
                <div><span className="font-medium">Created:</span> {new Date(selectedReceipt.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              {selectedReceipt.qrCode && (
                <div className="text-center">
                  <div className="mb-2 text-xs font-medium">QR Code</div>
                  <div className="inline-block border-2 border-gray-300 p-4">
                    <QrCode className="h-32 w-32" />
                    <div className="mt-2 text-xs text-gray-500">Scan to verify</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Transaction Details</h3>
            {selectedReceipt.transactions.map((tx) => (
              <div key={tx.transactionNumber} className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-medium">#{tx.transactionNumber}</span>
                  <span className="text-lg font-bold">€{tx.total.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-500">{new Date(tx.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fiscal Receipts</h1>
        <div className="flex gap-2">
          <Button onClick={exportReceipts} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by IIC, fiscal number, or transaction..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'submitted' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('submitted')}
            size="sm"
          >
            Submitted
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('pending')}
            size="sm"
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'failed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('failed')}
            size="sm"
          >
            Failed
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading receipts...</div>
      ) : (
        <div className="grid gap-4">
          {filteredReceipts.length === 0 ? (
            <Card className="p-12 text-center text-gray-500">
              No fiscal receipts found. Create transactions to generate receipts.
            </Card>
          ) : (
            filteredReceipts.map((receipt) => (
              <Card key={receipt.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium">{receipt.iic}</span>
                      {getStatusBadge(receipt.submissionStatus)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Transaction: #{receipt.transactions[0]?.transactionNumber} • 
                      €{receipt.transactions[0]?.total.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(receipt.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => viewDetails(receipt.id)} variant="outline" size="sm">
                      View Details
                    </Button>
                    {receipt.submissionStatus === 'submitted' && receipt.verificationStatus !== 'verified' && (
                      <Button
                        onClick={() => verifyReceipt(receipt.id)}
                        variant="default"
                        size="sm"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" /> Verify
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
