'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { FiBell, FiCheck, FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiPackage, FiSettings } from 'react-icons/fi';
import { productsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  productId?: string;
  createdAt: Date;
  read: boolean;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'preferences'>('inbox');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Load read notification IDs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('readNotifications');
    if (stored) {
      setReadIds(new Set(JSON.parse(stored)));
    }
  }, []);

  // Fetch low stock products and generate notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getAll({ limit: 1000 });
      
      if (response.data.success) {
        const products = response.data.data || [];
        const alerts: Notification[] = [];

        // Check for low stock products (less than 10 items)
        products.forEach((product: any) => {
          const stockQty = product.stock?.[0]?.quantity ?? product.stockQuantity ?? 0;
          const lowStockThreshold = product.lowStockThreshold || 10;
          
          if (stockQty <= 0) {
            alerts.push({
              id: `out-of-stock-${product.id}`,
              type: 'error',
              title: 'Out of Stock',
              message: `${product.name} is out of stock! Please reorder immediately.`,
              productId: product.id,
              createdAt: new Date(),
              read: readIds.has(`out-of-stock-${product.id}`),
            });
          } else if (stockQty <= lowStockThreshold) {
            alerts.push({
              id: `low-stock-${product.id}`,
              type: 'warning',
              title: 'Low Stock Alert',
              message: `${product.name} has only ${stockQty} items left (threshold: ${lowStockThreshold})`,
              productId: product.id,
              createdAt: new Date(),
              read: readIds.has(`low-stock-${product.id}`),
            });
          }
        });

        // Sort by type (errors first) then by read status
        alerts.sort((a, b) => {
          if (a.read !== b.read) return a.read ? 1 : -1;
          if (a.type === 'error' && b.type !== 'error') return -1;
          if (a.type !== 'error' && b.type === 'error') return 1;
          return 0;
        });

        setNotifications(alerts);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    const newReadIds = new Set(readIds);
    newReadIds.add(id);
    setReadIds(newReadIds);
    localStorage.setItem('readNotifications', JSON.stringify([...newReadIds]));
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    toast.success('Marked as read');
  };

  const markAllAsRead = () => {
    const newReadIds = new Set(notifications.map(n => n.id));
    setReadIds(newReadIds);
    localStorage.setItem('readNotifications', JSON.stringify([...newReadIds]));
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All marked as read');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <FiAlertCircle className="text-red-500 text-xl" />;
      case 'warning': return <FiAlertTriangle className="text-yellow-500 text-xl" />;
      case 'success': return <FiCheckCircle className="text-green-500 text-xl" />;
      default: return <FiBell className="text-blue-500 text-xl" />;
    }
  };

  return (
    <DashboardLayout title="Notifications" subtitle="Stock alerts and system notifications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'inbox' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('inbox')}
              className="flex items-center gap-2"
            >
              <FiBell />
              Inbox {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
            </Button>
            <Button
              variant={activeTab === 'preferences' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('preferences')}
              className="flex items-center gap-2"
            >
              <FiSettings />
              Settings
            </Button>
          </div>
          {activeTab === 'inbox' && unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="secondary" size="sm">
              <FiCheck className="mr-1" /> Mark All Read
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiBell className="text-2xl text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <FiAlertCircle className="text-2xl text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold">{notifications.filter(n => n.type === 'error').length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiAlertTriangle className="text-2xl text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold">{notifications.filter(n => n.type === 'warning').length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="text-2xl text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Read</p>
                <p className="text-2xl font-bold">{notifications.filter(n => n.read).length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Content */}
        {activeTab === 'inbox' && (
          <Card>
            {loading ? (
              <div className="text-center p-12 text-gray-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <FiCheckCircle className="text-5xl mx-auto mb-4 text-green-400" />
                <h3 className="text-lg font-medium mb-2">All good!</h3>
                <p className="text-sm">No stock alerts. All products have sufficient inventory.</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getIcon(notification.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          </div>
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <FiCheck />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'preferences' && (
          <Card>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Alert Thresholds</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Products with stock below the threshold will trigger low stock alerts.
                  Default threshold is 10 items per product.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm"><strong>Low Stock Threshold:</strong> 10 items (configurable per product)</p>
                  <p className="text-sm mt-2"><strong>Out of Stock:</strong> 0 items</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Alert Types</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FiAlertCircle className="text-red-500" />
                    <div>
                      <p className="font-medium">Out of Stock (Critical)</p>
                      <p className="text-sm text-gray-500">Product has 0 items in inventory</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiAlertTriangle className="text-yellow-500" />
                    <div>
                      <p className="font-medium">Low Stock (Warning)</p>
                      <p className="text-sm text-gray-500">Product below threshold (default: 10)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
