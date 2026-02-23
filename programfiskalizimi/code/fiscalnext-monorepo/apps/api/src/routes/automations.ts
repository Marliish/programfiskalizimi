import { FastifyInstance } from 'fastify';
import { automationService } from '../services/automation.service';
import { 
  createAutomationSchema, 
  updateAutomationSchema,
  testAutomationSchema,
} from '../schemas/automation.schema';
import { authenticateUser as authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

export default async function automationRoutes(fastify: FastifyInstance) {

  // Get automation templates
  fastify.get("/templates", async (request: any, reply: any) => {
    const templates = [
      { id: "low-stock-alert", name: "Low Stock Alert", description: "Send email when product stock is low", trigger: "low_stock", action: "email" },
      { id: "new-customer-welcome", name: "New Customer Welcome", description: "Send welcome email to new customers", trigger: "new_customer", action: "email" },
      { id: "high-sales-notification", name: "High Sales Alert", description: "Notify when daily sales exceed threshold", trigger: "high_sales", action: "notification" },
      { id: "auto-reorder", name: "Auto Reorder", description: "Automatically create purchase orders for low stock", trigger: "low_stock", action: "webhook" }
    ];
    return reply.send({ success: true, data: templates });
  });
  // All routes require authentication
  fastify.addHook('onRequest', authenticate);
  
  // Get all automations
  fastify.get('/', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { enabled } = request.query as any;
    
    const filterEnabled = enabled === 'true' ? true : enabled === 'false' ? false : undefined;
    
    const automations = await automationService.getAutomations(tenantId, filterEnabled);
    
    return reply.send(automations);
  });
  
  // Get automation by ID
  fastify.get('/:id', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    
    try {
      const automation = await automationService.getAutomation(tenantId, id);
      return reply.send(automation);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Create automation
  fastify.post('/', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const data = request.body as any;
    
    const automation = await automationService.createAutomation(tenantId, data);
    
    return reply.status(201).send(automation);
  });
  
  // Update automation
  fastify.patch('/:id', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    const data = request.body as any;
    
    try {
      const automation = await automationService.updateAutomation(tenantId, id, data);
      return reply.send(automation);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Delete automation
  fastify.delete('/:id', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    
    try {
      await automationService.deleteAutomation(tenantId, id);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Toggle automation on/off
  fastify.post('/:id/toggle', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    const { isEnabled } = request.body as { isEnabled: boolean };
    
    try {
      const automation = await automationService.toggleAutomation(tenantId, id, isEnabled);
      return reply.send(automation);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Test automation
  fastify.post('/:id/test', {
  }, async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    const { testData } = request.body as any;
    
    try {
      const result = await automationService.testAutomation(tenantId, id, testData);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // Get automation logs
  fastify.get('/:id/logs', async (request: any, reply: any) => {
    const { tenantId } = request.user!;
    const { id } = request.params as { id: string };
    const { limit } = request.query as any;
    
    try {
      const logs = await automationService.getAutomationLogs(
        tenantId, 
        id, 
        limit ? parseInt(limit) : 50
      );
      return reply.send(logs);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Get automation templates
  fastify.get('/templates/list', async (request: any, reply: any) => {
    const templates = [
      {
        id: 'low-stock-email',
        name: 'Low Stock Email Alert',
        description: 'Send email when product stock is low',
        triggerType: 'low_stock',
        triggerConfig: {
          threshold: 10,
        },
        actions: [
          {
            type: 'email',
            config: {
              to: ['manager@example.com'],
              subject: 'Low Stock Alert: {{productName}}',
              body: 'Product {{productName}} is running low. Current stock: {{quantity}}, Threshold: {{threshold}}',
            },
          },
        ],
      },
      {
        id: 'high-sales-notification',
        name: 'High Sales Notification',
        description: 'Notify when sales exceed threshold',
        triggerType: 'high_sales',
        triggerConfig: {
          amount: 10000,
          period: 'day',
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: 'High Sales Alert',
              message: 'Daily sales have reached {{salesTotal}}!',
              priority: 'high',
            },
          },
        ],
      },
      {
        id: 'new-customer-welcome',
        name: 'New Customer Welcome',
        description: 'Send welcome email to new customers',
        triggerType: 'new_customer',
        triggerConfig: {},
        actions: [
          {
            type: 'email',
            config: {
              to: ['{{customerEmail}}'],
              subject: 'Welcome to our store!',
              body: 'Thank you for shopping with us, {{customerName}}!',
            },
          },
        ],
      },
      {
        id: 'daily-report',
        name: 'Daily Sales Report',
        description: 'Send daily sales summary every evening',
        triggerType: 'time_based',
        triggerConfig: {
          schedule: '0 18 * * *', // 6 PM every day
        },
        actions: [
          {
            type: 'email',
            config: {
              to: ['manager@example.com'],
              subject: 'Daily Sales Report',
              body: 'Here is your daily sales summary.',
              template: 'daily_sales_report',
            },
          },
        ],
      },
    ];
    
    return reply.send(templates);
  });
}

