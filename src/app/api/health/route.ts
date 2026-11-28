import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDriveConnectionStatus } from '@/lib/drive';
import { isBackupDue } from '@/lib/backup';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/health
 * Public health check & uptime monitoring endpoint.
 * Returns operational status, DB latency, Drive status, and backup schedule.
 */
export async function GET() {
  const startTime = performance.now();
  const checks: Record<string, any> = {};
  let overallStatus: 'HEALTHY' | 'DEGRADED' = 'HEALTHY';

  const [dbResult, driveResult, backupResult] = await Promise.allSettled([
    (async () => {
      const dbStart = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      return Math.round(performance.now() - dbStart);
    })(),
    getDriveConnectionStatus(),
    isBackupDue(14),
  ]);

  if (dbResult.status === 'fulfilled') {
    checks.database = {
      status: 'UP',
      latencyMs: dbResult.value,
    };
  } else {
    overallStatus = 'DEGRADED';
    const dbErr = dbResult.reason as Error;
    checks.database = {
      status: 'DOWN',
      error: dbErr?.message || 'Database unreachable',
    };
    logger.error('Health check database probe failed', dbErr, { route: '/api/health' });
  }

  if (driveResult.status === 'fulfilled') {
    const driveStatus = driveResult.value;
    checks.googleDrive = {
      isConnected: driveStatus.isConnected,
      email: driveStatus.email || null,
      rootFolderId: (driveStatus as any).rootFolderId || null,
      backupFolderId: (driveStatus as any).backupFolderId || null,
    };
  } else {
    const driveErr = driveResult.reason as Error;
    checks.googleDrive = {
      isConnected: false,
      error: driveErr?.message || 'Drive check failed',
    };
  }

  if (backupResult.status === 'fulfilled') {
    const backupSchedule = backupResult.value;
    checks.backup = {
      isDue: backupSchedule.isDue,
      lastBackupDate: backupSchedule.lastBackupDate,
      nextBackupDue: backupSchedule.nextBackupDue,
    };
  } else {
    const backupErr = backupResult.reason as Error;
    checks.backup = {
      status: 'UNKNOWN',
      error: backupErr?.message || 'Backup check failed',
    };
  }

  // 4. System Runtime & Memory Metrics
  const mem = process.memoryUsage();
  const totalResponseTimeMs = Math.round(performance.now() - startTime);

  const payload = {
    application: 'SREC CONNECT',
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'production',
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    responseTimeMs: totalResponseTimeMs,
    checks,
    memory: {
      rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
    },
  };

  const statusCode = overallStatus === 'HEALTHY' ? 200 : 503;
  return NextResponse.json(payload, { status: statusCode });
}
