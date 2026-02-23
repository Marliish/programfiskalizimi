// Notifications System Schemas
// Created: 2026-02-23 - Day 6

import { z } from 'zod';

export const createNotificationTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['email', 'sms', 'push']),
  event: z.string().min(1).max(100),
  subject: z.string().max(255).optional(),
  bodyTemplate: z.string().min(1),
});

export const updateNotificationTemplateSchema = createNotificationTemplateSchema.partial();

export const sendNotificationSchema = z.object({
  recipientType: z.enum(['user', 'customer', 'email', 'phone']),
  recipientId: z.string().optional(),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  notificationType: z.enum(['email', 'sms', 'push']),
  subject: z.string().max(255).optional(),
  body: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  templateId: z.string().optional(),
});

export const updateNotificationPreferencesSchema = z.object({
  userId: z.string().optional(),
  customerId: z.string().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  eventPreferences: z.record(z.boolean()).optional(),
});

export type CreateNotificationTemplateInput = z.infer<typeof createNotificationTemplateSchema>;
export type UpdateNotificationTemplateInput = z.infer<typeof updateNotificationTemplateSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;
