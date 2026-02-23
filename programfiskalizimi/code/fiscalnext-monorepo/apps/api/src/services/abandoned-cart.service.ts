import { PrismaClient } from '@fiscalnext/database';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export async function saveCart(tenantId: string, data: any) {
  const recoveryToken = randomBytes(32).toString('hex');

  return await prisma.savedCart.create({
    data: {
      tenantId,
      customerId: data.customerId,
      sessionId: data.sessionId,
      name: data.name,
      cartData: data.cartData,
      recoveryToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });
}

export async function getCart(tenantId: string | undefined, id: string) {
  const where: any = { id };
  if (tenantId) where.tenantId = tenantId;

  return await prisma.savedCart.findFirst({
    where,
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

export async function restoreCart(token: string) {
  const cart = await prisma.savedCart.findUnique({
    where: { recoveryToken: token },
  });

  if (!cart) {
    throw new Error('Invalid or expired recovery token');
  }

  return cart;
}

export async function markAbandoned(id: string) {
  return await prisma.savedCart.update({
    where: { id },
    data: {
      isAbandoned: true,
      abandonedAt: new Date(),
    },
  });
}

export async function createRecovery(tenantId: string, data: any) {
  const cart = await prisma.savedCart.findUnique({
    where: { id: data.cartId },
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  const cartValue = calculateCartValue(cart.cartData);
  const itemCount = calculateItemCount(cart.cartData);

  return await prisma.abandonedCartRecovery.create({
    data: {
      tenantId,
      cartId: data.cartId,
      customerId: data.customerId,
      customerEmail: data.customerEmail,
      cartValue,
      itemCount,
      status: 'active',
    },
  });
}

export async function sendRecoveryEmail(recoveryId: string, templateId?: string) {
  const recovery = await prisma.abandonedCartRecovery.findUnique({
    where: { id: recoveryId },
    include: {
      cart: true,
      customer: true,
    },
  });

  if (!recovery) {
    throw new Error('Recovery not found');
  }

  // TODO: Send email using email service
  console.log(`Sending recovery email to ${recovery.customerEmail}`);

  await prisma.abandonedCartRecovery.update({
    where: { id: recoveryId },
    data: {
      emailsSent: {
        increment: 1,
      },
      lastContactAt: new Date(),
    },
  });

  await prisma.savedCart.update({
    where: { id: recovery.cartId },
    data: {
      recoveryEmailSent: true,
    },
  });
}

export async function sendRecoverySMS(recoveryId: string, message: string) {
  const recovery = await prisma.abandonedCartRecovery.findUnique({
    where: { id: recoveryId },
    include: {
      customer: true,
    },
  });

  if (!recovery) {
    throw new Error('Recovery not found');
  }

  // TODO: Send SMS using Twilio
  console.log(`Sending SMS to ${recovery.customer?.phone}: ${message}`);

  await prisma.abandonedCartRecovery.update({
    where: { id: recoveryId },
    data: {
      smsSent: {
        increment: 1,
      },
      lastContactAt: new Date(),
    },
  });
}

export async function createDiscountIncentive(recoveryId: string, data: any) {
  const discountCode = `CART${randomBytes(4).toString('hex').toUpperCase()}`;

  return await prisma.abandonedCartRecovery.update({
    where: { id: recoveryId },
    data: {
      discountCode,
      discountAmount: data.discountAmount,
      discountType: data.discountType,
    },
  });
}

export async function getRecoveryAnalytics(tenantId: string, filters: any) {
  const where: any = { tenantId };

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  const [
    totalAbandoned,
    totalRecovered,
    totalValue,
    recoveredValue,
    avgCartValue,
  ] = await Promise.all([
    prisma.abandonedCartRecovery.count({ where }),
    prisma.abandonedCartRecovery.count({
      where: { ...where, status: 'recovered' },
    }),
    prisma.abandonedCartRecovery.aggregate({
      where,
      _sum: { cartValue: true },
    }),
    prisma.abandonedCartRecovery.aggregate({
      where: { ...where, status: 'recovered' },
      _sum: { cartValue: true },
    }),
    prisma.abandonedCartRecovery.aggregate({
      where,
      _avg: { cartValue: true },
    }),
  ]);

  const recoveryRate = totalAbandoned > 0
    ? (totalRecovered / totalAbandoned) * 100
    : 0;

  return {
    totalAbandoned,
    totalRecovered,
    recoveryRate: recoveryRate.toFixed(2) + '%',
    totalValue: totalValue._sum.cartValue || 0,
    recoveredValue: recoveredValue._sum.cartValue || 0,
    avgCartValue: avgCartValue._avg.cartValue || 0,
  };
}

export async function processRecoveries(tenantId: string) {
  // Get active recoveries
  const recoveries = await prisma.abandonedCartRecovery.findMany({
    where: {
      tenantId,
      status: 'active',
    },
    include: {
      cart: true,
    },
  });

  const results = {
    processed: 0,
    emailsSent: 0,
    smsSent: 0,
  };

  for (const recovery of recoveries) {
    const hoursSinceAbandonment = Math.floor(
      (Date.now() - (recovery.cart.abandonedAt?.getTime() || 0)) / (1000 * 60 * 60)
    );

    // Email sequence: 1h, 24h, 72h
    if (hoursSinceAbandonment >= 1 && recovery.sequenceStep === 0) {
      await sendRecoveryEmail(recovery.id);
      await prisma.abandonedCartRecovery.update({
        where: { id: recovery.id },
        data: { sequenceStep: 1 },
      });
      results.emailsSent++;
    } else if (hoursSinceAbandonment >= 24 && recovery.sequenceStep === 1) {
      await sendRecoveryEmail(recovery.id);
      await prisma.abandonedCartRecovery.update({
        where: { id: recovery.id },
        data: { sequenceStep: 2 },
      });
      results.emailsSent++;
    } else if (hoursSinceAbandonment >= 72 && recovery.sequenceStep === 2) {
      await sendRecoveryEmail(recovery.id);
      await prisma.abandonedCartRecovery.update({
        where: { id: recovery.id },
        data: { sequenceStep: 3 },
      });
      results.emailsSent++;
    }

    results.processed++;
  }

  return results;
}

function calculateCartValue(cartData: any): number {
  // Parse cart data and calculate total
  if (Array.isArray(cartData.items)) {
    return cartData.items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);
  }
  return 0;
}

function calculateItemCount(cartData: any): number {
  if (Array.isArray(cartData.items)) {
    return cartData.items.reduce((sum: number, item: any) => {
      return sum + item.quantity;
    }, 0);
  }
  return 0;
}
