// Product Validation Schemas
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  costPrice: z.number().positive('Cost price must be positive').optional(),
  sellingPrice: z.number().positive('Selling price must be positive'),
  taxRate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100').default(20),
  unit: z.string().default('pieces'),
  trackInventory: z.boolean().default(true),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const adjustStockSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  locationId: z.string().min(1).optional(),
  quantity: z.number().positive('Quantity must be positive'),
  type: z.enum(['in', 'out', 'adjustment'], {
    errorMap: () => ({ message: 'Type must be in, out, or adjustment' }),
  }),
  notes: z.string().optional(),
});

export const listProductsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
