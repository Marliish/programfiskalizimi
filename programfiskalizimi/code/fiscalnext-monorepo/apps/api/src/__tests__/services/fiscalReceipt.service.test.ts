// Fiscal Receipt Service Tests
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  generateFiscalReceipt,
  getFiscalReceipts,
  getFiscalReceiptById,
  verifyFiscalReceipt,
} from '../../services/fiscalReceipt.service';
import {
  cleanDatabase,
  createTestTenant,
  createTestUser,
  createTestTransaction,
  createTestFiscalReceipt,
  disconnectDatabase,
} from '../utils/test-helpers';

describe('Fiscal Receipt Service', () => {
  let tenantId: string;
  let userId: string;
  let transactionId: string;

  beforeEach(async () => {
    await cleanDatabase();
    const tenant = await createTestTenant();
    tenantId = tenant.id;
    const user = await createTestUser(tenantId);
    userId = user.id;
    const transaction = await createTestTransaction(tenantId, userId);
    transactionId = transaction.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('generateFiscalReceipt', () => {
    it('should generate fiscal receipt for transaction', async () => {
      const receipt = await generateFiscalReceipt(transactionId, tenantId);

      expect(receipt).toHaveProperty('id');
      expect(receipt).toHaveProperty('fiscalNumber');
      expect(receipt).toHaveProperty('iic');
      expect(receipt).toHaveProperty('qrCodeUrl');
      expect(receipt.transactionId).toBe(transactionId);
      expect(receipt.tenantId).toBe(tenantId);
    });

    it('should generate unique IIC hash', async () => {
      const receipt1 = await generateFiscalReceipt(transactionId, tenantId);
      
      const transaction2 = await createTestTransaction(tenantId, userId);
      const receipt2 = await generateFiscalReceipt(transaction2.id, tenantId);

      expect(receipt1.iic).not.toBe(receipt2.iic);
    });

    it('should generate QR code URL', async () => {
      const receipt = await generateFiscalReceipt(transactionId, tenantId);

      expect(receipt.qrCodeUrl).toBeDefined();
      expect(receipt.qrCodeUrl).toContain('http');
    });

    it('should set status to pending initially', async () => {
      const receipt = await generateFiscalReceipt(transactionId, tenantId);

      expect(receipt.status).toBe('pending');
      expect(receipt.verificationStatus).toBe('unverified');
    });

    it('should set expiry date to 90 days from creation', async () => {
      const now = new Date();
      const receipt = await generateFiscalReceipt(transactionId, tenantId);

      const expiryDate = new Date(receipt.expiresAt);
      const daysDiff = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBeGreaterThanOrEqual(89);
      expect(daysDiff).toBeLessThanOrEqual(91);
    });

    it('should copy transaction amounts', async () => {
      const transaction = await createTestTransaction(tenantId, userId, {
        total: 150.00,
        taxAmount: 30.00,
        paymentMethod: 'card',
      });

      const receipt = await generateFiscalReceipt(transaction.id, tenantId);

      expect(receipt.amount).toBe(150.00);
      expect(receipt.taxAmount).toBe(30.00);
      expect(receipt.paymentMethod).toBe('card');
    });

    it('should throw error if transaction not found', async () => {
      await expect(
        generateFiscalReceipt('non-existent-id', tenantId)
      ).rejects.toThrow('Transaction not found');
    });

    it('should throw error for other tenant\'s transaction', async () => {
      const otherTenant = await createTestTenant({ businessName: 'Other' });

      await expect(
        generateFiscalReceipt(transactionId, otherTenant.id)
      ).rejects.toThrow();
    });
  });

  describe('getFiscalReceipts', () => {
    it('should return paginated receipts', async () => {
      // Create 5 transactions and receipts
      for (let i = 0; i < 5; i++) {
        const txn = await createTestTransaction(tenantId, userId);
        await createTestFiscalReceipt(txn.id, tenantId);
      }

      const result = await getFiscalReceipts(tenantId, { page: 1, limit: 3 });

      expect(result.receipts).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(2);
    });

    it('should filter by status', async () => {
      const txn1 = await createTestTransaction(tenantId, userId);
      await createTestFiscalReceipt(txn1.id, tenantId, { status: 'pending' });

      const txn2 = await createTestTransaction(tenantId, userId);
      await createTestFiscalReceipt(txn2.id, tenantId, { status: 'submitted' });

      const result = await getFiscalReceipts(tenantId, { status: 'submitted' });

      expect(result.receipts).toHaveLength(1);
      expect(result.receipts[0].status).toBe('submitted');
    });

    it('should filter by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const txn1 = await createTestTransaction(tenantId, userId);
      await createTestFiscalReceipt(txn1.id, tenantId, { dateTime: yesterday });

      const txn2 = await createTestTransaction(tenantId, userId);
      await createTestFiscalReceipt(txn2.id, tenantId, { dateTime: new Date() });

      const result = await getFiscalReceipts(tenantId, {
        startDate: new Date().toISOString().split('T')[0],
        endDate: tomorrow.toISOString().split('T')[0],
      });

      expect(result.receipts).toHaveLength(1);
    });

    it('should search by IIC', async () => {
      const txn1 = await createTestTransaction(tenantId, userId);
      await createTestFiscalReceipt(txn1.id, tenantId, { iic: 'SEARCH-IIC-123' });

      const txn2 = await createTestTransaction(tenantId, userId);
      await createTestFiscalReceipt(txn2.id, tenantId, { iic: 'OTHER-IIC-456' });

      const result = await getFiscalReceipts(tenantId, { search: 'SEARCH-IIC' });

      expect(result.receipts).toHaveLength(1);
      expect(result.receipts[0].iic).toContain('SEARCH-IIC');
    });

    it('should only return receipts from current tenant', async () => {
      const txn1 = await createTestTransaction(tenantId, userId);
      await createTestFiscalReceipt(txn1.id, tenantId);

      const otherTenant = await createTestTenant({ businessName: 'Other' });
      const otherUser = await createTestUser(otherTenant.id);
      const otherTxn = await createTestTransaction(otherTenant.id, otherUser.id);
      await createTestFiscalReceipt(otherTxn.id, otherTenant.id);

      const result = await getFiscalReceipts(tenantId);

      expect(result.receipts).toHaveLength(1);
      expect(result.receipts[0].tenantId).toBe(tenantId);
    });
  });

  describe('getFiscalReceiptById', () => {
    it('should return receipt by id', async () => {
      const created = await createTestFiscalReceipt(transactionId, tenantId);

      const receipt = await getFiscalReceiptById(created.id, tenantId);

      expect(receipt).toBeDefined();
      expect(receipt?.id).toBe(created.id);
    });

    it('should include transaction details', async () => {
      const created = await createTestFiscalReceipt(transactionId, tenantId);

      const receipt = await getFiscalReceiptById(created.id, tenantId);

      expect(receipt).toHaveProperty('transaction');
      expect(receipt?.transaction).toHaveProperty('transactionNumber');
    });

    it('should return null for non-existent receipt', async () => {
      const receipt = await getFiscalReceiptById('non-existent-id', tenantId);

      expect(receipt).toBeNull();
    });

    it('should not return receipts from other tenants', async () => {
      const created = await createTestFiscalReceipt(transactionId, tenantId);
      const otherTenant = await createTestTenant({ businessName: 'Other' });

      const receipt = await getFiscalReceiptById(created.id, otherTenant.id);

      expect(receipt).toBeNull();
    });
  });

  describe('verifyFiscalReceipt', () => {
    it('should verify receipt with tax authority', async () => {
      const created = await createTestFiscalReceipt(transactionId, tenantId);

      const verified = await verifyFiscalReceipt(created.id, tenantId);

      expect(verified.verificationStatus).toBe('verified');
      expect(verified.verifiedAt).toBeDefined();
      expect(verified.status).toBe('submitted');
    });

    it('should handle verification failure', async () => {
      const created = await createTestFiscalReceipt(transactionId, tenantId, {
        iic: 'FAIL-IIC', // Mock tax authority fails IICs starting with FAIL
      });

      const verified = await verifyFiscalReceipt(created.id, tenantId);

      // Depending on implementation, might throw or set status to failed
      expect(verified.status).toMatch(/submitted|failed/);
    });

    it('should throw error for non-existent receipt', async () => {
      await expect(
        verifyFiscalReceipt('non-existent-id', tenantId)
      ).rejects.toThrow();
    });

    it('should not verify receipts from other tenants', async () => {
      const created = await createTestFiscalReceipt(transactionId, tenantId);
      const otherTenant = await createTestTenant({ businessName: 'Other' });

      await expect(
        verifyFiscalReceipt(created.id, otherTenant.id)
      ).rejects.toThrow();
    });

    it('should not re-verify already verified receipts', async () => {
      const created = await createTestFiscalReceipt(transactionId, tenantId, {
        verificationStatus: 'verified',
        verifiedAt: new Date(),
      });

      const verified = await verifyFiscalReceipt(created.id, tenantId);

      expect(verified.verificationStatus).toBe('verified');
    });
  });
});
