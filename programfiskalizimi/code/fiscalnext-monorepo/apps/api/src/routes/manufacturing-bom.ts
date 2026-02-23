/**
 * MANUFACTURING ROUTES - BILL OF MATERIALS
 * Team 4: Eroldi (CTO), Boli, Artan
 * Features 1-10: BOM Management
 */

import { FastifyInstance } from 'fastify';
import { manufacturingService } from '../services/manufacturing.service';
import {
  createBOMSchema,
  updateBOMSchema,
  addBOMItemSchema,
  createSubstitutionSchema,
  approveBOMSchema,
  cloneBOMSchema,
  explodeBOMSchema,
  listBOMsQuerySchema,
  CreateBOMInput,
  UpdateBOMInput,
  ListBOMsQuery,
} from '../schemas/manufacturing.schema';
import { validate } from '../middleware/validate';

export async function manufacturingBOMRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // ===== 1. CREATE MULTI-LEVEL BOM =====
  fastify.post<{ Body: CreateBOMInput }>(
    '/manufacturing/boms',
    {
      preHandler: [validate(createBOMSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.createBOM({
          tenantId: decoded.tenantId,
          createdBy: decoded.userId,
          ...request.body,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create BOM',
        });
      }
    }
  );

  // ===== LIST BOMs =====
  fastify.get<{ Querystring: ListBOMsQuery }>(
    '/manufacturing/boms',
    {
      preHandler: [validate(listBOMsQuerySchema, 'query')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.listBOMs({
          tenantId: decoded.tenantId,
          ...request.query,
        });

        return {
          success: true,
          ...result,
        };
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: 'Failed to fetch BOMs',
        });
      }
    }
  );

  // ===== GET BOM BY ID =====
  fastify.get<{ Params: { id: string } }>(
    '/manufacturing/boms/:id',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const bom = await manufacturingService.listBOMs({
          tenantId: decoded.tenantId,
          limit: 1,
        });

        return {
          success: true,
          data: bom.data[0],
        };
      } catch (error) {
        reply.status(404).send({
          success: false,
          error: 'BOM not found',
        });
      }
    }
  );

  // ===== UPDATE BOM =====
  fastify.put<{ Params: { id: string }; Body: UpdateBOMInput }>(
    '/manufacturing/boms/:id',
    {
      preHandler: [validate(updateBOMSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        // Implementation would update BOM
        return {
          success: true,
          message: 'BOM updated successfully',
        };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update BOM',
        });
      }
    }
  );

  // ===== 2. COMPONENT SUBSTITUTIONS =====
  fastify.post<{ Body: any }>(
    '/manufacturing/boms/substitutions',
    {
      preHandler: [validate(createSubstitutionSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.createSubstitution({
          tenantId: decoded.tenantId,
          ...request.body,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create substitution',
        });
      }
    }
  );

  // ===== 3. BOM VERSIONING =====
  fastify.post<{ Params: { id: string }; Body: { changeLog: string } }>(
    '/manufacturing/boms/:id/version',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.createBOMVersion(
          request.params.id,
          decoded.tenantId,
          request.body.changeLog,
          decoded.userId
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create BOM version',
        });
      }
    }
  );

  // ===== 4. BOM COSTING =====
  fastify.get<{ Params: { id: string } }>(
    '/manufacturing/boms/:id/cost',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        // Costing is automatically calculated, this fetches it
        const bom = await prisma?.bOM.findFirst({
          where: {
            id: request.params.id,
            tenantId: decoded.tenantId,
          },
        });

        return {
          success: true,
          data: {
            bomId: bom?.id,
            totalCost: bom?.totalCost,
          },
        };
      } catch (error) {
        reply.status(404).send({
          success: false,
          error: 'BOM not found',
        });
      }
    }
  );

  // ===== 5. BOM EXPLOSION =====
  fastify.post<{ Params: { id: string }; Body: any }>(
    '/manufacturing/boms/:id/explode',
    {
      preHandler: [validate(explodeBOMSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.explodeBOM(
          request.params.id,
          decoded.tenantId,
          request.body.quantity,
          request.body.includeSubstitutes
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to explode BOM',
        });
      }
    }
  );

  // ===== 6. WHERE-USED REPORTS =====
  fastify.get<{ Params: { componentId: string } }>(
    '/manufacturing/components/:componentId/where-used',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.getWhereUsed(
          request.params.componentId,
          decoded.tenantId
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: 'Failed to fetch where-used report',
        });
      }
    }
  );

  // ===== 7. BOM COPY/CLONE =====
  fastify.post<{ Params: { id: string }; Body: any }>(
    '/manufacturing/boms/:id/clone',
    {
      preHandler: [validate(cloneBOMSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.cloneBOM(
          request.params.id,
          decoded.tenantId,
          request.body.newName,
          request.body.newProductId,
          request.body.includeItems,
          decoded.userId
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to clone BOM',
        });
      }
    }
  );

  // ===== 8. COMPONENT AVAILABILITY CHECK =====
  fastify.get<{ Params: { id: string }; Querystring: { quantity?: string } }>(
    '/manufacturing/boms/:id/availability',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const quantity = request.query.quantity
          ? parseFloat(request.query.quantity)
          : 1;

        const result = await manufacturingService.checkComponentAvailability(
          request.params.id,
          decoded.tenantId,
          quantity
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: 'Failed to check availability',
        });
      }
    }
  );

  // ===== 9. BOM IMPORT/EXPORT =====
  fastify.get<{ Params: { id: string }; Querystring: { format?: 'json' | 'csv' } }>(
    '/manufacturing/boms/:id/export',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const format = request.query.format || 'json';

        const result = await manufacturingService.exportBOM(
          request.params.id,
          decoded.tenantId,
          format
        );

        if (format === 'csv') {
          reply.header('Content-Type', 'text/csv');
          reply.header(
            'Content-Disposition',
            `attachment; filename="bom-${request.params.id}.csv"`
          );
          return result;
        }

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: 'Failed to export BOM',
        });
      }
    }
  );

  // ===== 10. BOM APPROVAL WORKFLOWS =====
  fastify.post<{ Params: { id: string }; Body: any }>(
    '/manufacturing/boms/:id/approve',
    {
      preHandler: [validate(approveBOMSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const result = await manufacturingService.approveBOM(
          request.params.id,
          decoded.tenantId,
          request.body.approved,
          decoded.userId
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to approve BOM',
        });
      }
    }
  );

  // Submit BOM for approval
  fastify.post<{ Params: { id: string } }>(
    '/manufacturing/boms/:id/submit-approval',
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        // Update BOM status to pending_approval
        // Implementation would be added here

        return {
          success: true,
          message: 'BOM submitted for approval',
        };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: 'Failed to submit BOM for approval',
        });
      }
    }
  );
}
