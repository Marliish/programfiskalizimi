// Employee Management Service
// Created: 2026-02-23 - Day 6

import { PrismaClient } from '@fiscalnext/database';
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  ClockInInput,
  ClockOutInput,
  PerformanceQueryInput,
} from '../schemas/employee.schema';

const prisma = new PrismaClient();

export class EmployeeService {
  // Create employee
  async createEmployee(tenantId: string, data: CreateEmployeeInput) {
    return await prisma.$queryRawUnsafe(`
      INSERT INTO employees (
        tenant_id, employee_number, first_name, last_name, 
        email, phone, position, department, hire_date,
        hourly_rate, commission_rate, user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, 
      tenantId,
      data.employeeNumber,
      data.firstName,
      data.lastName,
      data.email || null,
      data.phone || null,
      data.position || null,
      data.department || null,
      data.hireDate || null,
      data.hourlyRate || null,
      data.commissionRate || 0,
      data.userId || null
    );
  }

  // Get all employees
  async getEmployees(tenantId: string, includeInactive = false) {
    const whereClause = includeInactive ? '' : 'AND is_active = true';
    
    return await prisma.$queryRawUnsafe(`
      SELECT * FROM employees
      WHERE tenant_id = $1 ${whereClause}
      ORDER BY created_at DESC
    `, tenantId);
  }

  // Get employee by ID
  async getEmployeeById(tenantId: string, employeeId: string) {
    const result = await prisma.$queryRawUnsafe(`
      SELECT * FROM employees
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `, tenantId, employeeId);
    
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  // Update employee
  async updateEmployee(tenantId: string, employeeId: string, data: UpdateEmployeeInput) {
    const fields = [];
    const values = [];
    let paramIndex = 3;

    if (data.firstName !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(data.lastName);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.position !== undefined) {
      fields.push(`position = $${paramIndex++}`);
      values.push(data.position);
    }
    if (data.department !== undefined) {
      fields.push(`department = $${paramIndex++}`);
      values.push(data.department);
    }
    if (data.hireDate !== undefined) {
      fields.push(`hire_date = $${paramIndex++}`);
      values.push(data.hireDate);
    }
    if (data.hourlyRate !== undefined) {
      fields.push(`hourly_rate = $${paramIndex++}`);
      values.push(data.hourlyRate);
    }
    if (data.commissionRate !== undefined) {
      fields.push(`commission_rate = $${paramIndex++}`);
      values.push(data.commissionRate);
    }

    if (fields.length === 0) {
      return await this.getEmployeeById(tenantId, employeeId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    return await prisma.$queryRawUnsafe(`
      UPDATE employees
      SET ${fields.join(', ')}
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `, tenantId, employeeId, ...values);
  }

  // Delete employee (soft delete)
  async deleteEmployee(tenantId: string, employeeId: string) {
    return await prisma.$queryRawUnsafe(`
      UPDATE employees
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `, tenantId, employeeId);
  }

  // Clock in
  async clockIn(tenantId: string, data: ClockInInput) {
    // Check if there's an open shift
    const openShift = await prisma.$queryRawUnsafe(`
      SELECT * FROM shifts
      WHERE tenant_id = $1 AND employee_id = $2 AND clock_out IS NULL
      ORDER BY clock_in DESC
      LIMIT 1
    `, tenantId, data.employeeId);

    if (Array.isArray(openShift) && openShift.length > 0) {
      throw new Error('Employee already has an open shift');
    }

    return await prisma.$queryRawUnsafe(`
      INSERT INTO shifts (tenant_id, employee_id, location_id, clock_in, notes)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      RETURNING *
    `, tenantId, data.employeeId, data.locationId || null, data.notes || null);
  }

  // Clock out
  async clockOut(tenantId: string, data: ClockOutInput) {
    return await prisma.$queryRawUnsafe(`
      UPDATE shifts
      SET clock_out = CURRENT_TIMESTAMP,
          break_duration_minutes = $2,
          notes = COALESCE($3, notes)
      WHERE tenant_id = $1 AND id = $4 AND clock_out IS NULL
      RETURNING *
    `, tenantId, data.breakDurationMinutes || 0, data.notes || null, data.shiftId);
  }

  // Get active shift
  async getActiveShift(tenantId: string, employeeId: string) {
    const result = await prisma.$queryRawUnsafe(`
      SELECT s.*, e.first_name, e.last_name, e.employee_number
      FROM shifts s
      JOIN employees e ON s.employee_id = e.id
      WHERE s.tenant_id = $1 AND s.employee_id = $2 AND s.clock_out IS NULL
      ORDER BY s.clock_in DESC
      LIMIT 1
    `, tenantId, employeeId);

    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  // Get employee performance
  async getPerformance(tenantId: string, query: PerformanceQueryInput) {
    let whereClause = 'WHERE s.tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (query.employeeId) {
      whereClause += ` AND s.employee_id = $${paramIndex++}`;
      params.push(query.employeeId);
    }

    if (query.startDate) {
      whereClause += ` AND s.clock_in >= $${paramIndex++}`;
      params.push(query.startDate);
    }

    if (query.endDate) {
      whereClause += ` AND s.clock_in <= $${paramIndex++}`;
      params.push(query.endDate);
    }

    if (query.locationId) {
      whereClause += ` AND s.location_id = $${paramIndex++}`;
      params.push(query.locationId);
    }

    return await prisma.$queryRawUnsafe(`
      SELECT 
        e.id as employee_id,
        e.employee_number,
        e.first_name,
        e.last_name,
        COUNT(s.id) as total_shifts,
        SUM(s.sales_count) as total_sales,
        SUM(s.sales_total) as total_sales_amount,
        AVG(s.sales_total) as avg_sales_per_shift,
        SUM(
          EXTRACT(EPOCH FROM (COALESCE(s.clock_out, CURRENT_TIMESTAMP) - s.clock_in)) / 3600
          - COALESCE(s.break_duration_minutes, 0) / 60.0
        ) as total_hours_worked
      FROM shifts s
      JOIN employees e ON s.employee_id = e.id
      ${whereClause}
      GROUP BY e.id, e.employee_number, e.first_name, e.last_name
      ORDER BY total_sales_amount DESC
    `, ...params);
  }

  // Calculate commission
  async calculateCommission(tenantId: string, employeeId: string, startDate: string, endDate: string) {
    const employee = await this.getEmployeeById(tenantId, employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const performance = await this.getPerformance(tenantId, {
      employeeId,
      startDate,
      endDate,
    });

    if (!Array.isArray(performance) || performance.length === 0) {
      return { commission: 0, sales: 0, rate: employee.commission_rate };
    }

    const totalSales = Number(performance[0].total_sales_amount) || 0;
    const commission = (totalSales * Number(employee.commission_rate)) / 100;

    return {
      commission,
      sales: totalSales,
      rate: employee.commission_rate,
      period: { startDate, endDate },
    };
  }
}

export const employeeService = new EmployeeService();
