'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const filterParam = filter !== 'all' ? `?status=${filter}` : '';
      
      const [billsRes, statsRes] = await Promise.all([
        fetch(`/api/v1/bills${filterParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/v1/bills/stats/summary', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const billsData = await billsRes.json();
      const statsData = await statsRes.json();

      setBills(billsData.bills || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bill Management</h1>
        <p className="text-gray-600 mt-2">Track and pay vendor bills</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Unpaid</div>
            <div className="text-3xl font-bold text-red-600 mt-2">{stats.unpaid?.count || 0}</div>
            <div className="text-sm text-gray-500 mt-2">
              {new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'ALL' }).format(stats.unpaid?.total || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Partially Paid</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.partiallyPaid?.count || 0}</div>
            <div className="text-sm text-gray-500 mt-2">
              Paid: {new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'ALL' }).format(stats.partiallyPaid?.paid || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Paid</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{stats.paid?.count || 0}</div>
            <div className="text-sm text-gray-500 mt-2">
              {new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'ALL' }).format(stats.paid?.total || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Overdue</div>
            <div className="text-3xl font-bold text-red-700 mt-2">{stats.overdue?.count || 0}</div>
            <div className="text-sm text-gray-500 mt-2">
              {new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'ALL' }).format(stats.overdue?.total || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Actions & Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unpaid')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'unpaid' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unpaid
            </button>
            <button
              onClick={() => setFilter('partially_paid')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'partially_paid' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Partial
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'paid' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paid
            </button>
          </div>
          <div className="flex gap-2">
            <Link
              href="/bills/vendors"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              📋 Vendors
            </Link>
            <Link
              href="/bills/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              ➕ New Bill
            </Link>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bill
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paid Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bills.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No bills found
                </td>
              </tr>
            ) : (
              bills.map((bill: any) => {
                const isOverdue = new Date(bill.dueDate) < new Date() && bill.status !== 'paid';
                return (
                  <tr key={bill.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{bill.billNumber}</div>
                      <div className="text-sm text-gray-500">{bill.vendorInvoiceNumber || 'No invoice #'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {bill.vendor?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat('sq-AL', {
                        style: 'currency',
                        currency: bill.currency || 'ALL'
                      }).format(bill.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Intl.NumberFormat('sq-AL', {
                        style: 'currency',
                        currency: bill.currency || 'ALL'
                      }).format(bill.paidAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                        {new Date(bill.dueDate).toLocaleDateString()}
                      </div>
                      {isOverdue && (
                        <div className="text-xs text-red-600">OVERDUE</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        bill.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : bill.status === 'partially_paid'
                          ? 'bg-yellow-100 text-yellow-800'
                          : isOverdue
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bill.status === 'partially_paid' ? 'Partial' : bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/bills/${bill.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View / Pay
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
