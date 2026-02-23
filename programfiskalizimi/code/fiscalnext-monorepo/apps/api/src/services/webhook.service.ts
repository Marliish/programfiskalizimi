// Webhook Service - Handle incoming webhooks from integrations
import { prisma } from '@fiscalnext/database';
import crypto from 'crypto';
import { integrationService } from './integration.service';

export interface WebhookConfig {
  id?: string;
  integrationId: string;
  event: string;
  url: string;
  secret?: string;
  enabled: boolean;
  headers?: Record<string, string>;
  retryCount?: number;
  lastTriggered?: Date;
}

export interface WebhookEvent {
  id?: string;
  webhookId: string | null;
  integrationId: string;
  event: string;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'success' | 'failed';
  attempts: number;
  error?: string;
  processedAt?: Date;
}

export class WebhookService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 5000, 15000]; // ms

  /**
   * Register a new webhook
   */
  async registerWebhook(config: WebhookConfig): Promise<WebhookConfig> {
    try {
      const webhook = await prisma.webhook.create({
        data: {
          integrationId: config.integrationId,
          event: config.event,
          url: config.url,
          secret: config.secret || this.generateSecret(),
          enabled: config.enabled,
          headers: config.headers as any || {},
          retryCount: config.retryCount || 3,
        },
      });

      return this.mapWebhook(webhook);
    } catch (error: any) {
      throw new Error(`Failed to register webhook: ${error.message}`);
    }
  }

  /**
   * Get webhooks for an integration
   */
  async getWebhooks(integrationId: string): Promise<WebhookConfig[]> {
    try {
      const results = await prisma.webhook.findMany({
        where: { integrationId },
      });

      return results.map(this.mapWebhook);
    } catch (error: any) {
      throw new Error(`Failed to fetch webhooks: ${error.message}`);
    }
  }

  /**
   * Handle incoming webhook
   */
  async handleIncoming(
    integrationId: string,
    event: string,
    payload: Record<string, any>,
    signature?: string
  ): Promise<{ success: boolean; message: string; eventId?: string }> {
    try {
      // Verify signature if provided
      const integration = await integrationService.getIntegration(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      if (signature && integration.webhookSecret) {
        const isValid = this.verifySignature(payload, signature, integration.webhookSecret);
        if (!isValid) {
          await integrationService.logAction(
            integrationId,
            'webhook_received',
            'error',
            'Invalid webhook signature'
          );
          return { success: false, message: 'Invalid signature' };
        }
      }

      // Create webhook event
      const webhookEvent = await prisma.webhookEvent.create({
        data: {
          webhookId: null, // Can be null for direct webhooks
          integrationId,
          event,
          payload: payload as any,
          status: 'pending',
          attempts: 0,
        },
      });

      // Process webhook based on event type
      await this.processWebhookEvent(webhookEvent.id, event, payload, integrationId);

      return {
        success: true,
        message: 'Webhook received and queued for processing',
        eventId: webhookEvent.id,
      };
    } catch (error: any) {
      await integrationService.logAction(
        integrationId,
        'webhook_received',
        'error',
        `Webhook processing failed: ${error.message}`
      );
      return { success: false, message: error.message };
    }
  }

  /**
   * Process webhook event
   */
  private async processWebhookEvent(
    eventId: string,
    event: string,
    payload: Record<string, any>,
    integrationId: string
  ): Promise<void> {
    try {
      // Update status to processing
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: { status: 'processing' },
      });

      // Process based on event type
      let result;
      switch (event) {
        case 'order.created':
        case 'shopify.order.created':
        case 'woocommerce.order.created':
          result = await this.handleOrderCreated(payload, integrationId);
          break;

        case 'product.updated':
        case 'shopify.product.updated':
        case 'woocommerce.product.updated':
          result = await this.handleProductUpdated(payload, integrationId);
          break;

        case 'inventory.updated':
          result = await this.handleInventoryUpdated(payload, integrationId);
          break;

        case 'customer.created':
          result = await this.handleCustomerCreated(payload, integrationId);
          break;

        default:
          result = await this.handleGenericEvent(event, payload, integrationId);
      }

      // Update status to success
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'success',
          processedAt: new Date(),
        },
      });

      await integrationService.logAction(
        integrationId,
        `webhook_${event}`,
        'success',
        'Webhook processed successfully',
        result
      );
    } catch (error: any) {
      // Update status to failed
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'failed',
          error: error.message,
        },
      });

      await integrationService.logAction(
        integrationId,
        `webhook_${event}`,
        'error',
        `Webhook processing failed: ${error.message}`
      );

      // Retry logic would go here
      throw error;
    }
  }

  /**
   * Handle order created webhook
   */
  private async handleOrderCreated(payload: any, integrationId: string): Promise<any> {
    // Import order into system
    // This would integrate with the POS/transaction service
    console.log('Order created:', payload);
    return { action: 'order_created', orderId: payload.id };
  }

  /**
   * Handle product updated webhook
   */
  private async handleProductUpdated(payload: any, integrationId: string): Promise<any> {
    // Update product in system
    console.log('Product updated:', payload);
    return { action: 'product_updated', productId: payload.id };
  }

  /**
   * Handle inventory updated webhook
   */
  private async handleInventoryUpdated(payload: any, integrationId: string): Promise<any> {
    // Update inventory in system
    console.log('Inventory updated:', payload);
    return { action: 'inventory_updated', items: payload.items };
  }

  /**
   * Handle customer created webhook
   */
  private async handleCustomerCreated(payload: any, integrationId: string): Promise<any> {
    // Create customer in system
    console.log('Customer created:', payload);
    return { action: 'customer_created', customerId: payload.id };
  }

  /**
   * Handle generic event
   */
  private async handleGenericEvent(event: string, payload: any, integrationId: string): Promise<any> {
    console.log('Generic event:', event, payload);
    return { action: 'generic_event', event, processed: true };
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(payload: any, signature: string, secret: string): boolean {
    try {
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payloadString);
      const calculatedSignature = hmac.digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate webhook secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get webhook events
   */
  async getWebhookEvents(
    integrationId: string,
    status?: string,
    limit: number = 50
  ): Promise<WebhookEvent[]> {
    try {
      const results = await prisma.webhookEvent.findMany({
        where: {
          integrationId,
          ...(status && { status }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return results.map(this.mapWebhookEvent);
    } catch (error: any) {
      throw new Error(`Failed to fetch webhook events: ${error.message}`);
    }
  }

  /**
   * Retry failed webhook event
   */
  async retryWebhookEvent(eventId: string): Promise<void> {
    try {
      const event = await prisma.webhookEvent.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new Error('Webhook event not found');
      }

      if (event.attempts >= this.MAX_RETRIES) {
        throw new Error('Max retries exceeded');
      }

      // Increment attempts
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: { 
          attempts: event.attempts + 1, 
          status: 'pending' 
        },
      });

      // Process again
      await this.processWebhookEvent(
        eventId,
        event.event,
        event.payload as Record<string, any>,
        event.integrationId
      );
    } catch (error: any) {
      throw new Error(`Failed to retry webhook event: ${error.message}`);
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: string): Promise<void> {
    try {
      await prisma.webhook.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }

  /**
   * Map database webhook to interface
   */
  private mapWebhook(webhook: any): WebhookConfig {
    return {
      id: webhook.id,
      integrationId: webhook.integrationId,
      event: webhook.event,
      url: webhook.url,
      secret: webhook.secret,
      enabled: webhook.enabled,
      headers: webhook.headers,
      retryCount: webhook.retryCount,
      lastTriggered: webhook.lastTriggered,
    };
  }

  /**
   * Map database webhook event to interface
   */
  private mapWebhookEvent(event: any): WebhookEvent {
    return {
      id: event.id,
      webhookId: event.webhookId,
      integrationId: event.integrationId,
      event: event.event,
      payload: event.payload,
      status: event.status,
      attempts: event.attempts,
      error: event.error,
      processedAt: event.processedAt,
    };
  }
}

export const webhookService = new WebhookService();
