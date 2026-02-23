// Report Schemas - Validation for report operations
import { z } from 'zod';

export const salesReportQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('daily').optional(),
  locationId: z.string().optional(),
  exportFormat: z.enum(['json', 'csv', 'pdf']).default('json').optional(),
});

export const productsReportQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
  type: z.enum(['best-sellers', 'low-stock', 'all']).default('all').optional(),
  exportFormat: z.enum(['json', 'csv', 'pdf']).default('json').optional(),
});

export const revenueReportQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day').optional(),
  exportFormat: z.enum(['json', 'csv', 'pdf']).default('json').optional(),
});

export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>;
export type ProductsReportQuery = z.infer<typeof productsReportQuerySchema>;
export type RevenueReportQuery = z.infer<typeof revenueReportQuerySchema>;
