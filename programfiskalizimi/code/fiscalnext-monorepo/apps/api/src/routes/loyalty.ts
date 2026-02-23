// Loyalty Program Routes
// Created: 2026-02-23 - Day 6

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { loyaltyService } from '../services/loyalty.service';
import { auditService } from '../services/audit.service';
import {
  earnPointsSchema,
  redeemPointsSchema,
  createRewardSchema,
  updateRewardSchema,
  redeemRewardSchema,
} from '../schemas/loyalty.schema';
import { validateRequest } from '../middleware/validate';

export async function loyaltyRoutes(server: FastifyInstance) {
  // Earn points
  server.post(
    '/loyalty/points/earn',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const data = validateRequest(earnPointsSchema, request.body);
        const transaction = await loyaltyService.earnPoints(tenantId, data);

        await auditService.logCreate(tenantId, userId, 'loyalty_transaction',
          Array.isArray(transaction) && transaction[0] ? transaction[0].id : null,
          transaction, request);

        reply.code(201).send({
          success: true,
          data: Array.isArray(transaction) && transaction[0] ? transaction[0] : transaction,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Redeem points
  server.post(
    '/loyalty/points/redeem',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const data = validateRequest(redeemPointsSchema, request.body);
        const transaction = await loyaltyService.redeemPoints(tenantId, data);

        await auditService.logCreate(tenantId, userId, 'loyalty_transaction',
          Array.isArray(transaction) && transaction[0] ? transaction[0].id : null,
          transaction, request);

        reply.code(201).send({
          success: true,
          data: Array.isArray(transaction) && transaction[0] ? transaction[0] : transaction,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get customer loyalty balance
  server.get(
    '/loyalty/customers/:customerId/balance',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { customerId } = request.params as any;

        const balance = await loyaltyService.getCustomerBalance(tenantId, customerId);

        if (!balance) {
          return reply.code(404).send({
            success: false,
            error: 'Customer not found',
          });
        }

        reply.send({
          success: true,
          data: balance,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get loyalty transactions
  server.get(
    '/loyalty/customers/:customerId/transactions',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { customerId } = request.params as any;
        const { limit } = request.query as any;

        const transactions = await loyaltyService.getLoyaltyTransactions(
          tenantId,
          customerId,
          limit ? parseInt(limit) : 50
        );

        reply.send({
          success: true,
          data: transactions,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Create reward
  server.post(
    '/loyalty/rewards',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const data = validateRequest(createRewardSchema, request.body);
        const reward = await loyaltyService.createReward(tenantId, data);

        await auditService.logCreate(tenantId, userId, 'reward',
          Array.isArray(reward) && reward[0] ? reward[0].id : null,
          reward, request);

        reply.code(201).send({
          success: true,
          data: Array.isArray(reward) && reward[0] ? reward[0] : reward,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get all rewards
  server.get(
    '/loyalty/rewards',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { activeOnly } = request.query as any;

        const rewards = await loyaltyService.getRewards(
          tenantId,
          activeOnly !== 'false'
        );

        reply.send({
          success: true,
          data: rewards,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get reward by ID
  server.get(
    '/loyalty/rewards/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { id } = request.params as any;

        const reward = await loyaltyService.getRewardById(tenantId, id);

        if (!reward) {
          return reply.code(404).send({
            success: false,
            error: 'Reward not found',
          });
        }

        reply.send({
          success: true,
          data: reward,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Update reward
  server.put(
    '/loyalty/rewards/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;
        const { id } = request.params as any;

        const before = await loyaltyService.getRewardById(tenantId, id);
        const data = validateRequest(updateRewardSchema, request.body);
        const reward = await loyaltyService.updateReward(tenantId, id, data);

        await auditService.logUpdate(tenantId, userId, 'reward', id, before, reward, request);

        reply.send({
          success: true,
          data: Array.isArray(reward) && reward[0] ? reward[0] : reward,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Delete reward
  server.delete(
    '/loyalty/rewards/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;
        const { id } = request.params as any;

        const before = await loyaltyService.getRewardById(tenantId, id);
        const reward = await loyaltyService.deleteReward(tenantId, id);

        await auditService.logDelete(tenantId, userId, 'reward', id, before, request);

        reply.send({
          success: true,
          data: Array.isArray(reward) && reward[0] ? reward[0] : reward,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Redeem reward
  server.post(
    '/loyalty/rewards/redeem',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const data = validateRequest(redeemRewardSchema, request.body);
        const result = await loyaltyService.redeemReward(tenantId, data);

        await auditService.logCreate(tenantId, userId, 'reward_redemption',
          result.redemption.id, result, request);

        reply.code(201).send({
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

  // Get customer redemptions
  server.get(
    '/loyalty/customers/:customerId/redemptions',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { customerId } = request.params as any;
        const { limit } = request.query as any;

        const redemptions = await loyaltyService.getCustomerRedemptions(
          tenantId,
          customerId,
          limit ? parseInt(limit) : 50
        );

        reply.send({
          success: true,
          data: redemptions,
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
