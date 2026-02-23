import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Default to localhost for dev, can be overridden in settings
const getBaseURL = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000'; // Android emulator
  }
  return 'http://localhost:5000'; // iOS simulator
};

export const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      // Navigate to login (would need navigation ref)
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiClient.post('/v1/auth/login', { email, password }),
  
  // Products
  getProducts: (params?: { search?: string; category?: number; page?: number }) =>
    apiClient.get('/v1/products', { params }),
  
  getProductByBarcode: (barcode: string) =>
    apiClient.get(`/v1/products/barcode/${barcode}`),
  
  // POS
  createSale: (data: any) =>
    apiClient.post('/v1/pos/sales', data),
  
  getSales: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/v1/pos/sales', { params }),
  
  // Customers
  getCustomers: (params?: { search?: string }) =>
    apiClient.get('/v1/customers', { params }),
  
  createCustomer: (data: any) =>
    apiClient.post('/v1/customers', data),
  
  // Sync endpoints
  sync: {
    uploadChanges: (changes: any) =>
      apiClient.post('/v1/sync/upload', changes),
    
    downloadChanges: (lastSyncTime: number) =>
      apiClient.get('/v1/sync/download', { params: { since: lastSyncTime } }),
  },
};
