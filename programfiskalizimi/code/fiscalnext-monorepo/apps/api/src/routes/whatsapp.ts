// WhatsApp Routes - Send receipts and messages via WhatsApp
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { whatsappService } from '../services/whatsapp.service';
import { z } from 'zod';

const sendReceiptSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  businessName: z.string().min(1),
  transactionNumber: z.string().min(1),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    total: z.number(),
  })),
  subtotal: z.number(),
  taxAmount: z.number(),
  taxRate: z.number(),
  total: z.number(),
  paymentMethod: z.string(),
  currency: z.string(),
  fiscalCode: z.string().optional(),
});

const sendMessageSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required'),
});

export default async function whatsappRoutes(server: FastifyInstance) {
  // Check if WhatsApp is configured
  server.get(
    '/whatsapp/status',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        success: true,
        enabled: whatsappService.isEnabled(),
        message: whatsappService.isEnabled() 
          ? 'WhatsApp service is configured and ready'
          : 'WhatsApp service not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER in environment.',
      });
    }
  );

  // Send receipt via WhatsApp
  server.post(
    '/whatsapp/send-receipt',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = sendReceiptSchema.parse(request.body);
        
        const result = await whatsappService.sendReceipt(body);
        
        if (result.success) {
          return reply.send({
            success: true,
            messageId: result.messageId,
            message: 'Receipt sent successfully via WhatsApp',
          });
        } else {
          return reply.code(400).send({
            success: false,
            error: result.error,
          });
        }
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({
            success: false,
            error: 'Validation error',
            details: error.errors,
          });
        }
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to send receipt',
        });
      }
    }
  );

  // Send custom message via WhatsApp
  server.post(
    '/whatsapp/send-message',
    {
      preHandler: [server.authenticate as any],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = sendMessageSchema.parse(request.body);
        
        const result = await whatsappService.sendMessage(body.to, body.message);
        
        if (result.success) {
          return reply.send({
            success: true,
            messageId: result.messageId,
            message: 'Message sent successfully via WhatsApp',
          });
        } else {
          return reply.code(400).send({
            success: false,
            error: result.error,
          });
        }
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({
            success: false,
            error: 'Validation error',
            details: error.errors,
          });
        }
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to send message',
        });
      }
    }
  );
}
