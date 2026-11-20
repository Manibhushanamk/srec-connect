import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import {
  isBackupDue,
  createAndUploadDatabaseBackup,
  decryptBackupPackage,
} from '@/lib/backup';
import { getDriveConnectionStatus, downloadDriveFile } from '@/lib/drive';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * GET /api/admin/backup
 * Returns backup history, schedule status, Drive health, and statistics.
 * Restricted to SUPER_ADMIN.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session?.user || userRole !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const [scheduleStatus, driveStatus, history] = await Promise.all([
      isBackupDue(14),
      getDriveConnectionStatus(),
      prisma.backupRecord.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      schedule: scheduleStatus,
      drive: driveStatus,
      history,
    });
  } catch (error: any) {
    console.error('[Admin Backup GET Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch backup status.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/backup
 * Actions:
 * - 'trigger': Manual immediate backup execution.
 * - 'verify': Verify an existing backup from Google Drive.
 * Restricted to SUPER_ADMIN.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userEmail = session?.user?.email || 'admin@srecnandyal.edu.in';

    if (!session?.user || userRole !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const rl = checkRateLimit(`admin-backup-${userEmail}`, { limit: 5, windowMs: 60000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many backup requests. Please wait before triggering another backup.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action = 'trigger', backupId } = body;

    if (action === 'trigger') {
      const result = await createAndUploadDatabaseBackup({
        initiatedBy: `SUPER_ADMIN (${userEmail})`,
      });

      await prisma.auditLog.create({
        data: {
          action: 'MANUAL_DATABASE_BACKUP_TRIGGERED',
          entityType: 'DATABASE_BACKUP',
          entityId: result.backupId,
          actorId: (session.user as any).id,
          actorEmail: userEmail,
          actorRole: 'SUPER_ADMIN',
          metadata: JSON.stringify({
            backupId: result.backupId,
            driveFileId: result.driveFileId,
            durationMs: result.durationMs,
          }),
        },
      });

      return NextResponse.json({
        success: result.success,
        message: 'Database backup generated and securely stored in Google Drive.',
        backup: result,
      });
    }

    if (action === 'verify' && backupId) {
      const record = await prisma.backupRecord.findUnique({
        where: { backupId },
      });

      if (!record || !record.driveFileId) {
        return NextResponse.json({ error: 'Backup record or Drive file not found.' }, { status: 404 });
      }

      const fileBuffer = await downloadDriveFile(record.driveFileId);
      const verifiedPayload = await decryptBackupPackage(fileBuffer);

      if (verifiedPayload.metadata.checksum_sha256 !== record.checksum) {
        return NextResponse.json({
          success: false,
          error: 'Integrity verification failed: Checksum mismatch.',
        }, { status: 400 });
      }

      await prisma.backupRecord.update({
        where: { id: record.id },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Backup integrity successfully verified from Google Drive.',
        recordCounts: verifiedPayload.metadata.record_counts,
        totalRecords: verifiedPayload.metadata.total_records,
      });
    }

    return NextResponse.json({ error: 'Unknown action specified.' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin Backup POST Error]', error);
    return NextResponse.json(
      { error: error.message || 'Backup operation failed.' },
      { status: 500 }
    );
  }
}
