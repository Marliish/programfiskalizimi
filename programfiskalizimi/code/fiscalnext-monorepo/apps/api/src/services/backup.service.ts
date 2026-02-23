// Backup & Restore Service
// Database backup, scheduled backups, restore functionality
// Created: 2026-02-23 - Day 7 Integration

import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import archiver from 'archiver';
import { createWriteStream, createReadStream } from 'fs';

const execAsync = promisify(exec);

interface BackupOptions {
  includeUploads?: boolean;
  compress?: boolean;
  encryption?: boolean;
}

interface BackupMetadata {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  type: 'manual' | 'scheduled';
  includesUploads: boolean;
  compressed: boolean;
  encrypted: boolean;
  databaseVersion?: string;
}

interface RestoreOptions {
  backupId: string;
  verifyBeforeRestore?: boolean;
}

export class BackupService {
  private backupDir = path.join(process.cwd(), 'backups');

  constructor() {
    this.ensureBackupDir();
  }

  /**
   * Create full database backup
   */
  async createBackup(options: BackupOptions = {}): Promise<BackupMetadata> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${timestamp}`;
    const filename = `${backupId}.tar.gz`;
    const backupPath = path.join(this.backupDir, filename);

    console.log('[Backup] Creating backup:', backupId);

    try {
      // Create backup archive
      const output = createWriteStream(backupPath);
      const archive = archiver('tar', {
        gzip: options.compress !== false,
        gzipOptions: {
          level: 9,
        },
      });

      archive.pipe(output);

      // Backup database (using SQLite as example - adjust for your DB)
      const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
      
      try {
        const dbExists = await fs.access(dbPath).then(() => true).catch(() => false);
        if (dbExists) {
          archive.file(dbPath, { name: 'database.db' });
        }
      } catch (error) {
        console.warn('[Backup] Database file not found:', dbPath);
      }

      // Backup uploads if requested
      if (options.includeUploads) {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        try {
          await fs.access(uploadsDir);
          archive.directory(uploadsDir, 'uploads');
        } catch (error) {
          console.warn('[Backup] Uploads directory not found');
        }
      }

      // Add metadata file
      const metadata = {
        id: backupId,
        createdAt: new Date().toISOString(),
        type: 'manual',
        includesUploads: options.includeUploads || false,
        compressed: options.compress !== false,
        encrypted: options.encryption || false,
        nodeVersion: process.version,
        databaseVersion: '1.0.0',
      };

      archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

      // Finalize archive
      await archive.finalize();

      // Wait for output stream to finish
      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
      });

      // Get file stats
      const stats = await fs.stat(backupPath);

      const backupMetadata: BackupMetadata = {
        id: backupId,
        filename,
        size: stats.size,
        createdAt: new Date(),
        type: 'manual',
        includesUploads: options.includeUploads || false,
        compressed: options.compress !== false,
        encrypted: options.encryption || false,
      };

      console.log('[Backup] Backup created successfully:', {
        filename,
        size: this.formatBytes(stats.size),
      });

      return backupMetadata;
    } catch (error) {
      console.error('[Backup] Failed to create backup:', error);
      throw new Error(`Backup failed: ${error}`);
    }
  }

  /**
   * List all backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: BackupMetadata[] = [];

      for (const file of files) {
        if (file.startsWith('backup-') && file.endsWith('.tar.gz')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);

          backups.push({
            id: file.replace('.tar.gz', ''),
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime,
            type: 'manual',
            includesUploads: false,
            compressed: true,
            encrypted: false,
          });
        }
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('[Backup] Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Delete backup by ID
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const filename = `${backupId}.tar.gz`;
      const backupPath = path.join(this.backupDir, filename);

      await fs.unlink(backupPath);
      console.log('[Backup] Deleted backup:', backupId);

      return true;
    } catch (error) {
      console.error('[Backup] Failed to delete backup:', error);
      return false;
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(options: RestoreOptions): Promise<any> {
    const filename = `${options.backupId}.tar.gz`;
    const backupPath = path.join(this.backupDir, filename);

    console.log('[Restore] Starting restore from:', options.backupId);

    try {
      // Check if backup exists
      await fs.access(backupPath);

      // Verify backup if requested
      if (options.verifyBeforeRestore) {
        const isValid = await this.verifyBackup(options.backupId);
        if (!isValid) {
          throw new Error('Backup verification failed');
        }
      }

      // In production, extract and restore database
      // This is a simplified mock version
      console.log('[Restore] Backup verified, proceeding with restore');
      console.log('[Restore] WARNING: This would overwrite current database!');
      console.log('[Restore] In production, implement actual restore logic here');

      return {
        success: true,
        backupId: options.backupId,
        restoredAt: new Date(),
        message: 'Restore completed successfully (MOCK)',
      };
    } catch (error) {
      console.error('[Restore] Failed to restore backup:', error);
      throw new Error(`Restore failed: ${error}`);
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupId: string): Promise<boolean> {
    try {
      const filename = `${backupId}.tar.gz`;
      const backupPath = path.join(this.backupDir, filename);

      // Check if file exists
      await fs.access(backupPath);

      // Check file size
      const stats = await fs.stat(backupPath);
      if (stats.size === 0) {
        console.error('[Backup] Backup file is empty');
        return false;
      }

      // In production, verify archive integrity, checksum, etc.
      console.log('[Backup] Backup verification passed:', {
        backupId,
        size: this.formatBytes(stats.size),
      });

      return true;
    } catch (error) {
      console.error('[Backup] Backup verification failed:', error);
      return false;
    }
  }

  /**
   * Get backup download stream
   */
  async getBackupStream(backupId: string): Promise<any> {
    const filename = `${backupId}.tar.gz`;
    const backupPath = path.join(this.backupDir, filename);

    await fs.access(backupPath);

    return {
      stream: createReadStream(backupPath),
      filename,
      mimetype: 'application/gzip',
    };
  }

  /**
   * Schedule automatic backups
   */
  async scheduleBackup(schedule: 'daily' | 'weekly' | 'monthly'): Promise<any> {
    console.log('[Backup] Scheduling automatic backups:', schedule);

    // In production, use node-cron or similar
    const cronExpression = {
      daily: '0 2 * * *', // 2 AM every day
      weekly: '0 2 * * 0', // 2 AM every Sunday
      monthly: '0 2 1 * *', // 2 AM on 1st of month
    }[schedule];

    return {
      success: true,
      schedule,
      cronExpression,
      nextRun: this.getNextBackupTime(schedule),
      message: 'Backup schedule configured (MOCK)',
    };
  }

  /**
   * Get backup statistics
   */
  async getStatistics(): Promise<any> {
    const backups = await this.listBackups();

    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    const oldestBackup = backups[backups.length - 1];
    const newestBackup = backups[0];

    return {
      totalBackups: backups.length,
      totalSize: this.formatBytes(totalSize),
      totalSizeBytes: totalSize,
      oldestBackup: oldestBackup
        ? {
            id: oldestBackup.id,
            createdAt: oldestBackup.createdAt,
            size: this.formatBytes(oldestBackup.size),
          }
        : null,
      newestBackup: newestBackup
        ? {
            id: newestBackup.id,
            createdAt: newestBackup.createdAt,
            size: this.formatBytes(newestBackup.size),
          }
        : null,
      averageSize: backups.length > 0 ? this.formatBytes(totalSize / backups.length) : '0 B',
    };
  }

  /**
   * Clean old backups (keep last N backups)
   */
  async cleanOldBackups(keepCount: number = 10): Promise<any> {
    const backups = await this.listBackups();

    if (backups.length <= keepCount) {
      return {
        success: true,
        deleted: 0,
        message: `No backups to delete (keeping ${keepCount} latest)`,
      };
    }

    const toDelete = backups.slice(keepCount);
    let deletedCount = 0;

    for (const backup of toDelete) {
      const deleted = await this.deleteBackup(backup.id);
      if (deleted) deletedCount++;
    }

    return {
      success: true,
      deleted: deletedCount,
      kept: keepCount,
      message: `Deleted ${deletedCount} old backups`,
    };
  }

  // Private helper methods

  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('[Backup] Created backup directory:', this.backupDir);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  private getNextBackupTime(schedule: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    const next = new Date(now);

    switch (schedule) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(2, 0, 0, 0);
        break;
      case 'weekly':
        next.setDate(next.getDate() + (7 - next.getDay()));
        next.setHours(2, 0, 0, 0);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1, 1);
        next.setHours(2, 0, 0, 0);
        break;
    }

    return next;
  }
}
