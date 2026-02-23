// Inventory Audit Service
// Team 3: Tafa (Backend Developer)
// Features: All 5 inventory audit features

import { PrismaClient } from '@fiscalnext/database';

const prisma = new PrismaClient();

export const inventoryAuditService = {
  // ===== AUDIT SCHEDULING =====
  async createAuditSchedule(data: {
    tenantId: string;
    warehouseId?: string;
    scheduleName: string;
    auditType: string;
    frequency: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    scope?: any;
    assignedTo?: string;
  }) {
    const nextDate = this.calculateNextScheduledDate(
      data.frequency,
      data.dayOfWeek,
      data.dayOfMonth
    );

    return await prisma.auditSchedule.create({
      data: {
        ...data,
        nextScheduledDate: nextDate,
      },
    });
  },

  calculateNextScheduledDate(frequency: string, dayOfWeek?: number, dayOfMonth?: number): Date {
    const now = new Date();
    const next = new Date();

    switch (frequency) {
      case 'daily':
        next.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        const daysUntilTarget = ((dayOfWeek || 0) - now.getDay() + 7) % 7;
        next.setDate(now.getDate() + (daysUntilTarget || 7));
        break;
      case 'monthly':
        next.setMonth(now.getMonth() + 1);
        next.setDate(dayOfMonth || 1);
        break;
      case 'quarterly':
        next.setMonth(now.getMonth() + 3);
        break;
      case 'yearly':
        next.setFullYear(now.getFullYear() + 1);
        break;
    }

    return next;
  },

  async getAuditSchedules(tenantId: string) {
    return await prisma.auditSchedule.findMany({
      where: { tenantId, isActive: true },
      orderBy: { nextScheduledDate: 'asc' },
    });
  },

  async processScheduledAudits(tenantId: string) {
    const now = new Date();
    
    const dueSchedules = await prisma.auditSchedule.findMany({
      where: {
        tenantId,
        isActive: true,
        nextScheduledDate: { lte: now },
      },
    });

    const createdAudits = [];

    for (const schedule of dueSchedules) {
      const audit = await this.createInventoryAudit({
        tenantId,
        warehouseId: schedule.warehouseId,
        auditType: schedule.auditType,
        scheduledDate: now,
        auditorId: schedule.assignedTo,
        scope: schedule.scope,
        createdBy: 'system',
      });

      createdAudits.push(audit);

      // Update next scheduled date
      const nextDate = this.calculateNextScheduledDate(
        schedule.frequency,
        schedule.dayOfWeek,
        schedule.dayOfMonth
      );

      await prisma.auditSchedule.update({
        where: { id: schedule.id },
        data: { nextScheduledDate: nextDate },
      });
    }

    return createdAudits;
  },

  // ===== INVENTORY AUDITS =====
  async createInventoryAudit(data: {
    tenantId: string;
    warehouseId?: string;
    auditType: string;
    scheduledDate: Date;
    auditorId?: string;
    auditorName?: string;
    scope?: any;
    createdBy: string;
  }) {
    const auditNumber = 'AUD' + Date.now();

    // Get products in scope
    const products = await this.getProductsInScope(data.tenantId, data.scope);

    const audit = await prisma.inventoryAudit.create({
      data: {
        ...data,
        auditNumber,
        totalItemsToAudit: products.length,
      },
    });

    // Create audit items
    for (const product of products) {
      const stock = await prisma.stock.findFirst({
        where: {
          tenantId: data.tenantId,
          productId: product.id,
          locationId: data.warehouseId,
        },
      });

      await prisma.inventoryAuditItem.create({
        data: {
          inventoryAuditId: audit.id,
          productId: product.id,
          expectedQuantity: Number(stock?.quantity || 0),
          unitCost: Number(product.costPrice || 0),
        },
      });
    }

    return audit;
  },

  async getProductsInScope(tenantId: string, scope: any) {
    const where: any = { tenantId, isActive: true };

    if (scope?.categoryId) {
      where.categoryId = scope.categoryId;
    }

    if (scope?.productIds) {
      where.id = { in: scope.productIds };
    }

    return await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        costPrice: true,
      },
    });
  },

  async getInventoryAudits(params: {
    tenantId: string;
    warehouseId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, warehouseId, status, page = 1, limit = 20 } = params;

    const where: any = { tenantId };
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.inventoryAudit.findMany({
        where,
        include: {
          _count: { select: { items: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduledDate: 'desc' },
      }),
      prisma.inventoryAudit.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  },

  async getAuditDetails(auditId: string) {
    return await prisma.inventoryAudit.findUnique({
      where: { id: auditId },
      include: {
        items: {
          orderBy: { expectedQuantity: 'desc' },
        },
      },
    });
  },

  async startAudit(auditId: string, auditorId: string) {
    return await prisma.inventoryAudit.update({
      where: { id: auditId },
      data: {
        status: 'in_progress',
        startDate: new Date(),
        auditorId,
      },
    });
  },

  // ===== CYCLE COUNT PLANS =====
  async createCycleCountPlan(data: {
    tenantId: string;
    warehouseId: string;
    planType: string; // ABC_based, random, location_based
    itemsPerCycle: number;
    frequency: string;
  }) {
    // Generate cycle count items based on plan type
    const items = await this.selectItemsForCycle(data);

    return {
      plan: data,
      items,
      message: `Cycle count plan created with ${items.length} items`,
    };
  },

  async selectItemsForCycle(plan: any) {
    // ABC Analysis based selection (simplified)
    const products = await prisma.product.findMany({
      where: {
        tenantId: plan.tenantId,
        isActive: true,
      },
      include: {
        stock: true,
      },
      take: plan.itemsPerCycle,
    });

    return products.map(p => ({
      productId: p.id,
      productName: p.name,
      expectedQuantity: p.stock.reduce((sum, s) => sum + Number(s.quantity), 0),
    }));
  },

  // ===== VARIANCE REPORTING =====
  async auditItem(params: {
    itemId: string;
    auditedQuantity: number;
    auditedBy: string;
    notes?: string;
    photoUrls?: string[];
  }) {
    const { itemId, auditedQuantity, auditedBy, notes, photoUrls = [] } = params;

    const item = await prisma.inventoryAuditItem.findUnique({
      where: { id: itemId },
    });

    if (!item) throw new Error('Audit item not found');

    const variance = auditedQuantity - Number(item.expectedQuantity);
    const variancePercent = item.expectedQuantity > 0
      ? (variance / Number(item.expectedQuantity)) * 100
      : 0;
    const varianceValue = variance * Number(item.unitCost || 0);

    const updated = await prisma.inventoryAuditItem.update({
      where: { id: itemId },
      data: {
        auditedQuantity,
        variance,
        variancePercent,
        varianceValue,
        status: 'audited',
        auditedBy,
        auditedAt: new Date(),
        notes,
        photoUrls,
      },
    });

    // Update audit summary
    await this.updateAuditSummary(item.inventoryAuditId);

    return updated;
  },

  async updateAuditSummary(auditId: string) {
    const items = await prisma.inventoryAuditItem.findMany({
      where: { inventoryAuditId: auditId },
    });

    const itemsAudited = items.filter(i => i.status === 'audited').length;
    const itemsWithVariance = items.filter(i => i.variance && i.variance !== 0).length;
    const totalVarianceValue = items.reduce((sum, i) => sum + Number(i.varianceValue || 0), 0);

    await prisma.inventoryAudit.update({
      where: { id: auditId },
      data: {
        itemsAudited,
        itemsWithVariance,
        totalVarianceValue,
      },
    });
  },

  async getVarianceReport(auditId: string) {
    const audit = await prisma.inventoryAudit.findUnique({
      where: { id: auditId },
      include: {
        items: {
          where: {
            variance: { not: 0 },
          },
          orderBy: {
            varianceValue: 'desc',
          },
        },
      },
    });

    if (!audit) throw new Error('Audit not found');

    return {
      audit,
      variances: audit.items,
      summary: {
        totalVariances: audit.items.length,
        positiveVariances: audit.items.filter(i => Number(i.variance) > 0).length,
        negativeVariances: audit.items.filter(i => Number(i.variance) < 0).length,
        totalVarianceValue: Number(audit.totalVarianceValue),
      },
    };
  },

  // ===== ADJUSTMENT WORKFLOWS =====
  async createAdjustment(data: {
    tenantId: string;
    productId: string;
    adjustmentType: string;
    quantityBefore: number;
    quantityAfter: number;
    adjustmentQty: number;
    unitCost?: number;
    referenceType?: string;
    referenceId?: string;
    inventoryAuditId?: string;
    warehouseId?: string;
    binId?: string;
    lotId?: string;
    reason: string;
    notes?: string;
    requiresApproval?: boolean;
    createdBy: string;
  }) {
    const adjustmentNumber = 'ADJ' + Date.now();

    const totalValue = data.adjustmentQty * (data.unitCost || 0);

    return await prisma.inventoryAdjustment.create({
      data: {
        ...data,
        adjustmentNumber,
        totalValue,
        status: data.requiresApproval ? 'pending' : 'approved',
      },
    });
  },

  async approveAdjustment(adjustmentId: string, approvedBy: string) {
    const adjustment = await prisma.inventoryAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // Apply the adjustment
    await this.applyAdjustment(adjustmentId, approvedBy);

    return adjustment;
  },

  async rejectAdjustment(adjustmentId: string, rejectedBy: string, reason: string) {
    return await prisma.inventoryAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: 'rejected',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });
  },

  async applyAdjustment(adjustmentId: string, appliedBy: string) {
    const adjustment = await prisma.inventoryAdjustment.findUnique({
      where: { id: adjustmentId },
    });

    if (!adjustment || adjustment.status !== 'approved') {
      throw new Error('Adjustment cannot be applied');
    }

    // Update stock quantity
    await prisma.stock.updateMany({
      where: {
        tenantId: adjustment.tenantId,
        productId: adjustment.productId,
        locationId: adjustment.warehouseId,
      },
      data: {
        quantity: adjustment.quantityAfter,
      },
    });

    // Create stock movement
    await prisma.stockMovement.create({
      data: {
        tenantId: adjustment.tenantId,
        productId: adjustment.productId,
        locationId: adjustment.warehouseId,
        userId: appliedBy,
        type: 'adjustment',
        quantity: Math.abs(adjustment.adjustmentQty),
        quantityBefore: adjustment.quantityBefore,
        quantityAfter: adjustment.quantityAfter,
        referenceType: 'adjustment',
        referenceId: adjustmentId,
        notes: adjustment.reason,
      },
    });

    return await prisma.inventoryAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: 'applied',
        appliedBy,
        appliedAt: new Date(),
      },
    });
  },

  async getAdjustments(params: {
    tenantId: string;
    status?: string;
    inventoryAuditId?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, status, inventoryAuditId, page = 1, limit = 50 } = params;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (inventoryAuditId) where.inventoryAuditId = inventoryAuditId;

    const [data, total] = await Promise.all([
      prisma.inventoryAdjustment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryAdjustment.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  },

  // ===== AUDIT HISTORY =====
  async getAuditHistory(params: {
    tenantId: string;
    productId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, productId, startDate, endDate, page = 1, limit = 50 } = params;

    const where: any = { tenantId };
    
    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = startDate;
      if (endDate) where.scheduledDate.lte = endDate;
    }

    // If filtering by product, need to join through items
    const audits = await prisma.inventoryAudit.findMany({
      where,
      include: {
        items: productId ? {
          where: { productId },
        } : undefined,
        _count: { select: { items: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { scheduledDate: 'desc' },
    });

    const total = await prisma.inventoryAudit.count({ where });

    return {
      data: audits,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  async completeAudit(auditId: string) {
    const audit = await prisma.inventoryAudit.findUnique({
      where: { id: auditId },
      include: { items: true },
    });

    if (!audit) throw new Error('Audit not found');

    const allItemsAudited = audit.items.every(item => item.status === 'audited');

    if (!allItemsAudited) {
      throw new Error('Not all items have been audited');
    }

    return await prisma.inventoryAudit.update({
      where: { id: auditId },
      data: {
        status: 'completed',
        endDate: new Date(),
      },
    });
  },

  async submitAuditForReview(auditId: string) {
    return await prisma.inventoryAudit.update({
      where: { id: auditId },
      data: { status: 'review' },
    });
  },

  async approveAudit(auditId: string, approvedBy: string) {
    const audit = await prisma.inventoryAudit.update({
      where: { id: auditId },
      data: {
        status: 'completed',
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // Create adjustments for all variances
    const items = await prisma.inventoryAuditItem.findMany({
      where: {
        inventoryAuditId: auditId,
        variance: { not: 0 },
      },
    });

    for (const item of items) {
      await this.createAdjustment({
        tenantId: audit.tenantId,
        productId: item.productId,
        adjustmentType: 'count_adjustment',
        quantityBefore: Number(item.expectedQuantity),
        quantityAfter: Number(item.auditedQuantity || 0),
        adjustmentQty: Number(item.variance || 0),
        unitCost: Number(item.unitCost),
        inventoryAuditId: auditId,
        warehouseId: audit.warehouseId,
        reason: `Audit variance correction - Audit #${audit.auditNumber}`,
        requiresApproval: false,
        createdBy: approvedBy,
      });
    }

    return audit;
  },

  async getAuditStatistics(tenantId: string, periodStart: Date, periodEnd: Date) {
    const audits = await prisma.inventoryAudit.findMany({
      where: {
        tenantId,
        scheduledDate: { gte: periodStart, lte: periodEnd },
      },
      include: {
        items: true,
      },
    });

    const stats = {
      totalAudits: audits.length,
      completedAudits: audits.filter(a => a.status === 'completed').length,
      totalItemsAudited: audits.reduce((sum, a) => sum + a.itemsAudited, 0),
      totalVariances: audits.reduce((sum, a) => sum + a.itemsWithVariance, 0),
      totalVarianceValue: audits.reduce((sum, a) => sum + Number(a.totalVarianceValue), 0),
      accuracyRate: 0,
    };

    if (stats.totalItemsAudited > 0) {
      stats.accuracyRate = ((stats.totalItemsAudited - stats.totalVariances) / stats.totalItemsAudited) * 100;
    }

    return stats;
  },
};
