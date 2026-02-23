/**
 * Global Error Handler
 * Handles all errors and sends appropriate responses
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error
  request.log.error({
    err: error,
    reqId: request.id,
    url: request.url,
    method: request.method,
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  // JWT errors
  if (error.name === 'UnauthorizedError' || error.statusCode === 401) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }

  // Forbidden
  if (error.statusCode === 403) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'You do not have permission to access this resource',
    });
  }

  // Not found
  if (error.statusCode === 404) {
    return reply.status(404).send({
      error: 'Not Found',
      message: 'The requested resource was not found',
    });
  }

  // Rate limiting
  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }

  // Database errors
  if (error.name === 'PrismaClientKnownRequestError') {
    return reply.status(400).send({
      error: 'Database Error',
      message: 'An error occurred while processing your request',
    });
  }

  // Default server error
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500
      ? 'An unexpected error occurred'
      : error.message || 'Internal Server Error';

  return reply.status(statusCode).send({
    error: error.name || 'Internal Server Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}
