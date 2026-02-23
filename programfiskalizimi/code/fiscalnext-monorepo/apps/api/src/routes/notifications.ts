// Notifications System Routes
// Created: 2026-02-23 - Day 6

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { notificationService } from '../services/notification.service';
import { auditService } from '../services/audit.service';
import {
  createNotificationTemplateSchema,
  updateNotificationTemplateSchema,
  sendNotificationSchema,
  updateNotificationPreferencesSchema,
} from '../schemas/notification.schema';
import { validateRequest } from '../middleware/validate';

export async function notificationRoutes(server: FastifyInstance) {
  // Create notification template
  server.post(
    '/notifications/templates',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const data = validateRequest(createNotificationTemplateSchema, request.body);
        const template = await notificationService.createTemplate(tenantId, data);

        await auditService.logCreate(tenantId, userId, 'notification_template',
          Array.isArray(template) && template[0] ? template[0].id : null,
          template, request);

        reply.code(201).send({
          success: true,
          data: Array.isArray(template) && template[0] ? template[0] : template,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get all templates
  server.get(
    '/notifications/templates',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { activeOnly } = request.query as any;

        const templates = await notificationService.getTemplates(
          tenantId,
          activeOnly !== 'false'
        );

        reply.send({
          success: true,
          data: templates,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get template by ID
  server.get(
    '/notifications/templates/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { id } = request.params as any;

        const template = await notificationService.getTemplateById(tenantId, id);

        if (!template) {
          return reply.code(404).send({
            success: false,
            error: 'Template not found',
          });
        }

        reply.send({
          success: true,
          data: template,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Update template
  server.put(
    '/notifications/templates/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;
        const { id } = request.params as any;

        const before = await notificationService.getTemplateById(tenantId, id);
        const data = validateRequest(updateNotificationTemplateSchema, request.body);
        const template = await notificationService.updateTemplate(tenantId, id, data);

        await auditService.logUpdate(tenantId, userId, 'notification_template', id, before, template, request);

        reply.send({
          success: true,
          data: Array.isArray(template) && template[0] ? template[0] : template,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Delete template
  server.delete(
    '/notifications/templates/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;
        const { id } = request.params as any;

        const before = await notificationService.getTemplateById(tenantId, id);
        const template = await notificationService.deleteTemplate(tenantId, id);

        await auditService.logDelete(tenantId, userId, 'notification_template', id, before, request);

        reply.send({
          success: true,
          data: Array.isArray(template) && template[0] ? template[0] : template,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Send notification
  server.post(
    '/notifications/send',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const data = validateRequest(sendNotificationSchema, request.body);
        const notification = await notificationService.sendNotification(tenantId, data);

        await auditService.logCreate(tenantId, userId, 'notification',
          notification.id || null, notification, request);

        reply.code(201).send({
          success: true,
          data: Array.isArray(notification) && notification[0] ? notification[0] : notification,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get notification history
  server.get(
    '/notifications/history',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { recipientId, limit } = request.query as any;

        const history = await notificationService.getHistory(
          tenantId,
          recipientId,
          limit ? parseInt(limit) : 50
        );

        reply.send({
          success: true,
          data: history,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get notification preferences
  server.get(
    '/notifications/preferences',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const preferences = await notificationService.getUserPreferences(tenantId, userId);

        reply.send({
          success: true,
          data: preferences || {
            emailEnabled: true,
            smsEnabled: true,
            pushEnabled: true,
            eventPreferences: {},
          },
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Update notification preferences
  server.put(
    '/notifications/preferences',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const data = validateRequest(updateNotificationPreferencesSchema, request.body);
        
        // Set userId if not provided
        if (!data.userId && !data.customerId) {
          data.userId = userId;
        }

        const preferences = await notificationService.updatePreferences(tenantId, data);

        await auditService.logUpdate(tenantId, userId, 'notification_preferences',
          Array.isArray(preferences) && preferences[0] ? preferences[0].id : null,
          {}, preferences, request);

        reply.send({
          success: true,
          data: Array.isArray(preferences) && preferences[0] ? preferences[0] : preferences,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Mark notification as sent (internal use)
  server.put(
    '/notifications/:id/sent',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { id } = request.params as any;

        const notification = await notificationService.markAsSent(tenantId, id);

        reply.send({
          success: true,
          data: Array.isArray(notification) && notification[0] ? notification[0] : notification,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Mark notification as delivered (internal use)
  server.put(
    '/notifications/:id/delivered',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { id } = request.params as any;

        const notification = await notificationService.markAsDelivered(tenantId, id);

        reply.send({
          success: true,
          data: Array.isArray(notification) && notification[0] ? notification[0] : notification,
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
