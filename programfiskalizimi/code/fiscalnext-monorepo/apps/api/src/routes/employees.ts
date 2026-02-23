// Employee Management Routes
// Created: 2026-02-23 - Day 6

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { employeeService } from '../services/employee.service';
import { auditService } from '../services/audit.service';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  clockInSchema,
  clockOutSchema,
  performanceQuerySchema,
} from '../schemas/employee.schema';
import { validateRequest } from '../middleware/validate';

export async function employeeRoutes(server: FastifyInstance) {
  // Create employee
  server.post(
    '/employees',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const data = validateRequest(createEmployeeSchema, request.body);
        const employee = await employeeService.createEmployee(tenantId, data);

        // Audit log
        await auditService.logCreate(tenantId, userId, 'employee', 
          Array.isArray(employee) && employee[0] ? employee[0].id : null, 
          employee, request);

        reply.code(201).send({
          success: true,
          data: Array.isArray(employee) && employee[0] ? employee[0] : employee,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get all employees
  server.get(
    '/employees',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { includeInactive } = request.query as any;

        const employees = await employeeService.getEmployees(
          tenantId,
          includeInactive === 'true'
        );

        reply.send({
          success: true,
          data: employees,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
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
        reply.code(400).send({
          success: false,
          error: error.message,
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
        const userId = (request.user as any).userId;
        const { id } = request.params as any;

        const before = await employeeService.getEmployeeById(tenantId, id);
        const data = validateRequest(updateEmployeeSchema, request.body);
        const employee = await employeeService.updateEmployee(tenantId, id, data);

        // Audit log
        await auditService.logUpdate(tenantId, userId, 'employee', id, before, employee, request);

        reply.send({
          success: true,
          data: Array.isArray(employee) && employee[0] ? employee[0] : employee,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
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
        const userId = (request.user as any).userId;
        const { id } = request.params as any;

        const before = await employeeService.getEmployeeById(tenantId, id);
        const employee = await employeeService.deleteEmployee(tenantId, id);

        // Audit log
        await auditService.logDelete(tenantId, userId, 'employee', id, before, request);

        reply.send({
          success: true,
          data: Array.isArray(employee) && employee[0] ? employee[0] : employee,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Clock in
  server.post(
    '/employees/clock-in',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const data = validateRequest(clockInSchema, request.body);
        const shift = await employeeService.clockIn(tenantId, data);

        // Audit log
        await auditService.logCreate(tenantId, userId, 'shift', 
          Array.isArray(shift) && shift[0] ? shift[0].id : null, 
          shift, request);

        reply.code(201).send({
          success: true,
          data: Array.isArray(shift) && shift[0] ? shift[0] : shift,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Clock out
  server.post(
    '/employees/clock-out',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const userId = (request.user as any).userId;

        const data = validateRequest(clockOutSchema, request.body);
        const shift = await employeeService.clockOut(tenantId, data);

        // Audit log
        await auditService.logUpdate(tenantId, userId, 'shift', data.shiftId, {}, shift, request);

        reply.send({
          success: true,
          data: Array.isArray(shift) && shift[0] ? shift[0] : shift,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get active shift
  server.get(
    '/employees/:id/active-shift',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { id } = request.params as any;

        const shift = await employeeService.getActiveShift(tenantId, id);

        reply.send({
          success: true,
          data: shift,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get employee performance
  server.get(
    '/employees/performance',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const query = validateRequest(performanceQuerySchema, request.query);

        const performance = await employeeService.getPerformance(tenantId, query);

        reply.send({
          success: true,
          data: performance,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Calculate commission
  server.get(
    '/employees/:id/commission',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request.user as any).tenantId;
        const { id } = request.params as any;
        const { startDate, endDate } = request.query as any;

        if (!startDate || !endDate) {
          return reply.code(400).send({
            success: false,
            error: 'startDate and endDate are required',
          });
        }

        const commission = await employeeService.calculateCommission(
          tenantId,
          id,
          startDate,
          endDate
        );

        reply.send({
          success: true,
          data: commission,
        });
      } catch (error: any) {
        reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );
}
