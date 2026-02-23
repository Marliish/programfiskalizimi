import { PrismaClient } from '@fiscalnext/database';
import type { CreateAutomationInput, UpdateAutomationInput } from '../schemas/automation.schema.js';

const prisma = new PrismaClient();

export class AutomationService {
  // Create automation
  async createAutomation(tenantId: string, data: CreateAutomationInput): Promise<any> {
    const automation = await prisma.automation.create({
      data: {
        tenantId,
        ...data,
        triggerConfig: data.triggerConfig as any,
        conditions: data.conditions as any,
        actions: data.actions as any,
      },
    });
    
    return automation;
  }
  
  // Get automations
  async getAutomations(tenantId: string, filterEnabled?: boolean): Promise<any> {
    const where: any = { tenantId };
    
    if (filterEnabled !== undefined) {
      where.isEnabled = filterEnabled;
    }
    
    const automations = await prisma.automation.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return automations;
  }
  
  // Get automation by ID
  async getAutomation(tenantId: string, automationId: string): Promise<any> {
    const automation = await prisma.automation.findFirst({
      where: {
        id: automationId,
        tenantId,
      },
      include: {
        logs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });
    
    if (!automation) {
      throw new Error('Automation not found');
    }
    
    return automation;
  }
  
  // Update automation
  async updateAutomation(tenantId: string, automationId: string, data: UpdateAutomationInput): Promise<any> {
    const result = await prisma.automation.updateMany({
      where: {
        id: automationId,
        tenantId,
      },
      data: {
        ...data,
        ...(data.triggerConfig && { triggerConfig: data.triggerConfig as any }),
        ...(data.conditions && { conditions: data.conditions as any }),
        ...(data.actions && { actions: data.actions as any }),
      },
    });
    
    if (result.count === 0) {
      throw new Error('Automation not found');
    }
    
    return this.getAutomation(tenantId, automationId);
  }
  
  // Delete automation
  async deleteAutomation(tenantId: string, automationId: string): Promise<any> {
    const result = await prisma.automation.deleteMany({
      where: {
        id: automationId,
        tenantId,
      },
    });
    
    if (result.count === 0) {
      throw new Error('Automation not found');
    }
    
    return { success: true };
  }
  
  // Toggle automation
  async toggleAutomation(tenantId: string, automationId: string, isEnabled: boolean): Promise<any> {
    const result = await prisma.automation.updateMany({
      where: {
        id: automationId,
        tenantId,
      },
      data: { isEnabled },
    });
    
    if (result.count === 0) {
      throw new Error('Automation not found');
    }
    
    return this.getAutomation(tenantId, automationId);
  }
  
  // Test automation
  async testAutomation(tenantId: string, automationId: string, testData?: any): Promise<any> {
    const automation = await this.getAutomation(tenantId, automationId);
    
    const startTime = Date.now();
    
    try {
      // Execute actions with test data
      const results = await this.executeActions(
        automation.actions as any,
        testData || {},
        true // test mode
      );
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        executionTime,
        results,
      };
    } catch (error: any) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
  
  // Get automation logs
  async getAutomationLogs(tenantId: string, automationId: string, limit = 50): Promise<any> {
    // Verify automation belongs to tenant
    const automation = await prisma.automation.findFirst({
      where: {
        id: automationId,
        tenantId,
      },
    });
    
    if (!automation) {
      throw new Error('Automation not found');
    }
    
    const logs = await prisma.automationLog.findMany({
      where: {
        automationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
    
    return logs;
  }
  
  // Execute automation (called by triggers)
  async executeAutomation(automationId: string, triggerData: any): Promise<any> {
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
    });
    
    if (!automation || !automation.isEnabled) {
      return;
    }
    
    const startTime = Date.now();
    
    // Create log entry
    const log = await prisma.automationLog.create({
      data: {
        automationId,
        status: 'pending',
        triggerData: triggerData as any,
      },
    });
    
    try {
      // Check conditions
      if (automation.conditions) {
        const conditionsMet = await this.evaluateConditions(
          automation.conditions as any,
          triggerData
        );
        
        if (!conditionsMet) {
          await prisma.automationLog.update({
            where: { id: log.id },
            data: {
              status: 'success',
              actionResult: { message: 'Conditions not met, skipped' } as any,
              executionTime: Date.now() - startTime,
            },
          });
          return;
        }
      }
      
      // Execute actions
      const results = await this.executeActions(
        automation.actions as any,
        triggerData,
        false
      );
      
      // Update log
      await prisma.automationLog.update({
        where: { id: log.id },
        data: {
          status: 'success',
          actionResult: results as any,
          executionTime: Date.now() - startTime,
        },
      });
      
      // Update automation stats
      await prisma.automation.update({
        where: { id: automationId },
        data: {
          executionCount: { increment: 1 },
          lastExecutedAt: new Date(),
          lastStatus: 'success',
        },
      });
      
    } catch (error: any) {
      // Log error
      await prisma.automationLog.update({
        where: { id: log.id },
        data: {
          status: 'error',
          error: error.message,
          executionTime: Date.now() - startTime,
        },
      });
      
      // Update automation status
      await prisma.automation.update({
        where: { id: automationId },
        data: {
          lastStatus: 'error',
        },
      });
      
      throw error;
    }
  }
  
  // Evaluate conditions
  private async evaluateConditions(conditions: any[], data: any): Promise<boolean> {
    for (const condition of conditions) {
      const value = this.getNestedValue(data, condition.field);
      
      let result = false;
      
      switch (condition.operator) {
        case 'equals':
          result = value === condition.value;
          break;
        case 'not_equals':
          result = value !== condition.value;
          break;
        case 'greater_than':
          result = Number(value) > Number(condition.value);
          break;
        case 'less_than':
          result = Number(value) < Number(condition.value);
          break;
        case 'contains':
          result = String(value).includes(String(condition.value));
          break;
        case 'in':
          result = Array.isArray(condition.value) && condition.value.includes(value);
          break;
      }
      
      if (!result) {
        return false; // AND logic
      }
    }
    
    return true;
  }
  
  // Execute actions
  private async executeActions(actions: any[], data: any, testMode: boolean): Promise<any> {
    const results = [];
    
    for (const action of actions) {
      let result: any;
      
      switch (action.type) {
        case 'email':
          result = await this.executeEmailAction(action.config, data, testMode);
          break;
        case 'webhook':
          result = await this.executeWebhookAction(action.config, data, testMode);
          break;
        case 'notification':
          result = await this.executeNotificationAction(action.config, data, testMode);
          break;
        case 'price_adjustment':
          result = await this.executePriceAdjustmentAction(action.config, data, testMode);
          break;
        default:
          result = { error: `Unknown action type: ${action.type}` };
      }
      
      results.push({
        actionType: action.type,
        result,
      });
    }
    
    return results;
  }
  
  // Execute email action
  private async executeEmailAction(config: any, data: any, testMode: boolean): Promise<any> {
    if (testMode) {
      return {
        success: true,
        message: `[TEST] Would send email to ${config.to.join(', ')}`,
        subject: config.subject,
        body: this.interpolateString(config.body, data),
      };
    }
    
    // TODO: Integrate with email service
    console.log('Email action:', {
      to: config.to,
      subject: config.subject,
      body: this.interpolateString(config.body, data),
    });
    
    return {
      success: true,
      message: 'Email sent (placeholder)',
    };
  }
  
  // Execute webhook action
  private async executeWebhookAction(config: any, data: any, testMode: boolean): Promise<any> {
    if (testMode) {
      return {
        success: true,
        message: `[TEST] Would call ${config.method} ${config.url}`,
        headers: config.headers,
        body: config.body,
      };
    }
    
    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: config.body ? JSON.stringify(this.interpolateObject(config.body, data)) : undefined,
      });
      
      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: await response.json().catch(() => null),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  // Execute notification action
  private async executeNotificationAction(config: any, data: any, testMode: boolean): Promise<any> {
    if (testMode) {
      return {
        success: true,
        message: `[TEST] Would send notification: ${config.title}`,
        body: this.interpolateString(config.message, data),
      };
    }
    
    // TODO: Integrate with notification service
    console.log('Notification action:', {
      title: config.title,
      message: this.interpolateString(config.message, data),
      userId: config.userId,
      priority: config.priority,
    });
    
    return {
      success: true,
      message: 'Notification sent (placeholder)',
    };
  }
  
  // Execute price adjustment action
  private async executePriceAdjustmentAction(config: any, data: any, testMode: boolean): Promise<any> {
    if (testMode) {
      return {
        success: true,
        message: `[TEST] Would adjust price for product ${config.productId}`,
        adjustmentType: config.adjustmentType,
        adjustmentValue: config.adjustmentValue,
      };
    }
    
    const product = await prisma.product.findUnique({
      where: { id: config.productId },
    });
    
    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      };
    }
    
    let newPrice = Number(product.sellingPrice);
    
    if (config.adjustmentType === 'percentage') {
      newPrice = newPrice * (1 + config.adjustmentValue / 100);
    } else {
      newPrice = newPrice + config.adjustmentValue;
    }
    
    await prisma.product.update({
      where: { id: config.productId },
      data: { sellingPrice: newPrice },
    });
    
    return {
      success: true,
      oldPrice: product.sellingPrice,
      newPrice,
    };
  }
  
  // Helper: Get nested value from object
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  // Helper: Interpolate string with data
  private interpolateString(template: string, data: any): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      return value !== undefined ? String(value) : match;
    });
  }
  
  // Helper: Interpolate object with data
  private interpolateObject(obj: any, data: any): any {
    if (typeof obj === 'string') {
      return this.interpolateString(obj, data);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item, data));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value, data);
      }
      return result;
    }
    
    return obj;
  }
  
  // Check and trigger low stock automations
  async checkLowStockTriggers(tenantId: string): Promise<any> {
    const automations = await prisma.automation.findMany({
      where: {
        tenantId,
        triggerType: 'low_stock',
        isEnabled: true,
      },
    });
    
    for (const automation of automations) {
      const config = automation.triggerConfig as any;
      
      const lowStockItems = await prisma.stock.findMany({
        where: {
          tenantId,
          ...(config.productId && { productId: config.productId }),
          ...(config.categoryId && { 
            product: { categoryId: config.categoryId }
          }),
          quantity: {
            lte: config.threshold || prisma.stock.fields.lowStockThreshold,
          },
        },
        include: {
          product: true,
          location: true,
        },
      });
      
      for (const item of lowStockItems) {
        await this.executeAutomation(automation.id, {
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          threshold: item.lowStockThreshold,
          location: item.location?.name,
        });
      }
    }
  }
  
  // Check and trigger high sales automations
  async checkHighSalesTriggers(tenantId: string): Promise<any> {
    const automations = await prisma.automation.findMany({
      where: {
        tenantId,
        triggerType: 'high_sales',
        isEnabled: true,
      },
    });
    
    for (const automation of automations) {
      const config = automation.triggerConfig as any;
      const periodStart = this.getPeriodStart(config.period);
      
      const salesTotal = await prisma.transaction.aggregate({
        where: {
          tenantId,
          status: 'completed',
          ...(config.locationId && { locationId: config.locationId }),
          createdAt: {
            gte: periodStart,
          },
        },
        _sum: {
          total: true,
        },
      });
      
      const total = Number(salesTotal._sum.total || 0);
      
      if (total >= config.amount) {
        await this.executeAutomation(automation.id, {
          period: config.period,
          salesTotal: total,
          threshold: config.amount,
          location: config.locationId,
        });
      }
    }
  }
  
  // Helper: Get period start date
  private getPeriodStart(period: string): Date {
    const now = new Date();
    
    switch (period) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(now.getFullYear(), now.getMonth(), diff);
      default:
        return now;
    }
  }
}

export const automationService = new AutomationService();
