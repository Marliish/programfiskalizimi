// Product Schema Unit Tests
import { describe, it, expect } from 'vitest';
import { createProductSchema, adjustStockSchema } from '../product.schema';

describe('Product Schemas', () => {
  describe('createProductSchema', () => {
    it('should validate minimal product data', () => {
      const validData = {
        name: 'Test Product',
        sellingPrice: 10.99,
      };

      const result = createProductSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Product');
        expect(result.data.sellingPrice).toBe(10.99);
        expect(result.data.taxRate).toBe(20); // Default
        expect(result.data.unit).toBe('pieces'); // Default
      }
    });

    it('should validate complete product data', () => {
      const validData = {
        name: 'Coffee',
        description: 'Premium coffee',
        sku: 'COF-001',
        barcode: '123456789',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        costPrice: 5.00,
        sellingPrice: 10.00,
        taxRate: 18,
        unit: 'kg',
        trackInventory: true,
        imageUrl: 'https://example.com/coffee.jpg',
      };

      const result = createProductSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative selling price', () => {
      const invalidData = {
        name: 'Test Product',
        sellingPrice: -10,
      };

      const result = createProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject tax rate over 100', () => {
      const invalidData = {
        name: 'Test Product',
        sellingPrice: 10,
        taxRate: 150,
      };

      const result = createProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid image URL', () => {
      const invalidData = {
        name: 'Test Product',
        sellingPrice: 10,
        imageUrl: 'not-a-url',
      };

      const result = createProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('adjustStockSchema', () => {
    it('should validate stock adjustment', () => {
      const validData = {
        productId: 'prod-123',
        quantity: 50,
        type: 'in' as const,
      };

      const result = adjustStockSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative quantity', () => {
      const invalidData = {
        productId: 'prod-123',
        quantity: -10,
        type: 'in' as const,
      };

      const result = adjustStockSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid type', () => {
      const invalidData = {
        productId: 'prod-123',
        quantity: 10,
        type: 'invalid',
      };

      const result = adjustStockSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow optional locationId and notes', () => {
      const validData = {
        productId: 'prod-123',
        locationId: 'loc-123',
        quantity: 10,
        type: 'adjustment' as const,
        notes: 'Stock check',
      };

      const result = adjustStockSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
