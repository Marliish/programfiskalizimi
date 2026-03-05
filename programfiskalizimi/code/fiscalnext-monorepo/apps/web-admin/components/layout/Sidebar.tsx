'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { 
  FiHome, 
  FiShoppingCart, 
  FiPackage, 
  FiUsers, 
  FiBarChart2, 
  FiSettings,
  FiFileText,
  FiLayers,
  FiUserPlus,
  FiBell,
  FiActivity,
  FiMonitor
} from 'react-icons/fi';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

// Navigation with required permissions and translation keys
const navigation: Array<{
  key: TranslationKey;
  href: string;
  icon: any;
  permissions: string[];
}> = [
  { key: 'dashboard', href: '/dashboard', icon: FiHome, permissions: [] },
  { key: 'newSale', href: '/pos', icon: FiShoppingCart, permissions: ['sales:create'] },
  { key: 'products', href: '/products', icon: FiPackage, permissions: ['admin:products', 'inventory:view'] },
  { key: 'categories', href: '/categories', icon: FiPackage, permissions: ['admin:products'] },
  { key: 'inventory', href: '/inventory', icon: FiLayers, permissions: ['inventory:view'] },
  { key: 'customers', href: '/customers', icon: FiUsers, permissions: ['admin:products'] },
  { key: 'employees', href: '/employees', icon: FiUserPlus, permissions: ['admin:employees'] },
  { key: 'restaurant', href: '/restaurant', icon: FiShoppingCart, permissions: [] },
  { key: 'kitchen', href: '/kitchen', icon: FiMonitor, permissions: [] },
  { key: 'notifications', href: '/notifications', icon: FiBell, permissions: [] },
  { key: 'fiscalReceipts', href: '/fiscal-receipts', icon: FiFileText, permissions: ['cash:reports'] },
  { key: 'auditLogs', href: '/audit-logs', icon: FiActivity, permissions: ['admin:settings'] },
  { key: 'reports', href: '/reports', icon: FiBarChart2, permissions: ['cash:reports', 'admin:reports'] },
  { key: 'settings', href: '/settings', icon: FiSettings, permissions: ['admin:settings'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setUserPermissions(parsed.permissions || []);
    }
  }, []);

  // Check if user has any of the required permissions
  const hasPermission = (requiredPermissions: string[]) => {
    // If no permissions required, allow access
    if (requiredPermissions.length === 0) return true;
    // If user is owner (no employee role), allow all
    if (user && !user.isEmployee) return true;
    // Check if user has any of the required permissions
    return requiredPermissions.some(p => userPermissions.includes(p));
  };

  // Filter navigation based on permissions
  const filteredNavigation = navigation.filter(item => hasPermission(item.permissions));

  const userInitials = user 
    ? `${(user.firstName || 'U')[0]}${(user.lastName || '')[0] || ''}`.toUpperCase()
    : 'U';

  const userName = user 
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : 'User';

  const userRole = user?.isEmployee 
    ? (user.employeeRole || 'Employee').charAt(0).toUpperCase() + (user.employeeRole || 'employee').slice(1)
    : 'Owner';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">FiscalNext</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-semibold">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
