import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadCertificateToDrive } from '@/lib/drive';

export const runtime = 'nodejs';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to upload files.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentType = (formData.get('documentType') as string) || 'CAMPUS_MEDIA';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is 20 MB.` },
        { status: 400 }
      );
    }

    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported file format [${mimeType}]. Supported: PDF, PNG, JPG, WEBP, DOCX, TXT.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}_${sanitized}`;

    // Upload to Google Drive (sandboxed in 'SREC CONNECT' folder) with Cloudflare R2 fallback
    const driveResult = await uploadCertificateToDrive({
      fileBuffer: buffer,
      fileName,
      mimeType,
      documentType,
      accessToken: (session as any)?.accessToken,
      refreshToken: (session as any)?.refreshToken,
    });

    const url = driveResult.directDisplayUrl || driveResult.webViewLink;

    return NextResponse.json({
      success: true,
      url,
      fileId: driveResult.fileId,
      webViewLink: driveResult.webViewLink,
      fileName,
      fileSize: file.size,
      mimeType,
      storageProvider: driveResult.storageProvider,
    });
  } catch (error: any) {
    console.error('[Upload API Error]', error);
    return NextResponse.json({ error: error.message || 'File upload failed' }, { status: 500 });
  }
}
