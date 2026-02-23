/**
 * Application monitoring - performance metrics and error tracking
 */

import { logger } from './logger.js';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ErrorMetric {
  message: string;
  stack?: string;
  timestamp: number;
  context?: Record<string, any>;
  count: number;
}

class Monitor {
  private metrics: PerformanceMetric[] = [];
  private errors: Map<string, ErrorMetric> = new Map();
  private maxMetrics = 1000;
  private startTime = Date.now();

  // Track performance
  startTimer(name: string): () => void {
    const start = Date.now();
    
    return (metadata?: Record<string, any>) => {
      const duration = Date.now() - start;
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata,
      });

      // Log slow operations
      if (duration > 1000) {
        logger.warn(`Slow operation detected: ${name}`, {
          duration: `${duration}ms`,
          ...metadata,
        });
      }
    };
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  // Track errors
  recordError(error: Error, context?: Record<string, any>): void {
    const key = `${error.name}:${error.message}`;
    const existing = this.errors.get(key);

    if (existing) {
      existing.count++;
      existing.timestamp = Date.now();
    } else {
      this.errors.set(key, {
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        context,
        count: 1,
      });
    }

    logger.error('Error tracked', context, error);

    // Alert on high error rates
    if (this.getErrorRate() > 10) { // More than 10 errors per minute
      logger.error('High error rate detected!', {
        rate: this.getErrorRate(),
        uniqueErrors: this.errors.size,
      });
    }
  }

  // Get metrics
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return this.metrics;
  }

  getAverageResponseTime(name?: string): number {
    const filtered = name ? this.metrics.filter(m => m.name === name) : this.metrics;
    
    if (filtered.length === 0) return 0;
    
    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return Math.round(sum / filtered.length);
  }

  getPercentile(percentile: number, name?: string): number {
    const filtered = name ? this.metrics.filter(m => m.name === name) : this.metrics;
    
    if (filtered.length === 0) return 0;
    
    const sorted = filtered.map(m => m.duration).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[index] || 0;
  }

  // Error metrics
  getErrors(limit: number = 50): ErrorMetric[] {
    return Array.from(this.errors.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getErrorRate(): number {
    const oneMinuteAgo = Date.now() - 60000;
    const recentErrors = Array.from(this.errors.values())
      .filter(e => e.timestamp > oneMinuteAgo)
      .reduce((sum, e) => sum + e.count, 0);
    
    return recentErrors;
  }

  clearErrors(): void {
    this.errors.clear();
  }

  // Health check
  getHealthStatus() {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.getErrorRate();
    const avgResponseTime = this.getAverageResponseTime();
    const p95 = this.getPercentile(95);

    return {
      status: errorRate > 10 || avgResponseTime > 200 ? 'degraded' : 'healthy',
      uptime: Math.floor(uptime / 1000), // seconds
      metrics: {
        totalRequests: this.metrics.length,
        averageResponseTime: avgResponseTime,
        p50: this.getPercentile(50),
        p95: p95,
        p99: this.getPercentile(99),
        errorRate: errorRate,
        uniqueErrors: this.errors.size,
      },
    };
  }

  // Memory usage
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }

  // System stats
  getSystemStats() {
    return {
      health: this.getHealthStatus(),
      memory: this.getMemoryUsage(),
      errors: {
        total: Array.from(this.errors.values()).reduce((sum, e) => sum + e.count, 0),
        unique: this.errors.size,
        rate: this.getErrorRate(),
        top: this.getErrors(5),
      },
    };
  }

  reset(): void {
    this.metrics = [];
    this.errors.clear();
    this.startTime = Date.now();
  }
}

// Singleton instance
export const monitor = new Monitor();

// Middleware for automatic request monitoring
export function monitoringMiddleware(request: any, reply: any, done: () => void) {
  const stopTimer = monitor.startTimer('http_request');

  reply.addHook('onSend', (req: any, rep: any, payload: any, cb: any) => {
    stopTimer({
      method: request.method,
      route: request.routerPath || request.url,
      statusCode: reply.statusCode,
    });

    cb(null, payload);
  });

  done();
}

// Error handler middleware
export function errorHandlerMiddleware(error: Error, request: any, reply: any) {
  monitor.recordError(error, {
    method: request.method,
    url: request.url,
    query: request.query,
  });

  const statusCode = (error as any).statusCode || 500;
  
  reply.status(statusCode).send({
    error: {
      message: error.message,
      statusCode,
    },
  });
}
