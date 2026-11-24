import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAuthenticatedDriveClient,
  findOrCreateDriveFolder,
  getUserDriveTokens,
  saveUserDriveTokens,
  StoredDriveTokens,
} from '@/lib/drive';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const userEmail = session.user.email.toLowerCase().trim();
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true },
    });

    let accessToken = (session as any)?.accessToken;
    let refreshToken = (session as any)?.refreshToken;

    // Check database if session tokens are missing or expired
    let userTokens: StoredDriveTokens | null = null;
    if (dbUser) {
      userTokens = await getUserDriveTokens(dbUser.id);
      if (!accessToken && userTokens?.access_token) {
        accessToken = userTokens.access_token;
      }
      if (!refreshToken && userTokens?.refresh_token) {
        refreshToken = userTokens.refresh_token;
      }
    }

    if (!accessToken && !refreshToken) {
      return NextResponse.json({
        isConnected: false,
        success: false,
        requiresReauth: true,
        message: 'Google Drive permission not granted. Please connect Google Drive.',
      }, { status: 200 });
    }

    // 1. Strict Account-Matching & Token Validation with Google Tokeninfo
    if (accessToken) {
      try {
        const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
        if (infoRes.ok) {
          const info = await infoRes.json();
          // Check for Email Mismatch: Drive email and logged-in email must be identical
          if (info.email && info.email.toLowerCase().trim() !== userEmail) {
            console.warn(`[Drive Account Mismatch] Authorized with ${info.email}, but logged in as ${userEmail}`);
            return NextResponse.json({
              isConnected: false,
              success: false,
              emailMismatch: true,
              expectedEmail: userEmail,
              actualEmail: info.email,
              requiresReauth: true,
              message: `Email Mismatch: Drive was authorized with ${info.email}, but your account is ${userEmail}. Google Drive must match your exact institutional email.`,
            }, { status: 200 });
          }
        } else if (refreshToken) {
          // Access token might be expired; auto-refresh with refresh_token
          const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID || '',
              client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
            }),
          });
          const refreshed = await refreshRes.json();
          if (refreshed.access_token) {
            accessToken = refreshed.access_token;
            if (dbUser) {
              await saveUserDriveTokens(dbUser.id, {
                access_token: refreshed.access_token,
                expiry_date: Date.now() + (refreshed.expires_in || 3600) * 1000,
              });
            }
          }
        }
      } catch (tokenInfoErr) {
        console.warn('[Drive Init Tokeninfo Warning]:', tokenInfoErr);
      }
    }

    // 2. Obtain Authenticated Drive Client
    let drive: any = null;
    try {
      drive = await getAuthenticatedDriveClient(accessToken, refreshToken, dbUser?.id);
    } catch (e: any) {
      console.warn('[Drive Init Auth Client Error]', e?.message || e);
    }

    if (!drive) {
      return NextResponse.json({
        isConnected: false,
        success: false,
        requiresReauth: true,
        message: 'Google Drive client could not be initialized. Please connect Google Drive.',
      }, { status: 200 });
    }

    // 3. Find or Create dedicated 'SREC CONNECT' folder in user's Drive account
    const folder = await findOrCreateDriveFolder(drive, 'SREC CONNECT');
    const folderViewLink = folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`;

    // Update stored tokens with folder ID
    if (dbUser) {
      await saveUserDriveTokens(dbUser.id, {
        rootFolderId: folder.id,
      });
    }

    return NextResponse.json({
      isConnected: true,
      success: true,
      folderId: folder.id,
      folderName: folder.name,
      folderViewLink,
      email: userEmail,
      message: "Dedicated 'SREC CONNECT' folder is active in your Google Drive.",
    });
  } catch (error: any) {
    console.error('[Drive Init Error]', error);
    const errMsg = error?.message || '';
    if (errMsg.includes('Google Drive API has not been used') || errMsg.includes('disabled')) {
      return NextResponse.json({
        isConnected: false,
        success: false,
        requiresApiEnablement: true,
        enableUrl: 'https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=127891787958',
        message: 'Google Drive API is pending one-click activation in Google Cloud Console for project 127891787958.',
      }, { status: 200 });
    }
    if (errMsg.includes('insufficient') || errMsg.includes('invalid_grant') || error?.code === 401 || error?.code === 403) {
      return NextResponse.json({
        isConnected: false,
        success: false,
        requiresReauth: true,
        message: 'Google Drive permission has not been granted. Please connect your Google Drive.',
      }, { status: 200 });
    }
    return NextResponse.json({
      isConnected: false,
      success: false,
      requiresReauth: true,
      error: errMsg || 'Failed to initialize Google Drive folder.',
    }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
