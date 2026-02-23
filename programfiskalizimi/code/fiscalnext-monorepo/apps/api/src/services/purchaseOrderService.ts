import { prisma } from '@fiscalnext/database';
import type { Prisma } from '@prisma/client';

export const purchaseOrderService = {
  // Get all purchase orders
  async getAll(tenantId: string, filters?: {
    status?: string;
    supplierId?: string;
    search?: string;
  }) {
    const where: Prisma.PurchaseOrderWhereInput = {
      tenantId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.search) {
      where.poNumber = { contains: filters.search, mode: 'insensitive' };
    }

    return prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: { id: true, name: true },
        },
        location: {
          select: { id: true, name: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
        _count: {
          select: { receipts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Get PO by ID
  async getById(id: string, tenantId: string) {
    return prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        supplier: {
          include: {
            contacts: true,
          },
        },
        location: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        items: {
          include: {
            product: true,
          },
        },
        receipts: {
          include: {
            items: true,
          },
        },
      },
    });
  },

  // Create PO
  async create(tenantId: string, userId: string, data: {
    supplierId: string;
    locationId?: string;
    expectedDate?: Date;
    notes?: string;
    internalNotes?: string;
    items: Array<{
      productId: string;
      productName: string;
      sku?: string;
      quantityOrdered: number;
      unitCost: number;
      taxRate?: number;
    }>;
  }) {
    // Generate PO number
    const lastPO = await prisma.purchaseOrder.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { poNumber: true },
    });

    const poNumber = `PO-${String((parseInt(lastPO?.poNumber?.split('-')[1] || '0') + 1)).padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const items = data.items.map(item => {
      const itemSubtotal = item.quantityOrdered * item.unitCost;
      const itemTax = itemSubtotal * ((item.taxRate || 0) / 100);
      const itemTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;
      taxAmount += itemTax;

      return {
        ...item,
        subtotal: itemSubtotal,
        total: itemTotal,
      };
    });

    const totalAmount = subtotal + taxAmount;

    return prisma.purchaseOrder.create({
      data: {
        tenantId,
        userId,
        poNumber,
        supplierId: data.supplierId,
        locationId: data.locationId,
        expectedDate: data.expectedDate,
        notes: data.notes,
        internalNotes: data.internalNotes,
        subtotal,
        taxAmount,
        totalAmount,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
        supplier: true,
      },
    });
  },

  // Update PO (only if draft or pending_approval)
  async update(id: string, tenantId: string, data: any) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });

    if (!po) {
      throw new Error('Purchase order not found');
    }

    if (!['draft', 'pending_approval'].includes(po.status)) {
      throw new Error('Cannot update purchase order in current status');
    }

    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },

  // Submit for approval
  async submitForApproval(id: string, tenantId: string) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'pending_approval',
        updatedAt: new Date(),
      },
    });
  },

  // Approve PO
  async approve(id: string, tenantId: string, approvedBy: string) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  },

  // Mark as sent to supplier
  async markAsSent(id: string, tenantId: string) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'sent',
        updatedAt: new Date(),
      },
    });
  },

  // Receive inventory
  async receiveInventory(
    purchaseOrderId: string,
    tenantId: string,
    userId: string,
    data: {
      locationId?: string;
      receiptType: 'partial' | 'complete';
      items: Array<{
        productId: string;
        quantityReceived: number;
        batchNumber?: string;
      }>;
      notes?: string;
    }
  ) {
    // Generate receipt number
    const lastReceipt = await prisma.purchaseReceipt.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { receiptNumber: true },
    });

    const receiptNumber = `RCV-${String((parseInt(lastReceipt?.receiptNumber?.split('-')[1] || '0') + 1)).padStart(6, '0')}`;

    // Create receipt
    const receipt = await prisma.purchaseReceipt.create({
      data: {
        purchaseOrderId,
        tenantId,
        userId,
        locationId: data.locationId,
        receiptNumber,
        receiptType: data.receiptType,
        notes: data.notes,
        items: {
          create: data.items,
        },
      },
      include: {
        items: true,
      },
    });

    // Update PO item quantities received
    for (const item of data.items) {
      await prisma.purchaseOrderItem.updateMany({
        where: {
          purchaseOrderId,
          productId: item.productId,
        },
        data: {
          quantityReceived: {
            increment: item.quantityReceived,
          },
        },
      });

      // Update stock
      const stock = await prisma.stock.findFirst({
        where: {
          tenantId,
          productId: item.productId,
          locationId: data.locationId,
        },
      });

      if (stock) {
        await prisma.stock.update({
          where: { id: stock.id },
          data: {
            quantity: {
              increment: item.quantityReceived,
            },
          },
        });
      } else {
        await prisma.stock.create({
          data: {
            tenantId,
            productId: item.productId,
            locationId: data.locationId,
            quantity: item.quantityReceived,
          },
        });
      }

      // Create stock movement
      await prisma.stockMovement.create({
        data: {
          tenantId,
          productId: item.productId,
          locationId: data.locationId,
          userId,
          type: 'in',
          quantity: item.quantityReceived,
          quantityBefore: stock?.quantity || 0,
          quantityAfter: (stock?.quantity || 0) + item.quantityReceived,
          referenceType: 'purchase_receipt',
          referenceId: receipt.id,
          notes: `Received from PO ${purchaseOrderId}`,
        },
      });
    }

    // Check if PO is fully received
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true },
    });

    const fullyReceived = po?.items.every(
      item => item.quantityReceived >= item.quantityOrdered
    );

    if (fullyReceived) {
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          status: 'received',
          receivedDate: new Date(),
        },
      });
    } else {
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          status: 'partial',
        },
      });
    }

    return receipt;
  },

  // Cancel PO
  async cancel(id: string, tenantId: string) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });
  },

  // Get outstanding orders
  async getOutstanding(tenantId: string, supplierId?: string) {
    return prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        supplierId,
        status: {
          in: ['approved', 'sent', 'partial'],
        },
      },
      include: {
        supplier: true,
        items: true,
      },
      orderBy: { expectedDate: 'asc' },
    });
  },
};
