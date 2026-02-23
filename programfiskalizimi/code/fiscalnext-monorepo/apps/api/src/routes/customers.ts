// Customer Routes - Customer management
import { FastifyInstance } from 'fastify';
import { customerService } from '../services/customer.service';
import { 
  createCustomerSchema, 
  updateCustomerSchema,
  listCustomersQuerySchema,
  CreateCustomerInput,
  UpdateCustomerInput,
  ListCustomersQuery
} from '../schemas/customer.schema';
import { validate } from '../middleware/validate';

export async function customerRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Create customer
  fastify.post<{ Body: CreateCustomerInput }>('/customers', {
    preHandler: [validate(createCustomerSchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const body = request.body as any;

      const customer = await customerService.createCustomer({
        tenantId: decoded.tenantId,
        ...body,
      });

      return {
        success: true,
        customer,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create customer',
      });
    }
  });

  // List customers
  fastify.get<{ Querystring: ListCustomersQuery }>('/customers', {
    preHandler: [validate(listCustomersQuerySchema, 'query')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const query = request.query;

      const result = await customerService.listCustomers({
        tenantId: decoded.tenantId,
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch customers',
      });
    }
  });

  // Get customer by ID (with transaction history and stats)
  fastify.get<{ Params: { id: string } }>('/customers/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const customer = await customerService.getCustomer(request.params.id, decoded.tenantId);

      return {
        success: true,
        customer,
      };
    } catch (error) {
      reply.status(404).send({
        success: false,
        error: 'Customer not found',
      });
    }
  });

  // Update customer
  fastify.put<{ Params: { id: string }; Body: UpdateCustomerInput }>('/customers/:id', {
    preHandler: [validate(updateCustomerSchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const body = request.body as any;

      const customer = await customerService.updateCustomer(
        request.params.id,
        decoded.tenantId,
        body
      );

      return {
        success: true,
        customer,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update customer',
      });
    }
  });

  // Delete customer
  fastify.delete<{ Params: { id: string } }>('/customers/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const result = await customerService.deleteCustomer(request.params.id, decoded.tenantId);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete customer',
      });
    }
  });
}
