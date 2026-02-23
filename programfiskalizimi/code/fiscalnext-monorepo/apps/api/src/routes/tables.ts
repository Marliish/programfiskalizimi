// Table Management Routes - Restaurant POS
// Built by: Tafa (Backend Developer)

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fiscalnext/database';

// Validation Schemas
const createTableSchema = z.object({
  tableNumber: z.string(),
  name: z.string().optional(),
  capacity: z.number().min(1).max(50).default(4),
  floorPlanId: z.string().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  width: z.number().default(100),
  height: z.number().default(100),
  rotation: z.number().default(0),
  shape: z.enum(['rectangle', 'circle', 'square']).default('rectangle'),
});

const updateTableSchema = createTableSchema.partial();

const updateTableStatusSchema = z.object({
  status: z.enum(['available', 'occupied', 'reserved', 'cleaning']),
  currentOrderId: z.string().optional(),
});

const createFloorPlanSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  layout: z.object({
    width: z.number().default(1200),
    height: z.number().default(800),
    backgroundUrl: z.string().optional(),
    gridSize: z.number().default(20),
  }),
  isDefault: z.boolean().default(false),
});

export async function tablesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // ============================================
  // TABLES CRUD
  // ============================================

  // List all tables
  fastify.get('/tables', async (request, reply) => {
    try {
      const decoded = request.user as any;
      
      const tables = await prisma.table.findMany({
        where: {
          tenantId: decoded.tenantId,
          isActive: true,
        },
        include: {
          floorPlan: true,
          orders: {
            where: { status: 'open' },
            take: 1,
          },
        },
        orderBy: { tableNumber: 'asc' },
      });

      return {
        success: true,
        tables: tables.map(table => ({
          ...table,
          currentOrder: table.orders[0] || null,
          orders: undefined, // Remove nested array
        })),
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch tables',
      });
    }
  });

  // Get single table
  fastify.get<{ Params: { id: string } }>('/tables/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      
      const table = await prisma.table.findFirst({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        include: {
          floorPlan: true,
          location: true,
          orders: {
            where: { status: { in: ['open', 'sent_to_kitchen'] } },
            include: {
              items: {
                include: {
                  product: true,
                  modifiers: true,
                },
              },
            },
          },
        },
      });

      if (!table) {
        return reply.status(404).send({
          success: false,
          error: 'Table not found',
        });
      }

      return { success: true, table };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch table',
      });
    }
  });

  // Create table
  fastify.post<{ Body: z.infer<typeof createTableSchema> }>('/tables', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const data = createTableSchema.parse(request.body);

      // Check if table number already exists
      const existing = await prisma.table.findUnique({
        where: {
          tenantId_tableNumber: {
            tenantId: decoded.tenantId,
            tableNumber: data.tableNumber,
          },
        },
      });

      if (existing) {
        return reply.status(400).send({
          success: false,
          error: 'Table number already exists',
        });
      }

      const table = await prisma.table.create({
        data: {
          ...data,
          tenantId: decoded.tenantId,
          status: 'available',
        },
        include: { floorPlan: true },
      });

      return { success: true, table };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create table',
      });
    }
  });

  // Update table
  fastify.put<{ Params: { id: string }; Body: z.infer<typeof updateTableSchema> }>('/tables/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const data = updateTableSchema.parse(request.body);

      const table = await prisma.table.update({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        data,
        include: { floorPlan: true },
      });

      return { success: true, table };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to update table',
      });
    }
  });

  // Update table status (for quick status changes)
  fastify.patch<{ Params: { id: string }; Body: z.infer<typeof updateTableStatusSchema> }>('/tables/:id/status', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const data = updateTableStatusSchema.parse(request.body);

      const table = await prisma.table.update({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        data: {
          status: data.status,
          currentOrderId: data.currentOrderId,
          updatedAt: new Date(),
        },
      });

      return { success: true, table };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to update table status',
      });
    }
  });

  // Delete table (soft delete)
  fastify.delete<{ Params: { id: string } }>('/tables/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;

      const table = await prisma.table.update({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        data: { isActive: false },
      });

      return { success: true, table };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to delete table',
      });
    }
  });

  // ============================================
  // FLOOR PLANS
  // ============================================

  // List floor plans
  fastify.get('/floor-plans', async (request, reply) => {
    try {
      const decoded = request.user as any;

      const floorPlans = await prisma.floorPlan.findMany({
        where: {
          tenantId: decoded.tenantId,
          isActive: true,
        },
        include: {
          tables: {
            where: { isActive: true },
            include: {
              orders: {
                where: { status: 'open' },
                take: 1,
              },
            },
          },
        },
        orderBy: [
          { isDefault: 'desc' },
          { name: 'asc' },
        ],
      });

      return { success: true, floorPlans };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch floor plans',
      });
    }
  });

  // Get single floor plan
  fastify.get<{ Params: { id: string } }>('/floor-plans/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;

      const floorPlan = await prisma.floorPlan.findFirst({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        include: {
          tables: {
            where: { isActive: true },
            include: {
              orders: {
                where: { status: { in: ['open', 'sent_to_kitchen'] } },
                take: 1,
              },
            },
          },
        },
      });

      if (!floorPlan) {
        return reply.status(404).send({
          success: false,
          error: 'Floor plan not found',
        });
      }

      return { success: true, floorPlan };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch floor plan',
      });
    }
  });

  // Create floor plan
  fastify.post<{ Body: z.infer<typeof createFloorPlanSchema> }>('/floor-plans', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const data = createFloorPlanSchema.parse(request.body);

      // If this is set as default, unset other defaults
      if (data.isDefault) {
        await prisma.floorPlan.updateMany({
          where: {
            tenantId: decoded.tenantId,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      const floorPlan = await prisma.floorPlan.create({
        data: {
          ...data,
          tenantId: decoded.tenantId,
        },
      });

      return { success: true, floorPlan };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to create floor plan',
      });
    }
  });

  // Update floor plan
  fastify.put<{ Params: { id: string }; Body: Partial<z.infer<typeof createFloorPlanSchema>> }>('/floor-plans/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const data = request.body;

      // If setting as default, unset others
      if (data.isDefault) {
        await prisma.floorPlan.updateMany({
          where: {
            tenantId: decoded.tenantId,
            isDefault: true,
            id: { not: request.params.id },
          },
          data: { isDefault: false },
        });
      }

      const floorPlan = await prisma.floorPlan.update({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        data,
      });

      return { success: true, floorPlan };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to update floor plan',
      });
    }
  });

  // Delete floor plan
  fastify.delete<{ Params: { id: string } }>('/floor-plans/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;

      // Check if floor plan has tables
      const tableCount = await prisma.table.count({
        where: {
          floorPlanId: request.params.id,
          isActive: true,
        },
      });

      if (tableCount > 0) {
        return reply.status(400).send({
          success: false,
          error: 'Cannot delete floor plan with active tables',
        });
      }

      const floorPlan = await prisma.floorPlan.update({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        data: { isActive: false },
      });

      return { success: true, floorPlan };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to delete floor plan',
      });
    }
  });

  // Batch update table positions (for drag-drop)
  fastify.patch<{ Body: { updates: Array<{ id: string; positionX: number; positionY: number; rotation?: number }> } }>('/tables/batch-update-positions', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { updates } = request.body;

      // Update all tables in a transaction
      const results = await prisma.$transaction(
        updates.map(update =>
          prisma.table.update({
            where: {
              id: update.id,
              tenantId: decoded.tenantId,
            },
            data: {
              positionX: update.positionX,
              positionY: update.positionY,
              rotation: update.rotation,
              updatedAt: new Date(),
            },
          })
        )
      );

      return {
        success: true,
        updated: results.length,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to update table positions',
      });
    }
  });
}
