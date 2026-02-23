import { FastifyInstance } from 'fastify';
import { forecastService } from '../services/forecast.service';
import { 
  createForecastSchema,
  customerSegmentationSchema,
  abcAnalysisSchema,
  trendAnalysisSchema,
  inventoryOptimizationSchema,
} from '../schemas/forecast.schema';
import { authenticateUser as authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

export default async function forecastRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', authenticate);
  
  // Get forecasts
  fastify.get('/', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { forecastType } = request.query as any;
    
    const forecasts = await forecastService.getForecasts(tenantId, forecastType);
    
    return reply.send(forecasts);
  });
  
  // Create forecast
  fastify.post('/', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const data = request.body as any;
    
    try {
      const forecast = await forecastService.createForecast(tenantId, data);
      return reply.status(201).send(forecast);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // Get customer segments (GET for quick access)
  fastify.get('/customer-segments', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    
    try {
      const result = await forecastService.customerSegmentation(tenantId, {});
      return reply.send({ success: true, data: result });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Customer segmentation (RFM)
  fastify.post('/customer-segmentation', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const data = request.body as any;
    
    try {
      const result = await forecastService.customerSegmentation(tenantId, data);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // Get product ABC analysis (GET for quick access)
  fastify.get('/product-abc', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    
    try {
      const result = await forecastService.abcAnalysis(tenantId, {});
      return reply.send({ success: true, data: result });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // ABC Analysis
  fastify.post('/abc-analysis', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const data = request.body as any;
    
    try {
      const result = await forecastService.abcAnalysis(tenantId, data);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // Trend analysis
  fastify.post('/trend-analysis', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const data = request.body as any;
    
    try {
      const result = await forecastService.trendAnalysis(tenantId, data);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // Inventory optimization
  fastify.post('/inventory-optimization', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const data = request.body as any;
    
    try {
      const result = await forecastService.inventoryOptimization(tenantId, data);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}

