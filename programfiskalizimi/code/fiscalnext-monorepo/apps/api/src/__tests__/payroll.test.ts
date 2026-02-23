import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@fiscalnext/database';

describe('Payroll API Tests', () => {
  let testTenantId: string;
  let testEmployeeId: string;
  let testPayrollRunId: string;

  beforeAll(async () => {
    // Create test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Company',
        slug: 'test-company-payroll',
        country: 'AL'
      }
    });
    testTenantId = tenant.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testPayrollRunId) {
      await prisma.payrollRunItem.deleteMany({
        where: { payrollRunId: testPayrollRunId }
      });
      await prisma.payrollRun.delete({
        where: { id: testPayrollRunId }
      });
    }
    if (testEmployeeId) {
      await prisma.employee.delete({
        where: { id: testEmployeeId }
      });
    }
    await prisma.tenant.delete({
      where: { id: testTenantId }
    });
  });

  describe('Employee Management', () => {
    it('should create an employee', async () => {
      const employee = await prisma.employee.create({
        data: {
          tenantId: testTenantId,
          employeeNumber: 'EMP-00001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@test.com',
          hireDate: new Date('2026-01-01'),
          salary: 50000,
          currency: 'ALL',
          position: 'Software Engineer'
        }
      });

      testEmployeeId = employee.id;

      expect(employee.id).toBeDefined();
      expect(employee.firstName).toBe('John');
      expect(employee.lastName).toBe('Doe');
      expect(employee.salary.toString()).toBe('50000');
    });

    it('should list employees', async () => {
      const employees = await prisma.employee.findMany({
        where: { tenantId: testTenantId, deletedAt: null }
      });

      expect(employees.length).toBeGreaterThan(0);
      expect(employees[0].firstName).toBe('John');
    });

    it('should update employee', async () => {
      const updated = await prisma.employee.update({
        where: { id: testEmployeeId },
        data: { position: 'Senior Software Engineer' }
      });

      expect(updated.position).toBe('Senior Software Engineer');
    });
  });

  describe('Payroll Run Management', () => {
    it('should create payroll run', async () => {
      const run = await prisma.payrollRun.create({
        data: {
          tenantId: testTenantId,
          runNumber: 'PR-2026-0001',
          periodStart: new Date('2026-02-01'),
          periodEnd: new Date('2026-02-28'),
          payDate: new Date('2026-03-01')
        }
      });

      testPayrollRunId = run.id;

      expect(run.id).toBeDefined();
      expect(run.runNumber).toBe('PR-2026-0001');
      expect(run.status).toBe('draft');
    });

    it('should add employee to payroll run', async () => {
      const item = await prisma.payrollRunItem.create({
        data: {
          payrollRunId: testPayrollRunId,
          employeeId: testEmployeeId,
          baseSalary: 50000,
          overtimePay: 5000,
          bonuses: 10000,
          grossPay: 65000,
          incomeTax: 9750,
          socialSecurity: 4875,
          healthInsurance: 1950,
          totalDeductions: 16575,
          netPay: 48425
        }
      });

      expect(item.id).toBeDefined();
      expect(item.grossPay.toString()).toBe('65000');
      expect(item.netPay.toString()).toBe('48425');
    });

    it('should calculate payroll run totals', async () => {
      const items = await prisma.payrollRunItem.findMany({
        where: { payrollRunId: testPayrollRunId }
      });

      const totalGross = items.reduce((sum, item) => sum + Number(item.grossPay), 0);
      const totalNet = items.reduce((sum, item) => sum + Number(item.netPay), 0);

      expect(totalGross).toBe(65000);
      expect(totalNet).toBe(48425);
    });

    it('should approve payroll run', async () => {
      const updated = await prisma.payrollRun.update({
        where: { id: testPayrollRunId },
        data: {
          status: 'approved',
          approvedBy: 'test-user-id',
          approvedAt: new Date()
        }
      });

      expect(updated.status).toBe('approved');
      expect(updated.approvedBy).toBe('test-user-id');
      expect(updated.approvedAt).toBeDefined();
    });
  });

  describe('Payroll Calculations', () => {
    it('should correctly calculate net pay', () => {
      const baseSalary = 50000;
      const overtimePay = 5000;
      const bonuses = 10000;
      const grossPay = baseSalary + overtimePay + bonuses;

      const incomeTax = grossPay * 0.15; // 15% income tax
      const socialSecurity = grossPay * 0.075; // 7.5% social security
      const healthInsurance = grossPay * 0.03; // 3% health insurance
      const totalDeductions = incomeTax + socialSecurity + healthInsurance;

      const netPay = grossPay - totalDeductions;

      expect(grossPay).toBe(65000);
      expect(incomeTax).toBe(9750);
      expect(socialSecurity).toBe(4875);
      expect(healthInsurance).toBe(1950);
      expect(totalDeductions).toBe(16575);
      expect(netPay).toBe(48425);
    });
  });
});
