// Test Utilities and Helpers
import { PrismaClient } from '@fiscalnext/database';
import bcrypt from 'bcrypt';

export const prisma = new PrismaClient();

// Clean up database before/after tests
export async function cleanDatabase() {
  // Delete in order respecting foreign key constraints
  // Delete leaf nodes first (no children), then work up to Tenant
  await prisma.rolePermission.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.fiscalReceipt.deleteMany();
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.location.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  
  // Clean up any other tables that might reference Tenant
  try {
    await prisma.taxSettings.deleteMany();
  } catch (e) {
    // Ignore if table doesn't exist
  }
  try {
    await prisma.stockTransfer.deleteMany();
  } catch (e) {
    // Ignore if table doesn't exist
  }
  try {
    await prisma.analyticsCache.deleteMany();
  } catch (e) {
    // Ignore if table doesn't exist
  }
  
  await prisma.tenant.deleteMany();
}

// Create test tenant
export async function createTestTenant(data?: Partial<any>) {
  const businessName = data?.businessName || 'Test Business';
  const slug = data?.slug || `test-business-${randomString(6).toLowerCase()}`;
  
  return await prisma.tenant.create({
    data: {
      name: businessName,
      slug,
      country: data?.country || 'AL',
      email: data?.email || 'test@example.com',
      phone: data?.phone || '+355123456789',
      address: data?.address || 'Test Address',
      city: data?.city || 'Tirana',
      nipt: data?.nipt || '12345678',
      businessType: data?.businessType || 'retail',
      subscriptionPlan: data?.subscriptionPlan || 'professional',
      subscriptionStatus: data?.subscriptionStatus || 'active',
    },
  });
}

// Create test user
export async function createTestUser(tenantId: string, data?: Partial<any>) {
  const hashedPassword = await bcrypt.hash(data?.password || 'Password123', 10);
  
  return await prisma.user.create({
    data: {
      email: data?.email || `user-${randomString(6)}@test.com`,
      passwordHash: hashedPassword,
      firstName: data?.firstName || 'Test',
      lastName: data?.lastName || 'User',
      tenantId,
      isActive: data?.isActive !== undefined ? data.isActive : true,
    },
  });
}

// Create test role
export async function createTestRole(tenantId: string, name: string) {
  return await prisma.role.create({
    data: {
      name,
      tenantId,
    },
  });
}

// Assign role to user
export async function assignRoleToUser(userId: string, roleId: string) {
  return await prisma.userRole.create({
    data: {
      userId,
      roleId,
    },
  });
}

// Create test category
export async function createTestCategory(tenantId: string, data?: Partial<any>) {
  return await prisma.category.create({
    data: {
      name: data?.name || 'Test Category',
      description: data?.description || 'Test Description',
      icon: data?.icon || '📦',
      color: data?.color || '#3B82F6',
      sortOrder: data?.sortOrder || 0,
      isActive: data?.isActive !== undefined ? data.isActive : true,
      tenantId,
    },
  });
}

// Create test product
export async function createTestProduct(tenantId: string, categoryId: string, data?: Partial<any>) {
  return await prisma.product.create({
    data: {
      name: data?.name || 'Test Product',
      sku: data?.sku || `SKU-${Date.now()}`,
      barcode: data?.barcode || `BAR-${Date.now()}`,
      description: data?.description || 'Test Description',
      price: data?.price || 10.00,
      cost: data?.cost || 5.00,
      stock: data?.stock || 100,
      minStock: data?.minStock || 10,
      unit: data?.unit || 'piece',
      taxRate: data?.taxRate || 20.00,
      categoryId,
      tenantId,
      isActive: data?.isActive !== undefined ? data.isActive : true,
    },
  });
}

// Create test customer
export async function createTestCustomer(tenantId: string, data?: Partial<any>) {
  return await prisma.customer.create({
    data: {
      name: data?.name || 'Test Customer',
      email: data?.email || 'customer@test.com',
      phone: data?.phone || '+355123456789',
      address: data?.address || 'Test Address',
      city: data?.city || 'Tirana',
      nipt: data?.nipt || '12345678',
      loyaltyPoints: data?.loyaltyPoints || 0,
      tenantId,
      isActive: data?.isActive !== undefined ? data.isActive : true,
    },
  });
}

// Create test transaction
export async function createTestTransaction(tenantId: string, userId: string, data?: Partial<any>) {
  return await prisma.transaction.create({
    data: {
      transactionNumber: data?.transactionNumber || `TXN-${Date.now()}`,
      type: data?.type || 'sale',
      subtotal: data?.subtotal || 100.00,
      taxAmount: data?.taxAmount || 20.00,
      discount: data?.discount || 0.00,
      total: data?.total || 120.00,
      paymentMethod: data?.paymentMethod || 'cash',
      status: data?.status || 'completed',
      customerId: data?.customerId,
      userId,
      tenantId,
    },
  });
}

// Create test fiscal receipt
export async function createTestFiscalReceipt(transactionId: string, tenantId: string, data?: Partial<any>) {
  return await prisma.fiscalReceipt.create({
    data: {
      fiscalNumber: data?.fiscalNumber || `FN-${Date.now()}`,
      iic: data?.iic || `IIC-${Date.now()}`,
      dateTime: data?.dateTime || new Date(),
      amount: data?.amount || 120.00,
      taxAmount: data?.taxAmount || 20.00,
      paymentMethod: data?.paymentMethod || 'cash',
      status: data?.status || 'pending',
      qrCodeUrl: data?.qrCodeUrl || 'https://example.com/qr',
      verificationStatus: data?.verificationStatus || 'unverified',
      expiresAt: data?.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      transactionId,
      tenantId,
    },
  });
}

// Generate mock JWT token
export function generateMockToken(userId: string, tenantId: string): string {
  // This is a mock - in real tests, use the actual JWT signing
  return `mock-jwt-token-${userId}-${tenantId}`;
}

// Mock request with authentication
export function createMockAuthRequest(userId: string, tenantId: string) {
  return {
    user: {
      id: userId,
      tenantId,
    },
  };
}

// Wait helper for async operations
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate random string
export function randomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate random email
export function randomEmail(): string {
  return `test-${randomString(8)}@example.com`;
}

// Disconnect prisma after tests
export async function disconnectDatabase() {
  await prisma.$disconnect();
}
