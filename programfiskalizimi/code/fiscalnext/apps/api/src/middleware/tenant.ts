/**
 * Tenant Middleware
 * Ensures multi-tenancy by attaching tenantId from JWT to request
 */

import { FastifyRequest, FastifyReply } from 'fastify';

export async function tenantMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // User should already be attached by authMiddleware
  if (!request.user || !request.user.tenantId) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Tenant information missing',
    });
  }

  // Tenant ID is now available via request.user.tenantId
  // Prisma middleware will use this to filter all queries
  request.log.debug({ tenantId: request.user.tenantId }, 'Tenant context set');
}
