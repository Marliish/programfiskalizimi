// Split Payments Routes - 10 Features
// Team: Tafa (Backend)
// Date: 2026-02-23

import { FastifyInstance } from 'fastify';
import { prisma } from '@fiscalnext/database';

export async function splitPaymentsRoutes(fastify: FastifyInstance) {
  // 1. Add split payment to transaction
  fastify.post('/split-payments', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { transactionId, paymentMethod, amount, cardLastFour, cardType, referenceNumber, notes } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        // Verify transaction exists
        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId },
          include: { splitPayments: true }
        });

        if (!transaction || transaction.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Transaction not found' });
        }

        // Calculate total paid so far
        const totalPaid = transaction.splitPayments.reduce((sum: number, p: any) => {
          return sum + parseFloat(p.amount.toString());
        }, 0);

        // Check if this payment would exceed transaction total
        if (totalPaid + amount > parseFloat(transaction.total.toString())) {
          return reply.status(400).send({ error: 'Payment amount exceeds transaction total' });
        }

        // Check payment method limits
        const limits = await prisma.paymentMethodLimit.findFirst({
          where: {
            tenantId,
            paymentMethod,
            isActive: true
          }
        });

        if (limits) {
          if (limits.minAmount && amount < parseFloat(limits.minAmount.toString())) {
            return reply.status(400).send({ error: `Minimum amount for ${paymentMethod} is ${limits.minAmount}` });
          }
          if (limits.maxAmount && amount > parseFloat(limits.maxAmount.toString())) {
            return reply.status(400).send({ error: `Maximum amount for ${paymentMethod} is ${limits.maxAmount}` });
          }
        }

        const splitPayment = await prisma.splitPayment.create({
          data: {
            transactionId,
            tenantId,
            paymentMethod,
            amount,
            cardLastFour,
            cardType,
            referenceNumber,
            notes,
            status: 'completed'
          }
        });

        return reply.status(201).send(splitPayment);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to add split payment' });
      }
    }
  });

  // 2. Get split payments for transaction
  fastify.get('/split-payments/transaction/:transactionId', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { transactionId } = request.params as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const payments = await prisma.splitPayment.findMany({
          where: {
            transactionId,
            tenantId
          },
          orderBy: { createdAt: 'asc' }
        });

        return reply.send(payments);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch split payments' });
      }
    }
  });

  // 3. Reverse/refund split payment
  fastify.post('/split-payments/:id/reverse', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const { reversalType, amount, reason, notes } = request.body as any;
      const tenantId = (request.user as any).tenantId;
      const userId = (request.user as any).userId;

      try {
        const splitPayment = await prisma.splitPayment.findUnique({
          where: { id }
        });

        if (!splitPayment || splitPayment.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Split payment not found' });
        }

        if (splitPayment.status === 'reversed') {
          return reply.status(400).send({ error: 'Payment already reversed' });
        }

        const reversalAmount = reversalType === 'full' ? splitPayment.amount : amount;

        // Create reversal record
        const reversal = await prisma.paymentReversal.create({
          data: {
            splitPaymentId: id,
            tenantId,
            reversalType,
            amount: reversalAmount,
            reason,
            notes,
            processedBy: userId
          }
        });

        // Update split payment status
        await prisma.splitPayment.update({
          where: { id },
          data: {
            status: reversalType === 'full' ? 'reversed' : 'partially_refunded'
          }
        });

        return reply.send(reversal);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to process reversal' });
      }
    }
  });

  // 4. Get payment history for transaction
  fastify.get('/split-payments/history/:transactionId', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { transactionId } = request.params as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const payments = await prisma.splitPayment.findMany({
          where: {
            transactionId,
            tenantId
          },
          include: {
            reversals: true
          },
          orderBy: { createdAt: 'asc' }
        });

        return reply.send(payments);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch payment history' });
      }
    }
  });

  // 5. Get payment method limits
  fastify.get('/payment-method-limits', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;

      try {
        const limits = await prisma.paymentMethodLimit.findMany({
          where: { tenantId }
        });

        return reply.send(limits);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch payment method limits' });
      }
    }
  });

  // 6. Create/Update payment method limit
  fastify.post('/payment-method-limits', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { paymentMethod, minAmount, maxAmount, dailyLimit, isActive } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const existing = await prisma.paymentMethodLimit.findFirst({
          where: {
            tenantId,
            paymentMethod
          }
        });

        let limit;
        if (existing) {
          limit = await prisma.paymentMethodLimit.update({
            where: { id: existing.id },
            data: { minAmount, maxAmount, dailyLimit, isActive }
          });
        } else {
          limit = await prisma.paymentMethodLimit.create({
            data: {
              tenantId,
              paymentMethod,
              minAmount,
              maxAmount,
              dailyLimit,
              isActive
            }
          });
        }

        return reply.status(existing ? 200 : 201).send(limit);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to save payment method limit' });
      }
    }
  });

  // 7. Split payment by percentage
  fastify.post('/split-payments/by-percentage', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { transactionId, payments } = request.body as any;
      // payments: [{ method: 'cash', percentage: 50 }, { method: 'card', percentage: 50 }]
      const tenantId = (request.user as any).tenantId;

      try {
        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId }
        });

        if (!transaction || transaction.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Transaction not found' });
        }

        const totalPercentage = payments.reduce((sum: number, p: any) => sum + p.percentage, 0);
        if (totalPercentage !== 100) {
          return reply.status(400).send({ error: 'Total percentage must equal 100' });
        }

        const transactionTotal = parseFloat(transaction.total.toString());
        const createdPayments = [];

        for (const payment of payments) {
          const amount = (transactionTotal * payment.percentage) / 100;
          const splitPayment = await prisma.splitPayment.create({
            data: {
              transactionId,
              tenantId,
              paymentMethod: payment.method,
              amount,
              status: 'completed'
            }
          });
          createdPayments.push(splitPayment);
        }

        return reply.status(201).send(createdPayments);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to split payment by percentage' });
      }
    }
  });

  // 8. Split payment by amount
  fastify.post('/split-payments/by-amount', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { transactionId, payments } = request.body as any;
      // payments: [{ method: 'cash', amount: 50 }, { method: 'card', amount: 50 }]
      const tenantId = (request.user as any).tenantId;

      try {
        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId }
        });

        if (!transaction || transaction.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Transaction not found' });
        }

        const totalAmount = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const transactionTotal = parseFloat(transaction.total.toString());

        if (Math.abs(totalAmount - transactionTotal) > 0.01) {
          return reply.status(400).send({ error: 'Total payment amount must equal transaction total' });
        }

        const createdPayments = [];

        for (const payment of payments) {
          const splitPayment = await prisma.splitPayment.create({
            data: {
              transactionId,
              tenantId,
              paymentMethod: payment.method,
              amount: payment.amount,
              cardLastFour: payment.cardLastFour,
              cardType: payment.cardType,
              referenceNumber: payment.referenceNumber,
              status: 'completed'
            }
          });
          createdPayments.push(splitPayment);
        }

        return reply.status(201).send(createdPayments);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to split payment by amount' });
      }
    }
  });

  // 9. Get payment reversals
  fastify.get('/payment-reversals', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;
      const { startDate, endDate } = request.query as any;

      try {
        const reversals = await prisma.paymentReversal.findMany({
          where: {
            tenantId,
            ...(startDate && endDate ? {
              processedAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : {})
          },
          include: {
            splitPayment: {
              include: {
                transaction: true
              }
            }
          },
          orderBy: { processedAt: 'desc' }
        });

        return reply.send(reversals);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch payment reversals' });
      }
    }
  });

  // 10. Get split payment analytics
  fastify.get('/split-payments/analytics', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;
      const { startDate, endDate } = request.query as any;

      try {
        const payments = await prisma.splitPayment.findMany({
          where: {
            tenantId,
            ...(startDate && endDate ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : {})
          }
        });

        // Aggregate by payment method
        const byMethod = payments.reduce((acc: any, payment: any) => {
          const method = payment.paymentMethod;
          if (!acc[method]) {
            acc[method] = { count: 0, total: 0 };
          }
          acc[method].count++;
          acc[method].total += parseFloat(payment.amount.toString());
          return acc;
        }, {});

        return reply.send({
          totalTransactions: payments.length,
          byMethod,
          totalAmount: payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount.toString()), 0)
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch analytics' });
      }
    }
  });
}
