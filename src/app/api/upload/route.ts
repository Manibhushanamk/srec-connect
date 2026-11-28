import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  uploadCertificateToDrive,
  getUserDriveTokens,
  isPublicMediaDocumentType,
} from '@/lib/drive';
import { processPostImage, processPostThumbnail } from '@/lib/image-processor';
import { setCachedMedia } from '@/lib/media-cache';
import { isDataUriImage } from '@/lib/feed-media';

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
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to upload files.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawDocType = (formData.get('documentType') as string) || 'CAMPUS_MEDIA';
    const documentType = rawDocType.toUpperCase().trim() || 'CAMPUS_MEDIA';
    const isProfileAvatar = documentType === 'PROFILE_AVATAR' || documentType === 'AVATAR';

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

    let driveAccessToken = (session as any)?.accessToken as string | undefined;
    let driveRefreshToken = (session as any)?.refreshToken as string | undefined;

    if (!driveAccessToken && !driveRefreshToken) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
        select: { id: true },
      });
      if (dbUser?.id) {
        const stored = await getUserDriveTokens(dbUser.id).catch(() => null);
        if (stored?.access_token) {
          driveAccessToken = stored.access_token;
          driveRefreshToken = stored.refresh_token;
        }
      }
    }

    if (isProfileAvatar && !driveAccessToken && !driveRefreshToken) {
      return NextResponse.json(
        {
          error: 'Google Drive connection is required to store your profile picture in your Drive.',
          requiresDriveConnect: true,
        },
        { status: 403 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer);
    let effectiveMimeType = mimeType;
    const isPublicMedia = isPublicMediaDocumentType(documentType);

    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    let fileName = isProfileAvatar
      ? `avatar_${Date.now()}.webp`
      : `${Date.now()}_${sanitized}`;

    // Automatically optimize public campus images (or profile avatars <= 80 KB WebP)
    if (isPublicMedia && mimeType.startsWith('image/') && !mimeType.includes('svg')) {
      try {
        const processed = isProfileAvatar
          ? await processPostThumbnail(buffer)
          : await processPostImage(buffer);
        buffer = processed.buffer;
        effectiveMimeType = processed.contentType;
        fileName = fileName.replace(/\.[^/.]+$/, '') + '.webp';
      } catch (optErr) {
        console.warn('[Upload API] Image optimization skipped:', optErr);
      }
    }

    // Upload to user's Google Drive ('SREC CONNECT' folder)
    const driveResult = await uploadCertificateToDrive({
      fileBuffer: buffer,
      fileName,
      mimeType: effectiveMimeType,
      documentType,
      isPublicMedia,
      accessToken: driveAccessToken,
      refreshToken: driveRefreshToken,
    });

    if (isProfileAvatar && driveResult.storageProvider !== 'GOOGLE_DRIVE') {
      return NextResponse.json(
        {
          error: 'Could not persist profile picture to your Google Drive. Please reconnect Google Drive and retry.',
          requiresDriveConnect: true,
        },
        { status: 403 }
      );
    }

    if (driveResult.fileId && !driveResult.fileId.startsWith('inline-') && isPublicMedia) {
      setCachedMedia(driveResult.fileId, {
        buffer,
        mimeType: effectiveMimeType,
        fileName,
        size: buffer.length,
        etag: `W/"srec-drive-${driveResult.fileId}-${buffer.length}"`,
        lastModified: new Date().toUTCString(),
        cachedAt: Date.now(),
      });
    }

    const candidateUrl = driveResult.directDisplayUrl || driveResult.webViewLink;
    const url = isDataUriImage(candidateUrl) ? candidateUrl : candidateUrl;

    return NextResponse.json({
      success: true,
      url,
      fileId: driveResult.fileId,
      webViewLink: driveResult.webViewLink,
      fileName,
      fileSize: buffer.length,
      mimeType: effectiveMimeType,
      storageProvider: driveResult.storageProvider,
    });
  } catch (error: any) {
    console.error('[Upload API Error]', error);
    return NextResponse.json({ error: error.message || 'File upload failed' }, { status: 500 });
  }
}
