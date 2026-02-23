/**
 * MANUFACTURING ROUTES - WORK ORDERS, QC, COSTING
 * Team 4: Eroldi (CTO), Boli, Artan
 * Features 21-40: Work Orders, Quality Control, Production Costing
 */

import { FastifyInstance } from 'fastify';
import { manufacturingExtendedService } from '../services/manufacturing-extended.service';
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  addWorkOrderOperationSchema,
  createLaborTrackingSchema,
  createMachineTimeTrackingSchema,
  createScrapRecordSchema,
  listWorkOrdersQuerySchema,
  createQCCheckpointSchema,
  createInspectionPlanSchema,
  createQCReportSchema,
  createDefectTrackingSchema,
  createCorrectiveActionSchema,
  qcAnalyticsQuerySchema,
  createProductionCostRecordSchema,
  recordDirectCostSchema,
  recordIndirectCostSchema,
  allocateOverheadSchema,
  runVarianceAnalysisSchema,
  generateCostAnalysisSchema,
} from '../schemas/manufacturing.schema';
import { validate } from '../middleware/validate';

export async function manufacturingWorkOrdersQCCostingRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // ============================================
  // WORK ORDERS (Features 21-28)
  // ============================================

  // ===== 21. WORK ORDER CREATION =====
  fastify.post<{ Body: any }>(
    '/manufacturing/work-orders',
    {
      preHandler: [validate(createWorkOrderSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.createWorkOrder({
          tenantId: decoded.tenantId,
          createdBy: decoded.userId,
          ...request.body,
          plannedStartDate: new Date(request.body.plannedStartDate),
          plannedEndDate: new Date(request.body.plannedEndDate),
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create work order',
        });
      }
    }
  );

  fastify.get<{ Querystring: any }>(
    '/manufacturing/work-orders',
    {
      preHandler: [validate(listWorkOrdersQuerySchema, 'query')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        // List work orders
        return { success: true, data: [] };
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: 'Failed to fetch work orders',
        });
      }
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/manufacturing/work-orders/:id',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        // Get work order by ID
        return { success: true, data: {} };
      } catch (error) {
        reply.status(404).send({
          success: false,
          error: 'Work order not found',
        });
      }
    }
  );

  fastify.put<{ Params: { id: string }; Body: any }>(
    '/manufacturing/work-orders/:id',
    {
      preHandler: [validate(updateWorkOrderSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        // Update work order
        return { success: true, message: 'Work order updated' };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: 'Failed to update work order',
        });
      }
    }
  );

  // ===== 22. OPERATION ROUTING =====
  fastify.post<{ Params: { id: string }; Body: any }>(
    '/manufacturing/work-orders/:id/operations',
    {
      preHandler: [validate(addWorkOrderOperationSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.addWorkOrderOperation({
          tenantId: decoded.tenantId,
          workOrderId: request.params.id,
          ...request.body,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add operation',
        });
      }
    }
  );

  // ===== 23. LABOR TRACKING =====
  fastify.post<{ Body: any }>(
    '/manufacturing/labor-tracking',
    {
      preHandler: [validate(createLaborTrackingSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.startLaborTracking({
          tenantId: decoded.tenantId,
          ...request.body,
          startTime: new Date(request.body.startTime),
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to start tracking',
        });
      }
    }
  );

  fastify.put<{ Params: { id: string }; Body: { endTime: string } }>(
    '/manufacturing/labor-tracking/:id/end',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.endLaborTracking(
          request.params.id,
          decoded.tenantId,
          new Date(request.body.endTime)
        );

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to end tracking',
        });
      }
    }
  );

  // ===== 24. MACHINE TIME TRACKING =====
  fastify.post<{ Body: any }>(
    '/manufacturing/machine-tracking',
    {
      preHandler: [validate(createMachineTimeTrackingSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.startMachineTracking({
          tenantId: decoded.tenantId,
          ...request.body,
          startTime: new Date(request.body.startTime),
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to start tracking',
        });
      }
    }
  );

  fastify.put<{ Params: { id: string }; Body: any }>(
    '/manufacturing/machine-tracking/:id/end',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.endMachineTracking(
          request.params.id,
          decoded.tenantId,
          new Date(request.body.endTime),
          request.body.downtimeHours,
          request.body.downtimeReason
        );

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to end tracking',
        });
      }
    }
  );

  // ===== 25. WORK ORDER COSTING =====
  fastify.get<{ Params: { id: string }; Querystring: any }>(
    '/manufacturing/work-orders/:id/cost',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.calculateWorkOrderCost(
          request.params.id,
          decoded.tenantId,
          request.query
        );

        return { success: true, data: result };
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: 'Failed to calculate cost',
        });
      }
    }
  );

  // ===== 26. PROGRESS TRACKING =====
  fastify.put<{ Params: { id: string }; Body: any }>(
    '/manufacturing/work-orders/:id/progress',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.updateWorkOrderProgress(
          request.params.id,
          decoded.tenantId,
          request.body
        );

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update progress',
        });
      }
    }
  );

  // ===== 27. WORK ORDER COMPLETION =====
  fastify.post<{ Params: { id: string }; Body: { notes?: string } }>(
    '/manufacturing/work-orders/:id/complete',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.completeWorkOrder(
          request.params.id,
          decoded.tenantId,
          request.body.notes
        );

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to complete work order',
        });
      }
    }
  );

  // ===== 28. SCRAP TRACKING =====
  fastify.post<{ Body: any }>(
    '/manufacturing/scrap',
    {
      preHandler: [validate(createScrapRecordSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.recordScrap({
          tenantId: decoded.tenantId,
          reportedBy: decoded.userId,
          ...request.body,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to record scrap',
        });
      }
    }
  );

  // ============================================
  // QUALITY CONTROL (Features 29-35)
  // ============================================

  // ===== 29. QC CHECKPOINTS =====
  fastify.post<{ Body: any }>(
    '/manufacturing/qc/checkpoints',
    {
      preHandler: [validate(createQCCheckpointSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.createQCCheckpoint({
          tenantId: decoded.tenantId,
          ...request.body,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create checkpoint',
        });
      }
    }
  );

  fastify.get('/manufacturing/qc/checkpoints', async (request, reply) => {
    try {
      const decoded = request.user as any;
      // List checkpoints
      return { success: true, data: [] };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch checkpoints',
      });
    }
  });

  // ===== 30. INSPECTION PLANS =====
  fastify.post<{ Body: any }>(
    '/manufacturing/qc/inspection-plans',
    {
      preHandler: [validate(createInspectionPlanSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.createInspectionPlan({
          tenantId: decoded.tenantId,
          createdBy: decoded.userId,
          ...request.body,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create inspection plan',
        });
      }
    }
  );

  fastify.get('/manufacturing/qc/inspection-plans', async (request, reply) => {
    try {
      const decoded = request.user as any;
      // List inspection plans
      return { success: true, data: [] };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch inspection plans',
      });
    }
  });

  // ===== 31. PASS/FAIL CRITERIA (part of inspection plan) =====
  fastify.put<{ Params: { id: string }; Body: { criteria: any[] } }>(
    '/manufacturing/qc/inspection-plans/:id/criteria',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.updateInspectionCriteria(
          request.params.id,
          decoded.tenantId,
          request.body.criteria
        );

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update criteria',
        });
      }
    }
  );

  // ===== 32. QC REPORTS =====
  fastify.post<{ Body: any }>(
    '/manufacturing/qc/reports',
    {
      preHandler: [validate(createQCReportSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.createQCReport({
          tenantId: decoded.tenantId,
          inspectedBy: decoded.userId,
          ...request.body,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create QC report',
        });
      }
    }
  );

  fastify.get('/manufacturing/qc/reports', async (request, reply) => {
    try {
      const decoded = request.user as any;
      // List QC reports
      return { success: true, data: [] };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch QC reports',
      });
    }
  });

  // ===== 33. DEFECT TRACKING =====
  fastify.post<{ Body: any }>(
    '/manufacturing/qc/defects',
    {
      preHandler: [validate(createDefectTrackingSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.createDefectTracking({
          tenantId: decoded.tenantId,
          ...request.body,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create defect tracking',
        });
      }
    }
  );

  fastify.get('/manufacturing/qc/defects', async (request, reply) => {
    try {
      const decoded = request.user as any;
      // List defects
      return { success: true, data: [] };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch defects',
      });
    }
  });

  // ===== 34. CORRECTIVE ACTIONS =====
  fastify.post<{ Body: any }>(
    '/manufacturing/qc/corrective-actions',
    {
      preHandler: [validate(createCorrectiveActionSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.createCorrectiveAction({
          tenantId: decoded.tenantId,
          createdBy: decoded.userId,
          ...request.body,
          dueDate: new Date(request.body.dueDate),
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create corrective action',
        });
      }
    }
  );

  fastify.get('/manufacturing/qc/corrective-actions', async (request, reply) => {
    try {
      const decoded = request.user as any;
      // List corrective actions
      return { success: true, data: [] };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch corrective actions',
      });
    }
  });

  // ===== 35. QC ANALYTICS =====
  fastify.get<{ Querystring: any }>(
    '/manufacturing/qc/analytics',
    {
      preHandler: [validate(qcAnalyticsQuerySchema, 'query')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.getQCAnalytics({
          tenantId: decoded.tenantId,
          startDate: new Date(request.query.startDate),
          endDate: new Date(request.query.endDate),
          productId: request.query.productId,
          inspectionType: request.query.inspectionType,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: 'Failed to fetch QC analytics',
        });
      }
    }
  );

  // ============================================
  // PRODUCTION COSTING (Features 36-40)
  // ============================================

  // ===== 36. DIRECT COSTS =====
  fastify.post<{ Body: any }>(
    '/manufacturing/costing/direct-costs',
    {
      preHandler: [validate(recordDirectCostSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.recordDirectCost({
          tenantId: decoded.tenantId,
          recordedBy: decoded.userId,
          ...request.body,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to record direct cost',
        });
      }
    }
  );

  // ===== 37. INDIRECT COSTS =====
  fastify.post<{ Body: any }>(
    '/manufacturing/costing/indirect-costs',
    {
      preHandler: [validate(recordIndirectCostSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.recordIndirectCost({
          tenantId: decoded.tenantId,
          recordedBy: decoded.userId,
          ...request.body,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to record indirect cost',
        });
      }
    }
  );

  // ===== 38. OVERHEAD ALLOCATION =====
  fastify.post<{ Body: any }>(
    '/manufacturing/costing/overhead',
    {
      preHandler: [validate(allocateOverheadSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.allocateOverhead({
          tenantId: decoded.tenantId,
          recordedBy: decoded.userId,
          ...request.body,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to allocate overhead',
        });
      }
    }
  );

  // ===== 39. VARIANCE ANALYSIS =====
  fastify.get<{ Querystring: any }>(
    '/manufacturing/costing/variance-analysis',
    {
      preHandler: [validate(runVarianceAnalysisSchema, 'query')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.runVarianceAnalysis({
          tenantId: decoded.tenantId,
          startDate: new Date(request.query.startDate),
          endDate: new Date(request.query.endDate),
          workOrderId: request.query.workOrderId,
          productId: request.query.productId,
          costType: request.query.costType,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: 'Failed to run variance analysis',
        });
      }
    }
  );

  // ===== 40. COST PER UNIT =====
  fastify.get<{ Querystring: any }>(
    '/manufacturing/costing/cost-per-unit',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.calculateCostPerUnit({
          tenantId: decoded.tenantId,
          workOrderId: request.query.workOrderId,
          productId: request.query.productId,
          startDate: request.query.startDate
            ? new Date(request.query.startDate)
            : undefined,
          endDate: request.query.endDate
            ? new Date(request.query.endDate)
            : undefined,
          includeOverhead: request.query.includeOverhead !== 'false',
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: 'Failed to calculate cost per unit',
        });
      }
    }
  );

  // ===== PRODUCTION COST ANALYSIS REPORT =====
  fastify.post<{ Body: any }>(
    '/manufacturing/costing/analysis',
    {
      preHandler: [validate(generateCostAnalysisSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingExtendedService.generateCostAnalysis({
          tenantId: decoded.tenantId,
          generatedBy: decoded.userId,
          ...request.body,
          startDate: new Date(request.body.startDate),
          endDate: new Date(request.body.endDate),
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate analysis',
        });
      }
    }
  );

  fastify.get('/manufacturing/costing/analysis', async (request, reply) => {
    try {
      const decoded = request.user as any;
      // List cost analyses
      return { success: true, data: [] };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch cost analyses',
        });
    }
  });
}
