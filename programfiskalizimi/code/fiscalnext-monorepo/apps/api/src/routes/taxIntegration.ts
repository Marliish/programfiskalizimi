// Tax Integration Routes - Albania DGT & Kosovo ATK (MOCK)
import { FastifyInstance } from 'fastify';
import { taxIntegrationService } from '../services/taxIntegration.service';

export async function taxIntegrationRoutes(fastify: FastifyInstance) {
  // Get tax settings
  fastify.get<{ Querystring: { country: 'AL' | 'XK' } }>('/settings', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const country = request.query.country || 'AL';
      
      const settings = await taxIntegrationService.getTaxSettings(decoded.tenantId, country);
      
      // Hide sensitive data
      if (settings) {
        return {
          success: true,
          settings: {
            ...settings,
            dgtPasswordEncrypted: settings.dgtPasswordEncrypted ? '***' : null,
            dgtCertificatePasswordEncrypted: settings.dgtCertificatePasswordEncrypted ? '***' : null,
            atkPasswordEncrypted: settings.atkPasswordEncrypted ? '***' : null,
            atkCertificatePasswordEncrypted: settings.atkCertificatePasswordEncrypted ? '***' : null,
          },
        };
      }

      return {
        success: true,
        settings: null,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tax settings',
      });
    }
  });

  // Update tax settings
  fastify.put<{
    Body: {
      country: 'AL' | 'XK';
      username?: string;
      password?: string;
      certificate?: string;
      certificatePassword?: string;
      testMode?: boolean;
      integrationEnabled?: boolean;
    };
  }>('/settings', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { country, ...data } = request.body;
      
      const settings = await taxIntegrationService.updateTaxSettings(decoded.tenantId, country, data);
      
      return {
        success: true,
        settings: {
          ...settings,
          dgtPasswordEncrypted: settings.dgtPasswordEncrypted ? '***' : null,
          dgtCertificatePasswordEncrypted: settings.dgtCertificatePasswordEncrypted ? '***' : null,
          atkPasswordEncrypted: settings.atkPasswordEncrypted ? '***' : null,
          atkCertificatePasswordEncrypted: settings.atkCertificatePasswordEncrypted ? '***' : null,
        },
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tax settings',
      });
    }
  });

  // Test connection
  fastify.post<{ Body: { country: 'AL' | 'XK' } }>('/test-connection', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { country } = request.body;
      
      const result = await taxIntegrationService.testConnection(decoded.tenantId, country);
      
      return {
        success: true,
        result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      });
    }
  });

  // Generate e-invoice XML
  fastify.post<{ Body: { transactionId: string } }>('/generate-einvoice', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { transactionId } = request.body;
      
      const result = await taxIntegrationService.generateEInvoice(decoded.tenantId, transactionId);
      
      return {
        success: true,
        einvoice: result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate e-invoice',
      });
    }
  });

  // Submit fiscal receipt
  fastify.post<{ Body: { transactionId: string } }>('/submit', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { transactionId } = request.body;
      
      const receipt = await taxIntegrationService.submitFiscalReceipt(decoded.tenantId, transactionId);
      
      return {
        success: true,
        fiscalReceipt: receipt,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit fiscal receipt',
      });
    }
  });

  // Get submission queue
  fastify.get<{ Querystring: { limit?: string } }>('/queue', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const limit = request.query.limit ? parseInt(request.query.limit) : 50;
      
      const queue = await taxIntegrationService.getSubmissionQueue(decoded.tenantId, limit);
      
      return {
        success: true,
        queue,
        count: queue.length,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch submission queue',
      });
    }
  });
}
