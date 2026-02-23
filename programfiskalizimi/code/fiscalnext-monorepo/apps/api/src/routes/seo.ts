import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  setSeoMetadata,
  getSeoMetadata,
  createRedirect,
  getRedirects,
  updateRedirect,
  deleteRedirect,
  optimizeImage,
  getOptimizedImages,
  generateSitemap,
  generateSchemaMarkup,
  analyzePage,
  bulkUpdateMetadata,
} from '../services/seo.service.js';

const seoRoutes: FastifyPluginAsync = async (fastify) => {
  // Set SEO metadata
  fastify.post('/seo/metadata', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const metadata = await setSeoMetadata(tenantId, request.body);
      return reply.code(201).send(metadata);
    },
  });

  // Get SEO metadata
  fastify.get('/seo/metadata/:entityType/:entityId', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { entityType, entityId } = request.params as { entityType: string; entityId: string };
      const metadata = await getSeoMetadata(tenantId, entityType, entityId);
      return reply.send(metadata);
    },
  });

  // Create 301 redirect
  fastify.post('/seo/redirects', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const redirect = await createRedirect(tenantId, request.body);
      return reply.code(201).send(redirect);
    },
  });

  // Get all redirects
  fastify.get('/seo/redirects', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const redirects = await getRedirects(tenantId, request.query);
      return reply.send(redirects);
    },
  });

  // Update redirect
  fastify.patch('/seo/redirects/:id', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { id } = request.params as { id: string };
      const redirect = await updateRedirect(tenantId, id, request.body);
      return reply.send(redirect);
    },
  });

  // Delete redirect
  fastify.delete('/seo/redirects/:id', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { id } = request.params as { id: string };
      await deleteRedirect(tenantId, id);
      return reply.code(204).send();
    },
  });

  // Optimize image
  fastify.post('/seo/images/optimize', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const optimized = await optimizeImage(tenantId, request.body);
      return reply.code(201).send(optimized);
    },
  });

  // Get optimized images
  fastify.get('/seo/images', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const images = await getOptimizedImages(tenantId, request.query);
      return reply.send(images);
    },
  });

  // Generate XML sitemap
  fastify.get('/seo/sitemap.xml', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const sitemap = await generateSitemap(tenantId);
      return reply
        .header('Content-Type', 'application/xml')
        .send(sitemap);
    },
  });

  // Generate schema markup for entity
  fastify.get('/seo/schema/:entityType/:entityId', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { entityType, entityId } = request.params as { entityType: string; entityId: string };
      const schema = await generateSchemaMarkup(tenantId, entityType, entityId);
      return reply.send(schema);
    },
  });

  // Analyze page SEO
  fastify.post('/seo/analyze', {
    handler: async (request, reply) => {
      const analysis = await analyzePage(request.body.url);
      return reply.send(analysis);
    },
  });

  // Bulk update metadata
  fastify.post('/seo/metadata/bulk', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const results = await bulkUpdateMetadata(tenantId, request.body);
      return reply.send(results);
    },
  });
};

export default seoRoutes;
