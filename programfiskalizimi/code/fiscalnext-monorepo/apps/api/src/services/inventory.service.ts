import { prisma } from '@fiscalnext/database';

export class InventoryService {
  /**
   * Get inventory levels for all products
   */
  async getInventoryLevels(params: {
    tenantId: string;
    page: number;
    limit: number;
    categoryId?: string;
    lowStock?: boolean;
    locationId?: string;
    search?: string;
  }) {
    const skip = (params.page - 1) * params.limit;

    const where: any = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Get products with stock info
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: params.limit,
        select: {
          id: true,
          name: true,
          sku: true,
          categoryId: true,
          category: {
            select: {
              name: true,
            },
          },
          stock: {
            where: params.locationId ? { locationId: params.locationId } : {},
            select: {
              quantity: true,
              locationId: true,
              location: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate total stock per product
    const inventory = products.map(product => {
      const totalStock = product.stock.reduce((sum, s) => sum + Number(s.quantity), 0);
      const lowStockThreshold = 10;
      
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category?.name || 'Uncategorized',
        totalStock,
        isLowStock: totalStock < lowStockThreshold,
        stockByLocation: product.stock.map(s => ({
          locationId: s.locationId,
          locationName: s.location?.name || 'Main',
          quantity: Number(s.quantity),
        })),
      };
    });

    // Filter by low stock if requested
    const filteredInventory = params.lowStock 
      ? inventory.filter(i => i.isLowStock)
      : inventory;

    return {
      inventory: filteredInventory,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: params.lowStock ? filteredInventory.length : total,
        totalPages: Math.ceil((params.lowStock ? filteredInventory.length : total) / params.limit),
      },
    };
  }

  /**
   * Adjust stock for a product
   */
  async adjustStock(data: {
    productId: string;
    tenantId: string;
    quantity: number;
    type: 'add' | 'remove' | 'set';
    reason: string;
    locationId?: string;
    userId: string;
  }) {
    // Get product
    const product = await prisma.product.findFirst({
      where: {
        id: data.productId,
        tenantId: data.tenantId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Get or create stock record
    let stock = await prisma.stock.findFirst({
      where: {
        productId: data.productId,
        tenantId: data.tenantId,
        locationId: data.locationId || null,
      },
    });

    if (!stock) {
      stock = await prisma.stock.create({
        data: {
          productId: data.productId,
          tenantId: data.tenantId,
          locationId: data.locationId || null,
          quantity: 0,
        },
      });
    }

    // Calculate new quantity
    let newQuantity = Number(stock.quantity);
    let quantityChange = 0;

    if (data.type === 'add') {
      newQuantity += data.quantity;
      quantityChange = data.quantity;
    } else if (data.type === 'remove') {
      newQuantity -= data.quantity;
      quantityChange = -data.quantity;
    } else if (data.type === 'set') {
      quantityChange = data.quantity - newQuantity;
      newQuantity = data.quantity;
    }

    if (newQuantity < 0) {
      throw new Error('Stock cannot be negative');
    }

    // Update stock
    const updatedStock = await prisma.stock.update({
      where: { id: stock.id },
      data: { quantity: newQuantity },
    });

    // Create inventory movement record (if table exists)
    // Note: We'll skip this for now as the table might not exist yet

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
      },
      stock: {
        previousQuantity: Number(stock.quantity),
        newQuantity: Number(updatedStock.quantity),
        quantityChange,
      },
      adjustment: {
        type: data.type,
        reason: data.reason,
      },
    };
  }

  /**
   * Get stock movement history
   */
  async getStockMovements(params: {
    tenantId: string;
    productId?: string;
    page: number;
    limit: number;
  }) {
    const skip = (params.page - 1) * params.limit;

    // For now, return transaction items as movements
    // In production, you'd have a dedicated inventory_movements table
    const where: any = {
      transaction: {
        tenantId: params.tenantId,
      },
    };

    if (params.productId) {
      where.productId = params.productId;
    }

    const [movements, total] = await Promise.all([
      prisma.transactionItem.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          productId: true,
          productName: true,
          quantity: true,
          transaction: {
            select: {
              transactionNumber: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.transactionItem.count({ where }),
    ]);

    return {
      movements: movements.map(m => ({
        id: m.id,
        productId: m.productId,
        productName: m.productName,
        quantity: -Number(m.quantity), // Negative because it's a sale
        type: 'sale',
        transactionNumber: m.transaction.transactionNumber,
        createdAt: m.transaction.createdAt,
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
   * Get low stock alerts
   */
  async getLowStockAlerts(tenantId: string, threshold: number = 10) {
    const products = await prisma.product.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: {
        stock: {
          select: {
            quantity: true,
            location: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const alerts = products
      .map(product => {
        const totalStock = product.stock.reduce((sum, s) => sum + Number(s.quantity), 0);
        
        if (totalStock < threshold) {
          return {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            currentStock: totalStock,
            threshold,
            severity: totalStock === 0 ? 'critical' : totalStock < threshold / 2 ? 'high' : 'medium',
          };
        }
        return null;
      })
      .filter(alert => alert !== null);

    return { alerts };
  }
}

export const inventoryService = new InventoryService();
