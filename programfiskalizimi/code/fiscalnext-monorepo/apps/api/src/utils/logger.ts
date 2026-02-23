/**
 * Structured logging with multiple levels and JSON output
 */

import { maskSensitiveData } from './security.js';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  userId?: string;
}

class Logger {
  private minLevel: LogLevel;
  private logToConsole: boolean;
  private logToFile: boolean;
  private logs: LogEntry[] = [];
  private maxLogsInMemory = 1000;

  constructor() {
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    this.logToConsole = process.env.NODE_ENV !== 'test';
    this.logToFile = process.env.LOG_TO_FILE === 'true';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const minIndex = levels.indexOf(this.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex <= minIndex;
  }

  private formatLog(entry: LogEntry): string {
    if (process.env.LOG_FORMAT === 'json') {
      return JSON.stringify(entry);
    }

    // Human-readable format
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const message = entry.message;
    const context = entry.context ? JSON.stringify(entry.context) : '';
    
    return `[${timestamp}] ${level} ${message} ${context}`.trim();
  }

  private writeLog(entry: LogEntry): void {
    // Add to in-memory buffer
    this.logs.push(entry);
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift();
    }

    const formatted = this.formatLog(entry);

    if (this.logToConsole) {
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.INFO]: '\x1b[36m',  // Cyan
        [LogLevel.DEBUG]: '\x1b[90m', // Gray
      };
      const reset = '\x1b[0m';
      console.log(`${colors[entry.level]}${formatted}${reset}`);
    }

    // In production, write to file or send to log aggregation service
    if (this.logToFile) {
      // TODO: Implement file writing with rotation
    }
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context: context ? maskSensitiveData(context) : undefined,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    this.writeLog(entry);
  }

  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context: context ? maskSensitiveData(context) : undefined,
    };

    this.writeLog(entry);
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context: context ? maskSensitiveData(context) : undefined,
    };

    this.writeLog(entry);
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context: context ? maskSensitiveData(context) : undefined,
    };

    this.writeLog(entry);
  }

  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filtered = this.logs;
    
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    return filtered.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }

  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<LogLevel, number>,
    };

    for (const log of this.logs) {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    }

    return stats;
  }
}

// Singleton instance
export const logger = new Logger();

// Request logging middleware
export function requestLogger(request: any, reply: any, done: () => void) {
  const startTime = Date.now();

  reply.addHook('onSend', (req: any, rep: any, payload: any, cb: any) => {
    const duration = Date.now() - startTime;
    
    logger.info('HTTP Request', {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    cb(null, payload);
  });

  done();
}
