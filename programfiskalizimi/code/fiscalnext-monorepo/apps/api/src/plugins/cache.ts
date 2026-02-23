/**
 * Simple in-memory cache with TTL support
 * In production, replace with Redis
 */

interface CacheEntry {
  value: any;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  set(key: string, value: any, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        expiresIn: Math.max(0, entry.expiresAt - Date.now()),
      })),
    };
  }
}

// Singleton instance
export const cache = new SimpleCache();

// Cache middleware for Fastify routes
export function cacheMiddleware(ttlSeconds: number = 300) {
  return async (request: any, reply: any) => {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return;
    }

    // Create cache key from URL and query params
    const cacheKey = `route:${request.url}`;
    
    // Check if cached
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      reply.header('X-Cache', 'HIT');
      return reply.send(cachedResponse);
    }

    // Mark as cache miss
    reply.header('X-Cache', 'MISS');

    // Intercept the response to cache it
    const originalSend = reply.send.bind(reply);
    reply.send = function (data: any) {
      if (reply.statusCode === 200) {
        cache.set(cacheKey, data, ttlSeconds);
      }
      return originalSend(data);
    };
  };
}

// Helper to generate cache keys
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

// Invalidate cache by pattern
export function invalidateCachePattern(pattern: string): number {
  let invalidated = 0;
  const regex = new RegExp(pattern);
  
  for (const key of Array.from((cache as any).cache.keys())) {
    if (regex.test(key)) {
      cache.delete(key);
      invalidated++;
    }
  }
  
  return invalidated;
}
