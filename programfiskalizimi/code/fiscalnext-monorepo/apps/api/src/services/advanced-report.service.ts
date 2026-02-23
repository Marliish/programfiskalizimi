import { PrismaClient } from '@fiscalnext/database';
import type { CreateReportInput, UpdateReportInput, ScheduleReportInput, ExecuteReportInput } from '../schemas/advanced-report.schema.js';
import ExcelJS from 'exceljs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const prisma = new PrismaClient();

export class AdvancedReportService {
  // Create report
  async createReport(tenantId: string, userId: string, data: CreateReportInput): Promise<any> {
    const report = await prisma.report.create({
      data: {
        tenantId,
        userId,
        ...data,
        config: data.config as any,
      },
    });
    
    return report;
  }
  
  // Get reports
  async getReports(tenantId: string, userId: string, includeTemplates = false): Promise<any> {
    const where: any = {
      tenantId,
      OR: [
        { userId },
        { isPublic: true },
      ],
    };
    
    if (includeTemplates) {
      where.OR.push({ isTemplate: true });
    }
    
    const reports = await prisma.report.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return reports;
  }
  
  // Get report by ID
  async getReport(tenantId: string, reportId: string): Promise<any> {
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        tenantId,
      },
    });
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    return report;
  }
  
  // Update report
  async updateReport(tenantId: string, reportId: string, data: UpdateReportInput): Promise<any> {
    const result = await prisma.report.updateMany({
      where: {
        id: reportId,
        tenantId,
      },
      data: {
        ...data,
        ...(data.config && { config: data.config as any }),
      },
    });
    
    if (result.count === 0) {
      throw new Error('Report not found');
    }
    
    return this.getReport(tenantId, reportId);
  }
  
  // Delete report
  async deleteReport(tenantId: string, reportId: string): Promise<any> {
    const result = await prisma.report.deleteMany({
      where: {
        id: reportId,
        tenantId,
      },
    });
    
    if (result.count === 0) {
      throw new Error('Report not found');
    }
    
    return { success: true };
  }
  
  // Schedule report
  async scheduleReport(tenantId: string, reportId: string, schedule: ScheduleReportInput): Promise<any> {
    const result = await prisma.report.updateMany({
      where: {
        id: reportId,
        tenantId,
      },
      data: {
        ...schedule,
        scheduleEmails: schedule.scheduleEmails as any,
      },
    });
    
    if (result.count === 0) {
      throw new Error('Report not found');
    }
    
    return this.getReport(tenantId, reportId);
  }
  
  // Execute report
  async executeReport(tenantId: string, reportId: string, params: ExecuteReportInput): Promise<any> {
    const report = await this.getReport(tenantId, reportId);
    const config = report.config as any;
    
    // Merge parameters with config
    const executionConfig = {
      ...config,
      filters: {
        ...config.filters,
        ...params,
      },
    };
    
    // Execute based on report type
    let data: any;
    
    switch (report.reportType) {
      case 'sales':
        data = await this.executeSalesReport(tenantId, executionConfig);
        break;
      case 'inventory':
        data = await this.executeInventoryReport(tenantId, executionConfig);
        break;
      case 'profit_loss':
        data = await this.executeProfitLossReport(tenantId, executionConfig);
        break;
      case 'tax_summary':
        data = await this.executeTaxSummaryReport(tenantId, executionConfig);
        break;
      case 'customer_analysis':
        data = await this.executeCustomerAnalysisReport(tenantId, executionConfig);
        break;
      case 'product_performance':
        data = await this.executeProductPerformanceReport(tenantId, executionConfig);
        break;
      default:
        data = await this.executeCustomReport(tenantId, executionConfig);
    }
    
    // Update last run time
    await prisma.report.update({
      where: { id: reportId },
      data: { lastRunAt: new Date() },
    });
    
    return {
      reportId: report.id,
      reportName: report.name,
      reportType: report.reportType,
      executedAt: new Date(),
      data,
    };
  }
  
  // Execute sales report
  private async executeSalesReport(tenantId: string, config: any): Promise<any> {
    const { filters, groupBy, orderBy } = config;
    
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        status: 'completed',
        ...(filters?.dateRange && {
          createdAt: {
            gte: new Date(filters.dateRange.start),
            lte: new Date(filters.dateRange.end),
          },
        }),
        ...(filters?.locationId && { locationId: filters.locationId }),
      },
      include: {
        items: true,
        location: true,
        user: true,
        payments: true,
      },
      orderBy: orderBy || { createdAt: 'desc' },
    });
    
    // Group data if requested
    if (groupBy && groupBy.length > 0) {
      return this.groupTransactionData(transactions, groupBy);
    }
    
    // Calculate totals
    const summary = transactions.reduce((acc, tx) => ({
      totalRevenue: acc.totalRevenue + Number(tx.total),
      totalTax: acc.totalTax + Number(tx.taxAmount),
      totalDiscount: acc.totalDiscount + Number(tx.discountAmount),
      transactionCount: acc.transactionCount + 1,
    }), { totalRevenue: 0, totalTax: 0, totalDiscount: 0, transactionCount: 0 });
    
    return {
      summary,
      transactions: transactions.map(tx => ({
        transactionNumber: tx.transactionNumber,
        date: tx.createdAt,
        total: tx.total,
        tax: tx.taxAmount,
        discount: tx.discountAmount,
        location: tx.location?.name,
        cashier: `${tx.user.firstName} ${tx.user.lastName}`,
        itemCount: tx.items.length,
        paymentMethods: tx.payments.map(p => p.paymentMethod).join(', '),
      })),
    };
  }
  
  // Execute inventory report
  private async executeInventoryReport(tenantId: string, config: any): Promise<any> {
    const { filters } = config;
    
    const stocks = await prisma.stock.findMany({
      where: {
        tenantId,
        ...(filters?.locationId && { locationId: filters.locationId }),
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
    
    const summary = stocks.reduce((acc, stock) => {
      const costValue = Number(stock.quantity) * Number(stock.product.costPrice || 0);
      const sellingValue = Number(stock.quantity) * Number(stock.product.sellingPrice);
      
      return {
        totalItems: acc.totalItems + 1,
        totalQuantity: acc.totalQuantity + Number(stock.quantity),
        totalCostValue: acc.totalCostValue + costValue,
        totalSellingValue: acc.totalSellingValue + sellingValue,
        lowStockCount: acc.lowStockCount + (stock.quantity <= stock.lowStockThreshold ? 1 : 0),
      };
    }, { totalItems: 0, totalQuantity: 0, totalCostValue: 0, totalSellingValue: 0, lowStockCount: 0 });
    
    return {
      summary: {
        ...summary,
        potentialProfit: summary.totalSellingValue - summary.totalCostValue,
      },
      items: stocks.map(stock => ({
        productName: stock.product.name,
        sku: stock.product.sku,
        category: stock.product.category?.name,
        quantity: stock.quantity,
        lowStockThreshold: stock.lowStockThreshold,
        costPrice: stock.product.costPrice,
        sellingPrice: stock.product.sellingPrice,
        value: Number(stock.quantity) * Number(stock.product.sellingPrice),
        location: stock.location?.name,
        status: stock.quantity <= stock.lowStockThreshold ? 'Low Stock' : 'OK',
      })),
    };
  }
  
  // Execute profit & loss report
  private async executeProfitLossReport(tenantId: string, config: any): Promise<any> {
    const { filters } = config;
    const dateRange = filters?.dateRange || this.getDefaultDateRange();
    
    // Revenue from sales
    const salesData = await prisma.transaction.aggregate({
      where: {
        tenantId,
        status: 'completed',
        createdAt: {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end),
        },
      },
      _sum: {
        subtotal: true,
        taxAmount: true,
        discountAmount: true,
        total: true,
      },
      _count: true,
    });
    
    // Cost of goods sold
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        status: 'completed',
        createdAt: {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    
    const cogs = transactions.reduce((total, tx) => {
      const txCogs = tx.items.reduce((sum, item) => {
        const cost = Number(item.product.costPrice || 0) * Number(item.quantity);
        return sum + cost;
      }, 0);
      return total + txCogs;
    }, 0);
    
    const revenue = Number(salesData._sum.subtotal || 0);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - Number(salesData._sum.discountAmount || 0);
    
    return {
      period: {
        start: dateRange.start,
        end: dateRange.end,
      },
      revenue: {
        totalSales: revenue,
        taxCollected: Number(salesData._sum.taxAmount || 0),
        discountsGiven: Number(salesData._sum.discountAmount || 0),
      },
      costs: {
        costOfGoodsSold: cogs,
      },
      profit: {
        grossProfit,
        grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        netProfit,
        netProfitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
      },
      transactionCount: salesData._count,
    };
  }
  
  // Execute tax summary report
  private async executeTaxSummaryReport(tenantId: string, config: any): Promise<any> {
    const { filters } = config;
    const dateRange = filters?.dateRange || this.getDefaultDateRange();
    
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        status: 'completed',
        createdAt: {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end),
        },
      },
      include: {
        items: true,
      },
    });
    
    // Group by tax rate
    const taxBreakdown: Record<string, any> = {};
    
    transactions.forEach(tx => {
      tx.items.forEach(item => {
        const rate = Number(item.taxRate).toFixed(2);
        if (!taxBreakdown[rate]) {
          taxBreakdown[rate] = {
            taxRate: rate,
            subtotal: 0,
            taxAmount: 0,
            transactionCount: 0,
          };
        }
        
        const itemSubtotal = Number(item.subtotal);
        const itemTax = itemSubtotal * (Number(item.taxRate) / 100);
        
        taxBreakdown[rate].subtotal += itemSubtotal;
        taxBreakdown[rate].taxAmount += itemTax;
        taxBreakdown[rate].transactionCount += 1;
      });
    });
    
    const totalTax = Object.values(taxBreakdown).reduce((sum: number, item: any) => 
      sum + item.taxAmount, 0
    );
    
    return {
      period: {
        start: dateRange.start,
        end: dateRange.end,
      },
      summary: {
        totalTaxCollected: totalTax,
        transactionCount: transactions.length,
      },
      breakdown: Object.values(taxBreakdown),
    };
  }
  
  // Execute customer analysis report
  private async executeCustomerAnalysisReport(tenantId: string, config: any): Promise<any> {
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
    
    const analysis = customers.map(customer => {
      const txCount = customer.transactions.length;
      const totalSpent = customer.transactions.reduce((sum, tx) => 
        sum + Number(tx.total), 0
      );
      const avgOrderValue = txCount > 0 ? totalSpent / txCount : 0;
      const lastPurchase = customer.transactions[0]?.createdAt;
      
      // RFM calculation
      const daysSinceLastPurchase = lastPurchase 
        ? Math.floor((Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      let segment = 'Inactive';
      if (daysSinceLastPurchase <= 30 && txCount >= 5) {
        segment = 'VIP';
      } else if (daysSinceLastPurchase <= 60 && txCount >= 3) {
        segment = 'Regular';
      } else if (daysSinceLastPurchase <= 90) {
        segment = 'Occasional';
      }
      
      return {
        customerId: customer.id,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        email: customer.email,
        phone: customer.phone,
        transactionCount: txCount,
        totalSpent,
        avgOrderValue,
        lastPurchaseDate: lastPurchase,
        daysSinceLastPurchase,
        segment,
        loyaltyPoints: customer.loyaltyPoints,
      };
    });
    
    // Segment summary
    const segments = analysis.reduce((acc: any, customer) => {
      if (!acc[customer.segment]) {
        acc[customer.segment] = { count: 0, revenue: 0 };
      }
      acc[customer.segment].count += 1;
      acc[customer.segment].revenue += customer.totalSpent;
      return acc;
    }, {});
    
    return {
      summary: {
        totalCustomers: customers.length,
        segments,
      },
      customers: analysis,
    };
  }
  
  // Execute product performance report
  private async executeProductPerformanceReport(tenantId: string, config: any): Promise<any> {
    const { filters } = config;
    const dateRange = filters?.dateRange || this.getDefaultDateRange();
    
    const items = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          tenantId,
          status: 'completed',
          createdAt: {
            gte: new Date(dateRange.start),
            lte: new Date(dateRange.end),
          },
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
    
    // Group by product
    const productStats: Record<string, any> = {};
    
    items.forEach(item => {
      const productId = item.productId;
      if (!productStats[productId]) {
        productStats[productId] = {
          productId,
          productName: item.productName,
          category: item.product.category?.name,
          quantitySold: 0,
          revenue: 0,
          profit: 0,
          transactionCount: 0,
        };
      }
      
      const cost = Number(item.product.costPrice || 0) * Number(item.quantity);
      const revenue = Number(item.total);
      
      productStats[productId].quantitySold += Number(item.quantity);
      productStats[productId].revenue += revenue;
      productStats[productId].profit += (revenue - cost);
      productStats[productId].transactionCount += 1;
    });
    
    const products = Object.values(productStats)
      .sort((a: any, b: any) => b.revenue - a.revenue);
    
    // ABC Classification
    const totalRevenue = products.reduce((sum: number, p: any) => sum + p.revenue, 0);
    let cumulativeRevenue = 0;
    
    products.forEach((product: any) => {
      cumulativeRevenue += product.revenue;
      const percentage = (cumulativeRevenue / totalRevenue) * 100;
      
      if (percentage <= 80) {
        product.classification = 'A';
      } else if (percentage <= 95) {
        product.classification = 'B';
      } else {
        product.classification = 'C';
      }
      
      product.profitMargin = product.revenue > 0 
        ? ((product.profit / product.revenue) * 100).toFixed(2)
        : 0;
    });
    
    return {
      period: {
        start: dateRange.start,
        end: dateRange.end,
      },
      summary: {
        totalProducts: products.length,
        totalRevenue,
        classA: products.filter((p: any) => p.classification === 'A').length,
        classB: products.filter((p: any) => p.classification === 'B').length,
        classC: products.filter((p: any) => p.classification === 'C').length,
      },
      products,
    };
  }
  
  // Execute custom report
  private async executeCustomReport(tenantId: string, config: any): Promise<any> {
    // TODO: Implement custom SQL query builder
    return {
      message: 'Custom reports not yet implemented',
      config,
    };
  }
  
  // Export report to Excel
  async exportToExcel(tenantId: string, reportId: string, params: ExecuteReportInput): Promise<any> {
    const result = await this.executeReport(tenantId, reportId, params);
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FiscalNext';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet(result.reportName);
    
    // Add title
    worksheet.addRow([result.reportName]);
    worksheet.addRow([`Generated: ${new Date().toISOString()}`]);
    worksheet.addRow([]);
    
    // Add data
    if (result.data.summary) {
      worksheet.addRow(['Summary']);
      Object.entries(result.data.summary).forEach(([key, value]) => {
        worksheet.addRow([key, value]);
      });
      worksheet.addRow([]);
    }
    
    // Add detailed data
    if (result.data.transactions) {
      this.addArrayToWorksheet(worksheet, 'Transactions', result.data.transactions);
    } else if (result.data.items) {
      this.addArrayToWorksheet(worksheet, 'Items', result.data.items);
    } else if (result.data.customers) {
      this.addArrayToWorksheet(worksheet, 'Customers', result.data.customers);
    } else if (result.data.products) {
      this.addArrayToWorksheet(worksheet, 'Products', result.data.products);
    }
    
    return workbook;
  }
  
  // Export report to CSV
  async exportToCSV(tenantId: string, reportId: string, params: ExecuteReportInput): Promise<any> {
    const result = await this.executeReport(tenantId, reportId, params);
    
    let data: any[] = [];
    
    if (result.data.transactions) {
      data = result.data.transactions;
    } else if (result.data.items) {
      data = result.data.items;
    } else if (result.data.customers) {
      data = result.data.customers;
    } else if (result.data.products) {
      data = result.data.products;
    }
    
    if (data.length === 0) {
      return 'No data available';
    }
    
    return stringify(data, {
      header: true,
      columns: Object.keys(data[0]),
    });
  }
  
  // Helper: Add array data to worksheet
  private addArrayToWorksheet(worksheet: ExcelJS.Worksheet, title: string, data: any[]) {
    if (!data || data.length === 0) return;
    
    worksheet.addRow([title]);
    
    // Headers
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);
    
    // Data rows
    data.forEach(item => {
      worksheet.addRow(headers.map(key => item[key]));
    });
  }
  
  // Helper: Group transaction data
  private groupTransactionData(transactions: any[], groupBy: string[]) {
    // TODO: Implement flexible grouping logic
    return {
      message: 'Grouping not yet fully implemented',
      transactionCount: transactions.length,
    };
  }
  
  // Helper: Get default date range (current month)
  private getDefaultDateRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }
  
  // Get report templates
  getTemplates(): any[] {
    return [
      {
        id: 'sales-summary',
        name: 'Sales Summary',
        description: 'Daily, weekly, or monthly sales overview',
        reportType: 'sales',
        config: {
          fields: ['date', 'transactionCount', 'revenue', 'tax'],
          groupBy: ['day'],
          chartType: 'line',
        },
      },
      {
        id: 'profit-loss',
        name: 'Profit & Loss Statement',
        description: 'Financial performance report',
        reportType: 'profit_loss',
        config: {
          fields: ['revenue', 'cogs', 'grossProfit', 'netProfit'],
        },
      },
      {
        id: 'inventory-valuation',
        name: 'Inventory Valuation',
        description: 'Current inventory value by location',
        reportType: 'inventory',
        config: {
          fields: ['productName', 'quantity', 'costValue', 'sellingValue'],
          groupBy: ['location'],
        },
      },
      {
        id: 'tax-summary',
        name: 'Tax Summary',
        description: 'Tax collected by rate',
        reportType: 'tax_summary',
        config: {
          fields: ['taxRate', 'subtotal', 'taxAmount'],
          groupBy: ['taxRate'],
        },
      },
      {
        id: 'customer-analysis',
        name: 'Customer Analysis',
        description: 'Customer segments and behavior',
        reportType: 'customer_analysis',
        config: {
          fields: ['customerName', 'transactionCount', 'totalSpent', 'segment'],
        },
      },
      {
        id: 'product-performance',
        name: 'Product Performance (ABC Analysis)',
        description: 'Top-performing products',
        reportType: 'product_performance',
        config: {
          fields: ['productName', 'revenue', 'profit', 'classification'],
          orderBy: { field: 'revenue', direction: 'desc' },
        },
      },
    ];
  }
}

export const advancedReportService = new AdvancedReportService();
