'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { itemCount } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* Top banner */}
      <div className="bg-blue-600 text-white text-center py-2 text-sm">
        🎉 Free shipping on orders over €50! | Use code: WELCOME10 for 10% off
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-xl font-bold text-gray-900">FiscalNext</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-blue-600 transition">
              Shop
            </Link>
            <Link href="/products?category=electronics" className="text-gray-700 hover:text-blue-600 transition">
              Electronics
            </Link>
            <Link href="/products?category=fashion" className="text-gray-700 hover:text-blue-600 transition">
              Fashion
            </Link>
            <Link href="/products?category=home" className="text-gray-700 hover:text-blue-600 transition">
              Home & Garden
            </Link>
            <Link href="/products?sale=true" className="text-red-600 hover:text-red-700 font-medium transition">
              Sale
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-gray-600 hover:text-blue-600 transition"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Account */}
            <Link
              href="/account"
              className="hidden md:flex p-2 text-gray-600 hover:text-blue-600 transition"
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-blue-600 transition">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar (expandable) */}
        {searchOpen && (
          <div className="py-4 animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fade-in">
            <nav className="flex flex-col space-y-4">
              <Link href="/products" className="text-gray-700 hover:text-blue-600 transition">
                Shop
              </Link>
              <Link href="/products?category=electronics" className="text-gray-700 hover:text-blue-600 transition">
                Electronics
              </Link>
              <Link href="/products?category=fashion" className="text-gray-700 hover:text-blue-600 transition">
                Fashion
              </Link>
              <Link href="/products?category=home" className="text-gray-700 hover:text-blue-600 transition">
                Home & Garden
              </Link>
              <Link href="/products?sale=true" className="text-red-600 hover:text-red-700 font-medium transition">
                Sale
              </Link>
              <Link href="/account" className="text-gray-700 hover:text-blue-600 transition">
                My Account
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
