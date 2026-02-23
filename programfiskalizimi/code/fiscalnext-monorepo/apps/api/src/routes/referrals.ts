// Referrals Routes
// Referral program management
// Created: 2026-02-23 - Day 13 Marketing Features

import { FastifyInstance } from 'fastify';
import { referralService } from '../services/referral.service';

export async function referralsRoutes(server: FastifyInstance) {
  // Get all referral programs
  server.get('/programs', async (request, reply) => {
    try {
      const tenantId = (request as any).tenantId || 'tenant_1';
      const result = await referralService.getPrograms(tenantId);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch programs', message: error.message });
    }
  });

  // Create referral program
  server.post('/programs', {
    schema: {
      body: {
        type: 'object',
        required: [
          'name',
          'referrerRewardType',
          'referrerRewardAmount',
          'refereeRewardType',
          'refereeRewardAmount',
        ],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          referrerRewardType: { type: 'string', enum: ['points', 'discount', 'cash'] },
          referrerRewardAmount: { type: 'number' },
          refereeRewardType: { type: 'string', enum: ['points', 'discount', 'cash'] },
          refereeRewardAmount: { type: 'number' },
          minPurchaseAmount: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const tenantId = (request as any).tenantId || 'tenant_1';
      const program = await referralService.createProgram(tenantId, request.body as any);

      return { success: true, program };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to create program', message: error.message });
    }
  });

  // Update referral program
  server.patch('/programs/:programId', async (request, reply) => {
    try {
      const { programId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const program = await referralService.updateProgram(tenantId, programId, request.body as any);
      return program;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to update program', message: error.message });
    }
  });

  // Deactivate referral program
  server.post('/programs/:programId/deactivate', async (request, reply) => {
    try {
      const { programId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await referralService.deactivateProgram(tenantId, programId);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to deactivate program', message: error.message });
    }
  });

  // Generate referral code for customer
  server.post('/generate', {
    schema: {
      body: {
        type: 'object',
        required: ['programId', 'customerId'],
        properties: {
          programId: { type: 'string' },
          customerId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { programId, customerId } = request.body as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const referral = await referralService.generateReferralCode(tenantId, programId, customerId);
      return { success: true, referral };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to generate referral code', message: error.message });
    }
  });

  // Get customer referrals
  server.get('/customer/:customerId', async (request, reply) => {
    try {
      const { customerId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await referralService.getCustomerReferrals(tenantId, customerId);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch referrals', message: error.message });
    }
  });

  // Track referral click
  server.post('/track/:referralCode', async (request, reply) => {
    try {
      const { referralCode } = request.params as any;
      const result = await referralService.trackClick(referralCode);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to track click', message: error.message });
    }
  });

  // Complete referral
  server.post('/complete', {
    schema: {
      body: {
        type: 'object',
        required: ['referralCode', 'refereeCustomerId', 'purchaseAmount'],
        properties: {
          referralCode: { type: 'string' },
          refereeCustomerId: { type: 'string' },
          purchaseAmount: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { referralCode, refereeCustomerId, purchaseAmount } = request.body as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await referralService.completeReferral(
        tenantId,
        referralCode,
        refereeCustomerId,
        purchaseAmount
      );

      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to complete referral', message: error.message });
    }
  });

  // Get referral analytics
  server.get('/analytics', async (request, reply) => {
    try {
      const { programId } = request.query as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const analytics = await referralService.getReferralAnalytics(tenantId, programId);
      return analytics;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch analytics', message: error.message });
    }
  });
}

export default referralsRoutes;
