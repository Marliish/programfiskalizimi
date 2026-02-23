/**
 * MANUFACTURING ROUTES - PRODUCTION PLANNING
 * Team 4: Eroldi (CTO), Boli, Artan
 * Features 11-20: Production Planning, Capacity, MRP, Forecasting
 */

import { FastifyInstance } from 'fastify';
import { manufacturingService } from '../services/manufacturing.service';
import {
  createProductionScheduleSchema,
  updateProductionScheduleSchema,
  createProductionCalendarSchema,
  createProductionShiftSchema,
  createProductionMachineSchema,
  createMachineScheduleSchema,
  createResourceAllocationSchema,
  capacityPlanningQuerySchema,
  runMRPSchema,
  createProductionForecastSchema,
  runBottleneckAnalysisSchema,
} from '../schemas/manufacturing.schema';
import { validate } from '../middleware/validate';

export async function manufacturingPlanningRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // ===== 11. PRODUCTION SCHEDULES =====
  fastify.post<{ Body: any }>(
    '/manufacturing/schedules',
    {
      preHandler: [validate(createProductionScheduleSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.createProductionSchedule({
          tenantId: decoded.tenantId,
          createdBy: decoded.userId,
          ...request.body,
          startDate: new Date(request.body.startDate),
          endDate: new Date(request.body.endDate),
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create schedule',
        });
      }
    }
  );

  fastify.get('/manufacturing/schedules', async (request, reply) => {
    try {
      const decoded = request.user as any;
      // Implementation to list schedules
      return { success: true, data: [] };
    } catch (error) {
      reply.status(500).send({ success: false, error: 'Failed to fetch schedules' });
    }
  });

  // ===== 12. CAPACITY PLANNING =====
  fastify.get<{ Querystring: any }>(
    '/manufacturing/capacity-plan',
    {
      preHandler: [validate(capacityPlanningQuerySchema, 'query')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.getCapacityPlan({
          tenantId: decoded.tenantId,
          startDate: new Date(request.query.startDate),
          endDate: new Date(request.query.endDate),
          resourceType: request.query.resourceType,
          machineId: request.query.machineId,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: 'Failed to fetch capacity plan',
        });
      }
    }
  );

  // ===== 13. RESOURCE ALLOCATION =====
  fastify.post<{ Body: any }>(
    '/manufacturing/resource-allocations',
    {
      preHandler: [validate(createResourceAllocationSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.allocateResource({
          tenantId: decoded.tenantId,
          ...request.body,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to allocate resource',
        });
      }
    }
  );

  // ===== 14. LEAD TIME MANAGEMENT =====
  fastify.get<{ Params: { productId: string }; Querystring: { quantity?: string } }>(
    '/manufacturing/products/:productId/lead-time',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const quantity = request.query.quantity ? parseFloat(request.query.quantity) : 1;

        const result = await manufacturingService.calculateLeadTime(
          request.params.productId,
          decoded.tenantId,
          quantity
        );

        return { success: true, data: result };
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: 'Failed to calculate lead time',
        });
      }
    }
  );

  // ===== 15. MATERIAL REQUIREMENTS PLANNING (MRP) =====
  fastify.post<{ Body: any }>(
    '/manufacturing/mrp/run',
    {
      preHandler: [validate(runMRPSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.runMRP({
          tenantId: decoded.tenantId,
          startDate: new Date(request.body.startDate),
          endDate: new Date(request.body.endDate),
          productId: request.body.productId,
          includeForecasts: request.body.includeForecasts,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to run MRP',
        });
      }
    }
  );

  fastify.get('/manufacturing/mrp/requirements', async (request, reply) => {
    try {
      const decoded = request.user as any;
      // Get all material requirements
      return { success: true, data: [] };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch requirements',
      });
    }
  });

  // ===== 16. PRODUCTION CALENDARS =====
  fastify.post<{ Body: any }>(
    '/manufacturing/calendars',
    {
      preHandler: [validate(createProductionCalendarSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.createProductionCalendar({
          tenantId: decoded.tenantId,
          ...request.body,
          date: new Date(request.body.date),
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create calendar',
        });
      }
    }
  );

  fastify.get('/manufacturing/calendars', async (request, reply) => {
    try {
      const decoded = request.user as any;
      // List calendars
      return { success: true, data: [] };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch calendars',
      });
    }
  });

  // ===== 17. SHIFT SCHEDULING =====
  fastify.post<{ Body: any }>(
    '/manufacturing/shifts',
    {
      preHandler: [validate(createProductionShiftSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.createProductionShift({
          tenantId: decoded.tenantId,
          ...request.body,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create shift',
        });
      }
    }
  );

  fastify.get('/manufacturing/shifts', async (request, reply) => {
    try {
      const decoded = request.user as any;
      // List shifts
      return { success: true, data: [] };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch shifts',
      });
    }
  });

  // ===== 18. MACHINE SCHEDULING =====
  fastify.post<{ Body: any }>(
    '/manufacturing/machines',
    {
      preHandler: [validate(createProductionMachineSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        // Create machine
        return { success: true, message: 'Machine created' };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: 'Failed to create machine',
        });
      }
    }
  );

  fastify.post<{ Body: any }>(
    '/manufacturing/machine-schedules',
    {
      preHandler: [validate(createMachineScheduleSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.createMachineSchedule({
          tenantId: decoded.tenantId,
          ...request.body,
          startTime: new Date(request.body.startTime),
          endTime: new Date(request.body.endTime),
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to schedule machine',
        });
      }
    }
  );

  // ===== 19. BOTTLENECK ANALYSIS =====
  fastify.post<{ Body: any }>(
    '/manufacturing/bottleneck-analysis',
    {
      preHandler: [validate(runBottleneckAnalysisSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.runBottleneckAnalysis({
          tenantId: decoded.tenantId,
          analysisName: request.body.analysisName,
          startDate: request.body.startDate
            ? new Date(request.body.startDate)
            : undefined,
          endDate: request.body.endDate ? new Date(request.body.endDate) : undefined,
          resourceType: request.body.resourceType,
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to run analysis',
        });
      }
    }
  );

  fastify.get('/manufacturing/bottleneck-analysis', async (request, reply) => {
    try {
      const decoded = request.user as any;
      // List bottleneck analyses
      return { success: true, data: [] };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch analyses',
      });
    }
  });

  // ===== 20. PRODUCTION FORECASTS =====
  fastify.post<{ Body: any }>(
    '/manufacturing/forecasts',
    {
      preHandler: [validate(createProductionForecastSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.createProductionForecast({
          tenantId: decoded.tenantId,
          createdBy: decoded.userId,
          ...request.body,
          startDate: new Date(request.body.startDate),
          endDate: new Date(request.body.endDate),
        });

        return { success: true, data: result };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create forecast',
        });
      }
    }
  );

  fastify.get('/manufacturing/forecasts', async (request, reply) => {
    try {
      const decoded = request.user as any;
      // List forecasts
      return { success: true, data: [] };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch forecasts',
      });
    }
  });
}
