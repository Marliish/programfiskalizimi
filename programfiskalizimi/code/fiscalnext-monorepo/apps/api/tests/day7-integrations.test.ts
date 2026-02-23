// Day 7 Integration Tests
// Tests for exports, payments, email marketing, barcodes, and backups
// Created: 2026-02-23

import { describe, it, expect, beforeAll } from 'vitest';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

describe('Day 7 Integrations', () => {
  describe('Accounting Exports', () => {
    it('should export to QuickBooks IIF format', async () => {
      const response = await fetch(`${API_BASE}/v1/exports/quickbooks`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/plain');
      const content = await response.text();
      expect(content).toContain('!ACCNT');
    });

    it('should export to Xero CSV format', async () => {
      const response = await fetch(`${API_BASE}/v1/exports/xero`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/csv');
    });

    it('should export to generic accounting CSV', async () => {
      const response = await fetch(`${API_BASE}/v1/exports/generic`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/csv');
    });

    it('should export customers to CSV', async () => {
      const response = await fetch(`${API_BASE}/v1/exports/customers`);
      expect(response.status).toBe(200);
      const content = await response.text();
      expect(content).toContain('ID');
      expect(content).toContain('Name');
    });

    it('should export products to CSV', async () => {
      const response = await fetch(`${API_BASE}/v1/exports/products`);
      expect(response.status).toBe(200);
      const content = await response.text();
      expect(content).toContain('SKU');
      expect(content).toContain('Price');
    });

    it('should list available export formats', async () => {
      const response = await fetch(`${API_BASE}/v1/exports/formats`);
      const data = await response.json();
      expect(data.formats).toBeDefined();
      expect(data.formats.length).toBeGreaterThan(0);
    });
  });

  describe('Payment Gateways (MOCK)', () => {
    it('should process Stripe payment', async () => {
      const response = await fetch(`${API_BASE}/v1/payments/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 5000,
          currency: 'ALL',
          description: 'Test payment',
        }),
      });
      const data = await response.json();
      expect(response.status).toBeLessThan(500);
      expect(data.payment).toBeDefined();
    });

    it('should process PayPal payment', async () => {
      const response = await fetch(`${API_BASE}/v1/payments/paypal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 3000,
          currency: 'ALL',
        }),
      });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should process Square payment', async () => {
      const response = await fetch(`${API_BASE}/v1/payments/square`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 2500,
          currency: 'ALL',
        }),
      });
      const data = await response.json();
      expect(response.status).toBeLessThan(500);
      expect(data.payment).toBeDefined();
    });

    it('should process refund', async () => {
      const response = await fetch(`${API_BASE}/v1/payments/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: 'pay_123',
          amount: 1000,
          reason: 'customer_request',
        }),
      });
      const data = await response.json();
      expect(data.refund).toBeDefined();
    });

    it('should handle Stripe webhook', async () => {
      const response = await fetch(`${API_BASE}/v1/payments/webhooks/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment.succeeded',
          data: { id: 'evt_123' },
        }),
      });
      const data = await response.json();
      expect(data.received).toBe(true);
    });

    it('should get payment statistics', async () => {
      const response = await fetch(`${API_BASE}/v1/payments/stats/overview`);
      const data = await response.json();
      expect(data.stats).toBeDefined();
      expect(data.stats.stripe).toBeDefined();
      expect(data.stats.paypal).toBeDefined();
      expect(data.stats.square).toBeDefined();
    });

    it('should list available payment gateways', async () => {
      const response = await fetch(`${API_BASE}/v1/payments/gateways/list`);
      const data = await response.json();
      expect(data.gateways).toBeDefined();
      expect(data.gateways.length).toBe(3);
    });
  });

  describe('Email Marketing', () => {
    it('should sync customers to Mailchimp', async () => {
      const response = await fetch(`${API_BASE}/v1/email-marketing/mailchimp/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: 'test_list',
          tags: ['pos-customers'],
        }),
      });
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.synced).toBeGreaterThanOrEqual(0);
    });

    it('should create Mailchimp campaign', async () => {
      const response = await fetch(`${API_BASE}/v1/email-marketing/mailchimp/campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: 'test_list',
          subject: 'Special Offer',
          fromName: 'FiscalNext',
          fromEmail: 'marketing@fiscalnext.com',
          htmlContent: '<h1>Special Offer</h1>',
        }),
      });
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.campaignId).toBeDefined();
    });

    it('should send transactional email via SendGrid', async () => {
      const response = await fetch(`${API_BASE}/v1/email-marketing/sendgrid/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'test@example.com',
          from: 'noreply@fiscalnext.com',
          subject: 'Test Email',
          html: '<p>Test email content</p>',
        }),
      });
      const data = await response.json();
      expect(data.success).toBeTruthy();
      expect(data.messageId).toBeDefined();
    });

    it('should create automated campaign', async () => {
      const response = await fetch(`${API_BASE}/v1/email-marketing/campaign/automated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Welcome Series',
          trigger: 'welcome',
          templateId: 'tpl_welcome',
          delayHours: 0,
        }),
      });
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.campaignId).toBeDefined();
    });

    it('should list email templates', async () => {
      const response = await fetch(`${API_BASE}/v1/email-marketing/templates`);
      const data = await response.json();
      expect(data.templates).toBeDefined();
      expect(data.templates.length).toBeGreaterThan(0);
    });
  });

  describe('Barcode & Printer', () => {
    it('should generate EAN-13 barcode', async () => {
      const response = await fetch(`${API_BASE}/v1/barcode-printer/barcode/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ean13',
          data: '1234567890128',
        }),
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image/png');
    });

    it('should generate Code128 barcode', async () => {
      const response = await fetch(`${API_BASE}/v1/barcode-printer/barcode/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'code128',
          data: 'ABC123',
        }),
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image/png');
    });

    it('should generate QR code', async () => {
      const response = await fetch(`${API_BASE}/v1/barcode-printer/barcode/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'qr',
          data: 'https://fiscalnext.com/receipt/123',
        }),
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image/png');
    });

    it('should generate barcode as data URL', async () => {
      const response = await fetch(`${API_BASE}/v1/barcode-printer/barcode/dataurl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'qr',
          data: 'TEST123',
        }),
      });
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.dataUrl).toContain('data:image/png;base64,');
    });

    it('should list configured printers', async () => {
      const response = await fetch(`${API_BASE}/v1/barcode-printer/printer/list`);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.printers).toBeDefined();
      expect(Array.isArray(data.printers)).toBe(true);
    });

    it('should configure printer', async () => {
      const response = await fetch(`${API_BASE}/v1/barcode-printer/printer/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'test-printer',
          type: 'receipt',
          connection: 'usb',
          paperWidth: 80,
        }),
      });
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Backup & Restore', () => {
    it('should create backup', async () => {
      const response = await fetch(`${API_BASE}/v1/backup/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeUploads: false,
          compress: true,
        }),
      });
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.backup).toBeDefined();
      expect(data.backup.id).toBeDefined();
    });

    it('should list backups', async () => {
      const response = await fetch(`${API_BASE}/v1/backup/list`);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.backups).toBeDefined();
      expect(Array.isArray(data.backups)).toBe(true);
    });

    it('should get backup statistics', async () => {
      const response = await fetch(`${API_BASE}/v1/backup/stats`);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.stats).toBeDefined();
    });

    it('should schedule automatic backups', async () => {
      const response = await fetch(`${API_BASE}/v1/backup/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule: 'daily',
        }),
      });
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.schedule).toBe('daily');
    });

    it('should clean old backups', async () => {
      const response = await fetch(`${API_BASE}/v1/backup/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keepCount: 5,
        }),
      });
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
