import type {
  Product,
  Category,
  OnlineOrder,
  Coupon,
  ShippingMethod,
  Customer,
  ShippingAddress,
  ProductReview,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Products
  async getProducts(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/storefront/products?${query}`);
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return this.request(`/api/storefront/products/${id}`);
  }

  async searchProducts(query: string): Promise<ApiResponse<Product[]>> {
    return this.request(`/api/storefront/products/search?q=${query}`);
  }

  // Categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request('/api/storefront/categories');
  }

  async getCategoryProducts(categoryId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/storefront/categories/${categoryId}/products?${query}`);
  }

  // Cart & Checkout
  async applyCoupon(code: string): Promise<ApiResponse<Coupon>> {
    return this.request('/api/storefront/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async getShippingMethods(): Promise<ApiResponse<ShippingMethod[]>> {
    return this.request('/api/storefront/shipping-methods');
  }

  async createOrder(orderData: {
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      price: number;
    }>;
    shippingAddress: ShippingAddress;
    billingAddress?: ShippingAddress;
    shippingMethodId: string;
    paymentMethod: string;
    couponCode?: string;
  }): Promise<ApiResponse<{ order: OnlineOrder; paymentIntent?: any }>> {
    return this.request('/api/storefront/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Payment
  async createStripePaymentIntent(amount: number): Promise<ApiResponse<{ clientSecret: string }>> {
    return this.request('/api/storefront/payments/stripe/intent', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async confirmStripePayment(
    paymentIntentId: string,
    orderId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.request('/api/storefront/payments/stripe/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId, orderId }),
    });
  }

  async createPayPalOrder(orderId: string): Promise<ApiResponse<{ id: string }>> {
    return this.request('/api/storefront/payments/paypal/create', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  }

  async capturePayPalPayment(
    paypalOrderId: string,
    orderId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.request('/api/storefront/payments/paypal/capture', {
      method: 'POST',
      body: JSON.stringify({ paypalOrderId, orderId }),
    });
  }

  // Customer Portal
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; customer: Customer }>> {
    const response = await this.request<{ token: string; customer: Customer }>('/api/storefront/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<ApiResponse<{ token: string; customer: Customer }>> {
    const response = await this.request<{ token: string; customer: Customer }>('/api/storefront/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
    }

    return response;
  }

  logout() {
    this.setToken(null);
  }

  async getProfile(): Promise<ApiResponse<Customer>> {
    return this.request('/api/storefront/account/profile');
  }

  async updateProfile(data: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return this.request('/api/storefront/account/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getOrders(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<OnlineOrder>>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/storefront/account/orders?${query}`);
  }

  async getOrder(id: string): Promise<ApiResponse<OnlineOrder>> {
    return this.request(`/api/storefront/account/orders/${id}`);
  }

  async getShippingAddresses(): Promise<ApiResponse<ShippingAddress[]>> {
    return this.request('/api/storefront/account/addresses');
  }

  async addShippingAddress(address: Omit<ShippingAddress, 'id'>): Promise<ApiResponse<ShippingAddress>> {
    return this.request('/api/storefront/account/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    });
  }

  async updateShippingAddress(id: string, address: Partial<ShippingAddress>): Promise<ApiResponse<ShippingAddress>> {
    return this.request(`/api/storefront/account/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(address),
    });
  }

  async deleteShippingAddress(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request(`/api/storefront/account/addresses/${id}`, {
      method: 'DELETE',
    });
  }

  // Reviews
  async getProductReviews(productId: string): Promise<ApiResponse<ProductReview[]>> {
    return this.request(`/api/storefront/products/${productId}/reviews`);
  }

  async addProductReview(productId: string, review: {
    rating: number;
    title?: string;
    comment?: string;
  }): Promise<ApiResponse<ProductReview>> {
    return this.request(`/api/storefront/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
