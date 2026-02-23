// SMS & WhatsApp Integration Service - Twilio
import axios from 'axios';
import { integrationService } from './integration.service';

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string[];
}

export interface WhatsAppMessage {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string[];
  templateId?: string;
  templateData?: Record<string, string>;
}

export class SMSService {
  private accountSid: string | null = null;
  private authToken: string | null = null;
  private fromNumber: string | null = null;
  private whatsappNumber: string | null = null;

  /**
   * Initialize Twilio client
   */
  async initialize(integrationId: string): Promise<void> {
    const integration = await integrationService.getIntegration(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    const config = integration.config;
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.fromNumber = config.fromNumber;
    this.whatsappNumber = config.whatsappNumber;
  }

  /**
   * Send SMS
   */
  async sendSMS(integrationId: string, message: SMSMessage): Promise<any> {
    await this.initialize(integrationId);

    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        new URLSearchParams({
          To: message.to,
          From: message.from || this.fromNumber!,
          Body: message.body,
          ...(message.mediaUrl && { MediaUrl: message.mediaUrl.join(',') }),
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      await integrationService.logAction(
        integrationId,
        'send_sms',
        'success',
        `SMS sent to ${message.to}`,
        { sid: response.data.sid }
      );

      return response.data;
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'send_sms',
        'error',
        `Failed to send SMS: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(integrationId: string, message: WhatsAppMessage): Promise<any> {
    await this.initialize(integrationId);

    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      
      const from = `whatsapp:${message.from || this.whatsappNumber}`;
      const to = message.to.startsWith('whatsapp:') ? message.to : `whatsapp:${message.to}`;

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        new URLSearchParams({
          To: to,
          From: from,
          Body: message.body,
          ...(message.mediaUrl && { MediaUrl: message.mediaUrl.join(',') }),
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      await integrationService.logAction(
        integrationId,
        'send_whatsapp',
        'success',
        `WhatsApp message sent to ${message.to}`,
        { sid: response.data.sid }
      );

      return response.data;
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'send_whatsapp',
        'error',
        `Failed to send WhatsApp message: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Send order notification via SMS
   */
  async sendOrderNotification(
    integrationId: string,
    phoneNumber: string,
    order: {
      orderId: string;
      total: number;
      status: string;
    }
  ): Promise<void> {
    const message = `
Your order #${order.orderId} has been ${order.status}.
Total: €${order.total.toFixed(2)}
Thank you for your purchase!
    `.trim();

    await this.sendSMS(integrationId, {
      to: phoneNumber,
      body: message,
    });
  }

  /**
   * Send order notification via WhatsApp
   */
  async sendWhatsAppOrderNotification(
    integrationId: string,
    phoneNumber: string,
    order: {
      orderId: string;
      total: number;
      status: string;
      trackingUrl?: string;
    }
  ): Promise<void> {
    let message = `
🛍️ *Order Update*

Order #: ${order.orderId}
Status: ${order.status}
Total: €${order.total.toFixed(2)}
    `.trim();

    if (order.trackingUrl) {
      message += `\n\nTrack your order: ${order.trackingUrl}`;
    }

    await this.sendWhatsApp(integrationId, {
      to: phoneNumber,
      body: message,
    });
  }

  /**
   * Send promotional SMS campaign
   */
  async sendCampaign(
    integrationId: string,
    recipients: string[],
    message: string
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    await this.initialize(integrationId);

    const results = { sent: 0, failed: 0, errors: [] };

    for (const recipient of recipients) {
      try {
        await this.sendSMS(integrationId, {
          to: recipient,
          body: message,
        });
        results.sent++;
        
        // Rate limiting - wait 1 second between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.failed++;
        results.errors.push(`${recipient}: ${error.message}`);
      }
    }

    await integrationService.logAction(
      integrationId,
      'send_campaign',
      results.failed === 0 ? 'success' : 'warning',
      `Campaign sent to ${results.sent}/${recipients.length} recipients`,
      results
    );

    return results;
  }

  /**
   * Send delivery notification
   */
  async sendDeliveryNotification(
    integrationId: string,
    phoneNumber: string,
    delivery: {
      orderId: string;
      estimatedTime: string;
      driverName?: string;
      trackingUrl?: string;
    },
    channel: 'sms' | 'whatsapp' = 'sms'
  ): Promise<void> {
    let message = `
📦 Your order #${delivery.orderId} is out for delivery!
⏰ Estimated arrival: ${delivery.estimatedTime}
    `.trim();

    if (delivery.driverName) {
      message += `\n👤 Driver: ${delivery.driverName}`;
    }

    if (delivery.trackingUrl) {
      message += `\n🔗 Track: ${delivery.trackingUrl}`;
    }

    if (channel === 'whatsapp') {
      await this.sendWhatsApp(integrationId, {
        to: phoneNumber,
        body: message,
      });
    } else {
      await this.sendSMS(integrationId, {
        to: phoneNumber,
        body: message,
      });
    }
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    integrationId: string,
    phoneNumber: string,
    appointment: {
      date: string;
      time: string;
      service: string;
      location: string;
    }
  ): Promise<void> {
    const message = `
📅 Appointment Reminder

Service: ${appointment.service}
Date: ${appointment.date}
Time: ${appointment.time}
Location: ${appointment.location}

Reply CONFIRM to confirm or CANCEL to reschedule.
    `.trim();

    await this.sendSMS(integrationId, {
      to: phoneNumber,
      body: message,
    });
  }

  /**
   * Send discount code
   */
  async sendDiscountCode(
    integrationId: string,
    phoneNumber: string,
    discount: {
      code: string;
      percent: number;
      expiresAt: Date;
    },
    channel: 'sms' | 'whatsapp' = 'sms'
  ): Promise<void> {
    const message = `
🎉 Special Offer Just for You!

Get ${discount.percent}% OFF your next purchase!

Code: ${discount.code}
Valid until: ${discount.expiresAt.toLocaleDateString()}

Shop now and save!
    `.trim();

    if (channel === 'whatsapp') {
      await this.sendWhatsApp(integrationId, {
        to: phoneNumber,
        body: message,
      });
    } else {
      await this.sendSMS(integrationId, {
        to: phoneNumber,
        body: message,
      });
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(integrationId: string, messageSid: string): Promise<any> {
    await this.initialize(integrationId);

    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      
      const response = await axios.get(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages/${messageSid}.json`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get message status: ${error.message}`);
    }
  }
}

export const smsService = new SMSService();
