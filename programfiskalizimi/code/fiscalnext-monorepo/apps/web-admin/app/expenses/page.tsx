'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
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
      
      const [expensesRes, statsRes] = await Promise.all([
        fetch(`/api/v1/expenses${filterParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/v1/expenses/stats/summary', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const expensesData = await expensesRes.json();
      const statsData = await statsRes.json();

      setExpenses(expensesData.expenses || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this expense?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/expenses/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (error) {
      alert('Error approving expense');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/expenses/${id}/reject`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      loadData();
    } catch (error) {
      alert('Error rejecting expense');
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
        <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
        <p className="text-gray-600 mt-2">Track and approve company expenses</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Pending Approval</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending?.count || 0}</div>
            <div className="text-sm text-gray-500 mt-2">
              {new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'ALL' }).format(stats.pending?.total || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Approved</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{stats.approved?.count || 0}</div>
            <div className="text-sm text-gray-500 mt-2">
              {new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'ALL' }).format(stats.approved?.total || 0)}
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
            <div className="text-sm font-medium text-gray-600">Rejected</div>
            <div className="text-3xl font-bold text-red-600 mt-2">{stats.rejected?.count || 0}</div>
            <div className="text-sm text-gray-500 mt-2">
              {new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'ALL' }).format(stats.rejected?.total || 0)}
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
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'approved' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved
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
          <Link
            href="/expenses/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            ➕ Submit Expense
          </Link>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expense
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
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
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No expenses found
                </td>
              </tr>
            ) : (
              expenses.map((expense: any) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{expense.expenseNumber}</div>
                    <div className="text-sm text-gray-500">{expense.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {expense.employee 
                      ? `${expense.employee.firstName} ${expense.employee.lastName}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {expense.category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {new Intl.NumberFormat('sq-AL', {
                      style: 'currency',
                      currency: expense.currency || 'ALL'
                    }).format(expense.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(expense.expenseDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      expense.status === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : expense.status === 'approved'
                        ? 'bg-blue-100 text-blue-800'
                        : expense.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                    {expense.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(expense.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(expense.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          ✗ Reject
                        </button>
                      </>
                    )}
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
