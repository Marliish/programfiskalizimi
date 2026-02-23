// Barcode & Printer Service
// Supports barcode generation, label printing, receipt printing
// Created: 2026-02-23 - Day 7 Integration

import bwipjs from 'bwip-js';
import QRCode from 'qrcode';
import { prisma } from '@fiscalnext/database';

interface BarcodeOptions {
  type: 'ean13' | 'code128' | 'qr';
  data: string;
  width?: number;
  height?: number;
  includeText?: boolean;
}

interface LabelOptions {
  productId: string;
  quantity?: number;
  includePrice?: boolean;
  includeBarcode?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface ReceiptPrintOptions {
  receiptId: string;
  printerName?: string;
  copies?: number;
}

interface PrinterConfig {
  name: string;
  type: 'receipt' | 'label' | 'kitchen';
  connection: 'usb' | 'network' | 'bluetooth';
  address?: string;
  paperWidth?: number;
}

export class BarcodePrinterService {
  /**
   * Generate barcode image (PNG buffer)
   */
  async generateBarcode(options: BarcodeOptions): Promise<Buffer> {
    try {
      if (options.type === 'qr') {
        // Generate QR code using qrcode library
        const qrBuffer = await QRCode.toBuffer(options.data, {
          width: options.width || 200,
          margin: 1,
        });
        return qrBuffer;
      }

      // Generate EAN-13 or Code128 using bwip-js
      const barcodeType = options.type === 'ean13' ? 'ean13' : 'code128';

      const png = await bwipjs.toBuffer({
        bcid: barcodeType,
        text: options.data,
        scale: 3,
        height: options.height || 10,
        width: options.width,
        includetext: options.includeText !== false,
        textxalign: 'center',
      });

      return png;
    } catch (error) {
      throw new Error(`Barcode generation failed: ${error}`);
    }
  }

  /**
   * Generate barcode as base64 data URL
   */
  async generateBarcodeDataURL(options: BarcodeOptions): Promise<string> {
    const buffer = await this.generateBarcode(options);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  /**
   * Generate price label for product
   */
  async generatePriceLabel(options: LabelOptions): Promise<any> {
    const product = await prisma.product.findUnique({
      where: { id: options.productId },
      include: { category: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    let barcodeDataUrl: string | undefined;

    if (options.includeBarcode && product.barcode) {
      barcodeDataUrl = await this.generateBarcodeDataURL({
        type: 'ean13',
        data: product.barcode,
      });
    }

    const label = {
      productId: product.id,
      name: product.name,
      price: product.price,
      barcode: product.barcode,
      barcodeImage: barcodeDataUrl,
      sku: product.sku,
      category: product.category?.name,
      size: options.size || 'medium',
      quantity: options.quantity || 1,
    };

    return label;
  }

  /**
   * Generate shelf label with barcode
   */
  async generateShelfLabel(productId: string): Promise<any> {
    return this.generatePriceLabel({
      productId,
      includeBarcode: true,
      includePrice: true,
      size: 'large',
    });
  }

  /**
   * Generate ESC/POS commands for receipt printing
   */
  async generateReceiptCommands(receiptId: string): Promise<string[]> {
    const receipt = await prisma.fiscalReceipt.findUnique({
      where: { id: receiptId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    // ESC/POS command sequences (simplified)
    const commands: string[] = [];

    // Initialize printer
    commands.push('\x1B\x40'); // ESC @ - Initialize

    // Set alignment to center
    commands.push('\x1B\x61\x01'); // ESC a 1

    // Print header
    commands.push('\x1B\x21\x30'); // Double height & width
    commands.push('FISCALNEXT POS\n');
    commands.push('\x1B\x21\x00'); // Normal text
    commands.push('Receipt #' + receipt.receiptNumber + '\n');
    commands.push('--------------------------------\n');

    // Set alignment to left
    commands.push('\x1B\x61\x00');

    // Print items
    for (const item of receipt.items) {
      const name = (item.product?.name || item.name).substring(0, 20);
      const qty = item.quantity.toString();
      const price = item.price.toFixed(2);
      const total = item.total.toFixed(2);

      commands.push(`${name}\n`);
      commands.push(`  ${qty} x ${price} ALL = ${total} ALL\n`);
    }

    commands.push('--------------------------------\n');

    // Print totals
    commands.push(`Subtotal:     ${receipt.subtotal?.toFixed(2) || receipt.total.toFixed(2)} ALL\n`);
    if (receipt.tax) {
      commands.push(`Tax:          ${receipt.tax.toFixed(2)} ALL\n`);
    }
    if (receipt.discount) {
      commands.push(`Discount:     ${receipt.discount.toFixed(2)} ALL\n`);
    }

    commands.push('\x1B\x21\x10'); // Emphasize
    commands.push(`TOTAL:        ${receipt.total.toFixed(2)} ALL\n`);
    commands.push('\x1B\x21\x00'); // Normal text

    commands.push('--------------------------------\n');
    commands.push(`Payment: ${receipt.paymentMethod}\n`);
    commands.push(`Date: ${new Date(receipt.createdAt).toLocaleString()}\n`);

    if (receipt.customer) {
      commands.push(`Customer: ${receipt.customer.name}\n`);
    }

    commands.push('\n');

    // Center alignment for footer
    commands.push('\x1B\x61\x01');
    commands.push('Thank you for your purchase!\n');
    commands.push('Visit us again soon!\n');
    commands.push('\n\n');

    // Cut paper
    commands.push('\x1D\x56\x00'); // GS V 0 - Full cut

    return commands;
  }

  /**
   * Print receipt to thermal printer (MOCK)
   */
  async printReceipt(options: ReceiptPrintOptions): Promise<any> {
    const commands = await this.generateReceiptCommands(options.receiptId);
    const printerName = options.printerName || 'default';
    const copies = options.copies || 1;

    console.log('[MOCK] Printing receipt to:', printerName);
    console.log('[MOCK] Commands:', commands.length);
    console.log('[MOCK] Copies:', copies);

    // In production, send commands to actual printer via USB/Network

    return {
      success: true,
      printer: printerName,
      receiptId: options.receiptId,
      copies,
      commandCount: commands.length,
      printedAt: new Date(),
    };
  }

  /**
   * Generate kitchen order ticket (for restaurants)
   */
  async generateKitchenTicket(receiptId: string): Promise<string[]> {
    const receipt = await prisma.fiscalReceipt.findUnique({
      where: { id: receiptId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    const commands: string[] = [];

    // Initialize
    commands.push('\x1B\x40');

    // Large text for order number
    commands.push('\x1B\x21\x30');
    commands.push(`ORDER #${receipt.receiptNumber}\n`);
    commands.push('\x1B\x21\x00');

    commands.push(`Time: ${new Date(receipt.createdAt).toLocaleTimeString()}\n`);
    commands.push('================================\n');

    // Print items with quantities
    for (const item of receipt.items) {
      commands.push('\x1B\x21\x10'); // Emphasize
      commands.push(`${item.quantity}x ${item.product?.name || item.name}\n`);
      commands.push('\x1B\x21\x00');

      if (item.notes) {
        commands.push(`   Note: ${item.notes}\n`);
      }
      commands.push('\n');
    }

    commands.push('================================\n');
    commands.push('\n\n');

    // Cut
    commands.push('\x1D\x56\x00');

    return commands;
  }

  /**
   * Print kitchen ticket (MOCK)
   */
  async printKitchenTicket(receiptId: string, printerName?: string): Promise<any> {
    const commands = await this.generateKitchenTicket(receiptId);

    console.log('[MOCK] Printing kitchen ticket to:', printerName || 'kitchen-printer');

    return {
      success: true,
      printer: printerName || 'kitchen-printer',
      receiptId,
      printedAt: new Date(),
    };
  }

  /**
   * Configure printer
   */
  async configurePrinter(config: PrinterConfig): Promise<any> {
    console.log('[MOCK] Configuring printer:', config);

    // In production, save to database and test connection

    return {
      success: true,
      config,
      status: 'ready',
      connectedAt: new Date(),
    };
  }

  /**
   * List configured printers
   */
  async listPrinters(): Promise<PrinterConfig[]> {
    // In production, fetch from database
    return [
      {
        name: 'main-receipt',
        type: 'receipt',
        connection: 'usb',
        paperWidth: 80,
      },
      {
        name: 'kitchen-printer',
        type: 'kitchen',
        connection: 'network',
        address: '192.168.1.100',
        paperWidth: 80,
      },
      {
        name: 'label-printer',
        type: 'label',
        connection: 'usb',
        paperWidth: 40,
      },
    ];
  }

  /**
   * Test printer connection
   */
  async testPrinter(printerName: string): Promise<any> {
    console.log('[MOCK] Testing printer:', printerName);

    // In production, send test print job

    return {
      success: true,
      printer: printerName,
      status: 'online',
      testPrintSent: true,
      testedAt: new Date(),
    };
  }

  /**
   * Batch print labels for multiple products
   */
  async batchPrintLabels(productIds: string[], options?: {
    includeBarcode?: boolean;
    includePrice?: boolean;
  }): Promise<any> {
    const labels = [];

    for (const productId of productIds) {
      const label = await this.generatePriceLabel({
        productId,
        includeBarcode: options?.includeBarcode,
        includePrice: options?.includePrice,
      });
      labels.push(label);
    }

    console.log('[MOCK] Batch printing', labels.length, 'labels');

    return {
      success: true,
      labelCount: labels.length,
      labels: labels.slice(0, 5), // Return sample
      printedAt: new Date(),
    };
  }
}
