// Split Payment Modal - Split by Item, Seat, or Amount
// Built by: Mela (Frontend Developer) & Gesa (Designer)

'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  seatNumber?: number;
  total: number;
}

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    items: OrderItem[];
  };
  onSplit: (splitType: string, splits: any[]) => void;
}

export function SplitPaymentModal({
  isOpen,
  onClose,
  order,
  onSplit,
}: SplitPaymentModalProps) {
  const [splitType, setSplitType] = useState<'by_item' | 'by_seat' | 'by_amount'>('by_item');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [customSplits, setCustomSplits] = useState<Array<{ amount: number }>>([
    { amount: 0 },
    { amount: 0 },
  ]);

  // Toggle item selection
  const toggleItem = (itemId: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedItems(newSet);
  };

  // Get items grouped by seat
  const itemsBySeat = order.items.reduce((acc, item) => {
    const seat = item.seatNumber || 0;
    if (!acc[seat]) acc[seat] = [];
    acc[seat].push(item);
    return acc;
  }, {} as Record<number, OrderItem[]>);

  // Calculate split by seat totals
  const seatTotals = Object.entries(itemsBySeat).map(([seat, items]) => ({
    seat: Number(seat),
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
  }));

  // Calculate selected items total
  const selectedTotal = order.items
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.total, 0);

  // Calculate remaining for custom splits
  const customTotal = customSplits.reduce((sum, split) => sum + split.amount, 0);
  const remainingAmount = order.total - customTotal;

  // Handle split
  const handleSplit = () => {
    let splits: any[] = [];

    if (splitType === 'by_item') {
      // Create two splits: selected items and remaining items
      const selectedItemIds = Array.from(selectedItems);
      const remainingItemIds = order.items
        .filter(item => !selectedItems.has(item.id))
        .map(item => item.id);

      splits = [
        { itemIds: selectedItemIds },
        { itemIds: remainingItemIds },
      ].filter(split => split.itemIds.length > 0);
    } else if (splitType === 'by_seat') {
      // Split by seat number
      splits = seatTotals.map(seat => ({
        seatNumber: seat.seat,
        itemIds: seat.items.map(item => item.id),
      }));
    } else if (splitType === 'by_amount') {
      // Custom amount splits
      splits = customSplits.filter(split => split.amount > 0);
    }

    onSplit(splitType, splits);
  };

  // Add custom split
  const addCustomSplit = () => {
    setCustomSplits([...customSplits, { amount: 0 }]);
  };

  // Update custom split amount
  const updateSplitAmount = (index: number, amount: number) => {
    const newSplits = [...customSplits];
    newSplits[index].amount = amount;
    setCustomSplits(newSplits);
  };

  // Remove custom split
  const removeSplit = (index: number) => {
    setCustomSplits(customSplits.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Split Payment">
      <div className="space-y-6">
        {/* Order Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Order #{order.orderNumber}</div>
          <div className="text-2xl font-bold mt-1">${order.total.toFixed(2)}</div>
        </div>

        {/* Split Type Selector */}
        <div>
          <label className="block text-sm font-medium mb-3">Split Type</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSplitType('by_item')}
              className={`p-4 rounded-lg border-2 transition-all ${
                splitType === 'by_item'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-2">📋</div>
              <div className="font-semibold">By Item</div>
              <div className="text-xs text-gray-500">Select specific items</div>
            </button>

            <button
              onClick={() => setSplitType('by_seat')}
              className={`p-4 rounded-lg border-2 transition-all ${
                splitType === 'by_seat'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-2">💺</div>
              <div className="font-semibold">By Seat</div>
              <div className="text-xs text-gray-500">Split by seat numbers</div>
            </button>

            <button
              onClick={() => setSplitType('by_amount')}
              className={`p-4 rounded-lg border-2 transition-all ${
                splitType === 'by_amount'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-2">💰</div>
              <div className="font-semibold">By Amount</div>
              <div className="text-xs text-gray-500">Custom amounts</div>
            </button>
          </div>
        </div>

        {/* Split Configuration */}
        <div className="border-t pt-4">
          {/* By Item */}
          {splitType === 'by_item' && (
            <div>
              <h4 className="font-semibold mb-3">Select Items for Split 1</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {order.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      selectedItems.has(item.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span>
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-semibold">${item.total.toFixed(2)}</span>
                    </div>
                    {item.seatNumber && (
                      <div className="text-xs text-gray-500 mt-1">Seat {item.seatNumber}</div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span>Split 1 (Selected):</span>
                  <span className="font-bold">${selectedTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Split 2 (Remaining):</span>
                  <span className="font-bold">${(order.total - selectedTotal).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* By Seat */}
          {splitType === 'by_seat' && (
            <div>
              <h4 className="font-semibold mb-3">Split by Seat</h4>
              <div className="space-y-3">
                {seatTotals.map(seat => (
                  <div key={seat.seat} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">
                        {seat.seat === 0 ? 'No Seat' : `Seat ${seat.seat}`}
                      </span>
                      <span className="text-lg font-bold">${seat.total.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {seat.items.length} item(s)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Amount */}
          {splitType === 'by_amount' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">Custom Splits</h4>
                <button
                  onClick={addCustomSplit}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Split
                </button>
              </div>
              <div className="space-y-2">
                {customSplits.map((split, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={split.amount || ''}
                        onChange={(e) => updateSplitAmount(index, Number(e.target.value))}
                        placeholder="Amount"
                        step="0.01"
                      />
                    </div>
                    {customSplits.length > 2 && (
                      <button
                        onClick={() => removeSplit(index)}
                        className="px-3 py-2 text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span>Total Allocated:</span>
                  <span className="font-bold">${customTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Remaining:</span>
                  <span className={`font-bold ${remainingAmount < 0 ? 'text-red-500' : ''}`}>
                    ${remainingAmount.toFixed(2)}
                  </span>
                </div>
              </div>
              {remainingAmount !== 0 && (
                <div className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                  ⚠️ Total must equal order amount
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSplit}
            disabled={
              (splitType === 'by_item' && selectedItems.size === 0) ||
              (splitType === 'by_amount' && remainingAmount !== 0)
            }
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    </Modal>
  );
}
