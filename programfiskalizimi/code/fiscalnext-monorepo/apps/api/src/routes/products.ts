// Product Routes - Product & Inventory management
import { FastifyInstance } from 'fastify';
import { productService } from '../services/product.service';
import { 
  createProductSchema, 
  updateProductSchema, 
  adjustStockSchema,
  listProductsQuerySchema,
  CreateProductInput,
  UpdateProductInput,
  AdjustStockInput,
  ListProductsQuery
} from '../schemas/product.schema';
import { validate } from '../middleware/validate';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export async function productRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), 'uploads', 'products');
  await mkdir(uploadDir, { recursive: true });

  // Upload product image
  fastify.post<{ Params: { id: string } }>('/products/:id/image', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'No file uploaded',
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed',
        });
      }

      // Generate unique filename
      const ext = data.mimetype.split('/')[1];
      const filename = `${randomUUID()}.${ext}`;
      const filepath = path.join(uploadDir, filename);

      // Save file
      await pipeline(data.file, createWriteStream(filepath));

      // Update product with image URL
      const imageUrl = `/uploads/products/${filename}`;
      const product = await productService.updateProduct(
        request.params.id,
        decoded.tenantId,
        { imageUrl }
      );

      return {
        success: true,
        imageUrl,
        product,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image',
      });
    }
  });

  // Create product
  fastify.post<{ Body: CreateProductInput }>('/products', {
    preHandler: [validate(createProductSchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const body = request.body as any;

      const product = await productService.createProduct({
        tenantId: decoded.tenantId,
        ...body,
      });

      return {
        success: true,
        product,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create product',
      });
    }
  });

  // List products
  fastify.get<{ Querystring: ListProductsQuery }>('/products', {
    preHandler: [validate(listProductsQuerySchema, 'query')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const query = request.query;

      const result = await productService.listProducts({
        tenantId: decoded.tenantId,
        page: query.page,
        limit: query.limit,
        search: query.search,
        categoryId: query.categoryId,
        isActive: query.isActive,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch products',
      });
    }
  });

  // Get product by ID
  fastify.get<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const product = await productService.getProduct(request.params.id, decoded.tenantId);

      return {
        success: true,
        product,
      };
    } catch (error) {
      reply.status(404).send({
        success: false,
        error: 'Product not found',
      });
    }
  });

  // Update product
  fastify.put<{ Params: { id: string }; Body: UpdateProductInput }>('/products/:id', {
    preHandler: [validate(updateProductSchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const body = request.body as any;

      const product = await productService.updateProduct(
        request.params.id,
        decoded.tenantId,
        body
      );

      return {
        success: true,
        product,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product',
      });
    }
  });

  // Delete product
  fastify.delete<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const result = await productService.deleteProduct(request.params.id, decoded.tenantId);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete product',
      });
    }
  });

  // Get product stock
  fastify.get<{ Params: { id: string } }>('/products/:id/stock', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const stock = await productService.getProductStock(request.params.id, decoded.tenantId);

      return {
        success: true,
        data: stock,
      };
    } catch (error) {
      reply.status(404).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stock',
      });
    }
  });

  // Adjust stock via product ID
  fastify.put<{ Params: { id: string }; Body: { quantity: number; type: 'in' | 'out' | 'adjustment'; locationId?: string; notes?: string } }>('/products/:id/stock', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const body = request.body as any;

      const result = await productService.adjustStock({
        tenantId: decoded.tenantId,
        userId: decoded.userId,
        productId: request.params.id,
        ...body,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to adjust stock',
      });
    }
  });

  // Adjust stock (legacy endpoint)
  fastify.post<{ Body: AdjustStockInput }>('/stock/adjust', {
    preHandler: [validate(adjustStockSchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const body = request.body as any;

      const result = await productService.adjustStock({
        tenantId: decoded.tenantId,
        userId: decoded.userId,
        ...body,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to adjust stock',
      });
    }
  });
}
