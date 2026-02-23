// User Management Routes
import { FastifyInstance } from 'fastify';
import { userService } from '../services/user.service';
import { 
  createUserSchema, 
  updateUserSchema,
  assignRolesSchema,
  listUsersQuerySchema,
  CreateUserInput,
  UpdateUserInput,
  AssignRolesInput,
} from '../schemas/user.schema';
import { validate } from '../middleware/validate';

export async function userRoutes(fastify: FastifyInstance) {
  // List users
  fastify.get('/', {
    preHandler: [fastify.authenticate, validate(listUsersQuerySchema, 'query')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const query = request.query as any;
      
      const result = await userService.listUsers({
        tenantId: decoded.tenantId,
        page: query.page || 1,
        limit: query.limit || 20,
        role: query.role,
        isActive: query.isActive,
        search: query.search,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list users',
      });
    }
  });

  // Create user (invite)
  fastify.post<{ Body: CreateUserInput }>('/', {
    preHandler: [fastify.authenticate, validate(createUserSchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      
      const result = await userService.createUser({
        tenantId: decoded.tenantId,
        ...request.body,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      });
    }
  });

  // Update user
  fastify.put<{ Params: { id: string }; Body: UpdateUserInput }>('/:id', {
    preHandler: [fastify.authenticate, validate(updateUserSchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      
      const result = await userService.updateUser({
        userId: request.params.id,
        tenantId: decoded.tenantId,
        ...request.body,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
      });
    }
  });

  // Deactivate user
  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      
      const result = await userService.deactivateUser(
        request.params.id,
        decoded.tenantId
      );

      return result;
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate user',
      });
    }
  });

  // Assign roles to user
  fastify.put<{ Params: { id: string }; Body: AssignRolesInput }>('/:id/roles', {
    preHandler: [fastify.authenticate, validate(assignRolesSchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      
      const result = await userService.assignRoles({
        userId: request.params.id,
        tenantId: decoded.tenantId,
        roleIds: request.body.roleIds,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign roles',
      });
    }
  });
}
