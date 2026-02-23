// Settings Routes - Tenant and user settings management
import { FastifyInstance } from 'fastify';
import { settingsService } from '../services/settings.service';
import {
  updateBusinessSchema,
  updateUserSchema,
  updateSystemSchema,
  UpdateBusinessInput,
  UpdateUserInput,
  UpdateSystemInput,
} from '../schemas/settings.schema';
import { validate } from '../middleware/validate';

export async function settingsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * GET /v1/settings
   * Get all settings (business + user + system)
   */
  fastify.get('/', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const settings = await settingsService.getSettings(decoded.userId, decoded.tenantId);

      return {
        success: true,
        settings,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch settings',
      });
    }
  });

  /**
   * PUT /v1/settings/business
   * Update business profile (tenant)
   */
  fastify.put<{ Body: UpdateBusinessInput }>(
    '/business',
    {
      preHandler: [validate(updateBusinessSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const business = await settingsService.updateBusiness(decoded.tenantId, request.body);

        return {
          success: true,
          business,
        };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update business profile',
        });
      }
    }
  );

  /**
   * PUT /v1/settings/user
   * Update user profile
   */
  fastify.put<{ Body: UpdateUserInput }>(
    '/user',
    {
      preHandler: [validate(updateUserSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const user = await settingsService.updateUser(decoded.userId, request.body);

        return {
          success: true,
          user,
        };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update user profile',
        });
      }
    }
  );

  /**
   * PUT /v1/settings/system
   * Update system settings
   */
  fastify.put<{ Body: UpdateSystemInput }>(
    '/system',
    {
      preHandler: [validate(updateSystemSchema, 'body')],
    },
    async (request, reply) => {
      try {
        const decoded = request.user as any;
        const settings = await settingsService.updateSystem(decoded.tenantId, request.body);

        return {
          success: true,
          system: settings,
        };
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update system settings',
        });
      }
    }
  );
}
