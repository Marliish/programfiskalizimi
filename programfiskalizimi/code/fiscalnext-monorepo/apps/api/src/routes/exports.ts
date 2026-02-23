// Export Routes - Accounting Software Integration
// Created: 2026-02-23 - Day 7 Integration

import { FastifyInstance } from 'fastify';
import { ExportService } from '../services/export.service';

const exportService = new ExportService();

export async function exportRoutes(server: FastifyInstance) {
  // Export to QuickBooks IIF
  server.get('/quickbooks', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { startDate, endDate } = request.query as any;
      
      const iifContent = await exportService.exportToQuickBooks({
        startDate,
        endDate,
        format: 'quickbooks',
      });
      
      reply
        .header('Content-Type', 'text/plain')
        .header('Content-Disposition', `attachment; filename="fiscalnext-export-${Date.now()}.iif"`)
        .send(iifContent);
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Export failed',
        message: error.message,
      });
    }
  });

  // Export to Xero CSV
  server.get('/xero', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { startDate, endDate } = request.query as any;
      
      const csvContent = await exportService.exportToXero({
        startDate,
        endDate,
        format: 'xero',
      });
      
      reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="xero-export-${Date.now()}.csv"`)
        .send(csvContent);
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Export failed',
        message: error.message,
      });
    }
  });

  // Export to Generic Accounting CSV
  server.get('/generic', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { startDate, endDate } = request.query as any;
      
      const csvContent = await exportService.exportToGeneric({
        startDate,
        endDate,
        format: 'generic',
      });
      
      reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="accounting-export-${Date.now()}.csv"`)
        .send(csvContent);
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Export failed',
        message: error.message,
      });
    }
  });

  // Export customers CSV
  server.get('/customers', async (request, reply) => {
    try {
      const csvContent = await exportService.exportCustomers();
      
      reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="customers-${Date.now()}.csv"`)
        .send(csvContent);
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Export failed',
        message: error.message,
      });
    }
  });

  // Export products CSV
  server.get('/products', async (request, reply) => {
    try {
      const csvContent = await exportService.exportProducts();
      
      reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="products-${Date.now()}.csv"`)
        .send(csvContent);
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Export failed',
        message: error.message,
      });
    }
  });

  // Export invoices CSV
  server.get('/invoices', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { startDate, endDate } = request.query as any;
      
      const csvContent = await exportService.exportInvoices({
        startDate,
        endDate,
        format: 'generic',
      });
      
      reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="invoices-${Date.now()}.csv"`)
        .send(csvContent);
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Export failed',
        message: error.message,
      });
    }
  });

  // Get available export formats
  server.get('/formats', async (request, reply) => {
    return {
      formats: [
        {
          id: 'quickbooks',
          name: 'QuickBooks IIF',
          description: 'QuickBooks Import Format (.iif)',
          endpoint: '/v1/exports/quickbooks',
          fileExtension: '.iif',
        },
        {
          id: 'xero',
          name: 'Xero CSV',
          description: 'Xero Accounting CSV Import',
          endpoint: '/v1/exports/xero',
          fileExtension: '.csv',
        },
        {
          id: 'generic',
          name: 'Generic CSV',
          description: 'Standard accounting CSV format',
          endpoint: '/v1/exports/generic',
          fileExtension: '.csv',
        },
      ],
      entities: [
        {
          id: 'customers',
          name: 'Customers',
          endpoint: '/v1/exports/customers',
        },
        {
          id: 'products',
          name: 'Products',
          endpoint: '/v1/exports/products',
        },
        {
          id: 'invoices',
          name: 'Invoices',
          endpoint: '/v1/exports/invoices',
        },
      ],
    };
  });
}
