// Gift Cards & Vouchers Routes - 8 Features
// Team: Tafa (Backend)
// Date: 2026-02-23

import { FastifyInstance } from 'fastify';
import { prisma } from '@fiscalnext/database';
import { randomBytes } from 'crypto';

export async function giftCardsVouchersRoutes(fastify: FastifyInstance) {
  // 1. Issue gift card
  fastify.post('/gift-cards', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const {
        initialBalance,
        cardType,
        expiryDate,
        recipientName,
        recipientEmail,
        recipientPhone,
        purchasedByCustomerId,
        notes
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        // Generate unique card number
        const cardNumber = `GC${Date.now()}${randomBytes(4).toString('hex').toUpperCase()}`;
        const pinCode = Math.floor(1000 + Math.random() * 9000).toString();

        const giftCard = await prisma.giftCard.create({
          data: {
            tenantId,
            cardNumber,
            pinCode,
            initialBalance,
            currentBalance: initialBalance,
            cardType,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            recipientName,
            recipientEmail,
            recipientPhone,
            purchasedByCustomerId,
            purchasedAt: new Date(),
            notes,
            status: 'active'
          }
        });

        return reply.status(201).send(giftCard);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to issue gift card' });
      }
    }
  });

  // 2. Check gift card balance
  fastify.get('/gift-cards/:cardNumber/balance', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { cardNumber } = request.params as any;
      const { pinCode } = request.query as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const giftCard = await prisma.giftCard.findFirst({
          where: {
            cardNumber,
            tenantId
          }
        });

        if (!giftCard) {
          return reply.status(404).send({ error: 'Gift card not found' });
        }

        // Verify PIN if provided
        if (pinCode && giftCard.pinCode !== pinCode) {
          return reply.status(401).send({ error: 'Invalid PIN code' });
        }

        // Check if expired
        if (giftCard.expiryDate && new Date(giftCard.expiryDate) < new Date()) {
          return reply.status(400).send({
            error: 'Gift card has expired',
            expiryDate: giftCard.expiryDate
          });
        }

        return reply.send({
          cardNumber: giftCard.cardNumber,
          currentBalance: giftCard.currentBalance,
          status: giftCard.status,
          expiryDate: giftCard.expiryDate
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to check gift card balance' });
      }
    }
  });

  // 3. Redeem gift card
  fastify.post('/gift-cards/:cardNumber/redeem', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { cardNumber } = request.params as any;
      const { amount, pinCode, posTransactionId } = request.body as any;
      const tenantId = (request.user as any).tenantId;
      const userId = (request.user as any).userId;

      try {
        const giftCard = await prisma.giftCard.findFirst({
          where: {
            cardNumber,
            tenantId,
            status: 'active'
          }
        });

        if (!giftCard) {
          return reply.status(404).send({ error: 'Gift card not found or inactive' });
        }

        // Verify PIN
        if (giftCard.pinCode && giftCard.pinCode !== pinCode) {
          return reply.status(401).send({ error: 'Invalid PIN code' });
        }

        // Check expiry
        if (giftCard.expiryDate && new Date(giftCard.expiryDate) < new Date()) {
          await prisma.giftCard.update({
            where: { id: giftCard.id },
            data: { status: 'expired' }
          });
          return reply.status(400).send({ error: 'Gift card has expired' });
        }

        // Check sufficient balance
        const currentBalance = parseFloat(giftCard.currentBalance.toString());
        if (currentBalance < amount) {
          return reply.status(400).send({
            error: 'Insufficient balance',
            availableBalance: currentBalance
          });
        }

        const newBalance = currentBalance - amount;

        // Create transaction record
        const transaction = await prisma.giftCardTransaction.create({
          data: {
            giftCardId: giftCard.id,
            tenantId,
            transactionType: 'redemption',
            amount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            posTransactionId,
            processedBy: userId
          }
        });

        // Update gift card balance
        await prisma.giftCard.update({
          where: { id: giftCard.id },
          data: {
            currentBalance: newBalance,
            status: newBalance === 0 ? 'redeemed' : 'active'
          }
        });

        return reply.send({
          transaction,
          newBalance
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to redeem gift card' });
      }
    }
  });

  // 4. Reload gift card
  fastify.post('/gift-cards/:cardNumber/reload', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { cardNumber } = request.params as any;
      const { amount, pinCode } = request.body as any;
      const tenantId = (request.user as any).tenantId;
      const userId = (request.user as any).userId;

      try {
        const giftCard = await prisma.giftCard.findFirst({
          where: {
            cardNumber,
            tenantId
          }
        });

        if (!giftCard) {
          return reply.status(404).send({ error: 'Gift card not found' });
        }

        // Verify PIN
        if (giftCard.pinCode && giftCard.pinCode !== pinCode) {
          return reply.status(401).send({ error: 'Invalid PIN code' });
        }

        const currentBalance = parseFloat(giftCard.currentBalance.toString());
        const newBalance = currentBalance + amount;

        // Create transaction record
        const transaction = await prisma.giftCardTransaction.create({
          data: {
            giftCardId: giftCard.id,
            tenantId,
            transactionType: 'reload',
            amount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            processedBy: userId
          }
        });

        // Update gift card
        await prisma.giftCard.update({
          where: { id: giftCard.id },
          data: {
            currentBalance: newBalance,
            status: 'active'
          }
        });

        return reply.send({
          transaction,
          newBalance
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to reload gift card' });
      }
    }
  });

  // 5. Bulk generate gift cards
  fastify.post('/gift-cards/bulk-generate', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { count, initialBalance, cardType, expiryDate } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        if (count > 100) {
          return reply.status(400).send({ error: 'Cannot generate more than 100 cards at once' });
        }

        const giftCards = [];

        for (let i = 0; i < count; i++) {
          const cardNumber = `GC${Date.now()}${randomBytes(4).toString('hex').toUpperCase()}${i}`;
          const pinCode = Math.floor(1000 + Math.random() * 9000).toString();

          const giftCard = await prisma.giftCard.create({
            data: {
              tenantId,
              cardNumber,
              pinCode,
              initialBalance,
              currentBalance: initialBalance,
              cardType,
              expiryDate: expiryDate ? new Date(expiryDate) : null,
              status: 'active'
            }
          });

          giftCards.push(giftCard);
        }

        return reply.status(201).send({
          count: giftCards.length,
          giftCards
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to generate gift cards' });
      }
    }
  });

  // 6. Get gift card reports
  fastify.get('/gift-cards/reports', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;
      const { startDate, endDate } = request.query as any;

      try {
        const cards = await prisma.giftCard.findMany({
          where: {
            tenantId,
            ...(startDate && endDate ? {
              issuedDate: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : {})
          },
          include: {
            transactions: true
          }
        });

        const stats = {
          totalIssued: cards.length,
          totalValue: cards.reduce((sum, card: any) =>
            sum + parseFloat(card.initialBalance.toString()), 0),
          totalRedeemed: cards.reduce((sum, card: any) =>
            sum + parseFloat(card.initialBalance.toString()) -
            parseFloat(card.currentBalance.toString()), 0),
          remainingBalance: cards.reduce((sum, card: any) =>
            sum + parseFloat(card.currentBalance.toString()), 0),
          byStatus: {
            active: cards.filter(c => c.status === 'active').length,
            redeemed: cards.filter(c => c.status === 'redeemed').length,
            expired: cards.filter(c => c.status === 'expired').length,
            cancelled: cards.filter(c => c.status === 'cancelled').length
          }
        };

        return reply.send(stats);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch gift card reports' });
      }
    }
  });

  // 7. Create voucher
  fastify.post('/vouchers', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const {
        code,
        name,
        description,
        discountType,
        discountValue,
        minPurchaseAmount,
        maxDiscountAmount,
        applicableTo,
        applicableItems,
        usageLimit,
        usagePerCustomer,
        validFrom,
        validUntil
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        // Check if code already exists
        const existing = await prisma.voucher.findFirst({
          where: { code }
        });

        if (existing) {
          return reply.status(400).send({ error: 'Voucher code already exists' });
        }

        const voucher = await prisma.voucher.create({
          data: {
            tenantId,
            code,
            name,
            description,
            discountType,
            discountValue,
            minPurchaseAmount: minPurchaseAmount || 0,
            maxDiscountAmount,
            applicableTo,
            applicableItems,
            usageLimit,
            usagePerCustomer,
            validFrom: validFrom ? new Date(validFrom) : null,
            validUntil: validUntil ? new Date(validUntil) : null,
            status: 'active'
          }
        });

        return reply.status(201).send(voucher);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to create voucher' });
      }
    }
  });

  // 8. Validate and apply voucher
  fastify.post('/vouchers/:code/validate', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { code } = request.params as any;
      const { customerId, transactionTotal, items } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const voucher = await prisma.voucher.findFirst({
          where: {
            code,
            tenantId,
            status: 'active'
          },
          include: {
            redemptions: {
              where: { customerId }
            }
          }
        });

        if (!voucher) {
          return reply.status(404).send({ error: 'Voucher not found or inactive' });
        }

        // Check validity dates
        const now = new Date();
        if (voucher.validFrom && new Date(voucher.validFrom) > now) {
          return reply.status(400).send({ error: 'Voucher not yet valid' });
        }
        if (voucher.validUntil && new Date(voucher.validUntil) < now) {
          await prisma.voucher.update({
            where: { id: voucher.id },
            data: { status: 'expired' }
          });
          return reply.status(400).send({ error: 'Voucher has expired' });
        }

        // Check usage limits
        if (voucher.usageLimit && voucher.timesUsed >= voucher.usageLimit) {
          return reply.status(400).send({ error: 'Voucher usage limit reached' });
        }

        // Check per-customer usage
        if (voucher.usagePerCustomer && voucher.redemptions.length >= voucher.usagePerCustomer) {
          return reply.status(400).send({ error: 'You have already used this voucher' });
        }

        // Check minimum purchase amount
        if (parseFloat(voucher.minPurchaseAmount.toString()) > transactionTotal) {
          return reply.status(400).send({
            error: `Minimum purchase amount is ${voucher.minPurchaseAmount}`
          });
        }

        // Calculate discount
        let discountAmount = 0;
        if (voucher.discountType === 'percentage') {
          discountAmount = (transactionTotal * parseFloat(voucher.discountValue.toString())) / 100;
        } else {
          discountAmount = parseFloat(voucher.discountValue.toString());
        }

        // Apply max discount limit
        if (voucher.maxDiscountAmount) {
          const maxDiscount = parseFloat(voucher.maxDiscountAmount.toString());
          if (discountAmount > maxDiscount) {
            discountAmount = maxDiscount;
          }
        }

        return reply.send({
          valid: true,
          voucher: {
            code: voucher.code,
            name: voucher.name,
            description: voucher.description
          },
          discountAmount,
          finalTotal: transactionTotal - discountAmount
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to validate voucher' });
      }
    }
  });

  // Additional endpoints
  fastify.get('/vouchers', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;
      
      try {
        const vouchers = await prisma.voucher.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' }
        });
        
        return reply.send(vouchers);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch vouchers' });
      }
    }
  });

  fastify.get('/gift-cards', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;
      const { status } = request.query as any;
      
      try {
        const giftCards = await prisma.giftCard.findMany({
          where: {
            tenantId,
            ...(status ? { status } : {})
          },
          orderBy: { createdAt: 'desc' }
        });
        
        return reply.send(giftCards);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch gift cards' });
      }
    }
  });
}
