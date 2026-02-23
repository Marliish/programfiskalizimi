'use client';

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
  FiTrendingUp,
  FiLayers,
  FiUserPlus,
  FiAward,
  FiTag,
  FiBell,
  FiActivity
} from 'react-icons/fi';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: FiHome },
  { name: 'Point of Sale', href: '/pos', icon: FiShoppingCart },
  { name: 'Products', href: '/products', icon: FiPackage },
  { name: 'Categories', href: '/categories', icon: FiPackage },
  { name: 'Inventory', href: '/inventory', icon: FiLayers },
  { name: 'Customers', href: '/customers', icon: FiUsers },
  { name: 'Employees', href: '/employees', icon: FiUserPlus },
  { name: 'Loyalty Program', href: '/loyalty', icon: FiAward },
  { name: 'Promotions', href: '/promotions', icon: FiTag },
  { name: 'Notifications', href: '/notifications', icon: FiBell },
  { name: 'Fiscal Receipts', href: '/fiscal-receipts', icon: FiFileText },
  { name: 'Audit Logs', href: '/audit-logs', icon: FiActivity },
  { name: 'Reports', href: '/reports', icon: FiBarChart2 },
  { name: 'Users', href: '/users', icon: FiUserPlus },
  { name: 'Settings', href: '/settings', icon: FiSettings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">FiscalNext</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
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
                  {item.name}
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
            <span className="text-primary-700 font-semibold">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
            <p className="text-xs text-gray-500 truncate">admin@fiscalnext.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
