import { PrismaClient } from '@fiscalnext/database';
import { MultipartFile } from '@fastify/multipart';

const prisma = new PrismaClient();

export async function createReview(tenantId: string, data: any) {
  // Check if customer has purchased the product
  const purchase = await prisma.transactionItem.findFirst({
    where: {
      transaction: {
        tenantId,
        customerId: data.customerId,
      },
      productId: data.productId,
    },
  });

  return await prisma.productReview.create({
    data: {
      tenantId,
      productId: data.productId,
      customerId: data.customerId,
      orderId: data.orderId,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      isVerifiedPurchase: !!purchase,
      status: 'pending',
    },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      product: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
    },
  });
}

export async function getReviews(tenantId: string, filters: any) {
  const { productId, customerId, status, rating, sortBy, order, page, limit } = filters;

  const where: any = { tenantId };
  if (productId) where.productId = productId;
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;
  if (rating) where.rating = rating;

  const orderBy: any = {};
  if (sortBy === 'helpful') {
    orderBy.helpfulCount = order;
  } else {
    orderBy[sortBy || 'createdAt'] = order;
  }

  const [reviews, total] = await Promise.all([
    prisma.productReview.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        media: true,
        response: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.productReview.count({ where }),
  ]);

  return {
    data: reviews,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function getReviewById(tenantId: string, id: string) {
  return await prisma.productReview.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      product: true,
      media: true,
      votes: true,
      response: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function updateReview(tenantId: string, id: string, data: any) {
  return await prisma.productReview.update({
    where: { id },
    data,
  });
}

export async function deleteReview(tenantId: string, id: string) {
  await prisma.productReview.delete({
    where: { id },
  });
}

export async function moderateReview(tenantId: string, id: string, userId: string, status: string) {
  return await prisma.productReview.update({
    where: { id },
    data: {
      status,
      moderatedBy: userId,
      moderatedAt: new Date(),
    },
  });
}

export async function voteReview(reviewId: string, data: any) {
  const { customerId, isHelpful } = data;

  // Check if vote exists
  const existingVote = await prisma.reviewVote.findUnique({
    where: {
      reviewId_customerId: {
        reviewId,
        customerId,
      },
    },
  });

  if (existingVote) {
    // Update existing vote
    await prisma.reviewVote.update({
      where: { id: existingVote.id },
      data: { isHelpful },
    });
  } else {
    // Create new vote
    await prisma.reviewVote.create({
      data: {
        reviewId,
        customerId,
        isHelpful,
      },
    });
  }

  // Update helpful counts
  const counts = await prisma.reviewVote.groupBy({
    by: ['isHelpful'],
    where: { reviewId },
    _count: true,
  });

  const helpfulCount = counts.find(c => c.isHelpful)?._count || 0;
  const notHelpfulCount = counts.find(c => !c.isHelpful)?._count || 0;

  await prisma.productReview.update({
    where: { id: reviewId },
    data: {
      helpfulCount,
      notHelpfulCount,
    },
  });

  return { success: true };
}

export async function respondToReview(tenantId: string, reviewId: string, userId: string, response: string) {
  return await prisma.reviewResponse.create({
    data: {
      reviewId,
      userId,
      response,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function uploadReviewMedia(reviewId: string, file: MultipartFile) {
  // In production, upload to S3/CDN
  const filename = file.filename;
  const mimetype = file.mimetype;

  // Mock URL for now
  const url = `/uploads/reviews/${reviewId}/${filename}`;

  return await prisma.reviewMedia.create({
    data: {
      reviewId,
      type: mimetype.startsWith('video/') ? 'video' : 'photo',
      url,
      mimeType: mimetype,
    },
  });
}

export async function getReviewAnalytics(tenantId: string, filters: any) {
  const { productId, startDate, endDate } = filters;

  const where: any = { tenantId };
  if (productId) where.productId = productId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [
    totalReviews,
    avgRating,
    ratingDistribution,
    recentReviews,
  ] = await Promise.all([
    prisma.productReview.count({ where }),
    prisma.productReview.aggregate({
      where,
      _avg: { rating: true },
    }),
    prisma.productReview.groupBy({
      by: ['rating'],
      where,
      _count: true,
    }),
    prisma.productReview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ]);

  return {
    totalReviews,
    averageRating: avgRating._avg.rating || 0,
    ratingDistribution: Object.fromEntries(
      ratingDistribution.map(r => [r.rating, r._count])
    ),
    recentReviews,
  };
}
