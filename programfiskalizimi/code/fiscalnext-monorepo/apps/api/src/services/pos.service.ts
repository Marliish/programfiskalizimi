// POS Service - Handle point of sale operations
import { prisma, Prisma } from '@fiscalnext/database';

export class POSService {
  /**
   * Create a new transaction (sale)
   */
  async createTransaction(data: {
    tenantId: string;
    userId: string;
    locationId?: string;
    customerId?: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      discountAmount?: number;
    }>;
    payments: Array<{
      paymentMethod: string;
      amount: number;
      referenceNumber?: string;
    }>;
  }) {
    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    const itemsData = await Promise.all(
      data.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const itemSubtotal = item.quantity * item.unitPrice;
        const itemDiscount = item.discountAmount || 0;
        const itemTaxAmount = ((itemSubtotal - itemDiscount) * item.taxRate) / 100;
        const itemTotal = itemSubtotal - itemDiscount + itemTaxAmount;

        subtotal += itemSubtotal;
        taxAmount += itemTaxAmount;
        discountAmount += itemDiscount;

        return {
          productId: item.productId,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discountAmount: itemDiscount,
          subtotal: itemSubtotal,
          total: itemTotal,
        };
      })
    );

    const total = subtotal - discountAmount + taxAmount;

    // Verify payment covers total
    const totalPayment = data.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPayment < total) {
      throw new Error('Insufficient payment amount');
    }

    // Generate transaction number
    const transactionNumber = await this.generateTransactionNumber(data.tenantId);

    // Create transaction in database
    const transaction = await prisma.$transaction(async (tx) => {
      // Create transaction
      const trans = await tx.transaction.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          locationId: data.locationId,
          customerId: data.customerId,
          transactionNumber,
          status: 'completed',
          subtotal,
          taxAmount,
          discountAmount,
          total,
          items: {
            create: itemsData,
          },
          payments: {
            create: data.payments,
          },
        },
        include: {
          items: true,
          payments: true,
        },
      });

      // Update inventory
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product?.trackInventory) {
          // Decrease stock
          await tx.stock.updateMany({
            where: {
              productId: item.productId,
              tenantId: data.tenantId,
              locationId: data.locationId || null,
            },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      return trans;
    });

    // Auto-create fiscal receipt for the transaction
    try {
      const fiscalReceiptId = `fr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const iic = `IIC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await prisma.fiscalReceipt.create({
        data: {
          id: fiscalReceiptId,
          tenantId: data.tenantId,
          transactionId: transaction.id,
          country: 'AL',
          iic,
          submissionStatus: 'pending',
          qrCode: `https://efiskalizimi-app.tatime.gov.al/invoice-check/#/verify?iic=${iic}`,
        },
      });

      // Link fiscal receipt to transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { fiscalReceiptId },
      });
    } catch (fiscalError) {
      console.error('Failed to create fiscal receipt:', fiscalError);
      // Don't fail the transaction if fiscal receipt creation fails
    }

    return transaction;
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string, tenantId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        tenantId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        customer: true,
        user: true,
        location: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  /**
   * List transactions with pagination
   */
  async listTransactions(params: {
    tenantId: string;
    page?: number;
    limit?: number;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      tenantId: params.tenantId,
      ...(params.status && { status: params.status }),
      ...(params.fromDate && params.toDate && {
        createdAt: {
          gte: params.fromDate,
          lte: params.toDate,
        },
      }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  currency: true,
                },
              },
            },
          },
          payments: true,
          customer: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Void a transaction
   */
  async voidTransaction(transactionId: string, tenantId: string, userId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        tenantId,
      },
      include: {
        items: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'completed') {
      throw new Error('Only completed transactions can be voided');
    }

    // Update transaction and restore inventory
    const updated = await prisma.$transaction(async (tx) => {
      // Mark as voided
      const voided = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'voided',
          voidedAt: new Date(),
          voidedBy: userId,
        },
      });

      // Restore inventory
      for (const item of transaction.items) {
        await tx.stock.updateMany({
          where: {
            productId: item.productId,
            tenantId,
          },
          data: {
            quantity: {
              increment: Number(item.quantity),
            },
          },
        });
      }

      return voided;
    });

    return updated;
  }

  /**
   * Generate unique transaction number
   */
  private async generateTransactionNumber(tenantId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    // Create start and end of day (create fresh Date objects to avoid mutation)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // Count transactions for today for this tenant
    const count = await prisma.transaction.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    // Add random suffix to ensure uniqueness in case of concurrent requests
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TXN-${dateStr}-${sequence}-${randomSuffix}`;
  }
}

export const posService = new POSService();
