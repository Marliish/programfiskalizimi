import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  createWishlist,
  getWishlists,
  getWishlistById,
  updateWishlist,
  deleteWishlist,
  addWishlistItem,
  removeWishlistItem,
  updateWishlistItem,
  shareWishlist,
  checkPriceDrops,
} from '../services/wishlist.service.js';

const wishlistsRoutes: FastifyPluginAsync = async (fastify) => {
  // Create wishlist
  fastify.post('/wishlists', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const wishlist = await createWishlist(tenantId, request.body);
      return reply.code(201).send(wishlist);
    },
  });

  // Get customer's wishlists
  fastify.get('/wishlists', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const wishlists = await getWishlists(tenantId, request.query.customerId);
      return reply.send(wishlists);
    },
  });

  // Get wishlist by ID
  fastify.get('/wishlists/:id', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { id } = request.params as { id: string };
      const wishlist = await getWishlistById(tenantId, id);
      return reply.send(wishlist);
    },
  });

  // Get shared wishlist (public)
  fastify.get('/wishlists/shared/:token', {
    handler: async (request, reply) => {
      const { token } = request.params as { token: string };
      const wishlist = await shareWishlist(token);
      return reply.send(wishlist);
    },
  });

  // Update wishlist
  fastify.patch('/wishlists/:id', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { id } = request.params as { id: string };
      const wishlist = await updateWishlist(tenantId, id, request.body);
      return reply.send(wishlist);
    },
  });

  // Delete wishlist
  fastify.delete('/wishlists/:id', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { id } = request.params as { id: string };
      await deleteWishlist(tenantId, id);
      return reply.code(204).send();
    },
  });

  // Add item to wishlist
  fastify.post('/wishlists/:id/items', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const item = await addWishlistItem(id, request.body);
      return reply.code(201).send(item);
    },
  });

  // Update wishlist item
  fastify.patch('/wishlists/:id/items/:itemId', {
    handler: async (request, reply) => {
      const { itemId } = request.params as { itemId: string };
      const item = await updateWishlistItem(itemId, request.body);
      return reply.send(item);
    },
  });

  // Remove item from wishlist
  fastify.delete('/wishlists/:id/items/:itemId', {
    handler: async (request, reply) => {
      const { itemId } = request.params as { itemId: string };
      await removeWishlistItem(itemId);
      return reply.code(204).send();
    },
  });

  // Check price drops
  fastify.post('/wishlists/check-price-drops', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const results = await checkPriceDrops(tenantId);
      return reply.send(results);
    },
  });
};

export default wishlistsRoutes;
