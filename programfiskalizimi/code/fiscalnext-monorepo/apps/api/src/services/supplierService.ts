import { prisma } from '@fiscalnext/database';
import type { Prisma } from '@prisma/client';

export const supplierService = {
  // Get all suppliers
  async getAll(tenantId: string, filters?: {
    isActive?: boolean;
    search?: string;
  }) {
    const where: Prisma.SupplierWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.supplier.findMany({
      where,
      include: {
        contacts: true,
        _count: {
          select: {
            products: true,
            purchaseOrders: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  // Get supplier by ID
  async getById(id: string, tenantId: string) {
    return prisma.supplier.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        contacts: true,
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                sellingPrice: true,
              },
            },
          },
        },
        purchaseOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            poNumber: true,
            status: true,
            orderDate: true,
            totalAmount: true,
          },
        },
      },
    });
  },

  // Create supplier
  async create(data: Prisma.SupplierCreateInput) {
    return prisma.supplier.create({
      data,
      include: {
        contacts: true,
      },
    });
  },

  // Update supplier
  async update(id: string, tenantId: string, data: Prisma.SupplierUpdateInput) {
    return prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        contacts: true,
      },
    });
  },

  // Soft delete supplier
  async delete(id: string, tenantId: string) {
    return prisma.supplier.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  },

  // Add supplier contact
  async addContact(supplierId: string, data: {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
  }) {
    // If this is primary, unset other primary contacts
    if (data.isPrimary) {
      await prisma.supplierContact.updateMany({
        where: { supplierId },
        data: { isPrimary: false },
      });
    }

    return prisma.supplierContact.create({
      data: {
        supplierId,
        ...data,
      },
    });
  },

  // Update supplier contact
  async updateContact(id: string, data: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
  }) {
    // If setting as primary, unset other primary contacts
    if (data.isPrimary) {
      const contact = await prisma.supplierContact.findUnique({
        where: { id },
      });
      if (contact) {
        await prisma.supplierContact.updateMany({
          where: { supplierId: contact.supplierId, id: { not: id } },
          data: { isPrimary: false },
        });
      }
    }

    return prisma.supplierContact.update({
      where: { id },
      data,
    });
  },

  // Delete supplier contact
  async deleteContact(id: string) {
    return prisma.supplierContact.delete({
      where: { id },
    });
  },

  // Link product to supplier
  async linkProduct(supplierId: string, productId: string, data: {
    supplierSku?: string;
    supplierName?: string;
    costPrice?: number;
    minOrderQty?: number;
    leadTimeDays?: number;
    isPreferred?: boolean;
  }) {
    return prisma.supplierProduct.upsert({
      where: {
        supplierId_productId: {
          supplierId,
          productId,
        },
      },
      create: {
        supplierId,
        productId,
        ...data,
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },

  // Unlink product from supplier
  async unlinkProduct(supplierId: string, productId: string) {
    return prisma.supplierProduct.delete({
      where: {
        supplierId_productId: {
          supplierId,
          productId,
        },
      },
    });
  },

  // Get supplier performance metrics
  async getMetrics(id: string, tenantId: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, tenantId },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const [totalOrders, completedOrders, totalSpent, avgDeliveryTime] = await Promise.all([
      // Total purchase orders
      prisma.purchaseOrder.count({
        where: { supplierId: id, tenantId },
      }),
      
      // Completed orders
      prisma.purchaseOrder.count({
        where: { supplierId: id, tenantId, status: 'received' },
      }),
      
      // Total amount spent
      prisma.purchaseOrder.aggregate({
        where: { supplierId: id, tenantId, status: 'received' },
        _sum: { totalAmount: true },
      }),
      
      // Average delivery time (days)
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(DAY FROM (received_date - order_date))) as avg_days
        FROM purchase_orders
        WHERE supplier_id = ${id}
        AND tenant_id = ${tenantId}
        AND status = 'received'
        AND received_date IS NOT NULL
      `,
    ]);

    return {
      totalOrders,
      completedOrders,
      totalSpent: totalSpent._sum.totalAmount || 0,
      avgDeliveryTime: avgDeliveryTime[0]?.avg_days || 0,
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
    };
  },
};
