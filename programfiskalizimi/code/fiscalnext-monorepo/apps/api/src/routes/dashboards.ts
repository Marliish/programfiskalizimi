import { FastifyInstance } from 'fastify';
import { dashboardService } from '../services/dashboard.service';
import { 
  createDashboardSchema, 
  updateDashboardSchema,
  createWidgetSchema,
  updateWidgetSchema,
} from '../schemas/dashboard.schema';
import { authenticateUser } from '../middleware/auth';

export default async function dashboardRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', async (request: any, reply: any) => {
    await authenticateUser(request, reply);
  });
  
  // Get all dashboards
  fastify.get('/', async (request: any, reply) => {
    const { tenantId, userId } = request.user;
    const { includeTemplates } = request.query as any;
    
    const dashboards = await dashboardService.getDashboards(
      tenantId, 
      userId,
      includeTemplates === 'true'
    );
    
    return reply.send(dashboards);
  });
  
  // Get dashboard by ID
  fastify.get('/:id', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    
    try {
      const dashboard = await dashboardService.getDashboard(tenantId, id);
      return reply.send(dashboard);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Create dashboard
  fastify.post('/', {
  }, async (request: any, reply: any) => {
    const { tenantId, userId } = request.user!;
    const data = request.body as any;
    
    const dashboard = await dashboardService.createDashboard(tenantId, userId, data);
    
    return reply.status(201).send(dashboard);
  });
  
  // Update dashboard
  fastify.patch('/:id', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    const data = request.body as any;
    
    try {
      const dashboard = await dashboardService.updateDashboard(tenantId, id, data);
      return reply.send(dashboard);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Delete dashboard
  fastify.delete('/:id', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    
    try {
      await dashboardService.deleteDashboard(tenantId, id);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Add widget to dashboard
  fastify.post('/:id/widgets', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    const widget = request.body as any;
    
    try {
      const newWidget = await dashboardService.addWidget(tenantId, id, widget);
      return reply.status(201).send(newWidget);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Update widget
  fastify.patch('/widgets/:widgetId', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { widgetId } = request.params as { widgetId: string };
    const data = request.body as any;
    
    try {
      const widget = await dashboardService.updateWidget(tenantId, widgetId, data);
      return reply.send(widget);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Delete widget
  fastify.delete('/widgets/:widgetId', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { widgetId } = request.params as { widgetId: string };
    
    try {
      await dashboardService.deleteWidget(tenantId, widgetId);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Get widget data (real-time)
  fastify.get('/widgets/:widgetId/data', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { widgetId } = request.params as { widgetId: string };
    
    try {
      const data = await dashboardService.getWidgetData(tenantId, widgetId);
      return reply.send(data);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Clone template
  fastify.post('/templates/:templateId/clone', async (request: any, reply: any) => {
    const { tenantId, userId } = request.user!;
    const { templateId } = request.params as { templateId: string };
    const { name } = request.body as { name: string };
    
    try {
      const dashboard = await dashboardService.cloneTemplate(tenantId, userId, templateId, name);
      return reply.status(201).send(dashboard);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Export dashboard
  fastify.get('/:id/export', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    
    try {
      const exportData = await dashboardService.exportDashboard(tenantId, id);
      return reply.send(exportData);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Import dashboard
  fastify.post('/import', async (request: any, reply: any) => {
    const { tenantId, userId } = request.user!;
    const importData = request.body as any;
    
    try {
      const dashboard = await dashboardService.importDashboard(tenantId, userId, importData);
      return reply.status(201).send(dashboard);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
}

