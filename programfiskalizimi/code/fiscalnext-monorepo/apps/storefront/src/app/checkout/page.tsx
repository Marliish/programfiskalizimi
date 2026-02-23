'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { CreditCard, Truck, MapPin, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ShippingAddress } from '@/types';

const STEPS = ['shipping', 'payment', 'review'] as const;
type Step = typeof STEPS[number];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, tax, total, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState<Step>('shipping');
  const [processing, setProcessing] = useState(false);

  // Shipping Information
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'AL',
    phone: '',
  });

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShippingAddress()) {
      setCurrentStep('payment');
    }
  };

  const validateShippingAddress = () => {
    const required = ['firstName', 'lastName', 'address', 'city', 'postalCode', 'phone'];
    const missing = required.filter((field) => !shippingAddress[field as keyof ShippingAddress]);
    
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentMethod === 'stripe' && !validateCardDetails()) {
      return;
    }

    setCurrentStep('review');
  };

  const validateCardDetails = () => {
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name) {
      toast.error('Please fill in all card details');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    setProcessing(true);

    try {
      // Create order
      const orderResponse = await api.createOrder({
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress,
        billingAddress: shippingAddress,
        shippingMethodId: 'standard',
        paymentMethod,
      });

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.error || 'Failed to create order');
      }

      const { order } = orderResponse.data;

      // Process payment based on method
      if (paymentMethod === 'stripe') {
        await processStripePayment(order.id);
      } else {
        await processPayPalPayment(order.id);
      }

      // Clear cart and redirect
      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  const processStripePayment = async (orderId: string) => {
    // Create payment intent
    const intentResponse = await api.createStripePaymentIntent(total * 100);
    if (!intentResponse.success || !intentResponse.data) {
      throw new Error('Failed to create payment intent');
    }

    // In production, use Stripe Elements to handle actual card payment
    // For now, simulate successful payment
    await api.confirmStripePayment(intentResponse.data.clientSecret, orderId);
  };

  const processPayPalPayment = async (orderId: string) => {
    // Create PayPal order
    const paypalResponse = await api.createPayPalOrder(orderId);
    if (!paypalResponse.success || !paypalResponse.data) {
      throw new Error('Failed to create PayPal order');
    }

    // In production, redirect to PayPal for approval
    // For now, simulate successful payment
    await api.capturePayPalPayment(paypalResponse.data.id, orderId);
  };

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step;
            const isCompleted = STEPS.indexOf(currentStep) > index;
            
            return (
              <div key={step} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className="ml-2 font-medium capitalize">{step}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-24 h-1 mx-4 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Shipping Step */}
            {currentStep === 'shipping' && (
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Shipping Information</h2>
                </div>

                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={shippingAddress.firstName}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={shippingAddress.lastName}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })}
                      required
                    />
                  </div>

                  <Input
                    label="Address"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    required
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="City"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      required
                    />
                    <Input
                      label="Postal Code"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Phone"
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                      required
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <select
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="AL">Albania</option>
                        <option value="XK">Kosovo</option>
                        <option value="MK">North Macedonia</option>
                      </select>
                    </div>
                  </div>

                  <Button type="submit" size="lg" fullWidth>
                    Continue to Payment
                  </Button>
                </form>
              </Card>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && (
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Payment Method</h2>
                </div>

                {/* Payment Method Selection */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-6 rounded-xl border-2 transition ${
                      paymentMethod === 'stripe' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="font-semibold">Credit Card</p>
                    <p className="text-sm text-gray-600">Visa, Mastercard, Amex</p>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-6 rounded-xl border-2 transition ${
                      paymentMethod === 'paypal' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="text-3xl mb-2">💳</div>
                    <p className="font-semibold">PayPal</p>
                    <p className="text-sm text-gray-600">Fast & secure</p>
                  </button>
                </div>

                <form onSubmit={handlePaymentSubmit}>
                  {paymentMethod === 'stripe' && (
                    <div className="space-y-4">
                      <Input
                        label="Card Number"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                        required
                      />
                      <Input
                        label="Cardholder Name"
                        placeholder="John Doe"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Expiry Date"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          required
                        />
                        <Input
                          label="CVC"
                          placeholder="123"
                          value={cardDetails.cvc}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      fullWidth
                      onClick={() => setCurrentStep('shipping')}
                    >
                      Back
                    </Button>
                    <Button type="submit" size="lg" fullWidth>
                      Review Order
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Review Step */}
            {currentStep === 'review' && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Order</h2>

                {/* Shipping Address */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Shipping Address</h3>
                    <button
                      onClick={() => setCurrentStep('shipping')}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-gray-700">
                    {shippingAddress.firstName} {shippingAddress.lastName}<br />
                    {shippingAddress.address}<br />
                    {shippingAddress.city}, {shippingAddress.postalCode}<br />
                    {shippingAddress.phone}
                  </p>
                </div>

                {/* Payment Method */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Payment Method</h3>
                    <button
                      onClick={() => setCurrentStep('payment')}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-gray-700 capitalize">{paymentMethod}</p>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={() => setCurrentStep('payment')}
                  >
                    Back
                  </Button>
                  <Button
                    size="lg"
                    fullWidth
                    onClick={handlePlaceOrder}
                    loading={processing}
                  >
                    Place Order
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.product.name} × {item.quantity}</span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
