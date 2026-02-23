import { FastifyInstance } from 'fastify';
import { advancedReportService } from '../services/advanced-report.service';
import { 
  createReportSchema, 
  updateReportSchema,
  scheduleReportSchema,
  executeReportSchema,
  generateReportSchema,
} from '../schemas/advanced-report.schema';
import { authenticateUser as authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

export default async function advancedReportRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', authenticate);
  
  // Get all reports
  fastify.get('/', async (request: any, reply: any) => {
    const { tenantId, userId } = request.user!;
    const { includeTemplates } = request.query as any;
    
    const reports = await advancedReportService.getReports(
      tenantId, 
      userId,
      includeTemplates === 'true'
    );
    
    return reply.send(reports);
  });
  
  // Get report by ID
  fastify.get('/:id', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    
    try {
      const report = await advancedReportService.getReport(tenantId, id);
      return reply.send(report);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Create report
  fastify.post('/', {
  }, async (request: any, reply: any) => {
    const { tenantId, userId } = request.user!;
    const data = request.body as any;
    
    const report = await advancedReportService.createReport(tenantId, userId, data);
    
    return reply.status(201).send(report);
  });
  
  // Update report
  fastify.patch('/:id', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    const data = request.body as any;
    
    try {
      const report = await advancedReportService.updateReport(tenantId, id, data);
      return reply.send(report);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Delete report
  fastify.delete('/:id', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    
    try {
      await advancedReportService.deleteReport(tenantId, id);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Schedule report
  fastify.post('/:id/schedule', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    const schedule = request.body as any;
    
    try {
      const report = await advancedReportService.scheduleReport(tenantId, id, schedule);
      return reply.send(report);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Execute report
  fastify.post('/:id/execute', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    const params = request.body as any;
    
    try {
      const result = await advancedReportService.executeReport(tenantId, id, params);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // Generate report (export)
  fastify.post('/:id/generate', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    const { format, includeCharts } = request.body as any;
    const params = request.query as any;
    
    try {
      if (format === 'excel') {
        const workbook = await advancedReportService.exportToExcel(tenantId, id, params);
        
        reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        reply.header('Content-Disposition', `attachment; filename="report-${id}.xlsx"`);
        
        const buffer = await workbook.xlsx.writeBuffer();
        return reply.send(buffer);
        
      } else if (format === 'csv') {
        const csv = await advancedReportService.exportToCSV(tenantId, id, params);
        
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="report-${id}.csv"`);
        
        return reply.send(csv);
        
      } else {
        // JSON format
        const result = await advancedReportService.executeReport(tenantId, id, params);
        return reply.send(result);
      }
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // Get report templates
  // Get report templates (alias)
  fastify.get("/templates", async (request: any, reply: any) => {
    const templates = advancedReportService.getTemplates();
    return reply.send({ success: true, data: templates });
  });

  fastify.get('/templates/list', async (request: any, reply: any) => {
    // Return predefined report templates
    const templates = [
      {
        id: 'sales-summary',
        name: 'Sales Summary',
        description: 'Daily, weekly, or monthly sales overview',
        reportType: 'sales',
        config: {
          fields: ['date', 'transactionCount', 'revenue', 'tax'],
          groupBy: ['day'],
          chartType: 'line',
        },
      },
      {
        id: 'profit-loss',
        name: 'Profit & Loss Statement',
        description: 'Financial performance report',
        reportType: 'profit_loss',
        config: {
          fields: ['revenue', 'cogs', 'grossProfit', 'netProfit'],
        },
      },
      {
        id: 'inventory-valuation',
        name: 'Inventory Valuation',
        description: 'Current inventory value by location',
        reportType: 'inventory',
        config: {
          fields: ['productName', 'quantity', 'costValue', 'sellingValue'],
          groupBy: ['location'],
        },
      },
      {
        id: 'tax-summary',
        name: 'Tax Summary',
        description: 'Tax collected by rate',
        reportType: 'tax_summary',
        config: {
          fields: ['taxRate', 'subtotal', 'taxAmount'],
          groupBy: ['taxRate'],
        },
      },
      {
        id: 'customer-analysis',
        name: 'Customer Analysis',
        description: 'Customer segments and behavior',
        reportType: 'customer_analysis',
        config: {
          fields: ['customerName', 'transactionCount', 'totalSpent', 'segment'],
        },
      },
      {
        id: 'product-performance',
        name: 'Product Performance (ABC Analysis)',
        description: 'Top-performing products',
        reportType: 'product_performance',
        config: {
          fields: ['productName', 'revenue', 'profit', 'classification'],
          orderBy: { field: 'revenue', direction: 'desc' },
        },
      },
    ];
    
    return reply.send(templates);
  });
}

