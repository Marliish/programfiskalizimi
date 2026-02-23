// Surveys Routes
// Customer feedback and surveys
// Created: 2026-02-23 - Day 13 Marketing Features

import { FastifyInstance } from 'fastify';
import { surveyService } from '../services/survey.service';

export async function surveysRoutes(server: FastifyInstance) {
  // Get all surveys
  server.get('/', async (request, reply) => {
    try {
      const { status } = request.query as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await surveyService.getSurveys(tenantId, { status });
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch surveys', message: error.message });
    }
  });

  // Create survey
  server.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['title', 'questions'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['question', 'questionType'],
              properties: {
                question: { type: 'string' },
                questionType: {
                  type: 'string',
                  enum: ['text', 'multiple_choice', 'rating', 'yes_no'],
                },
                options: { type: 'array', items: { type: 'string' } },
                required: { type: 'boolean' },
              },
            },
          },
          distributionMethod: { type: 'string' },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const tenantId = (request as any).tenantId || 'tenant_1';
      const survey = await surveyService.createSurvey(tenantId, request.body as any);

      return { success: true, survey };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to create survey', message: error.message });
    }
  });

  // Get survey details
  server.get('/:surveyId', async (request, reply) => {
    try {
      const { surveyId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const survey = await surveyService.getSurveyDetails(tenantId, surveyId);
      return survey;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch survey', message: error.message });
    }
  });

  // Submit survey response
  server.post('/:surveyId/responses', {
    schema: {
      body: {
        type: 'object',
        required: ['answers'],
        properties: {
          customerId: { type: 'string' },
          isAnonymous: { type: 'boolean' },
          answers: {
            type: 'array',
            items: {
              type: 'object',
              required: ['questionId', 'answer'],
              properties: {
                questionId: { type: 'string' },
                answer: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { surveyId } = request.params as any;
      const body = request.body as any;

      const result = await surveyService.submitResponse({
        surveyId,
        ...body,
      });

      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to submit response', message: error.message });
    }
  });

  // Get survey results
  server.get('/:surveyId/results', async (request, reply) => {
    try {
      const { surveyId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const results = await surveyService.getSurveyResults(tenantId, surveyId);
      return results;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch results', message: error.message });
    }
  });

  // Publish survey
  server.post('/:surveyId/publish', async (request, reply) => {
    try {
      const { surveyId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await surveyService.publishSurvey(tenantId, surveyId);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to publish survey', message: error.message });
    }
  });

  // Close survey
  server.post('/:surveyId/close', async (request, reply) => {
    try {
      const { surveyId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await surveyService.closeSurvey(tenantId, surveyId);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to close survey', message: error.message });
    }
  });

  // Duplicate survey
  server.post('/:surveyId/duplicate', async (request, reply) => {
    try {
      const { surveyId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const survey = await surveyService.duplicateSurvey(tenantId, surveyId);
      return { success: true, survey };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to duplicate survey', message: error.message });
    }
  });

  // Delete survey
  server.delete('/:surveyId', async (request, reply) => {
    try {
      const { surveyId } = request.params as any;
      const tenantId = (request as any).tenantId || 'tenant_1';

      const result = await surveyService.deleteSurvey(tenantId, surveyId);
      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to delete survey', message: error.message });
    }
  });
}
