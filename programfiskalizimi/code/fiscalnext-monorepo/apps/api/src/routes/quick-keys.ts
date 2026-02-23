// Quick Keys Routes - 5 Features
// Team: Tafa (Backend)
// Date: 2026-02-23

import { FastifyInstance } from 'fastify';
import { prisma } from '@fiscalnext/database';

export async function quickKeysRoutes(fastify: FastifyInstance) {
  // 1. Create quick key layout
  fastify.post('/quick-key-layouts', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const {
        name,
        description,
        locationId,
        layoutConfig,
        pageCount,
        pages,
        isDefault
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;
      const userId = (request.user as any).userId;

      try {
        // If setting as default, unset other defaults
        if (isDefault) {
          await prisma.quickKeyLayout.updateMany({
            where: { tenantId, isDefault: true },
            data: { isDefault: false }
          });
        }

        const layout = await prisma.quickKeyLayout.create({
          data: {
            tenantId,
            locationId,
            name,
            description,
            layoutConfig: layoutConfig || { gridSize: { rows: 5, cols: 5 } },
            pageCount: pageCount || 1,
            pages,
            isDefault: isDefault || false,
            isActive: true,
            createdBy: userId
          }
        });

        return reply.status(201).send(layout);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to create quick key layout' });
      }
    }
  });

  // 2. Get all layouts
  fastify.get('/quick-key-layouts', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;
      const { locationId } = request.query as any;

      try {
        const layouts = await prisma.quickKeyLayout.findMany({
          where: {
            tenantId,
            ...(locationId ? { locationId } : {}),
            isActive: true
          },
          include: {
            buttons: true,
            location: true
          },
          orderBy: [
            { isDefault: 'desc' },
            { name: 'asc' }
          ]
        });

        return reply.send(layouts);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch quick key layouts' });
      }
    }
  });

  // 3. Get default layout
  fastify.get('/quick-key-layouts/default', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const tenantId = (request.user as any).tenantId;
      const { locationId } = request.query as any;

      try {
        let layout = await prisma.quickKeyLayout.findFirst({
          where: {
            tenantId,
            ...(locationId ? { locationId } : {}),
            isDefault: true,
            isActive: true
          },
          include: {
            buttons: {
              orderBy: [
                { pageNumber: 'asc' },
                { sortOrder: 'asc' }
              ]
            }
          }
        });

        if (!layout) {
          // Return first active layout
          layout = await prisma.quickKeyLayout.findFirst({
            where: {
              tenantId,
              isActive: true
            },
            include: {
              buttons: {
                orderBy: [
                  { pageNumber: 'asc' },
                  { sortOrder: 'asc' }
                ]
              }
            }
          });
        }

        if (!layout) {
          return reply.status(404).send({ error: 'No quick key layout found' });
        }

        return reply.send(layout);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch default layout' });
      }
    }
  });

  // 4. Update layout
  fastify.put('/quick-key-layouts/:id', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const {
        name,
        description,
        locationId,
        layoutConfig,
        pageCount,
        pages,
        isDefault,
        isActive
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const existing = await prisma.quickKeyLayout.findUnique({
          where: { id }
        });

        if (!existing || existing.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Quick key layout not found' });
        }

        // If setting as default, unset other defaults
        if (isDefault) {
          await prisma.quickKeyLayout.updateMany({
            where: { tenantId, isDefault: true, id: { not: id } },
            data: { isDefault: false }
          });
        }

        const layout = await prisma.quickKeyLayout.update({
          where: { id },
          data: {
            name,
            description,
            locationId,
            layoutConfig,
            pageCount,
            pages,
            isDefault,
            isActive
          }
        });

        return reply.send(layout);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to update quick key layout' });
      }
    }
  });

  // 5. Add button to layout
  fastify.post('/quick-key-layouts/:layoutId/buttons', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { layoutId } = request.params as any;
      const {
        pageNumber,
        positionX,
        positionY,
        width,
        height,
        label,
        icon,
        backgroundColor,
        textColor,
        actionType,
        actionData,
        productId,
        categoryId,
        sortOrder
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const layout = await prisma.quickKeyLayout.findUnique({
          where: { id: layoutId }
        });

        if (!layout || layout.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Quick key layout not found' });
        }

        // Check if position is already occupied
        const existing = await prisma.quickKeyButton.findFirst({
          where: {
            layoutId,
            pageNumber: pageNumber || 1,
            positionX,
            positionY
          }
        });

        if (existing) {
          return reply.status(400).send({ error: 'Position already occupied' });
        }

        const button = await prisma.quickKeyButton.create({
          data: {
            layoutId,
            tenantId,
            pageNumber: pageNumber || 1,
            positionX,
            positionY,
            width: width || 1,
            height: height || 1,
            label,
            icon,
            backgroundColor: backgroundColor || '#3B82F6',
            textColor: textColor || '#FFFFFF',
            actionType,
            actionData,
            productId,
            categoryId,
            sortOrder: sortOrder || 0,
            isActive: true
          }
        });

        return reply.status(201).send(button);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to add button' });
      }
    }
  });

  // 6. Update button
  fastify.put('/quick-key-buttons/:id', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const {
        pageNumber,
        positionX,
        positionY,
        width,
        height,
        label,
        icon,
        backgroundColor,
        textColor,
        actionType,
        actionData,
        productId,
        categoryId,
        sortOrder,
        isActive
      } = request.body as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const existing = await prisma.quickKeyButton.findUnique({
          where: { id }
        });

        if (!existing || existing.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Quick key button not found' });
        }

        // If position changed, check if new position is occupied
        if ((positionX !== undefined && positionX !== existing.positionX) ||
            (positionY !== undefined && positionY !== existing.positionY)) {
          const collision = await prisma.quickKeyButton.findFirst({
            where: {
              layoutId: existing.layoutId,
              pageNumber: pageNumber || existing.pageNumber,
              positionX: positionX ?? existing.positionX,
              positionY: positionY ?? existing.positionY,
              id: { not: id }
            }
          });

          if (collision) {
            return reply.status(400).send({ error: 'Position already occupied' });
          }
        }

        const button = await prisma.quickKeyButton.update({
          where: { id },
          data: {
            pageNumber,
            positionX,
            positionY,
            width,
            height,
            label,
            icon,
            backgroundColor,
            textColor,
            actionType,
            actionData,
            productId,
            categoryId,
            sortOrder,
            isActive
          }
        });

        return reply.send(button);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to update button' });
      }
    }
  });

  // 7. Delete button
  fastify.delete('/quick-key-buttons/:id', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const button = await prisma.quickKeyButton.findUnique({
          where: { id }
        });

        if (!button || button.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Quick key button not found' });
        }

        await prisma.quickKeyButton.delete({
          where: { id }
        });

        return reply.send({ message: 'Button deleted successfully' });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to delete button' });
      }
    }
  });

  // 8. Bulk update button positions (drag-drop)
  fastify.post('/quick-key-layouts/:layoutId/buttons/reorder', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { layoutId } = request.params as any;
      const { buttons } = request.body as any;
      // buttons: [{ id, positionX, positionY, pageNumber }]
      const tenantId = (request.user as any).tenantId;

      try {
        const layout = await prisma.quickKeyLayout.findUnique({
          where: { id: layoutId }
        });

        if (!layout || layout.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Quick key layout not found' });
        }

        // Update all buttons
        const updates = [];
        for (const buttonUpdate of buttons) {
          const update = prisma.quickKeyButton.update({
            where: { id: buttonUpdate.id },
            data: {
              positionX: buttonUpdate.positionX,
              positionY: buttonUpdate.positionY,
              pageNumber: buttonUpdate.pageNumber || 1,
              sortOrder: buttonUpdate.sortOrder || 0
            }
          });
          updates.push(update);
        }

        await prisma.$transaction(updates);

        return reply.send({ message: 'Buttons reordered successfully', count: updates.length });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to reorder buttons' });
      }
    }
  });

  // 9. Get buttons for layout
  fastify.get('/quick-key-layouts/:layoutId/buttons', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { layoutId } = request.params as any;
      const { pageNumber } = request.query as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const layout = await prisma.quickKeyLayout.findUnique({
          where: { id: layoutId }
        });

        if (!layout || layout.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Quick key layout not found' });
        }

        const buttons = await prisma.quickKeyButton.findMany({
          where: {
            layoutId,
            ...(pageNumber ? { pageNumber: parseInt(pageNumber) } : {}),
            isActive: true
          },
          include: {
            product: true,
            category: true
          },
          orderBy: [
            { pageNumber: 'asc' },
            { sortOrder: 'asc' }
          ]
        });

        return reply.send(buttons);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch buttons' });
      }
    }
  });

  // 10. Duplicate layout
  fastify.post('/quick-key-layouts/:id/duplicate', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const { newName } = request.body as any;
      const tenantId = (request.user as any).tenantId;
      const userId = (request.user as any).userId;

      try {
        const original = await prisma.quickKeyLayout.findUnique({
          where: { id },
          include: { buttons: true }
        });

        if (!original || original.tenantId !== tenantId) {
          return reply.status(404).send({ error: 'Quick key layout not found' });
        }

        // Create duplicate layout
        const duplicate = await prisma.quickKeyLayout.create({
          data: {
            tenantId,
            locationId: original.locationId,
            name: newName || `${original.name} (Copy)`,
            description: original.description,
            layoutConfig: original.layoutConfig,
            pageCount: original.pageCount,
            pages: original.pages,
            isDefault: false,
            isActive: true,
            createdBy: userId
          }
        });

        // Duplicate all buttons
        for (const button of original.buttons) {
          await prisma.quickKeyButton.create({
            data: {
              layoutId: duplicate.id,
              tenantId,
              pageNumber: button.pageNumber,
              positionX: button.positionX,
              positionY: button.positionY,
              width: button.width,
              height: button.height,
              label: button.label,
              icon: button.icon,
              backgroundColor: button.backgroundColor,
              textColor: button.textColor,
              actionType: button.actionType,
              actionData: button.actionData,
              productId: button.productId,
              categoryId: button.categoryId,
              sortOrder: button.sortOrder,
              isActive: button.isActive
            }
          });
        }

        return reply.status(201).send(duplicate);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to duplicate layout' });
      }
    }
  });

  // 11. Get button by position
  fastify.get('/quick-key-layouts/:layoutId/buttons/position', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { layoutId } = request.params as any;
      const { pageNumber, positionX, positionY } = request.query as any;
      const tenantId = (request.user as any).tenantId;

      try {
        const button = await prisma.quickKeyButton.findFirst({
          where: {
            layoutId,
            tenantId,
            pageNumber: parseInt(pageNumber) || 1,
            positionX: parseInt(positionX),
            positionY: parseInt(positionY),
            isActive: true
          },
          include: {
            product: true,
            category: true
          }
        });

        if (!button) {
          return reply.status(404).send({ error: 'No button at this position' });
        }

        return reply.send(button);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch button' });
      }
    }
  });
}
