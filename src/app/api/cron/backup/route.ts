import { NextRequest, NextResponse } from 'next/server';
import { isBackupDue, createAndUploadDatabaseBackup } from '@/lib/backup';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * GET /api/cron/backup
 * Automated 14-day database backup cron handler.
 * Compatible with Vercel Cron or external system schedulers.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate scheduler request
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === 'production' && !cronSecret) {
      console.error('[Cron Backup] Security Error: CRON_SECRET is not configured in production environment.');
      return NextResponse.json({ error: 'Server configuration error: CRON_SECRET is required.' }, { status: 500 });
    }

    if (cronSecret) {
      const urlSecret = req.nextUrl.searchParams.get('secret');
      const isAuthorized = authHeader === `Bearer ${cronSecret}` || urlSecret === cronSecret;
      if (!isAuthorized) {
        console.warn('[Cron Backup] Unauthorized cron request attempt rejected.');
        return NextResponse.json({ error: 'Unauthorized. Invalid or missing cron secret.' }, { status: 401 });
      }
    }

    // 2. Check 14-day idempotency schedule
    const force = req.nextUrl.searchParams.get('force') === 'true';
    const scheduleCheck = await isBackupDue(14);

    if (!scheduleCheck.isDue && !force) {
      return NextResponse.json({
        success: true,
        message: 'Database backup is not due yet (14-day schedule active).',
        lastBackupDate: scheduleCheck.lastBackupDate,
        nextBackupDue: scheduleCheck.nextBackupDue,
        isDue: false,
      });
    }

    console.log('[Cron Backup] Backup is due (or forced). Executing automated database snapshot...');

    // 3. Execute backup and upload to Super Admin Google Drive
    const result = await createAndUploadDatabaseBackup({
      initiatedBy: 'CRON_14_DAYS',
    });

    // 4. Record cron audit log
    await prisma.auditLog.create({
      data: {
        action: 'AUTOMATED_DATABASE_BACKUP_EXECUTED',
        entityType: 'DATABASE_BACKUP',
        entityId: result.backupId,
        actorId: 'SYSTEM_CRON',
        actorEmail: 'cron@srecnandyal.edu.in',
        actorRole: 'SYSTEM',
        metadata: JSON.stringify({
          backupId: result.backupId,
          success: result.success,
          driveFileId: result.driveFileId,
          durationMs: result.durationMs,
        }),
      },
    });

    return NextResponse.json({
      success: result.success,
      message: 'Automated 14-day database backup completed successfully.',
      backupId: result.backupId,
      driveFileId: result.driveFileId,
      durationMs: result.durationMs,
      nextBackupDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
  } catch (error: any) {
    console.error('[Cron Backup Error]', error);
    return NextResponse.json(
      { error: error.message || 'Automated database backup failed.' },
      { status: 500 }
    );
  }
}
