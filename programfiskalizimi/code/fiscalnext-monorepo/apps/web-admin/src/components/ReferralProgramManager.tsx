// Referral Program Manager - PRODUCTION READY
// Created: 2026-02-23 by Boli + Mela (CEO ORDER)
// Complete referral tracking and analytics

import React, { useState, useEffect } from 'react';

interface ReferralProgram {
  id: string;
  name: string;
  description?: string;
  referrerRewardType: string;
  referrerRewardAmount: number;
  refereeRewardType: string;
  refereeRewardAmount: number;
  minPurchaseAmount: number;
  isActive: boolean;
  createdAt: string;
}

interface ReferralAnalytics {
  totalReferrals: number;
  completedReferrals: number;
  activeReferrers: number;
  totalRevenue: number;
  conversionRate: number;
  topReferrers: Array<{
    customerName: string;
    referralCount: number;
    revenueGenerated: number;
  }>;
}

export const ReferralProgramManager: React.FC = () => {
  const [programs, setPrograms] = useState<ReferralProgram[]>([]);
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPrograms();
    fetchAnalytics();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/referrals/programs');
      const data = await response.json();
      setPrograms(data.programs || []);
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/referrals/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      referrerRewardType: formData.get('referrerRewardType'),
      referrerRewardAmount: parseFloat(formData.get('referrerRewardAmount') as string),
      refereeRewardType: formData.get('refereeRewardType'),
      refereeRewardAmount: parseFloat(formData.get('refereeRewardAmount') as string),
      minPurchaseAmount: parseFloat(formData.get('minPurchaseAmount') as string),
    };

    try {
      const response = await fetch('/api/referrals/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        alert('Referral program created!');
        setShowCreateModal(false);
        fetchPrograms();
        fetchAnalytics();
      } else {
        alert('Failed to create program');
      }
    } catch (error) {
      console.error('Failed to create program:', error);
      alert('Error creating program');
    }
  };

  const handleDeactivateProgram = async (programId: string) => {
    if (!confirm('Deactivate this referral program?')) return;

    try {
      const response = await fetch(`/api/referrals/programs/${programId}/deactivate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert('Program deactivated!');
        fetchPrograms();
      } else {
        alert('Failed to deactivate program');
      }
    } catch (error) {
      console.error('Failed to deactivate program:', error);
      alert('Error deactivating program');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading referral programs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🎁 Referral Programs</h1>
            <p className="text-gray-600 mt-1">Grow your business through customer referrals</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-semibold"
          >
            + Create Program
          </button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Referrals</div>
            <div className="text-3xl font-bold text-gray-900">
              {analytics.totalReferrals.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Completed</div>
            <div className="text-3xl font-bold text-green-600">
              {analytics.completedReferrals.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Active Referrers</div>
            <div className="text-3xl font-bold text-blue-600">
              {analytics.activeReferrers.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Conversion Rate</div>
            <div className="text-3xl font-bold text-purple-600">
              {analytics.conversionRate.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-orange-600">
              ${analytics.totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Top Referrers */}
      {analytics && analytics.topReferrers.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Referrers</h2>
          <div className="space-y-3">
            {analytics.topReferrers.map((referrer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : index === 1
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{referrer.customerName}</div>
                    <div className="text-sm text-gray-600">
                      {referrer.referralCount} referrals
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    ${referrer.revenueGenerated.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">revenue</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Programs List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Referral Programs</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {programs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🎁</div>
              <p>No referral programs yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-orange-600 hover:text-orange-700 font-semibold"
              >
                Create your first program
              </button>
            </div>
          ) : (
            programs.map((program) => (
              <div key={program.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{program.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          program.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {program.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {program.description && (
                      <p className="text-gray-600 mb-4">{program.description}</p>
                    )}

                    {/* Rewards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Referrer Reward */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-sm text-blue-600 mb-2 font-semibold">
                          👤 Referrer Reward
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {program.referrerRewardType === 'cash' && '$'}
                          {program.referrerRewardAmount}
                          {program.referrerRewardType === 'points' && ' points'}
                          {program.referrerRewardType === 'discount' && '% off'}
                        </div>
                        <div className="text-xs text-blue-700 mt-1">
                          For each successful referral
                        </div>
                      </div>

                      {/* Referee Reward */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-sm text-green-600 mb-2 font-semibold">
                          🆕 New Customer Reward
                        </div>
                        <div className="text-2xl font-bold text-green-900">
                          {program.refereeRewardType === 'cash' && '$'}
                          {program.refereeRewardAmount}
                          {program.refereeRewardType === 'points' && ' points'}
                          {program.refereeRewardType === 'discount' && '% off'}
                        </div>
                        <div className="text-xs text-green-700 mt-1">
                          On first purchase
                        </div>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="text-sm text-gray-600">
                      <strong>Minimum Purchase:</strong> ${program.minPurchaseAmount.toFixed(2)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4">
                    {program.isActive && (
                      <button
                        onClick={() => handleDeactivateProgram(program.id)}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>

                {/* Referral Link Example */}
                <div className="mt-4 bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Referral Link Example:</div>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded text-sm font-mono text-gray-900 border border-gray-200">
                      https://yourstore.com/ref/ABC123
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('https://yourstore.com/ref/ABC123');
                        alert('Link copied!');
                      }}
                      className="text-sm text-orange-600 hover:text-orange-700 font-semibold"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Create Referral Program</h2>

            <form onSubmit={handleCreateProgram}>
              <div className="space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Refer a Friend"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Brief description of the program"
                  />
                </div>

                {/* Referrer Rewards */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    👤 Referrer Reward (Person making the referral)
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reward Type
                      </label>
                      <select
                        name="referrerRewardType"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="cash">Cash</option>
                        <option value="points">Loyalty Points</option>
                        <option value="discount">Discount %</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reward Amount
                      </label>
                      <input
                        type="number"
                        name="referrerRewardAmount"
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>

                {/* Referee Rewards */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    🆕 New Customer Reward (Person being referred)
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reward Type
                      </label>
                      <select
                        name="refereeRewardType"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="cash">Cash</option>
                        <option value="points">Loyalty Points</option>
                        <option value="discount">Discount %</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reward Amount
                      </label>
                      <input
                        type="number"
                        name="refereeRewardAmount"
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Requirements</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Purchase Amount ($)
                    </label>
                    <input
                      type="number"
                      name="minPurchaseAmount"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      New customer must spend at least this amount for referral to be completed
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralProgramManager;
