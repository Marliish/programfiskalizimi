/**
 * MANUFACTURING VALIDATION SCHEMAS
 * Team 4: Eroldi (CTO), Boli, Artan
 * All 40 manufacturing features
 */

import { z } from 'zod';

// ============================================
// 1. BILL OF MATERIALS (BOM) - 10 Features
// ============================================

// Create BOM
export const createBOMSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  name: z.string().min(1, 'BOM name is required'),
  description: z.string().optional(),
  bomType: z.enum(['production', 'assembly', 'disassembly']).default('production'),
  items: z.array(z.object({
    componentId: z.string().uuid('Invalid component ID'),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().default('pieces'),
    parentItemId: z.string().uuid().optional(),
    level: z.number().int().min(0).default(0),
    sequence: z.number().int().default(0),
    isOptional: z.boolean().default(false),
    notes: z.string().optional(),
  })),
  notes: z.string().optional(),
});

// Update BOM
export const updateBOMSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  bomType: z.enum(['production', 'assembly', 'disassembly']).optional(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'archived']).optional(),
  notes: z.string().optional(),
});

// BOM Item
export const addBOMItemSchema = z.object({
  componentId: z.string().uuid('Invalid component ID'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().default('pieces'),
  parentItemId: z.string().uuid().optional(),
  level: z.number().int().min(0).default(0),
  sequence: z.number().int().default(0),
  isOptional: z.boolean().default(false),
  notes: z.string().optional(),
});

// Component Substitution
export const createSubstitutionSchema = z.object({
  primaryComponentId: z.string().uuid('Invalid primary component ID'),
  substituteComponentId: z.string().uuid('Invalid substitute component ID'),
  conversionRatio: z.number().positive().default(1),
  priority: z.number().int().positive().default(1),
  notes: z.string().optional(),
});

// BOM Approval
export const approveBOMSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

// BOM Copy/Clone
export const cloneBOMSchema = z.object({
  newName: z.string().min(1, 'New BOM name is required'),
  newProductId: z.string().uuid('Invalid product ID').optional(),
  includeItems: z.boolean().default(true),
});

// BOM Explosion
export const explodeBOMSchema = z.object({
  quantity: z.number().positive('Quantity must be positive').default(1),
  includeSubstitutes: z.boolean().default(false),
});

// BOM Import
export const importBOMSchema = z.object({
  format: z.enum(['csv', 'json', 'excel']),
  data: z.string(),
  overwriteExisting: z.boolean().default(false),
});

// List BOMs Query
export const listBOMsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  search: z.string().optional(),
  productId: z.string().uuid().optional(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'archived']).optional(),
  isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});

// ============================================
// 2. PRODUCTION PLANNING - 10 Features
// ============================================

// Production Schedule
export const createProductionScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  description: z.string().optional(),
  productId: z.string().uuid('Invalid product ID'),
  plannedQuantity: z.number().positive('Planned quantity must be positive'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  machineId: z.string().uuid().optional(),
  shiftId: z.string().uuid().optional(),
  leadTimeDays: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

export const updateProductionScheduleSchema = createProductionScheduleSchema.partial();

// Production Calendar
export const createProductionCalendarSchema = z.object({
  name: z.string().min(1, 'Calendar name is required'),
  description: z.string().optional(),
  date: z.string().datetime('Invalid date'),
  isWorkingDay: z.boolean().default(true),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional(),
  dayType: z.enum(['regular', 'holiday', 'maintenance', 'overtime']).default('regular'),
  notes: z.string().optional(),
});

// Production Shift
export const createProductionShiftSchema = z.object({
  name: z.string().min(1, 'Shift name is required'),
  description: z.string().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  workingDays: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  capacityPercentage: z.number().min(0).max(200).default(100),
  isActive: z.boolean().default(true),
});

// Production Machine
export const createProductionMachineSchema = z.object({
  name: z.string().min(1, 'Machine name is required'),
  code: z.string().min(1, 'Machine code is required'),
  description: z.string().optional(),
  machineType: z.string().min(1, 'Machine type is required'),
  hoursPerDay: z.number().positive().default(8),
  efficiencyRate: z.number().min(0).max(100).default(100),
  status: z.enum(['available', 'in_use', 'maintenance', 'down']).default('available'),
  hourlyCost: z.number().min(0).default(0),
  locationId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// Machine Schedule
export const createMachineScheduleSchema = z.object({
  machineId: z.string().uuid('Invalid machine ID'),
  workOrderId: z.string().uuid().optional(),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  notes: z.string().optional(),
});

// Resource Allocation
export const createResourceAllocationSchema = z.object({
  scheduleId: z.string().uuid('Invalid schedule ID'),
  resourceType: z.enum(['labor', 'machine', 'material']),
  resourceId: z.string().uuid('Invalid resource ID'),
  resourceName: z.string().min(1),
  allocatedQuantity: z.number().positive('Allocated quantity must be positive'),
  unit: z.string().default('hours'),
  unitCost: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// Capacity Planning
export const capacityPlanningQuerySchema = z.object({
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  resourceType: z.enum(['labor', 'machine', 'material']).optional(),
  machineId: z.string().uuid().optional(),
});

// Material Requirements Planning (MRP)
export const runMRPSchema = z.object({
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  productId: z.string().uuid().optional(),
  includeForecasts: z.boolean().default(true),
});

// Production Forecast
export const createProductionForecastSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  forecastPeriod: z.enum(['weekly', 'monthly', 'quarterly']),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  forecastedQuantity: z.number().positive('Forecasted quantity must be positive'),
  forecastMethod: z.enum(['manual', 'historical_average', 'trend_analysis']).default('manual'),
  notes: z.string().optional(),
});

// Bottleneck Analysis
export const runBottleneckAnalysisSchema = z.object({
  analysisName: z.string().min(1, 'Analysis name is required'),
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
  resourceType: z.enum(['machine', 'labor', 'material', 'process']).optional(),
});

// ============================================
// 3. WORK ORDERS - 8 Features
// ============================================

// Create Work Order
export const createWorkOrderSchema = z.object({
  name: z.string().min(1, 'Work order name is required'),
  description: z.string().optional(),
  productId: z.string().uuid('Invalid product ID'),
  bomId: z.string().uuid().optional(),
  plannedQuantity: z.number().positive('Planned quantity must be positive'),
  plannedStartDate: z.string().datetime('Invalid start date'),
  plannedEndDate: z.string().datetime('Invalid end date'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  scheduleId: z.string().uuid().optional(),
  shiftId: z.string().uuid().optional(),
  machineId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const updateWorkOrderSchema = createWorkOrderSchema.partial().extend({
  status: z.enum(['draft', 'released', 'in_progress', 'completed', 'cancelled']).optional(),
  actualStartDate: z.string().datetime().optional(),
  actualEndDate: z.string().datetime().optional(),
  completedQuantity: z.number().min(0).optional(),
  scrapQuantity: z.number().min(0).optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
});

// Operation Routing
export const addWorkOrderOperationSchema = z.object({
  operationNumber: z.number().int().positive('Operation number must be positive'),
  name: z.string().min(1, 'Operation name is required'),
  description: z.string().optional(),
  sequence: z.number().int().default(0),
  previousOpId: z.string().uuid().optional(),
  machineId: z.string().uuid().optional(),
  requiredSkill: z.string().optional(),
  setupTimeMinutes: z.number().min(0).default(0),
  runTimeMinutes: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// Labor Tracking
export const createLaborTrackingSchema = z.object({
  workOrderId: z.string().uuid('Invalid work order ID'),
  employeeId: z.string().uuid('Invalid employee ID'),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime().optional(),
  operationId: z.string().uuid().optional(),
  hourlyRate: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const endLaborTrackingSchema = z.object({
  endTime: z.string().datetime('Invalid end time'),
});

// Machine Time Tracking
export const createMachineTimeTrackingSchema = z.object({
  workOrderId: z.string().uuid('Invalid work order ID'),
  machineId: z.string().uuid('Invalid machine ID'),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime().optional(),
  downtimeHours: z.number().min(0).default(0),
  downtimeReason: z.string().optional(),
  hourlyRate: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// Work Order Costing
export const calculateWorkOrderCostSchema = z.object({
  includeMaterials: z.boolean().default(true),
  includeLabor: z.boolean().default(true),
  includeMachine: z.boolean().default(true),
  includeOverhead: z.boolean().default(true),
});

// Progress Tracking
export const updateWorkOrderProgressSchema = z.object({
  completedQuantity: z.number().min(0),
  progressPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

// Scrap Tracking
export const createScrapRecordSchema = z.object({
  workOrderId: z.string().uuid('Invalid work order ID'),
  quantity: z.number().positive('Quantity must be positive'),
  reason: z.string().min(1, 'Reason is required'),
  category: z.enum(['production', 'material', 'quality', 'other']).default('production'),
  costPerUnit: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// List Work Orders
export const listWorkOrdersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  search: z.string().optional(),
  productId: z.string().uuid().optional(),
  status: z.enum(['draft', 'released', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================
// 4. QUALITY CONTROL - 7 Features
// ============================================

// QC Checkpoint
export const createQCCheckpointSchema = z.object({
  workOrderId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  checkpointName: z.string().min(1, 'Checkpoint name is required'),
  checkpointType: z.enum(['incoming', 'in_process', 'final', 'random']),
  inspectionPlanId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const updateQCCheckpointSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'passed', 'failed']).optional(),
  result: z.enum(['passed', 'failed', 'conditional']).optional(),
  notes: z.string().optional(),
});

// Inspection Plan
export const createInspectionPlanSchema = z.object({
  name: z.string().min(1, 'Inspection plan name is required'),
  description: z.string().optional(),
  productId: z.string().uuid().optional(),
  inspectionType: z.enum(['incoming', 'in_process', 'final', 'periodic']),
  frequency: z.enum(['every_unit', 'sample', 'periodic']).default('every_unit'),
  sampleSize: z.number().int().positive().optional(),
  criteria: z.array(z.object({
    parameter: z.string(),
    min: z.number().optional(),
    max: z.number().optional(),
    unit: z.string(),
    method: z.string(),
  })),
  isActive: z.boolean().default(true),
});

// Pass/Fail Criteria (part of inspection plan)
export const passfailCriteriaSchema = z.object({
  parameter: z.string().min(1),
  min: z.number().optional(),
  max: z.number().optional(),
  target: z.number().optional(),
  unit: z.string().min(1),
  method: z.string().optional(),
  tolerance: z.number().optional(),
});

// QC Report
export const createQCReportSchema = z.object({
  checkpointId: z.string().uuid('Invalid checkpoint ID'),
  measurements: z.array(z.object({
    parameter: z.string(),
    actual: z.number(),
    expected: z.number().optional(),
    unit: z.string(),
    status: z.enum(['passed', 'failed', 'na']),
  })),
  overallResult: z.enum(['passed', 'failed', 'conditional']),
  defectsFound: z.array(z.object({
    defectType: z.string(),
    quantity: z.number().positive(),
    severity: z.enum(['minor', 'major', 'critical']),
  })).default([]),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export const approveQCReportSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

// Defect Tracking
export const createDefectTrackingSchema = z.object({
  qcReportId: z.string().uuid().optional(),
  defectCode: z.string().min(1, 'Defect code is required'),
  defectName: z.string().min(1, 'Defect name is required'),
  defectType: z.enum(['visual', 'dimensional', 'functional', 'material']),
  severity: z.enum(['minor', 'major', 'critical']).default('minor'),
  quantity: z.number().positive('Quantity must be positive'),
  sourceType: z.enum(['work_order', 'inspection', 'customer_return']),
  sourceId: z.string().uuid('Invalid source ID'),
  rootCause: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const updateDefectTrackingSchema = z.object({
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
  rootCause: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  resolvedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// Corrective Actions
export const createCorrectiveActionSchema = z.object({
  defectId: z.string().uuid().optional(),
  qcReportId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  actionType: z.enum(['immediate', 'preventive', 'corrective']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z.string().uuid('Invalid assignee ID'),
  dueDate: z.string().datetime('Invalid due date'),
  notes: z.string().optional(),
});

export const updateCorrectiveActionSchema = z.object({
  status: z.enum(['open', 'in_progress', 'completed', 'verified', 'closed']).optional(),
  completedAt: z.string().datetime().optional(),
  verifiedAt: z.string().datetime().optional(),
  verificationNotes: z.string().optional(),
  effectivenessRating: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
});

// QC Analytics Query
export const qcAnalyticsQuerySchema = z.object({
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  productId: z.string().uuid().optional(),
  inspectionType: z.enum(['incoming', 'in_process', 'final', 'periodic']).optional(),
});

// ============================================
// 5. PRODUCTION COSTING - 5 Features
// ============================================

// Production Cost Record
export const createProductionCostRecordSchema = z.object({
  workOrderId: z.string().uuid('Invalid work order ID'),
  costType: z.enum(['direct_material', 'direct_labor', 'machine', 'overhead', 'other']),
  costCategory: z.string().min(1, 'Cost category is required'),
  unitCost: z.number().min(0).default(0),
  quantity: z.number().positive('Quantity must be positive').default(1),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),
  referenceName: z.string().optional(),
  allocationMethod: z.enum(['labor_hours', 'machine_hours', 'units_produced']).optional(),
  allocationBase: z.number().positive().optional(),
  notes: z.string().optional(),
});

// Direct Costs (materials + labor)
export const recordDirectCostSchema = z.object({
  workOrderId: z.string().uuid('Invalid work order ID'),
  costType: z.enum(['direct_material', 'direct_labor']),
  itemId: z.string().uuid('Invalid item ID'),
  itemName: z.string().min(1),
  quantity: z.number().positive('Quantity must be positive'),
  unitCost: z.number().min(0),
  notes: z.string().optional(),
});

// Indirect Costs (utilities, supplies, etc.)
export const recordIndirectCostSchema = z.object({
  workOrderId: z.string().uuid('Invalid work order ID'),
  costCategory: z.string().min(1, 'Cost category is required'),
  description: z.string().min(1, 'Description is required'),
  totalCost: z.number().positive('Total cost must be positive'),
  allocationMethod: z.enum(['labor_hours', 'machine_hours', 'units_produced']),
  allocationBase: z.number().positive('Allocation base must be positive'),
  notes: z.string().optional(),
});

// Overhead Allocation
export const allocateOverheadSchema = z.object({
  workOrderId: z.string().uuid('Invalid work order ID'),
  overheadRate: z.number().min(0, 'Overhead rate must be non-negative'),
  allocationMethod: z.enum(['labor_hours', 'machine_hours', 'units_produced']),
  allocationBase: z.number().positive('Allocation base must be positive'),
  notes: z.string().optional(),
});

// Variance Analysis
export const runVarianceAnalysisSchema = z.object({
  workOrderId: z.string().uuid().optional(),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  productId: z.string().uuid().optional(),
  costType: z.enum(['direct_material', 'direct_labor', 'machine', 'overhead', 'all']).default('all'),
});

// Cost Per Unit Analysis
export const calculateCostPerUnitSchema = z.object({
  workOrderId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeOverhead: z.boolean().default(true),
});

// Production Cost Analysis
export const generateCostAnalysisSchema = z.object({
  analysisName: z.string().min(1, 'Analysis name is required'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  productId: z.string().uuid().optional(),
  standardCost: z.number().min(0).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

// BOM Types
export type CreateBOMInput = z.infer<typeof createBOMSchema>;
export type UpdateBOMInput = z.infer<typeof updateBOMSchema>;
export type AddBOMItemInput = z.infer<typeof addBOMItemSchema>;
export type CreateSubstitutionInput = z.infer<typeof createSubstitutionSchema>;
export type CloneBOMInput = z.infer<typeof cloneBOMSchema>;
export type ListBOMsQuery = z.infer<typeof listBOMsQuerySchema>;

// Production Planning Types
export type CreateProductionScheduleInput = z.infer<typeof createProductionScheduleSchema>;
export type UpdateProductionScheduleInput = z.infer<typeof updateProductionScheduleSchema>;
export type CreateProductionCalendarInput = z.infer<typeof createProductionCalendarSchema>;
export type CreateProductionShiftInput = z.infer<typeof createProductionShiftSchema>;
export type CreateProductionMachineInput = z.infer<typeof createProductionMachineSchema>;
export type CreateResourceAllocationInput = z.infer<typeof createResourceAllocationSchema>;
export type CreateProductionForecastInput = z.infer<typeof createProductionForecastSchema>;

// Work Order Types
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type AddWorkOrderOperationInput = z.infer<typeof addWorkOrderOperationSchema>;
export type CreateLaborTrackingInput = z.infer<typeof createLaborTrackingSchema>;
export type CreateMachineTimeTrackingInput = z.infer<typeof createMachineTimeTrackingSchema>;
export type CreateScrapRecordInput = z.infer<typeof createScrapRecordSchema>;
export type ListWorkOrdersQuery = z.infer<typeof listWorkOrdersQuerySchema>;

// QC Types
export type CreateQCCheckpointInput = z.infer<typeof createQCCheckpointSchema>;
export type CreateInspectionPlanInput = z.infer<typeof createInspectionPlanSchema>;
export type CreateQCReportInput = z.infer<typeof createQCReportSchema>;
export type CreateDefectTrackingInput = z.infer<typeof createDefectTrackingSchema>;
export type CreateCorrectiveActionInput = z.infer<typeof createCorrectiveActionSchema>;

// Costing Types
export type CreateProductionCostRecordInput = z.infer<typeof createProductionCostRecordSchema>;
export type RecordDirectCostInput = z.infer<typeof recordDirectCostSchema>;
export type RecordIndirectCostInput = z.infer<typeof recordIndirectCostSchema>;
export type AllocateOverheadInput = z.infer<typeof allocateOverheadSchema>;
export type GenerateCostAnalysisInput = z.infer<typeof generateCostAnalysisSchema>;
