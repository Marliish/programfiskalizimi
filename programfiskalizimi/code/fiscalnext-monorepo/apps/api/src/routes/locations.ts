// Location Routes - Multi-location management
import { FastifyInstance } from 'fastify';
import { locationService } from '../services/location.service';

export async function locationRoutes(fastify: FastifyInstance) {
  // Get all locations
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const locations = await locationService.getLocations(decoded.tenantId);
      
      return {
        success: true,
        locations,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch locations',
      });
    }
  });

  // Get location by ID
  fastify.get<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const location = await locationService.getLocationById(decoded.tenantId, request.params.id);
      
      return {
        success: true,
        location,
      };
    } catch (error) {
      reply.status(404).send({
        success: false,
        error: error instanceof Error ? error.message : 'Location not found',
      });
    }
  });

  // Create location
  fastify.post<{ Body: { name: string; type: string; address?: string; city?: string; phone?: string } }>('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const location = await locationService.createLocation(decoded.tenantId, request.body);
      
      return {
        success: true,
        location,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create location',
      });
    }
  });

  // Update location
  fastify.put<{ Params: { id: string }; Body: { name?: string; type?: string; address?: string; city?: string; phone?: string; isActive?: boolean } }>('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const location = await locationService.updateLocation(decoded.tenantId, request.params.id, request.body);
      
      return {
        success: true,
        location,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update location',
      });
    }
  });

  // Delete location
  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const result = await locationService.deleteLocation(decoded.tenantId, request.params.id);
      
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete location',
      });
    }
  });

  // Get location stock
  fastify.get<{ Params: { id: string } }>('/:id/stock', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const stock = await locationService.getLocationStock(decoded.tenantId, request.params.id);
      
      return {
        success: true,
        stock,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch location stock',
      });
    }
  });
}
