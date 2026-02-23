// POS Schema Unit Tests
import { describe, it, expect } from 'vitest';
import { createTransactionSchema, transactionItemSchema, paymentSchema } from '../pos.schema';

describe('POS Schemas', () => {
  describe('transactionItemSchema', () => {
    const validProductId = '550e8400-e29b-41d4-a716-446655440000';

    it('should validate transaction item', () => {
      const validData = {
        productId: validProductId,
        quantity: 2,
        unitPrice: 10.50,
        taxRate: 20,
      };

      const result = transactionItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.discountAmount).toBe(0); // Default
      }
    });

    it('should reject negative quantity', () => {
      const invalidData = {
        productId: validProductId,
        quantity: -1,
        unitPrice: 10,
        taxRate: 20,
      };

      const result = transactionItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject tax rate over 100', () => {
      const invalidData = {
        productId: validProductId,
        quantity: 1,
        unitPrice: 10,
        taxRate: 150,
      };

      const result = transactionItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('paymentSchema', () => {
    it('should validate payment', () => {
      const validData = {
        paymentMethod: 'cash' as const,
        amount: 50.00,
      };

      const result = paymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate all payment methods', () => {
      const methods = ['cash', 'card', 'mobile', 'bank_transfer'] as const;
      
      methods.forEach(method => {
        const data = {
          paymentMethod: method,
          amount: 10,
        };
        const result = paymentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid payment method', () => {
      const invalidData = {
        paymentMethod: 'crypto',
        amount: 10,
      };

      const result = paymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const invalidData = {
        paymentMethod: 'cash' as const,
        amount: -10,
      };

      const result = paymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createTransactionSchema', () => {
    const validProductId = '550e8400-e29b-41d4-a716-446655440000';

    it('should validate complete transaction', () => {
      const validData = {
        locationId: 'loc-123',
        customerId: 'cust-123',
        items: [{
          productId: validProductId,
          quantity: 2,
          unitPrice: 10,
          taxRate: 20,
        }],
        payments: [{
          paymentMethod: 'cash' as const,
          amount: 50,
        }],
      };

      const result = createTransactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject transaction with no items', () => {
      const invalidData = {
        items: [],
        payments: [{
          paymentMethod: 'cash' as const,
          amount: 10,
        }],
      };

      const result = createTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one item');
      }
    });

    it('should reject transaction with no payments', () => {
      const invalidData = {
        items: [{
          productId: validProductId,
          quantity: 1,
          unitPrice: 10,
          taxRate: 20,
        }],
        payments: [],
      };

      const result = createTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message);
        expect(messages.some(m => m.includes('At least one payment'))).toBe(true);
      }
    });

    it('should allow optional locationId and customerId', () => {
      const validData = {
        items: [{
          productId: validProductId,
          quantity: 1,
          unitPrice: 10,
          taxRate: 20,
        }],
        payments: [{
          paymentMethod: 'card' as const,
          amount: 12,
        }],
      };

      const result = createTransactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
