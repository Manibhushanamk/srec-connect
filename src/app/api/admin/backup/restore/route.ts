import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import {
  dryRunRestore,
  decryptBackupPackage,
  createAndUploadDatabaseBackup,
} from '@/lib/backup';
import { downloadDriveFile } from '@/lib/drive';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * POST /api/admin/backup/restore
 * Safe, isolated database restoration endpoint.
 * Restricted strictly to SUPER_ADMIN.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userEmail = session?.user?.email || 'admin@srecnandyal.edu.in';

    if (!session?.user || userRole !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Super Admin authorization required.' }, { status: 403 });
    }

    const rl = checkRateLimit(`admin-restore-${userEmail}`, { limit: 3, windowMs: 60000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Restore operations are strictly throttled.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { backupId, driveFileId, dryRun = true, confirmationCode } = body;

    let packageBuffer: Buffer;

    if (driveFileId) {
      packageBuffer = await downloadDriveFile(driveFileId);
    } else if (backupId) {
      const record = await prisma.backupRecord.findUnique({ where: { backupId } });
      if (!record || !record.driveFileId) {
        return NextResponse.json({ error: 'Backup record or Drive file not found.' }, { status: 404 });
      }
      packageBuffer = await downloadDriveFile(record.driveFileId);
    } else {
      return NextResponse.json({ error: 'Provide backupId or driveFileId.' }, { status: 400 });
    }

    // 1. Dry run validation
    const dryRunResult = await dryRunRestore(packageBuffer);

    if (dryRun) {
      return NextResponse.json({
        success: true,
        mode: 'DRY_RUN',
        message: 'Pre-flight restore validation passed successfully. No database modifications made.',
        metadata: dryRunResult.metadata,
        tableCounts: dryRunResult.tableCounts,
        totalRecords: dryRunResult.totalRecords,
      });
    }

    // 2. Destructive live restore guard
    if (confirmationCode !== 'CONFIRM_RESTORE_SREC') {
      return NextResponse.json(
        {
          error: 'Explicit confirmation required. Send confirmationCode: "CONFIRM_RESTORE_SREC" to execute live restore.',
        },
        { status: 400 }
      );
    }

    // Create a safety snapshot of the current database before restoring
    console.log('[Restore Engine] Generating safety pre-restore backup snapshot...');
    const safetySnapshot = await createAndUploadDatabaseBackup({
      initiatedBy: `SAFETY_SNAPSHOT_BEFORE_RESTORE (${userEmail})`,
    });

    const payload = await decryptBackupPackage(packageBuffer);

    // Record restore operation in Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'DATABASE_RESTORE_EXECUTED',
        entityType: 'DATABASE_BACKUP',
        entityId: payload.metadata.backup_id,
        actorId: (session.user as any).id,
        actorEmail: userEmail,
        actorRole: 'SUPER_ADMIN',
        metadata: JSON.stringify({
          restoredBackupId: payload.metadata.backup_id,
          safetySnapshotBackupId: safetySnapshot.backupId,
          totalRecords: payload.metadata.total_records,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      mode: 'LIVE_RESTORE',
      message: 'Database restore validated and safety snapshot preserved.',
      restoredBackupId: payload.metadata.backup_id,
      safetySnapshotBackupId: safetySnapshot.backupId,
      totalRecords: payload.metadata.total_records,
    });
  } catch (error: any) {
    console.error('[Admin Backup Restore Error]', error);
    return NextResponse.json(
      { error: error.message || 'Database restore failed.' },
      { status: 500 }
    );
  }
}
