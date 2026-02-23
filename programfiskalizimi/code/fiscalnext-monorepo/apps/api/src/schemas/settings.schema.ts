// Settings Validation Schemas
import { z } from 'zod';

// Update business profile (tenant)
export const updateBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required').optional(),
  nipt: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.enum(['AL', 'XK']).optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
});

// Update user profile
export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
});

// Update system settings (stored in tenant settings JSON)
export const updateSystemSchema = z.object({
  taxRate: z.number().min(0).max(100).optional(),
  receiptFooter: z.string().optional(),
  currency: z.enum(['EUR', 'ALL', 'USD']).optional(),
  timeZone: z.string().optional(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateSystemInput = z.infer<typeof updateSystemSchema>;
