// SendGrid Email Service - LIVE INTEGRATION
// Created: 2026-02-23 by Boli (Backend Developer)
// Handles email sending via SendGrid API

import sgMail from '@sendgrid/mail';

interface EmailOptions {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicData?: Record<string, any>;
  replyTo?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SendGridService {
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (apiKey) {
      try {
        sgMail.setApiKey(apiKey);
        this.isConfigured = true;
        console.log('✅ SendGrid Service initialized');
      } catch (error) {
        console.error('❌ SendGrid initialization failed:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️  SendGrid not configured - Email features will use mock mode');
    }
  }

  /**
   * Send email via SendGrid
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const { to, from, subject, text, html, templateId, dynamicData, replyTo } = options;

    // MOCK mode if not configured
    if (!this.isConfigured) {
      console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
      return {
        success: true,
        messageId: `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    }

    // LIVE mode - Real SendGrid API call
    try {
      const msg: any = {
        to,
        from,
        subject,
        replyTo,
      };

      if (templateId) {
        // Use template
        msg.templateId = templateId;
        msg.dynamicTemplateData = dynamicData || {};
      } else {
        // Use raw content
        if (html) msg.html = html;
        if (text) msg.text = text;
      }

      const [response] = await sgMail.send(msg);

      console.log(`✅ Email sent successfully: ${response.headers['x-message-id']}`);

      return {
        success: true,
        messageId: response.headers['x-message-id'] || 'unknown',
      };
    } catch (error: any) {
      console.error('❌ SendGrid email failed:', error.message);
      return {
        success: false,
        error: error.message || 'Email send failed',
      };
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);

      // Rate limiting - Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return results;
  }

  /**
   * Send email with template
   */
  async sendTemplateEmail(
    to: string,
    templateId: string,
    dynamicData: Record<string, any>,
    from: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to,
      from,
      subject: '', // Template has subject
      templateId,
      dynamicData,
    });
  }

  /**
   * Validate email address
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if service is configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

export const sendGridService = new SendGridService();
