// Barcode System Service
// Team 3: Tafa (Backend Developer)
// Features: All 8 barcode features

import { PrismaClient } from '@fiscalnext/database';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

export const barcodeService = {
  // ===== BARCODE GENERATION =====
  async generateBarcode(params: {
    tenantId: string;
    productId: string;
    barcodeType?: string;
    isPrimary?: boolean;
    generatedBy: string;
  }) {
    const { tenantId, productId, barcodeType = 'EAN13', isPrimary = false, generatedBy } = params;

    // Generate unique barcode number
    let barcode: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      barcode = this.generateBarcodeNumber(barcodeType);
      
      const existing = await prisma.productBarcode.findUnique({
        where: { barcode },
      });

      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique barcode');
    }

    return await prisma.productBarcode.create({
      data: {
        tenantId,
        productId,
        barcode: barcode!,
        barcodeType,
        isPrimary,
        generatedBy,
        generatedAt: new Date(),
      },
    });
  },

  generateBarcodeNumber(type: string): string {
    switch (type) {
      case 'EAN13':
        return this.generateEAN13();
      case 'EAN8':
        return this.generateEAN8();
      case 'UPC':
        return this.generateUPC();
      case 'CODE128':
        return this.generateCODE128();
      case 'CODE39':
        return this.generateCODE39();
      default:
        return this.generateEAN13();
    }
  },

  generateEAN13(): string {
    // Generate 12 random digits + 1 check digit
    const prefix = '200'; // Internal use prefix
    const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const base = prefix + random;
    const checkDigit = this.calculateEAN13CheckDigit(base);
    return base + checkDigit;
  },

  calculateEAN13CheckDigit(code: string): string {
    const digits = code.split('').map(Number);
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  },

  generateEAN8(): string {
    const prefix = '20';
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const base = prefix + random;
    const checkDigit = this.calculateEAN13CheckDigit(base);
    return base + checkDigit;
  },

  generateUPC(): string {
    const random = Math.floor(Math.random() * 100000000000).toString().padStart(11, '0');
    const checkDigit = this.calculateEAN13CheckDigit(random);
    return random + checkDigit;
  },

  generateCODE128(): string {
    return 'C128' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  },

  generateCODE39(): string {
    return 'C39' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  },

  // ===== BULK BARCODE GENERATION =====
  async bulkGenerateBarcodes(params: {
    tenantId: string;
    productIds: string[];
    barcodeType?: string;
    generatedBy: string;
  }) {
    const { tenantId, productIds, barcodeType = 'EAN13', generatedBy } = params;

    const results = [];
    for (const productId of productIds) {
      try {
        const barcode = await this.generateBarcode({
          tenantId,
          productId,
          barcodeType,
          generatedBy,
        });
        results.push({ productId, barcode, success: true });
      } catch (error) {
        results.push({ productId, error: (error as Error).message, success: false });
      }
    }

    return results;
  },

  // ===== BARCODE TEMPLATES =====
  async createBarcodeTemplate(data: {
    tenantId: string;
    name: string;
    templateType: string;
    width: number;
    height: number;
    layout?: any;
    barcodeFormat?: string;
    showBarcodeText?: boolean;
    includeProductName?: boolean;
    includePrice?: boolean;
    includeSku?: boolean;
  }) {
    return await prisma.barcodeTemplate.create({ data });
  },

  async getBarcodeTemplates(tenantId: string) {
    return await prisma.barcodeTemplate.findMany({
      where: { tenantId },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });
  },

  async getDefaultTemplate(tenantId: string) {
    return await prisma.barcodeTemplate.findFirst({
      where: { tenantId, isDefault: true },
    });
  },

  // ===== BARCODE PRINTING =====
  async createPrintJob(params: {
    tenantId: string;
    productIds: string[];
    templateId?: string;
    quantity?: number;
    copies?: number;
    outputFormat?: string;
    printerName?: string;
    createdBy: string;
  }) {
    const {
      tenantId,
      productIds,
      templateId,
      quantity = 1,
      copies = 1,
      outputFormat = 'PDF',
      printerName,
      createdBy,
    } = params;

    const jobNumber = 'BPJ' + Date.now();

    const job = await prisma.barcodePrintJob.create({
      data: {
        tenantId,
        jobNumber,
        templateId,
        productIds: productIds,
        quantity,
        copies,
        outputFormat,
        printerName,
        createdBy,
      },
    });

    // Generate barcode images in background
    this.processPrintJob(job.id).catch(console.error);

    return job;
  },

  async processPrintJob(jobId: string) {
    const job = await prisma.barcodePrintJob.findUnique({
      where: { id: jobId },
    });

    if (!job) return;

    try {
      await prisma.barcodePrintJob.update({
        where: { id: jobId },
        data: { status: 'printing' },
      });

      // Get products and barcodes
      const productIds = job.productIds as string[];
      const barcodes = await prisma.productBarcode.findMany({
        where: {
          productId: { in: productIds },
          isPrimary: true,
        },
      });

      // Generate PDF or image
      const outputUrl = await this.generateBarcodeOutput(barcodes, job);

      await prisma.barcodePrintJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          outputUrl,
          printedAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.barcodePrintJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMessage: (error as Error).message,
        },
      });
    }
  },

  async generateBarcodeOutput(barcodes: any[], job: any): Promise<string> {
    // This would generate actual PDF/images using canvas or PDF library
    // For now, return a placeholder URL
    return '/barcode-outputs/' + job.jobNumber + '.pdf';
  },

  // ===== BARCODE RENDERING =====
  async renderBarcode(params: {
    barcode: string;
    type: string;
    format?: 'svg' | 'png' | 'dataurl';
    width?: number;
    height?: number;
  }): Promise<string> {
    const { barcode, type, format = 'svg', width = 2, height = 100 } = params;

    if (type === 'QR') {
      return await QRCode.toDataURL(barcode);
    }

    const canvas = createCanvas(200, height);
    JsBarcode(canvas, barcode, {
      format: type,
      width,
      height,
      displayValue: true,
    });

    if (format === 'dataurl') {
      return canvas.toDataURL();
    }

    return canvas.toBuffer().toString('base64');
  },

  // ===== BARCODE SCANNING =====
  async recordScan(data: {
    tenantId: string;
    barcode: string;
    scanType: string;
    scannedBy: string;
    warehouseId?: string;
    binId?: string;
    deviceInfo?: any;
  }) {
    // Verify barcode
    const productBarcode = await prisma.productBarcode.findUnique({
      where: { barcode: data.barcode },
    });

    const isValid = !!productBarcode;

    return await prisma.barcodeScan.create({
      data: {
        ...data,
        productId: productBarcode?.productId,
        isValid,
        errorMessage: isValid ? null : 'Barcode not found',
      },
    });
  },

  async verifyScan(barcode: string, expectedProductId: string): Promise<boolean> {
    const productBarcode = await prisma.productBarcode.findUnique({
      where: { barcode },
    });

    return productBarcode?.productId === expectedProductId;
  },

  async getScanHistory(params: {
    tenantId: string;
    barcode?: string;
    scanType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, barcode, scanType, startDate, endDate, page = 1, limit = 50 } = params;

    const where: any = { tenantId };
    if (barcode) where.barcode = barcode;
    if (scanType) where.scanType = scanType;
    if (startDate || endDate) {
      where.scannedAt = {};
      if (startDate) where.scannedAt.gte = startDate;
      if (endDate) where.scannedAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      prisma.barcodeScan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scannedAt: 'desc' },
      }),
      prisma.barcodeScan.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  },

  // ===== DUPLICATE DETECTION =====
  async checkDuplicates(barcode: string) {
    const barcodes = await prisma.productBarcode.findMany({
      where: { barcode },
    });

    return {
      isDuplicate: barcodes.length > 1,
      count: barcodes.length,
      products: barcodes.map(b => b.productId),
    };
  },

  async findDuplicateBarcodes(tenantId: string) {
    const barcodes = await prisma.productBarcode.findMany({
      where: { tenantId },
    });

    const duplicates: Record<string, any[]> = {};
    
    barcodes.forEach(barcode => {
      if (!duplicates[barcode.barcode]) {
        duplicates[barcode.barcode] = [];
      }
      duplicates[barcode.barcode].push(barcode);
    });

    return Object.entries(duplicates)
      .filter(([_, items]) => items.length > 1)
      .map(([barcode, items]) => ({ barcode, count: items.length, items }));
  },

  // ===== BARCODE LABEL DESIGNER =====
  async saveCustomLabel(data: {
    tenantId: string;
    name: string;
    width: number;
    height: number;
    layout: any;
  }) {
    return await this.createBarcodeTemplate({
      ...data,
      templateType: 'label',
      barcodeFormat: 'EAN13',
    });
  },

  // ===== RFID SUPPORT =====
  async generateRFIDTag(params: {
    tenantId: string;
    productId: string;
    generatedBy: string;
  }) {
    // RFID tags use a different format
    const rfidCode = 'RFID' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();

    return await prisma.productBarcode.create({
      data: {
        tenantId: params.tenantId,
        productId: params.productId,
        barcode: rfidCode,
        barcodeType: 'RFID',
        isPrimary: false,
        generatedBy: params.generatedBy,
        generatedAt: new Date(),
      },
    });
  },

  async updatePrintCount(barcodeId: string) {
    return await prisma.productBarcode.update({
      where: { id: barcodeId },
      data: {
        printCount: { increment: 1 },
        lastPrintedAt: new Date(),
      },
    });
  },
};
