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

  // 1. Database Check & Latency Measurement
  try {
    const dbStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Math.round(performance.now() - dbStart);
    checks.database = {
      status: 'UP',
      latencyMs: dbLatencyMs,
    };
  } catch (dbErr: any) {
    overallStatus = 'DEGRADED';
    checks.database = {
      status: 'DOWN',
      error: dbErr.message || 'Database unreachable',
    };
    logger.error('Health check database probe failed', dbErr, { route: '/api/health' });
  }

  // 2. Google Drive Storage Health
  try {
    const driveStatus = await getDriveConnectionStatus();
    checks.googleDrive = {
      isConnected: driveStatus.isConnected,
      email: driveStatus.email || null,
      rootFolderId: (driveStatus as any).rootFolderId || null,
      backupFolderId: (driveStatus as any).backupFolderId || null,
    };
  } catch (driveErr: any) {
    checks.googleDrive = {
      isConnected: false,
      error: driveErr.message,
    };
  }

  // 3. Automated 14-Day Backup Health
  try {
    const backupSchedule = await isBackupDue(14);
    checks.backup = {
      isDue: backupSchedule.isDue,
      lastBackupDate: backupSchedule.lastBackupDate,
      nextBackupDue: backupSchedule.nextBackupDue,
    };
  } catch (backupErr: any) {
    checks.backup = {
      status: 'UNKNOWN',
      error: backupErr.message,
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
