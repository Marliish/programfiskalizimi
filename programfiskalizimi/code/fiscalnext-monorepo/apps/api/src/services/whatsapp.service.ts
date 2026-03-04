// WhatsApp Service - Send receipts via Twilio WhatsApp API
import twilio from 'twilio';

interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string; // Twilio WhatsApp number (e.g., 'whatsapp:+14155238886')
}

interface ReceiptMessage {
  to: string; // Customer phone (e.g., '+355691234567')
  businessName: string;
  transactionNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  paymentMethod: string;
  currency: string;
  fiscalCode?: string;
}

class WhatsAppService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string = '';
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (accountSid && authToken && fromNumber) {
      this.client = twilio(accountSid, authToken);
      this.fromNumber = fromNumber.startsWith('whatsapp:') 
        ? fromNumber 
        : `whatsapp:${fromNumber}`;
      this.isConfigured = true;
      console.log('✅ WhatsApp service initialized');
    } else {
      console.log('⚠️  WhatsApp not configured - Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER');
    }
  }

  // Check if service is configured
  isEnabled(): boolean {
    return this.isConfigured;
  }

  // Format phone number for WhatsApp
  private formatPhoneNumber(phone: string): string {
    // Remove spaces, dashes, etc.
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Add country code if missing (default to Albania +355)
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('0')) {
        cleaned = '+355' + cleaned.substring(1);
      } else if (cleaned.startsWith('355')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+355' + cleaned;
      }
    }
    
    return `whatsapp:${cleaned}`;
  }

  // Format currency
  private formatCurrency(amount: number, currency: string): string {
    const symbols: Record<string, string> = {
      'ALL': 'L',
      'EUR': '€',
      'USD': '$',
    };
    const symbol = symbols[currency] || currency;
    return `${symbol}${(Number(amount) || 0).toFixed(2)}`;
  }

  // Generate receipt message
  private generateReceiptMessage(data: ReceiptMessage): string {
    const lines: string[] = [];
    const divider = '─'.repeat(28);
    
    // Header
    lines.push(`🧾 *${data.businessName}*`);
    lines.push('');
    lines.push(divider);
    lines.push(`📋 *Faturë #${data.transactionNumber}*`);
    lines.push(`📅 ${new Date().toLocaleDateString('sq-AL')} ${new Date().toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}`);
    lines.push('');
    lines.push(divider);
    
    // Items
    lines.push('*ARTIKUJT:*');
    data.items.forEach((item) => {
      lines.push(`• ${item.name}`);
      lines.push(`  ${item.quantity} x ${this.formatCurrency(item.unitPrice, data.currency)} = ${this.formatCurrency(item.total, data.currency)}`);
    });
    lines.push('');
    lines.push(divider);
    
    // Totals
    lines.push(`Nëntotali: ${this.formatCurrency(data.subtotal, data.currency)}`);
    lines.push(`TVSH (${data.taxRate}%): ${this.formatCurrency(data.taxAmount, data.currency)}`);
    lines.push('');
    lines.push(`*TOTALI: ${this.formatCurrency(data.total, data.currency)}*`);
    lines.push('');
    
    // Payment
    lines.push(divider);
    const paymentEmoji = data.paymentMethod === 'cash' ? '💵' : '💳';
    lines.push(`${paymentEmoji} Pagesa: ${data.paymentMethod === 'cash' ? 'Para në dorë' : 'Kartë'}`);
    
    // Fiscal code
    if (data.fiscalCode) {
      lines.push('');
      lines.push(`🔐 Kodi Fiskal: ${data.fiscalCode}`);
    }
    
    // Footer
    lines.push('');
    lines.push(divider);
    lines.push('✅ *Faleminderit për blerjen!*');
    
    return lines.join('\n');
  }

  // Send receipt via WhatsApp
  async sendReceipt(data: ReceiptMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured || !this.client) {
      return { success: false, error: 'WhatsApp service not configured' };
    }

    try {
      const toNumber = this.formatPhoneNumber(data.to);
      const message = this.generateReceiptMessage(data);

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: toNumber,
      });

      console.log(`📱 WhatsApp receipt sent to ${data.to}: ${result.sid}`);
      
      return { 
        success: true, 
        messageId: result.sid 
      };
    } catch (error: any) {
      console.error('Failed to send WhatsApp receipt:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send WhatsApp message' 
      };
    }
  }

  // Send custom message
  async sendMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured || !this.client) {
      return { success: false, error: 'WhatsApp service not configured' };
    }

    try {
      const toNumber = this.formatPhoneNumber(to);

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: toNumber,
      });

      return { success: true, messageId: result.sid };
    } catch (error: any) {
      console.error('Failed to send WhatsApp message:', error);
      return { success: false, error: error.message };
    }
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
