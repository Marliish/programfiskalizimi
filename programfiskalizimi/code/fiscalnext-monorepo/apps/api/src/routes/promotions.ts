// Promotions & Discounts Routes
// Created: 2026-02-23 - Day 6

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { promotionService } from '../services/promotion.service';
import { auditService } from '../services/audit.service';
import {
  createPromotionSchema,
  updatePromotionSchema,
  createDiscountCodeSchema,
  updateDiscountCodeSchema,
  validateDiscountCodeSchema,
  applyDiscountCodeSchema,
} from '../schemas/promotion.schema';
import { validateRequest } from '../middleware/validate';

export async function promotionRoutes(server: FastifyInstance) {
  // Create promotion
  server.post(
    '/promotions',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const data = validateRequest(createPromotionSchema, request.body);
        const promotion = await promotionService.createPromotion(tenantId, data);

        await auditService.logCreate(tenantId, userId, 'promotion',
          Array.isArray(promotion) && promotion[0] ? promotion[0].id : null,
          promotion, request);

        reply.code(201).send({
          success: true,
          data: Array.isArray(promotion) && promotion[0] ? promotion[0] : promotion,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get all promotions
  server.get(
    '/promotions',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { activeOnly } = request.query as any;

        const promotions = await promotionService.getPromotions(
          tenantId,
          activeOnly !== 'false'
        );

        reply.send({
          success: true,
          data: promotions,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get active promotions (currently running)
  server.get(
    '/promotions/active',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;

        const promotions = await promotionService.getPromotions(tenantId, true);

        reply.send({
          success: true,
          data: promotions,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get promotion by ID
  server.get(
    '/promotions/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { id } = request.params as any;

        const promotion = await promotionService.getPromotionById(tenantId, id);

        if (!promotion) {
          return reply.code(404).send({
            success: false,
            error: 'Promotion not found',
          });
        }

        reply.send({
          success: true,
          data: promotion,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Update promotion
  server.put(
    '/promotions/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;
        const { id } = request.params as any;

        const before = await promotionService.getPromotionById(tenantId, id);
        const data = validateRequest(updatePromotionSchema, request.body);
        const promotion = await promotionService.updatePromotion(tenantId, id, data);

        await auditService.logUpdate(tenantId, userId, 'promotion', id, before, promotion, request);

        reply.send({
          success: true,
          data: Array.isArray(promotion) && promotion[0] ? promotion[0] : promotion,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Delete promotion
  server.delete(
    '/promotions/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;
        const { id } = request.params as any;

        const before = await promotionService.getPromotionById(tenantId, id);
        const promotion = await promotionService.deletePromotion(tenantId, id);

        await auditService.logDelete(tenantId, userId, 'promotion', id, before, request);

        reply.send({
          success: true,
          data: Array.isArray(promotion) && promotion[0] ? promotion[0] : promotion,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Create discount code
  server.post(
    '/discount-codes',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const data = validateRequest(createDiscountCodeSchema, request.body);
        const code = await promotionService.createDiscountCode(tenantId, data);

        await auditService.logCreate(tenantId, userId, 'discount_code',
          Array.isArray(code) && code[0] ? code[0].id : null,
          code, request);

        reply.code(201).send({
          success: true,
          data: Array.isArray(code) && code[0] ? code[0] : code,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get all discount codes
  server.get(
    '/discount-codes',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { activeOnly } = request.query as any;

        const codes = await promotionService.getDiscountCodes(
          tenantId,
          activeOnly !== 'false'
        );

        reply.send({
          success: true,
          data: codes,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Validate discount code
  server.post(
    '/discount-codes/validate',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;

        const data = validateRequest(validateDiscountCodeSchema, request.body);
        const result = await promotionService.validateDiscountCode(tenantId, data);

        reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Apply discount code
  server.post(
    '/discount-codes/apply',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const data = validateRequest(applyDiscountCodeSchema, request.body);
        const usage = await promotionService.applyDiscountCode(tenantId, data);

        await auditService.logCreate(tenantId, userId, 'discount_code_use',
          Array.isArray(usage) && usage[0] ? usage[0].id : null,
          usage, request);

        reply.code(201).send({
          success: true,
          data: Array.isArray(usage) && usage[0] ? usage[0] : usage,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Update discount code
  server.put(
    '/discount-codes/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;
        const { id } = request.params as any;

        const data = validateRequest(updateDiscountCodeSchema, request.body);
        const code = await promotionService.updateDiscountCode(tenantId, id, data);

        await auditService.logUpdate(tenantId, userId, 'discount_code', id, {}, code, request);

        reply.send({
          success: true,
          data: Array.isArray(code) && code[0] ? code[0] : code,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Delete discount code
  server.delete(
    '/discount-codes/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;
        const { id } = request.params as any;

        const code = await promotionService.deleteDiscountCode(tenantId, id);

        await auditService.logDelete(tenantId, userId, 'discount_code', id, code, request);

        reply.send({
          success: true,
          data: Array.isArray(code) && code[0] ? code[0] : code,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );
}
