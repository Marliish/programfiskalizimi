// Stock Forecasting Service
// Team 3: Tafa (Backend Developer)
// Features: All 10 forecasting features

import { PrismaClient } from '@fiscalnext/database';

const prisma = new PrismaClient();

export const stockForecastService = {
  // ===== DEMAND FORECASTING (ML) =====
  async generateDemandForecast(params: {
    tenantId: string;
    productId: string;
    forecastDate: Date;
    periodType?: string;
  }) {
    const { tenantId, productId, forecastDate, periodType = 'daily' } = params;

    // Get historical sales data
    const historicalData = await this.getHistoricalSales(tenantId, productId, 90);

    // Simple moving average algorithm (can be replaced with ML model)
    const predictedDemand = this.calculateMovingAverage(historicalData);
    const stdDev = this.calculateStdDev(historicalData);

    // Calculate confidence bounds
    const lowerBound = Math.max(0, predictedDemand - (1.96 * stdDev));
    const upperBound = predictedDemand + (1.96 * stdDev);
    const confidenceLevel = 95;

    // Check for seasonal patterns
    const seasonalityFactor = await this.getSeasonalityFactor(tenantId, productId, forecastDate);
    const adjustedDemand = predictedDemand * seasonalityFactor;

    return await prisma.demandForecast.create({
      data: {
        tenantId,
        productId,
        forecastDate,
        periodType,
        predictedDemand: adjustedDemand,
        confidenceLevel,
        lowerBound: lowerBound * seasonalityFactor,
        upperBound: upperBound * seasonalityFactor,
        seasonalityFactor,
        trendFactor: 1.0,
        algorithmUsed: 'moving_average',
        modelVersion: '1.0',
      },
    });
  },

  async getHistoricalSales(tenantId: string, productId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await prisma.transactionItem.findMany({
      where: {
        productId,
        transaction: {
          tenantId,
          createdAt: { gte: startDate },
          status: 'completed',
        },
      },
      select: {
        quantity: true,
        transaction: {
          select: { createdAt: true },
        },
      },
    });

    return sales.map(s => Number(s.quantity));
  },

  calculateMovingAverage(data: number[]): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((a, b) => a + b, 0);
    return sum / data.length;
  },

  calculateStdDev(data: number[]): number {
    if (data.length === 0) return 0;
    const avg = this.calculateMovingAverage(data);
    const squareDiffs = data.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.calculateMovingAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  },

  // ===== SEASONAL PATTERNS =====
  async createSeasonalPattern(data: {
    tenantId: string;
    productId?: string;
    categoryId?: string;
    patternName: string;
    patternType: string;
    multipliers: number[];
    startDate?: Date;
    endDate?: Date;
  }) {
    const avgMultiplier = this.calculateMovingAverage(data.multipliers);
    const peakMultiplier = Math.max(...data.multipliers);
    const lowMultiplier = Math.min(...data.multipliers);

    return await prisma.seasonalPattern.create({
      data: {
        ...data,
        averageMultiplier: avgMultiplier,
        peakMultiplier,
        lowMultiplier,
      },
    });
  },

  async getSeasonalityFactor(tenantId: string, productId: string, date: Date): Promise<number> {
    const pattern = await prisma.seasonalPattern.findFirst({
      where: {
        tenantId,
        OR: [
          { productId },
          { productId: null }, // Global patterns
        ],
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    if (!pattern) return 1.0;

    // Extract multiplier based on date and pattern type
    const multipliers = pattern.multipliers as number[];
    const index = this.getSeasonalIndex(date, pattern.patternType);
    
    return multipliers[index % multipliers.length] || 1.0;
  },

  getSeasonalIndex(date: Date, patternType: string): number {
    switch (patternType) {
      case 'daily':
        return date.getDay(); // 0-6
      case 'weekly':
        return Math.floor(date.getDate() / 7); // Week of month
      case 'monthly':
        return date.getMonth(); // 0-11
      case 'yearly':
        return Math.floor((date.getMonth() * 30 + date.getDate()) / 30); // Month of year
      default:
        return 0;
    }
  },

  // ===== TREND ANALYSIS =====
  async analyzeTrend(tenantId: string, productId: string) {
    const historicalData = await this.getHistoricalSales(tenantId, productId, 180);
    
    // Split into two halves and compare
    const mid = Math.floor(historicalData.length / 2);
    const firstHalf = historicalData.slice(0, mid);
    const secondHalf = historicalData.slice(mid);

    const firstAvg = this.calculateMovingAverage(firstHalf);
    const secondAvg = this.calculateMovingAverage(secondHalf);

    const trend = secondAvg - firstAvg;
    const trendPercent = firstAvg > 0 ? (trend / firstAvg) * 100 : 0;

    return {
      trend: trend > 5 ? 'increasing' : trend < -5 ? 'decreasing' : 'stable',
      trendValue: trend,
      trendPercent,
      firstPeriodAvg: firstAvg,
      secondPeriodAvg: secondAvg,
    };
  },

  // ===== LEAD TIME CALCULATIONS =====
  async calculateLeadTime(tenantId: string, productId: string, supplierId?: string) {
    // Get recent purchase orders
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        supplierId,
        status: 'completed',
        items: {
          some: { productId },
        },
      },
      select: {
        orderDate: true,
        actualDelivery: true,
      },
      take: 20,
    });

    const leadTimes = orders
      .filter(o => o.actualDelivery)
      .map(o => {
        const diff = o.actualDelivery!.getTime() - o.orderDate.getTime();
        return diff / (1000 * 60 * 60 * 24); // Convert to days
      });

    const avgLeadTime = this.calculateMovingAverage(leadTimes);
    const leadTimeVariability = this.calculateStdDev(leadTimes);

    return {
      averageLeadTimeDays: Math.round(avgLeadTime),
      leadTimeVariability,
      minLeadTime: Math.min(...leadTimes),
      maxLeadTime: Math.max(...leadTimes),
      sampleSize: leadTimes.length,
    };
  },

  // ===== SAFETY STOCK LEVELS =====
  async calculateSafetyStock(params: {
    tenantId: string;
    productId: string;
    serviceLevel?: number;
  }) {
    const { tenantId, productId, serviceLevel = 95 } = params;

    // Get demand variability
    const historicalData = await this.getHistoricalSales(tenantId, productId, 90);
    const demandStdDev = this.calculateStdDev(historicalData);
    const avgDemand = this.calculateMovingAverage(historicalData);

    // Get lead time
    const leadTimeData = await this.calculateLeadTime(tenantId, productId);
    const avgLeadTime = leadTimeData.averageLeadTimeDays;

    // Z-score for service level (simplified)
    const zScore = serviceLevel >= 99 ? 2.33 : serviceLevel >= 95 ? 1.65 : 1.28;

    // Safety stock = Z * σ * √LT
    const safetyStock = zScore * demandStdDev * Math.sqrt(avgLeadTime);

    return {
      safetyStock: Math.ceil(safetyStock),
      serviceLevel,
      demandStdDev,
      avgDemand,
      avgLeadTime,
    };
  },

  // ===== REORDER POINT OPTIMIZATION =====
  async calculateReorderPoint(params: {
    tenantId: string;
    productId: string;
    serviceLevel?: number;
  }) {
    const { tenantId, productId, serviceLevel = 95 } = params;

    // Get average daily demand
    const historicalData = await this.getHistoricalSales(tenantId, productId, 90);
    const avgDailyDemand = this.calculateMovingAverage(historicalData);

    // Get lead time
    const leadTimeData = await this.calculateLeadTime(tenantId, productId);
    const avgLeadTime = leadTimeData.averageLeadTimeDays;

    // Calculate safety stock
    const safetyStockData = await this.calculateSafetyStock({ tenantId, productId, serviceLevel });

    // Reorder Point = (Average Daily Demand × Lead Time) + Safety Stock
    const reorderPoint = (avgDailyDemand * avgLeadTime) + safetyStockData.safetyStock;

    return {
      reorderPoint: Math.ceil(reorderPoint),
      avgDailyDemand,
      avgLeadTime,
      safetyStock: safetyStockData.safetyStock,
    };
  },

  // ===== ECONOMIC ORDER QUANTITY =====
  async calculateEOQ(params: {
    tenantId: string;
    productId: string;
    annualDemand?: number;
    orderingCost?: number;
    holdingCostPercent?: number;
    unitCost?: number;
  }) {
    const {
      tenantId,
      productId,
      orderingCost = 50,
      holdingCostPercent = 20,
    } = params;

    // Get annual demand
    let annualDemand = params.annualDemand;
    if (!annualDemand) {
      const historicalData = await this.getHistoricalSales(tenantId, productId, 365);
      annualDemand = historicalData.reduce((sum, qty) => sum + qty, 0);
    }

    // Get unit cost
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { costPrice: true },
    });

    const unitCost = params.unitCost || Number(product?.costPrice) || 10;
    const holdingCost = unitCost * (holdingCostPercent / 100);

    // EOQ = √(2 × Annual Demand × Ordering Cost / Holding Cost)
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);

    // Calculate optimal number of orders per year
    const ordersPerYear = annualDemand / eoq;
    const totalAnnualCost = (ordersPerYear * orderingCost) + ((eoq / 2) * holdingCost);

    return {
      economicOrderQuantity: Math.ceil(eoq),
      ordersPerYear: Math.ceil(ordersPerYear),
      daysBetweenOrders: Math.floor(365 / ordersPerYear),
      totalAnnualCost,
      annualDemand,
      orderingCost,
      holdingCost,
    };
  },

  // ===== STOCK AGING ANALYSIS =====
  async analyzeStockAging(tenantId: string, productId?: string) {
    const where: any = { tenantId };
    if (productId) where.productId = productId;

    const lots = await prisma.lotNumber.findMany({
      where: {
        ...where,
        status: 'active',
        currentQuantity: { gt: 0 },
      },
      select: {
        id: true,
        productId: true,
        lotNumber: true,
        receivedDate: true,
        currentQuantity: true,
        unitCost: true,
      },
    });

    const now = new Date();
    const analysis = lots.map(lot => {
      const ageInDays = Math.floor((now.getTime() - lot.receivedDate.getTime()) / (1000 * 60 * 60 * 24));
      const value = Number(lot.currentQuantity) * Number(lot.unitCost || 0);

      return {
        ...lot,
        ageInDays,
        ageCategory: ageInDays < 30 ? 'fresh' : ageInDays < 90 ? 'normal' : ageInDays < 180 ? 'aging' : 'old',
        value,
      };
    });

    return {
      items: analysis,
      summary: {
        totalItems: analysis.length,
        fresh: analysis.filter(a => a.ageCategory === 'fresh').length,
        normal: analysis.filter(a => a.ageCategory === 'normal').length,
        aging: analysis.filter(a => a.ageCategory === 'aging').length,
        old: analysis.filter(a => a.ageCategory === 'old').length,
        totalValue: analysis.reduce((sum, a) => sum + a.value, 0),
      },
    };
  },

  // ===== TURNOVER RATES =====
  async calculateTurnoverRate(params: {
    tenantId: string;
    productId: string;
    periodStart: Date;
    periodEnd: Date;
    periodType?: string;
  }) {
    const { tenantId, productId, periodStart, periodEnd, periodType = 'monthly' } = params;

    // Get stock levels at start and end
    const openingStock = await this.getStockAtDate(tenantId, productId, periodStart);
    const closingStock = await this.getStockAtDate(tenantId, productId, periodEnd);
    const averageStock = (openingStock + closingStock) / 2;

    // Get total sales in period
    const sales = await prisma.transactionItem.findMany({
      where: {
        productId,
        transaction: {
          tenantId,
          createdAt: { gte: periodStart, lte: periodEnd },
          status: 'completed',
        },
      },
      select: { quantity: true },
    });

    const totalSold = sales.reduce((sum, s) => sum + Number(s.quantity), 0);

    // Get COGS
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { costPrice: true },
    });
    const costOfGoodsSold = totalSold * Number(product?.costPrice || 0);

    // Calculate turnover rate
    const turnoverRate = averageStock > 0 ? totalSold / averageStock : 0;
    const daysToSell = turnoverRate > 0 ? 365 / turnoverRate : 999;

    // Determine status
    let status = 'normal';
    if (turnoverRate > 12) status = 'fast_moving';
    else if (turnoverRate < 2) status = 'slow_moving';
    if (turnoverRate === 0) status = 'dead_stock';

    await prisma.stockTurnover.create({
      data: {
        tenantId,
        productId,
        periodStart,
        periodEnd,
        periodType,
        openingStock,
        closingStock,
        averageStock,
        totalSold,
        costOfGoodsSold,
        turnoverRate,
        daysToSell,
        status,
      },
    });

    return {
      turnoverRate,
      daysToSell,
      totalSold,
      averageStock,
      status,
    };
  },

  async getStockAtDate(tenantId: string, productId: string, date: Date): Promise<number> {
    // This is a simplified version - in production, you'd query stock movements
    const stock = await prisma.stock.findFirst({
      where: {
        tenantId,
        productId,
      },
      select: { quantity: true },
    });

    return Number(stock?.quantity || 0);
  },

  // ===== DEAD STOCK IDENTIFICATION =====
  async identifyDeadStock(params: {
    tenantId: string;
    daysThreshold?: number;
  }) {
    const { tenantId, daysThreshold = 90 } = params;

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    // Find products with no sales in threshold period
    const products = await prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        stock: {
          some: {
            quantity: { gt: 0 },
          },
        },
      },
      include: {
        stock: true,
      },
    });

    const deadStock = [];

    for (const product of products) {
      const recentSales = await prisma.transactionItem.count({
        where: {
          productId: product.id,
          transaction: {
            createdAt: { gte: thresholdDate },
            status: 'completed',
          },
        },
      });

      if (recentSales === 0) {
        const totalStock = product.stock.reduce((sum, s) => sum + Number(s.quantity), 0);
        const value = totalStock * Number(product.costPrice || 0);

        deadStock.push({
          productId: product.id,
          productName: product.name,
          quantity: totalStock,
          value,
          daysSinceLastSale: daysThreshold,
        });
      }
    }

    return {
      items: deadStock,
      totalItems: deadStock.length,
      totalValue: deadStock.reduce((sum, item) => sum + item.value, 0),
    };
  },

  // ===== FORECAST SETTINGS =====
  async updateForecastSettings(data: {
    tenantId: string;
    productId?: string;
    leadTimeDays?: number;
    safetyStockDays?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    economicOrderQty?: number;
    serviceLevel?: number;
  }) {
    const existing = await prisma.stockForecastSettings.findUnique({
      where: {
        tenantId_productId: {
          tenantId: data.tenantId,
          productId: data.productId || '',
        },
      },
    });

    if (existing) {
      return await prisma.stockForecastSettings.update({
        where: { id: existing.id },
        data,
      });
    }

    return await prisma.stockForecastSettings.create({
      data: {
        tenantId: data.tenantId,
        productId: data.productId,
        leadTimeDays: data.leadTimeDays || 7,
        safetyStockDays: data.safetyStockDays || 7,
        minSafetyStock: 10,
        reorderPoint: data.reorderPoint || 0,
        reorderQuantity: data.reorderQuantity || 0,
        economicOrderQty: data.economicOrderQty,
        serviceLevel: data.serviceLevel || 95,
      },
    });
  },
};
