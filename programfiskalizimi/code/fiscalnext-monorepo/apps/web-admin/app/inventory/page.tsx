'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Input, Modal } from '@/components/ui';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';

interface StockLevel {
  productId: string;
  productName: string;
  sku?: string;
  category?: string;
  totalStock: number;
  unit: string;
  lowStockThreshold: number;
  isLowStock: boolean;
  locations: Array<{
    locationId?: string;
    locationName: string;
    quantity: number;
  }>;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  notes?: string;
  createdAt: string;
  productName: string;
  sku?: string;
  locationName?: string;
}

interface LowStockAlert {
  productId: string;
  productName: string;
  sku?: string;
  category?: string;
  locationName: string;
  currentStock: number;
  threshold: number;
  deficit: number;
  severity: 'critical' | 'high' | 'medium';
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'stock' | 'movements' | 'alerts'>('stock');
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockLevel | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Always fetch stock levels for adjustments
      const stockResponse = await axios.get(`${API_URL}/inventory`, getAuthHeaders());
      console.log('Inventory API response:', stockResponse.data);
      
      // The API returns "inventory" not "stockLevels"
      const inventoryData = stockResponse.data.inventory || [];
      console.log('Inventory data:', inventoryData);
      
      // Map to match our component structure
      const mappedInventory = inventoryData.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        category: item.category,
        totalStock: item.totalStock,
        unit: 'units',
        lowStockThreshold: 10,
        isLowStock: item.isLowStock,
        locations: item.stockByLocation || [],
      }));
      
      setStockLevels(mappedInventory);
      
      if (activeTab === 'movements') {
        const response = await axios.get(`${API_URL}/inventory/movements`, getAuthHeaders());
        setMovements(response.data.movements || []);
      } else if (activeTab === 'alerts') {
        const response = await axios.get(`${API_URL}/inventory/alerts`, getAuthHeaders());
        setAlerts(response.data.alerts || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.error || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = async () => {
    if (!selectedProduct || !adjustmentQuantity) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // Map adjustment type to API format
      const typeMap: any = {
        'in': 'add',
        'out': 'remove',
        'adjustment': 'set'
      };

      await axios.post(
        `${API_URL}/inventory/adjust`,
        {
          productId: selectedProduct.productId,
          quantity: parseFloat(adjustmentQuantity),
          type: typeMap[adjustmentType] || 'add',
          reason: adjustmentNotes || 'Manual adjustment',
        },
        getAuthHeaders()
      );

      toast.success('Stock adjusted successfully!');
      setAdjustDialogOpen(false);
      setAdjustmentQuantity('');
      setAdjustmentNotes('');
      setSelectedProduct(null);
      fetchData();
    } catch (error: any) {
      console.error('Adjustment error:', error);
      toast.error(error.response?.data?.error || 'Failed to adjust stock');
    }
  };

  const filteredStockLevels = stockLevels.filter(s =>
    s.productName.toLowerCase().includes(search.toLowerCase()) ||
    s.sku?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout title="Inventory Management" subtitle="Track and manage stock levels">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'stock'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="inline mr-2 h-4 w-4" /> Stock Levels
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'movements'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Movement History
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'alerts'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <AlertTriangle className="inline mr-2 h-4 w-4" /> Low Stock ({alerts.length})
          </button>
        </div>

        {/* Stock Levels Tab */}
        {activeTab === 'stock' && (
          <>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading stock levels...</div>
            ) : filteredStockLevels.length === 0 ? (
              <Card className="p-12 text-center text-gray-500">
                No products found. Add products first in the Products page.
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredStockLevels.map((item) => (
                  <Card key={item.productId}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.productName}</span>
                          {item.isLowStock && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Low Stock
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.sku && <span className="font-mono">SKU: {item.sku}</span>}
                          {item.category && <span className="ml-2">• {item.category}</span>}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span className="font-semibold text-lg">
                            {item.totalStock || 0} {item.unit}
                          </span>
                          <span className="text-gray-500">
                            Threshold: {item.lowStockThreshold || 0}
                          </span>
                        </div>
                        {item.locations && item.locations.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {item.locations.map((loc: any, idx: number) => (
                              <span key={idx} className="mr-3">
                                {loc.locationName || 'Main'}: {loc.quantity || 0}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          console.log('Opening modal for product:', item);
                          setSelectedProduct(item);
                          setAdjustmentType('in');
                          setAdjustmentQuantity('');
                          setAdjustmentNotes('');
                          setAdjustDialogOpen(true);
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        Adjust Stock
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Movements Tab */}
        {activeTab === 'movements' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading movements...</div>
            ) : movements.length === 0 ? (
              <Card className="p-12 text-center text-gray-500">
                No stock movements recorded yet.
              </Card>
            ) : (
              movements.map((movement: any) => (
                <Card key={movement.id}>
                  <div className="flex items-center gap-4">
                    {movement.type === 'in' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{movement.productName}</div>
                      <div className="text-sm text-gray-600">
                        {movement.type.toUpperCase()} • Quantity: {Math.abs(movement.quantity)}
                      </div>
                      {movement.notes && (
                        <div className="text-xs text-gray-500 mt-1">{movement.notes}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(movement.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <Card className="p-12 text-center text-green-600">
                ✓ All products have sufficient stock!
              </Card>
            ) : (
              alerts.map((alert, idx) => (
                <Card key={idx} className="border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{alert.productName}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {alert.sku && <span className="font-mono">SKU: {alert.sku}</span>}
                        {alert.category && <span className="ml-2">• {alert.category}</span>}
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-semibold text-red-600">
                          Current: {alert.currentStock} / Threshold: {alert.threshold}
                        </span>
                        <span className="ml-2 text-gray-500">
                          ({alert.locationName})
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-red-500">
                        ⚠️ Need {alert.deficit} units to reach threshold
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        console.log('Restock button clicked for productId:', alert.productId);
                        console.log('Available stockLevels:', stockLevels);
                        const product = stockLevels.find((s: any) => s.productId === alert.productId);
                        console.log('Found product:', product);
                        
                        if (product) {
                          setSelectedProduct(product);
                          setAdjustmentType('in'); // Default to Stock In for restock
                          setAdjustmentQuantity('');
                          setAdjustmentNotes('');
                          setAdjustDialogOpen(true);
                        } else {
                          toast.error('Product not found in stock levels');
                        }
                      }}
                      variant="primary"
                      size="sm"
                    >
                      Restock
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Adjust Stock Modal */}
        {adjustDialogOpen && selectedProduct && (
          <Modal
            isOpen={adjustDialogOpen}
            onClose={() => {
              console.log('Closing modal');
              setAdjustDialogOpen(false);
              setSelectedProduct(null);
              setAdjustmentQuantity('');
              setAdjustmentNotes('');
            }}
            title={`Adjust Stock: ${selectedProduct.productName}`}
          >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Stock</label>
              <div className="text-2xl font-bold">{selectedProduct?.totalStock || 0} {selectedProduct?.unit}</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Adjustment Type</label>
              <select
                value={adjustmentType}
                onChange={(e: any) => setAdjustmentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
                <option value="adjustment">Manual Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <Input
                type="number"
                value={adjustmentQuantity}
                onChange={(e: any) => setAdjustmentQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <Input
                value={adjustmentNotes}
                onChange={(e: any) => setAdjustmentNotes(e.target.value)}
                placeholder="Reason for adjustment"
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setAdjustDialogOpen(false);
                  setSelectedProduct(null);
                  setAdjustmentQuantity('');
                  setAdjustmentNotes('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleAdjustment} className="flex-1">
                Apply Adjustment
              </Button>
            </div>
          </div>
        </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
