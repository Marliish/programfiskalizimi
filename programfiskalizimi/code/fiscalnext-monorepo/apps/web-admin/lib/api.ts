import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';

/**
 * API client with axios
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * API endpoints
 */
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  logout: () =>
    api.post('/auth/logout'),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => 
    api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  adjustStock: (data: { productId: string; quantity: number; type: 'add' | 'remove'; reason: string }) =>
    api.post('/stock/adjust', data),
};

export const customersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }) =>
    api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

export const categoriesApi = {
  getAll: (params?: { search?: string; parentId?: string | null; isActive?: boolean }) =>
    api.get('/categories', { params }),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const transactionsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; fromDate?: string; toDate?: string }) =>
    api.get('/pos/transactions', { params }),
  getById: (id: string) => api.get(`/pos/transactions/${id}`),
  create: (data: any) => api.post('/pos/transactions', data),
  void: (id: string) => api.post(`/pos/transactions/${id}/void`),
};

export const salesApi = {
  getAll: () => api.get('/sales'),
  getById: (id: string) => api.get(`/sales/${id}`),
  create: (data: any) => api.post('/sales', data),
};

export const reportsApi = {
  sales: (params?: { startDate?: string; endDate?: string; period?: string; exportFormat?: string }) =>
    api.get('/reports/sales', { params }),
  products: (params?: { startDate?: string; endDate?: string; limit?: number; type?: string; exportFormat?: string }) =>
    api.get('/reports/products', { params }),
  revenue: (params?: { startDate?: string; endDate?: string; groupBy?: string; exportFormat?: string }) =>
    api.get('/reports/revenue', { params }),
};

export const settingsApi = {
  getAll: () => api.get('/settings'),
  updateBusiness: (data: any) => api.put('/settings/business', data),
  updateUser: (data: any) => api.put('/settings/user', data),
  updateSystem: (data: any) => api.put('/settings/system', data),
};

export const employeesApi = {
  getAll: (params?: { search?: string; isActive?: boolean }) =>
    api.get('/employees', { params }),
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  getShifts: (params?: { employeeId?: string; startDate?: string; endDate?: string }) =>
    api.get('/employees/shifts/list', { params }),
  clockInOut: (data: { employeeId: string; type: 'in' | 'out'; notes?: string }) =>
    api.post('/employees/clock', data),
  addShift: (data: any) => api.post('/employees/shifts', data),
};

export const loyaltyApi = {
  getDashboard: (customerId: string) => api.get(`/loyalty/customers/${customerId}/dashboard`),
  getPointsHistory: (customerId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/loyalty/customers/${customerId}/points/history`, { params }),
  getCustomerTier: (customerId: string) => api.get(`/loyalty/customers/${customerId}/tier`),
  getRewards: (params?: { isActive?: boolean }) => api.get('/loyalty/rewards', { params }),
  createReward: (data: any) => api.post('/loyalty/rewards', data),
  updateReward: (id: string, data: any) => api.put(`/loyalty/rewards/${id}`, data),
  deleteReward: (id: string) => api.delete(`/loyalty/rewards/${id}`),
  redeemReward: (data: { customerId: string; rewardId: string; transactionId?: string }) =>
    api.post('/loyalty/rewards/redeem', data),
};

export const promotionsApi = {
  getAll: (params?: { isActive?: boolean; type?: string }) =>
    api.get('/promotions', { params }),
  getActive: () => api.get('/promotions/active'),
  getById: (id: string) => api.get(`/promotions/${id}`),
  create: (data: any) => api.post('/promotions', data),
  update: (id: string, data: any) => api.put(`/promotions/${id}`, data),
  delete: (id: string) => api.delete(`/promotions/${id}`),
  generateCode: () => api.post('/promotions/generate-code'),
  validateCode: (data: { code: string; orderAmount?: number }) =>
    api.post('/promotions/validate', data),
  applyToOrder: (data: { promotionId: string; orderAmount: number; items?: any[] }) =>
    api.post('/promotions/apply', data),
};

export const notificationsApi = {
  getAll: (params?: { read?: boolean; type?: string; page?: number; limit?: number }) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  create: (data: any) => api.post('/notifications', data),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data: any) => api.put('/notifications/preferences', data),
  getTemplates: () => api.get('/notifications/templates'),
  createTemplate: (data: any) => api.post('/notifications/templates', data),
  updateTemplate: (id: string, data: any) => api.put(`/notifications/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/notifications/templates/${id}`),
  sendManual: (data: any) => api.post('/notifications/send', data),
  getDeliveryStatus: (id: string) => api.get(`/notifications/${id}/status`),
};

export const auditLogsApi = {
  getAll: (params?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    // Transform params to match backend schema
    const backendParams: Record<string, any> = {};
    if (params?.userId) backendParams.userId = params.userId;
    if (params?.action) backendParams.action = params.action;
    if (params?.resourceType) backendParams.entityType = params.resourceType; // resourceType -> entityType
    if (params?.startDate) backendParams.startDate = params.startDate;
    if (params?.endDate) backendParams.endDate = params.endDate;
    if (params?.limit) backendParams.limit = params.limit;
    if (params?.page) backendParams.offset = ((params.page - 1) * (params.limit || 50)); // page -> offset
    return api.get('/audit', { params: backendParams });
  },
  getUserActivity: (userId: string, params?: { startDate?: string; endDate?: string }) =>
    api.get(`/audit/user/${userId}`, { params }),
  getResourceHistory: (resourceType: string, resourceId: string) =>
    api.get(`/audit/${resourceType}/${resourceId}`),
  create: (data: any) => api.post('/audit', data),
  export: (data?: { userId?: string; startDate?: string; endDate?: string; format?: 'csv' | 'json' }) =>
    api.post('/audit/export', data),
  getStats: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/audit/summary', { params }),
  search: (query: string) => api.get('/audit', { params: { q: query } }),
};
