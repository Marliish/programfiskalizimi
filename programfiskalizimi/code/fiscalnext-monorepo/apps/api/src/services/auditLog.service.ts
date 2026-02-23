// Audit Log Service
import { prisma } from '@fiscalnext/database';

export interface AuditLogEntry {
  userId: string;
  userName?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const auditLogService = {
  // Get all audit logs
  async getAll(tenantId: string, params?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    // Mock audit logs
    const logs = [
      {
        id: '1',
        tenantId,
        userId: 'user-1',
        userName: 'John Doe',
        action: 'create',
        resourceType: 'product',
        resourceId: 'prod-123',
        changes: {
          name: 'New Coffee Blend',
          price: 15.99,
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date('2026-02-23T14:30:00'),
      },
      {
        id: '2',
        tenantId,
        userId: 'user-2',
        userName: 'Jane Smith',
        action: 'update',
        resourceType: 'customer',
        resourceId: 'cust-456',
        changes: {
          before: { email: 'old@example.com' },
          after: { email: 'new@example.com' },
        },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date('2026-02-23T13:15:00'),
      },
      {
        id: '3',
        tenantId,
        userId: 'user-1',
        userName: 'John Doe',
        action: 'delete',
        resourceType: 'promotion',
        resourceId: 'promo-789',
        changes: {
          name: 'Expired Sale',
          deletedReason: 'Campaign ended',
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date('2026-02-23T12:00:00'),
      },
      {
        id: '4',
        tenantId,
        userId: 'user-3',
        userName: 'Admin User',
        action: 'login',
        resourceType: 'auth',
        ipAddress: '192.168.1.150',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date('2026-02-23T10:45:00'),
      },
      {
        id: '5',
        tenantId,
        userId: 'user-2',
        userName: 'Jane Smith',
        action: 'update',
        resourceType: 'inventory',
        resourceId: 'stock-001',
        changes: {
          before: { quantity: 50 },
          after: { quantity: 45 },
          reason: 'Sale transaction',
        },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date('2026-02-23T09:30:00'),
      },
    ];

    let filtered = logs;
    
    if (params?.userId) {
      filtered = filtered.filter(log => log.userId === params.userId);
    }
    if (params?.action) {
      filtered = filtered.filter(log => log.action === params.action);
    }
    if (params?.resourceType) {
      filtered = filtered.filter(log => log.resourceType === params.resourceType);
    }
    if (params?.startDate) {
      filtered = filtered.filter(log => log.createdAt >= params.startDate!);
    }
    if (params?.endDate) {
      filtered = filtered.filter(log => log.createdAt <= params.endDate!);
    }

    return {
      logs: filtered,
      total: filtered.length,
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 50,
        totalPages: Math.ceil(filtered.length / (params?.limit || 50)),
      },
    };
  },

  // Get activity timeline for specific user
  async getUserActivity(tenantId: string, userId: string, params?: { startDate?: Date; endDate?: Date }) {
    // Mock user activity
    return {
      userId,
      userName: 'John Doe',
      timeline: [
        {
          date: '2026-02-23',
          actions: [
            {
              id: '1',
              time: '14:30',
              action: 'create',
              resourceType: 'product',
              description: 'Created product "New Coffee Blend"',
            },
            {
              id: '3',
              time: '12:00',
              action: 'delete',
              resourceType: 'promotion',
              description: 'Deleted promotion "Expired Sale"',
            },
            {
              id: '4',
              time: '10:45',
              action: 'login',
              resourceType: 'auth',
              description: 'Logged in to the system',
            },
          ],
        },
        {
          date: '2026-02-22',
          actions: [
            {
              id: '6',
              time: '16:20',
              action: 'update',
              resourceType: 'settings',
              description: 'Updated business settings',
            },
          ],
        },
      ],
      totalActions: 4,
    };
  },

  // Get change history for specific resource
  async getResourceHistory(tenantId: string, resourceType: string, resourceId: string) {
    // Mock resource history
    return {
      resourceType,
      resourceId,
      history: [
        {
          id: '1',
          action: 'update',
          userId: 'user-1',
          userName: 'John Doe',
          changes: {
            before: { price: 14.99, stock: 50 },
            after: { price: 15.99, stock: 50 },
          },
          timestamp: new Date('2026-02-23T14:30:00'),
        },
        {
          id: '2',
          action: 'update',
          userId: 'user-2',
          userName: 'Jane Smith',
          changes: {
            before: { stock: 55 },
            after: { stock: 50 },
          },
          timestamp: new Date('2026-02-22T10:15:00'),
        },
        {
          id: '3',
          action: 'create',
          userId: 'user-1',
          userName: 'John Doe',
          changes: {
            name: 'Coffee Blend',
            price: 14.99,
            stock: 55,
          },
          timestamp: new Date('2026-02-20T09:00:00'),
        },
      ],
      totalChanges: 3,
    };
  },

  // Create audit log entry
  async create(tenantId: string, data: AuditLogEntry) {
    // Mock create
    return {
      id: Math.random().toString(36).substr(2, 9),
      tenantId,
      ...data,
      createdAt: new Date(),
    };
  },

  // Export audit logs
  async export(tenantId: string, params?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    format?: 'csv' | 'json';
  }) {
    // Mock export
    return {
      filename: `audit-logs-${new Date().toISOString().split('T')[0]}.${params?.format || 'csv'}`,
      url: '/exports/audit-logs-2026-02-23.csv',
      recordCount: 125,
      generatedAt: new Date(),
    };
  },

  // Get audit statistics
  async getStats(tenantId: string, params?: { startDate?: Date; endDate?: Date }) {
    // Mock stats
    return {
      totalActions: 523,
      byAction: {
        create: 145,
        update: 298,
        delete: 45,
        login: 35,
      },
      byResourceType: {
        product: 156,
        customer: 89,
        transaction: 234,
        inventory: 44,
      },
      byUser: [
        { userId: 'user-1', userName: 'John Doe', count: 234 },
        { userId: 'user-2', userName: 'Jane Smith', count: 189 },
        { userId: 'user-3', userName: 'Admin User', count: 100 },
      ],
      topUsers: [
        { userId: 'user-1', userName: 'John Doe', actionCount: 234 },
        { userId: 'user-2', userName: 'Jane Smith', actionCount: 189 },
      ],
    };
  },

  // Search audit logs
  async search(tenantId: string, query: string) {
    // Mock search
    return {
      results: [
        {
          id: '1',
          userId: 'user-1',
          userName: 'John Doe',
          action: 'create',
          resourceType: 'product',
          description: 'Created product "New Coffee Blend"',
          createdAt: new Date('2026-02-23T14:30:00'),
        },
      ],
      total: 1,
    };
  },
};
