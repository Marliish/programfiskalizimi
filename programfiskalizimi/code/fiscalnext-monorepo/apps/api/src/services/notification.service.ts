// Notifications System Service
// Created: 2026-02-23 - Day 6

import { PrismaClient } from '@fiscalnext/database';
import type {
  CreateNotificationTemplateInput,
  UpdateNotificationTemplateInput,
  SendNotificationInput,
  UpdateNotificationPreferencesInput,
} from '../schemas/notification.schema';

const prisma = new PrismaClient();

export class NotificationService {
  // Create notification template
  async createTemplate(tenantId: string, data: CreateNotificationTemplateInput) {
    return await prisma.$queryRawUnsafe(`
      INSERT INTO notification_templates (
        tenant_id, name, type, event, subject, body_template
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      tenantId, data.name, data.type, data.event,
      data.subject || null, data.bodyTemplate
    );
  }

  // Get all templates
  async getTemplates(tenantId: string, activeOnly = true) {
    const whereClause = activeOnly ? 'AND is_active = true' : '';

    return await prisma.$queryRawUnsafe(`
      SELECT * FROM notification_templates
      WHERE tenant_id = $1 ${whereClause}
      ORDER BY event, type
    `, tenantId);
  }

  // Get template by ID
  async getTemplateById(tenantId: string, templateId: string) {
    const result = await prisma.$queryRawUnsafe(`
      SELECT * FROM notification_templates
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `, tenantId, templateId);

    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  // Get template by event and type
  async getTemplateByEvent(tenantId: string, event: string, type: string) {
    const result = await prisma.$queryRawUnsafe(`
      SELECT * FROM notification_templates
      WHERE tenant_id = $1 AND event = $2 AND type = $3 AND is_active = true
      LIMIT 1
    `, tenantId, event, type);

    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  // Update template
  async updateTemplate(tenantId: string, templateId: string, data: UpdateNotificationTemplateInput) {
    const fields = [];
    const values = [];
    let paramIndex = 3;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return await this.getTemplateById(tenantId, templateId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    return await prisma.$queryRawUnsafe(`
      UPDATE notification_templates
      SET ${fields.join(', ')}
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `, tenantId, templateId, ...values);
  }

  // Delete template
  async deleteTemplate(tenantId: string, templateId: string) {
    return await prisma.$queryRawUnsafe(`
      UPDATE notification_templates
      SET is_active = false
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `, tenantId, templateId);
  }

  // Send notification
  async sendNotification(tenantId: string, data: SendNotificationInput) {
    // Check user preferences if recipient is user or customer
    let shouldSend = true;

    if (data.recipientType === 'user' && data.recipientId) {
      const prefs = await this.getUserPreferences(tenantId, data.recipientId);
      if (prefs) {
        if (data.notificationType === 'email' && !prefs.email_enabled) shouldSend = false;
        if (data.notificationType === 'sms' && !prefs.sms_enabled) shouldSend = false;
        if (data.notificationType === 'push' && !prefs.push_enabled) shouldSend = false;
      }
    } else if (data.recipientType === 'customer' && data.recipientId) {
      const prefs = await this.getCustomerPreferences(tenantId, data.recipientId);
      if (prefs) {
        if (data.notificationType === 'email' && !prefs.email_enabled) shouldSend = false;
        if (data.notificationType === 'sms' && !prefs.sms_enabled) shouldSend = false;
        if (data.notificationType === 'push' && !prefs.push_enabled) shouldSend = false;
      }
    }

    if (!shouldSend) {
      return { status: 'skipped', reason: 'User preferences disabled this notification type' };
    }

    // Create notification record
    return await prisma.$queryRawUnsafe(`
      INSERT INTO notifications (
        tenant_id, template_id, recipient_type, recipient_id,
        recipient_email, recipient_phone, notification_type,
        subject, body, status, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10)
      RETURNING *
    `,
      tenantId,
      data.templateId || null,
      data.recipientType,
      data.recipientId || null,
      data.recipientEmail || null,
      data.recipientPhone || null,
      data.notificationType,
      data.subject || null,
      data.body,
      data.metadata ? JSON.stringify(data.metadata) : null
    );
  }

  // Send notification from template
  async sendFromTemplate(
    tenantId: string,
    event: string,
    type: 'email' | 'sms' | 'push',
    recipient: { type: string; id?: string; email?: string; phone?: string },
    variables: Record<string, any> = {}
  ) {
    const template = await this.getTemplateByEvent(tenantId, event, type);
    
    if (!template) {
      throw new Error(`No active template found for event: ${event}, type: ${type}`);
    }

    // Replace variables in template
    let subject = template.subject || '';
    let body = template.body_template;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return await this.sendNotification(tenantId, {
      recipientType: recipient.type as any,
      recipientId: recipient.id,
      recipientEmail: recipient.email,
      recipientPhone: recipient.phone,
      notificationType: type,
      subject,
      body,
      templateId: template.id,
      metadata: { event, variables },
    });
  }

  // Get pending notifications
  async getPendingNotifications(tenantId: string, limit = 100) {
    return await prisma.$queryRawUnsafe(`
      SELECT * FROM notifications
      WHERE tenant_id = $1 AND status = 'pending' AND retry_count < 3
      ORDER BY created_at ASC
      LIMIT $2
    `, tenantId, limit);
  }

  // Mark notification as sent
  async markAsSent(tenantId: string, notificationId: string) {
    return await prisma.$queryRawUnsafe(`
      UPDATE notifications
      SET status = 'sent', sent_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `, tenantId, notificationId);
  }

  // Mark notification as delivered
  async markAsDelivered(tenantId: string, notificationId: string) {
    return await prisma.$queryRawUnsafe(`
      UPDATE notifications
      SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `, tenantId, notificationId);
  }

  // Mark notification as failed
  async markAsFailed(tenantId: string, notificationId: string, errorMessage: string) {
    return await prisma.$queryRawUnsafe(`
      UPDATE notifications
      SET status = 'failed', error_message = $3, retry_count = retry_count + 1
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `, tenantId, notificationId, errorMessage);
  }

  // Get user preferences
  async getUserPreferences(tenantId: string, userId: string) {
    const result = await prisma.$queryRawUnsafe(`
      SELECT * FROM notification_preferences
      WHERE tenant_id = $1 AND user_id = $2
      LIMIT 1
    `, tenantId, userId);

    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  // Get customer preferences
  async getCustomerPreferences(tenantId: string, customerId: string) {
    const result = await prisma.$queryRawUnsafe(`
      SELECT * FROM notification_preferences
      WHERE tenant_id = $1 AND customer_id = $2
      LIMIT 1
    `, tenantId, customerId);

    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  // Update notification preferences
  async updatePreferences(tenantId: string, data: UpdateNotificationPreferencesInput) {
    if (!data.userId && !data.customerId) {
      throw new Error('Either userId or customerId must be provided');
    }

    const idField = data.userId ? 'user_id' : 'customer_id';
    const idValue = data.userId || data.customerId;

    // Check if preferences exist
    const existing = data.userId 
      ? await this.getUserPreferences(tenantId, data.userId)
      : await this.getCustomerPreferences(tenantId, data.customerId!);

    if (existing) {
      // Update
      const fields = [];
      const values = [];
      let paramIndex = 3;

      if (data.emailEnabled !== undefined) {
        fields.push(`email_enabled = $${paramIndex++}`);
        values.push(data.emailEnabled);
      }
      if (data.smsEnabled !== undefined) {
        fields.push(`sms_enabled = $${paramIndex++}`);
        values.push(data.smsEnabled);
      }
      if (data.pushEnabled !== undefined) {
        fields.push(`push_enabled = $${paramIndex++}`);
        values.push(data.pushEnabled);
      }
      if (data.eventPreferences !== undefined) {
        fields.push(`event_preferences = $${paramIndex++}`);
        values.push(JSON.stringify(data.eventPreferences));
      }

      if (fields.length === 0) {
        return existing;
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      return await prisma.$queryRawUnsafe(`
        UPDATE notification_preferences
        SET ${fields.join(', ')}
        WHERE tenant_id = $1 AND ${idField} = $2
        RETURNING *
      `, tenantId, idValue, ...values);
    } else {
      // Create
      return await prisma.$queryRawUnsafe(`
        INSERT INTO notification_preferences (
          tenant_id, ${idField}, email_enabled, sms_enabled, 
          push_enabled, event_preferences
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
        tenantId, idValue,
        data.emailEnabled ?? true,
        data.smsEnabled ?? true,
        data.pushEnabled ?? true,
        data.eventPreferences ? JSON.stringify(data.eventPreferences) : '{}'
      );
    }
  }

  // Get notification history
  async getHistory(tenantId: string, recipientId?: string, limit = 50) {
    const whereClause = recipientId 
      ? 'WHERE tenant_id = $1 AND recipient_id = $2'
      : 'WHERE tenant_id = $1';
    
    const params = recipientId ? [tenantId, recipientId, limit] : [tenantId, limit];

    return await prisma.$queryRawUnsafe(`
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length}
    `, ...params);
  }
}

export const notificationService = new NotificationService();
