// Product Service - Handle product and inventory operations
import { prisma, Prisma } from '@fiscalnext/database';

export class ProductService {
  /**
   * Create a new product
   */
  async createProduct(data: {
    tenantId: string;
    name: string;
    description?: string;
    sku?: string;
    barcode?: string;
    categoryId?: string;
    costPrice?: number;
    sellingPrice: number;
    taxRate?: number;
    currency?: string;
    unit?: string;
    trackInventory?: boolean;
    imageUrl?: string;
  }) {
    // Check if SKU or barcode already exists
    if (data.sku || data.barcode) {
      const existing = await prisma.product.findFirst({
        where: {
          tenantId: data.tenantId,
          OR: [
            ...(data.sku ? [{ sku: data.sku }] : []),
            ...(data.barcode ? [{ barcode: data.barcode }] : []),
          ],
        },
      });

      if (existing) {
        throw new Error('Product with this SKU or barcode already exists');
      }
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        costPrice: data.costPrice ? new Prisma.Decimal(data.costPrice) : undefined,
        sellingPrice: new Prisma.Decimal(data.sellingPrice),
        taxRate: data.taxRate ? new Prisma.Decimal(data.taxRate) : new Prisma.Decimal(20),
      },
    });

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(productId: string, tenantId: string, data: Partial<{
    name: string;
    description: string;
    sku: string;
    barcode: string;
    categoryId: string;
    costPrice: number;
    sellingPrice: number;
    taxRate: number;
    currency: string;
    unit: string;
    trackInventory: boolean;
    imageUrl: string;
    isActive: boolean;
  }>) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        ...(data.costPrice && { costPrice: new Prisma.Decimal(data.costPrice) }),
        ...(data.sellingPrice && { sellingPrice: new Prisma.Decimal(data.sellingPrice) }),
        ...(data.taxRate && { taxRate: new Prisma.Decimal(data.taxRate) }),
      },
    });

    return updated;
  }

  /**
   * Get product by ID
   */
  async getProduct(productId: string, tenantId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
        deletedAt: null,
      },
      include: {
        category: true,
        stock: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  /**
   * List products with pagination and filters
   */
  async listProducts(params: {
    tenantId: string;
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      tenantId: params.tenantId,
      deletedAt: null,
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { sku: { contains: params.search, mode: 'insensitive' } },
          { barcode: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          stock: true,
        },
        orderBy: {
          name: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get product stock information
   */
  async getProductStock(productId: string, tenantId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
        deletedAt: null,
      },
      include: {
        stock: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.trackInventory) {
      return {
        productId: product.id,
        productName: product.name,
        trackInventory: false,
        message: 'This product does not track inventory',
      };
    }

    // Calculate total stock across all locations
    const totalStock = product.stock.reduce((sum, s) => sum + Number(s.quantity), 0);

    // Get low stock threshold (default 10 if not set on product)
    const lowStockThreshold = 10; // TODO: Add to product model
    const isLowStock = totalStock <= lowStockThreshold;

    return {
      productId: product.id,
      productName: product.name,
      trackInventory: true,
      totalStock,
      lowStockThreshold,
      isLowStock,
      stockByLocation: product.stock.map(s => ({
        locationId: s.locationId,
        locationName: s.location?.name || 'Default',
        quantity: Number(s.quantity),
        updatedAt: s.updatedAt,
      })),
    };
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(productId: string, tenantId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    await prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Product deleted successfully' };
  }

  /**
   * Adjust stock quantity
   */
  async adjustStock(data: {
    tenantId: string;
    productId: string;
    locationId?: string;
    quantity: number;
    type: 'in' | 'out' | 'adjustment';
    notes?: string;
    userId: string;
  }) {
    const product = await prisma.product.findFirst({
      where: { id: data.productId, tenantId: data.tenantId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.trackInventory) {
      throw new Error('This product does not track inventory');
    }

    await prisma.$transaction(async (tx) => {
      // Find or create stock record
      const stock = await tx.stock.upsert({
        where: {
          productId_locationId: {
            productId: data.productId,
            locationId: data.locationId || '',
          },
        },
        update: {
          quantity: {
            increment: data.type === 'out' ? -data.quantity : data.quantity,
          },
        },
        create: {
          tenantId: data.tenantId,
          productId: data.productId,
          locationId: data.locationId,
          quantity: data.type === 'out' ? -data.quantity : data.quantity,
        },
      });

      // Log stock movement (if table exists)
      // await tx.stockMovement.create({ ... });
    });

    return { message: 'Stock adjusted successfully' };
  }
}

export const productService = new ProductService();
