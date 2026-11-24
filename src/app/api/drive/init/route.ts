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

    const drive = await getAuthenticatedDriveClient(accessToken, refreshToken);
    if (!drive) {
      return NextResponse.json(
        { error: 'Google Drive client could not be initialized. Please re-authenticate.' },
        { status: 503 }
      );
    }

    const folder = await findOrCreateDriveFolder(drive, 'SREC CONNECT');
    const folderViewLink = folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`;

    return NextResponse.json({
      success: true,
      folderId: folder.id,
      folderName: folder.name,
      folderViewLink,
      message: "Dedicated 'SREC CONNECT' folder is active in your Google Drive.",
    });
  } catch (error: any) {
    console.error('[Drive Init Error]', error);
    const errMsg = error?.message || '';
    if (errMsg.includes('Google Drive API has not been used') || errMsg.includes('disabled')) {
      return NextResponse.json({
        success: false,
        requiresApiEnablement: true,
        enableUrl: 'https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=127891787958',
        message: 'Google Drive API is pending one-click activation in Google Cloud Console for project 127891787958.',
      }, { status: 200 });
    }
    return NextResponse.json(
      { error: errMsg || 'Failed to initialize Google Drive folder.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
