// Fiscal Receipts Routes - Day 4 Complete Implementation
import { FastifyInstance } from 'fastify';
import { fiscalReceiptService } from '../services/fiscalReceipt.service';

export async function fiscalReceiptsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // POST /v1/fiscal/receipts - Generate fiscal receipt for transaction
  fastify.post<{
    Body: { transactionId: string; country?: string };
  }>('/receipts', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { transactionId, country } = request.body;

      const fiscalReceipt = await fiscalReceiptService.generateReceipt({
        tenantId: decoded.tenantId,
        transactionId,
        country,
      });

      return {
        success: true,
        fiscalReceipt,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate fiscal receipt',
      });
    }
  });

  // GET /v1/fiscal/receipts - List all fiscal receipts
  fastify.get<{
    Querystring: {
      page?: string;
      limit?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    };
  }>('/receipts', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { page, limit, status, startDate, endDate, search } = request.query;

      const result = await fiscalReceiptService.listReceipts({
        tenantId: decoded.tenantId,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        search,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch fiscal receipts',
      });
    }
  });

  // GET /v1/fiscal/receipts/:id - Get receipt details
  fastify.get<{
    Params: { id: string };
  }>('/receipts/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const receipt = await fiscalReceiptService.getReceipt(
        request.params.id,
        decoded.tenantId
      );

      return {
        success: true,
        receipt,
      };
    } catch (error) {
      reply.status(404).send({
        success: false,
        error: error instanceof Error ? error.message : 'Fiscal receipt not found',
      });
    }
  });

  // POST /v1/fiscal/receipts/:id/verify - Verify receipt with tax authority
  fastify.post<{
    Params: { id: string };
  }>('/receipts/:id/verify', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const result = await fiscalReceiptService.verifyReceipt(
        request.params.id,
        decoded.tenantId
      );

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify receipt',
      });
    }
  });

  // POST /v1/fiscal/receipts/retry-failed - Retry failed submissions
  fastify.post('/receipts/retry-failed', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const results = await fiscalReceiptService.retryFailedSubmissions(decoded.tenantId);

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
