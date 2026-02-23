import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const assemblyOrdersRoute: FastifyPluginAsync = async (fastify) => {
  // GET /assembly-orders - List all assembly orders
  fastify.get('/', async (request, reply) => {
    const { tenantId } = request.user;
    const { status, productId, locationId } = request.query as any;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;

    const orders = await prisma.assemblyOrder.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        recipe: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        _count: { select: { components: true, workOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: orders };
  });

  // POST /assembly-orders - Create new assembly order
  fastify.post('/', async (request, reply) => {
    const { tenantId, userId } = request.user;
    const { productId, recipeId, locationId, quantityToAssemble, scheduledDate, notes } = request.body as any;

    // Get recipe to populate components
    let components = [];
    let totalCost = 0;

    if (recipeId) {
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        include: { ingredients: { include: { ingredient: true } } },
      });

      if (recipe) {
        const multiplier = parseFloat(quantityToAssemble) / parseFloat(recipe.yieldQuantity.toString());
        
        components = recipe.ingredients.map((ing: any) => ({
          componentId: ing.ingredientId,
          quantityRequired: parseFloat(ing.quantity.toString()) * multiplier,
          unit: ing.unit,
        }));

        totalCost = parseFloat(recipe.totalCost.toString()) * multiplier;
      }
    }

    // Generate order number
    const count = await prisma.assemblyOrder.count({ where: { tenantId } });
    const orderNumber = `ASM-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const order = await prisma.assemblyOrder.create({
      data: {
        tenantId,
        productId,
        recipeId,
        locationId,
        userId,
        orderNumber,
        quantityToAssemble,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes,
        totalCost,
        components: {
          create: components,
        },
      },
      include: {
        product: true,
        recipe: true,
        location: true,
        components: {
          include: { component: true },
        },
      },
    });

    return reply.code(201).send(order);
  });

  // GET /assembly-orders/:id - Get assembly order details
  fastify.get('/:id', async (request, reply) => {
    const { tenantId } = request.user;
    const { id } = request.params as any;

    const order = await prisma.assemblyOrder.findFirst({
      where: { id, tenantId },
      include: {
        product: true,
        recipe: { include: { ingredients: { include: { ingredient: true } } } },
        location: true,
        components: {
          include: { component: true },
        },
        workOrders: true,
        qualityChecks: true,
      },
    });

    if (!order) {
      return reply.code(404).send({ error: 'Assembly order not found' });
    }

    return order;
  });

  // POST /assembly-orders/:id/start - Start production
  fastify.post('/:id/start', async (request, reply) => {
    const { tenantId, userId } = request.user;
    const { id } = request.params as any;

    const order = await prisma.assemblyOrder.findFirst({
      where: { id, tenantId },
      include: { components: true },
    });

    if (!order) {
      return reply.code(404).send({ error: 'Assembly order not found' });
    }

    if (order.status !== 'draft' && order.status !== 'scheduled') {
      return reply.code(400).send({ error: 'Cannot start this assembly order' });
    }

    // Check if enough components available
    for (const comp of order.components) {
      const stock = await prisma.stock.findFirst({
        where: {
          tenantId,
          productId: comp.componentId,
          locationId: order.locationId,
        },
      });

      if (!stock || parseFloat(stock.quantity.toString()) < parseFloat(comp.quantityRequired.toString())) {
        return reply.code(400).send({
          error: `Insufficient stock for component ${comp.componentId}`,
        });
      }
    }

    const updated = await prisma.assemblyOrder.update({
      where: { id },
      data: {
        status: 'in_progress',
        startedAt: new Date(),
      },
    });

    return updated;
  });

  // POST /assembly-orders/:id/complete - Complete assembly
  fastify.post('/:id/complete', async (request, reply) => {
    const { tenantId, userId } = request.user;
    const { id } = request.params as any;
    const { quantityCompleted } = request.body as any;

    const order = await prisma.assemblyOrder.findFirst({
      where: { id, tenantId },
      include: { components: true },
    });

    if (!order) {
      return reply.code(404).send({ error: 'Assembly order not found' });
    }

    if (order.status !== 'in_progress') {
      return reply.code(400).send({ error: 'Assembly order not in progress' });
    }

    // Deduct components from stock
    for (const comp of order.components) {
      const stock = await prisma.stock.findFirst({
        where: {
          tenantId,
          productId: comp.componentId,
          locationId: order.locationId,
        },
      });

      if (stock) {
        const newQty = parseFloat(stock.quantity.toString()) - parseFloat(comp.quantityRequired.toString());
        
        await prisma.stock.update({
          where: { id: stock.id },
          data: { quantity: newQty },
        });

        await prisma.stockMovement.create({
          data: {
            tenantId,
            productId: comp.componentId,
            locationId: order.locationId,
            userId,
            type: 'out',
            quantity: comp.quantityRequired,
            quantityBefore: stock.quantity,
            quantityAfter: newQty,
            referenceType: 'assembly',
            referenceId: order.id,
            notes: `Used in assembly ${order.orderNumber}`,
          },
        });
      }
    }

    // Add finished product to stock
    const finishedStock = await prisma.stock.findFirst({
      where: {
        tenantId,
        productId: order.productId,
        locationId: order.locationId,
      },
    });

    const qtyToAdd = quantityCompleted || order.quantityToAssemble;

    if (finishedStock) {
      const newQty = parseFloat(finishedStock.quantity.toString()) + parseFloat(qtyToAdd.toString());
      
      await prisma.stock.update({
        where: { id: finishedStock.id },
        data: { quantity: newQty },
      });

      await prisma.stockMovement.create({
        data: {
          tenantId,
          productId: order.productId,
          locationId: order.locationId,
          userId,
          type: 'in',
          quantity: qtyToAdd,
          quantityBefore: finishedStock.quantity,
          quantityAfter: newQty,
          referenceType: 'assembly',
          referenceId: order.id,
          notes: `Assembled from ${order.orderNumber}`,
        },
      });
    } else {
      await prisma.stock.create({
        data: {
          tenantId,
          productId: order.productId,
          locationId: order.locationId,
          quantity: qtyToAdd,
        },
      });
    }

    // Update assembly order
    const updated = await prisma.assemblyOrder.update({
      where: { id },
      data: {
        status: 'completed',
        quantityAssembled: qtyToAdd,
        completedAt: new Date(),
      },
    });

    return updated;
  });

  // POST /assembly-orders/:id/qc - Add quality check
  fastify.post('/:id/qc', async (request, reply) => {
    const { tenantId, userId } = request.user;
    const { id: assemblyOrderId } = request.params as any;
    const { checkType, checkStatus, checklistItems, defectsFound, notes } = request.body as any;

    const qc = await prisma.qualityCheck.create({
      data: {
        assemblyOrderId,
        tenantId,
        userId,
        checkType,
        checkStatus,
        checklistItems,
        defectsFound: defectsFound || 0,
        notes,
      },
    });

    return reply.code(201).send(qc);
  });
};

export default assemblyOrdersRoute;
