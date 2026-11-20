/**
 * Production Observability & Error Tracking Logger
 * Provides structured JSON logging, strict secret sanitization, and critical alert dispatching.
 */

import { prisma } from './prisma';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogContext {
  userId?: string;
  userEmail?: string;
  role?: string;
  route?: string;
  ip?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
  [key: string]: any;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'secret',
  'authorization',
  'cookie',
  'credentials',
  'privatekey',
  'private_key',
  'clientsecret',
  'client_secret',
  'auth_tag',
  'iv',
  'google_drive_tokens',
  'backup_encryption_secret',
]);

/**
 * Deeply sanitizes an object or string to prevent secrets from appearing in logs.
 */
export function sanitizeLogData(data: any, depth = 0): any {
  if (depth > 5) return '[Truncated Depth]';
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Redact Bearer tokens
    if (data.toLowerCase().startsWith('bearer ')) {
      return 'Bearer [REDACTED]';
    }
    // Redact suspected long tokens or private keys
    if (data.length > 120 && /^[A-Za-z0-9-_=.]+$/.test(data)) {
      return '[REDACTED_TOKEN]';
    }
    return data;
  }

  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1));
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : data.stack,
    };
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('secret') || lowerKey.includes('password')) {
      cleaned[key] = '[REDACTED]';
    } else {
      cleaned[key] = sanitizeLogData(value, depth + 1);
    }
  }

  return cleaned;
}

class ProductionLogger {
  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? sanitizeLogData(context) : undefined,
      error: error ? sanitizeLogData(error instanceof Error ? error : new Error(String(error))) : undefined,
      environment: process.env.NODE_ENV || 'development',
    };

    const jsonString = JSON.stringify(entry);

    if (level === 'ERROR' || level === 'CRITICAL') {
      console.error(jsonString);
    } else if (level === 'WARN') {
      console.warn(jsonString);
    } else {
      console.log(jsonString);
    }

    return entry;
  }

  info(message: string, context?: LogContext) {
    return this.formatLog('INFO', message, context);
  }

  warn(message: string, context?: LogContext) {
    return this.formatLog('WARN', message, context);
  }

  error(message: string, error?: any, context?: LogContext) {
    return this.formatLog('ERROR', message, context, error);
  }

  /**
   * Logs a critical system incident and safely dispatches an AuditLog event.
   */
  async critical(message: string, error?: any, context?: LogContext) {
    const logEntry = this.formatLog('CRITICAL', message, context, error);

    try {
      let actorId = context?.userId;
      if (!actorId) {
        const adminUser = await prisma.user.findFirst({
          where: { role: 'SUPER_ADMIN' },
          select: { id: true, email: true },
        });
        actorId = adminUser?.id;
      }

      if (actorId) {
        await prisma.auditLog.create({
          data: {
            actorId,
            actorEmail: context?.userEmail || 'system@srecconnect.dpdns.org',
            actorRole: context?.role || 'SYSTEM',
            action: 'SYSTEM_CRITICAL_ALERT',
            entityType: 'SYSTEM_RELIABILITY',
            entityId: context?.route || 'srec-connect-core',
            ipAddress: context?.ip || '127.0.0.1',
            metadata: JSON.stringify({
              message,
              error: logEntry.error,
              route: context?.route,
              timestamp: logEntry.timestamp,
            }),
          },
        });
      }
    } catch (auditErr) {
      console.error('[ProductionLogger] Failed to write critical audit log to database:', auditErr);
    }

    return logEntry;
  }

  /**
   * Measures asynchronous execution time and logs a warning if latency exceeds threshold.
   */
  async measure<T>(
    operationName: string,
    fn: () => Promise<T>,
    thresholdMs = 2000,
    context?: LogContext
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const durationMs = Math.round(performance.now() - start);

      if (durationMs >= thresholdMs) {
        this.warn(`[Slow Operation] ${operationName} took ${durationMs}ms (threshold: ${thresholdMs}ms)`, {
          ...context,
          durationMs,
        });
      }

      return result;
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      this.error(`Operation failed: ${operationName}`, err, { ...context, durationMs });
      throw err;
    }
  }
}

export const logger = new ProductionLogger();
