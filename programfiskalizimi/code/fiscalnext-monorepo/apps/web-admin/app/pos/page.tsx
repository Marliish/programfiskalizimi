'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Input } from '@/components/ui';
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiCreditCard,
  FiDollarSign,
  FiSmartphone,
  FiPrinter,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { productsApi, transactionsApi, settingsApi, whatsappApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { generateWhatsAppReceipt, shareViaWhatsApp, type ReceiptData } from '@/lib/utils/receiptGenerator';
import { useTranslation } from '@/lib/i18n';

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  taxRate: number;
  currency?: string;
  stock?: { quantity: number }[];
  imageUrl?: string;
  category?: { name: string };
}

interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  currency: string;
  subtotal: number;
  total: number;
}

type PaymentMethod = 'cash' | 'card' | 'mobile';

// Format currency helper
const formatCurrency = (amount: number, currency: string = 'ALL') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export default function POSPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [businessInfo, setBusinessInfo] = useState<any>({});
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState<boolean>(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState<boolean>(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState<boolean>(false);

  // Fetch business settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsApi.get();
        if (res.data.success) {
          setBusinessInfo(res.data.settings || {});
        }
      } catch (e) {
        // Use defaults
      }
    };
    fetchSettings();
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getAll({ search: searchQuery, limit: 50 });
      if (response.data.success) {
        setProducts(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle product search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    
    const price = Number(product.sellingPrice || 0);
    const tax = Number(product.taxRate || 0);

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: price,
        taxRate: tax,
        currency: product.currency || 'ALL',
        subtotal: price,
        total: price * (1 + tax / 100),
      };
      setCart([...cart, newItem]);
      toast.success(`${product.name} added to cart`);
    }
  };

  // Update item quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          const subtotal = item.unitPrice * newQuantity;
          const total = subtotal * (1 + item.taxRate / 100);
          return { ...item, quantity: newQuantity, subtotal, total };
        }
        return item;
      })
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
    toast.success('Item removed from cart');
  };

  // Clear cart
  const clearCart = () => {
    if (!confirm('Clear entire cart?')) return;
    setCart([]);
  };

  // Group cart by currency for totals
  const cartByCurrency = cart.reduce((acc, item) => {
    const curr = item.currency;
    if (!acc[curr]) {
      acc[curr] = { subtotal: 0, tax: 0 };
    }
    acc[curr].subtotal += item.subtotal;
    acc[curr].tax += item.subtotal * (item.taxRate / 100);
    return acc;
  }, {} as Record<string, { subtotal: number; tax: number }>);

  const currencies = Object.keys(cartByCurrency);
  const primaryCurrency = currencies[0] || 'ALL';
  const hasMixedCurrencies = currencies.length > 1;

  // Calculate totals (for single currency carts)
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = cart.reduce(
    (sum, item) => sum + item.subtotal * (item.taxRate / 100),
    0
  );
  const total = subtotal + taxAmount;

  // Calculate change
  const change = amountReceived ? parseFloat(amountReceived) - total : 0;

  // Complete transaction
  const completeTransaction = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    if (paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < total)) {
      toast.error('Insufficient payment amount!');
      return;
    }

    setProcessingPayment(true);
    try {
      const transactionData = {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        })),
        payments: [
          {
            paymentMethod,
            amount: paymentMethod === 'cash' ? parseFloat(amountReceived) : total,
          },
        ],
      };

      const response = await transactionsApi.create(transactionData);

      if (response.data.success) {
        toast.success(t('completed') + '!');
        
        // Store transaction for receipt modal
        setLastTransaction({
          ...response.data.transaction,
          cart: [...cart],
          paymentMethod,
          amountPaid: paymentMethod === 'cash' ? parseFloat(amountReceived) : total,
          change: paymentMethod === 'cash' ? parseFloat(amountReceived) - total : 0,
        });
        
        // Show receipt modal
        setShowReceiptModal(true);

        // Clear cart and reset
        setCart([]);
        setAmountReceived('');
        setPaymentMethod('cash');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Transaction failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Print receipt (browser print)
  const printReceipt = (transaction: any) => {
    const receiptWindow = window.open('', '_blank', 'width=300,height=600');
    if (!receiptWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${transaction.transactionNumber}</title>
          <style>
            body { font-family: monospace; max-width: 300px; margin: 20px auto; }
            h2 { text-align: center; margin-bottom: 10px; }
            .line { border-top: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .bold { font-weight: bold; }
            .center { text-align: center; }
            .items { margin: 10px 0; }
          </style>
        </head>
        <body>
          <h2>FiscalNext</h2>
          <div class="center">Receipt #${transaction.transactionNumber}</div>
          <div class="center">${new Date(transaction.createdAt).toLocaleString()}</div>
          <div class="line"></div>
          
          <div class="items">
            ${cart
              .map(
                (item) => `
              <div class="row">
                <span>${item.productName} x${item.quantity}</span>
                <span>${formatCurrency(item.total, item.currency)}</span>
              </div>
            `
              )
              .join('')}
          </div>
          
          <div class="line"></div>
          ${hasMixedCurrencies 
            ? currencies.map(currency => `
              <div class="row" style="font-size: 10px; color: #666;">${currency}</div>
              <div class="row"><span>Subtotal:</span><span>${formatCurrency(cartByCurrency[currency].subtotal, currency)}</span></div>
              <div class="row"><span>Tax:</span><span>${formatCurrency(cartByCurrency[currency].tax, currency)}</span></div>
              <div class="row bold"><span>TOTAL:</span><span>${formatCurrency(cartByCurrency[currency].subtotal + cartByCurrency[currency].tax, currency)}</span></div>
            `).join('<div class="line"></div>')
            : `
              <div class="row"><span>Subtotal:</span><span>${formatCurrency(subtotal, primaryCurrency)}</span></div>
              <div class="row"><span>Tax:</span><span>${formatCurrency(taxAmount, primaryCurrency)}</span></div>
              <div class="row bold"><span>TOTAL:</span><span>${formatCurrency(total, primaryCurrency)}</span></div>
            `
          }
          
          ${
            paymentMethod === 'cash' && !hasMixedCurrencies
              ? `
            <div class="line"></div>
            <div class="row"><span>Cash Received:</span><span>${formatCurrency(parseFloat(amountReceived), primaryCurrency)}</span></div>
            <div class="row bold"><span>Change:</span><span>${formatCurrency(change, primaryCurrency)}</span></div>
          `
              : ''
          }
          
          <div class="line"></div>
          <div class="center">Thank you for your business!</div>
          <div class="center">fiscalnext.com</div>
        </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
    setTimeout(() => {
      receiptWindow.print();
      receiptWindow.close();
    }, 250);
  };

  return (
    <DashboardLayout title="Point of Sale" subtitle="Process customer transactions">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Search & List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Search products by name, SKU, or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 w-full"
                />
              </div>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No products found
                </div>
              ) : (
                products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-3 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all text-left"
                  >
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                    )}
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{product.category?.name}</div>
                    <div className="text-primary-600 font-bold">
                      {formatCurrency(Number(product.sellingPrice || 0), product.currency || 'ALL')}
                    </div>
                    {product.stock && product.stock[0] && (
                      <div className="text-xs text-gray-500 mt-1">
                        Stock: {Number(product.stock[0].quantity || 0)}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right: Cart & Payment */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Cart</h3>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Clear All
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FiDollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {item.productName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(item.unitPrice, item.currency)} × {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="w-20 text-right font-semibold">
                      {formatCurrency(item.total, item.currency)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {cart.length > 0 && (
            <>
              {/* Totals */}
              <Card>
                <div className="space-y-2">
                  {hasMixedCurrencies ? (
                    <>
                      <div className="text-xs text-orange-600 mb-2">Mixed currencies in cart</div>
                      {currencies.map((currency) => (
                        <div key={currency} className="border-b border-gray-100 pb-2 mb-2 last:border-0">
                          <div className="text-xs font-semibold text-gray-500 mb-1">{currency}</div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(cartByCurrency[currency].subtotal, currency)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Tax:</span>
                            <span>{formatCurrency(cartByCurrency[currency].tax, currency)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-gray-900">
                            <span>Total:</span>
                            <span>{formatCurrency(cartByCurrency[currency].subtotal + cartByCurrency[currency].tax, currency)}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal, primaryCurrency)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Tax:</span>
                        <span>{formatCurrency(taxAmount, primaryCurrency)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-xl font-bold">
                          <span>Total:</span>
                          <span className="text-primary-600">{formatCurrency(total, primaryCurrency)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Payment Method */}
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 border-2 rounded-md flex flex-col items-center gap-2 transition-colors ${
                      paymentMethod === 'cash'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FiDollarSign className="w-6 h-6" />
                    <span className="text-xs font-medium">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 border-2 rounded-md flex flex-col items-center gap-2 transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FiCreditCard className="w-6 h-6" />
                    <span className="text-xs font-medium">Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mobile')}
                    className={`p-3 border-2 rounded-md flex flex-col items-center gap-2 transition-colors ${
                      paymentMethod === 'mobile'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FiSmartphone className="w-6 h-6" />
                    <span className="text-xs font-medium">Mobile</span>
                  </button>
                </div>

                {paymentMethod === 'cash' && (
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      label="Amount Received"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder="0.00"
                    />
                    {change >= 0 && amountReceived && !hasMixedCurrencies && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <div className="flex justify-between font-semibold text-green-700">
                          <span>Change:</span>
                          <span>{formatCurrency(change, primaryCurrency)}</span>
                        </div>
                      </div>
                    )}
                    {change < 0 && amountReceived && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                        Insufficient amount!
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="primary"
                  onClick={completeTransaction}
                  disabled={processingPayment}
                  isLoading={processingPayment}
                  className="w-full mt-4"
                  size="lg"
                >
                  <FiCheck className="w-5 h-5 mr-2" />
                  {t('checkout')}
                </Button>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Receipt Success Modal */}
      {showReceiptModal && lastTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Success Header */}
            <div className="bg-green-500 text-white p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold">Transaksioni u Kompletua!</h2>
              <p className="text-green-100 mt-2">
                Fatura #{lastTransaction.transactionNumber}
              </p>
            </div>

            {/* Transaction Summary */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-lg">
                <span className="text-gray-600">{t('total')}:</span>
                <span className="font-bold text-2xl">
                  {formatCurrency(lastTransaction.total || 0, lastTransaction.cart?.[0]?.currency || 'ALL')}
                </span>
              </div>

              {lastTransaction.change > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('change')}:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(lastTransaction.change, lastTransaction.cart?.[0]?.currency || 'ALL')}
                  </span>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-500 mb-3">Si dëshironi ta merrni faturën?</p>
                
                {/* Receipt Options */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      printReceipt(lastTransaction);
                    }}
                    className="flex items-center justify-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <FiPrinter className="w-6 h-6 text-blue-600" />
                    <span className="font-medium">{t('print')}</span>
                  </button>

                  <button
                    onClick={() => {
                      const receiptData: ReceiptData = {
                        businessName: businessInfo.businessName || 'FiscalNext',
                        businessAddress: businessInfo.address || '',
                        businessPhone: businessInfo.phone || '',
                        businessNUIS: businessInfo.nuis || '',
                        transactionNumber: lastTransaction.transactionNumber,
                        date: new Date(lastTransaction.createdAt || new Date()),
                        items: (lastTransaction.cart || []).map((item: CartItem) => ({
                          name: item.productName,
                          quantity: item.quantity,
                          unitPrice: item.unitPrice,
                          total: item.total,
                        })),
                        subtotal: lastTransaction.subtotal || 0,
                        taxAmount: lastTransaction.taxAmount || 0,
                        taxRate: 20,
                        total: lastTransaction.total || 0,
                        paymentMethod: lastTransaction.paymentMethod,
                        amountPaid: lastTransaction.amountPaid,
                        change: lastTransaction.change,
                        currency: lastTransaction.cart?.[0]?.currency || 'ALL',
                        fiscalCode: lastTransaction.fiscalCode || lastTransaction.iic,
                      };
                      const receipt = generateWhatsAppReceipt(receiptData);
                      shareViaWhatsApp(receipt);
                    }}
                    className="flex items-center justify-center gap-2 p-4 border-2 border-green-200 rounded-xl hover:border-green-500 bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <FaWhatsapp className="w-6 h-6 text-green-600" />
                    <span className="font-medium text-green-700">WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setLastTransaction(null);
                }}
                className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
