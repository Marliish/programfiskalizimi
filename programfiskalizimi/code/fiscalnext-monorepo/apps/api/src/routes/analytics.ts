// Analytics Routes - Sales trends, top products, customer insights
import { FastifyInstance } from 'fastify';
import { analyticsService } from '../services/analytics.service';
import ExcelJS from 'exceljs';

export async function analyticsRoutes(fastify: FastifyInstance) {
  // Get sales trends
  fastify.get<{ 
    Querystring: { 
      period?: 'daily' | 'weekly' | 'monthly'; 
      days?: string;
    } 
  }>('/sales-trends', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const period = request.query.period || 'daily';
      const days = request.query.days ? parseInt(request.query.days) : 30;
      
      const trends = await analyticsService.getSalesTrends(decoded.tenantId, period, days);
      
      return {
        success: true,
        data: trends,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sales trends',
      });
    }
  });

  // Get top products
  fastify.get<{ 
    Querystring: { 
      by?: 'revenue' | 'quantity'; 
      limit?: string;
      days?: string;
    } 
  }>('/top-products', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const by = request.query.by || 'revenue';
      const limit = request.query.limit ? parseInt(request.query.limit) : 10;
      const days = request.query.days ? parseInt(request.query.days) : 30;
      
      const products = await analyticsService.getTopProducts(decoded.tenantId, by, limit, days);
      
      return {
        success: true,
        products,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch top products',
      });
    }
  });

  // Get customer insights
  fastify.get<{ 
    Querystring: { 
      limit?: string;
      days?: string;
    } 
  }>('/customer-insights', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const limit = request.query.limit ? parseInt(request.query.limit) : 10;
      const days = request.query.days ? parseInt(request.query.days) : 30;
      
      const insights = await analyticsService.getCustomerInsights(decoded.tenantId, limit, days);
      
      return {
        success: true,
        data: insights,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customer insights',
      });
    }
  });

  // Get dashboard summary
  fastify.get('/dashboard-summary', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const summary = await analyticsService.getDashboardSummary(decoded.tenantId);
      
      return {
        success: true,
        summary,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard summary',
      });
    }
  });

  // Export sales report to Excel
  fastify.get<{ 
    Querystring: { 
      period?: 'daily' | 'weekly' | 'monthly'; 
      days?: string;
      format?: 'xlsx' | 'csv';
    } 
  }>('/export/sales', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const period = request.query.period || 'daily';
      const days = request.query.days ? parseInt(request.query.days) : 30;
      const format = request.query.format || 'xlsx';
      
      const trends = await analyticsService.getSalesTrends(decoded.tenantId, period, days);
      
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');
      
      // Add headers
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Revenue', key: 'revenue', width: 15 },
        { header: 'Transactions', key: 'count', width: 15 },
      ];
      
      // Add data
      (trends as any).trends.forEach((trend: any) => {
        worksheet.addRow(trend);
      });
      
      // Add summary
      worksheet.addRow({});
      worksheet.addRow({
        date: 'SUMMARY',
        revenue: (trends as any).summary.totalRevenue,
        count: (trends as any).summary.totalTransactions,
      });
      
      // Style headers
      worksheet.getRow(1).font = { bold: true };
      
      if (format === 'csv') {
        // Export as CSV
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', 'attachment; filename="sales-report.csv"');
        return workbook.csv.writeBuffer();
      } else {
        // Export as Excel
        reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        reply.header('Content-Disposition', 'attachment; filename="sales-report.xlsx"');
        return workbook.xlsx.writeBuffer();
      }
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export sales report',
      });
    }
  });

  // Export products report to Excel
  fastify.get<{ 
    Querystring: { 
      format?: 'xlsx' | 'csv';
    } 
  }>('/export/products', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const format = request.query.format || 'xlsx';
      
      const products = await analyticsService.getTopProducts(decoded.tenantId, 'revenue', 100, 30);
      
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Products Report');
      
      // Add headers
      worksheet.columns = [
        { header: 'Product Name', key: 'name', width: 30 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Quantity Sold', key: 'quantity', width: 15 },
        { header: 'Revenue', key: 'revenue', width: 15 },
        { header: 'Transactions', key: 'transactionCount', width: 15 },
      ];
      
      // Add data
      products.forEach(item => {
        worksheet.addRow({
          name: item.product.name,
          sku: item.product.sku || '-',
          quantity: item.quantity,
          revenue: item.revenue,
          transactionCount: item.transactionCount,
        });
      });
      
      // Style headers
      worksheet.getRow(1).font = { bold: true };
      
      if (format === 'csv') {
        // Export as CSV
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', 'attachment; filename="products-report.csv"');
        return workbook.csv.writeBuffer();
      } else {
        // Export as Excel
        reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        reply.header('Content-Disposition', 'attachment; filename="products-report.xlsx"');
        return workbook.xlsx.writeBuffer();
      }
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export products report',
      });
    }
  });
}
