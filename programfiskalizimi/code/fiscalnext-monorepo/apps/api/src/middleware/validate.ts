// Validation Middleware
import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';

export function validate<T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request[source];
      const validated = schema.parse(data);
      
      // Replace request data with validated data
      (request as any)[source] = validated;
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      return reply.status(400).send({
        success: false,
        error: 'Invalid request data',
      });
    }
  };
}
