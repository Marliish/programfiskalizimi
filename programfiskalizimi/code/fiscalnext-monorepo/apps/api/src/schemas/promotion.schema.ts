// Promotions & Discounts Schemas
// Created: 2026-02-23 - Day 6

import { z } from 'zod';

export const createPromotionSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  promoType: z.enum(['percentage', 'fixed_amount', 'buy_x_get_y']),
  discountPercentage: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  buyQuantity: z.number().int().min(1).optional(),
  getQuantity: z.number().int().min(1).optional(),
  appliesTo: z.enum(['all', 'category', 'product']).default('all'),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
  minPurchaseAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  timeRestrictions: z.object({
    days: z.array(z.number().int().min(0).max(6)).optional(),
    hours: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
  }).optional(),
  priority: z.number().int().default(0),
});

export const updatePromotionSchema = createPromotionSchema.partial();

export const createDiscountCodeSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number().min(0),
  maxUses: z.number().int().min(1).optional(),
  maxUsesPerCustomer: z.number().int().min(1).default(1),
  minPurchaseAmount: z.number().min(0).optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  promotionId: z.string().optional(),
});

export const updateDiscountCodeSchema = createDiscountCodeSchema.partial();

export const validateDiscountCodeSchema = z.object({
  code: z.string(),
  customerId: z.string().optional(),
  purchaseAmount: z.number().min(0),
});

export const applyDiscountCodeSchema = z.object({
  code: z.string(),
  customerId: z.string().optional(),
  transactionId: z.string(),
  discountAmount: z.number().min(0),
});

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
export type CreateDiscountCodeInput = z.infer<typeof createDiscountCodeSchema>;
export type UpdateDiscountCodeInput = z.infer<typeof updateDiscountCodeSchema>;
export type ValidateDiscountCodeInput = z.infer<typeof validateDiscountCodeSchema>;
export type ApplyDiscountCodeInput = z.infer<typeof applyDiscountCodeSchema>;
