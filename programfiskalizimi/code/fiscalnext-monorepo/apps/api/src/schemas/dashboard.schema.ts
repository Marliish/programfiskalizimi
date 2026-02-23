import { z } from 'zod';

// Widget position and size
export const widgetPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().min(1).max(12),
  height: z.number().int().min(1).max(12),
});

// Widget configuration
export const widgetConfigSchema = z.object({
  dateRange: z.enum(['today', 'week', 'month', 'year', 'custom']).optional(),
  customStartDate: z.string().optional(),
  customEndDate: z.string().optional(),
  locationId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  chartType: z.enum(['line', 'bar', 'pie', 'donut', 'area']).optional(),
  refreshInterval: z.number().int().min(5000).max(300000).optional(), // 5s to 5min
  limit: z.number().int().min(1).max(100).optional(),
});

// Create widget
export const createWidgetSchema = z.object({
  widgetType: z.enum([
    'revenue_today',
    'revenue_chart',
    'sales_count',
    'top_products',
    'low_stock',
    'inventory_value',
    'customer_count',
    'recent_transactions',
    'live_sales_feed',
    'online_users',
    'sales_by_category',
    'sales_by_location',
    'payment_methods',
    'hourly_sales',
    'daily_comparison',
    'profit_margin',
    'tax_summary',
    'forecast_revenue',
    'customer_segments',
    'product_performance'
  ]),
  title: z.string().min(1).max(100),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().min(1).max(12),
  height: z.number().int().min(1).max(12),
  config: widgetConfigSchema.optional(),
});

// Create dashboard
export const createDashboardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  layout: z.record(z.any()).optional(), // Grid layout configuration
  isTemplate: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  widgets: z.array(createWidgetSchema).optional(),
});

// Update dashboard
export const updateDashboardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  layout: z.record(z.any()).optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

// Update widget
export const updateWidgetSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  x: z.number().int().min(0).optional(),
  y: z.number().int().min(0).optional(),
  width: z.number().int().min(1).max(12).optional(),
  height: z.number().int().min(1).max(12).optional(),
  config: widgetConfigSchema.optional(),
});

// Export/import dashboard
export const exportDashboardSchema = z.object({
  includeData: z.boolean().optional(),
});

export type CreateWidgetInput = z.infer<typeof createWidgetSchema>;
export type CreateDashboardInput = z.infer<typeof createDashboardSchema>;
export type UpdateDashboardInput = z.infer<typeof updateDashboardSchema>;
export type UpdateWidgetInput = z.infer<typeof updateWidgetSchema>;
