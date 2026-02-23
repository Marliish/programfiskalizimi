// Slack Integration Service
import axios, { AxiosInstance } from 'axios';
import { integrationService } from './integration.service';

export interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: any[];
  attachments?: any[];
  threadTs?: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
}

export class SlackService {
  private client: AxiosInstance | null = null;
  private webhookUrl: string | null = null;

  /**
   * Initialize Slack client
   */
  async initialize(integrationId: string): Promise<void> {
    const integration = await integrationService.getIntegration(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    const config = integration.config;

    if (config.webhookUrl) {
      this.webhookUrl = config.webhookUrl;
    }

    if (config.botToken) {
      this.client = axios.create({
        baseURL: 'https://slack.com/api',
        headers: {
          'Authorization': `Bearer ${config.botToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }
  }

  /**
   * Send notification to Slack
   */
  async sendNotification(
    integrationId: string,
    channel: string,
    message: string,
    options?: {
      title?: string;
      color?: string;
      fields?: Array<{ title: string; value: string; short?: boolean }>;
    }
  ): Promise<void> {
    await this.initialize(integrationId);

    try {
      if (this.webhookUrl) {
        // Use webhook for simple messages
        await axios.post(this.webhookUrl, {
          channel,
          text: message,
          attachments: options ? [{
            color: options.color || 'good',
            title: options.title,
            text: message,
            fields: options.fields,
          }] : undefined,
        });
      } else if (this.client) {
        // Use bot token
        await this.client.post('/chat.postMessage', {
          channel,
          text: message,
          attachments: options ? [{
            color: options.color || 'good',
            title: options.title,
            text: message,
            fields: options.fields,
          }] : undefined,
        });
      }

      await integrationService.logAction(
        integrationId,
        'send_notification',
        'success',
        'Notification sent to Slack'
      );
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'send_notification',
        'error',
        `Failed to send notification: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Send sales notification
   */
  async sendSalesNotification(
    integrationId: string,
    channel: string,
    sale: {
      orderId: string;
      total: number;
      items: number;
      customer?: string;
    }
  ): Promise<void> {
    const message = `💰 New Sale: ${sale.orderId}`;
    
    await this.sendNotification(integrationId, channel, message, {
      title: 'New Sale',
      color: 'good',
      fields: [
        { title: 'Order ID', value: sale.orderId, short: true },
        { title: 'Total', value: `€${sale.total.toFixed(2)}`, short: true },
        { title: 'Items', value: sale.items.toString(), short: true },
        { title: 'Customer', value: sale.customer || 'Walk-in', short: true },
      ],
    });
  }

  /**
   * Send low stock alert
   */
  async sendLowStockAlert(
    integrationId: string,
    channel: string,
    products: Array<{ name: string; sku: string; quantity: number; threshold: number }>
  ): Promise<void> {
    const message = `⚠️ Low Stock Alert - ${products.length} products below threshold`;
    
    const fields = products.slice(0, 10).map(p => ({
      title: p.name,
      value: `SKU: ${p.sku} | Qty: ${p.quantity} (threshold: ${p.threshold})`,
      short: false,
    }));

    await this.sendNotification(integrationId, channel, message, {
      title: 'Low Stock Alert',
      color: 'warning',
      fields,
    });
  }

  /**
   * Send daily summary
   */
  async sendDailySummary(
    integrationId: string,
    channel: string,
    summary: {
      sales: number;
      revenue: number;
      transactions: number;
      topProducts: Array<{ name: string; quantity: number }>;
    }
  ): Promise<void> {
    const message = `📊 Daily Summary - ${new Date().toLocaleDateString()}`;
    
    const topProducts = summary.topProducts.slice(0, 5).map((p, i) => 
      `${i + 1}. ${p.name} (${p.quantity} sold)`
    ).join('\n');

    const fields = [
      { title: 'Total Sales', value: summary.sales.toString(), short: true },
      { title: 'Revenue', value: `€${summary.revenue.toFixed(2)}`, short: true },
      { title: 'Transactions', value: summary.transactions.toString(), short: true },
      { title: 'Top Products', value: topProducts || 'None', short: false },
    ];

    await this.sendNotification(integrationId, channel, message, {
      title: 'Daily Summary Report',
      color: '#4285F4',
      fields,
    });
  }

  /**
   * Handle slash commands
   */
  async handleCommand(
    integrationId: string,
    command: string,
    args: string[],
    userId: string
  ): Promise<string> {
    try {
      let response: string;

      switch (command) {
        case '/sales':
          response = await this.handleSalesCommand(args);
          break;
        case '/inventory':
          response = await this.handleInventoryCommand(args);
          break;
        case '/reports':
          response = await this.handleReportsCommand(args);
          break;
        default:
          response = `Unknown command: ${command}`;
      }

      await integrationService.logAction(
        integrationId,
        'handle_command',
        'success',
        `Command executed: ${command}`
      );

      return response;
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'handle_command',
        'error',
        `Command failed: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Handle /sales command
   */
  private async handleSalesCommand(args: string[]): Promise<string> {
    // Mock implementation - would integrate with analytics service
    return `
📈 Sales Overview (Today)
━━━━━━━━━━━━━━━━━━━
💰 Revenue: €2,450.00
📦 Orders: 34
🛒 Avg Order: €72.06
📊 Top Product: Coffee Beans (12 sold)
    `.trim();
  }

  /**
   * Handle /inventory command
   */
  private async handleInventoryCommand(args: string[]): Promise<string> {
    // Mock implementation
    return `
📦 Inventory Status
━━━━━━━━━━━━━━━━━
⚠️ Low Stock: 5 items
✅ In Stock: 234 items
❌ Out of Stock: 3 items
📈 Reorder Needed: 8 items
    `.trim();
  }

  /**
   * Handle /reports command
   */
  private async handleReportsCommand(args: string[]): Promise<string> {
    // Mock implementation
    return `
📊 Available Reports
━━━━━━━━━━━━━━━━━
1. Sales Report (daily/weekly/monthly)
2. Inventory Report
3. Customer Report
4. Tax Report

Usage: /reports [type] [period]
Example: /reports sales weekly
    `.trim();
  }

  /**
   * Get channels
   */
  async getChannels(integrationId: string): Promise<SlackChannel[]> {
    await this.initialize(integrationId);

    if (!this.client) {
      throw new Error('Slack bot token not configured');
    }

    try {
      const response = await this.client.post('/conversations.list', {
        types: 'public_channel,private_channel',
      });

      return response.data.channels.map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        isPrivate: ch.is_private,
      }));
    } catch (error) {
      throw new Error(`Failed to get channels: ${error.message}`);
    }
  }
}

export const slackService = new SlackService();
