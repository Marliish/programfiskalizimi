// Loyalty Program Schemas
// Created: 2026-02-23 - Day 6

import { z } from 'zod';

export const earnPointsSchema = z.object({
  customerId: z.string(),
  points: z.number().int().min(1),
  transactionId: z.string().optional(),
  description: z.string().optional(),
});

export const redeemPointsSchema = z.object({
  customerId: z.string(),
  points: z.number().int().min(1),
  description: z.string().optional(),
});

export const createRewardSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  pointsCost: z.number().int().min(1),
  rewardType: z.enum(['discount', 'free_product', 'voucher']),
  rewardValue: z.number().optional(),
  productId: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

export const updateRewardSchema = createRewardSchema.partial();

export const redeemRewardSchema = z.object({
  customerId: z.string(),
  rewardId: z.string(),
  transactionId: z.string().optional(),
});

export type EarnPointsInput = z.infer<typeof earnPointsSchema>;
export type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;
export type CreateRewardInput = z.infer<typeof createRewardSchema>;
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;
export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;
