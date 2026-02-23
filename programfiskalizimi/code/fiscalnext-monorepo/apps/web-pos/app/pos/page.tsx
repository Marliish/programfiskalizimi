'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { FiSearch, FiShoppingCart, FiTrash2, FiMinus, FiPlus, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock products
  const products = [
    { id: '1', name: 'Coffee', price: 2.50, sku: 'COF-001', category: 'Drinks' },
    { id: '2', name: 'Sandwich', price: 5.00, sku: 'SAN-001', category: 'Food' },
    { id: '3', name: 'Water', price: 1.50, sku: 'WAT-001', category: 'Drinks' },
    { id: '4', name: 'Cake', price: 3.50, sku: 'CAK-001', category: 'Dessert' },
    { id: '5', name: 'Tea', price: 2.00, sku: 'TEA-001', category: 'Drinks' },
    { id: '6', name: 'Croissant', price: 2.80, sku: 'CRO-001', category: 'Food' },
  ];

  const addToCart = (product: typeof products[0]) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Cart cleared');
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    toast.success('Processing payment...');
    // TODO: Implement payment flow
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Side - Products */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Cashier: Admin</span>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="search"
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products
              .filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="product-card text-left"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{product.sku}</p>
                    </div>
                    <div className="mt-4">
                      <p className="text-2xl font-bold text-primary-600">€{product.price.toFixed(2)}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {product.category}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Cart Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiShoppingCart className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-900">Cart ({itemCount})</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FiShoppingCart className="w-16 h-16 mb-4" />
              <p className="text-lg">Cart is empty</p>
              <p className="text-sm">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">€{item.price.toFixed(2)} each</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded"
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-right min-w-[60px]">
                      <p className="font-bold text-gray-900">€{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer - Totals & Checkout */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>€{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (20%)</span>
              <span>€{(total * 0.2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-gray-900 pt-3 border-t border-gray-300">
              <span>Total</span>
              <span>€{(total * 1.2).toFixed(2)}</span>
            </div>
          </div>

          <Button
            variant="success"
            size="xl"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full"
          >
            Complete Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
