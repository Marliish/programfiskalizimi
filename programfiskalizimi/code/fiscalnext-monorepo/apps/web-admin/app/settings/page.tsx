'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Input } from '@/components/ui';
import { FiSave, FiUser, FiBriefcase, FiSettings } from 'react-icons/fi';
import { settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'business' | 'user' | 'system'>('business');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Business Profile
  const [businessProfile, setBusinessProfile] = useState({
    name: '',
    slug: '',
    nipt: '',
    address: '',
    city: '',
    country: 'AL',
    phone: '',
    email: '',
    logoUrl: '',
  });

  // User Profile
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    taxRate: '20',
    receiptFooter: 'Thank you for your purchase!',
    currency: 'EUR',
    timeZone: 'Europe/Tirane',
  });

  // Load data from API
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const response = await settingsApi.getAll();
        if (response.data.success) {
          const { business, user, system } = response.data.settings;
          
          setBusinessProfile({
            name: business.name || '',
            slug: business.slug || '',
            nipt: business.nipt || '',
            address: business.address || '',
            city: business.city || '',
            country: business.country || 'AL',
            phone: business.phone || '',
            email: business.email || '',
            logoUrl: business.logoUrl || '',
          });
          
          setUserProfile({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
          });
          
          setSystemSettings({
            taxRate: system.taxRate?.toString() || '20',
            receiptFooter: system.receiptFooter || 'Thank you for your purchase!',
            currency: system.currency || 'EUR',
            timeZone: system.timeZone || 'Europe/Tirane',
          });
        }
      } catch (error: any) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Save Business Profile
  const handleSaveBusinessProfile = async () => {
    setSaving(true);
    try {
      const response = await settingsApi.updateBusiness(businessProfile);
      if (response.data.success) {
        toast.success('Business profile updated successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update business profile');
    } finally {
      setSaving(false);
    }
  };

  // Save User Profile
  const handleSaveUserProfile = async () => {
    setSaving(true);
    try {
      const response = await settingsApi.updateUser(userProfile);
      if (response.data.success) {
        // Update localStorage for immediate UI reflection
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...user, ...userProfile };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast.success('User profile updated successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user profile');
    } finally {
      setSaving(false);
    }
  };

  // Save System Settings
  const handleSaveSystemSettings = async () => {
    setSaving(true);
    try {
      const response = await settingsApi.updateSystem({
        taxRate: parseFloat(systemSettings.taxRate),
        receiptFooter: systemSettings.receiptFooter,
        currency: systemSettings.currency,
        timeZone: systemSettings.timeZone,
      });
      if (response.data.success) {
        toast.success('System settings updated successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'business' as const, name: 'Business Profile', icon: FiBriefcase },
    { id: 'user' as const, name: 'User Profile', icon: FiUser },
    { id: 'system' as const, name: 'System Settings', icon: FiSettings },
  ];

  return (
    <DashboardLayout title="Settings" subtitle="Manage your business and user preferences">
      <div className="space-y-6">

        {/* Tabs */}
        <Card className="p-0">
          <div className="border-b">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon />
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading settings...</p>
              </div>
            ) : (
              <>
                {/* Business Profile Tab */}
                {activeTab === 'business' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Business Name *</label>
                      <Input
                        value={businessProfile.name}
                        onChange={(e: any) =>
                          setBusinessProfile({ ...businessProfile, name: e.target.value })
                        }
                        placeholder="My Business"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">NIPT (Tax ID)</label>
                      <Input
                        value={businessProfile.nipt}
                        onChange={(e: any) =>
                          setBusinessProfile({ ...businessProfile, nipt: e.target.value })
                        }
                        placeholder="K12345678A"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        type="email"
                        value={businessProfile.email}
                        onChange={(e: any) =>
                          setBusinessProfile({ ...businessProfile, email: e.target.value })
                        }
                        placeholder="info@business.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <Input
                        value={businessProfile.phone}
                        onChange={(e: any) =>
                          setBusinessProfile({ ...businessProfile, phone: e.target.value })
                        }
                        placeholder="+355 XX XXX XXXX"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Address</label>
                      <Input
                        value={businessProfile.address}
                        onChange={(e: any) =>
                          setBusinessProfile({ ...businessProfile, address: e.target.value })
                        }
                        placeholder="Street, Building Number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <Input
                        value={businessProfile.city}
                        onChange={(e: any) =>
                          setBusinessProfile({ ...businessProfile, city: e.target.value })
                        }
                        placeholder="Tirane"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Country</label>
                      <select
                        value={businessProfile.country}
                        onChange={(e) =>
                          setBusinessProfile({ ...businessProfile, country: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="AL">Albania (AL)</option>
                        <option value="XK">Kosovo (XK)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveBusinessProfile} disabled={saving}>
                    <FiSave className="mr-2" />
                    {saving ? 'Saving...' : 'Save Business Profile'}
                  </Button>
                </div>
              </div>
            )}

            {/* User Profile Tab */}
            {activeTab === 'user' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name</label>
                      <Input
                        value={userProfile.firstName}
                        onChange={(e: any) =>
                          setUserProfile({ ...userProfile, firstName: e.target.value })
                        }
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name</label>
                      <Input
                        value={userProfile.lastName}
                        onChange={(e: any) =>
                          setUserProfile({ ...userProfile, lastName: e.target.value })
                        }
                        placeholder="Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        type="email"
                        value={userProfile.email}
                        onChange={(e: any) =>
                          setUserProfile({ ...userProfile, email: e.target.value })
                        }
                        placeholder="john@example.com"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <Input
                        value={userProfile.phone}
                        onChange={(e: any) =>
                          setUserProfile({ ...userProfile, phone: e.target.value })
                        }
                        placeholder="+355 XX XXX XXXX"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm Password</label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                  </div>
                  <Button variant="secondary" className="mt-4">
                    Update Password
                  </Button>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveUserProfile} disabled={saving}>
                    <FiSave className="mr-2" />
                    {saving ? 'Saving...' : 'Save User Profile'}
                  </Button>
                </div>
              </div>
            )}

            {/* System Settings Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Tax & Currency</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Default Tax Rate (%)</label>
                      <Input
                        type="number"
                        value={systemSettings.taxRate}
                        onChange={(e: any) =>
                          setSystemSettings({ ...systemSettings, taxRate: e.target.value })
                        }
                        placeholder="20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Currency</label>
                      <select
                        value={systemSettings.currency}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, currency: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="EUR">Euro (EUR)</option>
                        <option value="ALL">Albanian Lek (ALL)</option>
                        <option value="USD">US Dollar (USD)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Receipt Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Receipt Footer Text</label>
                      <textarea
                        value={systemSettings.receiptFooter}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, receiptFooter: e.target.value })
                        }
                        placeholder="Thank you for your purchase!"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Receipt Logo</label>
                      <div className="flex gap-4 items-center">
                        <Input type="file" accept="image/*" />
                        <Button variant="secondary">Upload Logo</Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended size: 200x80px (PNG or JPG)
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Regional Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Time Zone</label>
                      <select
                        value={systemSettings.timeZone}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, timeZone: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Europe/Tirane">Europe/Tirane (Albania)</option>
                        <option value="Europe/Belgrade">Europe/Belgrade (Kosovo)</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="Europe/Berlin">Europe/Berlin</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveSystemSettings} disabled={saving}>
                    <FiSave className="mr-2" />
                    {saving ? 'Saving...' : 'Save System Settings'}
                  </Button>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
