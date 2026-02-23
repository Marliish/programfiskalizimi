// Audit Logs Routes
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { auditLogService } from '../services/auditLog.service';

export async function auditLogRoutes(server: FastifyInstance) {
  // Get all audit logs
  server.get(
    '/',
    {
      onRequest: [server.authenticate],
    },
    async (request: FastifyRequest<{
      Querystring: {
        userId?: string;
        action?: string;
        resourceType?: string;
        startDate?: string;
        endDate?: string;
        page?: string;
        limit?: string;
      };
    }>, reply: FastifyReply) => {
      try {
        const { tenantId } = request.user as any;
        const { userId, action, resourceType, startDate, endDate, page, limit } = request.query;

        const result = await auditLogService.getAll(tenantId, {
          userId,
          action,
          resourceType,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          page: page ? parseInt(page) : 1,
          limit: limit ? parseInt(limit) : 50,
        });

        return reply.send({
          success: true,
          ...result,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: error.message || 'Failed to fetch audit logs',
        });
      }
    }
  );

  // Get user activity timeline
  server.get(
    '/users/:userId/activity',
    {
      onRequest: [server.authenticate],
    },
    async (request: FastifyRequest<{
      Params: { userId: string };
      Querystring: { startDate?: string; endDate?: string };
    }>, reply: FastifyReply) => {
      try {
        const { tenantId } = request.user as any;
        const { userId } = request.params;
        const { startDate, endDate } = request.query;

        const result = await auditLogService.getUserActivity(tenantId, userId, {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        });

        return reply.send({
          success: true,
          ...result,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: error.message || 'Failed to fetch user activity',
        });
      }
    }
  );

  // Get resource history
  server.get(
    '/resources/:resourceType/:resourceId/history',
    {
      onRequest: [server.authenticate],
    },
    async (request: FastifyRequest<{
      Params: { resourceType: string; resourceId: string };
    }>, reply: FastifyReply) => {
      try {
        const { tenantId } = request.user as any;
        const { resourceType, resourceId } = request.params;

        const result = await auditLogService.getResourceHistory(tenantId, resourceType, resourceId);

        return reply.send({
          success: true,
          ...result,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: error.message || 'Failed to fetch resource history',
        });
      }
    }
  );

  // Create audit log
  server.post(
    '/',
    {
      onRequest: [server.authenticate],
    },
    async (request: FastifyRequest<{
      Body: any;
    }>, reply: FastifyReply) => {
      try {
        const { tenantId } = request.user as any;
        const log = await auditLogService.create(tenantId, request.body);

        return reply.status(201).send({
          success: true,
          log,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: error.message || 'Failed to create audit log',
        });
      }
    }
  );

  // Export audit logs
  server.post(
    '/export',
    {
      onRequest: [server.authenticate],
    },
    async (request: FastifyRequest<{
      Body: {
        userId?: string;
        startDate?: string;
        endDate?: string;
        format?: 'csv' | 'json';
      };
    }>, reply: FastifyReply) => {
      try {
        const { tenantId } = request.user as any;
        const { userId, startDate, endDate, format } = request.body;

        const result = await auditLogService.export(tenantId, {
          userId,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          format,
        });

        return reply.send({
          success: true,
          ...result,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: error.message || 'Failed to export audit logs',
        });
      }
    }
  );

  // Get audit statistics
  server.get(
    '/stats',
    {
      onRequest: [server.authenticate],
    },
    async (request: FastifyRequest<{
      Querystring: { startDate?: string; endDate?: string };
    }>, reply: FastifyReply) => {
      try {
        const { tenantId } = request.user as any;
        const { startDate, endDate } = request.query;

        const result = await auditLogService.getStats(tenantId, {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        });

        return reply.send({
          success: true,
          stats: result,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: error.message || 'Failed to fetch audit statistics',
        });
      }
    }
  );

  // Search audit logs
  server.get(
    '/search',
    {
      onRequest: [server.authenticate],
    },
    async (request: FastifyRequest<{
      Querystring: { q: string };
    }>, reply: FastifyReply) => {
      try {
        const { tenantId } = request.user as any;
        const { q } = request.query;

        const result = await auditLogService.search(tenantId, q);

        return reply.send({
          success: true,
          ...result,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: error.message || 'Failed to search audit logs',
        });
      }
    }
  );
}
