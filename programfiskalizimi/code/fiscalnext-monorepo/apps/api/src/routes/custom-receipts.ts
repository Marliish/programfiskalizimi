// Custom Receipts Routes - 8 Features
// Team: Tafa (Backend)
// Date: 2026-02-23

import { FastifyInstance } from 'fastify';
import { prisma } from '@fiscalnext/database';
import QRCode from 'qrcode';

export async function customReceiptsRoutes(fastify: FastifyInstance) {
  // 1. Create receipt template
  fastify.post('/receipt-templates', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const {
        name,
        description,
        templateType,
        logoUrl,
        headerText,
        footerText,
        layoutConfig,
        variables,
        conditionalSections,
        language,
        translations,
        includeQrCode,
        qrCodeType,
        qrCodeData,
        promotionalMessage,
        promotionalPosition,
        isDefault
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        // If setting as default, unset other defaults
        if (isDefault) {
          await prisma.receiptTemplate.updateMany({
            where: { tenantId, isDefault: true },
            data: { isDefault: false }
          });
        }

        const template = await prisma.receiptTemplate.create({
          data: {
            tenantId,
            name,
            description,
            templateType,
            logoUrl,
            headerText,
            footerText,
            layoutConfig: layoutConfig || {},
            variables: variables || [],
            conditionalSections: conditionalSections || [],
            language,
            translations: translations || {},
            includeQrCode,
            qrCodeType,
            qrCodeData,
            promotionalMessage,
            promotionalPosition,
            isDefault: isDefault || false,
            isActive: true
          }
        });

        return reply.status(201).send(template);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to create receipt template' });
      }
    }
  });

  // 2. Get all receipt templates
  fastify.get('/receipt-templates', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;

      try {
        const templates = await prisma.receiptTemplate.findMany({
          where: { tenantId },
          orderBy: [
            { isDefault: 'desc' },
            { name: 'asc' }
          ]
        });

        return reply.send(templates);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch receipt templates' });
      }
    }
  });

  // 3. Get default receipt template
  fastify.get('/receipt-templates/default', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;

      try {
        let template = await prisma.receiptTemplate.findFirst({
          where: { tenantId, isDefault: true, isActive: true }
        });

        // If no default, return first active template
        if (!template) {
          template = await prisma.receiptTemplate.findFirst({
            where: { tenantId, isActive: true }
          });
        }

        if (!template) {
          return reply.status(404).send({ error: 'No receipt template found' });
        }

        return reply.send(template);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch default template' });
      }
    }
  });

  // 4. Update receipt template
  fastify.put('/receipt-templates/:id', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const {
        name,
        description,
        templateType,
        logoUrl,
        headerText,
        footerText,
        layoutConfig,
        variables,
        conditionalSections,
        language,
        translations,
        includeQrCode,
        qrCodeType,
        qrCodeData,
        promotionalMessage,
        promotionalPosition,
        isDefault,
        isActive
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const existing = await prisma.receiptTemplate.findUnique({
          where: { id }
        });

        if (!existing || existing.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Receipt template not found' });
        }

        // If setting as default, unset other defaults
        if (isDefault) {
          await prisma.receiptTemplate.updateMany({
            where: { tenantId, isDefault: true, id: { not: id } },
            data: { isDefault: false }
          });
        }

        const template = await prisma.receiptTemplate.update({
          where: { id },
          data: {
            name,
            description,
            templateType,
            logoUrl,
            headerText,
            footerText,
            layoutConfig,
            variables,
            conditionalSections,
            language,
            translations,
            includeQrCode,
            qrCodeType,
            qrCodeData,
            promotionalMessage,
            promotionalPosition,
            isDefault,
            isActive
          }
        });

        return reply.send(template);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to update receipt template' });
      }
    }
  });

  // 5. Delete receipt template
  fastify.delete('/receipt-templates/:id', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const template = await prisma.receiptTemplate.findUnique({
          where: { id }
        });

        if (!template || template.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Receipt template not found' });
        }

        if (template.isDefault) {
          return reply.status(400).send({ error: 'Cannot delete default template' });
        }

        await prisma.receiptTemplate.delete({
          where: { id }
        });

        return reply.send({ message: 'Receipt template deleted successfully' });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to delete receipt template' });
      }
    }
  });

  // 6. Generate receipt preview
  fastify.post('/receipt-templates/:id/preview', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const { sampleData } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const template = await prisma.receiptTemplate.findUnique({
          where: { id }
        });

        if (!template || template.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Receipt template not found' });
        }

        // Generate QR code if enabled
        let qrCodeImage = null;
        if (template.includeQrCode && template.qrCodeData) {
          qrCodeImage = await QRCode.toDataURL(template.qrCodeData);
        }

        // Build receipt preview
        const preview = {
          template,
          qrCodeImage,
          sampleData,
          renderedReceipt: {
            header: template.headerText || '',
            logo: template.logoUrl || null,
            items: sampleData?.items || [],
            subtotal: sampleData?.subtotal || 0,
            tax: sampleData?.tax || 0,
            total: sampleData?.total || 0,
            paymentMethod: sampleData?.paymentMethod || 'Cash',
            footer: template.footerText || '',
            promotional: template.promotionalMessage || null,
            qrCode: qrCodeImage
          }
        };

        return reply.send(preview);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to generate preview' });
      }
    }
  });

  // 7. Render receipt for transaction
  fastify.get('/receipt-templates/render/:transactionId', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { transactionId } = request.params as any;
      const { templateId, language } = request.query as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId },
          include: {
            items: true,
            splitPayments: true,
            customer: true,
            location: true,
            user: true
          }
        });

        if (!transaction || transaction.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Transaction not found' });
        }

        // Get template
        let template;
        if (templateId) {
          template = await prisma.receiptTemplate.findUnique({
            where: { id: templateId }
          });
        } else {
          template = await prisma.receiptTemplate.findFirst({
            where: { tenantId, isDefault: true, isActive: true }
          });
        }

        if (!template) {
          return reply.status(404).send({ error: 'No receipt template found' });
        }

        // Generate QR code
        let qrCodeImage = null;
        if (template.includeQrCode) {
          const qrData = template.qrCodeData
            ?.replace('{transactionId}', transaction.id)
            ?.replace('{transactionNumber}', transaction.transactionNumber);
          qrCodeImage = await QRCode.toDataURL(qrData || transaction.transactionNumber);
        }

        // Get translations if language specified
        const translations: any = language && template.translations
          ? (template.translations as any)[language] || {}
          : {};

        // Build receipt
        const receipt = {
          template: {
            name: template.name,
            type: template.templateType,
            logo: template.logoUrl,
            header: template.headerText,
            footer: template.footerText,
            promotional: template.promotionalMessage,
            promotionalPosition: template.promotionalPosition
          },
          transaction: {
            number: transaction.transactionNumber,
            date: transaction.createdAt,
            location: transaction.location?.name || '',
            cashier: `${transaction.user.firstName} ${transaction.user.lastName}`
          },
          customer: transaction.customer ? {
            name: transaction.customer.name,
            email: transaction.customer.email,
            phone: transaction.customer.phone
          } : null,
          items: transaction.items.map((item: any) => ({
            name: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          })),
          payments: transaction.splitPayments.map((p: any) => ({
            method: p.paymentMethod,
            amount: p.amount
          })),
          totals: {
            subtotal: transaction.subtotal,
            tax: transaction.taxAmount,
            discount: transaction.discountAmount,
            total: transaction.total
          },
          qrCode: qrCodeImage,
          translations
        };

        return reply.send(receipt);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to render receipt' });
      }
    }
  });

  // 8. Duplicate receipt template
  fastify.post('/receipt-templates/:id/duplicate', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const { newName } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const original = await prisma.receiptTemplate.findUnique({
          where: { id }
        });

        if (!original || original.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Receipt template not found' });
        }

        const duplicate = await prisma.receiptTemplate.create({
          data: {
            tenantId,
            name: newName || `${original.name} (Copy)`,
            description: original.description,
            templateType: original.templateType,
            logoUrl: original.logoUrl,
            headerText: original.headerText,
            footerText: original.footerText,
            layoutConfig: original.layoutConfig,
            variables: original.variables,
            conditionalSections: original.conditionalSections,
            language: original.language,
            translations: original.translations,
            includeQrCode: original.includeQrCode,
            qrCodeType: original.qrCodeType,
            qrCodeData: original.qrCodeData,
            promotionalMessage: original.promotionalMessage,
            promotionalPosition: original.promotionalPosition,
            isDefault: false,
            isActive: true
          }
        });

        return reply.status(201).send(duplicate);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to duplicate receipt template' });
      }
    }
  });
}
