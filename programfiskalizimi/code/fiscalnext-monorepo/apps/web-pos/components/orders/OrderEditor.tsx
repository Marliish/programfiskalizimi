// Order Editor - Add/Edit Orders with Modifiers
// Built by: Mela (Frontend Developer) & Gesa (Designer)

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  category?: { name: string };
}

interface Modifier {
  id: string;
  name: string;
  priceAdjustment: number;
  modifierType: string;
}

interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  course?: string;
  seatNumber?: number;
  notes?: string;
  modifiers: Array<{ modifierId: string; modifierName: string; priceAdjustment: number }>;
  subtotal: number;
}

interface OrderEditorProps {
  orderId?: string;
  tableId?: string;
  initialItems?: OrderItem[];
  products: Product[];
  modifiers: Modifier[];
  onSave: (order: any) => void;
  onCancel: () => void;
}

export function OrderEditor({
  orderId,
  tableId,
  initialItems = [],
  products,
  modifiers,
  onSave,
  onCancel,
}: OrderEditorProps) {
  const [items, setItems] = useState<OrderItem[]>(initialItems);
  const [currentProduct, setCurrentProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [course, setCourse] = useState<string>('');
  const [seatNumber, setSeatNumber] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState<Set<string>>(new Set());
  const [guestCount, setGuestCount] = useState(1);

  // Add item to order
  const handleAddItem = () => {
    if (!currentProduct) return;

    const product = products.find(p => p.id === currentProduct);
    if (!product) return;

    const itemModifiers = Array.from(selectedModifiers).map(modId => {
      const mod = modifiers.find(m => m.id === modId);
      return {
        modifierId: modId,
        modifierName: mod?.name || '',
        priceAdjustment: mod?.priceAdjustment || 0,
      };
    });

    const modifiersTotal = itemModifiers.reduce((sum, m) => sum + Number(m.priceAdjustment), 0);
    const subtotal = (Number(product.sellingPrice) + modifiersTotal) * quantity;

    const newItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: Number(product.sellingPrice),
      course,
      seatNumber,
      notes,
      modifiers: itemModifiers,
      subtotal,
    };

    setItems([...items, newItem]);

    // Reset form
    setCurrentProduct('');
    setQuantity(1);
    setCourse('');
    setSeatNumber(undefined);
    setNotes('');
    setSelectedModifiers(new Set());
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Toggle modifier
  const toggleModifier = (modifierId: string) => {
    const newSet = new Set(selectedModifiers);
    if (newSet.has(modifierId)) {
      newSet.delete(modifierId);
    } else {
      newSet.add(modifierId);
    }
    setSelectedModifiers(newSet);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = subtotal * 0.2;
  const total = subtotal + taxAmount;

  // Save order
  const handleSave = () => {
    const orderData = {
      tableId,
      guestCount,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        course: item.course,
        seatNumber: item.seatNumber,
        notes: item.notes,
        modifiers: item.modifiers.map(m => ({ modifierId: m.modifierId })),
      })),
    };

    onSave(orderData);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b p-4">
        <h2 className="text-2xl font-bold">
          {orderId ? 'Edit Order' : 'New Order'}
        </h2>
        <div className="flex items-center gap-4 mt-2">
          <label className="text-sm font-medium">Guest Count:</label>
          <Input
            type="number"
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            className="w-20"
            min={1}
          />
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left: Add Items */}
        <div className="w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col">
          <h3 className="text-lg font-bold mb-4">Add Item</h3>

          {/* Product Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Product</label>
            <select
              value={currentProduct}
              onChange={(e) => setCurrentProduct(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">Select a product...</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${Number(product.sellingPrice).toFixed(2)}
                  {product.category && ` (${product.category.name})`}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Seat #</label>
              <Input
                type="number"
                value={seatNumber || ''}
                onChange={(e) => setSeatNumber(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Course */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Course</label>
            <div className="grid grid-cols-4 gap-2">
              {['appetizer', 'main', 'dessert', 'beverage'].map(c => (
                <button
                  key={c}
                  onClick={() => setCourse(course === c ? '' : c)}
                  className={`px-3 py-2 rounded-lg font-medium transition-all ${
                    course === c
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Modifiers */}
          {modifiers.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Modifiers</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {modifiers.map(modifier => (
                  <button
                    key={modifier.id}
                    onClick={() => toggleModifier(modifier.id)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedModifiers.has(modifier.id)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {modifier.name}
                    {modifier.priceAdjustment !== 0 && (
                      <span className="ml-1">
                        {modifier.priceAdjustment > 0 ? '+' : ''}
                        ${Number(modifier.priceAdjustment).toFixed(2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Special Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
              rows={2}
              placeholder="e.g., No onions, extra sauce..."
            />
          </div>

          {/* Add Button */}
          <Button
            onClick={handleAddItem}
            disabled={!currentProduct}
            className="w-full"
          >
            Add to Order
          </Button>
        </div>

        {/* Right: Order Items */}
        <div className="w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col">
          <h3 className="text-lg font-bold mb-4">Order Items ({items.length})</h3>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-bold">
                      {item.quantity}x {item.productName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      ${Number(item.unitPrice).toFixed(2)} each
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${item.subtotal.toFixed(2)}</div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.course && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                      {item.course}
                    </span>
                  )}
                  {item.seatNumber && (
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded">
                      Seat {item.seatNumber}
                    </span>
                  )}
                </div>

                {/* Modifiers */}
                {item.modifiers.length > 0 && (
                  <div className="text-sm text-orange-600 dark:text-orange-400 space-y-0.5">
                    {item.modifiers.map((mod, modIndex) => (
                      <div key={modIndex}>
                        + {mod.modifierName}
                        {mod.priceAdjustment !== 0 && (
                          <span className="ml-1">
                            ({mod.priceAdjustment > 0 ? '+' : ''}
                            ${Number(mod.priceAdjustment).toFixed(2)})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {item.notes && (
                  <div className="mt-2 text-sm italic text-gray-600 dark:text-gray-400">
                    Note: {item.notes}
                  </div>
                )}
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No items added yet
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-lg">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Tax (20%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={items.length === 0}>
              {orderId ? 'Update Order' : 'Create Order'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
