// Payment Gateway Routes (MOCK - Test Mode)
// Created: 2026-02-23 - Day 7 Integration

import { FastifyInstance } from 'fastify';
import { PaymentService } from '../services/payment.service';

const paymentService = new PaymentService();

export async function paymentRoutes(server: FastifyInstance) {
  // Process payment with Stripe
  server.post('/stripe', {
    schema: {
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', minimum: 1 },
          currency: { type: 'string', default: 'ALL' },
          description: { type: 'string' },
          customerId: { type: 'string' },
          metadata: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const payment = await paymentService.processStripePayment(request.body as any);
      
      if (payment.status === 'failed') {
        return reply.status(402).send({
          error: 'Payment failed',
          payment,
        });
      }
      
      return {
        success: true,
        payment,
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Payment processing failed',
        message: error.message,
      });
    }
  });

  // Process payment with PayPal
  server.post('/paypal', {
    schema: {
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', minimum: 1 },
          currency: { type: 'string', default: 'ALL' },
          description: { type: 'string' },
          customerId: { type: 'string' },
          metadata: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const payment = await paymentService.processPayPalPayment(request.body as any);
      
      return {
        success: true,
        payment,
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Payment processing failed',
        message: error.message,
      });
    }
  });

  // Process payment with Square
  server.post('/square', {
    schema: {
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', minimum: 1 },
          currency: { type: 'string', default: 'ALL' },
          description: { type: 'string' },
          customerId: { type: 'string' },
          metadata: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const payment = await paymentService.processSquarePayment(request.body as any);
      
      if (payment.status === 'failed') {
        return reply.status(402).send({
          error: 'Payment failed',
          payment,
        });
      }
      
      return {
        success: true,
        payment,
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Payment processing failed',
        message: error.message,
      });
    }
  });

  // Process refund
  server.post('/refund', {
    schema: {
      body: {
        type: 'object',
        required: ['paymentId'],
        properties: {
          paymentId: { type: 'string' },
          amount: { type: 'number' },
          reason: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const refund = await paymentService.processRefund(request.body as any);
      
      if (refund.status === 'failed') {
        return reply.status(400).send({
          error: 'Refund failed',
          refund,
        });
      }
      
      return {
        success: true,
        refund,
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Refund processing failed',
        message: error.message,
      });
    }
  });

  // Stripe webhook handler
  server.post('/webhooks/stripe', async (request, reply) => {
    try {
      const event = request.body;
      await paymentService.handleWebhook('stripe', event);
      
      return { received: true };
    } catch (error: any) {
      server.log.error(error);
      reply.status(400).send({
        error: 'Webhook processing failed',
        message: error.message,
      });
    }
  });

  // PayPal webhook handler
  server.post('/webhooks/paypal', async (request, reply) => {
    try {
      const event = request.body;
      await paymentService.handleWebhook('paypal', event);
      
      return { received: true };
    } catch (error: any) {
      server.log.error(error);
      reply.status(400).send({
        error: 'Webhook processing failed',
        message: error.message,
      });
    }
  });

  // Square webhook handler
  server.post('/webhooks/square', async (request, reply) => {
    try {
      const event = request.body;
      await paymentService.handleWebhook('square', event);
      
      return { received: true };
    } catch (error: any) {
      server.log.error(error);
      reply.status(400).send({
        error: 'Webhook processing failed',
        message: error.message,
      });
    }
  });

  // Get payment by ID
  server.get('/:paymentId', async (request, reply) => {
    try {
      const { paymentId } = request.params as any;
      const payment = await paymentService.getPayment(paymentId);
      
      return { payment };
    } catch (error: any) {
      server.log.error(error);
      reply.status(404).send({
        error: 'Payment not found',
        message: error.message,
      });
    }
  });

  // List payments
  server.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          gateway: { type: 'string', enum: ['stripe', 'paypal', 'square'] },
          status: { type: 'string', enum: ['succeeded', 'pending', 'failed'] },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          limit: { type: 'number', default: 50 },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const filters = request.query as any;
      const payments = await paymentService.listPayments(filters);
      
      return {
        payments,
        count: payments.length,
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch payments',
        message: error.message,
      });
    }
  });

  // Get payment statistics
  server.get('/stats/overview', async (request, reply) => {
    try {
      const stats = await paymentService.getStatistics();
      
      return { stats };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch statistics',
        message: error.message,
      });
    }
  });

  // Get available payment gateways
  server.get('/gateways/list', async (request, reply) => {
    return {
      gateways: [
        {
          id: 'stripe',
          name: 'Stripe',
          description: 'Modern payment infrastructure',
          enabled: true,
          testMode: true,
          supportedCurrencies: ['ALL', 'EUR', 'USD'],
          features: ['cards', 'wallets', 'bank_transfers'],
        },
        {
          id: 'paypal',
          name: 'PayPal',
          description: 'Global payment platform',
          enabled: true,
          testMode: true,
          supportedCurrencies: ['ALL', 'EUR', 'USD'],
          features: ['paypal_account', 'cards'],
        },
        {
          id: 'square',
          name: 'Square',
          description: 'Payment processing made simple',
          enabled: true,
          testMode: true,
          supportedCurrencies: ['ALL', 'USD'],
          features: ['cards', 'contactless', 'invoicing'],
        },
      ],
    };
  });
}
