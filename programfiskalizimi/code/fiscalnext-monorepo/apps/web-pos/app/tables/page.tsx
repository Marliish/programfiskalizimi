// Tables Management Page
// Built by: Tafa, Mela, Gesa

'use client';

import { useState, useEffect } from 'react';
import { FloorPlanEditor } from '@/components/tables/FloorPlanEditor';
import { Button } from '@/components/ui/Button';

export default function TablesPage() {
  const [floorPlans, setFloorPlans] = useState<any[]>([]);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch floor plans
  useEffect(() => {
    fetchFloorPlans();
  }, []);

  const fetchFloorPlans = async () => {
    try {
      const response = await fetch('/api/v1/floor-plans');
      const data = await response.json();
      
      if (data.success) {
        setFloorPlans(data.floorPlans);
        if (data.floorPlans.length > 0) {
          setSelectedFloorPlan(data.floorPlans[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch floor plans:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle save layout
  const handleSaveLayout = async (updates: any[]) => {
    try {
      const response = await fetch('/api/v1/tables/batch-update-positions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        alert('Layout saved successfully!');
        fetchFloorPlans();
      }
    } catch (error) {
      console.error('Failed to save layout:', error);
      alert('Failed to save layout');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (floorPlans.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Floor Plans</h2>
          <p className="text-gray-500 mb-4">Create your first floor plan to get started</p>
          <Button>Create Floor Plan</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Floor Plan Selector */}
      {floorPlans.length > 1 && (
        <div className="bg-white dark:bg-gray-900 border-b p-4">
          <div className="flex gap-2">
            {floorPlans.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelectedFloorPlan(plan)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedFloorPlan?.id === plan.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
                }`}
              >
                {plan.name}
                {plan.isDefault && ' ⭐'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floor Plan Editor */}
      {selectedFloorPlan && (
        <FloorPlanEditor
          floorPlan={selectedFloorPlan}
          onSave={handleSaveLayout}
        />
      )}
    </div>
  );
}
