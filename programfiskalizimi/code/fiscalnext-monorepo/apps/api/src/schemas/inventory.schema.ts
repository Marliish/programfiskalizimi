import { z } from 'zod';

export const adjustStockSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int('Quantity must be an integer'),
  type: z.enum(['add', 'remove', 'set'], {
    errorMap: () => ({ message: 'Type must be add, remove, or set' }),
  }),
  reason: z.string().min(1, 'Reason is required').max(500),
  locationId: z.string().uuid().optional(),
});

export const inventoryQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  categoryId: z.string().uuid().optional(),
  lowStock: z.string().transform(val => val === 'true').optional(),
  locationId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>;
