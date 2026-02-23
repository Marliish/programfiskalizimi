'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Modal, Input } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiAward, FiTrendingUp, FiGift, FiStar } from 'react-icons/fi';
import { loyaltyApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Reward {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  type: 'discount' | 'product' | 'voucher';
  value?: number;
  isActive: boolean;
  redeemedCount: number;
  createdAt: Date;
}

export default function LoyaltyPage() {
  const [activeTab, setActiveTab] = useState<'rewards' | 'tiers'>('rewards');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsCost: '',
    type: 'discount' as 'discount' | 'product' | 'voucher',
    value: '',
    isActive: true,
  });

  // Fetch rewards
  const fetchRewards = async () => {
    setLoading(true);
    try {
      const response = await loyaltyApi.getRewards({ isActive: undefined });

      if (response.data.success) {
        setRewards(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const openModal = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        name: reward.name || '',
        description: reward.description || '',
        pointsCost: reward.pointsCost?.toString() || '',
        type: reward.type || 'discount',
        value: reward.value?.toString() || '',
        isActive: reward.isActive,
      });
    } else {
      setEditingReward(null);
      setFormData({
        name: '',
        description: '',
        pointsCost: '',
        type: 'discount',
        value: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingReward(null);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        pointsCost: parseInt(formData.pointsCost),
        value: formData.value ? parseFloat(formData.value) : undefined,
      };

      if (editingReward) {
        await loyaltyApi.updateReward(editingReward.id, payload);
        toast.success('Reward updated successfully');
      } else {
        await loyaltyApi.createReward(payload);
        toast.success('Reward created successfully');
      }
      closeModal();
      fetchRewards();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save reward');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      await loyaltyApi.deleteReward(id);
      toast.success('Reward deleted successfully');
      fetchRewards();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete reward');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'discount':
        return 'bg-blue-100 text-blue-800';
      case 'product':
        return 'bg-green-100 text-green-800';
      case 'voucher':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="Loyalty Program" subtitle="Manage rewards and customer tiers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'rewards' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('rewards')}
            >
              Rewards Catalog
            </Button>
            <Button
              variant={activeTab === 'tiers' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('tiers')}
            >
              Customer Tiers
            </Button>
          </div>
          {activeTab === 'rewards' && (
            <Button onClick={() => openModal()} className="flex items-center gap-2">
              <FiPlus /> Add Reward
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiGift className="text-2xl text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Rewards</p>
                <p className="text-2xl font-bold">{rewards.length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiAward className="text-2xl text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Rewards</p>
                <p className="text-2xl font-bold">
                  {rewards.filter((r) => r.isActive).length}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiTrendingUp className="text-2xl text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Redeemed</p>
                <p className="text-2xl font-bold">
                  {rewards.reduce((sum, r) => sum + r.redeemedCount, 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiStar className="text-2xl text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Points Cost</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    rewards.reduce((sum, r) => sum + r.pointsCost, 0) / rewards.length || 0
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Content */}
        {activeTab === 'rewards' ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Reward</th>
                    <th className="text-left p-4 font-semibold">Type</th>
                    <th className="text-left p-4 font-semibold">Points Cost</th>
                    <th className="text-left p-4 font-semibold">Value</th>
                    <th className="text-left p-4 font-semibold">Redeemed</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-right p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-gray-500">
                        Loading rewards...
                      </td>
                    </tr>
                  ) : rewards.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-gray-500">
                        No rewards found. Add your first reward to get started!
                      </td>
                    </tr>
                  ) : (
                    rewards.map((reward) => (
                      <tr key={reward.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{reward.name}</p>
                            <p className="text-sm text-gray-500">{reward.description}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                              reward.type
                            )}`}
                          >
                            {reward.type.charAt(0).toUpperCase() + reward.type.slice(1)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <FiStar className="text-yellow-500" />
                            <span className="font-semibold">{reward.pointsCost}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {reward.value ? (
                            <span className="font-medium">
                              {reward.type === 'discount'
                                ? `${reward.value}%`
                                : formatCurrency(reward.value)}
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-gray-600">{reward.redeemedCount}</span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              reward.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {reward.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openModal(reward)}
                            >
                              <FiEdit2 />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDelete(reward.id)}
                            >
                              <FiTrash2 />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Loyalty Tiers</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-2 border-gray-300 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      🥉
                    </div>
                    <h4 className="text-xl font-bold">Bronze</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">0 - 499 points</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <FiStar className="text-gray-400" />
                      <span>Standard benefits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FiStar className="text-gray-400" />
                      <span>5% extra points</span>
                    </li>
                  </ul>
                </div>

                <div className="border-2 border-yellow-400 rounded-lg p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      🥈
                    </div>
                    <h4 className="text-xl font-bold">Silver</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">500 - 1,499 points</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <FiStar className="text-yellow-500" />
                      <span>All Bronze benefits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FiStar className="text-yellow-500" />
                      <span>10% extra points</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FiStar className="text-yellow-500" />
                      <span>Birthday bonus</span>
                    </li>
                  </ul>
                </div>

                <div className="border-2 border-purple-500 rounded-lg p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      🥇
                    </div>
                    <h4 className="text-xl font-bold">Gold</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">1,500+ points</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <FiStar className="text-purple-500" />
                      <span>All Silver benefits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FiStar className="text-purple-500" />
                      <span>15% extra points</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FiStar className="text-purple-500" />
                      <span>Early access to sales</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FiStar className="text-purple-500" />
                      <span>Priority support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Add/Edit Reward Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingReward ? 'Edit Reward' : 'Add Reward'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reward Name *</label>
              <Input
                value={formData.name}
                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 10% Discount Voucher"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={formData.description}
                onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the reward"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="discount">Discount (%)</option>
                  <option value="voucher">Voucher (€)</option>
                  <option value="product">Free Product</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {formData.type === 'discount' ? 'Discount (%)' : 'Value (€)'}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e: any) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={formData.type === 'discount' ? '10' : '5.00'}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Points Cost *</label>
              <Input
                type="number"
                value={formData.pointsCost}
                onChange={(e: any) => setFormData({ ...formData, pointsCost: e.target.value })}
                placeholder="200"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active (available for redemption)
              </label>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave}>{editingReward ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
