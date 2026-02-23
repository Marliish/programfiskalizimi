// Fiscal Receipt Service - Complete fiscal compliance
// Day 4: Enhanced with IIC, QR codes, verification
import { prisma } from '@fiscalnext/database';
import crypto from 'crypto';

interface GenerateFiscalReceiptInput {
  tenantId: string;
  transactionId: string;
  country?: string;
}

interface VerifyReceiptResult {
  valid: boolean;
  status: string;
  message: string;
  verifiedAt?: Date;
}

// Generate IIC (Internal Invoice Code) - SHA-256 hash
function generateIIC(data: {
  tenantId: string;
  transactionNumber: string;
  total: string;
  timestamp: string;
}): string {
  const payload = `${data.tenantId}|${data.transactionNumber}|${data.total}|${data.timestamp}`;
  return crypto.createHash('sha256').update(payload).digest('hex').toUpperCase();
}

// Generate QR code content (URL format for tax authority)
function generateQRCodeContent(receipt: {
  iic: string;
  fiscalNumber?: string;
  country: string;
  total: string;
  timestamp: string;
}): string {
  const baseUrl = receipt.country === 'XK' 
    ? 'https://efiskalizimi-app-test.atk-ks.org/verify'
    : 'https://efiskalizimi-app-test.tatime.gov.al/verify';
  
  return `${baseUrl}?iic=${receipt.iic}&amount=${receipt.total}&date=${receipt.timestamp}`;
}

// Mock tax authority API response (Albania/Kosovo)
async function submitToTaxAuthority(data: any, country: string): Promise<any> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock success response (90% success rate for realism)
  const isSuccess = Math.random() > 0.1;
  
  if (isSuccess) {
    const fiscalNumber = `NSLF-${country}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    return {
      success: true,
      fiscalNumber,
      timestamp: new Date().toISOString(),
      message: 'Fiscal receipt successfully registered with tax authority',
    };
  } else {
    throw new Error('Tax authority connection failed (mock error)');
  }
}

class FiscalReceiptService {
  // Generate fiscal receipt for transaction
  async generateReceipt(input: GenerateFiscalReceiptInput) {
    const { tenantId, transactionId, country = 'AL' } = input;

    // Get transaction details
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        tenantId,
      },
      include: {
        items: true,
        payments: true,
        user: true,
        customer: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Check if fiscal receipt already exists
    const existing = await prisma.fiscalReceipt.findFirst({
      where: { transactionId },
    });

    if (existing) {
      return existing;
    }

    // Generate IIC
    const iic = generateIIC({
      tenantId,
      transactionNumber: transaction.transactionNumber,
      total: transaction.total.toString(),
      timestamp: transaction.createdAt.toISOString(),
    });

    // Generate QR code content
    const qrCode = generateQRCodeContent({
      iic,
      country,
      total: transaction.total.toString(),
      timestamp: transaction.createdAt.toISOString(),
    });

    // Submit to tax authority (mock)
    let fiscalNumber: string | undefined;
    let submissionStatus = 'pending';
    let responseData: any = null;
    let errorMessage: string | undefined;
    let submittedAt: Date | undefined;

    try {
      const response = await submitToTaxAuthority(
        {
          iic,
          transaction,
          tenant: { id: tenantId },
        },
        country
      );

      fiscalNumber = response.fiscalNumber;
      submissionStatus = 'submitted';
      responseData = response;
      submittedAt = new Date();
    } catch (error) {
      submissionStatus = 'failed';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    // Calculate expiration (90 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    // Create fiscal receipt
    const fiscalReceipt = await prisma.fiscalReceipt.create({
      data: {
        tenantId,
        transactionId,
        country,
        iic,
        fiscalNumber,
        qrCode,
        submissionStatus,
        submittedAt,
        responseData,
        errorMessage,
        expiresAt,
        verificationStatus: 'unverified',
      },
      include: {
        transactions: {
          include: {
            items: true,
            payments: true,
          },
        },
      },
    });

    return fiscalReceipt;
  }

  // List all fiscal receipts
  async listReceipts(params: {
    tenantId: string;
    page?: number;
    limit?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) {
    const { tenantId, page = 1, limit = 20, status, startDate, endDate, search } = params;

    const where: any = { tenantId };

    if (status) {
      where.submissionStatus = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (search) {
      where.OR = [
        { iic: { contains: search, mode: 'insensitive' } },
        { fiscalNumber: { contains: search, mode: 'insensitive' } },
        {
          transactions: {
            some: {
              transactionNumber: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [receipts, total] = await Promise.all([
      prisma.fiscalReceipt.findMany({
        where,
        include: {
          transactions: {
            select: {
              transactionNumber: true,
              total: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fiscalReceipt.count({ where }),
    ]);

    return {
      receipts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get receipt details
  async getReceipt(receiptId: string, tenantId: string) {
    const receipt = await prisma.fiscalReceipt.findFirst({
      where: {
        id: receiptId,
        tenantId,
      },
      include: {
        transactions: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            payments: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            customer: true,
          },
        },
      },
    });

    if (!receipt) {
      throw new Error('Fiscal receipt not found');
    }

    return receipt;
  }

  // Verify receipt with tax authority
  async verifyReceipt(receiptId: string, tenantId: string): Promise<VerifyReceiptResult> {
    const receipt = await prisma.fiscalReceipt.findFirst({
      where: {
        id: receiptId,
        tenantId,
      },
    });

    if (!receipt) {
      throw new Error('Fiscal receipt not found');
    }

    // Mock verification (in production, this would call tax authority API)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const isValid = receipt.submissionStatus === 'submitted' && receipt.fiscalNumber;
    
    const verificationStatus = isValid ? 'verified' : 'invalid';
    const verifiedAt = isValid ? new Date() : undefined;

    // Update receipt
    await prisma.fiscalReceipt.update({
      where: { id: receiptId },
      data: {
        verificationStatus,
        verifiedAt,
      },
    });

    return {
      valid: isValid,
      status: verificationStatus,
      message: isValid 
        ? 'Receipt verified successfully with tax authority' 
        : 'Receipt verification failed',
      verifiedAt,
    };
  }

  // Retry failed submissions
  async retryFailedSubmissions(tenantId: string) {
    const failedReceipts = await prisma.fiscalReceipt.findMany({
      where: {
        tenantId,
        submissionStatus: 'failed',
        retryCount: { lt: 3 },
      },
      include: {
        transactions: true,
      },
    });

    const results = [];

    for (const receipt of failedReceipts) {
      try {
        const response = await submitToTaxAuthority(
          {
            iic: receipt.iic,
            transaction: receipt.transactions[0],
            tenant: { id: tenantId },
          },
          receipt.country
        );

        await prisma.fiscalReceipt.update({
          where: { id: receipt.id },
          data: {
            fiscalNumber: response.fiscalNumber,
            submissionStatus: 'submitted',
            submittedAt: new Date(),
            responseData: response,
            errorMessage: null,
            retryCount: { increment: 1 },
          },
        });

        results.push({ receiptId: receipt.id, success: true });
      } catch (error) {
        await prisma.fiscalReceipt.update({
          where: { id: receipt.id },
          data: {
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            retryCount: { increment: 1 },
          },
        });

        results.push({ receiptId: receipt.id, success: false });
      }
    }

    return results;
  }
}

export const fiscalReceiptService = new FiscalReceiptService();
