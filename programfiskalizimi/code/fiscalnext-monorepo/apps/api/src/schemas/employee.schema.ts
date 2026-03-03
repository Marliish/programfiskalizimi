// Employee Management Schemas
// Created: 2026-02-23 - Day 6

import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employeeNumber: z.string().min(1).max(50).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  position: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  hireDate: z.string().optional(), // ISO date
  userId: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const clockInSchema = z.object({
  employeeId: z.string(),
  locationId: z.string().optional(),
  notes: z.string().optional(),
});

export const clockOutSchema = z.object({
  shiftId: z.string(),
  breakDurationMinutes: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const performanceQuerySchema = z.object({
  employeeId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  locationId: z.string().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ClockInInput = z.infer<typeof clockInSchema>;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
export type PerformanceQueryInput = z.infer<typeof performanceQuerySchema>;
