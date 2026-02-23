// Twilio SMS Service - LIVE INTEGRATION
// Created: 2026-02-23 by Boli (Backend Developer)
// Handles SMS sending via Twilio API

import twilio from 'twilio';

interface SMSOptions {
  to: string;
  message: string;
  from?: string;
}

interface SMSResult {
  success: boolean;
  messageSid?: string;
  status?: string;
  error?: string;
}

export class TwilioService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string;
  private isConfigured: boolean = false;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (accountSid && authToken && this.fromNumber) {
      try {
        this.client = twilio(accountSid, authToken);
        this.isConfigured = true;
        console.log('✅ Twilio Service initialized');
      } catch (error) {
        console.error('❌ Twilio initialization failed:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️  Twilio not configured - SMS features will use mock mode');
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendSMS(options: SMSOptions): Promise<SMSResult> {
    const { to, message, from } = options;
    const fromNumber = from || this.fromNumber;

    // MOCK mode if not configured
    if (!this.isConfigured || !this.client) {
      console.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
      return {
        success: true,
        messageSid: `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        status: 'sent',
      };
    }

    // LIVE mode - Real Twilio API call
    try {
      const result = await this.client.messages.create({
        body: message,
        from: fromNumber,
        to: to,
      });

      console.log(`✅ SMS sent successfully: ${result.sid}`);

      return {
        success: true,
        messageSid: result.sid,
        status: result.status,
      };
    } catch (error: any) {
      console.error('❌ Twilio SMS failed:', error.message);
      return {
        success: false,
        error: error.message || 'SMS send failed',
      };
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(messages: SMSOptions[]): Promise<SMSResult[]> {
    const results: SMSResult[] = [];

    for (const msg of messages) {
      const result = await this.sendSMS(msg);
      results.push(result);

      // Rate limiting - 1 message per 100ms
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageSid: string): Promise<any> {
    if (!this.isConfigured || !this.client) {
      return { status: 'delivered', error_code: null };
    }

    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        status: message.status,
        error_code: message.errorCode,
        error_message: message.errorMessage,
        date_sent: message.dateSent,
      };
    } catch (error: any) {
      console.error('Failed to fetch message status:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phone: string): boolean {
    // Basic E.164 format validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Format phone number to E.164
   */
  formatPhoneNumber(phone: string, countryCode: string = '+355'): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Add country code if not present
    if (!cleaned.startsWith(countryCode.replace('+', ''))) {
      // Remove leading zero if present (common in Albanian numbers)
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      cleaned = countryCode.replace('+', '') + cleaned;
    }

    return '+' + cleaned;
  }

  /**
   * Check if service is configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

export const twilioService = new TwilioService();
