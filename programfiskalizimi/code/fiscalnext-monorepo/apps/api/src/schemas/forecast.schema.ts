import { z } from 'zod';

// Forecast request
export const createForecastSchema = z.object({
  forecastType: z.enum(['sales', 'revenue', 'inventory']),
  period: z.enum(['daily', 'weekly', 'monthly']),
  daysAhead: z.number().int().min(1).max(365),
  algorithm: z.enum(['linear_regression', 'moving_average', 'exponential_smoothing']).optional(),
  includeConfidenceInterval: z.boolean().optional(),
});

// Customer segmentation
export const customerSegmentationSchema = z.object({
  method: z.enum(['rfm', 'value', 'behavior']),
  segmentCount: z.number().int().min(2).max(10).optional(),
});

// ABC analysis
export const abcAnalysisSchema = z.object({
  analysisType: z.enum(['revenue', 'profit', 'quantity']),
  locationId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
});

// Trend analysis
export const trendAnalysisSchema = z.object({
  metric: z.enum(['sales', 'revenue', 'customers', 'inventory']),
  period: z.enum(['daily', 'weekly', 'monthly']),
  compareWith: z.enum(['previous_period', 'same_period_last_year', 'moving_average']).optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

// Inventory optimization
export const inventoryOptimizationSchema = z.object({
  locationId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  includeSuggestions: z.boolean().optional(),
});

export type CreateForecastInput = z.infer<typeof createForecastSchema>;
export type CustomerSegmentationInput = z.infer<typeof customerSegmentationSchema>;
export type AbcAnalysisInput = z.infer<typeof abcAnalysisSchema>;
export type TrendAnalysisInput = z.infer<typeof trendAnalysisSchema>;
export type InventoryOptimizationInput = z.infer<typeof inventoryOptimizationSchema>;
