import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuthenticatedDriveClient, findOrCreateDriveFolder } from '@/lib/drive';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const accessToken = (session as any)?.accessToken;
    const refreshToken = (session as any)?.refreshToken;

    if (!accessToken && !refreshToken) {
      return NextResponse.json({
        isConnected: false,
        success: false,
        requiresReauth: true,
        message: 'Google Drive permission not granted. Please connect Google Drive.',
      }, { status: 200 });
    }

    let drive: any = null;
    try {
      drive = await getAuthenticatedDriveClient(accessToken, refreshToken);
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

    const folder = await findOrCreateDriveFolder(drive, 'SREC CONNECT');
    const folderViewLink = folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`;

    return NextResponse.json({
      isConnected: true,
      success: true,
      folderId: folder.id,
      folderName: folder.name,
      folderViewLink,
      email: session.user.email,
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
