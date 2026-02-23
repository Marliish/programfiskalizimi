// Fiscal Routes - Fiscal compliance operations
import { FastifyInstance } from 'fastify';
import { fiscalService } from '../services/fiscal.service';
import { createFiscalReceiptSchema, CreateFiscalReceiptInput } from '../schemas/fiscal.schema';
import { validate } from '../middleware/validate';

export async function fiscalRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Submit fiscal receipt
  fastify.post<{ Body: CreateFiscalReceiptInput }>('/submit', {
    preHandler: [validate(createFiscalReceiptSchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const body = request.body as any;

      const fiscalReceipt = await fiscalService.submitFiscalReceipt({
        tenantId: decoded.tenantId,
        transactionId: body.transactionId,
        country: body.country || decoded.tenant?.country || 'AL',
      });

      return {
        success: true,
        fiscalReceipt,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit fiscal receipt',
      });
    }
  });

  // Get fiscal receipt by transaction ID
  fastify.get<{ Params: { transactionId: string } }>('/receipt/:transactionId', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const receipt = await fiscalService.getFiscalReceipt(
        request.params.transactionId,
        decoded.tenantId
      );

      if (!receipt) {
        return reply.status(404).send({
          success: false,
          error: 'Fiscal receipt not found',
        });
      }

      return {
        success: true,
        receipt,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch fiscal receipt',
      });
    }
  });

  // Retry failed submissions
  fastify.post('/retry-failed', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const results = await fiscalService.retryFailedSubmissions(decoded.tenantId);

      return {
        success: true,
        results,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to retry submissions',
      });
    }
  });
}
