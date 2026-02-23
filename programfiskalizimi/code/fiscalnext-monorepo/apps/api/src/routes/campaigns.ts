// Campaigns Routes - Email & SMS
// Created: 2026-02-23 - Day 13 Marketing Features
// Updated: Using DATABASE service (Boli & Mela)

import { FastifyInstance } from 'fastify';
import { campaignDatabaseService as campaignService } from '../services/campaign-db.service';

export async function campaignsRoutes(server: FastifyInstance) {
  // ============================================
  // EMAIL CAMPAIGNS
  // ============================================

  // Get all email campaigns
  server.get('/email', async (request, reply) => {
    try {
      const { status, limit, offset } = request.query as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await campaignService.getEmailCampaigns(tenantId, {
        status,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch campaigns', message: error.message });
    }
  });

  // Create email campaign
  server.post('/email', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'subject', 'fromName', 'fromEmail'],
        properties: {
          name: { type: 'string' },
          subject: { type: 'string' },
          fromName: { type: 'string' },
          fromEmail: { type: 'string', format: 'email' },
          replyTo: { type: 'string', format: 'email' },
          htmlContent: { type: 'string' },
          textContent: { type: 'string' },
          segmentId: { type: 'string' },
          scheduledFor: { type: 'string', format: 'date-time' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const tenantId = (request as any).tenantId || 'tenant_1';
      const campaign = await campaignService.createEmailCampaign(tenantId, request.body as any);

      return { success: true, campaign };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to create campaign', message: error.message });
    }
  });

  // Get campaign analytics
  server.get('/email/:campaignId/analytics', async (request, reply) => {
    try {
      const { campaignId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const analytics = await campaignService.getCampaignAnalytics(tenantId, campaignId);
      return analytics;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch analytics', message: error.message });
    }
  });

  // Send test email
  server.post('/email/:campaignId/test', {
    schema: {
      body: {
        type: 'object',
        required: ['testEmail'],
        properties: {
          testEmail: { type: 'string', format: 'email' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { campaignId } = request.params as any;
      const { testEmail } = request.body as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await campaignService.sendTestEmail(tenantId, campaignId, testEmail);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to send test email', message: error.message });
    }
  });

  // Send campaign now
  server.post('/email/:campaignId/send', async (request, reply) => {
    try {
      const { campaignId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await campaignService.sendCampaignNow(tenantId, campaignId);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to send campaign', message: error.message });
    }
  });

  // ============================================
  // SMS CAMPAIGNS
  // ============================================

  // Get all SMS campaigns
  server.get('/sms', async (request, reply) => {
    try {
      const tenantId = (request as any).tenantId || 'tenant_1';
      const result = await campaignService.getSMSCampaigns(tenantId);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch SMS campaigns', message: error.message });
    }
  });

  // Create SMS campaign
  server.post('/sms', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'message'],
        properties: {
          name: { type: 'string' },
          message: { type: 'string' },
          segmentId: { type: 'string' },
          scheduledFor: { type: 'string', format: 'date-time' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const tenantId = (request as any).tenantId || 'tenant_1';
      const campaign = await campaignService.createSMSCampaign(tenantId, request.body as any);

      return { success: true, campaign };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to create SMS campaign', message: error.message });
    }
  });

  // ============================================
  // CUSTOMER SEGMENTS
  // ============================================

  // Get all segments
  server.get('/segments', async (request, reply) => {
    try {
      const tenantId = (request as any).tenantId || 'tenant_1';
      const result = await campaignService.getSegments(tenantId);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch segments', message: error.message });
    }
  });

  // Create segment
  server.post('/segments', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'criteria'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          criteria: {
            type: 'object',
            properties: {
              minSpent: { type: 'number' },
              maxSpent: { type: 'number' },
              lastPurchaseDays: { type: 'number' },
              tags: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const tenantId = (request as any).tenantId || 'tenant_1';
      const segment = await campaignService.createSegment(tenantId, request.body as any);

      return { success: true, segment };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to create segment', message: error.message });
    }
  });

  // Preview segment
  server.post('/segments/preview', {
    schema: {
      body: {
        type: 'object',
        required: ['criteria'],
        properties: {
          criteria: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const tenantId = (request as any).tenantId || 'tenant_1';
      const { criteria } = request.body as any;

      const result = await campaignService.previewSegment(tenantId, criteria);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to preview segment', message: error.message });
    }
  });
}

export default campaignsRoutes;
