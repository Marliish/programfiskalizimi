import { prisma } from '@fiscalnext/database';
import bcrypt from 'bcrypt';

export class UserService {
  /**
   * List users in tenant
   */
  async listUsers(params: {
    tenantId: string;
    page: number;
    limit: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const skip = (params.page - 1) * params.limit;

    const where: any = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: params.limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => ({
        ...user,
        roles: user.userRoles.map(ur => ur.role),
        userRoles: undefined,
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  /**
   * Create new user (invite)
   */
  async createUser(data: {
    tenantId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleIds: string[];
  }) {
    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        email: data.email,
        tenantId: data.tenantId,
      },
    });

    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId: data.tenantId,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        isActive: true,
        emailVerified: false,
      },
    });

    // Assign roles
    await Promise.all(
      data.roleIds.map(roleId =>
        prisma.userRole.create({
          data: {
            userId: user.id,
            roleId,
          },
        })
      )
    );

    // In production, send email invite with temp password
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
      },
      tempPassword, // Send this via email in production
    };
  }

  /**
   * Update user
   */
  async updateUser(data: {
    userId: string;
    tenantId: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    isActive?: boolean;
  }) {
    const user = await prisma.user.findFirst({
      where: {
        id: data.userId,
        tenantId: data.tenantId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: data.userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        isActive: data.isActive,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
      },
    });

    return { user: updated };
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return { success: true, message: 'User deactivated successfully' };
  }

  /**
   * Assign roles to user
   */
  async assignRoles(data: {
    userId: string;
    tenantId: string;
    roleIds: string[];
  }) {
    const user = await prisma.user.findFirst({
      where: {
        id: data.userId,
        tenantId: data.tenantId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove existing roles
    await prisma.userRole.deleteMany({
      where: { userId: data.userId },
    });

    // Assign new roles
    await Promise.all(
      data.roleIds.map(roleId =>
        prisma.userRole.create({
          data: {
            userId: data.userId,
            roleId,
          },
        })
      )
    );

    // Get updated user with roles
    const updated = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      user: {
        ...updated,
        roles: updated?.userRoles.map(ur => ur.role),
        userRoles: undefined,
      },
    };
  }
}

export const userService = new UserService();
