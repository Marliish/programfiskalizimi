/**
 * Authentication Routes
 * Public routes for login, register, password reset, etc.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/auth/auth.service';

export async function authRoutes(fastify: FastifyInstance) {
  // Register new user
  fastify.post('/register', async (request, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      tenantName: z.string().min(1),
    });

    const data = schema.parse(request.body);
    const result = await authService.register(data);

    return reply.status(201).send(result);
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const data = schema.parse(request.body);
    const result = await authService.login(data);

    return reply.send(result);
  });

  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    const schema = z.object({
      refreshToken: z.string(),
    });

    const data = schema.parse(request.body);
    const result = await authService.refreshToken(data.refreshToken);

    return reply.send(result);
  });

  // Request password reset
  fastify.post('/forgot-password', async (request, reply) => {
    const schema = z.object({
      email: z.string().email(),
    });

    const data = schema.parse(request.body);
    await authService.forgotPassword(data.email);

    return reply.send({ message: 'Password reset email sent' });
  });

  // Reset password
  fastify.post('/reset-password', async (request, reply) => {
    const schema = z.object({
      token: z.string(),
      password: z.string().min(8),
    });

    const data = schema.parse(request.body);
    await authService.resetPassword(data.token, data.password);

    return reply.send({ message: 'Password reset successful' });
  });

  // Verify email
  fastify.post('/verify-email', async (request, reply) => {
    const schema = z.object({
      token: z.string(),
    });

    const data = schema.parse(request.body);
    await authService.verifyEmail(data.token);

    return reply.send({ message: 'Email verified successfully' });
  });
}
