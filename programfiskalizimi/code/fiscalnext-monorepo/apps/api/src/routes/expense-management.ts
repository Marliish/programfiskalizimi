import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fiscalnext/database';

// Validation Schemas
const expenseCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const expenseSchema = z.object({
  categoryId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default('ALL'),
  expenseDate: z.string(),
  receiptUrl: z.string().optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

const expenseRoutes: FastifyPluginAsync = async (fastify) => {
  // ========================================
  // EXPENSE CATEGORIES
  // ========================================

  // List categories
  fastify.get('/expense-categories', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    
    const categories = await prisma.expenseCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    
    return { categories };
  });

  // Create category
  fastify.post('/expense-categories', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const data = expenseCategorySchema.parse(request.body);
    
    const category = await prisma.expenseCategory.create({
      data: {
        ...data,
        tenantId,
      },
    });
    
    return reply.status(201).send({ category });
  });

  // Update category
  fastify.put('/expense-categories/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const data = expenseCategorySchema.partial().parse(request.body);
    
    const category = await prisma.expenseCategory.findFirst({
      where: { id, tenantId },
    });
    
    if (!category) {
      return reply.status(404).send({ error: 'Category not found' });
    }
    
    const updated = await prisma.expenseCategory.update({
      where: { id },
      data,
    });
    
    return { category: updated };
  });

  // Delete category
  fastify.delete('/expense-categories/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const category = await prisma.expenseCategory.findFirst({
      where: { id, tenantId },
    });
    
    if (!category) {
      return reply.status(404).send({ error: 'Category not found' });
    }
    
    // Check if category is in use
    const expenseCount = await prisma.expense.count({
      where: { categoryId: id },
    });
    
    if (expenseCount > 0) {
      return reply.status(400).send({ 
        error: 'Cannot delete category with expenses. Mark as inactive instead.' 
      });
    }
    
    await prisma.expenseCategory.delete({ where: { id } });
    
    return { success: true };
  });

  // ========================================
  // EXPENSES
  // ========================================

  // List expenses
  fastify.get('/expenses', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { status, employeeId, startDate, endDate } = request.query as any;
    
    const where: any = { tenantId };
    
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (startDate && endDate) {
      where.expenseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
        employee: true,
        vendor: true,
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });
    
    return { expenses };
  });

  // Get single expense
  fastify.get('/expenses/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const expense = await prisma.expense.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        employee: true,
        vendor: true,
      },
    });
    
    if (!expense) {
      return reply.status(404).send({ error: 'Expense not found' });
    }
    
    return { expense };
  });

  // Create expense
  fastify.post('/expenses', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId, userId } = request.user as any;
    const data = expenseSchema.parse(request.body);
    
    // Generate expense number
    const count = await prisma.expense.count({ where: { tenantId } });
    const expenseNumber = `EXP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    
    const expense = await prisma.expense.create({
      data: {
        ...data,
        expenseNumber,
        tenantId,
        expenseDate: new Date(data.expenseDate),
        submittedBy: userId,
      },
      include: {
        category: true,
        employee: true,
        vendor: true,
      },
    });
    
    return reply.status(201).send({ expense });
  });

  // Update expense (only if pending)
  fastify.put('/expenses/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const data = expenseSchema.partial().parse(request.body);
    
    const expense = await prisma.expense.findFirst({
      where: { id, tenantId, status: 'pending' },
    });
    
    if (!expense) {
      return reply.status(404).send({ error: 'Expense not found or cannot be edited' });
    }
    
    const updated = await prisma.expense.update({
      where: { id },
      data: {
        ...data,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
      },
      include: {
        category: true,
        employee: true,
        vendor: true,
      },
    });
    
    return { expense: updated };
  });

  // Approve expense
  fastify.post('/expenses/:id/approve', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId, userId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const expense = await prisma.expense.findFirst({
      where: { id, tenantId, status: 'pending' },
    });
    
    if (!expense) {
      return reply.status(404).send({ error: 'Expense not found or already processed' });
    }
    
    const updated = await prisma.expense.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        category: true,
        employee: true,
        vendor: true,
      },
    });
    
    return { expense: updated };
  });

  // Reject expense
  fastify.post('/expenses/:id/reject', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId, userId } = request.user as any;
    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason?: string };
    
    const expense = await prisma.expense.findFirst({
      where: { id, tenantId, status: 'pending' },
    });
    
    if (!expense) {
      return reply.status(404).send({ error: 'Expense not found or already processed' });
    }
    
    const updated = await prisma.expense.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        category: true,
        employee: true,
        vendor: true,
      },
    });
    
    return { expense: updated };
  });

  // Mark expense as paid
  fastify.post('/expenses/:id/pay', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const { paymentReference } = request.body as { paymentReference?: string };
    
    const expense = await prisma.expense.findFirst({
      where: { id, tenantId, status: 'approved' },
    });
    
    if (!expense) {
      return reply.status(404).send({ error: 'Expense not found or not approved' });
    }
    
    const updated = await prisma.expense.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paymentReference,
      },
      include: {
        category: true,
        employee: true,
        vendor: true,
      },
    });
    
    return { expense: updated };
  });

  // Delete expense (only if pending)
  fastify.delete('/expenses/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const expense = await prisma.expense.findFirst({
      where: { id, tenantId, status: 'pending' },
    });
    
    if (!expense) {
      return reply.status(404).send({ error: 'Expense not found or cannot be deleted' });
    }
    
    await prisma.expense.delete({ where: { id } });
    
    return { success: true };
  });

  // Get expense statistics
  fastify.get('/expenses/stats/summary', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { startDate, endDate } = request.query as any;
    
    const where: any = { tenantId };
    
    if (startDate && endDate) {
      where.expenseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    const [pending, approved, rejected, paid] = await Promise.all([
      prisma.expense.aggregate({
        where: { ...where, status: 'pending' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { ...where, status: 'approved' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { ...where, status: 'rejected' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { ...where, status: 'paid' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);
    
    return {
      pending: {
        count: pending._count,
        total: pending._sum.amount || 0,
      },
      approved: {
        count: approved._count,
        total: approved._sum.amount || 0,
      },
      rejected: {
        count: rejected._count,
        total: rejected._sum.amount || 0,
      },
      paid: {
        count: paid._count,
        total: paid._sum.amount || 0,
      },
    };
  });
};

export default expenseRoutes;
