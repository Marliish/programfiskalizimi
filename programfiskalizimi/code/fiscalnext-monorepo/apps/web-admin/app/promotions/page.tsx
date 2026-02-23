'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Modal, Input } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiCode, FiCalendar, FiPercent, FiDollarSign, FiTag } from 'react-icons/fi';
import { promotionsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'bundle';
  discountValue?: number;
  code?: string;
  startDate: Date;
  endDate: Date;
  minPurchaseAmount?: number;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  createdAt: Date;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'bogo' | 'bundle',
    discountValue: '',
    code: '',
    startDate: '',
    endDate: '',
    minPurchaseAmount: '',
    maxUses: '',
    isActive: true,
  });

  // Fetch promotions
  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const response = await promotionsApi.getAll({ isActive: undefined });

      if (response.data.success) {
        setPromotions(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const openModal = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        name: promotion.name || '',
        description: promotion.description || '',
        type: promotion.type || 'percentage',
        discountValue: promotion.discountValue?.toString() || '',
        code: promotion.code || '',
        startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
        endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
        minPurchaseAmount: promotion.minPurchaseAmount?.toString() || '',
        maxUses: promotion.maxUses?.toString() || '',
        isActive: promotion.isActive,
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        name: '',
        description: '',
        type: 'percentage',
        discountValue: '',
        code: '',
        startDate: '',
        endDate: '',
        minPurchaseAmount: '',
        maxUses: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPromotion(null);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        discountValue: formData.discountValue ? parseFloat(formData.discountValue) : undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : new Date(),
        minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
      };

      if (editingPromotion) {
        await promotionsApi.update(editingPromotion.id, payload);
        toast.success('Promotion updated successfully');
      } else {
        await promotionsApi.create(payload);
        toast.success('Promotion created successfully');
      }
      closeModal();
      fetchPromotions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save promotion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
      await promotionsApi.delete(id);
      toast.success('Promotion deleted successfully');
      fetchPromotions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete promotion');
    }
  };

  const handleGenerateCode = async () => {
    try {
      const response = await promotionsApi.generateCode();
      if (response.data.success) {
        setGeneratedCode(response.data.code);
        setIsCodeModalOpen(true);
      }
    } catch (error: any) {
      toast.error('Failed to generate code');
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success('Code copied to clipboard!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <FiPercent />;
      case 'fixed':
        return <FiDollarSign />;
      case 'bogo':
        return <FiTag />;
      default:
        return <FiTag />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'bg-blue-100 text-blue-800';
      case 'fixed':
        return 'bg-green-100 text-green-800';
      case 'bogo':
        return 'bg-purple-100 text-purple-800';
      case 'bundle':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);

    if (!promotion.isActive) return 'bg-gray-100 text-gray-800';
    if (now < start) return 'bg-yellow-100 text-yellow-800';
    if (now > end) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);

    if (!promotion.isActive) return 'Inactive';
    if (now < start) return 'Scheduled';
    if (now > end) return 'Expired';
    return 'Active';
  };

  return (
    <DashboardLayout title="Promotions & Discounts" subtitle="Manage your promotional campaigns">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button onClick={handleGenerateCode} variant="secondary" className="flex items-center gap-2">
            <FiCode /> Generate Code
          </Button>
          <Button onClick={() => openModal()} className="flex items-center gap-2">
            <FiPlus /> Add Promotion
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiTag className="text-2xl text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Promotions</p>
                <p className="text-2xl font-bold">{promotions.length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCalendar className="text-2xl text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Now</p>
                <p className="text-2xl font-bold">
                  {promotions.filter((p) => {
                    const now = new Date();
                    return (
                      p.isActive &&
                      new Date(p.startDate) <= now &&
                      new Date(p.endDate) >= now
                    );
                  }).length}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiPercent className="text-2xl text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Uses</p>
                <p className="text-2xl font-bold">
                  {promotions.reduce((sum, p) => sum + p.currentUses, 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiCode className="text-2xl text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">With Codes</p>
                <p className="text-2xl font-bold">
                  {promotions.filter((p) => p.code).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Promotion List */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Promotion</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Discount</th>
                  <th className="text-left p-4 font-semibold">Code</th>
                  <th className="text-left p-4 font-semibold">Duration</th>
                  <th className="text-left p-4 font-semibold">Uses</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-500">
                      Loading promotions...
                    </td>
                  </tr>
                ) : promotions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-500">
                      No promotions found. Create your first promotion to boost sales!
                    </td>
                  </tr>
                ) : (
                  promotions.map((promotion) => (
                    <tr key={promotion.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{promotion.name}</p>
                          <p className="text-sm text-gray-500">{promotion.description}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getTypeColor(
                            promotion.type
                          )}`}
                        >
                          {getTypeIcon(promotion.type)}
                          {promotion.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        {promotion.discountValue && (
                          <span className="font-semibold text-green-600">
                            {promotion.type === 'percentage'
                              ? `${promotion.discountValue}%`
                              : formatCurrency(promotion.discountValue)}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {promotion.code ? (
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            {promotion.code}
                          </code>
                        ) : (
                          <span className="text-gray-400">No code</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <FiCalendar className="text-gray-400" />
                            <span>{formatDate(promotion.startDate)}</span>
                          </div>
                          <div className="text-gray-500">to {formatDate(promotion.endDate)}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">
                            {promotion.currentUses}
                            {promotion.maxUses && ` / ${promotion.maxUses}`}
                          </p>
                          {promotion.maxUses && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (promotion.currentUses / promotion.maxUses) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            promotion
                          )}`}
                        >
                          {getStatusText(promotion)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openModal(promotion)}
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(promotion.id)}
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

        {/* Add/Edit Promotion Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingPromotion ? 'Edit Promotion' : 'Add Promotion'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Promotion Name *</label>
              <Input
                value={formData.name}
                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Spring Sale"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={formData.description}
                onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the promotion"
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
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="bogo">Buy One Get One</option>
                  <option value="bundle">Bundle Deal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Discount Value {formData.type === 'percentage' ? '(%)' : '(€)'}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e: any) => setFormData({ ...formData, discountValue: e.target.value })}
                  placeholder={formData.type === 'percentage' ? '20' : '5.00'}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Promo Code</label>
              <Input
                value={formData.code}
                onChange={(e: any) => setFormData({ ...formData, code: e.target.value })}
                placeholder="SPRING20"
              />
              <p className="text-xs text-gray-500 mt-1">Optional: Leave empty for automatic discount</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e: any) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date *</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e: any) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Min. Purchase (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.minPurchaseAmount}
                  onChange={(e: any) =>
                    setFormData({ ...formData, minPurchaseAmount: e.target.value })
                  }
                  placeholder="10.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Uses</label>
                <Input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e: any) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="1000"
                />
              </div>
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
                Active (promotion will be available)
              </label>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave}>{editingPromotion ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </Modal>

        {/* Generated Code Modal */}
        <Modal
          isOpen={isCodeModalOpen}
          onClose={() => setIsCodeModalOpen(false)}
          title="Generated Promo Code"
        >
          <div className="text-center space-y-4">
            <div className="p-6 bg-gray-50 rounded-lg">
              <code className="text-3xl font-bold text-primary-600">{generatedCode}</code>
            </div>
            <p className="text-sm text-gray-600">
              Use this code in your promotion. Your customers can enter it at checkout to get the discount.
            </p>
            <Button onClick={copyCodeToClipboard} className="flex items-center gap-2 mx-auto">
              <FiCode /> Copy to Clipboard
            </Button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
