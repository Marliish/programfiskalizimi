export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  sellingPrice: number;
  costPrice?: number;
  taxRate: number;
  imageUrl?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  isActive: boolean;
  stock?: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  price: number;
  stock?: number;
  attributes: Record<string, string>;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  price: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface ShippingAddress {
  id?: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface PaymentMethod {
  type: 'stripe' | 'paypal' | 'card';
  cardLast4?: string;
  cardBrand?: string;
}

export interface OnlineOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerEmail: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  shippingMethod: string;
  
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  
  items: OrderItem[];
  
  trackingNumber?: string;
  
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRate: number;
  total: number;
}

export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthday?: string;
  loyaltyPoints: number;
  totalSpent: number;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  cost: number;
  estimatedDays?: number;
  isActive: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerId?: string;
  customerName: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
