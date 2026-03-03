// Report Service - Handle reporting operations
import { prisma, Prisma } from '@fiscalnext/database';

export class ReportService {
  /**
   * Generate sales report
   */
  async getSalesReport(params: {
    tenantId: string;
    startDate?: string;
    endDate?: string;
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    locationId?: string;
  }) {
    const start = params.startDate ? new Date(params.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = params.endDate ? new Date(params.endDate) : new Date();

    const where: Prisma.TransactionWhereInput = {
      tenantId: params.tenantId,
      status: 'completed',
      createdAt: {
        gte: start,
        lte: end,
      },
      ...(params.locationId && { locationId: params.locationId }),
    };

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate summary
    const summary = {
      totalSales: transactions.reduce((sum, t) => sum + Number(t.total), 0),
      totalTransactions: transactions.length,
      totalItems: transactions.reduce((sum, t) => sum + t.items.length, 0),
      averageOrderValue: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + Number(t.total), 0) / transactions.length 
        : 0,
      totalTax: transactions.reduce((sum, t) => sum + Number(t.taxAmount), 0),
      totalDiscount: transactions.reduce((sum, t) => sum + Number(t.discountAmount), 0),
    };

    // Get currency breakdown using raw SQL (most reliable)
    const byCurrency = await this.getCurrencyBreakdown(params.tenantId, start, end);

    // Group by period
    const groupedData = this.groupTransactionsByPeriod(transactions, params.period || 'daily');

    // Payment method breakdown
    const paymentBreakdown = await this.getPaymentBreakdown(params.tenantId, start, end);

    return {
      period: params.period || 'daily',
      startDate: start,
      endDate: end,
      summary,
      byCurrency,
      data: groupedData,
      paymentBreakdown,
    };
  }

  /**
   * Helper: Get currency breakdown using raw SQL
   */
  private async getCurrencyBreakdown(tenantId: string, startDate: Date, endDate: Date) {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(p.currency, 'EUR') as currency,
        COALESCE(SUM(ti.unit_price * ti.quantity), 0)::float as "totalSales",
        COUNT(DISTINCT t.id)::int as "totalTransactions",
        COALESCE(SUM(ti.quantity), 0)::int as "totalItems"
      FROM transactions t
      JOIN transaction_items ti ON ti.transaction_id = t.id
      JOIN products p ON p.id = ti.product_id
      WHERE t.status = 'completed'
        AND t.tenant_id = ${tenantId}
        AND t.created_at >= ${startDate}
        AND t.created_at <= ${endDate}
      GROUP BY p.currency
    `;

    // Ensure all currencies are represented
    const currencies = ['ALL', 'EUR', 'USD'];
    const currencyMap = new Map(result.map(r => [r.currency, r]));
    
    return currencies.map(currency => {
      const data = currencyMap.get(currency);
      return {
        currency,
        totalSales: data?.totalSales || 0,
        totalTransactions: data?.totalTransactions || 0,
        totalItems: data?.totalItems || 0,
        averageOrderValue: data?.totalTransactions > 0 
          ? (data?.totalSales || 0) / data.totalTransactions 
          : 0,
        totalTax: 0,
        totalDiscount: 0,
      };
    });
  }

  /**
   * Generate products report (best sellers, low stock)
   */
  async getProductsReport(params: {
    tenantId: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    type?: 'best-sellers' | 'low-stock' | 'all';
  }) {
    const start = params.startDate ? new Date(params.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = params.endDate ? new Date(params.endDate) : new Date();
    const limit = params.limit || 10;

    const result: any = {};

    // Best sellers
    if (params.type === 'best-sellers' || params.type === 'all') {
      const bestSellers = await prisma.transactionItem.groupBy({
        by: ['productId', 'productName'],
        where: {
          transaction: {
            tenantId: params.tenantId,
            status: 'completed',
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        },
        _sum: {
          quantity: true,
          total: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: limit,
      });

      result.bestSellers = bestSellers.map(item => ({
        productId: item.productId,
        productName: item.productName,
        totalQuantitySold: Number(item._sum.quantity || 0),
        totalRevenue: Number(item._sum.total || 0),
        transactionCount: item._count.id,
      }));
    }

    // Low stock products
    if (params.type === 'low-stock' || params.type === 'all') {
      const lowStockProducts = await prisma.stock.findMany({
        where: {
          tenantId: params.tenantId,
          quantity: {
            lte: prisma.stock.fields.lowStockThreshold,
          },
          product: {
            isActive: true,
            trackInventory: true,
          },
        },
        include: {
          product: true,
          location: true,
        },
        orderBy: {
          quantity: 'asc',
        },
        take: limit,
      });

      result.lowStock = lowStockProducts.map(stock => ({
        productId: stock.productId,
        productName: stock.product.name,
        currentStock: Number(stock.quantity),
        lowStockThreshold: Number(stock.lowStockThreshold),
        locationName: stock.location?.name || 'Default',
        needsRestock: true,
      }));
    }

    return result;
  }

  /**
   * Generate revenue report (time series data)
   */
  async getRevenueReport(params: {
    tenantId: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const start = params.startDate ? new Date(params.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = params.endDate ? new Date(params.endDate) : new Date();

    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId: params.tenantId,
        status: 'completed',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by period
    const groupedData = this.groupTransactionsByPeriod(transactions, params.groupBy || 'day');

    // Calculate cumulative revenue
    let cumulative = 0;
    const timeSeriesData = groupedData.map(item => {
      cumulative += item.revenue;
      return {
        ...item,
        cumulativeRevenue: cumulative,
      };
    });

    // Overall summary
    const summary = {
      totalRevenue: transactions.reduce((sum, t) => sum + Number(t.total), 0),
      totalTransactions: transactions.length,
      averageRevenuePerDay: timeSeriesData.length > 0 
        ? transactions.reduce((sum, t) => sum + Number(t.total), 0) / timeSeriesData.length 
        : 0,
    };

    return {
      startDate: start,
      endDate: end,
      groupBy: params.groupBy || 'day',
      summary,
      timeSeries: timeSeriesData,
    };
  }

  /**
   * Helper: Group transactions by period
   */
  private groupTransactionsByPeriod(transactions: any[], period: string) {
    const grouped = new Map<string, any>();

    transactions.forEach(transaction => {
      let key: string;
      const date = new Date(transaction.createdAt);

      if (period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = String(date.getFullYear());
      }

      if (!grouped.has(key)) {
        grouped.set(key, {
          period: key,
          revenue: 0,
          transactions: 0,
          items: 0,
          tax: 0,
        });
      }

      const group = grouped.get(key)!;
      group.revenue += Number(transaction.total);
      group.transactions += 1;
      group.items += transaction.items?.length || 0;
      group.tax += Number(transaction.taxAmount);
    });

    return Array.from(grouped.values()).sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Helper: Get payment method breakdown
   */
  private async getPaymentBreakdown(tenantId: string, startDate: Date, endDate: Date) {
    const payments = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: {
        transaction: {
          tenantId,
          status: 'completed',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    return payments.map(p => ({
      method: p.paymentMethod,
      totalAmount: Number(p._sum.amount || 0),
      count: p._count.id,
    }));
  }

  /**
   * Export report to CSV format
   */
  exportToCSV(data: any[], headers: string[]): string {
    const rows = [headers.join(',')];
    data.forEach(item => {
      const values = headers.map(h => {
        const value = item[h] || '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      rows.push(values.join(','));
    });
    return rows.join('\n');
  }
}

export const reportService = new ReportService();
