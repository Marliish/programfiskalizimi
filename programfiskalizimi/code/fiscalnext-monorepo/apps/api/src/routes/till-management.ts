// Till Management Routes - 12 Features
// Team: Tafa (Backend)
// Date: 2026-02-23

import { FastifyInstance } from 'fastify';
import { prisma } from '@fiscalnext/database';

export async function tillManagementRoutes(fastify: FastifyInstance) {
  // 1. Create till
  fastify.post('/tills', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { tillNumber, name, description, locationId } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const till = await prisma.till.create({
          data: {
            tenantId,
            locationId,
            tillNumber,
            name,
            description,
            status: 'closed',
            isActive: true
          }
        });

        return reply.status(201).send(till);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to create till' });
      }
    }
  });

  // 2. Get all tills
  fastify.get('/tills', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;
      const { locationId } = request.query as any;

      try {
        const tills = await prisma.till.findMany({
          where: {
            tenantId,
            ...(locationId ? { locationId } : {}),
            isActive: true
          },
          include: {
            location: true,
            sessions: {
              where: { status: 'open' },
              take: 1
            }
          },
          orderBy: { tillNumber: 'asc' }
        });

        return reply.send(tills);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch tills' });
      }
    }
  });

  // 3. Open till session
  fastify.post('/till-sessions/open', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { tillId, openingFloat, openingNotes, cashDenominations } = request.body as any;
      const tenantId = (request.user as any).tenantId;
      const userId = (request.user as any).userId;

      try {
        // Check if till exists and is closed
        const till = await prisma.till.findUnique({
          where: { id: tillId },
          include: {
            sessions: {
              where: { status: 'open' }
            }
          }
        });

        if (!till || till.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Till not found' });
        }

        if (till.sessions.length > 0) {
          return reply.status(400).send({ error: 'Till already has an open session' });
        }

        // Create session
        const session = await prisma.tillSession.create({
          data: {
            tillId,
            tenantId,
            openedBy: userId,
            openingFloat: openingFloat || 0,
            openingNotes,
            cashDenominations,
            status: 'open'
          }
        });

        // Update till status
        await prisma.till.update({
          where: { id: tillId },
          data: { status: 'open' }
        });

        return reply.status(201).send(session);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to open till session' });
      }
    }
  });

  // 4. Close till session
  fastify.post('/till-sessions/:id/close', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const {
        actualCash,
        actualCard,
        cashDenominations,
        closingNotes
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;
      const userId = (request.user as any).userId;

      try {
        const session = await prisma.tillSession.findUnique({
          where: { id },
          include: { till: true }
        });

        if (!session || session.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Till session not found' });
        }

        if (session.status !== 'open') {
          return reply.status(400).send({ error: 'Till session is not open' });
        }

        // Calculate expected totals from transactions
        const transactions = await prisma.transaction.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: session.openedAt
            }
          },
          include: {
            splitPayments: true
          }
        });

        let expectedCash = parseFloat(session.openingFloat.toString());
        let expectedCard = 0;

        transactions.forEach((txn: any) => {
          if (txn.splitPayments && txn.splitPayments.length > 0) {
            txn.splitPayments.forEach((payment: any) => {
              if (payment.paymentMethod === 'cash') {
                expectedCash += parseFloat(payment.amount.toString());
              } else if (payment.paymentMethod === 'card') {
                expectedCard += parseFloat(payment.amount.toString());
              }
            });
          }
        });

        const expectedTotal = expectedCash + expectedCard;
        const actualTotal = actualCash + actualCard;
        const cashDifference = actualCash - expectedCash;
        const cardDifference = actualCard - expectedCard;
        const totalDifference = actualTotal - expectedTotal;

        // Update session
        const updatedSession = await prisma.tillSession.update({
          where: { id },
          data: {
            closedBy: userId,
            expectedCash,
            expectedCard,
            expectedTotal,
            actualCash,
            actualCard,
            actualTotal,
            cashDifference,
            cardDifference,
            totalDifference,
            cashDenominations,
            closingNotes,
            transactionCount: transactions.length,
            totalSales: transactions.reduce((sum: number, txn: any) =>
              sum + parseFloat(txn.total.toString()), 0),
            status: 'closed',
            closedAt: new Date()
          }
        });

        // Update till status
        await prisma.till.update({
          where: { id: session.tillId },
          data: { status: 'closed' }
        });

        return reply.send(updatedSession);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to close till session' });
      }
    }
  });

  // 5. Get till sessions
  fastify.get('/till-sessions', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;
      const { tillId, status, startDate, endDate } = request.query as any;

      try {
        const sessions = await prisma.tillSession.findMany({
          where: {
            tenantId,
            ...(tillId ? { tillId } : {}),
            ...(status ? { status } : {}),
            ...(startDate && endDate ? {
              openedAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : {})
          },
          include: {
            till: true
          },
          orderBy: { openedAt: 'desc' }
        });

        return reply.send(sessions);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch till sessions' });
      }
    }
  });

  // 6. Reconcile till session
  fastify.post('/till-sessions/:id/reconcile', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const { notes } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const session = await prisma.tillSession.findUnique({
          where: { id }
        });

        if (!session || session.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Till session not found' });
        }

        if (session.status !== 'closed') {
          return reply.status(400).send({ error: 'Can only reconcile closed sessions' });
        }

        const updatedSession = await prisma.tillSession.update({
          where: { id },
          data: {
            status: 'reconciled',
            reconciledAt: new Date(),
            closingNotes: notes || session.closingNotes
          }
        });

        return reply.send(updatedSession);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to reconcile till session' });
      }
    }
  });

  // 7. Create till transfer
  fastify.post('/till-transfers', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { fromTillId, toTillId, amount, reason, notes } = request.body as any;
      const tenantId = (request.user as any).tenantId;
      const userId = (request.user as any).userId;

      try {
        // Verify both tills exist
        const fromTill = await prisma.till.findUnique({ where: { id: fromTillId } });
        const toTill = await prisma.till.findUnique({ where: { id: toTillId } });

        if (!fromTill || !toTill || fromTill.tenantId !== tenantId || toTill.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Till(s) not found' });
        }

        if (fromTillId === toTillId) {
          return reply.status(400).send({ error: 'Cannot transfer to the same till' });
        }

        const transfer = await prisma.tillTransfer.create({
          data: {
            tenantId,
            fromTillId,
            toTillId,
            amount,
            reason,
            notes,
            initiatedBy: userId,
            status: 'pending'
          }
        });

        return reply.status(201).send(transfer);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to create till transfer' });
      }
    }
  });

  // 8. Approve till transfer
  fastify.post('/till-transfers/:id/approve', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const tenantId = (request.user as any).tenantId;
      const userId = (request.user as any).userId;

      try {
        const transfer = await prisma.tillTransfer.findUnique({
          where: { id }
        });

        if (!transfer || transfer.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Till transfer not found' });
        }

        if (transfer.status !== 'pending') {
          return reply.status(400).send({ error: 'Transfer is not pending' });
        }

        const updatedTransfer = await prisma.tillTransfer.update({
          where: { id },
          data: {
            status: 'completed',
            approvedBy: userId,
            completedAt: new Date()
          }
        });

        return reply.send(updatedTransfer);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to approve transfer' });
      }
    }
  });

  // 9. Generate Z-report (end of day)
  fastify.post('/till-reports/z-report', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { tillId, tillSessionId } = request.body as any;
      const tenantId = (request.user as any).tenantId;
      const userId = (request.user as any).userId;

      try {
        const session = await prisma.tillSession.findUnique({
          where: { id: tillSessionId },
          include: { till: true }
        });

        if (!session || session.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Till session not found' });
        }

        // Get all transactions for this session
        const transactions = await prisma.transaction.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: session.openedAt,
              ...(session.closedAt ? { lte: session.closedAt } : {})
            }
          },
          include: {
            items: true,
            splitPayments: true
          }
        });

        // Calculate totals
        const totalSales = transactions.reduce((sum, txn: any) =>
          sum + parseFloat(txn.total.toString()), 0);
        const totalCash = transactions.reduce((sum, txn: any) => {
          return sum + txn.splitPayments
            .filter((p: any) => p.paymentMethod === 'cash')
            .reduce((pSum: number, p: any) => pSum + parseFloat(p.amount.toString()), 0);
        }, 0);
        const totalCard = transactions.reduce((sum, txn: any) => {
          return sum + txn.splitPayments
            .filter((p: any) => p.paymentMethod === 'card')
            .reduce((pSum: number, p: any) => pSum + parseFloat(p.amount.toString()), 0);
        }, 0);
        const totalRefunds = 0; // TODO: Calculate from refund transactions
        const totalDiscounts = transactions.reduce((sum, txn: any) =>
          sum + parseFloat(txn.discountAmount.toString()), 0);
        const totalTax = transactions.reduce((sum, txn: any) =>
          sum + parseFloat(txn.taxAmount.toString()), 0);

        // Generate report number
        const reportNumber = `Z-${session.till.tillNumber}-${new Date().getTime()}`;

        const report = await prisma.tillReport.create({
          data: {
            tenantId,
            tillId,
            tillSessionId,
            reportType: 'z_report',
            reportNumber,
            totalSales,
            totalCash,
            totalCard,
            totalRefunds,
            totalDiscounts,
            totalTax,
            transactionCount: transactions.length,
            reportData: {
              session: {
                openedAt: session.openedAt,
                closedAt: session.closedAt,
                openingFloat: session.openingFloat
              },
              transactions: transactions.map((txn: any) => ({
                number: txn.transactionNumber,
                total: txn.total,
                items: txn.items.length
              }))
            },
            generatedBy: userId
          }
        });

        return reply.status(201).send(report);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to generate Z-report' });
      }
    }
  });

  // 10. Generate X-report (mid-day)
  fastify.post('/till-reports/x-report', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { tillId } = request.body as any;
      const tenantId = (request.user as any).tenantId;
      const userId = (request.user as any).userId;

      try {
        const till = await prisma.till.findUnique({
          where: { id: tillId },
          include: {
            sessions: {
              where: { status: 'open' },
              orderBy: { openedAt: 'desc' },
              take: 1
            }
          }
        });

        if (!till || till.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Till not found' });
        }

        const session = till.sessions[0];
        if (!session) {
          return reply.status(400).send({ error: 'No open session for this till' });
        }

        // Get transactions since session opened
        const transactions = await prisma.transaction.findMany({
          where: {
            tenantId,
            createdAt: { gte: session.openedAt }
          },
          include: {
            splitPayments: true
          }
        });

        const totalSales = transactions.reduce((sum, txn: any) =>
          sum + parseFloat(txn.total.toString()), 0);
        const totalCash = transactions.reduce((sum, txn: any) => {
          return sum + txn.splitPayments
            .filter((p: any) => p.paymentMethod === 'cash')
            .reduce((pSum: number, p: any) => pSum + parseFloat(p.amount.toString()), 0);
        }, 0);
        const totalCard = transactions.reduce((sum, txn: any) => {
          return sum + txn.splitPayments
            .filter((p: any) => p.paymentMethod === 'card')
            .reduce((pSum: number, p: any) => pSum + parseFloat(p.amount.toString()), 0);
        }, 0);

        const reportNumber = `X-${till.tillNumber}-${new Date().getTime()}`;

        const report = await prisma.tillReport.create({
          data: {
            tenantId,
            tillId,
            tillSessionId: session.id,
            reportType: 'x_report',
            reportNumber,
            totalSales,
            totalCash,
            totalCard,
            transactionCount: transactions.length,
            reportData: { sessionStart: session.openedAt },
            generatedBy: userId
          }
        });

        return reply.status(201).send(report);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to generate X-report' });
      }
    }
  });

  // 11. Get till reports
  fastify.get('/till-reports', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;
      const { tillId, reportType, startDate, endDate } = request.query as any;

      try {
        const reports = await prisma.tillReport.findMany({
          where: {
            tenantId,
            ...(tillId ? { tillId } : {}),
            ...(reportType ? { reportType } : {}),
            ...(startDate && endDate ? {
              generatedAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : {})
          },
          include: {
            till: true,
            tillSession: true
          },
          orderBy: { generatedAt: 'desc' }
        });

        return reply.send(reports);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch till reports' });
      }
    }
  });

  // 12. Get till audit trail
  fastify.get('/tills/:id/audit', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const tenantId = (request.user as any).tenantId;
      const { startDate, endDate } = request.query as any;

      try {
        const till = await prisma.till.findUnique({
          where: { id }
        });

        if (!till || till.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Till not found' });
        }

        // Get all sessions
        const sessions = await prisma.tillSession.findMany({
          where: {
            tillId: id,
            ...(startDate && endDate ? {
              openedAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : {})
          },
          orderBy: { openedAt: 'desc' }
        });

        // Get all transfers (from and to)
        const transfers = await prisma.tillTransfer.findMany({
          where: {
            OR: [
              { fromTillId: id },
              { toTillId: id }
            ],
            ...(startDate && endDate ? {
              initiatedAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : {})
          },
          orderBy: { initiatedAt: 'desc' }
        });

        // Get all reports
        const reports = await prisma.tillReport.findMany({
          where: {
            tillId: id,
            ...(startDate && endDate ? {
              generatedAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : {})
          },
          orderBy: { generatedAt: 'desc' }
        });

        return reply.send({
          till,
          sessions,
          transfers,
          reports
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch till audit trail' });
      }
    }
  });
}
