// Employee Management Service - Clean Prisma ORM Implementation
// Updated: 2026-02-27 - Fixed to use Prisma ORM with permissions

import { PrismaClient } from '@fiscalnext/database';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 18 permissions grouped by category
export const PERMISSIONS = {
  sales: [
    'sales:create',
    'sales:edit',
    'sales:void',
    'sales:refund',
    'sales:discount',
    'sales:price_override',
  ],
  cash: [
    'cash:open_shift',
    'cash:close_shift',
    'cash:in_out',
    'cash:reprint',
    'cash:reports',
  ],
  inventory: [
    'inventory:view',
    'inventory:edit',
    'inventory:adjust',
    'inventory:cost_price',
  ],
  admin: [
    'admin:products',
    'admin:employees',
    'admin:settings',
    'admin:reports',
  ],
};

// Role templates with pre-selected permissions
export const ROLE_TEMPLATES = {
  cashier: [
    'sales:create',
    'sales:edit',
    'cash:open_shift',
    'cash:close_shift',
    'cash:reprint',
    'inventory:view',
  ],
  waiter: [
    'sales:create',
    'sales:edit',
    'sales:void',
    'inventory:view',
  ],
  manager: [
    ...PERMISSIONS.sales,
    ...PERMISSIONS.cash,
    ...PERMISSIONS.inventory,
    'admin:products',
    'admin:employees',
    'admin:reports',
  ],
  admin: [
    ...PERMISSIONS.sales,
    ...PERMISSIONS.cash,
    ...PERMISSIONS.inventory,
    ...PERMISSIONS.admin,
  ],
};

export class EmployeeService {
  // Get all employees with permissions
  async getEmployees(tenantId: string, isActive?: boolean) {
    const where: any = { tenantId };
    if (isActive !== undefined) {
      where.status = isActive ? 'active' : { not: 'active' };
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Fetch permissions for all employees
    const employeeIds = employees.map(e => e.id);
    const allPermissions = await prisma.employeePermission.findMany({
      where: { employeeId: { in: employeeIds } },
    });

    // Group permissions by employee
    const permissionsByEmployee = allPermissions.reduce((acc, p) => {
      if (!acc[p.employeeId]) acc[p.employeeId] = [];
      acc[p.employeeId].push(p.permission);
      return acc;
    }, {} as Record<string, string[]>);

    // Transform to include permission array
    return employees.map(emp => ({
      ...emp,
      isActive: emp.status === 'active', // Convert status to isActive for frontend
      role: emp.employmentType || 'cashier', // employmentType stores the role
      permissions: permissionsByEmployee[emp.id] || [],
      permissionCount: (permissionsByEmployee[emp.id] || []).length,
    }));
  }

  // Get employee by ID with permissions
  async getEmployeeById(tenantId: string, employeeId: string) {
    const employee = await prisma.employee.findFirst({
      where: { tenantId, id: employeeId },
    });

    if (!employee) return null;

    // Fetch permissions separately
    const permissions = await prisma.employeePermission.findMany({
      where: { employeeId },
    });

    return {
      ...employee,
      isActive: employee.status === 'active',
      role: employee.employmentType || 'cashier',
      permissions: permissions.map(p => p.permission),
    };
  }

  // Create employee with permissions and user account
  async createEmployee(tenantId: string, data: any) {
    const { role, permissions, password, ...employeeData } = data;

    // Hash password if provided
    let userId: string | null = null;
    if (password && employeeData.email) {
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user account for employee
      const user = await prisma.user.create({
        data: {
          tenantId,
          email: employeeData.email,
          passwordHash,
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          phone: employeeData.phone,
          isActive: true,
        },
      });
      userId = user.id;
    }

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        ...employeeData,
        tenantId,
        userId, // Link to user account
        employmentType: role, // Store role in employmentType
        salary: employeeData.salary || 0,
        status: 'active',
      },
    });

    // Add permissions
    if (permissions && permissions.length > 0) {
      await prisma.employeePermission.createMany({
        data: permissions.map((permission: string) => ({
          employeeId: employee.id,
          permission,
        })),
        skipDuplicates: true,
      });
    }

    // Return with permissions
    return this.getEmployeeById(tenantId, employee.id);
  }

  // Update employee and permissions
  async updateEmployee(tenantId: string, employeeId: string, data: any) {
    const { role, permissions, password, ...employeeData } = data;

    // Get existing employee to find linked user
    const existingEmployee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });

    // Update password if provided and employee has linked user
    if (password && existingEmployee?.userId) {
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: existingEmployee.userId },
        data: { passwordHash },
      });
    }

    // Update employee
    const updateData: any = { ...employeeData };
    if (role) {
      updateData.employmentType = role;
    }

    await prisma.employee.update({
      where: { id: employeeId, tenantId },
      data: updateData,
    });

    // Update permissions if provided
    if (permissions !== undefined) {
      // Delete existing permissions
      await prisma.employeePermission.deleteMany({
        where: { employeeId },
      });

      // Add new permissions
      if (permissions.length > 0) {
        await prisma.employeePermission.createMany({
          data: permissions.map((permission: string) => ({
            employeeId,
            permission,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Return updated employee with permissions
    return this.getEmployeeById(tenantId, employeeId);
  }

  // Delete employee (soft delete)
  async deleteEmployee(tenantId: string, employeeId: string) {
    await prisma.employee.update({
      where: { id: employeeId, tenantId },
      data: { status: 'terminated' },
    });

    return this.getEmployeeById(tenantId, employeeId);
  }

  // Get employee permissions
  async getEmployeePermissions(tenantId: string, employeeId: string) {
    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { tenantId, id: employeeId },
    });

    if (!employee) return [];

    const permissions = await prisma.employeePermission.findMany({
      where: { employeeId },
    });

    return permissions.map(p => p.permission);
  }

  // Check if employee has permission
  async hasPermission(tenantId: string, employeeId: string, permission: string) {
    // First verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { tenantId, id: employeeId },
    });

    if (!employee) return false;

    const count = await prisma.employeePermission.count({
      where: {
        employeeId,
        permission,
      },
    });

    return count > 0;
  }
}

export const employeeService = new EmployeeService();
