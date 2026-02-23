import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { supplierService } from '../services/supplierService';

const createSupplierSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  defaultCurrency: z.string().default('EUR'),
  isActive: z.boolean().default(true),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().optional(),
});

const updateSupplierSchema = createSupplierSchema.partial();

const createContactSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

const linkProductSchema = z.object({
  productId: z.string().uuid(),
  supplierSku: z.string().optional(),
  supplierName: z.string().optional(),
  costPrice: z.number().positive().optional(),
  minOrderQty: z.number().positive().default(1),
  leadTimeDays: z.number().int().min(0).default(7),
  isPreferred: z.boolean().default(false),
});

const suppliersRoutes: FastifyPluginAsync = async (server) => {
  // Get all suppliers
  server.get('/', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { isActive, search } = request.query as {
        isActive?: string;
        search?: string;
      };

      const suppliers = await supplierService.getAll(
        request.user.tenantId,
        {
          isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
          search,
        }
      );

      return { success: true, suppliers };
    } catch (error: any) {
      reply.code(500);
      return { error: error.message };
    }
  });

  // Get supplier by ID
  server.get('/:id', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const supplier = await supplierService.getById(id, request.user.tenantId);

      if (!supplier) {
        reply.code(404);
        return { error: 'Supplier not found' };
      }

      return { success: true, supplier };
    } catch (error: any) {
      reply.code(500);
      return { error: error.message };
    }
  });

  // Create supplier
  server.post('/', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const data = createSupplierSchema.parse(request.body);
      
      const supplier = await supplierService.create({
        ...data,
        tenant: {
          connect: { id: request.user.tenantId },
        },
      });

      return { success: true, supplier };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Update supplier
  server.put('/:id', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateSupplierSchema.parse(request.body);

      const supplier = await supplierService.update(id, request.user.tenantId, data);

      return { success: true, supplier };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Delete supplier
  server.delete('/:id', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await supplierService.delete(id, request.user.tenantId);

      return { success: true, message: 'Supplier deleted' };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Add contact to supplier
  server.post('/:id/contacts', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = createContactSchema.parse(request.body);

      const contact = await supplierService.addContact(id, data);

      return { success: true, contact };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Update contact
  server.put('/:id/contacts/:contactId', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { contactId } = request.params as { contactId: string };
      const data = createContactSchema.partial().parse(request.body);

      const contact = await supplierService.updateContact(contactId, data);

      return { success: true, contact };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Delete contact
  server.delete('/:id/contacts/:contactId', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { contactId } = request.params as { contactId: string };
      await supplierService.deleteContact(contactId);

      return { success: true, message: 'Contact deleted' };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Link product to supplier
  server.post('/:id/products', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = linkProductSchema.parse(request.body);

      const supplierProduct = await supplierService.linkProduct(id, data.productId, data);

      return { success: true, supplierProduct };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Unlink product from supplier
  server.delete('/:id/products/:productId', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id, productId } = request.params as { id: string; productId: string };
      await supplierService.unlinkProduct(id, productId);

      return { success: true, message: 'Product unlinked' };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Get supplier metrics
  server.get('/:id/metrics', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const metrics = await supplierService.getMetrics(id, request.user.tenantId);

      return { success: true, metrics };
    } catch (error: any) {
      reply.code(500);
      return { error: error.message };
    }
  });
};

export default suppliersRoutes;
