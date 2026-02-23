import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fiscalnext/database';
import { Prisma } from '@prisma/client';

// Validation Schemas
const vendorSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('AL'),
  taxId: z.string().optional(),
  vatNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  paymentTerms: z.string().optional(),
  defaultCurrency: z.string().default('ALL'),
  notes: z.string().optional(),
});

const billSchema = z.object({
  vendorId: z.string().uuid(),
  vendorInvoiceNumber: z.string().optional(),
  billDate: z.string(),
  dueDate: z.string(),
  subtotal: z.number().nonnegative(),
  taxAmount: z.number().nonnegative().default(0),
  totalAmount: z.number().positive(),
  currency: z.string().default('ALL'),
  description: z.string().optional(),
  notes: z.string().optional(),
});

const billPaymentSchema = z.object({
  paymentDate: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.string().min(1),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

const billRoutes: FastifyPluginAsync = async (fastify) => {
  // ========================================
  // VENDORS
  // ========================================

  // List vendors
  fastify.get('/vendors', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { isActive } = request.query as any;
    
    const where: any = { tenantId };
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        _count: {
          select: {
            bills: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    
    return { vendors };
  });

  // Get single vendor
  fastify.get('/vendors/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const vendor = await prisma.vendor.findFirst({
      where: { id, tenantId },
      include: {
        bills: {
          orderBy: { billDate: 'desc' },
          take: 20,
        },
      },
    });
    
    if (!vendor) {
      return reply.status(404).send({ error: 'Vendor not found' });
    }
    
    return { vendor };
  });

  // Create vendor
  fastify.post('/vendors', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const data = vendorSchema.parse(request.body);
    
    // Generate vendor number
    const count = await prisma.vendor.count({ where: { tenantId } });
    const vendorNumber = `VEN-${String(count + 1).padStart(5, '0')}`;
    
    const vendor = await prisma.vendor.create({
      data: {
        ...data,
        vendorNumber,
        tenantId,
      },
    });
    
    return reply.status(201).send({ vendor });
  });

  // Update vendor
  fastify.put('/vendors/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const data = vendorSchema.partial().parse(request.body);
    
    const vendor = await prisma.vendor.findFirst({
      where: { id, tenantId },
    });
    
    if (!vendor) {
      return reply.status(404).send({ error: 'Vendor not found' });
    }
    
    const updated = await prisma.vendor.update({
      where: { id },
      data,
    });
    
    return { vendor: updated };
  });

  // Delete vendor
  fastify.delete('/vendors/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const vendor = await prisma.vendor.findFirst({
      where: { id, tenantId },
    });
    
    if (!vendor) {
      return reply.status(404).send({ error: 'Vendor not found' });
    }
    
    // Check if vendor has bills
    const billCount = await prisma.bill.count({ where: { vendorId: id } });
    
    if (billCount > 0) {
      return reply.status(400).send({ 
        error: 'Cannot delete vendor with bills. Mark as inactive instead.' 
      });
    }
    
    await prisma.vendor.delete({ where: { id } });
    
    return { success: true };
  });

  // ========================================
  // BILLS
  // ========================================

  // List bills
  fastify.get('/bills', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { status, vendorId, startDate, endDate } = request.query as any;
    
    const where: any = { tenantId };
    
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (startDate && endDate) {
      where.billDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    const bills = await prisma.bill.findMany({
      where,
      include: {
        vendor: true,
        payments: true,
      },
      orderBy: {
        billDate: 'desc',
      },
    });
    
    return { bills };
  });

  // Get single bill
  fastify.get('/bills/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const bill = await prisma.bill.findFirst({
      where: { id, tenantId },
      include: {
        vendor: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
    
    if (!bill) {
      return reply.status(404).send({ error: 'Bill not found' });
    }
    
    return { bill };
  });

  // Create bill
  fastify.post('/bills', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const data = billSchema.parse(request.body);
    
    // Generate bill number
    const count = await prisma.bill.count({ where: { tenantId } });
    const billNumber = `BILL-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    
    const bill = await prisma.bill.create({
      data: {
        ...data,
        billNumber,
        tenantId,
        billDate: new Date(data.billDate),
        dueDate: new Date(data.dueDate),
      },
      include: {
        vendor: true,
      },
    });
    
    return reply.status(201).send({ bill });
  });

  // Update bill (only if unpaid)
  fastify.put('/bills/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const data = billSchema.partial().parse(request.body);
    
    const bill = await prisma.bill.findFirst({
      where: { id, tenantId, status: 'unpaid' },
    });
    
    if (!bill) {
      return reply.status(404).send({ error: 'Bill not found or cannot be edited' });
    }
    
    const updated = await prisma.bill.update({
      where: { id },
      data: {
        ...data,
        billDate: data.billDate ? new Date(data.billDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        vendor: true,
        payments: true,
      },
    });
    
    return { bill: updated };
  });

  // Record payment
  fastify.post('/bills/:id/payments', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const data = billPaymentSchema.parse(request.body);
    
    const bill = await prisma.bill.findFirst({
      where: { id, tenantId },
    });
    
    if (!bill) {
      return reply.status(404).send({ error: 'Bill not found' });
    }
    
    if (bill.status === 'paid') {
      return reply.status(400).send({ error: 'Bill is already fully paid' });
    }
    
    const currentPaid = Number(bill.paidAmount);
    const totalAmount = Number(bill.totalAmount);
    const paymentAmount = data.amount;
    const newPaidAmount = currentPaid + paymentAmount;
    
    if (newPaidAmount > totalAmount) {
      return reply.status(400).send({ 
        error: 'Payment amount exceeds remaining balance' 
      });
    }
    
    // Create payment record
    const payment = await prisma.billPayment.create({
      data: {
        billId: id,
        paymentDate: new Date(data.paymentDate),
        amount: paymentAmount,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
      },
    });
    
    // Update bill status
    let newStatus = 'unpaid';
    if (newPaidAmount === totalAmount) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partially_paid';
    }
    
    const updatedBill = await prisma.bill.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
      include: {
        vendor: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
    
    return { payment, bill: updatedBill };
  });

  // Delete payment (only if bill not fully paid)
  fastify.delete('/bills/:billId/payments/:paymentId', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { billId, paymentId } = request.params as { billId: string; paymentId: string };
    
    const bill = await prisma.bill.findFirst({
      where: { id: billId, tenantId },
    });
    
    if (!bill) {
      return reply.status(404).send({ error: 'Bill not found' });
    }
    
    const payment = await prisma.billPayment.findFirst({
      where: { id: paymentId, billId },
    });
    
    if (!payment) {
      return reply.status(404).send({ error: 'Payment not found' });
    }
    
    const currentPaid = Number(bill.paidAmount);
    const paymentAmount = Number(payment.amount);
    const newPaidAmount = currentPaid - paymentAmount;
    
    // Delete payment
    await prisma.billPayment.delete({ where: { id: paymentId } });
    
    // Update bill status
    let newStatus = 'unpaid';
    const totalAmount = Number(bill.totalAmount);
    if (newPaidAmount === totalAmount) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partially_paid';
    }
    
    await prisma.bill.update({
      where: { id: billId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });
    
    return { success: true };
  });

  // Get overdue bills
  fastify.get('/bills/overdue/list', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    
    const bills = await prisma.bill.findMany({
      where: {
        tenantId,
        status: { in: ['unpaid', 'partially_paid'] },
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        vendor: true,
        payments: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
    
    return { bills };
  });

  // Get bill statistics
  fastify.get('/bills/stats/summary', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { startDate, endDate } = request.query as any;
    
    const where: any = { tenantId };
    
    if (startDate && endDate) {
      where.billDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    const [unpaid, partiallyPaid, paid, overdue] = await Promise.all([
      prisma.bill.aggregate({
        where: { ...where, status: 'unpaid' },
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
      }),
      prisma.bill.aggregate({
        where: { ...where, status: 'partially_paid' },
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
      }),
      prisma.bill.aggregate({
        where: { ...where, status: 'paid' },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.bill.aggregate({
        where: {
          ...where,
          status: { in: ['unpaid', 'partially_paid'] },
          dueDate: { lt: new Date() },
        },
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
      }),
    ]);
    
    return {
      unpaid: {
        count: unpaid._count,
        total: unpaid._sum.totalAmount || 0,
        paid: unpaid._sum.paidAmount || 0,
      },
      partiallyPaid: {
        count: partiallyPaid._count,
        total: partiallyPaid._sum.totalAmount || 0,
        paid: partiallyPaid._sum.paidAmount || 0,
      },
      paid: {
        count: paid._count,
        total: paid._sum.totalAmount || 0,
      },
      overdue: {
        count: overdue._count,
        total: overdue._sum.totalAmount || 0,
        paid: overdue._sum.paidAmount || 0,
      },
    };
  });
};

export default billRoutes;
