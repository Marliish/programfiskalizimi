import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  moderateReview,
  voteReview,
  respondToReview,
  uploadReviewMedia,
  getReviewAnalytics,
} from '../services/review.service.js';

const reviewsRoutes: FastifyPluginAsync = async (fastify) => {
  // Create review
  fastify.post('/reviews', {
    schema: {
      body: z.object({
        productId: z.string().uuid(),
        customerId: z.string().uuid(),
        orderId: z.string().uuid().optional(),
        rating: z.number().int().min(1).max(5),
        title: z.string().optional(),
        comment: z.string().optional(),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const review = await createReview(tenantId, request.body);
      return reply.code(201).send(review);
    },
  });

  // Get reviews (with filters)
  fastify.get('/reviews', {
    schema: {
      querystring: z.object({
        productId: z.string().uuid().optional(),
        customerId: z.string().uuid().optional(),
        status: z.enum(['pending', 'approved', 'rejected']).optional(),
        rating: z.number().int().min(1).max(5).optional(),
        sortBy: z.enum(['createdAt', 'rating', 'helpful']).optional().default('createdAt'),
        order: z.enum(['asc', 'desc']).optional().default('desc'),
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(20),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const reviews = await getReviews(tenantId, request.query);
      return reply.send(reviews);
    },
  });

  // Get single review
  fastify.get('/reviews/:id', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { id } = request.params as { id: string };
      const review = await getReviewById(tenantId, id);
      return reply.send(review);
    },
  });

  // Update review
  fastify.patch('/reviews/:id', {
    schema: {
      body: z.object({
        rating: z.number().int().min(1).max(5).optional(),
        title: z.string().optional(),
        comment: z.string().optional(),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { id } = request.params as { id: string };
      const review = await updateReview(tenantId, id, request.body);
      return reply.send(review);
    },
  });

  // Delete review
  fastify.delete('/reviews/:id', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { id } = request.params as { id: string };
      await deleteReview(tenantId, id);
      return reply.code(204).send();
    },
  });

  // Moderate review
  fastify.post('/reviews/:id/moderate', {
    schema: {
      body: z.object({
        status: z.enum(['approved', 'rejected']),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const userId = request.user.id;
      const { id } = request.params as { id: string };
      const review = await moderateReview(tenantId, id, userId, request.body.status);
      return reply.send(review);
    },
  });

  // Vote on review (helpful/not helpful)
  fastify.post('/reviews/:id/vote', {
    schema: {
      body: z.object({
        customerId: z.string().uuid(),
        isHelpful: z.boolean(),
      }),
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const vote = await voteReview(id, request.body);
      return reply.send(vote);
    },
  });

  // Respond to review
  fastify.post('/reviews/:id/respond', {
    schema: {
      body: z.object({
        response: z.string().min(1),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const userId = request.user.id;
      const { id } = request.params as { id: string };
      const response = await respondToReview(tenantId, id, userId, request.body.response);
      return reply.code(201).send(response);
    },
  });

  // Upload review media
  fastify.post('/reviews/:id/media', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }
      const media = await uploadReviewMedia(id, data);
      return reply.code(201).send(media);
    },
  });

  // Get review analytics
  fastify.get('/reviews/analytics', {
    schema: {
      querystring: z.object({
        productId: z.string().uuid().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const analytics = await getReviewAnalytics(tenantId, request.query);
      return reply.send(analytics);
    },
  });
};

export default reviewsRoutes;
