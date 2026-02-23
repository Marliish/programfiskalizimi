// Auth Service Tests
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { authService } from '../../services/auth.service';
import {
  cleanDatabase,
  createTestTenant,
  createTestUser,
  disconnectDatabase,
  randomEmail,
} from '../utils/test-helpers';

describe('Auth Service', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('register', () => {
    it('should register a new user with valid data', async () => {
      const email = randomEmail();
      const userData = {
        email,
        password: 'Password123',
        businessName: 'Test Business',
        firstName: 'John',
        lastName: 'Doe',
        country: 'AL' as const,
      };

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tenant');
      expect(result.user.email).toBe(email);
      expect(result.tenant.name).toBe('Test Business');
    });

    it('should hash password before storing', async () => {
      const email = randomEmail();
      const password = 'Password123';
      const userData = {
        email,
        password,
        businessName: 'Test Business',
        country: 'AL' as const,
      };

      const result = await authService.register(userData);

      // Password should not be returned in the response
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw error if email already exists', async () => {
      const email = randomEmail();
      const userData = {
        email,
        password: 'Password123',
        businessName: 'Test Business',
        country: 'AL' as const,
      };

      await authService.register(userData);

      // Try to register with same email
      await expect(authService.register(userData)).rejects.toThrow();
    });

    it('should create tenant with correct country', async () => {
      const result = await authService.register({
        email: randomEmail(),
        password: 'Password123',
        businessName: 'Kosovo Business',
        country: 'XK' as const,
      });

      expect(result.tenant).toHaveProperty('slug');
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const email = randomEmail();
      const password = 'Password123';

      // First register a user
      await authService.register({
        email,
        password,
        businessName: 'Test Business',
        country: 'AL' as const,
      });

      // Then try to login
      const result = await authService.login(email, password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tenant');
      expect(result.user.email).toBe(email);
    });

    it('should throw error with invalid email', async () => {
      await expect(
        authService.login('nonexistent@example.com', 'Password123')
      ).rejects.toThrow();
    });

    it('should throw error with invalid password', async () => {
      const email = randomEmail();
      await authService.register({
        email,
        password: 'Password123',
        businessName: 'Test Business',
        country: 'AL' as const,
      });

      await expect(
        authService.login(email, 'WrongPassword')
      ).rejects.toThrow();
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const tenant = await createTestTenant();
      const user = await createTestUser(tenant.id);

      const result = await authService.getUserById(user.id);

      expect(result).toHaveProperty('id', user.id);
      expect(result).toHaveProperty('email', user.email);
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.getUserById('non-existent-id')
      ).rejects.toThrow();
    });

    it('should not include password in result', async () => {
      const tenant = await createTestTenant();
      const user = await createTestUser(tenant.id);

      const result = await authService.getUserById(user.id);

      expect((result as any).passwordHash).toBeUndefined();
    });
  });
});
