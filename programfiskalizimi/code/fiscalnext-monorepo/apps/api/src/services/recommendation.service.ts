import { PrismaClient } from '@fiscalnext/database';

const prisma = new PrismaClient();

export async function getRecommendations(tenantId: string, productId: string, filters: any) {
  const where: any = {
    tenantId,
    productId,
  };

  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.type) where.type = filters.type;

  return await prisma.productRecommendation.findMany({
    where,
    orderBy: { score: 'desc' },
    take: filters.limit,
  });
}

export async function getAIRecommendations(tenantId: string, filters: any) {
  // Get customer's purchase history
  const purchases = await prisma.transactionItem.findMany({
    where: {
      transaction: {
        tenantId,
        customerId: filters.customerId,
      },
    },
    select: {
      productId: true,
    },
    take: 50,
  });

  const purchasedProductIds = purchases.map(p => p.productId);

  // Get recommendations based on context
  return await prisma.productRecommendation.findMany({
    where: {
      tenantId,
      customerId: filters.customerId,
      type: 'ai-based',
      productId: {
        notIn: purchasedProductIds,
      },
    },
    orderBy: { score: 'desc' },
    take: filters.limit,
  });
}

export async function getAlsoBought(tenantId: string, productId: string, limit: number) {
  // Find customers who bought this product
  const customerIds = await prisma.transactionItem.findMany({
    where: {
      productId,
      transaction: { tenantId },
    },
    select: { transaction: { select: { customerId: true } } },
    distinct: ['transactionId'],
  });

  // Find what else they bought
  const alsoProducts = await prisma.transactionItem.findMany({
    where: {
      transaction: {
        tenantId,
        customerId: {
          in: customerIds.map(c => c.transaction.customerId).filter(Boolean) as string[],
        },
      },
      productId: {
        not: productId,
      },
    },
    select: {
      productId: true,
      product: true,
    },
  });

  // Count frequency
  const frequency = new Map();
  alsoProducts.forEach(item => {
    frequency.set(item.productId, (frequency.get(item.productId) || 0) + 1);
  });

  // Sort by frequency
  const sorted = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  return sorted.map(([id, count]) => ({
    productId: id,
    count,
  }));
}

export async function getFrequentlyTogether(tenantId: string, productId: string, limit: number) {
  // Find transactions containing this product
  const transactions = await prisma.transactionItem.findMany({
    where: {
      productId,
      transaction: { tenantId },
    },
    select: {
      transactionId: true,
    },
  });

  const transactionIds = transactions.map(t => t.transactionId);

  // Find other items in same transactions
  const otherItems = await prisma.transactionItem.findMany({
    where: {
      transactionId: {
        in: transactionIds,
      },
      productId: {
        not: productId,
      },
    },
    select: {
      productId: true,
      product: true,
    },
  });

  // Count frequency
  const frequency = new Map();
  otherItems.forEach(item => {
    frequency.set(item.productId, (frequency.get(item.productId) || 0) + 1);
  });

  const sorted = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  return sorted.map(([id, count]) => ({
    productId: id,
    count,
  }));
}

export async function getRecentlyViewed(tenantId: string, customerId: string, limit: number) {
  const views = await prisma.productView.findMany({
    where: {
      tenantId,
      customerId,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      product: true,
    },
    distinct: ['productId'],
  });

  return views.map(v => v.product);
}

export async function getTrending(tenantId: string, filters: any) {
  const { period, limit } = filters;

  const since = new Date();
  switch (period) {
    case '24h':
      since.setHours(since.getHours() - 24);
      break;
    case '7d':
      since.setDate(since.getDate() - 7);
      break;
    case '30d':
      since.setDate(since.getDate() - 30);
      break;
  }

  const trending = await prisma.productView.groupBy({
    by: ['productId'],
    where: {
      tenantId,
      createdAt: {
        gte: since,
      },
    },
    _count: {
      productId: true,
    },
    orderBy: {
      _count: {
        productId: 'desc',
      },
    },
    take: limit,
  });

  const productIds = trending.map(t => t.productId);
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
  });

  return products;
}

export async function getCrossSell(tenantId: string, productId: string, limit: number) {
  // Get product category
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true, sellingPrice: true },
  });

  if (!product) return [];

  // Find complementary products (different category, similar price range)
  return await prisma.product.findMany({
    where: {
      tenantId,
      categoryId: {
        not: product.categoryId,
      },
      sellingPrice: {
        gte: product.sellingPrice.mul(0.5),
        lte: product.sellingPrice.mul(1.5),
      },
      isActive: true,
    },
    take: limit,
  });
}

export async function getUpsell(tenantId: string, productId: string, limit: number) {
  // Get product
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true, sellingPrice: true },
  });

  if (!product) return [];

  // Find higher-priced products in same category
  return await prisma.product.findMany({
    where: {
      tenantId,
      categoryId: product.categoryId,
      sellingPrice: {
        gt: product.sellingPrice,
      },
      isActive: true,
    },
    orderBy: {
      sellingPrice: 'asc',
    },
    take: limit,
  });
}

export async function trackView(tenantId: string, productId: string, data: any) {
  return await prisma.productView.create({
    data: {
      tenantId,
      productId,
      customerId: data.customerId,
      sessionId: data.sessionId,
      viewDuration: data.viewDuration,
      referrer: data.referrer,
      deviceType: data.deviceType,
    },
  });
}

export async function trackClick(recommendationId: string) {
  await prisma.productRecommendation.update({
    where: { id: recommendationId },
    data: {
      clicks: {
        increment: 1,
      },
    },
  });
}

export async function trackConversion(recommendationId: string) {
  await prisma.productRecommendation.update({
    where: { id: recommendationId },
    data: {
      conversions: {
        increment: 1,
      },
    },
  });
}

export async function generatePersonalized(tenantId: string, customerId: string) {
  // Analyze customer behavior
  const [views, purchases] = await Promise.all([
    prisma.productView.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { productId: true },
    }),
    prisma.transactionItem.findMany({
      where: {
        transaction: {
          tenantId,
          customerId,
        },
      },
      select: { productId: true },
    }),
  ]);

  const viewedIds = views.map(v => v.productId);
  const purchasedIds = purchases.map(p => p.productId);

  // Get categories customer is interested in
  const categories = await prisma.product.findMany({
    where: {
      id: {
        in: [...viewedIds, ...purchasedIds],
      },
    },
    select: {
      categoryId: true,
    },
    distinct: ['categoryId'],
  });

  const categoryIds = categories.map(c => c.categoryId).filter(Boolean) as string[];

  // Recommend products from these categories that customer hasn't purchased
  return await prisma.product.findMany({
    where: {
      tenantId,
      categoryId: {
        in: categoryIds,
      },
      id: {
        notIn: purchasedIds,
      },
      isActive: true,
    },
    take: 10,
  });
}

export async function refreshRecommendations(tenantId: string) {
  // This would be a cron job to regenerate recommendations
  // For now, just return success
  return {
    status: 'success',
    message: 'Recommendations refresh initiated',
  };
}
