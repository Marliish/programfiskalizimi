// Advanced Pricing Routes - 7 Features
// Team: Tafa (Backend)
// Date: 2026-02-23

import { FastifyInstance } from 'fastify';
import { prisma } from '@fiscalnext/database';

export async function advancedPricingRoutes(fastify: FastifyInstance) {
  // 1. Create price schedule (time-based pricing)
  fastify.post('/price-schedules', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const {
        name,
        description,
        scheduleType,
        timeRules,
        adjustmentType,
        adjustmentValue,
        appliesTo,
        applicableItems,
        priority
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const schedule = await prisma.priceSchedule.create({
          data: {
            tenantId,
            name,
            description,
            scheduleType,
            timeRules,
            adjustmentType,
            adjustmentValue,
            appliesTo,
            applicableItems,
            priority: priority || 0,
            isActive: true
          }
        });

        return reply.status(201).send(schedule);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to create price schedule' });
      }
    }
  });

  // 2. Get active price schedules
  fastify.get('/price-schedules', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;
      const { isActive } = request.query as any;

      try {
        const schedules = await prisma.priceSchedule.findMany({
          where: {
            tenantId,
            ...(isActive !== undefined ? { isActive: isActive === 'true' } : {})
          },
          orderBy: [
            { priority: 'desc' },
            { name: 'asc' }
          ]
        });

        return reply.send(schedules);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch price schedules' });
      }
    }
  });

  // 3. Calculate price with schedule
  fastify.post('/price-schedules/calculate', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { productId, basePrice, datetime } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const checkTime = datetime ? new Date(datetime) : new Date();
        
        // Get applicable schedules
        const schedules = await prisma.priceSchedule.findMany({
          where: {
            tenantId,
            isActive: true
          },
          orderBy: { priority: 'desc' }
        });

        let finalPrice = basePrice;
        let appliedSchedule = null;

        for (const schedule of schedules) {
          // Check if schedule applies to this product
          if (schedule.appliesTo === 'products') {
            const applicableItems = schedule.applicableItems as any;
            if (!applicableItems || !applicableItems.includes(productId)) {
              continue;
            }
          }

          // Check time rules
          const timeRules = schedule.timeRules as any;
          let matches = false;

          if (schedule.scheduleType === 'time_of_day') {
            const currentHour = checkTime.getHours();
            const currentMinute = checkTime.getMinutes();
            const currentTime = currentHour * 60 + currentMinute;
            
            if (timeRules.startTime && timeRules.endTime) {
              const [startHour, startMin] = timeRules.startTime.split(':').map(Number);
              const [endHour, endMin] = timeRules.endTime.split(':').map(Number);
              const startTime = startHour * 60 + startMin;
              const endTime = endHour * 60 + endMin;
              
              matches = currentTime >= startTime && currentTime <= endTime;
            }
          } else if (schedule.scheduleType === 'day_of_week') {
            const currentDay = checkTime.getDay(); // 0 = Sunday
            matches = timeRules.days && timeRules.days.includes(currentDay);
          } else if (schedule.scheduleType === 'date_range') {
            const startDate = new Date(timeRules.startDate);
            const endDate = new Date(timeRules.endDate);
            matches = checkTime >= startDate && checkTime <= endDate;
          }

          if (matches) {
            // Apply adjustment
            if (schedule.adjustmentType === 'percentage') {
              finalPrice = basePrice * (1 + parseFloat(schedule.adjustmentValue.toString()) / 100);
            } else {
              finalPrice = basePrice + parseFloat(schedule.adjustmentValue.toString());
            }
            appliedSchedule = schedule;
            break; // Use highest priority matching schedule
          }
        }

        return reply.send({
          basePrice,
          finalPrice,
          appliedSchedule: appliedSchedule ? {
            id: appliedSchedule.id,
            name: appliedSchedule.name,
            adjustmentType: appliedSchedule.adjustmentType,
            adjustmentValue: appliedSchedule.adjustmentValue
          } : null
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to calculate price' });
      }
    }
  });

  // 4. Set customer-specific price
  fastify.post('/customer-specific-prices', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const {
        customerId,
        productId,
        specialPrice,
        validFrom,
        validUntil,
        notes
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        // Check if already exists
        const existing = await prisma.customerSpecificPrice.findFirst({
          where: {
            customerId,
            productId,
            tenantId
          }
        });

        let price;
        if (existing) {
          price = await prisma.customerSpecificPrice.update({
            where: { id: existing.id },
            data: {
              specialPrice,
              validFrom: validFrom ? new Date(validFrom) : null,
              validUntil: validUntil ? new Date(validUntil) : null,
              notes,
              isActive: true
            }
          });
        } else {
          price = await prisma.customerSpecificPrice.create({
            data: {
              tenantId,
              customerId,
              productId,
              specialPrice,
              validFrom: validFrom ? new Date(validFrom) : null,
              validUntil: validUntil ? new Date(validUntil) : null,
              notes,
              isActive: true
            }
          });
        }

        return reply.status(existing ? 200 : 201).send(price);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to set customer-specific price' });
      }
    }
  });

  // 5. Get customer-specific prices
  fastify.get('/customer-specific-prices', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;
      const { customerId, productId } = request.query as any;

      try {
        const prices = await prisma.customerSpecificPrice.findMany({
          where: {
            tenantId,
            ...(customerId ? { customerId } : {}),
            ...(productId ? { productId } : {}),
            isActive: true
          },
          include: {
            customer: true,
            product: true
          }
        });

        return reply.send(prices);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch customer-specific prices' });
      }
    }
  });

  // 6. Create volume pricing rule
  fastify.post('/volume-pricing-rules', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const {
        name,
        productId,
        categoryId,
        quantityTiers,
        appliesTo
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        // Validate quantity tiers structure
        if (!Array.isArray(quantityTiers) || quantityTiers.length === 0) {
          return reply.status(400).send({ error: 'Invalid quantity tiers' });
        }

        const rule = await prisma.volumePricingRule.create({
          data: {
            tenantId,
            name,
            productId,
            categoryId,
            quantityTiers,
            appliesTo,
            isActive: true
          }
        });

        return reply.status(201).send(rule);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to create volume pricing rule' });
      }
    }
  });

  // 7. Calculate volume pricing
  fastify.post('/volume-pricing-rules/calculate', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { productId, quantity, basePrice } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        // Get applicable rules
        const rules = await prisma.volumePricingRule.findMany({
          where: {
            tenantId,
            isActive: true,
            OR: [
              { productId },
              { appliesTo: 'all' }
            ]
          }
        });

        let finalPrice = basePrice;
        let appliedRule = null;

        for (const rule of rules) {
          const tiers = rule.quantityTiers as any[];
          
          // Find matching tier
          for (const tier of tiers) {
            const minQty = tier.min || 0;
            const maxQty = tier.max || Infinity;
            
            if (quantity >= minQty && quantity <= maxQty) {
              finalPrice = tier.price;
              appliedRule = {
                id: rule.id,
                name: rule.name,
                tier
              };
              break;
            }
          }
          
          if (appliedRule) break;
        }

        return reply.send({
          quantity,
          basePrice,
          finalPrice,
          totalPrice: finalPrice * quantity,
          discount: (basePrice - finalPrice) * quantity,
          appliedRule
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to calculate volume pricing' });
      }
    }
  });

  // 8. Record price override
  fastify.post('/price-overrides', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const {
        transactionItemId,
        originalPrice,
        overridePrice,
        reason
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;
      const userId = (request.user as any).userId;

      try {
        const override = await prisma.priceOverride.create({
          data: {
            tenantId,
            transactionItemId,
            originalPrice,
            overridePrice,
            reason,
            authorizedBy: userId
          }
        });

        return reply.status(201).send(override);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to record price override' });
      }
    }
  });

  // 9. Get price overrides
  fastify.get('/price-overrides', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;
      const { startDate, endDate, authorizedBy } = request.query as any;

      try {
        const overrides = await prisma.priceOverride.findMany({
          where: {
            tenantId,
            ...(authorizedBy ? { authorizedBy } : {}),
            ...(startDate && endDate ? {
              authorizedAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : {})
          },
          orderBy: { authorizedAt: 'desc' }
        });

        return reply.send(overrides);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch price overrides' });
      }
    }
  });

  // 10. Track price history
  fastify.post('/price-history', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const {
        productId,
        oldPrice,
        newPrice,
        changeType,
        notes
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;
      const userId = (request.user as any).userId;

      try {
        const history = await prisma.priceHistory.create({
          data: {
            tenantId,
            productId,
            oldPrice,
            newPrice,
            changeType,
            notes,
            changedBy: userId
          }
        });

        return reply.status(201).send(history);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to record price history' });
      }
    }
  });

  // 11. Get price history
  fastify.get('/price-history/:productId', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { productId } = request.params as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const history = await prisma.priceHistory.findMany({
          where: {
            productId,
            tenantId
          },
          orderBy: { changedAt: 'desc' }
        });

        return reply.send(history);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch price history' });
      }
    }
  });

  // 12. Get comprehensive pricing for product
  fastify.get('/products/:productId/pricing', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { productId } = request.params as any;
      const { customerId } = request.query as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const product = await prisma.product.findUnique({
          where: { id: productId }
        });

        if (!product || product.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Product not found' });
        }

        const basePrice = parseFloat(product.sellingPrice.toString());

        // Get customer-specific price
        let customerPrice = null;
        if (customerId) {
          customerPrice = await prisma.customerSpecificPrice.findFirst({
            where: {
              customerId,
              productId,
              tenantId,
              isActive: true
            }
          });
        }

        // Get volume pricing rules
        const volumeRules = await prisma.volumePricingRule.findMany({
          where: {
            tenantId,
            productId,
            isActive: true
          }
        });

        // Get active price schedules
        const schedules = await prisma.priceSchedule.findMany({
          where: {
            tenantId,
            isActive: true
          }
        });

        // Get price history
        const history = await prisma.priceHistory.findMany({
          where: {
            productId,
            tenantId
          },
          orderBy: { changedAt: 'desc' },
          take: 10
        });

        return reply.send({
          product: {
            id: product.id,
            name: product.name,
            basePrice
          },
          customerSpecificPrice: customerPrice ? parseFloat(customerPrice.specialPrice.toString()) : null,
          volumePricingRules: volumeRules.map(rule => ({
            id: rule.id,
            name: rule.name,
            tiers: rule.quantityTiers
          })),
          priceSchedules: schedules.length,
          recentPriceChanges: history
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch product pricing' });
      }
    }
  });
}
