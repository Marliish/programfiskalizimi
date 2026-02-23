import { prisma } from '@fiscalnext/database';
import type { Prisma } from '@prisma/client';

export const assemblyService = {
  // Get all assembly orders
  async getAll(tenantId: string, filters?: {
    status?: string;
    productId?: string;
    locationId?: string;
  }) {
    const where: Prisma.AssemblyOrderWhereInput = {
      tenantId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.locationId) {
      where.locationId = filters.locationId;
    }

    return prisma.assemblyOrder.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
        recipe: {
          select: { id: true, name: true },
        },
        location: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            components: true,
            workOrders: true,
            qualityChecks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Get assembly order by ID
  async getById(id: string, tenantId: string) {
    return prisma.assemblyOrder.findFirst({
      where: { id, tenantId },
      include: {
        product: true,
        recipe: {
          include: {
            ingredients: {
              include: {
                ingredient: true,
              },
            },
          },
        },
        location: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        components: {
          include: {
            component: true,
          },
        },
        workOrders: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        qualityChecks: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });
  },

  // Create assembly order
  async create(tenantId: string, userId: string, data: {
    productId: string;
    recipeId?: string;
    locationId?: string;
    quantityToAssemble: number;
    scheduledDate?: Date;
    notes?: string;
  }) {
    // Generate order number
    const lastOrder = await prisma.assemblyOrder.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true },
    });

    const orderNumber = `ASM-${String((parseInt(lastOrder?.orderNumber?.split('-')[1] || '0') + 1)).padStart(6, '0')}`;

    // If recipe provided, auto-populate components
    let components = [];
    if (data.recipeId) {
      const recipe = await prisma.recipe.findUnique({
        where: { id: data.recipeId },
        include: {
          ingredients: true,
        },
      });

      if (recipe) {
        components = recipe.ingredients.map(ing => ({
          componentId: ing.ingredientId,
          quantityRequired: ing.quantity.toNumber() * data.quantityToAssemble,
          unit: ing.unit,
        }));
      }
    }

    return prisma.assemblyOrder.create({
      data: {
        tenantId,
        userId,
        orderNumber,
        productId: data.productId,
        recipeId: data.recipeId,
        locationId: data.locationId,
        quantityToAssemble: data.quantityToAssemble,
        scheduledDate: data.scheduledDate,
        notes: data.notes,
        components: {
          create: components,
        },
      },
      include: {
        components: {
          include: {
            component: true,
          },
        },
      },
    });
  },

  // Update assembly order
  async update(id: string, tenantId: string, data: any) {
    return prisma.assemblyOrder.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },

  // Start production
  async startProduction(id: string, tenantId: string) {
    return prisma.assemblyOrder.update({
      where: { id },
      data: {
        status: 'in_progress',
        startedAt: new Date(),
      },
    });
  },

  // Complete production
  async completeProduction(id: string, tenantId: string, userId: string) {
    const order = await prisma.assemblyOrder.findFirst({
      where: { id, tenantId },
      include: {
        components: true,
      },
    });

    if (!order) {
      throw new Error('Assembly order not found');
    }

    // Deplete components from stock
    for (const comp of order.components) {
      const stock = await prisma.stock.findFirst({
        where: {
          tenantId,
          productId: comp.componentId,
          locationId: order.locationId,
        },
      });

      if (stock) {
        await prisma.stock.update({
          where: { id: stock.id },
          data: {
            quantity: {
              decrement: comp.quantityRequired,
            },
          },
        });

        // Create stock movement
        await prisma.stockMovement.create({
          data: {
            tenantId,
            productId: comp.componentId,
            locationId: order.locationId,
            userId,
            type: 'out',
            quantity: comp.quantityRequired,
            quantityBefore: stock.quantity,
            quantityAfter: stock.quantity.toNumber() - comp.quantityRequired.toNumber(),
            referenceType: 'assembly',
            referenceId: id,
            notes: `Used in assembly order ${order.orderNumber}`,
          },
        });
      }

      // Update component used quantity
      await prisma.assemblyComponent.update({
        where: { id: comp.id },
        data: {
          quantityUsed: comp.quantityRequired,
        },
      });
    }

    // Add finished product to stock
    const finishedStock = await prisma.stock.findFirst({
      where: {
        tenantId,
        productId: order.productId,
        locationId: order.locationId,
      },
    });

    if (finishedStock) {
      await prisma.stock.update({
        where: { id: finishedStock.id },
        data: {
          quantity: {
            increment: order.quantityToAssemble,
          },
        },
      });
    } else {
      await prisma.stock.create({
        data: {
          tenantId,
          productId: order.productId,
          locationId: order.locationId,
          quantity: order.quantityToAssemble,
        },
      });
    }

    // Create stock movement for finished product
    await prisma.stockMovement.create({
      data: {
        tenantId,
        productId: order.productId,
        locationId: order.locationId,
        userId,
        type: 'in',
        quantity: order.quantityToAssemble,
        quantityBefore: finishedStock?.quantity || 0,
        quantityAfter: (finishedStock?.quantity.toNumber() || 0) + order.quantityToAssemble.toNumber(),
        referenceType: 'assembly',
        referenceId: id,
        notes: `Assembled from order ${order.orderNumber}`,
      },
    });

    // Update assembly order
    return prisma.assemblyOrder.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        quantityAssembled: order.quantityToAssemble,
      },
    });
  },

  // Create work order
  async createWorkOrder(
    assemblyOrderId: string,
    tenantId: string,
    userId: string,
    data: {
      estimatedDuration?: number;
      notes?: string;
    }
  ) {
    // Generate work order number
    const lastWO = await prisma.workOrder.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { workOrderNumber: true },
    });

    const workOrderNumber = `WO-${String((parseInt(lastWO?.workOrderNumber?.split('-')[1] || '0') + 1)).padStart(6, '0')}`;

    return prisma.workOrder.create({
      data: {
        assemblyOrderId,
        tenantId,
        userId,
        workOrderNumber,
        estimatedDuration: data.estimatedDuration,
        notes: data.notes,
      },
    });
  },

  // Update work order status
  async updateWorkOrderStatus(id: string, status: string) {
    const data: any = { status };

    if (status === 'in_progress') {
      data.startedAt = new Date();
    } else if (status === 'completed') {
      data.completedAt = new Date();
      
      // Calculate actual duration
      const wo = await prisma.workOrder.findUnique({ where: { id } });
      if (wo?.startedAt) {
        const duration = Math.floor((new Date().getTime() - wo.startedAt.getTime()) / 60000);
        data.actualDuration = duration;
      }
    } else if (status === 'paused') {
      data.pausedAt = new Date();
    }

    return prisma.workOrder.update({
      where: { id },
      data,
    });
  },

  // Create quality check
  async createQualityCheck(
    assemblyOrderId: string,
    tenantId: string,
    userId: string,
    data: {
      checkType: 'visual' | 'measurement' | 'functional';
      checklistItems: any;
      checkStatus: 'pass' | 'fail' | 'pending';
      defectsFound?: number;
      notes?: string;
    }
  ) {
    return prisma.qualityCheck.create({
      data: {
        assemblyOrderId,
        tenantId,
        userId,
        ...data,
      },
    });
  },

  // Cancel assembly order
  async cancel(id: string, tenantId: string) {
    return prisma.assemblyOrder.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });
  },
};
