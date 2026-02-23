// Table Card Component - Visual table representation
// Built by: Mela (Frontend Developer) & Gesa (Designer)

'use client';

import { cn } from '@/lib/utils';

interface TableCardProps {
  table: any;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isEditing?: boolean;
}

// Gesa's Design System - Table Status Colors
const tableStatusStyles = {
  available: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-300 dark:border-green-700',
    text: 'text-green-700 dark:text-green-300',
    indicator: 'bg-green-500',
  },
  occupied: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-700 dark:text-red-300',
    indicator: 'bg-red-500',
  },
  reserved: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-700 dark:text-yellow-300',
    indicator: 'bg-yellow-500',
  },
  cleaning: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-300 dark:border-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    indicator: 'bg-gray-500',
  },
};

// Gesa's Design System - Table Shape Styles
const tableShapeStyles = {
  rectangle: 'rounded-lg',
  square: 'rounded-lg',
  circle: 'rounded-full',
};

export function TableCard({
  table,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
  isEditing,
}: TableCardProps) {
  const status = table.status as keyof typeof tableStatusStyles;
  const shape = table.shape as keyof typeof tableShapeStyles;
  const styles = tableStatusStyles[status] || tableStatusStyles.available;

  return (
    <div
      className={cn(
        'relative cursor-pointer select-none transition-all duration-200',
        'border-2',
        styles.bg,
        styles.border,
        tableShapeStyles[shape],
        isDragging && 'opacity-50 cursor-move',
        isEditing && 'cursor-move'
      )}
      style={{
        width: table.width || 100,
        height: table.height || 100,
        transform: `rotate(${table.rotation || 0}deg)`,
      }}
      draggable={isEditing}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      {/* Status Indicator */}
      <div className="absolute -top-1 -right-1 z-10">
        <div className={cn('w-3 h-3 rounded-full animate-pulse', styles.indicator)} />
      </div>

      {/* Table Content */}
      <div className="flex flex-col items-center justify-center h-full p-3 text-center">
        {/* Table Number */}
        <div className={cn('font-bold text-xl mb-1', styles.text)}>
          {table.tableNumber}
        </div>

        {/* Table Name (optional) */}
        {table.name && (
          <div className={cn('text-xs mb-1', styles.text)}>
            {table.name}
          </div>
        )}

        {/* Capacity */}
        <div className={cn('text-xs flex items-center gap-1', styles.text)}>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          <span>{table.capacity}</span>
        </div>

        {/* Order Info (if occupied) */}
        {table.currentOrder && (
          <div className="mt-2 text-xs font-medium">
            <div className={cn('px-2 py-1 rounded', styles.bg)}>
              Order #{table.currentOrder.orderNumber.slice(-4)}
            </div>
          </div>
        )}

        {/* Status Label */}
        <div className={cn('mt-1 text-xs uppercase tracking-wide', styles.text)}>
          {status}
        </div>
      </div>

      {/* Edit Handle (when in edit mode) */}
      {isEditing && (
        <div className="absolute inset-0 bg-black/5 rounded-lg border-2 border-dashed border-blue-400">
          <div className="absolute top-1 left-1 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
            Drag
          </div>
        </div>
      )}
    </div>
  );
}
