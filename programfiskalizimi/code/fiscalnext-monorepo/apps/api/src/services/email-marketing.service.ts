// Email Marketing Integration Service
// Mailchimp & SendGrid integrations
// Created: 2026-02-23 - Day 7 Integration

import { prisma } from '@fiscalnext/database';

interface MailchimpContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
}

interface SendGridEmail {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicData?: Record<string, any>;
}

interface CustomerSegment {
  name: string;
  criteria: {
    minSpent?: number;
    maxSpent?: number;
    lastPurchaseDays?: number;
    tags?: string[];
  };
}

export class EmailMarketingService {
  /**
   * Sync customers to Mailchimp (MOCK)
   */
  async syncToMailchimp(options?: {
    listId?: string;
    segmentId?: string;
    tags?: string[];
  }): Promise<any> {
    const customers = await prisma.customer.findMany({
      where: {
        email: { not: null },
      },
    });

    const contacts: MailchimpContact[] = customers
      .filter(c => c.email)
      .map(c => ({
        email: c.email!,
        firstName: c.name?.split(' ')[0],
        lastName: c.name?.split(' ').slice(1).join(' '),
        phone: c.phone || undefined,
        tags: options?.tags,
      }));

    // MOCK: Simulate Mailchimp API call
    await this.simulateNetworkDelay();

    console.log('[MOCK] Syncing to Mailchimp:', {
      listId: options?.listId || 'default',
      contactCount: contacts.length,
      tags: options?.tags,
    });

    return {
      success: true,
      listId: options?.listId || 'mock_list_123',
      synced: contacts.length,
      added: contacts.length,
      updated: 0,
      errors: 0,
      contacts: contacts.slice(0, 5), // Return sample
    };
  }

  /**
   * Create Mailchimp campaign (MOCK)
   */
  async createMailchimpCampaign(campaign: {
    listId: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    htmlContent: string;
    segmentId?: string;
  }): Promise<any> {
    await this.simulateNetworkDelay();

    console.log('[MOCK] Creating Mailchimp campaign:', campaign.subject);

    return {
      success: true,
      campaignId: `campaign_${this.generateId()}`,
      status: 'draft',
      recipientCount: 150,
      subject: campaign.subject,
      createdAt: new Date(),
    };
  }

  /**
   * Send transactional email via SendGrid (MOCK)
   */
  async sendTransactionalEmail(email: SendGridEmail): Promise<any> {
    await this.simulateNetworkDelay();

    console.log('[MOCK] Sending email via SendGrid:', {
      to: email.to,
      subject: email.subject,
      templateId: email.templateId,
    });

    // MOCK: 99% success rate
    const success = Math.random() > 0.01;

    return {
      success,
      messageId: `msg_${this.generateId()}`,
      to: email.to,
      subject: email.subject,
      status: success ? 'sent' : 'failed',
      sentAt: new Date(),
    };
  }

  /**
   * Send bulk emails via SendGrid (MOCK)
   */
  async sendBulkEmails(emails: SendGridEmail[]): Promise<any> {
    await this.simulateNetworkDelay();

    console.log('[MOCK] Sending bulk emails via SendGrid:', emails.length);

    const results = emails.map(email => ({
      to: email.to,
      messageId: `msg_${this.generateId()}`,
      status: Math.random() > 0.02 ? 'sent' : 'failed',
    }));

    const sent = results.filter(r => r.status === 'sent').length;
    const failed = results.length - sent;

    return {
      success: true,
      total: emails.length,
      sent,
      failed,
      results: results.slice(0, 10), // Return sample
    };
  }

  /**
   * Export customer segment to CSV
   */
  async exportSegment(segment: CustomerSegment): Promise<any[]> {
    // Build query based on segment criteria
    const customers = await prisma.customer.findMany({
      where: {
        email: { not: null },
      },
    });

    // Apply segment filters (simplified - in production, use proper aggregations)
    const filtered = customers.filter(customer => {
      // Placeholder: would need to calculate from transactions
      return true;
    });

    return filtered.map(c => ({
      email: c.email,
      name: c.name,
      phone: c.phone,
      city: c.city,
      createdAt: c.createdAt,
    }));
  }

  /**
   * Create automated email campaign
   */
  async createAutomatedCampaign(config: {
    name: string;
    trigger: 'welcome' | 'abandoned_cart' | 'post_purchase' | 'birthday';
    delayHours?: number;
    templateId: string;
    segmentId?: string;
  }): Promise<any> {
    await this.simulateNetworkDelay();

    console.log('[MOCK] Creating automated campaign:', config.name);

    return {
      success: true,
      campaignId: `auto_${this.generateId()}`,
      name: config.name,
      trigger: config.trigger,
      status: 'active',
      delayHours: config.delayHours || 0,
      templateId: config.templateId,
      createdAt: new Date(),
    };
  }

  /**
   * Get email campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<any> {
    // MOCK: Return sample statistics
    return {
      campaignId,
      sent: 1523,
      delivered: 1498,
      opened: 645,
      clicked: 123,
      bounced: 25,
      unsubscribed: 8,
      openRate: 43.1,
      clickRate: 8.2,
      bounceRate: 1.6,
      lastUpdated: new Date(),
    };
  }

  /**
   * Send welcome email to new customer
   */
  async sendWelcomeEmail(customerId: string): Promise<any> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer?.email) {
      throw new Error('Customer email not found');
    }

    return await this.sendTransactionalEmail({
      to: customer.email,
      from: 'noreply@fiscalnext.com',
      subject: 'Welcome to FiscalNext!',
      html: `
        <h1>Welcome ${customer.name}!</h1>
        <p>Thank you for choosing FiscalNext POS system.</p>
        <p>We're excited to have you on board!</p>
      `,
    });
  }

  /**
   * Send receipt email
   */
  async sendReceiptEmail(receiptId: string): Promise<any> {
    const receipt = await prisma.fiscalReceipt.findUnique({
      where: { id: receiptId },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!receipt?.customer?.email) {
      throw new Error('Customer email not found');
    }

    const itemsHtml = receipt.items
      .map(
        item => `
        <tr>
          <td>${item.product?.name || item.name}</td>
          <td>${item.quantity}</td>
          <td>${item.price} ALL</td>
          <td>${item.total} ALL</td>
        </tr>
      `
      )
      .join('');

    return await this.sendTransactionalEmail({
      to: receipt.customer.email,
      from: 'receipts@fiscalnext.com',
      subject: `Receipt #${receipt.receiptNumber}`,
      html: `
        <h1>Receipt #${receipt.receiptNumber}</h1>
        <p>Thank you for your purchase!</p>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3"><strong>Total:</strong></td>
              <td><strong>${receipt.total} ALL</strong></td>
            </tr>
          </tfoot>
        </table>
        <p>Date: ${new Date(receipt.createdAt).toLocaleString()}</p>
      `,
    });
  }

  /**
   * Get list of email templates
   */
  async getEmailTemplates(): Promise<any[]> {
    return [
      {
        id: 'tpl_welcome',
        name: 'Welcome Email',
        description: 'Sent to new customers',
        type: 'transactional',
        active: true,
      },
      {
        id: 'tpl_receipt',
        name: 'Receipt Email',
        description: 'Sent after purchase',
        type: 'transactional',
        active: true,
      },
      {
        id: 'tpl_newsletter',
        name: 'Monthly Newsletter',
        description: 'Monthly updates and offers',
        type: 'marketing',
        active: true,
      },
      {
        id: 'tpl_promo',
        name: 'Promotional Offer',
        description: 'Special offers and discounts',
        type: 'marketing',
        active: true,
      },
    ];
  }

  // Private helper methods

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private async simulateNetworkDelay(): Promise<void> {
    const delay = 100 + Math.random() * 300;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
