'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BankReconciliationPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadAccountData(selectedAccount.id);
    }
  }, [selectedAccount]);

  const loadAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/bank-accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAccounts(data.accounts || []);
      if (data.accounts && data.accounts.length > 0) {
        setSelectedAccount(data.accounts[0]);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccountData = async (accountId: string) => {
    try {
      const token = localStorage.getItem('token');
      const [txRes, statsRes] = await Promise.all([
        fetch(`/api/v1/bank-accounts/${accountId}/transactions?isMatched=false`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/v1/bank-accounts/${accountId}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const txData = await txRes.json();
      const statsData = await statsRes.json();

      setTransactions(txData.transactions || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading account data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Bank Accounts</h2>
          <p className="text-gray-600 mb-8">Create your first bank account to start reconciliation</p>
          <Link
            href="/bank-reconciliation/accounts/new"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            ➕ Add Bank Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bank Reconciliation</h1>
        <p className="text-gray-600 mt-2">Match and reconcile bank transactions</p>
      </div>

      {/* Account Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selected Account</label>
        <div className="flex gap-4">
          <select
            value={selectedAccount?.id || ''}
            onChange={(e) => {
              const account = accounts.find((a: any) => a.id === e.target.value);
              setSelectedAccount(account);
            }}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {accounts.map((account: any) => (
              <option key={account.id} value={account.id}>
                {account.accountName} - {account.bankName} ({account.accountNumber})
              </option>
            ))}
          </select>
          <Link
            href="/bank-reconciliation/accounts/new"
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition whitespace-nowrap"
          >
            ➕ New Account
          </Link>
        </div>
      </div>

      {selectedAccount && (
        <>
          {/* Account Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600">Current Balance</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {new Intl.NumberFormat('sq-AL', { 
                    style: 'currency', 
                    currency: selectedAccount.currency || 'ALL' 
                  }).format(selectedAccount.currentBalance)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600">Transactions</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTransactions || 0}</div>
                <div className="text-sm text-gray-500 mt-2">
                  Matched: {stats.matchedPercentage?.toFixed(1) || 0}%
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600">Total Credits</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {new Intl.NumberFormat('sq-AL', { 
                    style: 'currency', 
                    currency: selectedAccount.currency || 'ALL' 
                  }).format(stats.totalCredits || 0)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600">Total Debits</div>
                <div className="text-3xl font-bold text-red-600 mt-2">
                  {new Intl.NumberFormat('sq-AL', { 
                    style: 'currency', 
                    currency: selectedAccount.currency || 'ALL' 
                  }).format(stats.totalDebits || 0)}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex gap-4">
              <Link
                href={`/bank-reconciliation/import?accountId=${selectedAccount.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                📥 Import Transactions
              </Link>
              <Link
                href={`/bank-reconciliation/reconcile?accountId=${selectedAccount.id}`}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                ✓ Start Reconciliation
              </Link>
              <Link
                href={`/bank-reconciliation/history?accountId=${selectedAccount.id}`}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                📋 Reconciliation History
              </Link>
            </div>
          </div>

          {/* Unmatched Transactions */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Unmatched Transactions ({transactions.length})
              </h2>
              <p className="text-sm text-gray-600 mt-1">These transactions need to be matched</p>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      All transactions matched! 🎉
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(tx.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{tx.description}</div>
                        {tx.referenceNumber && (
                          <div className="text-xs text-gray-500">Ref: {tx.referenceNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          tx.type === 'credit' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        <span className={tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                          {new Intl.NumberFormat('sq-AL', {
                            style: 'currency',
                            currency: selectedAccount.currency || 'ALL'
                          }).format(Math.abs(tx.amount))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {tx.balance !== null ? new Intl.NumberFormat('sq-AL', {
                          style: 'currency',
                          currency: selectedAccount.currency || 'ALL'
                        }).format(tx.balance) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <Link
                          href={`/bank-reconciliation/match/${tx.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Match
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
