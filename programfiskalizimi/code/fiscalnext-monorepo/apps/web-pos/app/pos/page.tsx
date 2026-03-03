'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { FiSearch, FiShoppingCart, FiTrash2, FiMinus, FiPlus, FiX, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  sku: string;
  categoryId?: string;
  category?: { name: string };
  stock?: number;
  taxRate: number;
  currency: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  taxRate: number;
  stock: number;
  currency: string;
}

interface SystemSettings {
  taxRate: number;
  currency: string;
}

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSettings>({ taxRate: 20, currency: 'EUR' });

  useEffect(() => {
    loadData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load settings
      const settingsRes = await axios.get(`${API_URL}/settings`, getAuthHeaders());
      if (settingsRes.data.success) {
        setSettings({
          taxRate: settingsRes.data.settings.system.taxRate || 20,
          currency: settingsRes.data.settings.system.currency || 'EUR',
        });
      }

      // Load products with stock
      const productsRes = await axios.get(`${API_URL}/products?limit=1000`, getAuthHeaders());
      if (productsRes.data.success) {
        const productsData = productsRes.data.data || [];
        
        console.log('📦 Sample product from API:', productsData[0]);
        
        // Load inventory for stock levels
        const inventoryRes = await axios.get(`${API_URL}/inventory`, getAuthHeaders());
        const inventory = inventoryRes.data.inventory || [];
        
        // Merge stock data
        const productsWithStock = productsData.map((p: any) => {
          const stockData = inventory.find((inv: any) => inv.productId === p.id);
          return {
            ...p,
            currency: p.currency || 'EUR', // Ensure currency is set
            stock: stockData ? stockData.totalStock : 0,
          };
        });
        
        console.log('📦 Sample product after processing:', productsWithStock[0]);
        
        setProducts(productsWithStock);
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currency,
    }).format(amount);
  };

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      toast.error('Out of stock');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock!) {
        toast.error('Not enough stock');
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { 
        id: product.id,
        name: product.name,
        price: product.sellingPrice,
        quantity: 1,
        sku: product.sku,
        taxRate: product.taxRate,
        stock: product.stock || 0,
        currency: product.currency || 'EUR',
      }]);
    }
    
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, Math.min(item.stock, item.quantity + delta));
        if (newQuantity > item.stock) {
          toast.error('Not enough stock');
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Cart cleared');
  };

  // Group cart by currency
  const cartByCurrency = cart.reduce((acc, item) => {
    const curr = item.currency;
    if (!acc[curr]) {
      acc[curr] = { subtotal: 0, tax: 0, items: [] };
    }
    const itemSubtotal = item.price * item.quantity;
    const itemTax = itemSubtotal * item.taxRate / 100;
    acc[curr].subtotal += itemSubtotal;
    acc[curr].tax += itemTax;
    acc[curr].items.push(item);
    return acc;
  }, {} as Record<string, { subtotal: number; tax: number; items: CartItem[] }>);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    try {
      // Calculate totals
      const allSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const allTax = cart.reduce((sum, item) => sum + (item.price * item.quantity * item.taxRate / 100), 0);
      const allTotal = allSubtotal + allTax;

      const response = await axios.post(
        `${API_URL}/pos/transactions`,
        {
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            taxRate: item.taxRate,
            currency: item.currency,
          })),
          paymentMethod: 'cash',
          subtotal: allSubtotal,
          tax: allTax,
          total: allTotal,
          currencyBreakdown: Object.entries(cartByCurrency).map(([currency, data]) => ({
            currency,
            subtotal: data.subtotal,
            tax: data.tax,
            total: data.subtotal + data.tax,
          })),
        },
        getAuthHeaders()
      );

      if (response.data.success) {
        toast.success('Transaction completed!');
        setCart([]);
        loadData(); // Reload to update stock
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Transaction failed');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Side - Products */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Currency: {settings.currency}</span>
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
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading products...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className={`product-card text-left ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{product.sku}</p>
                    </div>
                    <div className="mt-4">
                      <p className="text-2xl font-bold text-primary-600">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: product.currency || 'EUR',
                        }).format(product.sellingPrice)}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {product.category?.name || 'General'}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          product.stock === 0 ? 'text-red-600' : product.stock! < 10 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          <FiPackage className="w-3 h-3" />
                          {product.stock}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
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
                    <p className="text-sm text-gray-500">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: item.currency,
                      }).format(item.price)} each • Tax: {item.taxRate}%
                    </p>
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
                        disabled={item.quantity >= item.stock}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded disabled:opacity-50"
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-right min-w-[80px]">
                      <p className="font-bold text-gray-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: item.currency,
                        }).format(item.price * item.quantity)}
                      </p>
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

        {/* Cart Total - Grouped by Currency */}
        <div className="border-t border-gray-200 p-6 space-y-4">
          {Object.entries(cartByCurrency).map(([currency, data]) => (
            <div key={currency} className="border-b border-gray-100 pb-3 last:border-0">
              <div className="text-xs font-semibold text-gray-500 mb-2">{currency}</div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                  }).format(data.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                  }).format(data.tax)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 mt-1">
                <span>Total</span>
                <span>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                  }).format(data.subtotal + data.tax)}
                </span>
              </div>
            </div>
          ))}
          
          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-4 text-lg"
          >
            Complete Sale
          </Button>
        </div>
      </div>
    </div>
  );
}
