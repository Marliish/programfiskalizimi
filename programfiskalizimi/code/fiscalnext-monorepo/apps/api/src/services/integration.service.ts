// Integration Service - Core integration management
import { prisma } from '@fiscalnext/database';
import axios, { AxiosError } from 'axios';

export interface IntegrationConfig {
  id?: string;
  name: string;
  provider: string;
  type: 'ecommerce' | 'marketplace' | 'shipping' | 'crm' | 'business' | 'custom';
  enabled: boolean;
  config: Record<string, any>;
  syncInterval?: number; // minutes
  lastSync?: Date;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface IntegrationLog {
  integrationId: string;
  action: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, any>;
  duration?: number;
}

export class IntegrationService {
  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  /**
   * Create a new integration
   */
  async createIntegration(config: IntegrationConfig): Promise<IntegrationConfig> {
    try {
      const integration = await prisma.integration.create({
        data: {
          name: config.name,
          provider: config.provider,
          type: config.type,
          enabled: config.enabled,
          config: config.config as any,
          syncInterval: config.syncInterval,
          webhookUrl: config.webhookUrl,
          webhookSecret: config.webhookSecret,
        },
      });

      await this.logAction(integration.id, 'create', 'success', 'Integration created successfully');
      
      return this.mapIntegration(integration);
    } catch (error: any) {
      throw new Error(`Failed to create integration: ${error.message}`);
    }
  }

  /**
   * Get all integrations
   */
  async getAllIntegrations(type?: string): Promise<IntegrationConfig[]> {
    try {
      const results = await prisma.integration.findMany({
        where: type ? { type } : undefined,
      });

      return results.map(this.mapIntegration);
    } catch (error: any) {
      throw new Error(`Failed to fetch integrations: ${error.message}`);
    }
  }

  /**
   * Get integration by ID
   */
  async getIntegration(id: string): Promise<IntegrationConfig | null> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { id },
      });

      return integration ? this.mapIntegration(integration) : null;
    } catch (error: any) {
      throw new Error(`Failed to fetch integration: ${error.message}`);
    }
  }

  /**
   * Update integration
   */
  async updateIntegration(id: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig> {
    try {
      const updated = await prisma.integration.update({
        where: { id },
        data: {
          ...updates,
          config: updates.config as any,
        },
      });

      await this.logAction(id, 'update', 'success', 'Integration updated successfully');
      
      return this.mapIntegration(updated);
    } catch (error: any) {
      throw new Error(`Failed to update integration: ${error.message}`);
    }
  }

  /**
   * Delete integration
   */
  async deleteIntegration(id: string): Promise<void> {
    try {
      await prisma.integration.delete({
        where: { id },
      });
      
      await this.logAction(id, 'delete', 'success', 'Integration deleted successfully');
    } catch (error: any) {
      throw new Error(`Failed to delete integration: ${error.message}`);
    }
  }

  /**
   * Test integration connection
   */
  async testConnection(id: string): Promise<{ success: boolean; message: string; details?: any }> {
    const startTime = Date.now();
    
    try {
      const integration = await this.getIntegration(id);
      if (!integration) {
        throw new Error('Integration not found');
      }

      // Test based on provider type
      let result;
      switch (integration.provider) {
        case 'shopify':
          result = await this.testShopify(integration.config);
          break;
        case 'woocommerce':
          result = await this.testWooCommerce(integration.config);
          break;
        case 'amazon':
          result = await this.testAmazon(integration.config);
          break;
        default:
          result = await this.testGenericAPI(integration.config);
      }

      const duration = Date.now() - startTime;
      await this.logAction(id, 'test', 'success', 'Connection test successful', { duration });

      return { success: true, message: 'Connection successful', details: result };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      await this.logAction(id, 'test', 'error', `Connection test failed: ${error.message}`, { duration });
      
      return { success: false, message: error.message };
    }
  }

  /**
   * Execute API call with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.delay(this.RETRY_DELAY_MS * (this.MAX_RETRIES - retries + 1));
        return this.executeWithRetry(fn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      return status === 429 || status === 503 || status === 504 || !status;
    }
    return false;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log integration action
   */
  async logAction(
    integrationId: string,
    action: string,
    status: 'success' | 'error' | 'warning',
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.integrationLog.create({
        data: {
          integrationId,
          action,
          status,
          message,
          details: details as any || {},
        },
      });
    } catch (error) {
      console.error('Failed to log integration action:', error);
    }
  }

  /**
   * Get integration logs
   */
  async getLogs(integrationId: string, limit: number = 50): Promise<IntegrationLog[]> {
    try {
      const logs = await prisma.integrationLog.findMany({
        where: { integrationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return logs.map(log => ({
        integrationId: log.integrationId,
        action: log.action,
        status: log.status as 'success' | 'error' | 'warning',
        message: log.message,
        details: log.details as Record<string, any>,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }
  }

  /**
   * Test Shopify connection
   */
  private async testShopify(config: any): Promise<any> {
    const { shopUrl, apiKey, apiPassword } = config;
    const url = `https://${shopUrl}/admin/api/2024-01/shop.json`;
    
    const response = await axios.get(url, {
      auth: { username: apiKey, password: apiPassword },
      timeout: 10000,
    });

    return response.data;
  }

  /**
   * Test WooCommerce connection
   */
  private async testWooCommerce(config: any): Promise<any> {
    const { siteUrl, consumerKey, consumerSecret } = config;
    const url = `${siteUrl}/wp-json/wc/v3/system_status`;
    
    const response = await axios.get(url, {
      auth: { username: consumerKey, password: consumerSecret },
      timeout: 10000,
    });

    return response.data;
  }

  /**
   * Test Amazon connection (mock for now)
   */
  private async testAmazon(config: any): Promise<any> {
    // Amazon SP-API is complex, mock for now
    return { status: 'connected', message: 'Mock Amazon connection' };
  }

  /**
   * Test generic API connection
   */
  private async testGenericAPI(config: any): Promise<any> {
    const { apiUrl, apiKey, authType } = config;
    
    const headers: any = {};
    if (authType === 'bearer') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (authType === 'apikey') {
      headers['X-API-Key'] = apiKey;
    }

    const response = await axios.get(apiUrl, { headers, timeout: 10000 });
    return response.data;
  }

  /**
   * Map database integration to interface
   */
  private mapIntegration(integration: any): IntegrationConfig {
    return {
      id: integration.id,
      name: integration.name,
      provider: integration.provider,
      type: integration.type,
      enabled: integration.enabled,
      config: integration.config,
      syncInterval: integration.syncInterval,
      lastSync: integration.lastSync,
      webhookUrl: integration.webhookUrl,
      webhookSecret: integration.webhookSecret,
    };
  }
}

export const integrationService = new IntegrationService();
