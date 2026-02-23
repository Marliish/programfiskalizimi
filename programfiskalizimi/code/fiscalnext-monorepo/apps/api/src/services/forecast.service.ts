import { PrismaClient } from '@fiscalnext/database';
import type { 
  CreateForecastInput, 
  CustomerSegmentationInput, 
  AbcAnalysisInput,
  TrendAnalysisInput,
  InventoryOptimizationInput 
} from '../schemas/forecast.schema.js';

const prisma = new PrismaClient();

export class ForecastService {
  // Create/generate forecast
  async createForecast(tenantId: string, input: CreateForecastInput): Promise<any> {
    const { forecastType, period, daysAhead, algorithm = 'linear_regression', includeConfidenceInterval = true } = input;
    
    // Get historical data
    const historicalData = await this.getHistoricalData(tenantId, forecastType, period);
    
    // Generate forecast using specified algorithm
    let forecastData: any;
    
    switch (algorithm) {
      case 'linear_regression':
        forecastData = this.linearRegressionForecast(historicalData, daysAhead, includeConfidenceInterval);
        break;
      case 'moving_average':
        forecastData = this.movingAverageForecast(historicalData, daysAhead);
        break;
      case 'exponential_smoothing':
        forecastData = this.exponentialSmoothingForecast(historicalData, daysAhead);
        break;
      default:
        forecastData = this.linearRegressionForecast(historicalData, daysAhead, includeConfidenceInterval);
    }
    
    // Calculate accuracy based on recent predictions vs actual
    const accuracy = this.calculateAccuracy(historicalData);
    
    // Cache the forecast
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 24); // Valid for 24 hours
    
    const forecast = await prisma.forecast.create({
      data: {
        tenantId,
        forecastType,
        period,
        data: forecastData as any,
        algorithm,
        accuracy,
        validUntil,
      },
    });
    
    return forecast;
  }
  
  // Get forecasts
  async getForecasts(tenantId: string, forecastType?: string): Promise<any> {
    const where: any = {
      tenantId,
      validUntil: {
        gte: new Date(),
      },
    };
    
    if (forecastType) {
      where.forecastType = forecastType;
    }
    
    const forecasts = await prisma.forecast.findMany({
      where,
      orderBy: {
        generatedAt: 'desc',
      },
    });
    
    return forecasts;
  }
  
  // Customer segmentation (RFM Analysis)
  async customerSegmentation(tenantId: string, input: CustomerSegmentationInput): Promise<any> {
    const { method = 'rfm', segmentCount = 4 } = input;
    
    if (method === 'rfm') {
      return this.rfmSegmentation(tenantId, segmentCount);
    }
    
    // Other segmentation methods can be added here
    throw new Error(`Segmentation method ${method} not implemented`);
  }
  
  // ABC Analysis
  async abcAnalysis(tenantId: string, input: AbcAnalysisInput): Promise<any> {
    const { analysisType, locationId, categoryId, dateRange } = input;
    
    const start = dateRange?.start ? new Date(dateRange.start) : this.getDefaultStartDate();
    const end = dateRange?.end ? new Date(dateRange.end) : new Date();
    
    // Get transaction items
    const items = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          tenantId,
          status: 'completed',
          createdAt: {
            gte: start,
            lte: end,
          },
          ...(locationId && { locationId }),
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });
    
    // Calculate metric value for each product
    const productMetrics: Record<string, any> = {};
    
    items.forEach(item => {
      const productId = item.productId;
      if (!productMetrics[productId]) {
        productMetrics[productId] = {
          productId,
          productName: item.productName,
          category: item.product.category?.name,
          revenue: 0,
          profit: 0,
          quantity: 0,
        };
      }
      
      const cost = Number(item.product.costPrice || 0) * Number(item.quantity);
      const revenue = Number(item.total);
      
      productMetrics[productId].revenue += revenue;
      productMetrics[productId].profit += (revenue - cost);
      productMetrics[productId].quantity += Number(item.quantity);
    });
    
    // Sort by analysis type
    let sortKey: string;
    switch (analysisType) {
      case 'revenue':
        sortKey = 'revenue';
        break;
      case 'profit':
        sortKey = 'profit';
        break;
      case 'quantity':
        sortKey = 'quantity';
        break;
      default:
        sortKey = 'revenue';
    }
    
    const products = Object.values(productMetrics)
      .sort((a: any, b: any) => b[sortKey] - a[sortKey]);
    
    // Calculate cumulative percentage
    const totalValue = products.reduce((sum: number, p: any) => sum + p[sortKey], 0);
    let cumulativeValue = 0;
    
    products.forEach((product: any) => {
      cumulativeValue += product[sortKey];
      const cumulativePercentage = (cumulativeValue / totalValue) * 100;
      
      // ABC Classification: A (0-80%), B (80-95%), C (95-100%)
      if (cumulativePercentage <= 80) {
        product.classification = 'A';
      } else if (cumulativePercentage <= 95) {
        product.classification = 'B';
      } else {
        product.classification = 'C';
      }
      
      product.cumulativePercentage = cumulativePercentage.toFixed(2);
      product.percentage = ((product[sortKey] / totalValue) * 100).toFixed(2);
    });
    
    // Summary by classification
    const summary = {
      A: { count: 0, value: 0, percentage: 0 },
      B: { count: 0, value: 0, percentage: 0 },
      C: { count: 0, value: 0, percentage: 0 },
    };
    
    products.forEach((product: any) => {
      const classification = product.classification as 'A' | 'B' | 'C';
      summary[classification].count += 1;
      summary[classification].value += product[sortKey];
    });
    
    Object.keys(summary).forEach(key => {
      const k = key as 'A' | 'B' | 'C';
      summary[k].percentage = (summary[k].value / totalValue) * 100;
    });
    
    return {
      analysisType,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary,
      products,
    };
  }
  
  // Trend analysis
  async trendAnalysis(tenantId: string, input: TrendAnalysisInput): Promise<any> {
    const { metric, period, compareWith = 'previous_period', dateRange } = input;
    
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    
    // Get current period data
    const currentData = await this.getMetricData(tenantId, metric, start, end, period);
    
    // Get comparison period data
    let comparisonData: any[] = [];
    let comparisonLabel = '';
    
    if (compareWith === 'previous_period') {
      const duration = end.getTime() - start.getTime();
      const compStart = new Date(start.getTime() - duration);
      const compEnd = new Date(start.getTime());
      comparisonData = await this.getMetricData(tenantId, metric, compStart, compEnd, period);
      comparisonLabel = 'Previous Period';
    } else if (compareWith === 'same_period_last_year') {
      const compStart = new Date(start);
      compStart.setFullYear(compStart.getFullYear() - 1);
      const compEnd = new Date(end);
      compEnd.setFullYear(compEnd.getFullYear() - 1);
      comparisonData = await this.getMetricData(tenantId, metric, compStart, compEnd, period);
      comparisonLabel = 'Same Period Last Year';
    }
    
    // Calculate trends
    const currentTotal = currentData.reduce((sum: any, item: any) => sum + item.value, 0);
    const comparisonTotal = comparisonData.reduce((sum: any, item: any) => sum + item.value, 0);
    const change = currentTotal - comparisonTotal;
    const changePercentage = comparisonTotal > 0 ? (change / comparisonTotal) * 100 : 0;
    
    return {
      metric,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      current: {
        label: 'Current Period',
        data: currentData,
        total: currentTotal,
      },
      comparison: {
        label: comparisonLabel,
        data: comparisonData,
        total: comparisonTotal,
      },
      trend: {
        change,
        changePercentage: changePercentage.toFixed(2),
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      },
    };
  }
  
  // Inventory optimization
  async inventoryOptimization(tenantId: string, input: InventoryOptimizationInput): Promise<any> {
    const { locationId, categoryId, includeSuggestions = true } = input;
    
    // Get stock data
    const stocks = await prisma.stock.findMany({
      where: {
        tenantId,
        ...(locationId && { locationId }),
        ...(categoryId && { 
          product: { categoryId }
        }),
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        location: true,
      },
    });
    
    // Get sales velocity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const salesData = await prisma.transactionItem.groupBy({
      by: ['productId'],
      where: {
        transaction: {
          tenantId,
          status: 'completed',
          createdAt: {
            gte: thirtyDaysAgo,
          },
          ...(locationId && { locationId }),
        },
      },
      _sum: {
        quantity: true,
      },
    });
    
    const salesVelocity: Record<string, number> = {};
    salesData.forEach(item => {
      salesVelocity[item.productId] = Number(item._sum.quantity || 0) / 30; // per day
    });
    
    // Analyze each product
    const analysis = stocks.map(stock => {
      const velocity = salesVelocity[stock.productId] || 0;
      const daysOfStock = velocity > 0 ? Number(stock.quantity) / velocity : 999;
      const turnoverRate = velocity > 0 ? 30 / daysOfStock : 0;
      
      let status = 'OK';
      let suggestion = '';
      
      if (stock.quantity <= stock.lowStockThreshold) {
        status = 'Low Stock';
        suggestion = `Order immediately. Recommended: ${Math.ceil(velocity * 14)} units (2 weeks supply)`;
      } else if (daysOfStock < 7) {
        status = 'Running Low';
        suggestion = `Order soon. Current stock covers ${Math.ceil(daysOfStock)} days`;
      } else if (daysOfStock > 60 && velocity > 0) {
        status = 'Overstocked';
        suggestion = `Consider promotion. Stock covers ${Math.ceil(daysOfStock)} days`;
      }
      
      return {
        productId: stock.productId,
        productName: stock.product.name,
        sku: stock.product.sku,
        category: stock.product.category?.name,
        location: stock.location?.name,
        currentStock: Number(stock.quantity),
        lowStockThreshold: Number(stock.lowStockThreshold),
        salesVelocity: velocity.toFixed(2),
        daysOfStock: daysOfStock.toFixed(1),
        turnoverRate: turnoverRate.toFixed(2),
        status,
        ...(includeSuggestions && { suggestion }),
      };
    });
    
    // Summary
    const summary = {
      totalProducts: analysis.length,
      lowStock: analysis.filter(a => a.status === 'Low Stock').length,
      runningLow: analysis.filter(a => a.status === 'Running Low').length,
      overstocked: analysis.filter(a => a.status === 'Overstocked').length,
      ok: analysis.filter(a => a.status === 'OK').length,
    };
    
    return {
      summary,
      products: analysis,
    };
  }
  
  // Private: Get historical data for forecasting
  private async getHistoricalData(tenantId: string, forecastType: string, period: string): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (period === 'daily' ? 90 : period === 'weekly' ? 365 : 730));
    
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        status: 'completed',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    // Group by period
    const grouped: Record<string, number> = {};
    
    transactions.forEach(tx => {
      let key: string;
      if (period === 'daily') {
        key = tx.createdAt.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = this.getWeekStart(tx.createdAt);
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, '0')}`;
      }
      
      grouped[key] = (grouped[key] || 0) + Number(tx.total);
    });
    
    return Object.entries(grouped).map(([date, value]) => ({ date, value }));
  }
  
  // Private: Linear regression forecast
  private linearRegressionForecast(data: any[], daysAhead: number, includeConfidence: boolean) {
    if (data.length < 2) {
      return { labels: [], values: [], confidence: [] };
    }
    
    // Calculate regression line: y = mx + b
    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum: any, item: any) => sum + item.value, 0);
    const sumXY = data.reduce((sum, item, i) => sum + i * item.value, 0);
    const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate forecast
    const labels = [];
    const values = [];
    const confidence = [];
    
    const lastDate = new Date(data[data.length - 1].date);
    
    for (let i = 1; i <= daysAhead; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      
      const x = data.length + i - 1;
      const y = slope * x + intercept;
      
      labels.push(nextDate.toISOString().split('T')[0]);
      values.push(Math.max(0, y));
      
      if (includeConfidence) {
        // Simple confidence interval (±20%)
        confidence.push({
          lower: Math.max(0, y * 0.8),
          upper: y * 1.2,
        });
      }
    }
    
    return { labels, values, confidence };
  }
  
  // Private: Moving average forecast
  private movingAverageForecast(data: any[], daysAhead: number) {
    if (data.length < 3) {
      return { labels: [], values: [] };
    }
    
    const windowSize = Math.min(7, data.length);
    const recentData = data.slice(-windowSize);
    const average = recentData.reduce((sum: any, item: any) => sum + item.value, 0) / windowSize;
    
    const labels = [];
    const values = [];
    const lastDate = new Date(data[data.length - 1].date);
    
    for (let i = 1; i <= daysAhead; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      
      labels.push(nextDate.toISOString().split('T')[0]);
      values.push(average);
    }
    
    return { labels, values };
  }
  
  // Private: Exponential smoothing forecast
  private exponentialSmoothingForecast(data: any[], daysAhead: number) {
    if (data.length < 2) {
      return { labels: [], values: [] };
    }
    
    const alpha = 0.3; // Smoothing factor
    let forecast = data[0].value;
    
    // Calculate smoothed values
    for (let i = 1; i < data.length; i++) {
      forecast = alpha * data[i].value + (1 - alpha) * forecast;
    }
    
    const labels = [];
    const values = [];
    const lastDate = new Date(data[data.length - 1].date);
    
    for (let i = 1; i <= daysAhead; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      
      labels.push(nextDate.toISOString().split('T')[0]);
      values.push(forecast);
    }
    
    return { labels, values };
  }
  
  // Private: Calculate forecast accuracy
  private calculateAccuracy(data: any[]): number {
    // For now, return a placeholder accuracy
    // In production, this should compare recent forecasts to actual values
    return 85.0;
  }
  
  // Private: RFM Segmentation
  private async rfmSegmentation(tenantId: string, segmentCount: number): Promise<any> {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: {
        transactions: {
          where: {
            status: 'completed',
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    
    // Calculate RFM scores
    const now = Date.now();
    const customerScores = customers.map(customer => {
      const recency = customer.transactions[0]
        ? Math.floor((now - customer.transactions[0].createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      const frequency = customer.transactions.length;
      
      const monetary = customer.transactions.reduce((sum, tx) => 
        sum + Number(tx.total), 0
      );
      
      return {
        customerId: customer.id,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        email: customer.email,
        phone: customer.phone,
        recency,
        frequency,
        monetary,
      };
    });
    
    // Score each dimension (1-5)
    const scoreRFM = (values: number[], value: number, reverse = false) => {
      const sorted = [...values].sort((a, b) => reverse ? b - a : a - b);
      const quintileSize = Math.ceil(sorted.length / 5);
      const index = sorted.indexOf(value);
      return Math.min(5, Math.floor(index / quintileSize) + 1);
    };
    
    const recencies = customerScores.map(c => c.recency);
    const frequencies = customerScores.map(c => c.frequency);
    const monetaries = customerScores.map(c => c.monetary);
    
    customerScores.forEach(customer => {
      const r = scoreRFM(recencies, customer.recency, true);
      const f = scoreRFM(frequencies, customer.frequency);
      const m = scoreRFM(monetaries, customer.monetary);
      
      (customer as any).recencyScore = r;
      (customer as any).frequencyScore = f;
      (customer as any).monetaryScore = m;
      (customer as any).rfmScore = r + f + m;
      
      // Segment classification
      if (r >= 4 && f >= 4 && m >= 4) {
        (customer as any).segment = 'Champions';
      } else if (r >= 3 && f >= 3 && m >= 3) {
        (customer as any).segment = 'Loyal';
      } else if (r >= 4 && f <= 2) {
        (customer as any).segment = 'New';
      } else if (r <= 2 && f >= 4 && m >= 4) {
        (customer as any).segment = 'At Risk';
      } else if (r <= 2 && f <= 2) {
        (customer as any).segment = 'Lost';
      } else {
        (customer as any).segment = 'Potential';
      }
    });
    
    // Segment summary
    const segments = customerScores.reduce((acc: any, customer: any) => {
      if (!acc[customer.segment]) {
        acc[customer.segment] = { count: 0, revenue: 0 };
      }
      acc[customer.segment].count += 1;
      acc[customer.segment].revenue += customer.monetary;
      return acc;
    }, {});
    
    return {
      summary: {
        totalCustomers: customers.length,
        segments,
      },
      customers: customerScores,
    };
  }
  
  // Private: Get metric data
  private async getMetricData(tenantId: string, metric: string, start: Date, end: Date, period: string): Promise<any> {
    if (metric === 'sales' || metric === 'revenue') {
      const transactions = await prisma.transaction.findMany({
        where: {
          tenantId,
          status: 'completed',
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        select: {
          createdAt: true,
          total: true,
        },
      });
      
      return this.groupByPeriod(transactions, period, 'total');
    }
    
    // Add more metrics as needed
    return [];
  }
  
  // Private: Group data by period
  private groupByPeriod(data: any[], period: string, valueField: string) {
    const grouped: Record<string, number> = {};
    
    data.forEach(item => {
      let key: string;
      if (period === 'daily') {
        key = item.createdAt.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = this.getWeekStart(item.createdAt);
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, '0')}`;
      }
      
      grouped[key] = (grouped[key] || 0) + Number(item[valueField]);
    });
    
    return Object.entries(grouped)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  
  // Private: Get week start date
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }
  
  // Private: Get default start date (90 days ago)
  private getDefaultStartDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date;
  }
}

export const forecastService = new ForecastService();
