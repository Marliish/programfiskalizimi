// Fiscal Receipts Routes
import { FastifyInstance } from 'fastify';
import { fiscalService } from '../services/fiscal.service';
import { 
  createFiscalReceiptSchema, 
  fiscalReceiptQuerySchema,
  CreateFiscalReceiptInput,
} from '../schemas/fiscal.schema';
import { validate } from '../middleware/validate';

export async function fiscalReceiptsRoutes(fastify: FastifyInstance) {
  // Create fiscal receipt for transaction
  fastify.post<{ Body: CreateFiscalReceiptInput }>('/receipts', {
    preHandler: [fastify.authenticate, validate(createFiscalReceiptSchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const result = await fiscalService.createFiscalReceipt({
        transactionId: request.body.transactionId,
        tenantId: decoded.tenantId,
        country: request.body.country,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create fiscal receipt',
      });
    }
  });

  // Get fiscal receipt by ID
  fastify.get<{ Params: { id: string } }>('/receipts/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const fiscalReceipt = await fiscalService.getFiscalReceiptById(
        request.params.id,
        decoded.tenantId
      );

      return {
        success: true,
        fiscalReceipt,
      };
    } catch (error) {
      reply.status(404).send({
        success: false,
        error: error instanceof Error ? error.message : 'Fiscal receipt not found',
      });
    }
  });

  // List fiscal receipts
  fastify.get('/receipts', {
    preHandler: [fastify.authenticate, validate(fiscalReceiptQuerySchema, 'query')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const query = request.query as any;
      
      const result = await fiscalService.listFiscalReceipts({
        tenantId: decoded.tenantId,
        page: query.page || 1,
        limit: query.limit || 20,
        status: query.status,
        fromDate: query.fromDate,
        toDate: query.toDate,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list fiscal receipts',
      });
    }
  });

  // Verify fiscal receipt with tax authority
  fastify.post<{ Params: { id: string } }>('/receipts/:id/verify', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const result = await fiscalService.verifyFiscalReceipt(
        request.params.id,
        decoded.tenantId
      );

      return result;
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify fiscal receipt',
      });
    }
  });
}
