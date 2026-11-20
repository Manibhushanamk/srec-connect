import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import {
  getDriveConnectionStatus,
  saveSuperAdminDriveTokens,
  disconnectSuperAdminDrive,
  getAuthenticatedDriveClient,
  initializeDriveFolders,
  listDriveFiles,
  getStoredDriveTokens,
} from '@/lib/drive';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * GET /api/admin/drive
 * Returns Drive connection status, folder IDs, and recent backup files.
 * Restricted to SUPER_ADMIN.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session?.user || userRole !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const status = await getDriveConnectionStatus();
    let backupFiles: any[] = [];

    if (status.isConnected) {
      try {
        const tokens = await getStoredDriveTokens();
        backupFiles = await listDriveFiles(tokens?.backupFolderId, 10);
      } catch (listErr) {
        console.warn('[Admin Drive API] Failed to list backup files:', listErr);
      }
    }

    return NextResponse.json({
      success: true,
      status,
      backupFiles,
    });
  } catch (error: any) {
    console.error('[Admin Drive API GET Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while fetching Drive status.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/drive
 * Actions: 'connect', 'disconnect', 'sync_folders'
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

    const rl = checkRateLimit(`admin-drive-${userEmail}`, { limit: 10, windowMs: 60000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many Drive administration requests. Please wait before retrying.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { action, accessToken, refreshToken, expiryDate, email } = body;

    if (action === 'connect') {
      const tokenToSave = accessToken || (session as any)?.accessToken;
      if (!tokenToSave && !refreshToken) {
        return NextResponse.json(
          { error: 'No OAuth tokens provided. Sign in with Google Drive scopes or provide tokens.' },
          { status: 400 }
        );
      }

      await saveSuperAdminDriveTokens({
        access_token: tokenToSave,
        refresh_token: refreshToken,
        expiry_date: expiryDate,
        email: email || session?.user?.email || undefined,
      });

      // Initialize required folders
      let folders: { rootFolderId: string; backupFolderId: string } | null = null;
      try {
        const drive = await getAuthenticatedDriveClient();
        if (drive) {
          folders = await initializeDriveFolders(drive);
        }
      } catch (fErr) {
        console.warn('[Admin Drive Connect] Initializing folders failed:', fErr);
      }

      await prisma.auditLog.create({
        data: {
          action: 'GOOGLE_DRIVE_CONNECTED',
          entityType: 'INTEGRATION',
          actorId: (session.user as any).id,
          actorEmail: userEmail,
          actorRole: 'SUPER_ADMIN',
          metadata: JSON.stringify({ email: email || userEmail, folders }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Super Admin Google Drive connected and folders initialized.',
        folders,
      });
    }

    if (action === 'disconnect') {
      await disconnectSuperAdminDrive();

      await prisma.auditLog.create({
        data: {
          action: 'GOOGLE_DRIVE_DISCONNECTED',
          entityType: 'INTEGRATION',
          actorId: (session.user as any).id,
          actorEmail: userEmail,
          actorRole: 'SUPER_ADMIN',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Super Admin Google Drive disconnected successfully.',
      });
    }

    if (action === 'sync_folders') {
      const drive = await getAuthenticatedDriveClient();
      if (!drive) {
        return NextResponse.json({ error: 'Drive is not authenticated.' }, { status: 400 });
      }

      const folders = await initializeDriveFolders(drive);
      return NextResponse.json({
        success: true,
        message: 'Drive folders synchronized.',
        folders,
      });
    }

    return NextResponse.json({ error: 'Unknown action specified.' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin Drive API POST Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while managing Google Drive.' },
      { status: 500 }
    );
  }
}
