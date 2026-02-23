// Category Schemas - Validation for category operations
import { z } from 'zod';
import { Type, Static } from '@sinclair/typebox';

// Create category schema
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

// Update category schema
export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// List categories query schema
export const listCategoriesQuerySchema = z.object({
  search: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Types
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
