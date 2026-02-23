import { PrismaClient } from '@fiscalnext/database';
import type { CreateDashboardInput, CreateWidgetInput, UpdateDashboardInput, UpdateWidgetInput } from '../schemas/dashboard.schema.js';

const prisma = new PrismaClient();

export class DashboardService {
  // Create dashboard
  async createDashboard(tenantId: string, userId: string, data: CreateDashboardInput): Promise<any> {
    const { widgets, ...dashboardData } = data;
    
    const dashboard = await prisma.dashboard.create({
      data: {
        tenantId,
        userId,
        ...dashboardData,
        layout: dashboardData.layout || {},
        widgets: widgets ? {
          create: widgets.map(widget => ({
            ...widget,
            config: widget.config as any || {},
          })),
        } : undefined,
      },
      include: {
        widgets: true,
      },
    });
    
    return dashboard;
  }
  
  // Get dashboards
  async getDashboards(tenantId: string, userId: string, includeTemplates = false): Promise<any> {
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
    
    const dashboards = await prisma.dashboard.findMany({
      where,
      include: {
        widgets: {
          orderBy: [
            { y: 'asc' },
            { x: 'asc' },
          ],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return dashboards;
  }
  
  // Get dashboard by ID
  async getDashboard(tenantId: string, dashboardId: string): Promise<any> {
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        tenantId,
      },
      include: {
        widgets: {
          orderBy: [
            { y: 'asc' },
            { x: 'asc' },
          ],
        },
      },
    });
    
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }
    
    return dashboard;
  }
  
  // Update dashboard
  async updateDashboard(tenantId: string, dashboardId: string, data: UpdateDashboardInput): Promise<any> {
    const dashboard = await prisma.dashboard.updateMany({
      where: {
        id: dashboardId,
        tenantId,
      },
      data,
    });
    
    if (dashboard.count === 0) {
      throw new Error('Dashboard not found');
    }
    
    return this.getDashboard(tenantId, dashboardId);
  }
  
  // Delete dashboard
  async deleteDashboard(tenantId: string, dashboardId: string): Promise<any> {
    const result = await prisma.dashboard.deleteMany({
      where: {
        id: dashboardId,
        tenantId,
      },
    });
    
    if (result.count === 0) {
      throw new Error('Dashboard not found');
    }
    
    return { success: true };
  }
  
  // Add widget to dashboard
  async addWidget(tenantId: string, dashboardId: string, widget: CreateWidgetInput): Promise<any> {
    // Verify dashboard exists and belongs to tenant
    const dashboard = await this.getDashboard(tenantId, dashboardId);
    
    const newWidget = await prisma.dashboardWidget.create({
      data: {
        dashboardId,
        ...widget,
        config: widget.config as any || {},
      },
    });
    
    return newWidget;
  }
  
  // Update widget
  async updateWidget(tenantId: string, widgetId: string, data: UpdateWidgetInput): Promise<any> {
    // First, verify the widget belongs to a dashboard owned by this tenant
    const widget = await prisma.dashboardWidget.findFirst({
      where: {
        id: widgetId,
        dashboard: {
          tenantId,
        },
      },
    });
    
    if (!widget) {
      throw new Error('Widget not found');
    }
    
    const updated = await prisma.dashboardWidget.update({
      where: {
        id: widgetId,
      },
      data,
    });
    
    return updated;
  }
  
  // Delete widget
  async deleteWidget(tenantId: string, widgetId: string): Promise<any> {
    const widget = await prisma.dashboardWidget.findFirst({
      where: {
        id: widgetId,
        dashboard: {
          tenantId,
        },
      },
    });
    
    if (!widget) {
      throw new Error('Widget not found');
    }
    
    await prisma.dashboardWidget.delete({
      where: {
        id: widgetId,
      },
    });
    
    return { success: true };
  }
  
  // Get widget data (real-time)
  async getWidgetData(tenantId: string, widgetId: string): Promise<any> {
    const widget = await prisma.dashboardWidget.findFirst({
      where: {
        id: widgetId,
        dashboard: {
          tenantId,
        },
      },
    });
    
    if (!widget) {
      throw new Error('Widget not found');
    }
    
    // Fetch data based on widget type
    const data = await this.fetchWidgetTypeData(tenantId, widget.widgetType, widget.config);
    
    return {
      widgetId: widget.id,
      widgetType: widget.widgetType,
      title: widget.title,
      data,
      timestamp: new Date(),
    };
  }
  
  // Fetch data for specific widget types
  private async fetchWidgetTypeData(tenantId: string, widgetType: string, config: any): Promise<any> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (widgetType) {
      case 'revenue_today':
        return this.getRevenueTodayData(tenantId, today);
      
      case 'sales_count':
        return this.getSalesCountData(tenantId, config);
      
      case 'top_products':
        return this.getTopProductsData(tenantId, config);
      
      case 'low_stock':
        return this.getLowStockData(tenantId, config);
      
      case 'inventory_value':
        return this.getInventoryValueData(tenantId, config);
      
      case 'customer_count':
        return this.getCustomerCountData(tenantId);
      
      case 'recent_transactions':
        return this.getRecentTransactionsData(tenantId, config);
      
      case 'revenue_chart':
        return this.getRevenueChartData(tenantId, config);
      
      default:
        return { message: 'Widget type not implemented yet' };
    }
  }
  
  private async getRevenueTodayData(tenantId: string, today: Date): Promise<any> {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const result = await prisma.transaction.aggregate({
      where: {
        tenantId,
        status: 'completed',
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        total: true,
      },
      _count: true,
    });
    
    return {
      revenue: result._sum.total || 0,
      transactionCount: result._count,
    };
  }
  
  private async getSalesCountData(tenantId: string, config: any): Promise<any> {
    const dateRange = this.getDateRange(config.dateRange);
    
    const count = await prisma.transaction.count({
      where: {
        tenantId,
        status: 'completed',
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        ...(config.locationId && { locationId: config.locationId }),
      },
    });
    
    return { count };
  }
  
  private async getTopProductsData(tenantId: string, config: any): Promise<any> {
    const dateRange = this.getDateRange(config.dateRange);
    const limit = config.limit || 10;
    
    const topProducts = await prisma.transactionItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        transaction: {
          tenantId,
          status: 'completed',
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: limit,
    });
    
    return topProducts.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantitySold: item._sum.quantity,
      revenue: item._sum.total,
    }));
  }
  
  private async getLowStockData(tenantId: string, config: any): Promise<any> {
    const lowStockItems = await prisma.stock.findMany({
      where: {
        tenantId,
        ...(config.locationId && { locationId: config.locationId }),
        quantity: {
          lte: prisma.stock.fields.lowStockThreshold,
        },
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
      },
      take: config.limit || 20,
    });
    
    return lowStockItems.map(item => ({
      productId: item.productId,
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      threshold: item.lowStockThreshold,
      location: item.location?.name,
    }));
  }
  
  private async getInventoryValueData(tenantId: string, config: any): Promise<any> {
    const stocks = await prisma.stock.findMany({
      where: {
        tenantId,
        ...(config.locationId && { locationId: config.locationId }),
      },
      include: {
        product: {
          select: {
            costPrice: true,
            sellingPrice: true,
          },
        },
      },
    });
    
    const totals = stocks.reduce((acc, stock) => {
      const costValue = Number(stock.quantity) * Number(stock.product.costPrice || 0);
      const sellingValue = Number(stock.quantity) * Number(stock.product.sellingPrice);
      
      return {
        costValue: acc.costValue + costValue,
        sellingValue: acc.sellingValue + sellingValue,
        itemCount: acc.itemCount + 1,
        totalQuantity: acc.totalQuantity + Number(stock.quantity),
      };
    }, { costValue: 0, sellingValue: 0, itemCount: 0, totalQuantity: 0 });
    
    return {
      ...totals,
      potentialProfit: totals.sellingValue - totals.costValue,
    };
  }
  
  private async getCustomerCountData(tenantId: string): Promise<any> {
    const total = await prisma.customer.count({
      where: { tenantId },
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newToday = await prisma.customer.count({
      where: {
        tenantId,
        createdAt: {
          gte: today,
        },
      },
    });
    
    return {
      total,
      newToday,
    };
  }
  
  private async getRecentTransactionsData(tenantId: string, config: any): Promise<any> {
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        status: 'completed',
      },
      include: {
        location: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        items: {
          select: {
            productName: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: config.limit || 10,
    });
    
    return transactions.map(tx => ({
      id: tx.id,
      transactionNumber: tx.transactionNumber,
      total: tx.total,
      itemCount: tx.items.length,
      location: tx.location?.name,
      cashier: `${tx.user.firstName} ${tx.user.lastName}`,
      createdAt: tx.createdAt,
    }));
  }
  
  private async getRevenueChartData(tenantId: string, config: any): Promise<any> {
    const dateRange = this.getDateRange(config.dateRange);
    const chartType = config.chartType || 'line';
    
    // Group by day
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        status: 'completed',
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
    });
    
    // Group by date
    const grouped = transactions.reduce((acc: any, tx) => {
      const date = tx.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, count: 0 };
      }
      acc[date].revenue += Number(tx.total);
      acc[date].count += 1;
      return acc;
    }, {});
    
    const data = Object.values(grouped).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    );
    
    return {
      chartType,
      labels: data.map((d: any) => d.date),
      datasets: [
        {
          label: 'Revenue',
          data: data.map((d: any) => d.revenue),
        },
      ],
    };
  }
  
  private getDateRange(range: string = 'today') {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    
    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }
    
    return { start, end };
  }
  
  // Clone dashboard template
  async cloneTemplate(tenantId: string, userId: string, templateId: string, name: string): Promise<any> {
    const template = await prisma.dashboard.findFirst({
      where: {
        id: templateId,
        isTemplate: true,
      },
      include: {
        widgets: true,
      },
    });
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    const dashboard = await prisma.dashboard.create({
      data: {
        tenantId,
        userId,
        name,
        description: template.description,
        layout: template.layout as any,
        isTemplate: false,
        widgets: {
          create: template.widgets.map(widget => ({
            widgetType: widget.widgetType,
            title: widget.title,
            x: widget.x,
            y: widget.y,
            width: widget.width,
            height: widget.height,
            config: JSON.parse(JSON.stringify(widget.config)),
            refreshInterval: widget.refreshInterval,
          })),
        },
      },
      include: {
        widgets: true,
      },
    });
    
    return dashboard;
  }
  
  // Export dashboard configuration
  async exportDashboard(tenantId: string, dashboardId: string): Promise<any> {
    const dashboard = await this.getDashboard(tenantId, dashboardId);
    
    // Remove IDs and tenant-specific data
    const exportData = {
      name: dashboard.name,
      description: dashboard.description,
      layout: dashboard.layout,
      widgets: dashboard.widgets.map((widget: any) => ({
        widgetType: widget.widgetType,
        title: widget.title,
        x: widget.x,
        y: widget.y,
        width: widget.width,
        height: widget.height,
        config: widget.config as any,
        refreshInterval: widget.refreshInterval,
      })),
    };
    
    return exportData;
  }
  
  // Import dashboard configuration
  async importDashboard(tenantId: string, userId: string, importData: any): Promise<any> {
    return this.createDashboard(tenantId, userId, importData);
  }
}

export const dashboardService = new DashboardService();
