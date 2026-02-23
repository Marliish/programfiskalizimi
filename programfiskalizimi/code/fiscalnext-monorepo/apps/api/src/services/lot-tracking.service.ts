// Lot Tracking & Recalls Service
// Team 3: Tafa (Backend Developer)
// Features: All 7 lot tracking features

import { PrismaClient } from '@fiscalnext/database';

const prisma = new PrismaClient();

export const lotTrackingService = {
  // ===== LOT NUMBER ASSIGNMENT =====
  async createLot(data: {
    tenantId: string;
    productId: string;
    lotNumber: string;
    batchNumber?: string;
    serialNumber?: string;
    manufacturingDate?: Date;
    expiryDate?: Date;
    initialQuantity: number;
    supplierId?: string;
    supplierLotNumber?: string;
    unitCost?: number;
  }) {
    return await prisma.lotNumber.create({
      data: {
        ...data,
        currentQuantity: data.initialQuantity,
        status: 'active',
      },
    });
  },

  async generateLotNumber(tenantId: string, productId: string): Promise<string> {
    // Format: LOT-YYYYMMDD-XXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LOT-${dateStr}-${random}`;
  },

  async getLots(params: {
    tenantId: string;
    productId?: string;
    status?: string;
    expiringBefore?: Date;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, productId, status, expiringBefore, page = 1, limit = 50 } = params;

    const where: any = { tenantId };
    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (expiringBefore) {
      where.expiryDate = { lte: expiringBefore };
    }

    const [data, total] = await Promise.all([
      prisma.lotNumber.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { expiryDate: 'asc' },
          { receivedDate: 'desc' },
        ],
      }),
      prisma.lotNumber.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  },

  // ===== FIFO/LIFO/FEFO ENFORCEMENT =====
  async getLotsForPicking(params: {
    tenantId: string;
    productId: string;
    quantity: number;
    method?: string; // FIFO, LIFO, FEFO
  }) {
    const { tenantId, productId, quantity, method = 'FIFO' } = params;

    // Get policy
    const policy = await prisma.lotInventoryPolicy.findFirst({
      where: {
        tenantId,
        OR: [
          { productId },
          { productId: null },
        ],
        isActive: true,
      },
    });

    const pickingMethod = policy?.pickingMethod || method;

    const lots = await prisma.lotNumber.findMany({
      where: {
        tenantId,
        productId,
        status: 'active',
        currentQuantity: { gt: 0 },
      },
      orderBy: this.getOrderingForMethod(pickingMethod),
    });

    // Allocate quantities
    let remainingQty = quantity;
    const allocations = [];

    for (const lot of lots) {
      if (remainingQty <= 0) break;

      const availableQty = Number(lot.currentQuantity) - Number(lot.reservedQuantity);
      const allocatedQty = Math.min(availableQty, remainingQty);

      if (allocatedQty > 0) {
        allocations.push({
          lotId: lot.id,
          lotNumber: lot.lotNumber,
          allocatedQuantity: allocatedQty,
          expiryDate: lot.expiryDate,
        });

        remainingQty -= allocatedQty;
      }
    }

    return {
      allocations,
      fullyAllocated: remainingQty === 0,
      shortfall: remainingQty,
    };
  },

  getOrderingForMethod(method: string): any {
    switch (method) {
      case 'FIFO':
        return { receivedDate: 'asc' };
      case 'LIFO':
        return { receivedDate: 'desc' };
      case 'FEFO':
        return { expiryDate: 'asc' };
      default:
        return { receivedDate: 'asc' };
    }
  },

  // ===== EXPIRY DATE MANAGEMENT =====
  async getExpiringLots(params: {
    tenantId: string;
    daysThreshold?: number;
  }) {
    const { tenantId, daysThreshold = 30 } = params;

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return await prisma.lotNumber.findMany({
      where: {
        tenantId,
        status: 'active',
        expiryDate: {
          lte: thresholdDate,
        },
        currentQuantity: { gt: 0 },
      },
      orderBy: { expiryDate: 'asc' },
    });
  },

  async markExpired(lotId: string) {
    return await prisma.lotNumber.update({
      where: { id: lotId },
      data: { status: 'expired' },
    });
  },

  async checkExpiredLots(tenantId: string) {
    const expiredLots = await prisma.lotNumber.findMany({
      where: {
        tenantId,
        status: 'active',
        expiryDate: { lte: new Date() },
      },
    });

    for (const lot of expiredLots) {
      await this.markExpired(lot.id);
    }

    return {
      expiredCount: expiredLots.length,
      lots: expiredLots,
    };
  },

  // ===== RECALL MANAGEMENT =====
  async createRecall(data: {
    tenantId: string;
    productId: string;
    recallNumber: string;
    recallType: string;
    affectedLotNumbers: string[];
    recallReason: string;
    healthRisk: string;
    actionRequired: string;
    returnInstructions?: string;
    createdBy: string;
  }) {
    const { affectedLotNumbers, ...recallData } = data;

    // Mark lots as recalled
    await prisma.lotNumber.updateMany({
      where: {
        tenantId: data.tenantId,
        lotNumber: { in: affectedLotNumbers },
      },
      data: {
        isRecalled: true,
        recallDate: new Date(),
        recallReason: data.recallReason,
        status: 'recalled',
      },
    });

    // Count affected units
    const lots = await prisma.lotNumber.findMany({
      where: {
        tenantId: data.tenantId,
        lotNumber: { in: affectedLotNumbers },
      },
    });

    const unitsAffected = lots.reduce((sum, lot) => sum + Number(lot.currentQuantity), 0);

    return await prisma.productRecall.create({
      data: {
        ...recallData,
        affectedLotNumbers,
        recallDate: new Date(),
        effectiveDate: new Date(),
        unitsAffected: Math.floor(unitsAffected),
      },
    });
  },

  async getRecalls(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return await prisma.productRecall.findMany({
      where,
      orderBy: { recallDate: 'desc' },
    });
  },

  async updateRecallStatus(recallId: string, updates: {
    unitsRecovered?: number;
    unitsDestroyed?: number;
    customersNotified?: number;
    status?: string;
  }) {
    return await prisma.productRecall.update({
      where: { id: recallId },
      data: updates,
    });
  },

  async completeRecall(recallId: string) {
    return await prisma.productRecall.update({
      where: { id: recallId },
      data: {
        status: 'completed',
        completionDate: new Date(),
      },
    });
  },

  // ===== TRACEABILITY REPORTS =====
  async traceLot(lotId: string) {
    const lot = await prisma.lotNumber.findUnique({
      where: { id: lotId },
      include: {
        lotMovements: {
          orderBy: { performedAt: 'asc' },
        },
      },
    });

    if (!lot) throw new Error('Lot not found');

    // Get all transactions that used this lot
    const traceabilityLogs = await prisma.traceabilityLog.findMany({
      where: {
        entityType: 'lot',
        entityId: lotId,
      },
      orderBy: { eventTime: 'asc' },
    });

    return {
      lot,
      movements: lot.lotMovements,
      traceabilityLogs,
      timeline: this.buildTimeline(lot.lotMovements, traceabilityLogs),
    };
  },

  buildTimeline(movements: any[], logs: any[]) {
    const events = [
      ...movements.map(m => ({
        type: 'movement',
        time: m.performedAt,
        data: m,
      })),
      ...logs.map(l => ({
        type: 'log',
        time: l.eventTime,
        data: l,
      })),
    ];

    return events.sort((a, b) => a.time.getTime() - b.time.getTime());
  },

  async createTraceabilityLog(data: {
    tenantId: string;
    entityType: string;
    entityId: string;
    eventType: string;
    eventData: any;
    fromLocation?: string;
    toLocation?: string;
    recordedBy: string;
  }) {
    return await prisma.traceabilityLog.create({ data });
  },

  // ===== LOT GENEALOGY =====
  async getLotGenealogy(lotId: string) {
    // Track parent-child relationships for lots (e.g., raw materials -> finished goods)
    const lot = await prisma.lotNumber.findUnique({
      where: { id: lotId },
    });

    if (!lot) return null;

    // This would need additional schema for lot relationships
    // For now, return basic lot info
    return {
      lot,
      parents: [], // Would be parent lots used to create this
      children: [], // Would be lots created from this
    };
  },

  // ===== COMPLIANCE REPORTING =====
  async generateComplianceReport(params: {
    tenantId: string;
    startDate: Date;
    endDate: Date;
    reportType: string;
  }) {
    const { tenantId, startDate, endDate, reportType } = params;

    const report: any = {
      reportType,
      period: { startDate, endDate },
      generated: new Date(),
    };

    switch (reportType) {
      case 'expiry_management':
        report.data = await this.getExpiryManagementReport(tenantId, startDate, endDate);
        break;
      case 'recall_summary':
        report.data = await this.getRecallSummaryReport(tenantId, startDate, endDate);
        break;
      case 'lot_traceability':
        report.data = await this.getLotTraceabilityReport(tenantId, startDate, endDate);
        break;
      default:
        throw new Error('Unknown report type');
    }

    return report;
  },

  async getExpiryManagementReport(tenantId: string, startDate: Date, endDate: Date) {
    const expiredLots = await prisma.lotNumber.findMany({
      where: {
        tenantId,
        expiryDate: { gte: startDate, lte: endDate },
      },
    });

    return {
      totalLots: expiredLots.length,
      totalValue: expiredLots.reduce((sum, lot) => 
        sum + (Number(lot.currentQuantity) * Number(lot.unitCost || 0)), 0
      ),
      lots: expiredLots,
    };
  },

  async getRecallSummaryReport(tenantId: string, startDate: Date, endDate: Date) {
    const recalls = await prisma.productRecall.findMany({
      where: {
        tenantId,
        recallDate: { gte: startDate, lte: endDate },
      },
    });

    return {
      totalRecalls: recalls.length,
      byType: this.groupBy(recalls, 'recallType'),
      byStatus: this.groupBy(recalls, 'status'),
      totalUnitsAffected: recalls.reduce((sum, r) => sum + r.unitsAffected, 0),
    };
  },

  async getLotTraceabilityReport(tenantId: string, startDate: Date, endDate: Date) {
    const movements = await prisma.lotMovement.findMany({
      where: {
        tenantId,
        performedAt: { gte: startDate, lte: endDate },
      },
      include: {
        lot: true,
      },
    });

    return {
      totalMovements: movements.length,
      byType: this.groupBy(movements, 'movementType'),
      movements,
    };
  },

  groupBy(array: any[], key: string) {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {} as Record<string, number>);
  },

  // ===== LOT INVENTORY POLICY =====
  async createLotPolicy(data: {
    tenantId: string;
    productId?: string;
    categoryId?: string;
    policyName: string;
    pickingMethod: string;
    enforceExpiry?: boolean;
    expiryWarningDays?: number;
    blockExpiredSales?: boolean;
    requireLotOnReceiving?: boolean;
    requireLotOnSale?: boolean;
    requireSerialNumbers?: boolean;
  }) {
    return await prisma.lotInventoryPolicy.create({ data });
  },

  async getLotPolicies(tenantId: string) {
    return await prisma.lotInventoryPolicy.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateLotPolicy(policyId: string, data: any) {
    return await prisma.lotInventoryPolicy.update({
      where: { id: policyId },
      data,
    });
  },

  // ===== LOT MOVEMENTS =====
  async recordLotMovement(data: {
    tenantId: string;
    lotId: string;
    movementType: string;
    quantity: number;
    referenceType?: string;
    referenceId?: string;
    fromBinId?: string;
    toBinId?: string;
    performedBy: string;
    notes?: string;
  }) {
    const lot = await prisma.lotNumber.findUnique({
      where: { id: data.lotId },
    });

    if (!lot) throw new Error('Lot not found');

    const quantityBefore = Number(lot.currentQuantity);
    let quantityAfter = quantityBefore;

    if (data.movementType === 'in') {
      quantityAfter += data.quantity;
    } else if (data.movementType === 'out') {
      quantityAfter -= data.quantity;
    }

    // Update lot quantity
    await prisma.lotNumber.update({
      where: { id: data.lotId },
      data: { currentQuantity: quantityAfter },
    });

    return await prisma.lotMovement.create({
      data: {
        ...data,
        quantityBefore,
        quantityAfter,
      },
    });
  },

  async getLotMovements(params: {
    tenantId: string;
    lotId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, lotId, startDate, endDate, page = 1, limit = 50 } = params;

    const where: any = { tenantId };
    if (lotId) where.lotId = lotId;
    if (startDate || endDate) {
      where.performedAt = {};
      if (startDate) where.performedAt.gte = startDate;
      if (endDate) where.performedAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      prisma.lotMovement.findMany({
        where,
        include: {
          lot: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { performedAt: 'desc' },
      }),
      prisma.lotMovement.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  },
};
