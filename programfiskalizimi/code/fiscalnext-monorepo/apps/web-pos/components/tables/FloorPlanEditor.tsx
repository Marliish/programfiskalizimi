// Floor Plan Editor - Drag & Drop Table Management
// Built by: Mela (Frontend Developer)

'use client';

import { useState, useRef, useEffect } from 'react';
import { TableCard } from './TableCard';
import { Button } from '@/components/ui/Button';
import { Table, FloorPlan } from '@prisma/client';

interface FloorPlanEditorProps {
  floorPlan: FloorPlan & {
    tables: Array<Table & { currentOrder?: any }>;
  };
  onSave?: (updates: Array<{ id: string; positionX: number; positionY: number; rotation?: number }>) => void;
}

export function FloorPlanEditor({ floorPlan, onSave }: FloorPlanEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tables, setTables] = useState(floorPlan.tables);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const layout = floorPlan.layout as any;
  const { width = 1200, height = 800, gridSize = 20 } = layout;

  useEffect(() => {
    setTables(floorPlan.tables);
  }, [floorPlan.tables]);

  const handleDragStart = (tableId: string, e: React.DragEvent) => {
    if (!isEditing) return;
    
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDraggedTable(tableId);
  };

  const handleDrag = (e: React.DragEvent) => {
    if (!draggedTable || !canvasRef.current) return;
    
    if (e.clientX === 0 && e.clientY === 0) return; // Ignore end drag event

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;

    // Snap to grid
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;

    setTables(prev =>
      prev.map(table =>
        table.id === draggedTable
          ? { ...table, positionX: snappedX, positionY: snappedY }
          : table
      )
    );
  };

  const handleDragEnd = () => {
    setDraggedTable(null);
  };

  const handleSave = () => {
    const updates = tables.map(table => ({
      id: table.id,
      positionX: table.positionX || 0,
      positionY: table.positionY || 0,
      rotation: table.rotation || 0,
    }));

    onSave?.(updates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTables(floorPlan.tables);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
        <div>
          <h2 className="text-xl font-bold">{floorPlan.name}</h2>
          {floorPlan.description && (
            <p className="text-sm text-gray-500">{floorPlan.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Layout
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Layout
            </Button>
          )}
        </div>
      </div>

      {/* Floor Plan Canvas */}
      <div className="flex-1 overflow-auto p-8 bg-gray-100 dark:bg-gray-800">
        <div
          ref={canvasRef}
          className="relative mx-auto bg-white dark:bg-gray-900 shadow-lg"
          style={{
            width,
            height,
            backgroundImage: isEditing
              ? `linear-gradient(0deg, transparent 24%, rgba(0, 0, 0, .05) 25%, rgba(0, 0, 0, .05) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, .05) 75%, rgba(0, 0, 0, .05) 76%, transparent 77%, transparent),
                 linear-gradient(90deg, transparent 24%, rgba(0, 0, 0, .05) 25%, rgba(0, 0, 0, .05) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, .05) 75%, rgba(0, 0, 0, .05) 76%, transparent 77%, transparent)`
              : 'none',
            backgroundSize: isEditing ? `${gridSize}px ${gridSize}px` : 'auto',
          }}
          onDragOver={(e) => {
            e.preventDefault();
            handleDrag(e);
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDragEnd();
          }}
        >
          {/* Background Image */}
          {layout.backgroundUrl && (
            <img
              src={layout.backgroundUrl}
              alt="Floor plan background"
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}

          {/* Tables */}
          {tables.map(table => (
            <div
              key={table.id}
              className="absolute"
              style={{
                left: table.positionX || 0,
                top: table.positionY || 0,
              }}
            >
              <TableCard
                table={table}
                isEditing={isEditing}
                isDragging={draggedTable === table.id}
                onDragStart={(e) => handleDragStart(table.id, e)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  if (!isEditing) {
                    // Open table details/order
                    console.log('Open table', table.id);
                  }
                }}
              />
            </div>
          ))}

          {/* Empty State */}
          {tables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No tables
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding tables to your floor plan.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex items-center gap-6 p-4 border-t bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-sm">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span className="text-sm">Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-500" />
          <span className="text-sm">Cleaning</span>
        </div>
      </div>
    </div>
  );
}
