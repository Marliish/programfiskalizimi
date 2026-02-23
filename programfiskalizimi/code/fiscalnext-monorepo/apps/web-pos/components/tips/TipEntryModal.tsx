// Tip Entry Modal - Quick Tip Entry with Presets
// Built by: Mela (Frontend Developer) & Gesa (Designer)

'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface TipEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    subtotal: number;
    userId: string; // Server
  };
  onSubmit: (tip: { amount: number; tipType: string; isPooled: boolean }) => void;
}

export function TipEntryModal({ isOpen, onClose, order, onSubmit }: TipEntryModalProps) {
  const [tipType, setTipType] = useState<'percentage' | 'fixed'>('percentage');
  const [selectedPercentage, setSelectedPercentage] = useState<number>(15);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card');
  const [isPooled, setIsPooled] = useState(false);

  // Gesa's Design - Preset percentages (common tip amounts)
  const presetPercentages = [10, 15, 18, 20, 25];

  // Calculate tip amount
  const calculateTip = () => {
    if (tipType === 'percentage') {
      return (order.subtotal * selectedPercentage) / 100;
    }
    return customAmount;
  };

  const tipAmount = calculateTip();
  const totalWithTip = order.total + tipAmount;

  // Handle submit
  const handleSubmit = () => {
    onSubmit({
      amount: tipAmount,
      tipType: paymentMethod === 'cash' ? 'cash' : isPooled ? 'pooled' : 'card',
      isPooled,
    });
    onClose();
  };

  // Quick preset buttons (Gesa's design - large, tappable)
  const handlePresetClick = (percentage: number) => {
    setTipType('percentage');
    setSelectedPercentage(percentage);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Tip">
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Order #{order.orderNumber}
          </div>
          <div className="text-3xl font-bold">${order.subtotal.toFixed(2)}</div>
        </div>

        {/* Quick Presets - Large Buttons (Gesa's Design) */}
        <div>
          <label className="block text-sm font-medium mb-3">Quick Tip Amount</label>
          <div className="grid grid-cols-5 gap-2">
            {presetPercentages.map(percentage => {
              const amount = (order.subtotal * percentage) / 100;
              const isSelected = tipType === 'percentage' && selectedPercentage === percentage;

              return (
                <button
                  key={percentage}
                  onClick={() => handlePresetClick(percentage)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500 text-white shadow-lg scale-105'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:scale-102'
                  }`}
                >
                  <div className="text-2xl font-bold">{percentage}%</div>
                  <div className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                    ${amount.toFixed(2)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Amount */}
        <div>
          <button
            onClick={() => setTipType('fixed')}
            className={`w-full p-4 rounded-xl border-2 transition-all ${
              tipType === 'fixed'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">Custom Amount</span>
              {tipType === 'fixed' && (
                <Input
                  type="number"
                  value={customAmount || ''}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  className="w-32 ml-2"
                  placeholder="$0.00"
                  step="0.01"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          </button>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium mb-3">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              <div className="text-3xl mb-2">💳</div>
              <div className="font-semibold">Card</div>
            </button>

            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'cash'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              <div className="text-3xl mb-2">💵</div>
              <div className="font-semibold">Cash</div>
            </button>
          </div>
        </div>

        {/* Tip Pooling */}
        <div>
          <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            <input
              type="checkbox"
              checked={isPooled}
              onChange={(e) => setIsPooled(e.target.checked)}
              className="w-5 h-5 rounded text-blue-500"
            />
            <div className="flex-1">
              <div className="font-semibold">Add to Tip Pool</div>
              <div className="text-sm text-gray-500">
                Distribute this tip among all staff
              </div>
            </div>
            <div className="text-2xl">🤝</div>
          </label>
        </div>

        {/* Tip Summary */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border-2 border-green-300 dark:border-green-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-medium">Tip Amount:</span>
            <span className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${tipAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-green-200 dark:border-green-800">
            <span>Total with Tip:</span>
            <span className="text-lg font-semibold">${totalWithTip.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={tipAmount <= 0}>
            Add Tip
          </Button>
        </div>

        {/* Tip Info */}
        <div className="text-xs text-gray-500 text-center">
          {isPooled
            ? '✓ This tip will be added to the shared pool'
            : `✓ This tip goes directly to your server`}
        </div>
      </div>
    </Modal>
  );
}
