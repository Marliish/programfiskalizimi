// Restaurant Management - Integrated with main system
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout';

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  category?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
}

interface OrderItem {
  product: Product;
  quantity: number;
  notes: string;
}

export default function RestaurantPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState('1');
  const [orderNotes, setOrderNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // New product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', categoryId: '' });
  const [saving, setSaving] = useState(false);

  // New category form
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Load products and categories
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products', { params: { limit: 200 } }),
        api.get('/categories'),
      ]);
      // API returns { success, data: [...], pagination: {...} }
      setProducts(productsRes.data.data || productsRes.data.products || []);
      setCategories(categoriesRes.data.data || categoriesRes.data.categories || categoriesRes.data || []);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to load. Are you logged in?' });
    } finally {
      setLoading(false);
    }
  };

  // Create new product in database
  const createProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      setMessage({ type: 'error', text: 'Enter name and price!' });
      return;
    }

    setSaving(true);
    setMessage(null);
    
    try {
      const response = await api.post('/products', {
        name: newProduct.name,
        sellingPrice: parseFloat(newProduct.price),
        costPrice: parseFloat(newProduct.price) * 0.6, // Default 40% margin
        ...(newProduct.categoryId ? { categoryId: newProduct.categoryId } : {}),
        taxRate: 20,
      });
      
      console.log('Product created:', response.data);
      setMessage({ type: 'success', text: `✅ Created "${newProduct.name}"!` });
      setNewProduct({ name: '', price: '', categoryId: '' });
      setShowAddProduct(false);
      await loadData(); // Refresh products
    } catch (error: any) {
      console.error('Failed to create product:', error.response?.data || error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to create product' });
    } finally {
      setSaving(false);
    }
  };

  // Create new category
  const createCategory = async () => {
    if (!newCategoryName) {
      setMessage({ type: 'error', text: 'Enter category name!' });
      return;
    }
    
    setSaving(true);
    setMessage(null);
    
    try {
      await api.post('/categories', { name: newCategoryName });
      setMessage({ type: 'success', text: `✅ Created category "${newCategoryName}"!` });
      setNewCategoryName('');
      setShowAddCategory(false);
      await loadData();
    } catch (error: any) {
      console.error('Failed to create category:', error.response?.data || error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to create category' });
    } finally {
      setSaving(false);
    }
  };

  // Add to order
  const addToOrder = (product: Product) => {
    setOrderItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
  };

  // Update quantity
  const updateQuantity = (productId: string, delta: number) => {
    setOrderItems(prev =>
      prev
        .map(item =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  // Update notes
  const updateNotes = (productId: string, notes: string) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, notes } : item
      )
    );
  };

  // Send to kitchen
  const sendToKitchen = async () => {
    if (orderItems.length === 0) {
      setMessage({ type: 'error', text: 'Add items first!' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await api.post('/kitchen/create-order', {
        tableNumber,
        notes: orderNotes,
        items: orderItems.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.product.sellingPrice),
          notes: item.notes,
        })),
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: `✅ Order sent to kitchen! Table ${tableNumber}` });
        setOrderItems([]);
        setOrderNotes('');
      } else {
        throw new Error(response.data.error || 'Failed');
      }
    } catch (error: any) {
      console.error('Failed to send order:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to send order' });
    } finally {
      setSending(false);
    }
  };

  const total = orderItems.reduce((sum, item) => sum + Number(item.product.sellingPrice) * item.quantity, 0);

  // Group products by category
  const productsByCategory = categories.map(cat => ({
    category: cat,
    products: products.filter(p => p.category?.id === cat.id),
  })).filter(g => g.products.length > 0);

  const uncategorizedProducts = products.filter(p => !p.category);

  if (loading) {
    return (
      <DashboardLayout title="Restaurant Orders">
        <div className="flex items-center justify-center h-96">
          <div className="text-xl">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Restaurant Orders">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🍽️ Restaurant Orders</h1>
        <Link 
          href="/kitchen" 
          className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600"
        >
          👨‍🍳 Open Kitchen Display →
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div
          className={cn(
            'p-4 rounded-lg font-bold cursor-pointer',
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          )}
          onClick={() => setMessage(null)}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Column 1 & 2: Products Menu */}
        <div className="col-span-2 space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => { setShowAddProduct(!showAddProduct); setShowAddCategory(false); }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600"
            >
              + Add Product
            </button>
            <button
              onClick={() => { setShowAddCategory(!showAddCategory); setShowAddProduct(false); }}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600"
            >
              + Add Category
            </button>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Add Category Form */}
          {showAddCategory && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
              <h3 className="font-bold mb-3">Create Category</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Category name (e.g., Pizzas, Drinks)"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border dark:bg-gray-700"
                  onKeyDown={e => e.key === 'Enter' && createCategory()}
                />
                <button 
                  onClick={createCategory} 
                  disabled={saving}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button 
                  onClick={() => setShowAddCategory(false)} 
                  className="px-6 py-2 bg-gray-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add Product Form */}
          {showAddProduct && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
              <h3 className="font-bold mb-3">Create Product</h3>
              <div className="grid grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Name (e.g., Margherita Pizza)"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="col-span-2 px-4 py-2 rounded-lg border dark:bg-gray-700"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price (€)"
                  value={newProduct.price}
                  onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="px-4 py-2 rounded-lg border dark:bg-gray-700"
                />
                <select
                  value={newProduct.categoryId}
                  onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                  className="px-4 py-2 rounded-lg border dark:bg-gray-700"
                >
                  <option value="">No Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={createProduct}
                  disabled={saving}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : '✓ Save Product'}
                </button>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Products by Category */}
          {productsByCategory.map(({ category, products: catProducts }) => (
            <div key={category.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
              <h3 className="font-bold text-lg mb-3">{category.name}</h3>
              <div className="grid grid-cols-4 gap-3">
                {catProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToOrder(product)}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-lg hover:scale-105 transition-all text-left"
                  >
                    <div className="font-bold truncate">{product.name}</div>
                    <div className="text-green-600 font-bold">€{Number(product.sellingPrice).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Uncategorized Products */}
          {uncategorizedProducts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
              <h3 className="font-bold text-lg mb-3">Other Products</h3>
              <div className="grid grid-cols-4 gap-3">
                {uncategorizedProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToOrder(product)}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-lg hover:scale-105 transition-all text-left"
                  >
                    <div className="font-bold truncate">{product.name}</div>
                    <div className="text-green-600 font-bold">€{Number(product.sellingPrice).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {products.length === 0 && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="font-bold text-xl mb-2">No Products Yet</h3>
              <p className="text-gray-500">Click "+ Add Product" to create your first menu item</p>
            </div>
          )}
        </div>

        {/* Column 3: Order Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-4">📝 Table Order</h2>

          {/* Table Selection */}
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Select Table</label>
            <div className="grid grid-cols-4 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8'].map(num => (
                <button
                  key={num}
                  onClick={() => setTableNumber(num)}
                  className={cn(
                    'py-3 rounded-lg font-bold transition-all',
                    tableNumber === num
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-center py-6">Click products to add</p>
            ) : (
              orderItems.map(item => (
                <div key={item.product.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold">{item.product.name}</span>
                    <span className="font-bold">€{(Number(item.product.sellingPrice) * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold hover:bg-red-200"
                    >
                      -
                    </button>
                    <span className="font-bold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold hover:bg-green-200"
                    >
                      +
                    </button>
                    <input
                      type="text"
                      placeholder="Notes..."
                      value={item.notes}
                      onChange={e => updateNotes(item.product.id, e.target.value)}
                      className="flex-1 px-2 py-1 text-sm rounded border dark:bg-gray-600"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Notes */}
          <input
            type="text"
            placeholder="Order notes..."
            value={orderNotes}
            onChange={e => setOrderNotes(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 mb-4"
          />

          {/* Total */}
          <div className="flex justify-between text-2xl font-bold mb-4 pt-4 border-t">
            <span>Total:</span>
            <span className="text-green-600">€{total.toFixed(2)}</span>
          </div>

          {/* Send Button */}
          <button
            onClick={sendToKitchen}
            disabled={orderItems.length === 0 || sending}
            className={cn(
              'w-full py-4 rounded-xl text-xl font-bold transition-all',
              orderItems.length === 0 || sending
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg'
            )}
          >
            {sending ? '🔄 Sending...' : '🔥 Send to Kitchen'}
          </button>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
