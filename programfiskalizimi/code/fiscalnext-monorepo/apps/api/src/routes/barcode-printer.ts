// Barcode & Printer Routes
// Created: 2026-02-23 - Day 7 Integration

import { FastifyInstance } from 'fastify';
import { BarcodePrinterService } from '../services/barcode-printer.service';

const service = new BarcodePrinterService();

export async function barcodePrinterRoutes(server: FastifyInstance) {
  // Generate barcode (returns image)
  server.post('/barcode/generate', {
    schema: {
      body: {
        type: 'object',
        required: ['type', 'data'],
        properties: {
          type: { type: 'string', enum: ['ean13', 'code128', 'qr'] },
          data: { type: 'string' },
          width: { type: 'number' },
          height: { type: 'number' },
          includeText: { type: 'boolean', default: true },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const buffer = await service.generateBarcode(request.body as any);

      reply
        .header('Content-Type', 'image/png')
        .header('Content-Disposition', 'inline; filename="barcode.png"')
        .send(buffer);
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Barcode generation failed',
        message: error.message,
      });
    }
  });

  // Generate barcode as data URL (base64)
  server.post('/barcode/dataurl', {
    schema: {
      body: {
        type: 'object',
        required: ['type', 'data'],
        properties: {
          type: { type: 'string', enum: ['ean13', 'code128', 'qr'] },
          data: { type: 'string' },
          width: { type: 'number' },
          height: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const dataUrl = await service.generateBarcodeDataURL(request.body as any);

      return {
        success: true,
        dataUrl,
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Barcode generation failed',
        message: error.message,
      });
    }
  });

  // Generate price label for product
  server.post('/label/price', {
    schema: {
      body: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'number', default: 1 },
          includePrice: { type: 'boolean', default: true },
          includeBarcode: { type: 'boolean', default: true },
          size: { type: 'string', enum: ['small', 'medium', 'large'], default: 'medium' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const label = await service.generatePriceLabel(request.body as any);
      return { success: true, label };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Label generation failed',
        message: error.message,
      });
    }
  });

  // Generate shelf label
  server.post('/label/shelf/:productId', async (request, reply) => {
    try {
      const { productId } = request.params as any;
      const label = await service.generateShelfLabel(productId);
      return { success: true, label };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Shelf label generation failed',
        message: error.message,
      });
    }
  });

  // Batch print labels
  server.post('/label/batch', {
    schema: {
      body: {
        type: 'object',
        required: ['productIds'],
        properties: {
          productIds: { type: 'array', items: { type: 'string' } },
          includeBarcode: { type: 'boolean', default: true },
          includePrice: { type: 'boolean', default: true },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { productIds, includeBarcode, includePrice } = request.body as any;
      const result = await service.batchPrintLabels(productIds, {
        includeBarcode,
        includePrice,
      });
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Batch label printing failed',
        message: error.message,
      });
    }
  });

  // Print receipt
  server.post('/receipt/print', {
    schema: {
      body: {
        type: 'object',
        required: ['receiptId'],
        properties: {
          receiptId: { type: 'string' },
          printerName: { type: 'string' },
          copies: { type: 'number', default: 1 },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const result = await service.printReceipt(request.body as any);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Receipt printing failed',
        message: error.message,
      });
    }
  });

  // Get receipt ESC/POS commands
  server.get('/receipt/:receiptId/commands', async (request, reply) => {
    try {
      const { receiptId } = request.params as any;
      const commands = await service.generateReceiptCommands(receiptId);
      return {
        success: true,
        receiptId,
        commands,
        commandCount: commands.length,
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Failed to generate receipt commands',
        message: error.message,
      });
    }
  });

  // Print kitchen ticket
  server.post('/kitchen/print', {
    schema: {
      body: {
        type: 'object',
        required: ['receiptId'],
        properties: {
          receiptId: { type: 'string' },
          printerName: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { receiptId, printerName } = request.body as any;
      const result = await service.printKitchenTicket(receiptId, printerName);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Kitchen ticket printing failed',
        message: error.message,
      });
    }
  });

  // Configure printer
  server.post('/printer/configure', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'type', 'connection'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['receipt', 'label', 'kitchen'] },
          connection: { type: 'string', enum: ['usb', 'network', 'bluetooth'] },
          address: { type: 'string' },
          paperWidth: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const result = await service.configurePrinter(request.body as any);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Printer configuration failed',
        message: error.message,
      });
    }
  });

  // List configured printers
  server.get('/printer/list', async (request, reply) => {
    try {
      const printers = await service.listPrinters();
      return {
        success: true,
        printers,
        count: printers.length,
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Failed to list printers',
        message: error.message,
      });
    }
  });

  // Test printer connection
  server.post('/printer/:printerName/test', async (request, reply) => {
    try {
      const { printerName } = request.params as any;
      const result = await service.testPrinter(printerName);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Printer test failed',
        message: error.message,
      });
    }
  });
}
