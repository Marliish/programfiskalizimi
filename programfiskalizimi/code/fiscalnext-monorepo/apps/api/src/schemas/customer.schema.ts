// Customer Schemas - Validation for customer operations
import { z } from 'zod';

export const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().min(5, 'Phone number must be at least 5 characters').optional(),
  birthday: z.string().datetime({ message: 'Invalid date format' }).optional().nullable(),
});

export const updateCustomerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().min(5).optional(),
  birthday: z.string().datetime().optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
});

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'totalSpent', 'createdAt', 'lastPurchase']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
