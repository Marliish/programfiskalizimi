// Customer Service - Handle customer operations
import { prisma, Prisma } from '@fiscalnext/database';

export class CustomerService {
  /**
   * Create a new customer
   */
  async createCustomer(data: {
    tenantId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    birthday?: string;
  }) {
    // Check if email or phone already exists
    if (data.email || data.phone) {
      const existing = await prisma.customer.findFirst({
        where: {
          tenantId: data.tenantId,
          OR: [
            ...(data.email ? [{ email: data.email }] : []),
            ...(data.phone ? [{ phone: data.phone }] : []),
          ],
        },
      });

      if (existing) {
        throw new Error('Customer with this email or phone already exists');
      }
    }

    const customer = await prisma.customer.create({
      data: {
        ...data,
        birthday: data.birthday ? new Date(data.birthday) : undefined,
      },
    });

    return customer;
  }

  /**
   * Update customer
   */
  async updateCustomer(customerId: string, tenantId: string, data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthday: string;
    loyaltyPoints: number;
  }>) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...data,
        birthday: data.birthday ? new Date(data.birthday) : undefined,
      },
    });

    return updated;
  }

  /**
   * Get customer by ID with stats
   */
  async getCustomer(customerId: string, tenantId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get transaction history
    const transactions = await prisma.transaction.findMany({
      where: {
        customerId,
        tenantId,
        status: 'completed',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        items: true,
      },
    });

    // Get customer stats
    const stats = await this.getCustomerStats(customerId, tenantId);

    return {
      ...customer,
      stats,
      recentTransactions: transactions,
    };
  }

  /**
   * Get customer stats
   */
  async getCustomerStats(customerId: string, tenantId: string) {
    const transactions = await prisma.transaction.findMany({
      where: {
        customerId,
        tenantId,
        status: 'completed',
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalSpent = transactions.reduce((sum, t) => sum + Number(t.total), 0);
    const totalVisits = transactions.length;
    const lastPurchase = transactions.length > 0 ? transactions[0].createdAt : null;

    return {
      totalSpent,
      totalVisits,
      lastPurchase,
      averageOrderValue: totalVisits > 0 ? totalSpent / totalVisits : 0,
    };
  }

  /**
   * List customers with pagination and filters
   */
  async listCustomers(params: {
    tenantId: string;
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'name' | 'totalSpent' | 'createdAt' | 'lastPurchase';
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      tenantId: params.tenantId,
      ...(params.search && {
        OR: [
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
          { phone: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    // Determine sorting
    let orderBy: Prisma.CustomerOrderByWithRelationInput = { createdAt: 'desc' };
    if (params.sortBy === 'name') {
      orderBy = { firstName: params.sortOrder || 'asc' };
    } else if (params.sortBy === 'totalSpent') {
      orderBy = { totalSpent: params.sortOrder || 'desc' };
    } else if (params.sortBy === 'createdAt') {
      orderBy = { createdAt: params.sortOrder || 'desc' };
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    // Enrich with last purchase date
    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const lastTransaction = await prisma.transaction.findFirst({
          where: {
            customerId: customer.id,
            tenantId: params.tenantId,
            status: 'completed',
          },
          orderBy: { createdAt: 'desc' },
        });

        return {
          ...customer,
          lastPurchaseDate: lastTransaction?.createdAt || null,
        };
      })
    );

    return {
      data: enrichedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete customer (soft delete - for now just delete)
   */
  async deleteCustomer(customerId: string, tenantId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check if customer has transactions
    const transactionCount = await prisma.transaction.count({
      where: { customerId },
    });

    if (transactionCount > 0) {
      throw new Error('Cannot delete customer with existing transactions');
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    return { message: 'Customer deleted successfully' };
  }
}

export const customerService = new CustomerService();
