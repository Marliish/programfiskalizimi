// Integration Routes - Fastify
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { integrationService } from '../services/integration.service';
import { webhookService } from '../services/webhook.service';
import { automationService } from '../services/automation.service';
import { shopifyService } from '../services/shopify.service';
import { woocommerceService } from '../services/woocommerce.service';
import { shippingService } from '../services/shipping.service';
import { crmService } from '../services/crm.service';
import { slackService } from '../services/slack.service';
import { smsService } from '../services/sms.service';
import { googleWorkspaceService } from '../services/google-workspace.service';

export async function integrationRoutes(
  server: FastifyInstance,
  options: FastifyPluginOptions
) {
  // ============= INTEGRATION MANAGEMENT =============

  // GET /integrations - Get all integrations
  server.get('/integrations', async (request, reply) => {
    try {
      const { type } = request.query as any;
      const integrations = await integrationService.getAllIntegrations(type);
      return integrations;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // GET /integrations/:id - Get integration by ID
  server.get('/integrations/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const integration = await integrationService.getIntegration(id);
      if (!integration) {
        return reply.status(404).send({ error: 'Integration not found' });
      }
      return integration;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations - Create new integration
  server.post('/integrations', async (request, reply) => {
    try {
      const integration = await integrationService.createIntegration(request.body as any);
      reply.status(201).send(integration);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // PUT /integrations/:id - Update integration
  server.put('/integrations/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const integration = await integrationService.updateIntegration(id, request.body as any);
      return integration;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // DELETE /integrations/:id - Delete integration
  server.delete('/integrations/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      await integrationService.deleteIntegration(id);
      return { message: 'Integration deleted successfully' };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/test - Test integration connection
  server.post('/integrations/:id/test', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const result = await integrationService.testConnection(id);
      return result;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // GET /integrations/:id/logs - Get integration logs
  server.get('/integrations/:id/logs', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { limit = 50 } = request.query as any;
      const logs = await integrationService.getLogs(id, parseInt(limit));
      return logs;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // ============= SHOPIFY =============

  // POST /integrations/:id/shopify/sync-products
  server.post('/integrations/:id/shopify/sync-products', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const result = await shopifyService.syncProducts(id);
      return result;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/shopify/sync-orders
  server.post('/integrations/:id/shopify/sync-orders', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { since } = request.body as any;
      const result = await shopifyService.syncOrders(id, since ? new Date(since) : undefined);
      return result;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/shopify/update-inventory
  server.post('/integrations/:id/shopify/update-inventory', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { updates } = request.body as any;
      const result = await shopifyService.updateInventory(id, updates);
      return result;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // ============= WOOCOMMERCE =============

  // POST /integrations/:id/woocommerce/sync-products
  server.post('/integrations/:id/woocommerce/sync-products', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const result = await woocommerceService.syncProducts(id);
      return result;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/woocommerce/sync-orders
  server.post('/integrations/:id/woocommerce/sync-orders', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { since } = request.body as any;
      const result = await woocommerceService.syncOrders(id, since ? new Date(since) : undefined);
      return result;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // ============= SHIPPING =============

  // POST /integrations/:id/shipping/rates
  server.post('/integrations/:id/shipping/rates', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { from, to, packages } = request.body as any;
      const rates = await shippingService.getRates(id, from, to, packages);
      return rates;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/shipping/label
  server.post('/integrations/:id/shipping/label', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { from, to, packages, service } = request.body as any;
      const label = await shippingService.createLabel(id, from, to, packages, service);
      reply.status(201).send(label);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // GET /integrations/:id/shipping/track/:trackingNumber
  server.get('/integrations/:id/shipping/track/:trackingNumber', async (request, reply) => {
    try {
      const { id, trackingNumber } = request.params as any;
      const tracking = await shippingService.trackShipment(id, trackingNumber);
      return tracking;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // ============= CRM =============

  // POST /integrations/:id/crm/sync-contacts
  server.post('/integrations/:id/crm/sync-contacts', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { contacts } = request.body as any;
      const result = await crmService.syncContacts(id, contacts);
      return result;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/crm/deal
  server.post('/integrations/:id/crm/deal', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const deal = await crmService.createDeal(id, request.body as any);
      reply.status(201).send(deal);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // ============= SLACK =============

  // POST /integrations/:id/slack/notification
  server.post('/integrations/:id/slack/notification', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { channel, message, options } = request.body as any;
      await slackService.sendNotification(id, channel, message, options);
      return { message: 'Notification sent' };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/slack/sales-notification
  server.post('/integrations/:id/slack/sales-notification', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { channel, sale } = request.body as any;
      await slackService.sendSalesNotification(id, channel, sale);
      return { message: 'Sales notification sent' };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/slack/low-stock-alert
  server.post('/integrations/:id/slack/low-stock-alert', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { channel, products } = request.body as any;
      await slackService.sendLowStockAlert(id, channel, products);
      return { message: 'Low stock alert sent' };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/slack/daily-summary
  server.post('/integrations/:id/slack/daily-summary', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { channel, summary } = request.body as any;
      await slackService.sendDailySummary(id, channel, summary);
      return { message: 'Daily summary sent' };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // ============= SMS / WHATSAPP =============

  // POST /integrations/:id/sms/send
  server.post('/integrations/:id/sms/send', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const result = await smsService.sendSMS(id, request.body as any);
      return result;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/whatsapp/send
  server.post('/integrations/:id/whatsapp/send', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const result = await smsService.sendWhatsApp(id, request.body as any);
      return result;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/sms/campaign
  server.post('/integrations/:id/sms/campaign', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { recipients, message } = request.body as any;
      const result = await smsService.sendCampaign(id, recipients, message);
      return result;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // ============= GOOGLE WORKSPACE =============

  // POST /integrations/:id/google/calendar/event
  server.post('/integrations/:id/google/calendar/event', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { calendarId, event } = request.body as any;
      const result = await googleWorkspaceService.createCalendarEvent(id, calendarId, event);
      reply.status(201).send(result);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/google/sheets/export
  server.post('/integrations/:id/google/sheets/export', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { spreadsheetId, data } = request.body as any;
      await googleWorkspaceService.exportToSheets(id, spreadsheetId, data);
      return { message: 'Data exported successfully' };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // ============= WEBHOOKS =============

  // GET /integrations/:id/webhooks
  server.get('/integrations/:id/webhooks', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const webhooks = await webhookService.getWebhooks(id);
      return webhooks;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/webhooks
  server.post('/integrations/:id/webhooks', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const webhook = await webhookService.registerWebhook({
        integrationId: id,
        ...request.body as any,
      });
      reply.status(201).send(webhook);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /integrations/:id/webhook-incoming
  server.post('/integrations/:id/webhook-incoming', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { event, signature } = request.headers as any;
      const result = await webhookService.handleIncoming(id, event, request.body as any, signature);
      return result;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // GET /integrations/:id/webhook-events
  server.get('/integrations/:id/webhook-events', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { status, limit = 50 } = request.query as any;
      const events = await webhookService.getWebhookEvents(id, status, parseInt(limit));
      return events;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // ============= AUTOMATION =============

  // GET /automations
  server.get('/automations', async (request, reply) => {
    try {
      const { type } = request.query as any;
      const rules = await automationService.getAllRules(type);
      return rules;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // GET /automations/:id
  server.get('/automations/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const rule = await automationService.getRule(id);
      if (!rule) {
        return reply.status(404).send({ error: 'Automation rule not found' });
      }
      return rule;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /automations
  server.post('/automations', async (request, reply) => {
    try {
      const rule = await automationService.createRule(request.body as any);
      reply.status(201).send(rule);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // PUT /automations/:id
  server.put('/automations/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const rule = await automationService.updateRule(id, request.body as any);
      return rule;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // DELETE /automations/:id
  server.delete('/automations/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      await automationService.deleteRule(id);
      return { message: 'Automation rule deleted successfully' };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // POST /automations/:id/execute
  server.post('/automations/:id/execute', async (request, reply) => {
    try {
      const { id } = request.params as any;
      await automationService.executeRule(id, {
        trigger: 'manual',
        data: request.body as any,
        timestamp: new Date(),
      });
      return { message: 'Automation executed successfully' };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // GET /automations/:id/logs
  server.get('/automations/:id/logs', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { limit = 50 } = request.query as any;
      const logs = await automationService.getLogs(id, parseInt(limit));
      return logs;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });
}

export default integrationRoutes;
