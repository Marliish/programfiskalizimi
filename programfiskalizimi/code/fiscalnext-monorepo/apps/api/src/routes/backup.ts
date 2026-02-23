// Backup & Restore Routes
// Created: 2026-02-23 - Day 7 Integration

import { FastifyInstance } from 'fastify';
import { BackupService } from '../services/backup.service';

const backupService = new BackupService();

export async function backupRoutes(server: FastifyInstance) {
  // Create new backup
  server.post('/create', {
    schema: {
      body: {
        type: 'object',
        properties: {
          includeUploads: { type: 'boolean', default: false },
          compress: { type: 'boolean', default: true },
          encryption: { type: 'boolean', default: false },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const backup = await backupService.createBackup(request.body as any);

      return {
        success: true,
        backup,
        message: 'Backup created successfully',
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Backup creation failed',
        message: error.message,
      });
    }
  });

  // List all backups
  server.get('/list', async (request, reply) => {
    try {
      const backups = await backupService.listBackups();

      return {
        success: true,
        backups,
        count: backups.length,
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Failed to list backups',
        message: error.message,
      });
    }
  });

  // Get backup statistics
  server.get('/stats', async (request, reply) => {
    try {
      const stats = await backupService.getStatistics();

      return {
        success: true,
        stats,
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch backup statistics',
        message: error.message,
      });
    }
  });

  // Download backup
  server.get('/download/:backupId', async (request, reply) => {
    try {
      const { backupId } = request.params as any;
      const { stream, filename, mimetype } = await backupService.getBackupStream(backupId);

      reply
        .header('Content-Type', mimetype)
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(stream);
    } catch (error: any) {
      server.log.error(error);
      reply.status(404).send({
        error: 'Backup not found',
        message: error.message,
      });
    }
  });

  // Verify backup
  server.post('/verify/:backupId', async (request, reply) => {
    try {
      const { backupId } = request.params as any;
      const isValid = await backupService.verifyBackup(backupId);

      return {
        success: true,
        backupId,
        valid: isValid,
        message: isValid ? 'Backup is valid' : 'Backup verification failed',
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Backup verification failed',
        message: error.message,
      });
    }
  });

  // Restore from backup
  server.post('/restore', {
    schema: {
      body: {
        type: 'object',
        required: ['backupId'],
        properties: {
          backupId: { type: 'string' },
          verifyBeforeRestore: { type: 'boolean', default: true },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const result = await backupService.restoreBackup(request.body as any);

      return {
        success: true,
        result,
        message: 'Restore completed successfully',
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Restore failed',
        message: error.message,
      });
    }
  });

  // Delete backup
  server.delete('/:backupId', async (request, reply) => {
    try {
      const { backupId } = request.params as any;
      const deleted = await backupService.deleteBackup(backupId);

      if (!deleted) {
        return reply.status(404).send({
          error: 'Backup not found',
          backupId,
        });
      }

      return {
        success: true,
        backupId,
        message: 'Backup deleted successfully',
      };
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Failed to delete backup',
        message: error.message,
      });
    }
  });

  // Schedule automatic backups
  server.post('/schedule', {
    schema: {
      body: {
        type: 'object',
        required: ['schedule'],
        properties: {
          schedule: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { schedule } = request.body as any;
      const result = await backupService.scheduleBackup(schedule);

      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Failed to schedule backups',
        message: error.message,
      });
    }
  });

  // Clean old backups
  server.post('/clean', {
    schema: {
      body: {
        type: 'object',
        properties: {
          keepCount: { type: 'number', default: 10 },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { keepCount } = request.body as any;
      const result = await backupService.cleanOldBackups(keepCount);

      return result;
    } catch (error: any) {
      server.log.error(error);
      reply.status(500).send({
        error: 'Failed to clean old backups',
        message: error.message,
      });
    }
  });
}
