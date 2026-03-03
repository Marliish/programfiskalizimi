// Audit Log Routes
// Created: 2026-02-23 - Day 6

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { auditService } from '../services/audit.service';
import { queryAuditLogsSchema, exportAuditLogsSchema } from '../schemas/audit.schema';
import { validateRequest } from '../middleware/validate';

export async function auditRoutes(server: FastifyInstance) {
  // Query audit logs
  server.get(
    '/audit',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;

        // Parse query parameters
        const rawQuery = request.query as any;
        const queryInput = {
          ...rawQuery,
          limit: rawQuery.limit ? parseInt(rawQuery.limit) : 100,
          offset: rawQuery.offset ? parseInt(rawQuery.offset) : 0,
        };
        
        const query = validateRequest(queryAuditLogsSchema, queryInput);
        const result = await auditService.queryLogs(tenantId, query);

        return reply.send({
          success: true,
          data: result.logs,
          meta: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
          },
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get entity history
  server.get(
    '/audit/:entityType/:entityId',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;
        const { entityType, entityId } = request.params as any;
        const { limit } = request.query as any;

        const history = await auditService.getEntityHistory(
          tenantId,
          entityType,
          entityId,
          limit ? parseInt(limit) : 50
        );

        // Log the view
        await auditService.logView(tenantId, userId, entityType, entityId, request);

        reply.send({
          success: true,
          data: history,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get user activity
  server.get(
    '/audit/user/:userId',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { userId } = request.params as any;
        const { limit } = request.query as any;

        const activity = await auditService.getUserActivity(
          tenantId,
          userId,
          limit ? parseInt(limit) : 100
        );

        reply.send({
          success: true,
          data: activity,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get activity summary
  server.get(
    '/audit/summary',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { startDate, endDate } = request.query as any;

        const summary = await auditService.getActivitySummary(
          tenantId,
          startDate,
          endDate
        );

        reply.send({
          success: true,
          data: summary,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Export audit logs
  server.post(
    '/audit/export',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const query = validateRequest(exportAuditLogsSchema, request.body);
        const result = await auditService.exportLogs(tenantId, query);

        // Log the export action
        await auditService.logExport(tenantId, userId, 'audit_logs', query, request);

        if (result.format === 'csv') {
          reply
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`)
            .send(result.data);
        } else {
          reply
            .header('Content-Type', 'application/json')
            .header('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.json`)
            .send({
              success: true,
              data: result.data,
            });
        }
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );
}
