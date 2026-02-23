import { PrismaClient } from '@fiscalnext/database';
import { MultipartFile } from '@fastify/multipart';

const prisma = new PrismaClient();

export async function createConversation(tenantId: string, data: any, ip: string) {
  return await prisma.chatConversation.create({
    data: {
      tenantId,
      customerId: data.customerId,
      visitorName: data.visitorName,
      visitorEmail: data.visitorEmail,
      visitorIp: ip,
      currentUrl: data.currentUrl,
      referrerUrl: data.referrerUrl,
      status: 'open',
    },
  });
}

export async function getConversations(tenantId: string, filters: any) {
  const { status, assignedTo, priority, page, limit } = filters;

  const where: any = { tenantId };
  if (status) where.status = status;
  if (assignedTo) where.assignedTo = assignedTo;
  if (priority) where.priority = priority;

  const [conversations, total] = await Promise.all([
    prisma.chatConversation.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        agent: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    }),
    prisma.chatConversation.count({ where }),
  ]);

  return {
    data: conversations,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function getConversationById(tenantId: string, id: string) {
  return await prisma.chatConversation.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      agent: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });
}

export async function updateConversation(tenantId: string, id: string, data: any) {
  return await prisma.chatConversation.update({
    where: { id },
    data,
  });
}

export async function assignAgent(tenantId: string, id: string, agentId: string) {
  return await prisma.chatConversation.update({
    where: { id },
    data: {
      assignedTo: agentId,
      status: 'active',
    },
  });
}

export async function closeConversation(tenantId: string, id: string) {
  return await prisma.chatConversation.update({
    where: { id },
    data: {
      status: 'closed',
      closedAt: new Date(),
    },
  });
}

export async function sendMessage(conversationId: string, data: any) {
  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId: data.senderId,
      message: data.message,
      isFromAgent: data.isFromAgent,
    },
    include: {
      sender: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Update conversation updated_at
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

export async function getMessages(conversationId: string, filters: any) {
  const { page, limit } = filters;

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.chatMessage.count({ where: { conversationId } }),
  ]);

  return {
    data: messages,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function markAsRead(conversationId: string) {
  await prisma.chatMessage.updateMany({
    where: {
      conversationId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function uploadFile(conversationId: string, file: MultipartFile) {
  // In production, upload to S3/CDN
  const url = `/uploads/chat/${conversationId}/${file.filename}`;

  return await prisma.chatMessage.create({
    data: {
      conversationId,
      message: `File: ${file.filename}`,
      messageType: 'file',
      fileUrl: url,
      fileName: file.filename,
      fileMimeType: file.mimetype,
    },
  });
}

export async function createCannedResponse(tenantId: string, userId: string, data: any) {
  return await prisma.chatCannedResponse.create({
    data: {
      tenantId,
      userId: data.isShared ? null : userId,
      title: data.title,
      message: data.message,
      shortcut: data.shortcut,
      category: data.category,
      isShared: data.isShared,
    },
  });
}

export async function getCannedResponses(tenantId: string, userId: string, filters: any) {
  const where: any = {
    tenantId,
    OR: [
      { isShared: true },
      { userId },
    ],
  };

  if (filters.category) where.category = filters.category;
  if (filters.shortcut) where.shortcut = filters.shortcut;

  return await prisma.chatCannedResponse.findMany({
    where,
    orderBy: { usageCount: 'desc' },
  });
}

export async function useCannedResponse(id: string) {
  await prisma.chatCannedResponse.update({
    where: { id },
    data: {
      usageCount: {
        increment: 1,
      },
    },
  });
}

export async function trackVisitor(tenantId: string, data: any, ip: string, userAgent?: string) {
  // Store visitor tracking data (could be Redis for real-time)
  // For now, just acknowledge
  return { success: true };
}
