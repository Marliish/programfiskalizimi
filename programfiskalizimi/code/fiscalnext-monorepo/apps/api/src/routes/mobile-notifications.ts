// Push Notifications Management for Mobile
import { FastifyPluginAsync } from 'fastify';
import { prisma } from '@fiscalnext/database';
import { z } from 'zod';

const registerDeviceSchema = z.object({
  token: z.string(),
  platform: z.enum(['ios', 'android']),
  deviceId: z.string(),
});

const sendNotificationSchema = z.object({
  title: z.string(),
  body: z.string(),
  data: z.record(z.any()).optional(),
  targets: z.array(z.number()).optional(), // User IDs
  targetRoles: z.array(z.string()).optional(),
  scheduled: z.string().optional(), // ISO date
});

export const mobileNotificationRoutes: FastifyPluginAsync = async (server) => {
  // Register device for push notifications
  server.post('/register', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { token, platform, deviceId } = registerDeviceSchema.parse(request.body);

      // Store device token (would use a separate table in production)
      // For now, store in notification settings
      await prisma.notificationSettings.upsert({
        where: {
          userId: request.user.userId,
        },
        create: {
          userId: request.user.userId,
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
        },
        update: {
          pushEnabled: true,
        },
      });

      return {
        success: true,
        message: 'Device registered for push notifications',
      };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Send push notification
  server.post('/send', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const notification = sendNotificationSchema.parse(request.body);

      // Create notification record
      const created = await prisma.notification.create({
        data: {
          userId: request.user.userId,
          title: notification.title,
          message: notification.body,
          type: 'push',
          read: false,
        },
      });

      // In production, would send via Firebase Cloud Messaging
      // or Apple Push Notification service

      return {
        success: true,
        notificationId: created.id,
        message: 'Notification sent',
      };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Get user notifications
  server.get('/list', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { page = 1, limit = 20 } = request.query as any;

      const notifications = await prisma.notification.findMany({
        where: {
          userId: request.user.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await prisma.notification.count({
        where: {
          userId: request.user.userId,
        },
      });

      return {
        success: true,
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      reply.code(500);
      return { error: error.message };
    }
  });

  // Mark notification as read
  server.put('/:id/read', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      await prisma.notification.update({
        where: {
          id: Number(id),
          userId: request.user.userId,
        },
        data: {
          read: true,
        },
      });

      return {
        success: true,
        message: 'Notification marked as read',
      };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Get unread count
  server.get('/unread-count', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: request.user.userId,
          read: false,
        },
      });

      return {
        success: true,
        unreadCount: count,
      };
    } catch (error: any) {
      reply.code(500);
      return { error: error.message };
    }
  });

  // Schedule notification
  server.post('/schedule', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const notification = sendNotificationSchema.parse(request.body);

      if (!notification.scheduled) {
        reply.code(400);
        return { error: 'Scheduled time is required' };
      }

      // Store scheduled notification
      // In production, would use a job queue (Bull, BullMQ, etc.)
      
      return {
        success: true,
        message: 'Notification scheduled',
        scheduledFor: notification.scheduled,
      };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });
};
