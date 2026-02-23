// Category Routes - Category management
import { FastifyInstance } from 'fastify';
import { categoryService } from '../services/category.service';
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema,
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoriesQuery
} from '../schemas/category.schema';
import { validate } from '../middleware/validate';

export async function categoryRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Create category
  fastify.post<{ Body: CreateCategoryInput }>('/categories', {
    preHandler: [validate(createCategorySchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const body = request.body as any;

      const category = await categoryService.createCategory({
        tenantId: decoded.tenantId,
        ...body,
      });

      return {
        success: true,
        category,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create category',
      });
    }
  });

  // List categories
  fastify.get<{ Querystring: ListCategoriesQuery }>('/categories', {
    preHandler: [validate(listCategoriesQuerySchema, 'query')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const query = request.query;

      const result = await categoryService.listCategories({
        tenantId: decoded.tenantId,
        ...query,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch categories',
      });
    }
  });

  // Get category by ID
  fastify.get<{ Params: { id: string } }>('/categories/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const category = await categoryService.getCategory(request.params.id, decoded.tenantId);

      return {
        success: true,
        category,
      };
    } catch (error) {
      reply.status(404).send({
        success: false,
        error: 'Category not found',
      });
    }
  });

  // Update category
  fastify.put<{ Params: { id: string }; Body: UpdateCategoryInput }>('/categories/:id', {
    preHandler: [validate(updateCategorySchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const body = request.body as any;

      const category = await categoryService.updateCategory(
        request.params.id,
        decoded.tenantId,
        body
      );

      return {
        success: true,
        category,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update category',
      });
    }
  });

  // Delete category
  fastify.delete<{ Params: { id: string } }>('/categories/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const result = await categoryService.deleteCategory(request.params.id, decoded.tenantId);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete category',
      });
    }
  });
}
