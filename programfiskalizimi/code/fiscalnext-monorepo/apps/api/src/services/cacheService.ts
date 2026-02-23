// Redis Cache Service for API Performance Optimization
import Redis from 'ioredis';

class CacheService {
  private client: Redis | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.REDIS_ENABLED === 'true';
    if (this.enabled) {
      this.connect();
    }
  }

  private connect() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: Number(process.env.REDIS_DB) || 0,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis error:', err);
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.enabled = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.client) return null;

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    if (!this.enabled || !this.client) return false;

    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.enabled || !this.client) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    if (!this.enabled || !this.client) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache invalidate error:', error);
      return false;
    }
  }

  // Helper method to wrap a function with caching
  async cached<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Store in cache
    await this.set(key, data, ttl);

    return data;
  }

  // Cache keys generator
  keys = {
    products: (filters?: any) => {
      const filterStr = filters ? JSON.stringify(filters) : 'all';
      return `products:${filterStr}`;
    },
    product: (id: number) => `product:${id}`,
    productBarcode: (barcode: string) => `product:barcode:${barcode}`,
    categories: () => 'categories:all',
    dashboardStats: (date: string) => `dashboard:stats:${date}`,
    sales: (page: number, filters?: any) => {
      const filterStr = filters ? JSON.stringify(filters) : 'all';
      return `sales:${page}:${filterStr}`;
    },
  };
}

export const cacheService = new CacheService();
