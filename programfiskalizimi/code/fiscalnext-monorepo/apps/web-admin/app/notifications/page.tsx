'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Modal, Input } from '@/components/ui';
import { FiBell, FiCheck, FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiSettings, FiSend } from 'react-icons/fi';
import { notificationsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  actionUrl?: string;
  read: boolean;
  deliveryStatus: string;
  createdAt: Date;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'preferences' | 'templates'>('inbox');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterRead, setFilterRead] = useState<boolean | undefined>(undefined);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getAll({ read: filterRead });

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch preferences
  const fetchPreferences = async () => {
    try {
      const response = await notificationsApi.getPreferences();
      if (response.data.success) {
        setPreferences(response.data.preferences);
      }
    } catch (error: any) {
      console.error('Failed to fetch preferences:', error);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const response = await notificationsApi.getTemplates();
      if (response.data.success) {
        setTemplates(response.data.templates || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch templates:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'inbox') {
      fetchNotifications();
    } else if (activeTab === 'preferences') {
      fetchPreferences();
    } else if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab, filterRead]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      toast.success('Marked as read');
      fetchNotifications();
    } catch (error: any) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (error: any) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return;

    try {
      await notificationsApi.delete(id);
      toast.success('Notification deleted');
      fetchNotifications();
    } catch (error: any) {
      toast.error('Failed to delete notification');
    }
  };

  const handleUpdatePreferences = async (key: string, value: boolean) => {
    try {
      const updated = { ...preferences, [key]: value };
      await notificationsApi.updatePreferences(updated);
      setPreferences(updated);
      toast.success('Preferences updated');
    } catch (error: any) {
      toast.error('Failed to update preferences');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="text-green-500 text-xl" />;
      case 'error':
        return <FiAlertCircle className="text-red-500 text-xl" />;
      case 'warning':
        return <FiAlertCircle className="text-yellow-500 text-xl" />;
      default:
        return <FiInfo className="text-blue-500 text-xl" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <DashboardLayout title="Notifications" subtitle="Manage your notification center">
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
              Inbox {unreadCount > 0 && `(${unreadCount})`}
            </Button>
            <Button
              variant={activeTab === 'preferences' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('preferences')}
              className="flex items-center gap-2"
            >
              <FiSettings />
              Preferences
            </Button>
            <Button
              variant={activeTab === 'templates' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('templates')}
              className="flex items-center gap-2"
            >
              <FiSend />
              Templates
            </Button>
          </div>
          {activeTab === 'inbox' && unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="secondary">
              <FiCheck /> Mark All Read
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
                <p className="text-sm text-gray-600">Total</p>
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
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
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
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiSend className="text-2xl text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Content */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            {/* Filter */}
            <Card>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filterRead === undefined ? 'primary' : 'secondary'}
                  onClick={() => setFilterRead(undefined)}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filterRead === false ? 'primary' : 'secondary'}
                  onClick={() => setFilterRead(false)}
                >
                  Unread
                </Button>
                <Button
                  size="sm"
                  variant={filterRead === true ? 'primary' : 'secondary'}
                  onClick={() => setFilterRead(true)}
                >
                  Read
                </Button>
              </div>
            </Card>

            {/* Notifications List */}
            <Card>
              {loading ? (
                <div className="text-center p-8 text-gray-500">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <FiBell className="text-4xl mx-auto mb-2 text-gray-400" />
                  <p>No notifications found</p>
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
                        <div className="mt-1">{getTypeIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{notification.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatDate(notification.createdAt)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {!notification.read && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <FiCheck />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDelete(notification.id)}
                              >
                                <FiX />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'preferences' && preferences && (
          <Card>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Notification Delivery</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences.emailEnabled}
                        onChange={(e) => handleUpdatePreferences('emailEnabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences.smsEnabled}
                        onChange={(e) => handleUpdatePreferences('smsEnabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-gray-500">Receive browser push notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences.pushEnabled}
                        onChange={(e) => handleUpdatePreferences('pushEnabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Notification Types</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Low Stock Alerts</p>
                      <p className="text-sm text-gray-500">Get notified when products are low in stock</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences.lowStockAlerts}
                        onChange={(e) => handleUpdatePreferences('lowStockAlerts', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Order Alerts</p>
                      <p className="text-sm text-gray-500">Get notified about new orders and transactions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences.orderAlerts}
                        onChange={(e) => handleUpdatePreferences('orderAlerts', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Promotion Alerts</p>
                      <p className="text-sm text-gray-500">Get notified about promotions and campaigns</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences.promotionAlerts}
                        onChange={(e) => handleUpdatePreferences('promotionAlerts', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">System Alerts</p>
                      <p className="text-sm text-gray-500">Get notified about system updates and maintenance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences.systemAlerts}
                        onChange={(e) => handleUpdatePreferences('systemAlerts', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'templates' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Name</th>
                    <th className="text-left p-4 font-semibold">Type</th>
                    <th className="text-left p-4 font-semibold">Subject/Body</th>
                    <th className="text-left p-4 font-semibold">Usage</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-gray-500">
                        No templates found
                      </td>
                    </tr>
                  ) : (
                    templates.map((template) => (
                      <tr key={template.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <p className="font-medium">{template.name}</p>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {template.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="max-w-md">
                            {template.subject && (
                              <p className="font-medium text-sm mb-1">{template.subject}</p>
                            )}
                            <p className="text-sm text-gray-600 truncate">{template.body}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-600">{template.usageCount} times</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
