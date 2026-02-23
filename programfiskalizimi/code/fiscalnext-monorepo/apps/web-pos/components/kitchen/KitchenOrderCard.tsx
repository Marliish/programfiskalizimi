// Kitchen Order Card - Optimized for Speed
// Built by: Mela (Frontend Developer) & Gesa (Designer)

'use client';

import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface KitchenOrderItem {
  productName: string;
  quantity: number;
  course?: string;
  seatNumber?: number;
  notes?: string;
  modifiers?: Array<{ name: string }>;
}

interface KitchenOrderCardProps {
  kitchenOrder: {
    id: string;
    orderNumber: string;
    tableNumber: string;
    status: 'pending' | 'preparing' | 'ready' | 'served';
    priority: number;
    items: KitchenOrderItem[];
    notes?: string;
    createdAt: Date;
    startedAt?: Date;
    station: {
      name: string;
      color: string;
    };
  };
  onStatusChange: (orderId: string, newStatus: string) => void;
  onBump: (orderId: string) => void;
}

// Gesa's Design - Kitchen Status Colors (high contrast for kitchen environment)
const statusStyles = {
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    border: 'border-yellow-500',
    text: 'text-yellow-900 dark:text-yellow-100',
    badge: 'bg-yellow-500',
  },
  preparing: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    border: 'border-blue-500',
    text: 'text-blue-900 dark:text-blue-100',
    badge: 'bg-blue-500',
  },
  ready: {
    bg: 'bg-green-100 dark:bg-green-900',
    border: 'border-green-500',
    text: 'text-green-900 dark:text-green-100',
    badge: 'bg-green-500 animate-pulse',
  },
  served: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-400',
    text: 'text-gray-600 dark:text-gray-300',
    badge: 'bg-gray-400',
  },
};

const priorityBadges = {
  0: 'Normal',
  1: '⚡ Rush',
  2: '🔥 URGENT',
};

export function KitchenOrderCard({
  kitchenOrder,
  onStatusChange,
  onBump,
}: KitchenOrderCardProps) {
  const styles = statusStyles[kitchenOrder.status];
  const elapsedTime = formatDistanceToNow(new Date(kitchenOrder.createdAt), { addSuffix: false });

  const handleNext = () => {
    const statusFlow = {
      pending: 'preparing',
      preparing: 'ready',
      ready: 'served',
      served: 'served',
    };
    const nextStatus = statusFlow[kitchenOrder.status];
    onStatusChange(kitchenOrder.id, nextStatus);
  };

  const handleBump = () => {
    onBump(kitchenOrder.id);
  };

  return (
    <div
      className={cn(
        'rounded-xl border-4 shadow-xl overflow-hidden',
        styles.bg,
        styles.border,
        kitchenOrder.priority > 0 && 'ring-4 ring-red-500 ring-offset-2'
      )}
    >
      {/* Header - Large & Clear */}
      <div className={cn('p-4 border-b-2', styles.border)}>
        <div className="flex items-start justify-between mb-2">
          <div>
            {/* Table Number - HUGE */}
            <div className={cn('text-4xl font-black mb-1', styles.text)}>
              TABLE {kitchenOrder.tableNumber}
            </div>
            {/* Order Number */}
            <div className={cn('text-lg font-mono', styles.text)}>
              #{kitchenOrder.orderNumber.slice(-6)}
            </div>
          </div>

          {/* Status Badge */}
          <div className={cn('px-4 py-2 rounded-lg text-white text-lg font-bold', styles.badge)}>
            {kitchenOrder.status.toUpperCase()}
          </div>
        </div>

        {/* Priority & Time */}
        <div className="flex items-center justify-between">
          {kitchenOrder.priority > 0 && (
            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {priorityBadges[kitchenOrder.priority as keyof typeof priorityBadges]}
            </div>
          )}
          
          <div className={cn('text-xl font-semibold', styles.text)}>
            ⏱️ {elapsedTime}
          </div>
        </div>
      </div>

      {/* Order Items - Large Text for Easy Reading */}
      <div className="p-4 space-y-3">
        {kitchenOrder.items.map((item, index) => (
          <div
            key={index}
            className={cn(
              'p-3 rounded-lg border-2',
              'bg-white dark:bg-gray-800',
              'border-gray-300 dark:border-gray-600'
            )}
          >
            {/* Quantity & Product */}
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black',
                'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
              )}>
                {item.quantity}
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {item.productName}
                </div>
                
                {/* Seat & Course */}
                <div className="flex gap-3 mt-1">
                  {item.seatNumber && (
                    <span className="text-sm px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                      Seat {item.seatNumber}
                    </span>
                  )}
                  {item.course && (
                    <span className="text-sm px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
                      {item.course}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modifiers */}
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="ml-15 space-y-1">
                {item.modifiers.map((mod, modIndex) => (
                  <div
                    key={modIndex}
                    className="text-lg text-orange-600 dark:text-orange-400 font-medium"
                  >
                    + {mod.name}
                  </div>
                ))}
              </div>
            )}

            {/* Special Notes */}
            {item.notes && (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 rounded">
                <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                  ⚠️ NOTE:
                </div>
                <div className="text-lg font-medium text-yellow-900 dark:text-yellow-100">
                  {item.notes}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Order Notes */}
      {kitchenOrder.notes && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded">
            <div className="text-sm font-bold text-red-800 dark:text-red-300">
              🔴 ORDER NOTE:
            </div>
            <div className="text-lg font-semibold text-red-900 dark:text-red-100">
              {kitchenOrder.notes}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - LARGE for easy tapping */}
      <div className="p-4 border-t-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
        <div className="grid grid-cols-2 gap-3">
          {kitchenOrder.status !== 'served' && (
            <button
              onClick={handleNext}
              className={cn(
                'py-4 px-6 rounded-xl text-xl font-bold transition-all',
                'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
                'text-white shadow-lg hover:shadow-xl',
                'active:scale-95'
              )}
            >
              {kitchenOrder.status === 'pending' && '👨‍🍳 Start Cooking'}
              {kitchenOrder.status === 'preparing' && '✅ Mark Ready'}
              {kitchenOrder.status === 'ready' && '🔔 Served'}
            </button>
          )}

          {kitchenOrder.status === 'ready' && (
            <button
              onClick={handleBump}
              className={cn(
                'py-4 px-6 rounded-xl text-xl font-bold transition-all',
                'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
                'text-white shadow-lg hover:shadow-xl',
                'active:scale-95'
              )}
            >
              🚀 BUMP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
