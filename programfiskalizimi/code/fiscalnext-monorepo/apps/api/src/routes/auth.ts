// Auth Routes - Authentication & Authorization
import { FastifyInstance } from 'fastify';
import { authService } from '../services/auth.service';
import { registerSchema, loginSchema, RegisterInput, LoginInput } from '../schemas/auth.schema';
import { validate } from '../middleware/validate';

export async function authRoutes(fastify: FastifyInstance) {
  // Register endpoint
  fastify.post<{ Body: RegisterInput }>('/register', {
    preHandler: [validate(registerSchema, 'body')],
  }, async (request, reply) => {
    try {
      const result = await authService.register(request.body);
      
      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: result.user.id,
        tenantId: result.tenant.id,
        email: result.user.email,
      });
      
      return {
        success: true,
        token,
        user: result.user,
        tenant: result.tenant,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  });
  
  // Login endpoint
  fastify.post<{ Body: LoginInput }>('/login', {
    preHandler: [validate(loginSchema, 'body')],
  }, async (request, reply) => {
    try {
      const result = await authService.login(request.body.email, request.body.password);
      
      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: result.user.id,
        tenantId: result.tenant.id,
        email: result.user.email,
        roles: result.user.roles,
        permissions: result.user.permissions,
      });
      
      return {
        success: true,
        token,
        user: result.user,
        tenant: result.tenant,
      };
    } catch (error) {
      reply.status(401).send({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
    }
  });
  
  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const user = await authService.getUserById(decoded.userId);
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          tenant: user.tenant,
        },
      };
    } catch (error) {
      reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }
  });

  // Send email verification
  fastify.post('/send-verification', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const result = await authService.sendVerificationEmail(decoded.userId);
      
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send verification email',
      });
    }
  });

  // Verify email with token
  fastify.post<{ Body: { token: string } }>('/verify-email', async (request, reply) => {
    try {
      const { token } = request.body;
      const result = await authService.verifyEmail(token);
      
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Email verification failed',
      });
    }
  });

  // Request password reset
  fastify.post<{ Body: { email: string } }>('/request-password-reset', async (request, reply) => {
    try {
      const { email } = request.body;
      const result = await authService.requestPasswordReset(email);
      
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      // Always return success for security (don't reveal if email exists)
      return {
        success: true,
        message: 'If an account exists, a reset link has been sent',
      };
    }
  });

  // Reset password with token
  fastify.post<{ Body: { token: string; newPassword: string } }>('/reset-password', async (request, reply) => {
    try {
      const { token, newPassword } = request.body;
      const result = await authService.resetPassword(token, newPassword);
      
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed',
      });
    }
  });

  // Change password (authenticated)
  fastify.post<{ Body: { currentPassword: string; newPassword: string } }>('/change-password', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { currentPassword, newPassword } = request.body;
      const result = await authService.changePassword(decoded.userId, currentPassword, newPassword);
      
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Password change failed',
      });
    }
  });

  // Update user profile
  fastify.put<{ Body: { firstName?: string; lastName?: string; phone?: string; preferences?: Record<string, any> } }>('/profile', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const result = await authService.updateProfile(decoded.userId, request.body);
      
      return {
        success: true,
        user: result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed',
      });
    }
  });
}
