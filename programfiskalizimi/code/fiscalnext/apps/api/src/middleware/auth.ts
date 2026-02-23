/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

import { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthUser {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verify JWT token
    await request.jwtVerify();

    // Token payload is now available in request.user
    const payload = request.user as any;

    // Attach formatted user data
    request.user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  } catch (err) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    });
  }
}

/**
 * Check if user has required permission
 */
export function requirePermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const hasPermission = request.user.permissions.includes(permission);

    if (!hasPermission) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Permission required: ${permission}`,
      });
    }
  };
}

/**
 * Check if user has any of the required roles
 */
export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const hasRole = roles.some((role) => request.user?.roles.includes(role));

    if (!hasRole) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Role required: ${roles.join(' or ')}`,
      });
    }
  };
}
