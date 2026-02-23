import { PrismaClient } from '@fiscalnext/database';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export async function createWishlist(tenantId: string, data: any) {
  const shareToken = data.isPublic ? randomBytes(16).toString('hex') : null;

  return await prisma.wishlist.create({
    data: {
      tenantId,
      customerId: data.customerId,
      name: data.name,
      description: data.description,
      isDefault: data.isDefault,
      isPublic: data.isPublic,
      shareToken,
    },
  });
}

export async function getWishlists(tenantId: string, customerId: string) {
  return await prisma.wishlist.findMany({
    where: {
      tenantId,
      customerId,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              sellingPrice: true,
              isActive: true,
            },
          },
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

export async function getWishlistById(tenantId: string, id: string) {
  return await prisma.wishlist.findFirst({
    where: { id, tenantId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      customer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function shareWishlist(token: string) {
  return await prisma.wishlist.findFirst({
    where: {
      shareToken: token,
      isPublic: true,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function updateWishlist(tenantId: string, id: string, data: any) {
  return await prisma.wishlist.update({
    where: { id },
    data,
  });
}

export async function deleteWishlist(tenantId: string, id: string) {
  await prisma.wishlist.delete({
    where: { id },
  });
}

export async function addWishlistItem(wishlistId: string, data: any) {
  // Get current product price
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { sellingPrice: true },
  });

  return await prisma.wishlistItem.create({
    data: {
      wishlistId,
      productId: data.productId,
      quantity: data.quantity,
      priority: data.priority,
      notes: data.notes,
      originalPrice: product?.sellingPrice,
      currentPrice: product?.sellingPrice,
      priceDropAlert: data.priceDropAlert,
    },
    include: {
      product: true,
    },
  });
}

export async function updateWishlistItem(itemId: string, data: any) {
  return await prisma.wishlistItem.update({
    where: { id: itemId },
    data,
  });
}

export async function removeWishlistItem(itemId: string) {
  await prisma.wishlistItem.delete({
    where: { id: itemId },
  });
}

export async function checkPriceDrops(tenantId: string) {
  // Get all wishlist items with price drop alerts
  const items = await prisma.wishlistItem.findMany({
    where: {
      priceDropAlert: true,
      wishlist: {
        tenantId,
      },
    },
    include: {
      product: true,
      wishlist: {
        include: {
          customer: {
            select: {
              email: true,
              firstName: true,
            },
          },
        },
      },
    },
  });

  const priceDrops: any[] = [];

  for (const item of items) {
    const currentPrice = item.product.sellingPrice;
    const originalPrice = item.originalPrice;

    if (originalPrice && currentPrice < originalPrice) {
      priceDrops.push({
        item,
        originalPrice,
        currentPrice,
        discount: originalPrice.minus(currentPrice),
        discountPercentage: ((originalPrice.minus(currentPrice).toNumber() / originalPrice.toNumber()) * 100).toFixed(2),
      });

      // Update current price
      await prisma.wishlistItem.update({
        where: { id: item.id },
        data: { currentPrice },
      });

      // TODO: Send email notification
    }
  }

  return {
    checked: items.length,
    priceDrops: priceDrops.length,
    items: priceDrops,
  };
}
