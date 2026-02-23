import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const batchesRoute: FastifyPluginAsync = async (fastify) => {
  // GET /batches - List all batches
  fastify.get('/', async (request, reply) => {
    const { tenantId } = request.user;
    const { productId, locationId, status, expiringIn } = request.query as any;

    const where: any = { tenantId };
    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;
    if (status) where.status = status;

    if (expiringIn) {
      const daysAhead = parseInt(expiringIn);
      where.expirationDate = {
        lte: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000),
        gte: new Date(),
      };
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        location: { select: { id: true, name: true } },
      },
      orderBy: { expirationDate: 'asc' },
    });

    return { data: batches };
  });

  // POST /batches - Create new batch
  fastify.post('/', async (request, reply) => {
    const { tenantId } = request.user;
    const data = request.body as any;

    const batch = await prisma.batch.create({
      data: {
        ...data,
        tenantId,
        currentQuantity: data.initialQuantity,
      },
      include: { product: true, location: true },
    });

    return reply.code(201).send(batch);
  });

  // GET /batches/:id - Get batch details
  fastify.get('/:id', async (request, reply) => {
    const { tenantId } = request.user;
    const { id } = request.params as any;

    const batch = await prisma.batch.findFirst({
      where: { id, tenantId },
      include: {
        product: true,
        location: true,
        movements: {
          take: 50,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!batch) {
      return reply.code(404).send({ error: 'Batch not found' });
    }

    return batch;
  });

  // POST /batches/:id/adjust - Adjust batch quantity
  fastify.post('/:id/adjust', async (request, reply) => {
    const { tenantId, userId } = request.user;
    const { id } = request.params as any;
    const { quantity, notes } = request.body as any;

    const batch = await prisma.batch.findFirst({
      where: { id, tenantId },
    });

    if (!batch) {
      return reply.code(404).send({ error: 'Batch not found' });
    }

    const newQuantity = parseFloat(batch.currentQuantity.toString()) + parseFloat(quantity);

    await prisma.batch.update({
      where: { id },
      data: { currentQuantity: newQuantity },
    });

    await prisma.batchMovement.create({
      data: {
        batchId: id,
        tenantId,
        productId: batch.productId,
        userId,
        type: 'adjustment',
        quantity: Math.abs(quantity),
        quantityBefore: batch.currentQuantity,
        quantityAfter: newQuantity,
        notes,
      },
    });

    return { success: true, newQuantity };
  });
};

export default batchesRoute;
