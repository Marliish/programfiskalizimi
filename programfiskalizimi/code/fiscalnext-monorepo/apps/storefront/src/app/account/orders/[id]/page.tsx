'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, Calendar, CreditCard } from 'lucide-react';
import type { OnlineOrder } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OnlineOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const fetchOrder = async () => {
    const response = await api.getOrder(params.id as string);
    if (response.success && response.data) {
      setOrder(response.data);
    }
    setLoading(false);
  };

  const getOrderTimeline = () => {
    if (!order) return [];

    const timeline = [
      {
        status: 'pending',
        label: 'Order Placed',
        date: order.createdAt,
        completed: true,
        icon: Package,
      },
      {
        status: 'processing',
        label: 'Processing',
        date: order.createdAt,
        completed: ['processing', 'shipped', 'delivered'].includes(order.status),
        icon: CheckCircle,
      },
      {
        status: 'shipped',
        label: 'Shipped',
        date: order.shippedAt,
        completed: ['shipped', 'delivered'].includes(order.status),
        icon: Truck,
      },
      {
        status: 'delivered',
        label: 'Delivered',
        date: order.deliveredAt,
        completed: order.status === 'delivered',
        icon: CheckCircle,
      },
    ];

    return timeline;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-6">This order doesn't exist or you don't have access to it</p>
          <Button onClick={() => router.push('/account/orders')}>
            Back to Orders
          </Button>
        </Card>
      </div>
    );
  }

  const timeline = getOrderTimeline();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(order.total)}
              </p>
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-full mt-2 ${
                  order.status === 'delivered'
                    ? 'bg-green-100 text-green-700'
                    : order.status === 'shipped'
                    ? 'bg-blue-100 text-blue-700'
                    : order.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {order.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Timeline */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Order Timeline</h2>
              
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Timeline Steps */}
                <div className="space-y-8">
                  {timeline.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.status} className="relative flex items-start gap-6">
                        {/* Icon */}
                        <div
                          className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white ${
                            step.completed
                              ? 'bg-blue-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 ${
                              step.completed ? 'text-white' : 'text-gray-500'
                            }`}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-8">
                          <h3
                            className={`text-lg font-semibold ${
                              step.completed ? 'text-gray-900' : 'text-gray-500'
                            }`}
                          >
                            {step.label}
                          </h3>
                          {step.date && step.completed && (
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDate(step.date)}
                            </p>
                          )}
                          {step.status === 'shipped' && order.trackingNumber && step.completed && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                Tracking Number
                              </p>
                              <p className="text-sm font-mono text-blue-600">
                                {order.trackingNumber}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Items</h2>
              
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-4xl">📦</span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.productName}
                      </h3>
                      {item.variantName && (
                        <p className="text-sm text-gray-600 mb-2">{item.variantName}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(item.total)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatPrice(item.unitPrice)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-semibold">{formatPrice(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span className="font-semibold">{formatPrice(order.taxAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Shipping Address */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Shipping Address</h3>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                <p className="font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                <p className="mt-2">{order.shippingAddress.phone}</p>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Payment Method</h3>
              </div>
              <div className="text-sm">
                <p className="text-gray-700 capitalize mb-2">{order.paymentMethod}</p>
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                    order.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : order.paymentStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {order.paymentStatus.toUpperCase()}
                </span>
                {order.paidAt && (
                  <p className="text-gray-600 mt-2 text-xs">
                    Paid on {formatDate(order.paidAt)}
                  </p>
                )}
              </div>
            </Card>

            {/* Delivery Method */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Delivery Method</h3>
              </div>
              <p className="text-sm text-gray-700 capitalize">{order.shippingMethod}</p>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button variant="outline" fullWidth>
                Download Invoice
              </Button>
              <Button variant="outline" fullWidth>
                Request Return
              </Button>
              <Link href="/help">
                <Button variant="ghost" fullWidth>
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
