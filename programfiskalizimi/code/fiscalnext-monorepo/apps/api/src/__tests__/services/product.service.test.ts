// Product Service Tests
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
} from '../../services/product.service';
import {
  cleanDatabase,
  createTestTenant,
  createTestCategory,
  createTestProduct,
  disconnectDatabase,
  randomString,
} from '../utils/test-helpers';

describe('Product Service', () => {
  let tenantId: string;
  let categoryId: string;

  beforeEach(async () => {
    await cleanDatabase();
    const tenant = await createTestTenant();
    tenantId = tenant.id;
    const category = await createTestCategory(tenantId);
    categoryId = category.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'Test Product',
        sku: `SKU-${randomString()}`,
        price: 100.00,
        categoryId,
        tenantId,
      };

      const product = await createProduct(productData);

      expect(product).toHaveProperty('id');
      expect(product.name).toBe('Test Product');
      expect(product.price).toBe(100.00);
      expect(product.categoryId).toBe(categoryId);
    });

    it('should throw error if SKU already exists', async () => {
      const sku = `SKU-${randomString()}`;
      await createTestProduct(tenantId, categoryId, { sku });

      await expect(
        createProduct({
          name: 'Duplicate SKU Product',
          sku,
          price: 100.00,
          categoryId,
          tenantId,
        })
      ).rejects.toThrow();
    });

    it('should set default values for optional fields', async () => {
      const product = await createProduct({
        name: 'Minimal Product',
        sku: `SKU-${randomString()}`,
        price: 50.00,
        categoryId,
        tenantId,
      });

      expect(product.stock).toBeDefined();
      expect(product.isActive).toBe(true);
      expect(product.taxRate).toBeDefined();
    });

    it('should accept all optional fields', async () => {
      const product = await createProduct({
        name: 'Full Product',
        sku: `SKU-${randomString()}`,
        barcode: `BAR-${randomString()}`,
        description: 'Detailed description',
        price: 100.00,
        cost: 50.00,
        stock: 200,
        minStock: 20,
        unit: 'kg',
        taxRate: 18.00,
        categoryId,
        tenantId,
      });

      expect(product.description).toBe('Detailed description');
      expect(product.cost).toBe(50.00);
      expect(product.stock).toBe(200);
      expect(product.minStock).toBe(20);
      expect(product.unit).toBe('kg');
      expect(product.taxRate).toBe(18.00);
    });
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      // Create 15 products
      for (let i = 0; i < 15; i++) {
        await createTestProduct(tenantId, categoryId, {
          name: `Product ${i}`,
          sku: `SKU-${i}`,
        });
      }

      const result = await getProducts(tenantId, { page: 1, limit: 10 });

      expect(result.products).toHaveLength(10);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it('should filter by category', async () => {
      const category2 = await createTestCategory(tenantId, { name: 'Category 2' });
      
      await createTestProduct(tenantId, categoryId, { name: 'Product 1' });
      await createTestProduct(tenantId, category2.id, { name: 'Product 2' });

      const result = await getProducts(tenantId, { categoryId });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].categoryId).toBe(categoryId);
    });

    it('should filter by search query', async () => {
      await createTestProduct(tenantId, categoryId, {
        name: 'Apple iPhone',
        sku: 'IPHONE-13',
      });
      await createTestProduct(tenantId, categoryId, {
        name: 'Samsung Galaxy',
        sku: 'GALAXY-S23',
      });

      const result = await getProducts(tenantId, { search: 'iphone' });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toContain('iPhone');
    });

    it('should only return active products when isActive=true', async () => {
      await createTestProduct(tenantId, categoryId, { name: 'Active', isActive: true });
      await createTestProduct(tenantId, categoryId, { name: 'Inactive', isActive: false });

      const result = await getProducts(tenantId, { isActive: true });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].isActive).toBe(true);
    });

    it('should include category information', async () => {
      await createTestProduct(tenantId, categoryId);

      const result = await getProducts(tenantId);

      expect(result.products[0]).toHaveProperty('category');
      expect(result.products[0].category).toHaveProperty('name');
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const created = await createTestProduct(tenantId, categoryId);

      const product = await getProductById(created.id, tenantId);

      expect(product).toBeDefined();
      expect(product?.id).toBe(created.id);
      expect(product?.name).toBe(created.name);
    });

    it('should return null for non-existent product', async () => {
      const product = await getProductById('non-existent-id', tenantId);

      expect(product).toBeNull();
    });

    it('should not return products from other tenants', async () => {
      const created = await createTestProduct(tenantId, categoryId);
      const otherTenant = await createTestTenant({ businessName: 'Other' });

      const product = await getProductById(created.id, otherTenant.id);

      expect(product).toBeNull();
    });

    it('should include category information', async () => {
      const created = await createTestProduct(tenantId, categoryId);

      const product = await getProductById(created.id, tenantId);

      expect(product).toHaveProperty('category');
      expect(product?.category).toHaveProperty('name');
    });
  });

  describe('updateProduct', () => {
    it('should update product fields', async () => {
      const created = await createTestProduct(tenantId, categoryId);

      const updated = await updateProduct(created.id, tenantId, {
        name: 'Updated Name',
        price: 150.00,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.price).toBe(150.00);
    });

    it('should not update id or tenantId', async () => {
      const created = await createTestProduct(tenantId, categoryId);
      const originalId = created.id;

      const updated = await updateProduct(created.id, tenantId, {
        id: 'new-id',
        tenantId: 'new-tenant-id',
      } as any);

      expect(updated.id).toBe(originalId);
      expect(updated.tenantId).toBe(tenantId);
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        updateProduct('non-existent-id', tenantId, { name: 'Test' })
      ).rejects.toThrow();
    });

    it('should not update products from other tenants', async () => {
      const created = await createTestProduct(tenantId, categoryId);
      const otherTenant = await createTestTenant({ businessName: 'Other' });

      await expect(
        updateProduct(created.id, otherTenant.id, { name: 'Hacked' })
      ).rejects.toThrow();
    });
  });

  describe('deleteProduct', () => {
    it('should delete (deactivate) product', async () => {
      const created = await createTestProduct(tenantId, categoryId);

      await deleteProduct(created.id, tenantId);

      const product = await getProductById(created.id, tenantId);
      expect(product?.isActive).toBe(false);
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        deleteProduct('non-existent-id', tenantId)
      ).rejects.toThrow();
    });

    it('should not delete products from other tenants', async () => {
      const created = await createTestProduct(tenantId, categoryId);
      const otherTenant = await createTestTenant({ businessName: 'Other' });

      await expect(
        deleteProduct(created.id, otherTenant.id)
      ).rejects.toThrow();
    });
  });

  describe('searchProducts', () => {
    it('should search by name', async () => {
      await createTestProduct(tenantId, categoryId, {
        name: 'Apple MacBook Pro',
        sku: 'MBP-001',
      });
      await createTestProduct(tenantId, categoryId, {
        name: 'Dell XPS',
        sku: 'XPS-001',
      });

      const results = await searchProducts(tenantId, 'macbook');

      expect(results).toHaveLength(1);
      expect(results[0].name).toContain('MacBook');
    });

    it('should search by SKU', async () => {
      await createTestProduct(tenantId, categoryId, {
        name: 'Product A',
        sku: 'SPECIAL-SKU-123',
      });

      const results = await searchProducts(tenantId, 'SPECIAL-SKU');

      expect(results).toHaveLength(1);
      expect(results[0].sku).toContain('SPECIAL-SKU');
    });

    it('should search by barcode', async () => {
      await createTestProduct(tenantId, categoryId, {
        name: 'Product B',
        sku: 'SKU-B',
        barcode: '1234567890',
      });

      const results = await searchProducts(tenantId, '1234567890');

      expect(results).toHaveLength(1);
      expect(results[0].barcode).toBe('1234567890');
    });

    it('should be case-insensitive', async () => {
      await createTestProduct(tenantId, categoryId, {
        name: 'Apple iPhone',
      });

      const results = await searchProducts(tenantId, 'APPLE IPHONE');

      expect(results).toHaveLength(1);
    });

    it('should only return active products', async () => {
      await createTestProduct(tenantId, categoryId, {
        name: 'Active Product',
        isActive: true,
      });
      await createTestProduct(tenantId, categoryId, {
        name: 'Inactive Product',
        isActive: false,
      });

      const results = await searchProducts(tenantId, 'Product');

      expect(results).toHaveLength(1);
      expect(results[0].isActive).toBe(true);
    });
  });
});
