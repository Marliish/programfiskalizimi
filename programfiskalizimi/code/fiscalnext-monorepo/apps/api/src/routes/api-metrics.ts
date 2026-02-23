// API Health Metrics and Performance Monitoring
import { FastifyPluginAsync } from 'fastify';

interface MetricData {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: number;
}

class MetricsCollector {
  private metrics: MetricData[] = [];
  private maxMetrics = 1000; // Keep last 1000 requests

  addMetric(metric: MetricData) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getStats(minutes: number = 5) {
    const cutoff = Date.now() - minutes * 60 * 1000;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0,
      };
    }

    const responseTimes = recentMetrics.map(m => m.responseTime);
    const errors = recentMetrics.filter(m => m.statusCode >= 400).length;

    return {
      totalRequests: recentMetrics.length,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      errorRate: (errors / recentMetrics.length) * 100,
      requestsPerMinute: recentMetrics.length / minutes,
      errors,
    };
  }

  getEndpointStats(endpoint: string) {
    const endpointMetrics = this.metrics.filter(m => m.endpoint === endpoint);
    
    if (endpointMetrics.length === 0) {
      return null;
    }

    const responseTimes = endpointMetrics.map(m => m.responseTime);
    const errors = endpointMetrics.filter(m => m.statusCode >= 400).length;

    return {
      endpoint,
      totalRequests: endpointMetrics.length,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      errorCount: errors,
      errorRate: (errors / endpointMetrics.length) * 100,
    };
  }

  getSlowestEndpoints(limit: number = 10) {
    const endpointMap = new Map<string, number[]>();

    this.metrics.forEach(m => {
      const key = `${m.method} ${m.endpoint}`;
      if (!endpointMap.has(key)) {
        endpointMap.set(key, []);
      }
      endpointMap.get(key)!.push(m.responseTime);
    });

    const avgTimes = Array.from(endpointMap.entries()).map(([endpoint, times]) => ({
      endpoint,
      avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length,
      requests: times.length,
    }));

    return avgTimes
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, limit);
  }
}

export const metricsCollector = new MetricsCollector();

const apiMetricsRoutes: FastifyPluginAsync = async (server) => {
  // Add metrics collection hook
  server.addHook('onResponse', async (request, reply) => {
    const responseTime = reply.getResponseTime();
    
    metricsCollector.addMetric({
      endpoint: request.url.split('?')[0], // Remove query params
      method: request.method,
      responseTime,
      statusCode: reply.statusCode,
      timestamp: Date.now(),
    });
  });

  // Get overall API health
  server.get('/health', async (request, reply) => {
    const stats = metricsCollector.getStats(5);
    
    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      stats,
    };

    // Mark as unhealthy if error rate is high
    if (stats.errorRate > 10) {
      health.status = 'degraded';
    }

    if (stats.avgResponseTime > 1000) {
      health.status = 'slow';
    }

    return health;
  });

  // Get detailed metrics
  server.get('/metrics', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { minutes = 5 } = request.query as { minutes?: number };
    
    return {
      success: true,
      period: `Last ${minutes} minutes`,
      stats: metricsCollector.getStats(Number(minutes)),
      slowestEndpoints: metricsCollector.getSlowestEndpoints(10),
    };
  });

  // Get endpoint-specific metrics
  server.get('/metrics/:endpoint', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { endpoint } = request.params as { endpoint: string };
    const decoded = decodeURIComponent(endpoint);
    
    const stats = metricsCollector.getEndpointStats(decoded);

    if (!stats) {
      reply.code(404);
      return { error: 'No metrics found for this endpoint' };
    }

    return {
      success: true,
      stats,
    };
  });

  // Performance report
  server.get('/performance-report', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const stats5min = metricsCollector.getStats(5);
    const stats15min = metricsCollector.getStats(15);
    const stats60min = metricsCollector.getStats(60);

    return {
      success: true,
      report: {
        last5Minutes: stats5min,
        last15Minutes: stats15min,
        lastHour: stats60min,
        slowestEndpoints: metricsCollector.getSlowestEndpoints(10),
        systemInfo: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform,
        },
      },
    };
  });
};

export default apiMetricsRoutes;
