import { prisma } from '@fiscalnext/database';
import type { Prisma } from '@prisma/client';

export const batchService = {
  // Get all batches
  async getAll(tenantId: string, filters?: {
    productId?: string;
    locationId?: string;
    status?: string;
    expiringBefore?: Date;
  }) {
    const where: Prisma.BatchWhereInput = {
      tenantId,
    };

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.locationId) {
      where.locationId = filters.locationId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.expiringBefore) {
      where.expirationDate = {
        lte: filters.expiringBefore,
        gte: new Date(),
      };
    }

    return prisma.batch.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
        location: {
          select: { id: true, name: true },
        },
      },
      orderBy: { expirationDate: 'asc' },
    });
  },

  // Get batch by ID with movement history
  async getById(id: string, tenantId: string) {
    return prisma.batch.findFirst({
      where: { id, tenantId },
      include: {
        product: true,
        location: true,
        movements: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  // Create batch
  async create(tenantId: string, data: {
    productId: string;
    locationId?: string;
    batchNumber: string;
    lotNumber?: string;
    initialQuantity: number;
    unitCost: number;
    costingMethod?: 'FIFO' | 'LIFO' | 'Average';
    manufacturingDate?: Date;
    expirationDate?: Date;
    supplierId?: string;
    purchaseOrderId?: string;
    notes?: string;
  }) {
    return prisma.batch.create({
      data: {
        ...data,
        tenantId,
        currentQuantity: data.initialQuantity,
        costingMethod: data.costingMethod || 'FIFO',
      },
    });
  },

  // Update batch
  async update(id: string, tenantId: string, data: Partial<{
    status: string;
    notes: string;
    expirationDate: Date;
  }>) {
    return prisma.batch.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },

  // Record batch movement
  async recordMovement(
    batchId: string,
    tenantId: string,
    userId: string,
    data: {
      type: 'in' | 'out' | 'adjustment' | 'sale' | 'transfer' | 'expire';
      quantity: number;
      referenceType?: string;
      referenceId?: string;
      notes?: string;
    }
  ) {
    const batch = await prisma.batch.findFirst({
      where: { id: batchId, tenantId },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    const quantityBefore = batch.currentQuantity;
    const quantityChange = data.type === 'in' ? data.quantity : -data.quantity;
    const quantityAfter = quantityBefore + quantityChange;

    if (quantityAfter < 0) {
      throw new Error('Insufficient batch quantity');
    }

    // Create movement record
    const movement = await prisma.batchMovement.create({
      data: {
        batchId,
        tenantId,
        productId: batch.productId,
        userId,
        type: data.type,
        quantity: data.quantity,
        quantityBefore,
        quantityAfter,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
      },
    });

    // Update batch quantity
    await prisma.batch.update({
      where: { id: batchId },
      data: {
        currentQuantity: quantityAfter,
        status: quantityAfter === 0 ? 'depleted' : batch.status,
      },
    });

    return movement;
  },

  // Get expiring batches (within days)
  async getExpiring(tenantId: string, days: number = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return prisma.batch.findMany({
      where: {
        tenantId,
        status: 'active',
        expirationDate: {
          lte: expiryDate,
          gte: new Date(),
        },
        currentQuantity: {
          gt: 0,
        },
      },
      include: {
        product: true,
        location: true,
      },
      orderBy: { expirationDate: 'asc' },
    });
  },

  // Initiate batch recall
  async initiateRecall(id: string, tenantId: string, reason: string) {
    return prisma.batch.update({
      where: { id },
      data: {
        status: 'recalled',
        notes: `RECALL: ${reason}`,
        updatedAt: new Date(),
      },
    });
  },

  // Calculate cost for FIFO/LIFO/Average
  async calculateCost(tenantId: string, productId: string, quantity: number, method: 'FIFO' | 'LIFO' | 'Average') {
    const batches = await prisma.batch.findMany({
      where: {
        tenantId,
        productId,
        status: 'active',
        currentQuantity: { gt: 0 },
      },
      orderBy: method === 'FIFO' ? { receivedDate: 'asc' } : { receivedDate: 'desc' },
    });

    if (method === 'Average') {
      const totalValue = batches.reduce((sum, b) => sum + (b.currentQuantity.toNumber() * b.unitCost.toNumber()), 0);
      const totalQty = batches.reduce((sum, b) => sum + b.currentQuantity.toNumber(), 0);
      return totalQty > 0 ? totalValue / totalQty : 0;
    }

    let remainingQty = quantity;
    let totalCost = 0;

    for (const batch of batches) {
      const availableQty = batch.currentQuantity.toNumber();
      const qtyToUse = Math.min(remainingQty, availableQty);
      
      totalCost += qtyToUse * batch.unitCost.toNumber();
      remainingQty -= qtyToUse;

      if (remainingQty <= 0) break;
    }

    return totalCost / quantity;
  },
};
