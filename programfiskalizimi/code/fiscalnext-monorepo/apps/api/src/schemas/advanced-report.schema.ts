import { z } from 'zod';

// Report configuration
export const reportConfigSchema = z.object({
  // Fields to include
  fields: z.array(z.string()).optional(),
  
  // Filters
  filters: z.object({
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    locationId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    status: z.string().optional(),
    paymentMethod: z.string().optional(),
  }).optional(),
  
  // Grouping
  groupBy: z.array(z.enum(['day', 'week', 'month', 'location', 'category', 'product', 'customer', 'paymentMethod'])).optional(),
  
  // Sorting
  orderBy: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
  
  // Aggregations
  aggregations: z.array(z.enum(['sum', 'avg', 'min', 'max', 'count'])).optional(),
  
  // Chart settings
  chartType: z.enum(['line', 'bar', 'pie', 'donut', 'area', 'table']).optional(),
  chartTitle: z.string().optional(),
  
  // Pagination
  limit: z.number().int().min(1).max(10000).optional(),
  offset: z.number().int().min(0).optional(),
});

// Create report
export const createReportSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  reportType: z.enum([
    'sales',
    'inventory',
    'profit_loss',
    'balance_sheet',
    'tax_summary',
    'customer_analysis',
    'product_performance',
    'location_comparison',
    'custom'
  ]),
  config: reportConfigSchema,
  isTemplate: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

// Update report
export const updateReportSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  config: reportConfigSchema.optional(),
  isPublic: z.boolean().optional(),
});

// Schedule report
export const scheduleReportSchema = z.object({
  scheduleEnabled: z.boolean(),
  scheduleCron: z.string().optional(), // e.g., "0 9 * * 1" (every Monday at 9am)
  scheduleFormat: z.enum(['pdf', 'excel', 'csv']).optional(),
  scheduleEmails: z.array(z.string().email()).optional(),
});

// Generate report
export const generateReportSchema = z.object({
  format: z.enum(['pdf', 'excel', 'csv', 'json']),
  includeCharts: z.boolean().optional(),
});

// Query parameters for report execution
export const executeReportSchema = z.object({
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  locationId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  format: z.enum(['json', 'pdf', 'excel', 'csv']).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ScheduleReportInput = z.infer<typeof scheduleReportSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type ExecuteReportInput = z.infer<typeof executeReportSchema>;
