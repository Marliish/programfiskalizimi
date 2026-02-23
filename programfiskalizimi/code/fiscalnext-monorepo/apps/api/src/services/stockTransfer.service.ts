// Stock Transfer Service - Transfer inventory between locations
import { prisma } from '@fiscalnext/database';

export class StockTransferService {
  /**
   * Get all stock transfers for a tenant
   */
  async getStockTransfers(tenantId: string, filters?: {
    status?: string;
    fromLocationId?: string;
    toLocationId?: string;
    limit?: number;
  }) {
    const transfers = await prisma.stockTransfer.findMany({
      where: {
        tenantId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.fromLocationId && { fromLocationId: filters.fromLocationId }),
        ...(filters?.toLocationId && { toLocationId: filters.toLocationId }),
      },
      include: {
        fromLocation: true,
        toLocation: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    });

    return transfers;
  }

  /**
   * Get transfer by ID
   */
  async getStockTransferById(tenantId: string, transferId: string) {
    const transfer = await prisma.stockTransfer.findFirst({
      where: {
        id: transferId,
        tenantId,
      },
      include: {
        fromLocation: true,
        toLocation: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!transfer) {
      throw new Error('Stock transfer not found');
    }

    return transfer;
  }

  /**
   * Create stock transfer
   */
  async createStockTransfer(
    tenantId: string,
    userId: string,
    data: {
      fromLocationId?: string;
      toLocationId: string;
      items: Array<{
        productId: string;
        quantity: number;
      }>;
      notes?: string;
    }
  ) {
    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new Error('Transfer must have at least one item');
    }

    // Get transfer number
    const transferNumber = await this.generateTransferNumber(tenantId);

    // Create transfer in transaction
    const transfer = await prisma.$transaction(async (tx) => {
      // Create transfer
      const newTransfer = await tx.stockTransfer.create({
        data: {
          tenantId,
          userId,
          fromLocationId: data.fromLocationId || null,
          toLocationId: data.toLocationId,
          transferNumber,
          status: 'pending',
          notes: data.notes,
        },
      });

      // Create transfer items
      for (const item of data.items) {
        const product = await tx.product.findFirst({
          where: {
            id: item.productId,
            tenantId,
          },
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        // Check stock availability if fromLocation is specified
        if (data.fromLocationId) {
          const stock = await tx.stock.findUnique({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: data.fromLocationId,
              },
            },
          });

          if (!stock || stock.quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
        }

        await tx.stockTransferItem.create({
          data: {
            transferId: newTransfer.id,
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            unit: product.unit,
          },
        });
      }

      return newTransfer;
    });

    return this.getStockTransferById(tenantId, transfer.id);
  }

  /**
   * Complete stock transfer
   */
  async completeStockTransfer(tenantId: string, transferId: string, userId: string) {
    const transfer = await this.getStockTransferById(tenantId, transferId);

    if (transfer.status !== 'pending' && transfer.status !== 'in_transit') {
      throw new Error('Transfer cannot be completed');
    }

    // Update stock in transaction
    await prisma.$transaction(async (tx) => {
      // Update transfer status
      await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Process each item
      for (const item of transfer.items) {
        // Deduct from source location if specified
        if (transfer.fromLocationId) {
          await this.updateStock(
            tx,
            tenantId,
            item.productId,
            transfer.fromLocationId,
            -Number(item.quantity)
          );

          // Record stock movement
          await this.recordStockMovement(
            tx,
            tenantId,
            userId,
            item.productId,
            transfer.fromLocationId,
            'out',
            Number(item.quantity),
            'transfer',
            transferId
          );
        }

        // Add to destination location
        await this.updateStock(
          tx,
          tenantId,
          item.productId,
          transfer.toLocationId,
          Number(item.quantity)
        );

        // Record stock movement
        await this.recordStockMovement(
          tx,
          tenantId,
          userId,
          item.productId,
          transfer.toLocationId,
          'in',
          Number(item.quantity),
          'transfer',
          transferId
        );
      }
    });

    return this.getStockTransferById(tenantId, transferId);
  }

  /**
   * Cancel stock transfer
   */
  async cancelStockTransfer(tenantId: string, transferId: string) {
    const transfer = await this.getStockTransferById(tenantId, transferId);

    if (transfer.status === 'completed') {
      throw new Error('Cannot cancel completed transfer');
    }

    if (transfer.status === 'cancelled') {
      throw new Error('Transfer already cancelled');
    }

    await prisma.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    return this.getStockTransferById(tenantId, transferId);
  }

  /**
   * Helper: Update stock quantity
   */
  private async updateStock(
    tx: any,
    tenantId: string,
    productId: string,
    locationId: string,
    quantityChange: number
  ) {
    const existingStock = await tx.stock.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
    });

    if (existingStock) {
      await tx.stock.update({
        where: {
          productId_locationId: {
            productId,
            locationId,
          },
        },
        data: {
          quantity: { increment: quantityChange },
        },
      });
    } else {
      await tx.stock.create({
        data: {
          tenantId,
          productId,
          locationId,
          quantity: quantityChange,
        },
      });
    }
  }

  /**
   * Helper: Record stock movement
   */
  private async recordStockMovement(
    tx: any,
    tenantId: string,
    userId: string,
    productId: string,
    locationId: string,
    type: string,
    quantity: number,
    referenceType: string,
    referenceId: string
  ) {
    const stock = await tx.stock.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
    });

    const quantityBefore = Number(stock?.quantity || 0) - (type === 'in' ? quantity : -quantity);
    const quantityAfter = Number(stock?.quantity || 0);

    await tx.stockMovement.create({
      data: {
        tenantId,
        userId,
        productId,
        locationId,
        type,
        quantity,
        quantityBefore,
        quantityAfter,
        referenceType,
        referenceId,
      },
    });
  }

  /**
   * Helper: Generate transfer number
   */
  private async generateTransferNumber(tenantId: string): Promise<string> {
    const count = await prisma.stockTransfer.count({
      where: { tenantId },
    });
    
    return `ST-${String(count + 1).padStart(6, '0')}`;
  }
}

export const stockTransferService = new StockTransferService();
