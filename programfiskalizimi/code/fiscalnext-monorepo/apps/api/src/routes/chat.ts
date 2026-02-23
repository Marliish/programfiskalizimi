import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  createConversation,
  getConversations,
  getConversationById,
  updateConversation,
  sendMessage,
  getMessages,
  markAsRead,
  assignAgent,
  closeConversation,
  createCannedResponse,
  getCannedResponses,
  useCannedResponse,
  uploadFile,
  trackVisitor,
} from '../services/chat.service.js';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  // Create conversation (visitor starts chat)
  fastify.post('/chat/conversations', {
    handler: async (request, reply) => {
      const tenantId = request.user?.tenantId || request.body.tenantId;
      const conversation = await createConversation(tenantId, request.body, request.ip);
      return reply.code(201).send(conversation);
    },
  });

  // Get conversations (agent dashboard)
  fastify.get('/chat/conversations', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const conversations = await getConversations(tenantId, request.query);
      return reply.send(conversations);
    },
  });

  // Get conversation by ID
  fastify.get('/chat/conversations/:id', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { id } = request.params as { id: string };
      const conversation = await getConversationById(tenantId, id);
      return reply.send(conversation);
    },
  });

  // Update conversation
  fastify.patch('/chat/conversations/:id', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { id } = request.params as { id: string };
      const conversation = await updateConversation(tenantId, id, request.body);
      return reply.send(conversation);
    },
  });

  // Assign conversation to agent
  fastify.post('/chat/conversations/:id/assign', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { id } = request.params as { id: string };
      const conversation = await assignAgent(tenantId, id, request.body.agentId);
      return reply.send(conversation);
    },
  });

  // Close conversation
  fastify.post('/chat/conversations/:id/close', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { id } = request.params as { id: string };
      const conversation = await closeConversation(tenantId, id);
      return reply.send(conversation);
    },
  });

  // Send message
  fastify.post('/chat/conversations/:id/messages', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const message = await sendMessage(id, request.body);
      return reply.code(201).send(message);
    },
  });

  // Get messages
  fastify.get('/chat/conversations/:id/messages', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const messages = await getMessages(id, request.query);
      return reply.send(messages);
    },
  });

  // Mark messages as read
  fastify.post('/chat/conversations/:id/read', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      await markAsRead(id);
      return reply.code(204).send();
    },
  });

  // Upload file to chat
  fastify.post('/chat/conversations/:id/upload', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }
      const file = await uploadFile(id, data);
      return reply.code(201).send(file);
    },
  });

  // Create canned response
  fastify.post('/chat/canned-responses', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const userId = request.user.id;
      const response = await createCannedResponse(tenantId, userId, request.body);
      return reply.code(201).send(response);
    },
  });

  // Get canned responses
  fastify.get('/chat/canned-responses', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const userId = request.user.id;
      const responses = await getCannedResponses(tenantId, userId, request.query);
      return reply.send(responses);
    },
  });

  // Use canned response
  fastify.post('/chat/canned-responses/:id/use', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      await useCannedResponse(id);
      return reply.code(204).send();
    },
  });

  // Track visitor
  fastify.post('/chat/track-visitor', {
    handler: async (request, reply) => {
      const tenantId = request.user?.tenantId || request.body.tenantId;
      await trackVisitor(tenantId, request.body, request.ip, request.headers['user-agent']);
      return reply.code(204).send();
    },
  });
};

export default chatRoutes;
