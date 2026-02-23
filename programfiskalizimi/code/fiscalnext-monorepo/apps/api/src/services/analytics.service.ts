// Analytics Service - Sales trends, top products, customer insights
import { prisma } from '@fiscalnext/database';
import { Prisma } from '@prisma/client';

export class AnalyticsService {
  private cacheValidityMinutes = 15; // Cache for 15 minutes

  /**
   * Get sales trends (daily, weekly, monthly)
   */
  async getSalesTrends(tenantId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily', days = 30) {
    const cacheKey = `sales_trends_${period}_${days}`;
    
    // Try to get from cache
    const cached = await this.getFromCache(tenantId, cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        status: 'completed',
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        total: true,
        subtotal: true,
        taxAmount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by period
    const trends = this.groupTransactionsByPeriod(transactions, period);

    // Calculate summary
    const summary = {
      totalRevenue: transactions.reduce((sum, t) => sum + Number(t.total), 0),
      totalTransactions: transactions.length,
      averageOrderValue: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + Number(t.total), 0) / transactions.length 
        : 0,
    };

    const result = { trends, summary };

    // Cache result
    await this.saveToCache(tenantId, cacheKey, 'sales_trends', result);

    return result;
  }

  /**
   * Get top products by revenue or quantity
   */
  async getTopProducts(tenantId: string, by: 'revenue' | 'quantity' = 'revenue', limit = 10, days = 30) {
    const cacheKey = `top_products_${by}_${limit}_${days}`;
    
    // Try to get from cache
    const cached = await this.getFromCache(tenantId, cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get transaction items
    const items = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          tenantId,
          status: 'completed',
          createdAt: {
            gte: startDate,
          },
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            imageUrl: true,
          },
        },
      },
    });

    // Group by product
    const productStats = new Map<string, {
      product: any;
      quantity: number;
      revenue: number;
      transactionCount: number;
    }>();

    for (const item of items) {
      const existing = productStats.get(item.productId) || {
        product: item.product,
        quantity: 0,
        revenue: 0,
        transactionCount: 0,
      };

      existing.quantity += Number(item.quantity);
      existing.revenue += Number(item.total);
      existing.transactionCount += 1;

      productStats.set(item.productId, existing);
    }

    // Sort and limit
    const sortedProducts = Array.from(productStats.values())
      .sort((a, b) => {
        if (by === 'revenue') {
          return b.revenue - a.revenue;
        } else {
          return b.quantity - a.quantity;
        }
      })
      .slice(0, limit);

    // Cache result
    await this.saveToCache(tenantId, cacheKey, 'top_products', sortedProducts);

    return sortedProducts;
  }

  /**
   * Get customer insights
   */
  async getCustomerInsights(tenantId: string, limit = 10, days = 30) {
    const cacheKey = `customer_insights_${limit}_${days}`;
    
    // Try to get from cache
    const cached = await this.getFromCache(tenantId, cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get top customers
    const topCustomers = await prisma.customer.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        totalSpent: true,
        loyaltyPoints: true,
        transactions: {
          where: {
            status: 'completed',
            createdAt: {
              gte: startDate,
            },
          },
          select: {
            total: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        totalSpent: 'desc',
      },
      take: limit,
    });

    // Calculate customer stats
    const insights = topCustomers.map(customer => ({
      customer: {
        id: customer.id,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown',
        email: customer.email,
        phone: customer.phone,
      },
      totalSpent: Number(customer.totalSpent),
      loyaltyPoints: customer.loyaltyPoints,
      recentTransactions: customer.transactions.length,
      recentRevenue: customer.transactions.reduce((sum, t) => sum + Number(t.total), 0),
      averageOrderValue: customer.transactions.length > 0
        ? customer.transactions.reduce((sum, t) => sum + Number(t.total), 0) / customer.transactions.length
        : 0,
    }));

    // Overall customer stats
    const totalCustomers = await prisma.customer.count({ where: { tenantId } });
    const activeCustomers = await prisma.customer.count({
      where: {
        tenantId,
        transactions: {
          some: {
            createdAt: {
              gte: startDate,
            },
          },
        },
      },
    });

    const result = {
      topCustomers: insights,
      summary: {
        totalCustomers,
        activeCustomers,
        retentionRate: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0,
      },
    };

    // Cache result
    await this.saveToCache(tenantId, cacheKey, 'customer_insights', result);

    return result;
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(tenantId: string) {
    const cacheKey = 'dashboard_summary';
    
    // Try to get from cache (shorter cache for dashboard - 5 min)
    const cached = await this.getFromCache(tenantId, cacheKey, 5);
    if (cached) {
      return cached;
    }

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayTransactions, todayRevenue, totalProducts, lowStockProducts] = await Promise.all([
      // Today's transactions
      prisma.transaction.count({
        where: {
          tenantId,
          status: 'completed',
          createdAt: { gte: today },
        },
      }),

      // Today's revenue
      prisma.transaction.aggregate({
        where: {
          tenantId,
          status: 'completed',
          createdAt: { gte: today },
        },
        _sum: { total: true },
      }),

      // Total products
      prisma.product.count({
        where: {
          tenantId,
          isActive: true,
        },
      }),

      // Low stock products
      prisma.stock.count({
        where: {
          tenantId,
          quantity: {
            lt: prisma.stock.fields.lowStockThreshold,
          },
        },
      }),
    ]);

    const result = {
      today: {
        transactions: todayTransactions,
        revenue: Number(todayRevenue._sum.total || 0),
      },
      inventory: {
        totalProducts,
        lowStockProducts,
      },
    };

    // Cache result
    await this.saveToCache(tenantId, cacheKey, 'dashboard_summary', result, 5);

    return result;
  }

  /**
   * Helper: Group transactions by period
   */
  private groupTransactionsByPeriod(transactions: any[], period: 'daily' | 'weekly' | 'monthly') {
    const groups = new Map<string, { date: string; revenue: number; count: number }>();

    for (const transaction of transactions) {
      let key: string;
      const date = new Date(transaction.createdAt);

      if (period === 'daily') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      const existing = groups.get(key) || { date: key, revenue: 0, count: 0 };
      existing.revenue += Number(transaction.total);
      existing.count += 1;

      groups.set(key, existing);
    }

    return Array.from(groups.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Helper: Get from cache
   */
  private async getFromCache(tenantId: string, cacheKey: string, validityMinutes?: number) {
    const validity = validityMinutes || this.cacheValidityMinutes;
    
    const cached = await prisma.analyticsCache.findUnique({
      where: {
        tenantId_cacheKey: {
          tenantId,
          cacheKey,
        },
      },
    });

    if (cached && cached.validUntil > new Date()) {
      return cached.data;
    }

    return null;
  }

  /**
   * Helper: Save to cache
   */
  private async saveToCache(
    tenantId: string,
    cacheKey: string,
    cacheType: string,
    data: any,
    validityMinutes?: number
  ) {
    const validity = validityMinutes || this.cacheValidityMinutes;
    const validUntil = new Date();
    validUntil.setMinutes(validUntil.getMinutes() + validity);

    await prisma.analyticsCache.upsert({
      where: {
        tenantId_cacheKey: {
          tenantId,
          cacheKey,
        },
      },
      create: {
        tenantId,
        cacheKey,
        cacheType,
        data: data as Prisma.InputJsonValue,
        validUntil,
      },
      update: {
        data: data as Prisma.InputJsonValue,
        validUntil,
      },
    });
  }
}

export const analyticsService = new AnalyticsService();
