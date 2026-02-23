import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fiscalnext/database';

// Validation Schemas
const employeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationalId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('AL'),
  department: z.string().optional(),
  position: z.string().optional(),
  hireDate: z.string(),
  employmentType: z.enum(['full_time', 'part_time', 'contractor']).default('full_time'),
  salary: z.number().positive(),
  currency: z.string().default('ALL'),
  payFrequency: z.enum(['monthly', 'biweekly', 'weekly']).default('monthly'),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  taxId: z.string().optional(),
  socialSecurityNumber: z.string().optional(),
  healthInsuranceNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

const payrollRunSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  payDate: z.string(),
  notes: z.string().optional(),
});

const payrollRunItemSchema = z.object({
  employeeId: z.string().uuid(),
  baseSalary: z.number().nonnegative().default(0),
  overtimePay: z.number().nonnegative().default(0),
  bonuses: z.number().nonnegative().default(0),
  incomeTax: z.number().nonnegative().default(0),
  socialSecurity: z.number().nonnegative().default(0),
  healthInsurance: z.number().nonnegative().default(0),
  otherDeductions: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

const payrollRoutes: FastifyPluginAsync = async (fastify) => {
  // ========================================
  // EMPLOYEE MANAGEMENT
  // ========================================

  // List all employees
  fastify.get('/employees', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    
    const employees = await prisma.employee.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: {
        employeeNumber: 'asc',
      },
    });
    
    return { employees };
  });

  // Get single employee
  fastify.get('/employees/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const employee = await prisma.employee.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        payrollRunItems: {
          include: {
            payrollRun: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });
    
    if (!employee) {
      return reply.status(404).send({ error: 'Employee not found' });
    }
    
    return { employee };
  });

  // Create employee
  fastify.post('/employees', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const data = employeeSchema.parse(request.body);
    
    // Generate employee number
    const count = await prisma.employee.count({ where: { tenantId } });
    const employeeNumber = `EMP-${String(count + 1).padStart(5, '0')}`;
    
    const employee = await prisma.employee.create({
      data: {
        ...data,
        employeeNumber,
        tenantId,
        hireDate: new Date(data.hireDate),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      },
    });
    
    return reply.status(201).send({ employee });
  });

  // Update employee
  fastify.put('/employees/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const data = employeeSchema.partial().parse(request.body);
    
    const employee = await prisma.employee.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    
    if (!employee) {
      return reply.status(404).send({ error: 'Employee not found' });
    }
    
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...data,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });
    
    return { employee: updated };
  });

  // Soft delete employee
  fastify.delete('/employees/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const employee = await prisma.employee.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    
    if (!employee) {
      return reply.status(404).send({ error: 'Employee not found' });
    }
    
    await prisma.employee.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'terminated',
        terminationDate: new Date(),
      },
    });
    
    return { success: true };
  });

  // ========================================
  // PAYROLL RUNS
  // ========================================

  // List payroll runs
  fastify.get('/payroll-runs', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    
    const runs = await prisma.payrollRun.findMany({
      where: { tenantId },
      include: {
        items: {
          include: {
            employee: true,
          },
        },
      },
      orderBy: {
        periodStart: 'desc',
      },
    });
    
    return { runs };
  });

  // Get single payroll run
  fastify.get('/payroll-runs/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const run = await prisma.payrollRun.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            employee: true,
          },
        },
      },
    });
    
    if (!run) {
      return reply.status(404).send({ error: 'Payroll run not found' });
    }
    
    return { run };
  });

  // Create payroll run
  fastify.post('/payroll-runs', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const data = payrollRunSchema.parse(request.body);
    
    // Generate run number
    const count = await prisma.payrollRun.count({ where: { tenantId } });
    const runNumber = `PR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    const run = await prisma.payrollRun.create({
      data: {
        ...data,
        runNumber,
        tenantId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        payDate: new Date(data.payDate),
      },
    });
    
    return reply.status(201).send({ run });
  });

  // Add employee to payroll run
  fastify.post('/payroll-runs/:id/items', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const data = payrollRunItemSchema.parse(request.body);
    
    const run = await prisma.payrollRun.findFirst({
      where: { id, tenantId, status: 'draft' },
    });
    
    if (!run) {
      return reply.status(404).send({ error: 'Payroll run not found or already processed' });
    }
    
    // Calculate totals
    const grossPay = data.baseSalary + data.overtimePay + data.bonuses;
    const totalDeductions = data.incomeTax + data.socialSecurity + data.healthInsurance + data.otherDeductions;
    const netPay = grossPay - totalDeductions;
    
    const item = await prisma.payrollRunItem.create({
      data: {
        payrollRunId: id,
        employeeId: data.employeeId,
        baseSalary: data.baseSalary,
        overtimePay: data.overtimePay,
        bonuses: data.bonuses,
        grossPay,
        incomeTax: data.incomeTax,
        socialSecurity: data.socialSecurity,
        healthInsurance: data.healthInsurance,
        otherDeductions: data.otherDeductions,
        totalDeductions,
        netPay,
        notes: data.notes,
      },
    });
    
    // Update run totals
    await prisma.payrollRun.update({
      where: { id },
      data: {
        totalGross: { increment: grossPay },
        totalDeductions: { increment: totalDeductions },
        totalNet: { increment: netPay },
      },
    });
    
    return reply.status(201).send({ item });
  });

  // Approve payroll run
  fastify.post('/payroll-runs/:id/approve', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId, userId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const run = await prisma.payrollRun.findFirst({
      where: { id, tenantId, status: 'draft' },
    });
    
    if (!run) {
      return reply.status(404).send({ error: 'Payroll run not found or already processed' });
    }
    
    const updated = await prisma.payrollRun.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });
    
    return { run: updated };
  });

  // Mark payroll run as paid
  fastify.post('/payroll-runs/:id/pay', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const run = await prisma.payrollRun.findFirst({
      where: { id, tenantId, status: 'approved' },
    });
    
    if (!run) {
      return reply.status(404).send({ error: 'Payroll run not found or not approved' });
    }
    
    const updated = await prisma.payrollRun.update({
      where: { id },
      data: {
        status: 'paid',
      },
    });
    
    return { run: updated };
  });

  // Delete payroll run item
  fastify.delete('/payroll-runs/:runId/items/:itemId', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { runId, itemId } = request.params as { runId: string; itemId: string };
    
    const run = await prisma.payrollRun.findFirst({
      where: { id: runId, tenantId, status: 'draft' },
    });
    
    if (!run) {
      return reply.status(404).send({ error: 'Payroll run not found or already processed' });
    }
    
    const item = await prisma.payrollRunItem.findFirst({
      where: { id: itemId, payrollRunId: runId },
    });
    
    if (!item) {
      return reply.status(404).send({ error: 'Payroll item not found' });
    }
    
    // Update run totals before deleting
    await prisma.payrollRun.update({
      where: { id: runId },
      data: {
        totalGross: { decrement: Number(item.grossPay) },
        totalDeductions: { decrement: Number(item.totalDeductions) },
        totalNet: { decrement: Number(item.netPay) },
      },
    });
    
    await prisma.payrollRunItem.delete({ where: { id: itemId } });
    
    return { success: true };
  });
};

export default payrollRoutes;
