// Audit Log Service
// Created: 2026-02-23 - Day 6

import { PrismaClient } from '@fiscalnext/database';
import type {
  CreateAuditLogInput,
  QueryAuditLogsInput,
  ExportAuditLogsInput,
} from '../schemas/audit.schema';

const prisma = new PrismaClient();

export class AuditService {
  // Create audit log
  async createLog(tenantId: string, userId: string | null, data: CreateAuditLogInput, request?: any) {
    const ipAddress = request?.ip || request?.headers?.['x-forwarded-for'] || null;
    const userAgent = request?.headers?.['user-agent'] || null;

    return await prisma.$queryRawUnsafe(`
      INSERT INTO audit_logs (
        tenant_id, user_id, action, entity_type, entity_id,
        changes, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      tenantId,
      userId,
      data.action,
      data.entityType,
      data.entityId || null,
      data.changes ? JSON.stringify(data.changes) : null,
      ipAddress,
      userAgent
    );
  }

  // Log create action
  async logCreate(
    tenantId: string,
    userId: string | null,
    entityType: string,
    entityId: string,
    entityData: any,
    request?: any
  ) {
    return await this.createLog(
      tenantId,
      userId,
      {
        action: 'create',
        entityType,
        entityId,
        changes: { after: entityData },
      },
      request
    );
  }

  // Log update action
  async logUpdate(
    tenantId: string,
    userId: string | null,
    entityType: string,
    entityId: string,
    before: any,
    after: any,
    request?: any
  ) {
    return await this.createLog(
      tenantId,
      userId,
      {
        action: 'update',
        entityType,
        entityId,
        changes: { before, after },
      },
      request
    );
  }

  // Log delete action
  async logDelete(
    tenantId: string,
    userId: string | null,
    entityType: string,
    entityId: string,
    entityData: any,
    request?: any
  ) {
    return await this.createLog(
      tenantId,
      userId,
      {
        action: 'delete',
        entityType,
        entityId,
        changes: { before: entityData },
      },
      request
    );
  }

  // Log view action
  async logView(
    tenantId: string,
    userId: string | null,
    entityType: string,
    entityId: string,
    request?: any
  ) {
    return await this.createLog(
      tenantId,
      userId,
      {
        action: 'view',
        entityType,
        entityId,
      },
      request
    );
  }

  // Log export action
  async logExport(
    tenantId: string,
    userId: string | null,
    entityType: string,
    filters: any,
    request?: any
  ) {
    return await this.createLog(
      tenantId,
      userId,
      {
        action: 'export',
        entityType,
        changes: { filters },
      },
      request
    );
  }

  // Query audit logs
  async queryLogs(tenantId: string, query: QueryAuditLogsInput) {
    let whereClause = 'WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (query.userId) {
      whereClause += ` AND user_id = $${paramIndex++}`;
      params.push(query.userId);
    }

    if (query.action) {
      whereClause += ` AND action = $${paramIndex++}`;
      params.push(query.action);
    }

    if (query.entityType) {
      whereClause += ` AND entity_type = $${paramIndex++}`;
      params.push(query.entityType);
    }

    if (query.entityId) {
      whereClause += ` AND entity_id = $${paramIndex++}`;
      params.push(query.entityId);
    }

    if (query.startDate) {
      whereClause += ` AND created_at >= $${paramIndex++}`;
      params.push(query.startDate);
    }

    if (query.endDate) {
      whereClause += ` AND created_at <= $${paramIndex++}`;
      params.push(query.endDate);
    }

    params.push(query.limit);
    params.push(query.offset);

    const logs = await prisma.$queryRawUnsafe(`
      SELECT 
        al.*,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex++}
    `, ...params);

    // Get total count
    const countResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM audit_logs
      ${whereClause}
    `, ...params.slice(0, -2));

    const total = Array.isArray(countResult) && countResult[0] 
      ? Number(countResult[0].total) 
      : 0;

    return {
      logs,
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  // Get logs for specific entity
  async getEntityHistory(
    tenantId: string,
    entityType: string,
    entityId: string,
    limit = 50
  ) {
    return await prisma.$queryRawUnsafe(`
      SELECT 
        al.*,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.tenant_id = $1 
        AND al.entity_type = $2 
        AND al.entity_id = $3
      ORDER BY al.created_at DESC
      LIMIT $4
    `, tenantId, entityType, entityId, limit);
  }

  // Get user activity
  async getUserActivity(tenantId: string, userId: string, limit = 100) {
    return await prisma.$queryRawUnsafe(`
      SELECT * FROM audit_logs
      WHERE tenant_id = $1 AND user_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `, tenantId, userId, limit);
  }

  // Get activity summary
  async getActivitySummary(tenantId: string, startDate?: string, endDate?: string) {
    let whereClause = 'WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (startDate) {
      whereClause += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    return await prisma.$queryRawUnsafe(`
      SELECT 
        action,
        entity_type,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM audit_logs
      ${whereClause}
      GROUP BY action, entity_type
      ORDER BY count DESC
    `, ...params);
  }

  // Export audit logs
  async exportLogs(tenantId: string, query: ExportAuditLogsInput) {
    // Build query
    const queryInput: QueryAuditLogsInput = {
      userId: query.userId,
      action: query.action,
      entityType: query.entityType,
      startDate: query.startDate,
      endDate: query.endDate,
      limit: 10000, // Export limit
      offset: 0,
    };

    const result = await this.queryLogs(tenantId, queryInput);
    const logs = Array.isArray(result.logs) ? result.logs : [];

    if (query.format === 'csv') {
      // Convert to CSV
      const headers = [
        'ID', 'User Email', 'Action', 'Entity Type', 'Entity ID',
        'IP Address', 'User Agent', 'Created At'
      ];

      const rows = logs.map((log: any) => [
        log.id,
        log.user_email || '',
        log.action,
        log.entity_type,
        log.entity_id || '',
        log.ip_address || '',
        log.user_agent || '',
        log.created_at,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return { format: 'csv', data: csv };
    } else {
      // Return JSON
      return { format: 'json', data: logs };
    }
  }

  // Clean up old logs (retention policy - 2 years)
  async cleanupOldLogs(tenantId: string, retentionDays = 730) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    return await prisma.$queryRawUnsafe(`
      DELETE FROM audit_logs
      WHERE tenant_id = $1 AND created_at < $2
      RETURNING COUNT(*) as deleted_count
    `, tenantId, cutoffDate.toISOString());
  }
}

export const auditService = new AuditService();
