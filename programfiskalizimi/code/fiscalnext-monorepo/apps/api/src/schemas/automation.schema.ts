import { z } from 'zod';

// Trigger configurations
export const lowStockTriggerSchema = z.object({
  threshold: z.number().min(0),
  productId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});

export const highSalesTriggerSchema = z.object({
  amount: z.number().min(0),
  period: z.enum(['hour', 'day', 'week']),
  locationId: z.string().uuid().optional(),
});

export const newCustomerTriggerSchema = z.object({
  // No specific config needed
});

export const timeBasedTriggerSchema = z.object({
  schedule: z.string(), // cron expression
});

export const triggerConfigSchema = z.union([
  lowStockTriggerSchema,
  highSalesTriggerSchema,
  newCustomerTriggerSchema,
  timeBasedTriggerSchema,
]);

// Condition schemas
export const conditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in']),
  value: z.any(),
});

// Action schemas
export const emailActionSchema = z.object({
  type: z.literal('email'),
  config: z.object({
    to: z.array(z.string().email()),
    subject: z.string(),
    body: z.string(),
    template: z.string().optional(),
  }),
});

export const webhookActionSchema = z.object({
  type: z.literal('webhook'),
  config: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH']),
    headers: z.record(z.string()).optional(),
    body: z.record(z.any()).optional(),
  }),
});

export const notificationActionSchema = z.object({
  type: z.literal('notification'),
  config: z.object({
    title: z.string(),
    message: z.string(),
    userId: z.string().uuid().optional(),
    priority: z.enum(['low', 'normal', 'high']).optional(),
  }),
});

export const priceAdjustmentActionSchema = z.object({
  type: z.literal('price_adjustment'),
  config: z.object({
    productId: z.string().uuid(),
    adjustmentType: z.enum(['percentage', 'fixed']),
    adjustmentValue: z.number(),
  }),
});

export const actionSchema = z.discriminatedUnion('type', [
  emailActionSchema,
  webhookActionSchema,
  notificationActionSchema,
  priceAdjustmentActionSchema,
]);

// Create automation
export const createAutomationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  triggerType: z.enum(['low_stock', 'high_sales', 'new_customer', 'time_based']),
  triggerConfig: z.record(z.any()),
  conditions: z.array(conditionSchema).optional(),
  actions: z.array(actionSchema),
  isEnabled: z.boolean().optional(),
});

// Update automation
export const updateAutomationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  triggerConfig: z.record(z.any()).optional(),
  conditions: z.array(conditionSchema).optional(),
  actions: z.array(actionSchema).optional(),
  isEnabled: z.boolean().optional(),
});

// Test automation
export const testAutomationSchema = z.object({
  testData: z.record(z.any()).optional(),
});

export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationInput = z.infer<typeof updateAutomationSchema>;
export type TestAutomationInput = z.infer<typeof testAutomationSchema>;
export type ActionConfig = z.infer<typeof actionSchema>;
