// Report Routes - Reporting and analytics
import { FastifyInstance } from 'fastify';
import { reportService } from '../services/report.service';
import { 
  salesReportQuerySchema,
  productsReportQuerySchema,
  revenueReportQuerySchema,
  SalesReportQuery,
  ProductsReportQuery,
  RevenueReportQuery
} from '../schemas/report.schema';
import { validate } from '../middleware/validate';

export async function reportRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Sales Report
  fastify.get<{ Querystring: SalesReportQuery }>('/reports/sales', {
    preHandler: [validate(salesReportQuerySchema, 'query')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const query = request.query;

      const report = await reportService.getSalesReport({
        tenantId: decoded.tenantId,
        startDate: query.startDate,
        endDate: query.endDate,
        period: query.period,
        locationId: query.locationId,
      });

      // Handle export formats
      if (query.exportFormat === 'csv') {
        const csv = reportService.exportToCSV(report.data, ['period', 'revenue', 'transactions', 'items', 'tax']);
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', 'attachment; filename=sales-report.csv');
        return csv;
      }

      if (query.exportFormat === 'pdf') {
        return reply.status(501).send({
          success: false,
          error: 'PDF export not yet implemented',
        });
      }

      return {
        success: true,
        report,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate sales report',
      });
    }
  });

  // Products Report (Best Sellers & Low Stock)
  fastify.get<{ Querystring: ProductsReportQuery }>('/reports/products', {
    preHandler: [validate(productsReportQuerySchema, 'query')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const query = request.query;

      const report = await reportService.getProductsReport({
        tenantId: decoded.tenantId,
        startDate: query.startDate,
        endDate: query.endDate,
        limit: query.limit,
        type: query.type,
      });

      // Handle export formats
      if (query.exportFormat === 'csv') {
        const data = report.bestSellers || report.lowStock || [];
        const headers = Object.keys(data[0] || {});
        const csv = reportService.exportToCSV(data, headers);
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', 'attachment; filename=products-report.csv');
        return csv;
      }

      if (query.exportFormat === 'pdf') {
        return reply.status(501).send({
          success: false,
          error: 'PDF export not yet implemented',
        });
      }

      return {
        success: true,
        report,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate products report',
      });
    }
  });

  // Revenue Report (Time Series)
  fastify.get<{ Querystring: RevenueReportQuery }>('/reports/revenue', {
    preHandler: [validate(revenueReportQuerySchema, 'query')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const query = request.query;

      const report = await reportService.getRevenueReport({
        tenantId: decoded.tenantId,
        startDate: query.startDate,
        endDate: query.endDate,
        groupBy: query.groupBy,
      });

      // Handle export formats
      if (query.exportFormat === 'csv') {
        const csv = reportService.exportToCSV(report.timeSeries, ['period', 'revenue', 'transactions', 'cumulativeRevenue']);
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', 'attachment; filename=revenue-report.csv');
        return csv;
      }

      if (query.exportFormat === 'pdf') {
        return reply.status(501).send({
          success: false,
          error: 'PDF export not yet implemented',
        });
      }

      return {
        success: true,
        report,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate revenue report',
      });
    }
  });
}
