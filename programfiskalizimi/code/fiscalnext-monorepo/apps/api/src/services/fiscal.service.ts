import { prisma } from '@fiscalnext/database';
import crypto from 'crypto';
import QRCode from 'qrcode';

export class FiscalService {
  /**
   * Generate IIC hash (Internal Invoice Code) - SHA-256
   */
  private generateIIC(data: {
    businessId: string;
    transactionNumber: string;
    dateTime: Date;
    total: number;
  }): string {
    const dataString = `${data.businessId}|${data.transactionNumber}|${data.dateTime.toISOString()}|${data.total}`;
    return crypto.createHash('sha256').update(dataString).digest('hex').toUpperCase();
  }

  /**
   * Generate QR code for fiscal receipt
   */
  private async generateQRCode(data: string): Promise<string> {
    try {
      // Generate QR code as base64 data URL
      const qrCode = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 256,
      });
      return qrCode;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Create fiscal receipt for a transaction
   */
  async createFiscalReceipt(data: {
    transactionId: string;
    tenantId: string;
    country: 'AL' | 'XK';
  }) {
    // Get transaction details
    const transaction = await prisma.transaction.findUnique({
      where: { id: data.transactionId },
      include: {
        items: true,
        payments: true,
        tenant: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.tenantId !== data.tenantId) {
      throw new Error('Unauthorized access to transaction');
    }

    // Check if fiscal receipt already exists
    const existing = await prisma.fiscalReceipt.findFirst({
      where: { transactionId: data.transactionId },
    });

    if (existing) {
      throw new Error('Fiscal receipt already exists for this transaction');
    }

    // Generate IIC hash
    const iic = this.generateIIC({
      businessId: transaction.tenant.nipt || transaction.tenantId,
      transactionNumber: transaction.transactionNumber,
      dateTime: transaction.createdAt,
      total: Number(transaction.total),
    });

    // Generate fiscal receipt number
    const receiptNumber = `FIS-${data.country}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create QR code data
    const qrData = JSON.stringify({
      iic,
      receiptNumber,
      transactionNumber: transaction.transactionNumber,
      dateTime: transaction.createdAt.toISOString(),
      total: Number(transaction.total),
      country: data.country,
    });

    const qrCode = await this.generateQRCode(qrData);

    // Mock tax authority response (in production, call real API)
    const mockTaxAuthorityResponse = {
      status: 'verified',
      verificationCode: `${data.country}-VER-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    // Create fiscal receipt
    const fiscalReceipt = await prisma.fiscalReceipt.create({
      data: {
        tenantId: data.tenantId,
        transactionId: data.transactionId,
        receiptNumber,
        iic,
        qrCode,
        country: data.country,
        fiscalData: mockTaxAuthorityResponse as any,
        status: 'verified',
        verifiedAt: new Date(),
      },
    });

    // Update transaction with fiscal receipt ID
    await prisma.transaction.update({
      where: { id: data.transactionId },
      data: { fiscalReceiptId: fiscalReceipt.id },
    });

    return {
      fiscalReceipt: {
        id: fiscalReceipt.id,
        receiptNumber: fiscalReceipt.receiptNumber,
        iic: fiscalReceipt.iic,
        qrCode: fiscalReceipt.qrCode,
        country: fiscalReceipt.country,
        status: fiscalReceipt.status,
        verifiedAt: fiscalReceipt.verifiedAt,
        createdAt: fiscalReceipt.createdAt,
      },
      transaction: {
        transactionNumber: transaction.transactionNumber,
        total: transaction.total,
      },
    };
  }

  /**
   * Get fiscal receipt by ID
   */
  async getFiscalReceiptById(id: string, tenantId: string) {
    const fiscalReceipt = await prisma.fiscalReceipt.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        transaction: {
          include: {
            items: true,
            payments: true,
          },
        },
      },
    });

    if (!fiscalReceipt) {
      throw new Error('Fiscal receipt not found');
    }

    return fiscalReceipt;
  }

  /**
   * List fiscal receipts with pagination
   */
  async listFiscalReceipts(params: {
    tenantId: string;
    page: number;
    limit: number;
    status?: 'pending' | 'verified' | 'failed';
    fromDate?: string;
    toDate?: string;
  }) {
    const skip = (params.page - 1) * params.limit;

    const where: any = {
      tenantId: params.tenantId,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) {
        where.createdAt.gte = new Date(params.fromDate);
      }
      if (params.toDate) {
        where.createdAt.lte = new Date(params.toDate);
      }
    }

    const [fiscalReceipts, total] = await Promise.all([
      prisma.fiscalReceipt.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          transaction: {
            select: {
              transactionNumber: true,
              total: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.fiscalReceipt.count({ where }),
    ]);

    return {
      fiscalReceipts,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  /**
   * Verify fiscal receipt with tax authority (mock)
   */
  async verifyFiscalReceipt(receiptId: string, tenantId: string) {
    const fiscalReceipt = await prisma.fiscalReceipt.findFirst({
      where: {
        id: receiptId,
        tenantId,
      },
    });

    if (!fiscalReceipt) {
      throw new Error('Fiscal receipt not found');
    }

    // Mock tax authority verification (in production, call real API)
    const mockVerification = {
      status: 'verified',
      verificationCode: `${fiscalReceipt.country}-VER-${Date.now()}`,
      timestamp: new Date().toISOString(),
      message: 'Receipt verified successfully',
    };

    // Update fiscal receipt
    const updated = await prisma.fiscalReceipt.update({
      where: { id: receiptId },
      data: {
        status: 'verified',
        verifiedAt: new Date(),
        fiscalData: mockVerification as any,
      },
    });

    return {
      success: true,
      verification: mockVerification,
      fiscalReceipt: {
        id: updated.id,
        receiptNumber: updated.receiptNumber,
        status: updated.status,
        verifiedAt: updated.verifiedAt,
      },
    };
  }
}

export const fiscalService = new FiscalService();
