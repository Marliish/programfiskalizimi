// Social Media Routes
// Facebook/Instagram posting and review management
// Created: 2026-02-23 - Day 13 Marketing Features

import { FastifyInstance } from 'fastify';
import { socialMediaService } from '../services/social-media.service';

export async function socialMediaRoutes(server: FastifyInstance) {
  // ============================================
  // SOCIAL POSTS
  // ============================================

  // Get all posts
  server.get('/posts', async (request, reply) => {
    try {
      const { platform, status, limit } = request.query as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await socialMediaService.getPosts(tenantId, {
        platform,
        status,
        limit: limit ? parseInt(limit) : undefined,
      });

      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch posts', message: error.message });
    }
  });

  // Create post
  server.post('/posts', {
    schema: {
      body: {
        type: 'object',
        required: ['platform', 'content'],
        properties: {
          platform: { type: 'string', enum: ['facebook', 'instagram', 'twitter'] },
          content: { type: 'string' },
          mediaUrls: { type: 'array', items: { type: 'string' } },
          scheduledFor: { type: 'string', format: 'date-time' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const tenantId = (request as any).tenantId || 'tenant_1';
      const post = await socialMediaService.createPost(tenantId, request.body as any);

      return { success: true, post };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to create post', message: error.message });
    }
  });

  // Publish post
  server.post('/posts/:postId/publish', async (request, reply) => {
    try {
      const { postId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await socialMediaService.publishPost(tenantId, postId);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to publish post', message: error.message });
    }
  });

  // Schedule post
  server.post('/posts/:postId/schedule', {
    schema: {
      body: {
        type: 'object',
        required: ['scheduledFor'],
        properties: {
          scheduledFor: { type: 'string', format: 'date-time' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { postId } = request.params as any;
      const { scheduledFor } = request.body as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await socialMediaService.schedulePost(
        tenantId,
        postId,
        new Date(scheduledFor)
      );

      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to schedule post', message: error.message });
    }
  });

  // Delete post
  server.delete('/posts/:postId', async (request, reply) => {
    try {
      const { postId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await socialMediaService.deletePost(tenantId, postId);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to delete post', message: error.message });
    }
  });

  // Get post analytics
  server.get('/posts/:postId/analytics', async (request, reply) => {
    try {
      const { postId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const analytics = await socialMediaService.getPostAnalytics(tenantId, postId);
      return analytics;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch analytics', message: error.message });
    }
  });

  // Bulk import posts
  server.post('/posts/bulk', {
    schema: {
      body: {
        type: 'object',
        required: ['posts'],
        properties: {
          posts: {
            type: 'array',
            items: {
              type: 'object',
              required: ['platform', 'content'],
              properties: {
                platform: { type: 'string' },
                content: { type: 'string' },
                mediaUrls: { type: 'array', items: { type: 'string' } },
                scheduledFor: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { posts } = request.body as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await socialMediaService.bulkImportPosts(tenantId, posts);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to import posts', message: error.message });
    }
  });

  // ============================================
  // REVIEWS
  // ============================================

  // Get all reviews
  server.get('/reviews', async (request, reply) => {
    try {
      const { platform, rating, responded } = request.query as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await socialMediaService.getReviews(tenantId, {
        platform,
        rating: rating ? parseInt(rating) : undefined,
        responded: responded !== undefined ? responded === 'true' : undefined,
      });

      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch reviews', message: error.message });
    }
  });

  // Respond to review
  server.post('/reviews/:reviewId/respond', {
    schema: {
      body: {
        type: 'object',
        required: ['responseText'],
        properties: {
          responseText: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { reviewId } = request.params as any;
      const { responseText } = request.body as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await socialMediaService.respondToReview(tenantId, reviewId, responseText);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to respond to review', message: error.message });
    }
  });

  // Get review analytics
  server.get('/reviews/analytics', async (request, reply) => {
    try {
      const tenantId = (request as any).tenantId || 'tenant_1';
      const analytics = await socialMediaService.getReviewAnalytics(tenantId);
      return analytics;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch analytics', message: error.message });
    }
  });

  // ============================================
  // OVERVIEW
  // ============================================

  // Get social media overview
  server.get('/overview', async (request, reply) => {
    try {
      const tenantId = (request as any).tenantId || 'tenant_1';
      const overview = await socialMediaService.getSocialOverview(tenantId);
      return overview;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch overview', message: error.message });
    }
  });
}
