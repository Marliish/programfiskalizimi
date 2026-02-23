'use client';
// Inventory Management Page - Day 4
import { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Plus, Minus, Search, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  quantityBefore: number;
  quantityAfter: number;
  notes?: string;
  createdAt: string;
  product: {
    name: string;
    sku?: string;
  };
  location?: {
    name: string;
  };
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'stock') {
        const response = await fetch('http://localhost:5000/v1/inventory', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setStockLevels(data.stockLevels || []);
      } else if (activeTab === 'movements') {
        const response = await fetch('http://localhost:5000/v1/inventory/movements', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setMovements(data.movements || []);
      } else if (activeTab === 'alerts') {
        const response = await fetch('http://localhost:5000/v1/inventory/alerts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = async () => {
    if (!selectedProduct || !adjustmentQuantity) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/v1/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: selectedProduct.productId,
          quantity: parseFloat(adjustmentQuantity),
          type: adjustmentType,
          notes: adjustmentNotes,
        }),
      });

      if (!response.ok) throw new Error('Failed to adjust stock');

      alert('Stock adjusted successfully!');
      setAdjustDialogOpen(false);
      setAdjustmentQuantity('');
      setAdjustmentNotes('');
      fetchData();
    } catch (error) {
      alert('Failed to adjust stock');
    }
  };

  const filteredStockLevels = stockLevels.filter(s =>
    s.productName.toLowerCase().includes(search.toLowerCase()) ||
    s.sku?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  );

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-600',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
    };
    return <Badge className={colors[severity] || 'bg-gray-500'}>{severity}</Badge>;
  };

  const getMovementIcon = (type: string) => {
    return type === 'in' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
      </div>

      <div className="mb-6 flex gap-2 border-b">
        <Button
          variant={activeTab === 'stock' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('stock')}
          className="rounded-b-none"
        >
          <Package className="mr-2 h-4 w-4" /> Stock Levels
        </Button>
        <Button
          variant={activeTab === 'movements' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('movements')}
          className="rounded-b-none"
        >
          Movement History
        </Button>
        <Button
          variant={activeTab === 'alerts' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('alerts')}
          className="rounded-b-none"
        >
          <AlertTriangle className="mr-2 h-4 w-4" /> Low Stock Alerts ({alerts.length})
        </Button>
      </div>

      {activeTab === 'stock' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading stock levels...</div>
          ) : (
            <div className="grid gap-4">
              {filteredStockLevels.map((item) => (
                <Card key={item.productId} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{item.productName}</span>
                        {item.isLowStock && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.sku && <span className="font-mono">SKU: {item.sku}</span>}
                        {item.category && <span className="ml-2">• {item.category}</span>}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="font-semibold text-lg">
                          {item.totalStock} {item.unit}
                        </span>
                        <span className="text-gray-500">
                          Threshold: {item.lowStockThreshold}
                        </span>
                      </div>
                      {item.locations.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {item.locations.map((loc, idx) => (
                            <span key={idx} className="mr-3">
                              {loc.locationName}: {loc.quantity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Dialog open={adjustDialogOpen && selectedProduct?.productId === item.productId} onOpenChange={setAdjustDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setSelectedProduct(item)}
                          variant="outline"
                          size="sm"
                        >
                          Adjust Stock
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adjust Stock: {item.productName}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Current Stock</Label>
                            <div className="text-2xl font-bold">{item.totalStock} {item.unit}</div>
                          </div>
                          <div>
                            <Label>Adjustment Type</Label>
                            <Select value={adjustmentType} onValueChange={(v: any) => setAdjustmentType(v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="in">Stock In</SelectItem>
                                <SelectItem value="out">Stock Out</SelectItem>
                                <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={adjustmentQuantity}
                              onChange={(e) => setAdjustmentQuantity(e.target.value)}
                              placeholder="Enter quantity"
                            />
                          </div>
                          <div>
                            <Label>Notes (optional)</Label>
                            <Input
                              value={adjustmentNotes}
                              onChange={(e) => setAdjustmentNotes(e.target.value)}
                              placeholder="Reason for adjustment"
                            />
                          </div>
                          <Button onClick={handleAdjustment} className="w-full">
                            Apply Adjustment
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'movements' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">Loading movements...</div>
          ) : movements.length === 0 ? (
            <Card className="p-12 text-center text-gray-500">
              No stock movements recorded yet.
            </Card>
          ) : (
            movements.map((movement) => (
              <Card key={movement.id} className="p-4">
                <div className="flex items-center gap-4">
                  {getMovementIcon(movement.type)}
                  <div className="flex-1">
                    <div className="font-medium">{movement.product.name}</div>
                    <div className="text-sm text-gray-600">
                      {movement.type.toUpperCase()} • Quantity: {movement.quantity} • 
                      {movement.quantityBefore} → {movement.quantityAfter}
                    </div>
                    {movement.notes && (
                      <div className="text-xs text-gray-500 mt-1">{movement.notes}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(movement.createdAt).toLocaleString()} • 
                      By: {movement.user.firstName || movement.user.email}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <Card className="p-12 text-center text-green-600">
              ✓ All products have sufficient stock!
            </Card>
          ) : (
            alerts.map((alert, idx) => (
              <Card key={idx} className="p-4 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{alert.productName}</span>
                      {getSeverityBadge(alert.severity)}
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
                      const product = stockLevels.find(s => s.productId === alert.productId);
                      if (product) {
                        setSelectedProduct(product);
                        setAdjustDialogOpen(true);
                      }
                    }}
                    variant="default"
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
    </div>
  );
}
