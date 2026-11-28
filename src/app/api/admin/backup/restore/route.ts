import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import {
  dryRunRestore,
  decryptBackupPackage,
  createAndUploadDatabaseBackup,
  restoreDatabasePayload,
} from '@/lib/backup';
import { downloadDriveFile } from '@/lib/drive';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  issueRestoreChallengeToken,
  verifyRestoreChallengeToken,
  RESTORE_CHALLENGE_TTL_SECONDS,
} from '@/lib/restore-challenge';

export const runtime = 'nodejs';

/**
 * GET /api/admin/backup/restore
 * Issues a short-lived HMAC challenge token bound to the authenticated SUPER_ADMIN session.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    if (!session?.user || !userId || userRole !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Super Admin authorization required.' }, { status: 403 });
    }

    const challengeToken = issueRestoreChallengeToken(String(userId));
    return NextResponse.json({
      success: true,
      challengeToken,
      expiresInSeconds: RESTORE_CHALLENGE_TTL_SECONDS,
    });
  } catch (error: any) {
    console.error('[Admin Backup Challenge Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to issue restore challenge' }, { status: 500 });
  }
}

/**
 * POST /api/admin/backup/restore
 * Safe, isolated database restoration endpoint.
 * Restricted strictly to SUPER_ADMIN.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
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
    const {
      backupId,
      driveFileId,
      dryRun = true,
      confirmationCode,
      challengeToken,
      reauthEmail,
    } = body;

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

    // 2. Destructive live restore guard (requires short-lived session-bound HMAC token + secondary re-auth + DB active SUPER_ADMIN check)
    const userId = String((session.user as any)?.id || '');
    const normalizedSessionEmail = userEmail.toLowerCase().trim();
    const normalizedReauthEmail = typeof reauthEmail === 'string' ? reauthEmail.toLowerCase().trim() : '';

    if (confirmationCode !== 'CONFIRM_RESTORE_SREC') {
      return NextResponse.json(
        { error: 'Explicit confirmation required to execute live restore.' },
        { status: 400 }
      );
    }

    if (!verifyRestoreChallengeToken(challengeToken, userId)) {
      return NextResponse.json(
        { error: 'Forbidden: Missing or expired session-bound HMAC restore challenge token.' },
        { status: 403 }
      );
    }

    const verifiedAdmin = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, status: true, deletedAt: true },
    });

    if (
      !verifiedAdmin ||
      verifiedAdmin.deletedAt !== null ||
      verifiedAdmin.status !== 'ACTIVE' ||
      verifiedAdmin.role !== Role.SUPER_ADMIN ||
      !normalizedReauthEmail ||
      normalizedReauthEmail !== normalizedSessionEmail ||
      verifiedAdmin.email.toLowerCase().trim() !== normalizedSessionEmail
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Secondary SUPER_ADMIN identity re-authentication failed.' },
        { status: 403 }
      );
    }

    // Create a safety snapshot of the current database before restoring
    console.log('[Restore Engine] Generating safety pre-restore backup snapshot...');
    const safetySnapshot = await createAndUploadDatabaseBackup({
      initiatedBy: `SAFETY_SNAPSHOT_BEFORE_RESTORE (${userEmail})`,
    });

    const payload = await decryptBackupPackage(packageBuffer);

    // Execute verified restoration
    const restoreResult = await restoreDatabasePayload(payload);

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
          restoredTables: restoreResult.restoredTables,
          totalRecordsRestored: restoreResult.totalRecordsRestored,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      mode: 'LIVE_RESTORE',
      message: 'Database restore executed successfully and safety snapshot preserved.',
      restoredBackupId: payload.metadata.backup_id,
      safetySnapshotBackupId: safetySnapshot.backupId,
      totalRecords: payload.metadata.total_records,
      restoredTables: restoreResult.restoredTables,
      totalRecordsRestored: restoreResult.totalRecordsRestored,
    });
  } catch (error: any) {
    console.error('[Admin Backup Restore Error]', error);
    return NextResponse.json(
      { error: error.message || 'Database restore failed.' },
      { status: 500 }
    );
  }
}
