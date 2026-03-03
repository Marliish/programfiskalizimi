// Employee Management Routes - Clean REST API
// Updated: 2026-02-27 - Simplified for new Prisma service

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { employeeService } from '../services/employee.service';

export async function employeeRoutes(server: FastifyInstance) {
  // Get all employees
  server.get(
    '/employees',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { isActive } = request.query as any;

        console.log('[Employees GET] tenantId:', tenantId, 'isActive:', isActive);

        const employees = await employeeService.getEmployees(
          tenantId,
          isActive === undefined ? undefined : isActive === 'true'
        );

        console.log('[Employees GET] Found', employees.length, 'employees');

        return reply.send({
          success: true,
          data: employees,
        });
      } catch (error: any) {
        console.error('[Employees GET] Error:', error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to fetch employees',
        });
      }
    }
  );

  // Get employee by ID
  server.get(
    '/employees/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { id } = request.params as any;

        const employee = await employeeService.getEmployeeById(tenantId, id);

        if (!employee) {
          return reply.code(404).send({
            success: false,
            error: 'Employee not found',
          });
        }

        reply.send({
          success: true,
          data: employee,
        });
      } catch (error: any) {
        console.error('[Employees GET :id] Error:', error);
        reply.code(500).send({
          success: false,
          error: error.message || 'Failed to fetch employee',
        });
      }
    }
  );

  // Create employee
  server.post(
    '/employees',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const data = request.body as any;

        const employee = await employeeService.createEmployee(tenantId, data);

        reply.code(201).send({
          success: true,
          data: employee,
        });
      } catch (error: any) {
        console.error('[Employees POST] Error:', error);
        reply.code(400).send({
          success: false,
          error: error.message || 'Failed to create employee',
        });
      }
    }
  );

  // Update employee
  server.put(
    '/employees/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { id } = request.params as any;
        const data = request.body as any;

        const employee = await employeeService.updateEmployee(tenantId, id, data);

        reply.send({
          success: true,
          data: employee,
        });
      } catch (error: any) {
        console.error('[Employees PUT] Error:', error);
        reply.code(400).send({
          success: false,
          error: error.message || 'Failed to update employee',
        });
      }
    }
  );

  // Delete employee
  server.delete(
    '/employees/:id',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { id } = request.params as any;

        const employee = await employeeService.deleteEmployee(tenantId, id);

        reply.send({
          success: true,
          data: employee,
        });
      } catch (error: any) {
        console.error('[Employees DELETE] Error:', error);
        reply.code(400).send({
          success: false,
          error: error.message || 'Failed to delete employee',
        });
      }
    }
  );

  // Get employee permissions
  server.get(
    '/employees/:id/permissions',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { id } = request.params as any;

        const permissions = await employeeService.getEmployeePermissions(tenantId, id);

        reply.send({
          success: true,
          data: permissions,
        });
      } catch (error: any) {
        console.error('[Employees GET :id/permissions] Error:', error);
        reply.code(500).send({
          success: false,
          error: error.message || 'Failed to fetch permissions',
        });
      }
    }
  );

  // Check if employee has permission
  server.post(
    '/employees/:id/check-permission',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { id } = request.params as any;
        const { permission } = request.body as any;

        if (!permission) {
          return reply.code(400).send({
            success: false,
            error: 'Permission is required',
          });
        }

        const hasPermission = await employeeService.hasPermission(tenantId, id, permission);

        reply.send({
          success: true,
          data: { hasPermission },
        });
      } catch (error: any) {
        console.error('[Employees POST :id/check-permission] Error:', error);
        reply.code(500).send({
          success: false,
          error: error.message || 'Failed to check permission',
        });
      }
    }
  );
}
