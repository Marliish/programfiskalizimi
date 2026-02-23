import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fiscalnext/database';

// Validation Schemas
const onboardingTaskSchema = z.object({
  employeeId: z.string().uuid(),
  taskName: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  sortOrder: z.number().default(0),
});

const trainingModuleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().optional(),
  materials: z.any().optional(),
  requiresCertification: z.boolean().default(false),
  passingScore: z.number().min(0).max(100).optional(),
});

const trainingEnrollmentSchema = z.object({
  trainingModuleId: z.string().uuid(),
  employeeId: z.string().uuid(),
});

const enrollmentProgressSchema = z.object({
  status: z.enum(['enrolled', 'in_progress', 'completed', 'failed']),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

const performanceReviewSchema = z.object({
  employeeId: z.string().uuid(),
  reviewPeriodStart: z.string(),
  reviewPeriodEnd: z.string(),
  reviewerName: z.string().min(1),
  reviewerTitle: z.string().optional(),
  performanceRating: z.number().min(1).max(5).optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  teamworkRating: z.number().min(1).max(5).optional(),
  strengths: z.string().optional(),
  areasForImprovement: z.string().optional(),
  goals: z.string().optional(),
  comments: z.string().optional(),
});

const timeOffRequestSchema = z.object({
  employeeId: z.string().uuid(),
  type: z.enum(['vacation', 'sick_leave', 'personal', 'unpaid']),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number().positive(),
  reason: z.string().optional(),
});

const employeeDocumentSchema = z.object({
  employeeId: z.string().uuid(),
  documentType: z.string().min(1),
  documentName: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
});

const hrRoutes: FastifyPluginAsync = async (fastify) => {
  // ========================================
  // ONBOARDING
  // ========================================

  // Get onboarding checklist for employee
  fastify.get('/employees/:employeeId/onboarding', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { employeeId } = request.params as { employeeId: string };
    
    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId, deletedAt: null },
    });
    
    if (!employee) {
      return reply.status(404).send({ error: 'Employee not found' });
    }
    
    const tasks = await prisma.onboardingChecklist.findMany({
      where: { employeeId },
      orderBy: { sortOrder: 'asc' },
    });
    
    return { tasks };
  });

  // Create onboarding task
  fastify.post('/onboarding', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId, userId } = request.user as any;
    const data = onboardingTaskSchema.parse(request.body);
    
    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId, deletedAt: null },
    });
    
    if (!employee) {
      return reply.status(404).send({ error: 'Employee not found' });
    }
    
    const task = await prisma.onboardingChecklist.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        taskName: data.taskName,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        sortOrder: data.sortOrder,
      },
    });
    
    return reply.status(201).send({ task });
  });

  // Complete onboarding task
  fastify.post('/onboarding/:id/complete', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId, userId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const task = await prisma.onboardingChecklist.findFirst({
      where: { id, tenantId },
    });
    
    if (!task) {
      return reply.status(404).send({ error: 'Onboarding task not found' });
    }
    
    const updated = await prisma.onboardingChecklist.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        completedBy: userId,
      },
    });
    
    return { task: updated };
  });

  // Delete onboarding task
  fastify.delete('/onboarding/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const task = await prisma.onboardingChecklist.findFirst({
      where: { id, tenantId },
    });
    
    if (!task) {
      return reply.status(404).send({ error: 'Onboarding task not found' });
    }
    
    await prisma.onboardingChecklist.delete({ where: { id } });
    
    return { success: true };
  });

  // ========================================
  // TRAINING
  // ========================================

  // List training modules
  fastify.get('/training/modules', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { isActive } = request.query as any;
    
    const where: any = { tenantId };
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const modules = await prisma.trainingModule.findMany({
      where,
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { modules };
  });

  // Get single training module
  fastify.get('/training/modules/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const module = await prisma.trainingModule.findFirst({
      where: { id, tenantId },
      include: {
        enrollments: {
          include: {
            employee: true,
          },
        },
      },
    });
    
    if (!module) {
      return reply.status(404).send({ error: 'Training module not found' });
    }
    
    return { module };
  });

  // Create training module
  fastify.post('/training/modules', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const data = trainingModuleSchema.parse(request.body);
    
    const module = await prisma.trainingModule.create({
      data: {
        ...data,
        tenantId,
      },
    });
    
    return reply.status(201).send({ module });
  });

  // Update training module
  fastify.put('/training/modules/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const data = trainingModuleSchema.partial().parse(request.body);
    
    const module = await prisma.trainingModule.findFirst({
      where: { id, tenantId },
    });
    
    if (!module) {
      return reply.status(404).send({ error: 'Training module not found' });
    }
    
    const updated = await prisma.trainingModule.update({
      where: { id },
      data,
    });
    
    return { module: updated };
  });

  // Enroll employee in training
  fastify.post('/training/enrollments', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const data = trainingEnrollmentSchema.parse(request.body);
    
    // Verify module and employee belong to tenant
    const [module, employee] = await Promise.all([
      prisma.trainingModule.findFirst({
        where: { id: data.trainingModuleId, tenantId },
      }),
      prisma.employee.findFirst({
        where: { id: data.employeeId, tenantId, deletedAt: null },
      }),
    ]);
    
    if (!module) {
      return reply.status(404).send({ error: 'Training module not found' });
    }
    
    if (!employee) {
      return reply.status(404).send({ error: 'Employee not found' });
    }
    
    // Check if already enrolled
    const existing = await prisma.trainingEnrollment.findFirst({
      where: {
        trainingModuleId: data.trainingModuleId,
        employeeId: data.employeeId,
      },
    });
    
    if (existing) {
      return reply.status(400).send({ error: 'Employee already enrolled in this module' });
    }
    
    const enrollment = await prisma.trainingEnrollment.create({
      data: {
        trainingModuleId: data.trainingModuleId,
        employeeId: data.employeeId,
      },
      include: {
        trainingModule: true,
        employee: true,
      },
    });
    
    return reply.status(201).send({ enrollment });
  });

  // Update enrollment progress
  fastify.put('/training/enrollments/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const data = enrollmentProgressSchema.parse(request.body);
    
    // Verify enrollment belongs to tenant
    const enrollment = await prisma.trainingEnrollment.findFirst({
      where: {
        id,
        employee: { tenantId },
      },
    });
    
    if (!enrollment) {
      return reply.status(404).send({ error: 'Training enrollment not found' });
    }
    
    const updateData: any = {
      status: data.status,
      notes: data.notes,
    };
    
    if (data.status === 'in_progress' && !enrollment.startedDate) {
      updateData.startedDate = new Date();
    }
    
    if (data.status === 'completed' || data.status === 'failed') {
      updateData.completedDate = new Date();
      if (data.score !== undefined) {
        updateData.score = data.score;
        
        // Check if certified
        const module = await prisma.trainingModule.findUnique({
          where: { id: enrollment.trainingModuleId },
        });
        
        if (module?.requiresCertification && data.score >= (module.passingScore || 70)) {
          updateData.certified = true;
        }
      }
    }
    
    const updated = await prisma.trainingEnrollment.update({
      where: { id },
      data: updateData,
      include: {
        trainingModule: true,
        employee: true,
      },
    });
    
    return { enrollment: updated };
  });

  // Get employee's training history
  fastify.get('/employees/:employeeId/training', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { employeeId } = request.params as { employeeId: string };
    
    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId, deletedAt: null },
    });
    
    if (!employee) {
      return reply.status(404).send({ error: 'Employee not found' });
    }
    
    const enrollments = await prisma.trainingEnrollment.findMany({
      where: { employeeId },
      include: {
        trainingModule: true,
      },
      orderBy: { enrolledDate: 'desc' },
    });
    
    return { enrollments };
  });

  // ========================================
  // PERFORMANCE REVIEWS
  // ========================================

  // List performance reviews
  fastify.get('/performance-reviews', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { employeeId, status } = request.query as any;
    
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    
    const reviews = await prisma.performanceReview.findMany({
      where,
      include: {
        employee: true,
      },
      orderBy: { reviewPeriodStart: 'desc' },
    });
    
    return { reviews };
  });

  // Get single performance review
  fastify.get('/performance-reviews/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const review = await prisma.performanceReview.findFirst({
      where: { id, tenantId },
      include: {
        employee: true,
      },
    });
    
    if (!review) {
      return reply.status(404).send({ error: 'Performance review not found' });
    }
    
    return { review };
  });

  // Create performance review
  fastify.post('/performance-reviews', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const data = performanceReviewSchema.parse(request.body);
    
    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId, deletedAt: null },
    });
    
    if (!employee) {
      return reply.status(404).send({ error: 'Employee not found' });
    }
    
    // Calculate overall rating if individual ratings provided
    let overallRating = null;
    const ratings = [
      data.performanceRating,
      data.qualityRating,
      data.communicationRating,
      data.teamworkRating,
    ].filter((r) => r !== undefined) as number[];
    
    if (ratings.length > 0) {
      overallRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    }
    
    const review = await prisma.performanceReview.create({
      data: {
        ...data,
        tenantId,
        overallRating,
        reviewPeriodStart: new Date(data.reviewPeriodStart),
        reviewPeriodEnd: new Date(data.reviewPeriodEnd),
      },
      include: {
        employee: true,
      },
    });
    
    return reply.status(201).send({ review });
  });

  // Update performance review (only if draft)
  fastify.put('/performance-reviews/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const data = performanceReviewSchema.partial().parse(request.body);
    
    const review = await prisma.performanceReview.findFirst({
      where: { id, tenantId, status: 'draft' },
    });
    
    if (!review) {
      return reply.status(404).send({ error: 'Performance review not found or already submitted' });
    }
    
    // Recalculate overall rating
    let overallRating = review.overallRating;
    const ratings = [
      data.performanceRating ?? review.performanceRating,
      data.qualityRating ?? review.qualityRating,
      data.communicationRating ?? review.communicationRating,
      data.teamworkRating ?? review.teamworkRating,
    ].filter((r) => r !== null) as number[];
    
    if (ratings.length > 0) {
      overallRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    }
    
    const updated = await prisma.performanceReview.update({
      where: { id },
      data: {
        ...data,
        overallRating,
        reviewPeriodStart: data.reviewPeriodStart
          ? new Date(data.reviewPeriodStart)
          : undefined,
        reviewPeriodEnd: data.reviewPeriodEnd
          ? new Date(data.reviewPeriodEnd)
          : undefined,
      },
      include: {
        employee: true,
      },
    });
    
    return { review: updated };
  });

  // Submit performance review
  fastify.post('/performance-reviews/:id/submit', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const review = await prisma.performanceReview.findFirst({
      where: { id, tenantId, status: 'draft' },
    });
    
    if (!review) {
      return reply.status(404).send({ error: 'Performance review not found or already submitted' });
    }
    
    const updated = await prisma.performanceReview.update({
      where: { id },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
      },
      include: {
        employee: true,
      },
    });
    
    return { review: updated };
  });

  // Employee acknowledges review
  fastify.post('/performance-reviews/:id/acknowledge', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    const { employeeComments } = request.body as { employeeComments?: string };
    
    const review = await prisma.performanceReview.findFirst({
      where: { id, tenantId, status: 'submitted' },
    });
    
    if (!review) {
      return reply.status(404).send({ error: 'Performance review not found or not submitted' });
    }
    
    const updated = await prisma.performanceReview.update({
      where: { id },
      data: {
        status: 'acknowledged',
        employeeComments,
        employeeAcknowledgedAt: new Date(),
      },
      include: {
        employee: true,
      },
    });
    
    return { review: updated };
  });

  // ========================================
  // TIME-OFF REQUESTS
  // ========================================

  // List time-off requests
  fastify.get('/time-off-requests', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { employeeId, status } = request.query as any;
    
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    
    const requests = await prisma.timeOffRequest.findMany({
      where,
      include: {
        employee: true,
      },
      orderBy: { startDate: 'desc' },
    });
    
    return { requests };
  });

  // Get single time-off request
  fastify.get('/time-off-requests/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const timeOffRequest = await prisma.timeOffRequest.findFirst({
      where: { id, tenantId },
      include: {
        employee: true,
      },
    });
    
    if (!timeOffRequest) {
      return reply.status(404).send({ error: 'Time-off request not found' });
    }
    
    return { timeOffRequest };
  });

  // Create time-off request
  fastify.post('/time-off-requests', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const data = timeOffRequestSchema.parse(request.body);
    
    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId, deletedAt: null },
    });
    
    if (!employee) {
      return reply.status(404).send({ error: 'Employee not found' });
    }
    
    // Generate request number
    const count = await prisma.timeOffRequest.count({ where: { tenantId } });
    const requestNumber = `TO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    const timeOffRequest = await prisma.timeOffRequest.create({
      data: {
        ...data,
        requestNumber,
        tenantId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      include: {
        employee: true,
      },
    });
    
    return reply.status(201).send({ timeOffRequest });
  });

  // Approve time-off request
  fastify.post('/time-off-requests/:id/approve', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId, userId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const timeOffRequest = await prisma.timeOffRequest.findFirst({
      where: { id, tenantId, status: 'pending' },
    });
    
    if (!timeOffRequest) {
      return reply.status(404).send({ error: 'Time-off request not found or already processed' });
    }
    
    const updated = await prisma.timeOffRequest.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        employee: true,
      },
    });
    
    return { timeOffRequest: updated };
  });

  // Reject time-off request
  fastify.post('/time-off-requests/:id/reject', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId, userId } = request.user as any;
    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason?: string };
    
    const timeOffRequest = await prisma.timeOffRequest.findFirst({
      where: { id, tenantId, status: 'pending' },
    });
    
    if (!timeOffRequest) {
      return reply.status(404).send({ error: 'Time-off request not found or already processed' });
    }
    
    const updated = await prisma.timeOffRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        employee: true,
      },
    });
    
    return { timeOffRequest: updated };
  });

  // ========================================
  // EMPLOYEE DOCUMENTS
  // ========================================

  // List employee documents
  fastify.get('/employees/:employeeId/documents', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { employeeId } = request.params as { employeeId: string };
    
    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId, deletedAt: null },
    });
    
    if (!employee) {
      return reply.status(404).send({ error: 'Employee not found' });
    }
    
    const documents = await prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
    
    return { documents };
  });

  // Upload employee document
  fastify.post('/employee-documents', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId, userId } = request.user as any;
    const data = employeeDocumentSchema.parse(request.body);
    
    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId, deletedAt: null },
    });
    
    if (!employee) {
      return reply.status(404).send({ error: 'Employee not found' });
    }
    
    const document = await prisma.employeeDocument.create({
      data: {
        ...data,
        tenantId,
        uploadedBy: userId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
    
    return reply.status(201).send({ document });
  });

  // Delete employee document
  fastify.delete('/employee-documents/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { id } = request.params as { id: string };
    
    const document = await prisma.employeeDocument.findFirst({
      where: { id, tenantId },
    });
    
    if (!document) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    
    await prisma.employeeDocument.delete({ where: { id } });
    
    return { success: true };
  });

  // Get expiring documents
  fastify.get('/employee-documents/expiring/list', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { tenantId } = request.user as any;
    const { daysAhead = 30 } = request.query as any;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(daysAhead));
    
    const documents = await prisma.employeeDocument.findMany({
      where: {
        tenantId,
        expiresAt: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        employee: true,
      },
      orderBy: {
        expiresAt: 'asc',
      },
    });
    
    return { documents };
  });
};

export default hrRoutes;
