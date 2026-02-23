// Audit Log Schemas
// Created: 2026-02-23 - Day 6

import { z } from 'zod';

export const createAuditLogSchema = z.object({
  action: z.string().min(1).max(100),
  entityType: z.string().min(1).max(100),
  entityId: z.string().optional(),
  changes: z.record(z.any()).optional(),
  ipAddress: z.string().max(50).optional(),
  userAgent: z.string().optional(),
});

export const queryAuditLogsSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

export const exportAuditLogsSchema = z.object({
  format: z.enum(['csv', 'json']).default('json'),
  userId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;
export type QueryAuditLogsInput = z.infer<typeof queryAuditLogsSchema>;
export type ExportAuditLogsInput = z.infer<typeof exportAuditLogsSchema>;
