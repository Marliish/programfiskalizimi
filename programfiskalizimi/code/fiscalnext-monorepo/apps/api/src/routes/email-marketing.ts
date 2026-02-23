// Email Marketing Routes
// Created: 2026-02-23 - Day 7 Integration

import { FastifyInstance } from 'fastify';
import { EmailMarketingService } from '../services/email-marketing.service';

const emailService = new EmailMarketingService();

export async function emailMarketingRoutes(server: FastifyInstance) {
  // Sync customers to Mailchimp
  server.post('/mailchimp/sync', {
    schema: {
      body: {
        type: 'object',
        properties: {
          listId: { type: 'string' },
          segmentId: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const result = await emailService.syncToMailchimp(request.body as any);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Mailchimp sync failed',
        message: error.message,
      });
    }
  });

  // Create Mailchimp campaign
  server.post('/mailchimp/campaign', {
    schema: {
      body: {
        type: 'object',
        required: ['listId', 'subject', 'fromName', 'fromEmail', 'htmlContent'],
        properties: {
          listId: { type: 'string' },
          subject: { type: 'string' },
          fromName: { type: 'string' },
          fromEmail: { type: 'string', format: 'email' },
          htmlContent: { type: 'string' },
          segmentId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const result = await emailService.createMailchimpCampaign(request.body as any);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Campaign creation failed',
        message: error.message,
      });
    }
  });

  // Send transactional email (SendGrid)
  server.post('/sendgrid/send', {
    schema: {
      body: {
        type: 'object',
        required: ['to', 'from', 'subject'],
        properties: {
          to: { type: 'string', format: 'email' },
          from: { type: 'string', format: 'email' },
          subject: { type: 'string' },
          text: { type: 'string' },
          html: { type: 'string' },
          templateId: { type: 'string' },
          dynamicData: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const result = await emailService.sendTransactionalEmail(request.body as any);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Email send failed',
        message: error.message,
      });
    }
  });

  // Send bulk emails (SendGrid)
  server.post('/sendgrid/bulk', {
    schema: {
      body: {
        type: 'object',
        required: ['emails'],
        properties: {
          emails: {
            type: 'array',
            items: {
              type: 'object',
              required: ['to', 'from', 'subject'],
              properties: {
                to: { type: 'string' },
                from: { type: 'string' },
                subject: { type: 'string' },
                html: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { emails } = request.body as any;
      const result = await emailService.sendBulkEmails(emails);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Bulk email send failed',
        message: error.message,
      });
    }
  });

  // Export customer segment
  server.post('/segment/export', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'criteria'],
        properties: {
          name: { type: 'string' },
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
      const segment = await emailService.exportSegment(request.body as any);
      return {
        segment: request.body,
        customers: segment,
        count: segment.length,
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Segment export failed',
        message: error.message,
      });
    }
  });

  // Create automated campaign
  server.post('/campaign/automated', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'trigger', 'templateId'],
        properties: {
          name: { type: 'string' },
          trigger: {
            type: 'string',
            enum: ['welcome', 'abandoned_cart', 'post_purchase', 'birthday'],
          },
          delayHours: { type: 'number' },
          templateId: { type: 'string' },
          segmentId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const result = await emailService.createAutomatedCampaign(request.body as any);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Automated campaign creation failed',
        message: error.message,
      });
    }
  });

  // Get campaign statistics
  server.get('/campaign/:campaignId/stats', async (request, reply) => {
    try {
      const { campaignId } = request.params as any;
      const stats = await emailService.getCampaignStats(campaignId);
      return stats;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch campaign stats',
        message: error.message,
      });
    }
  });

  // Send welcome email
  server.post('/customer/:customerId/welcome', async (request, reply) => {
    try {
      const { customerId } = request.params as any;
      const result = await emailService.sendWelcomeEmail(customerId);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Welcome email failed',
        message: error.message,
      });
    }
  });

  // Send receipt email
  server.post('/receipt/:receiptId/email', async (request, reply) => {
    try {
      const { receiptId } = request.params as any;
      const result = await emailService.sendReceiptEmail(receiptId);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Receipt email failed',
        message: error.message,
      });
    }
  });

  // Get email templates
  server.get('/templates', async (request, reply) => {
    try {
      const templates = await emailService.getEmailTemplates();
      return {
        templates,
        count: templates.length,
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch templates',
        message: error.message,
      });
    }
  });
}
