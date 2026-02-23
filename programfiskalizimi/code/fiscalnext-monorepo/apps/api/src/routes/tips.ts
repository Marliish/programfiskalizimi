// Tips & Service Charge Routes
// Built by: Tafa (Backend Developer)

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fiscalnext/database';

// Validation Schemas
const createTipSchema = z.object({
  orderId: z.string(),
  userId: z.string(), // Server who received the tip
  amount: z.number().positive(),
  tipType: z.enum(['cash', 'card', 'pooled']).default('card'),
  paymentMethod: z.string().optional(),
  isPooled: z.boolean().default(false),
});

const distributeTipsSchema = z.object({
  tipIds: z.array(z.string()),
  distributions: z.array(z.object({
    userId: z.string(),
    percentage: z.number().min(0).max(100),
  })),
});

const createServiceChargeRuleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  chargeType: z.enum(['percentage', 'fixed']),
  percentage: z.number().optional(),
  fixedAmount: z.number().optional(),
  minGuestCount: z.number().optional(),
  minOrderAmount: z.number().optional(),
  timeRules: z.any().optional(),
  locationId: z.string().optional(),
});

export async function tipsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // ============================================
  // TIPS
  // ============================================

  // Create tip
  fastify.post<{ Body: z.infer<typeof createTipSchema> }>('/tips', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const data = createTipSchema.parse(request.body);

      // Verify order exists
      const order = await prisma.order.findFirst({
        where: {
          id: data.orderId,
          tenantId: decoded.tenantId,
        },
      });

      if (!order) {
        return reply.status(404).send({
          success: false,
          error: 'Order not found',
        });
      }

      // Create tip
      const tip = await prisma.tip.create({
        data: {
          tenantId: decoded.tenantId,
          orderId: data.orderId,
          userId: data.userId,
          amount: data.amount,
          tipType: data.tipType,
          paymentMethod: data.paymentMethod,
          isPooled: data.isPooled,
          pooledAmount: data.isPooled ? data.amount : 0,
        },
      });

      // Update order tip amount
      await prisma.order.update({
        where: { id: data.orderId },
        data: {
          tipAmount: {
            increment: data.amount,
          },
          total: {
            increment: data.amount,
          },
        },
      });

      return { success: true, tip };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tip',
      });
    }
  });

  // Get tips (with filters)
  fastify.get('/tips', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { userId, fromDate, toDate, tipType } = request.query as any;

      const where: any = {
        tenantId: decoded.tenantId,
      };

      if (userId) {
        where.userId = userId;
      }

      if (tipType) {
        where.tipType = tipType;
      }

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = new Date(fromDate);
        if (toDate) where.createdAt.lte = new Date(toDate);
      }

      const tips = await prisma.tip.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
              table: {
                select: {
                  tableNumber: true,
                },
              },
            },
          },
          distributions: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, tips };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch tips',
      });
    }
  });

  // Distribute pooled tips
  fastify.post<{ Body: z.infer<typeof distributeTipsSchema> }>('/tips/distribute', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { tipIds, distributions } = distributeTipsSchema.parse(request.body);

      // Validate percentages add up to 100
      const totalPercentage = distributions.reduce((sum, d) => sum + d.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return reply.status(400).send({
          success: false,
          error: 'Distribution percentages must add up to 100%',
        });
      }

      // Get tips
      const tips = await prisma.tip.findMany({
        where: {
          id: { in: tipIds },
          tenantId: decoded.tenantId,
          isPooled: true,
        },
      });

      if (tips.length !== tipIds.length) {
        return reply.status(400).send({
          success: false,
          error: 'Some tips not found or not pooled',
        });
      }

      const totalPooledAmount = tips.reduce((sum, tip) => sum + Number(tip.pooledAmount), 0);

      // Create distributions
      const distributionRecords = [];

      for (const dist of distributions) {
        const amount = (totalPooledAmount * dist.percentage) / 100;

        for (const tip of tips) {
          const tipAmount = (Number(tip.pooledAmount) * dist.percentage) / 100;

          distributionRecords.push({
            tipId: tip.id,
            userId: dist.userId,
            amount: tipAmount,
            percentage: dist.percentage,
          });
        }
      }

      // Batch create distributions
      await prisma.tipDistribution.createMany({
        data: distributionRecords,
      });

      return {
        success: true,
        distributed: totalPooledAmount,
        recipients: distributions.length,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to distribute tips',
      });
    }
  });

  // Get tip stats by user
  fastify.get('/tips/stats', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { userId, fromDate, toDate } = request.query as any;

      const where: any = {
        tenantId: decoded.tenantId,
      };

      if (userId) {
        where.userId = userId;
      }

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = new Date(fromDate);
        if (toDate) where.createdAt.lte = new Date(toDate);
      }

      // Direct tips
      const directTips = await prisma.tip.aggregate({
        where: {
          ...where,
          isPooled: false,
        },
        _sum: { amount: true },
        _count: true,
      });

      // Distributed tips (from pooling)
      const distributedTips = await prisma.tipDistribution.aggregate({
        where: {
          userId: userId || undefined,
          createdAt: fromDate || toDate ? {
            gte: fromDate ? new Date(fromDate) : undefined,
            lte: toDate ? new Date(toDate) : undefined,
          } : undefined,
        },
        _sum: { amount: true },
        _count: true,
      });

      const totalTips = (directTips._sum.amount || 0) + (distributedTips._sum.amount || 0);
      const totalCount = (directTips._count || 0) + (distributedTips._count || 0);

      return {
        success: true,
        stats: {
          totalTips: Number(totalTips).toFixed(2),
          totalCount,
          directTips: Number(directTips._sum.amount || 0).toFixed(2),
          distributedTips: Number(distributedTips._sum.amount || 0).toFixed(2),
          averageTip: totalCount > 0 ? (Number(totalTips) / totalCount).toFixed(2) : '0.00',
        },
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch tip stats',
      });
    }
  });

  // ============================================
  // SERVICE CHARGE RULES
  // ============================================

  // List service charge rules
  fastify.get('/service-charges', async (request, reply) => {
    try {
      const decoded = request.user as any;

      const rules = await prisma.serviceChargeRule.findMany({
        where: {
          tenantId: decoded.tenantId,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, rules };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch service charge rules',
      });
    }
  });

  // Create service charge rule
  fastify.post<{ Body: z.infer<typeof createServiceChargeRuleSchema> }>('/service-charges', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const data = createServiceChargeRuleSchema.parse(request.body);

      // Validate charge type and amount
      if (data.chargeType === 'percentage' && !data.percentage) {
        return reply.status(400).send({
          success: false,
          error: 'Percentage is required for percentage-based charges',
        });
      }

      if (data.chargeType === 'fixed' && !data.fixedAmount) {
        return reply.status(400).send({
          success: false,
          error: 'Fixed amount is required for fixed charges',
        });
      }

      const rule = await prisma.serviceChargeRule.create({
        data: {
          ...data,
          tenantId: decoded.tenantId,
        },
      });

      return { success: true, rule };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to create service charge rule',
      });
    }
  });

  // Update service charge rule
  fastify.put<{ Params: { id: string }; Body: Partial<z.infer<typeof createServiceChargeRuleSchema>> }>('/service-charges/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const data = request.body;

      const rule = await prisma.serviceChargeRule.update({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        data,
      });

      return { success: true, rule };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to update service charge rule',
      });
    }
  });

  // Delete service charge rule
  fastify.delete<{ Params: { id: string } }>('/service-charges/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;

      const rule = await prisma.serviceChargeRule.update({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        data: { isActive: false },
      });

      return { success: true, rule };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to delete service charge rule',
      });
    }
  });

  // Calculate service charge for order
  fastify.post<{ Body: { orderId: string } }>('/service-charges/calculate', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { orderId } = request.body;

      // Get order
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          tenantId: decoded.tenantId,
        },
        include: {
          location: true,
        },
      });

      if (!order) {
        return reply.status(404).send({
          success: false,
          error: 'Order not found',
        });
      }

      // Get applicable rules
      const rules = await prisma.serviceChargeRule.findMany({
        where: {
          tenantId: decoded.tenantId,
          isActive: true,
          OR: [
            { locationId: null },
            { locationId: order.locationId },
          ],
        },
      });

      // Find matching rule
      let applicableRule = null;
      let serviceCharge = 0;

      for (const rule of rules) {
        // Check guest count
        if (rule.minGuestCount && order.guestCount < rule.minGuestCount) {
          continue;
        }

        // Check order amount
        if (rule.minOrderAmount && order.subtotal < rule.minOrderAmount) {
          continue;
        }

        // Check time rules (simplified - you'd implement full time matching)
        // For now, assume all rules match time-wise

        // Calculate charge
        if (rule.chargeType === 'percentage') {
          serviceCharge = (Number(order.subtotal) * Number(rule.percentage!)) / 100;
        } else {
          serviceCharge = Number(rule.fixedAmount!);
        }

        applicableRule = rule;
        break;
      }

      return {
        success: true,
        serviceCharge: serviceCharge.toFixed(2),
        rule: applicableRule,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to calculate service charge',
      });
    }
  });
}
