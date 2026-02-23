import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fiscalnext/database';

// Validation Schemas
const bankAccountSchema = z.object({
  accountNumber: z.string().min(1),
  accountName: z.string().min(1),
  bankName: z.string().min(1),
  currency: z.string().default('ALL'),
  currentBalance: z.number().default(0),
});

const bankTransactionSchema = z.object({
  transactionDate: z.string(),
  description: z.string().min(1),
  amount: z.number(),
  type: z.enum(['debit', 'credit']),
  balance: z.number().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

const bulkTransactionSchema = z.object({
  transactions: z.array(bankTransactionSchema),
});

const reconciliationSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  openingBalance: z.number(),
  closingBalance: z.number(),
  statementBalance: z.number(),
  notes: z.string().optional(),
});

const matchTransactionSchema = z.object({
  matchedType: z.enum(['expense', 'bill', 'sale', 'transfer']),
  matchedId: z.string().uuid(),
});

const bankRoutes: FastifyPluginAsync = async (fastify) => {
  // ========================================
  // BANK ACCOUNTS
  // ========================================

  // List bank accounts
  fastify.get('/bank-accounts', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    
    const accounts = await prisma.bankAccount.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            transactions: true,
            reconciliations: true,
          },
        },
      },
      orderBy: { accountName: 'asc' },
    });
    
    return { accounts };
  });

  // Get single bank account
  fastify.get('/bank-accounts/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const account = await prisma.bankAccount.findFirst({
      where: { id, tenantId },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 50,
        },
        reconciliations: {
          orderBy: { periodStart: 'desc' },
          take: 10,
        },
      },
    });
    
    if (!account) {
      return reply.status(404).send({ error: 'Bank account not found' });
    }
    
    return { account };
  });

  // Create bank account
  fastify.post('/bank-accounts', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const data = bankAccountSchema.parse(request.body);
    
    const account = await prisma.bankAccount.create({
      data: {
        ...data,
        tenantId,
      },
    });
    
    return reply.status(201).send({ account });
  });

  // Update bank account
  fastify.put('/bank-accounts/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const data = bankAccountSchema.partial().parse(request.body);
    
    const account = await prisma.bankAccount.findFirst({
      where: { id, tenantId },
    });
    
    if (!account) {
      return reply.status(404).send({ error: 'Bank account not found' });
    }
    
    const updated = await prisma.bankAccount.update({
      where: { id },
      data,
    });
    
    return { account: updated };
  });

  // Delete bank account
  fastify.delete('/bank-accounts/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const account = await prisma.bankAccount.findFirst({
      where: { id, tenantId },
    });
    
    if (!account) {
      return reply.status(404).send({ error: 'Bank account not found' });
    }
    
    // Check if account has transactions
    const txCount = await prisma.bankTransaction.count({ where: { bankAccountId: id } });
    
    if (txCount > 0) {
      return reply.status(400).send({ 
        error: 'Cannot delete bank account with transactions. Mark as inactive instead.' 
      });
    }
    
    await prisma.bankAccount.delete({ where: { id } });
    
    return { success: true };
  });

  // ========================================
  // BANK TRANSACTIONS
  // ========================================

  // List bank transactions
  fastify.get('/bank-accounts/:accountId/transactions', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { accountId } = request.params as { accountId: string };
    const { isMatched, startDate, endDate } = request.query as any;
    
    // Verify account belongs to tenant
    const account = await prisma.bankAccount.findFirst({
      where: { id: accountId, tenantId },
    });
    
    if (!account) {
      return reply.status(404).send({ error: 'Bank account not found' });
    }
    
    const where: any = { bankAccountId: accountId };
    
    if (isMatched !== undefined) {
      where.isMatched = isMatched === 'true';
    }
    
    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    const transactions = await prisma.bankTransaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
    });
    
    return { transactions };
  });

  // Import bank transactions
  fastify.post('/bank-accounts/:accountId/transactions/import', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { accountId } = request.params as { accountId: string };
    const data = bulkTransactionSchema.parse(request.body);
    
    // Verify account belongs to tenant
    const account = await prisma.bankAccount.findFirst({
      where: { id: accountId, tenantId },
    });
    
    if (!account) {
      return reply.status(404).send({ error: 'Bank account not found' });
    }
    
    // Generate import batch ID
    const importBatchId = `IMPORT-${Date.now()}`;
    
    // Create all transactions
    const transactions = await Promise.all(
      data.transactions.map((tx) =>
        prisma.bankTransaction.create({
          data: {
            bankAccountId: accountId,
            transactionDate: new Date(tx.transactionDate),
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
            balance: tx.balance,
            referenceNumber: tx.referenceNumber,
            notes: tx.notes,
            importBatchId,
          },
        })
      )
    );
    
    return reply.status(201).send({ 
      transactions, 
      count: transactions.length,
      importBatchId,
    });
  });

  // Add single transaction
  fastify.post('/bank-accounts/:accountId/transactions', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { accountId } = request.params as { accountId: string };
    const data = bankTransactionSchema.parse(request.body);
    
    // Verify account belongs to tenant
    const account = await prisma.bankAccount.findFirst({
      where: { id: accountId, tenantId },
    });
    
    if (!account) {
      return reply.status(404).send({ error: 'Bank account not found' });
    }
    
    const transaction = await prisma.bankTransaction.create({
      data: {
        bankAccountId: accountId,
        transactionDate: new Date(data.transactionDate),
        description: data.description,
        amount: data.amount,
        type: data.type,
        balance: data.balance,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
      },
    });
    
    return reply.status(201).send({ transaction });
  });

  // Match transaction
  fastify.post('/bank-transactions/:id/match', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const data = matchTransactionSchema.parse(request.body);
    
    // Verify transaction exists and belongs to tenant's account
    const transaction = await prisma.bankTransaction.findFirst({
      where: {
        id,
        bankAccount: {
          tenantId,
        },
      },
    });
    
    if (!transaction) {
      return reply.status(404).send({ error: 'Transaction not found' });
    }
    
    if (transaction.isMatched) {
      return reply.status(400).send({ error: 'Transaction is already matched' });
    }
    
    const updated = await prisma.bankTransaction.update({
      where: { id },
      data: {
        isMatched: true,
        matchedType: data.matchedType,
        matchedId: data.matchedId,
      },
    });
    
    return { transaction: updated };
  });

  // Unmatch transaction
  fastify.post('/bank-transactions/:id/unmatch', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    // Verify transaction exists and belongs to tenant's account
    const transaction = await prisma.bankTransaction.findFirst({
      where: {
        id,
        bankAccount: {
          tenantId,
        },
      },
    });
    
    if (!transaction) {
      return reply.status(404).send({ error: 'Transaction not found' });
    }
    
    const updated = await prisma.bankTransaction.update({
      where: { id },
      data: {
        isMatched: false,
        matchedType: null,
        matchedId: null,
      },
    });
    
    return { transaction: updated };
  });

  // Delete bank transaction
  fastify.delete('/bank-transactions/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    // Verify transaction exists and belongs to tenant's account
    const transaction = await prisma.bankTransaction.findFirst({
      where: {
        id,
        bankAccount: {
          tenantId,
        },
      },
    });
    
    if (!transaction) {
      return reply.status(404).send({ error: 'Transaction not found' });
    }
    
    if (transaction.isMatched) {
      return reply.status(400).send({ error: 'Cannot delete matched transaction. Unmatch first.' });
    }
    
    await prisma.bankTransaction.delete({ where: { id } });
    
    return { success: true };
  });

  // ========================================
  // BANK RECONCILIATIONS
  // ========================================

  // List reconciliations
  fastify.get('/bank-accounts/:accountId/reconciliations', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { accountId } = request.params as { accountId: string };
    
    // Verify account belongs to tenant
    const account = await prisma.bankAccount.findFirst({
      where: { id: accountId, tenantId },
    });
    
    if (!account) {
      return reply.status(404).send({ error: 'Bank account not found' });
    }
    
    const reconciliations = await prisma.bankReconciliation.findMany({
      where: { bankAccountId: accountId },
      orderBy: { periodStart: 'desc' },
    });
    
    return { reconciliations };
  });

  // Get single reconciliation
  fastify.get('/reconciliations/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const reconciliation = await prisma.bankReconciliation.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        bankAccount: true,
      },
    });
    
    if (!reconciliation) {
      return reply.status(404).send({ error: 'Reconciliation not found' });
    }
    
    return { reconciliation };
  });

  // Create reconciliation
  fastify.post('/bank-accounts/:accountId/reconciliations', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId, userId } = request.user as any;
    const { accountId } = request.params as { accountId: string };
    const data = reconciliationSchema.parse(request.body);
    
    // Verify account belongs to tenant
    const account = await prisma.bankAccount.findFirst({
      where: { id: accountId, tenantId },
    });
    
    if (!account) {
      return reply.status(404).send({ error: 'Bank account not found' });
    }
    
    // Generate reconciliation number
    const count = await prisma.bankReconciliation.count({ where: { tenantId } });
    const reconciliationNumber = `RECON-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    // Calculate difference
    const difference = data.closingBalance - data.statementBalance;
    
    const reconciliation = await prisma.bankReconciliation.create({
      data: {
        reconciliationNumber,
        bankAccountId: accountId,
        tenantId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        openingBalance: data.openingBalance,
        closingBalance: data.closingBalance,
        statementBalance: data.statementBalance,
        difference,
        notes: data.notes,
      },
    });
    
    return reply.status(201).send({ reconciliation });
  });

  // Complete reconciliation
  fastify.post('/reconciliations/:id/complete', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId, userId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const reconciliation = await prisma.bankReconciliation.findFirst({
      where: {
        id,
        tenantId,
        status: 'pending',
      },
    });
    
    if (!reconciliation) {
      return reply.status(404).send({ error: 'Reconciliation not found or already completed' });
    }
    
    const updated = await prisma.bankReconciliation.update({
      where: { id },
      data: {
        status: 'completed',
        reconciledBy: userId,
        reconciledAt: new Date(),
      },
    });
    
    return { reconciliation: updated };
  });

  // Get reconciliation statistics
  fastify.get('/bank-accounts/:accountId/stats', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { accountId } = request.params as { accountId: string };
    const { startDate, endDate } = request.query as any;
    
    // Verify account belongs to tenant
    const account = await prisma.bankAccount.findFirst({
      where: { id: accountId, tenantId },
    });
    
    if (!account) {
      return reply.status(404).send({ error: 'Bank account not found' });
    }
    
    const where: any = { bankAccountId: accountId };
    
    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    const [totalTransactions, matchedCount, unmatchedCount, debits, credits] = await Promise.all([
      prisma.bankTransaction.count({ where }),
      prisma.bankTransaction.count({ where: { ...where, isMatched: true } }),
      prisma.bankTransaction.count({ where: { ...where, isMatched: false } }),
      prisma.bankTransaction.aggregate({
        where: { ...where, type: 'debit' },
        _sum: { amount: true },
      }),
      prisma.bankTransaction.aggregate({
        where: { ...where, type: 'credit' },
        _sum: { amount: true },
      }),
    ]);
    
    return {
      totalTransactions,
      matchedCount,
      unmatchedCount,
      matchedPercentage: totalTransactions > 0 ? (matchedCount / totalTransactions) * 100 : 0,
      totalDebits: Math.abs(debits._sum.amount || 0),
      totalCredits: credits._sum.amount || 0,
      netFlow: (credits._sum.amount || 0) - Math.abs(debits._sum.amount || 0),
    };
  });
};

export default bankRoutes;
