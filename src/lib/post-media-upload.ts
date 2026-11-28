import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { processPostImage, processPostThumbnail } from './image-processor';
import { uploadCertificateToDrive } from './drive';
import { setCachedMedia } from './media-cache';
import { appendDriveResizeHints, decodeImagePayload, isDataUriImage } from './feed-media';

export interface UploadedPostMediaRecord {
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  order: number;
}

export type DriveUploaderFn = typeof uploadCertificateToDrive;

function persistFallbackMediaFile(
  fileId: string,
  buffer: Buffer,
  fileName: string
): string {
  setCachedMedia(fileId, {
    buffer,
    mimeType: 'image/webp',
    fileName,
    size: buffer.length,
    etag: `W/"srec-media-${fileId}-${buffer.length}"`,
    lastModified: new Date().toUTCString(),
    cachedAt: Date.now(),
  });

  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadsDir, `${fileId}_${fileName}`), buffer);
  } catch (err) {
    console.warn('[PostMedia Fallback Write Warning]:', err);
  }

  return `/api/drive/file/${fileId}`;
}

function resolveCompactDriveUrl(
  driveResult: {
    fileId: string;
    directDisplayUrl?: string;
    webViewLink: string;
    storageProvider: string;
  },
  fallbackBuffer: Buffer,
  fileName: string
): string {
  const candidate = driveResult.directDisplayUrl || driveResult.webViewLink;
  if (
    driveResult.storageProvider !== 'DATA_URI' &&
    candidate &&
    !isDataUriImage(candidate)
  ) {
    if (driveResult.fileId && !driveResult.fileId.startsWith('inline-')) {
      setCachedMedia(driveResult.fileId, {
        buffer: fallbackBuffer,
        mimeType: 'image/webp',
        fileName,
        size: fallbackBuffer.length,
        etag: `W/"srec-drive-${driveResult.fileId}-${fallbackBuffer.length}"`,
        lastModified: new Date().toUTCString(),
        cachedAt: Date.now(),
      });
    }
    return candidate;
  }

  // Never store inline Base64 data:image URIs in PostMedia.url or PostMedia.thumbnailUrl
  const fallbackId = `srec-${crypto.randomUUID().slice(0, 12)}`;
  return persistFallbackMediaFile(fallbackId, fallbackBuffer, fileName);
}

/**
 * Compresses image + WebP thumbnail (~<= 80 KB) via Sharp, uploads both to Google Drive
 * with `isPublicMedia = true`, and returns compact Drive proxy URLs (zero Base64 bloat).
 */
export async function uploadPostMediaWithThumbnail({
  rawImages,
  driveAccessToken,
  driveRefreshToken,
  uploader = uploadCertificateToDrive,
}: {
  rawImages: string[];
  driveAccessToken?: string;
  driveRefreshToken?: string;
  uploader?: DriveUploaderFn;
}): Promise<UploadedPostMediaRecord[]> {
  const results: UploadedPostMediaRecord[] = [];
  const timestamp = Date.now();

  for (let i = 0; i < rawImages.length; i++) {
    const raw = rawImages[i];
    if (!raw || typeof raw !== 'string') continue;

    const trimmed = raw.trim();
    if (
      !isDataUriImage(trimmed) &&
      (trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('/api/drive/file/') ||
        trimmed.startsWith('/uploads/'))
    ) {
      results.push({
        url: trimmed,
        thumbnailUrl: appendDriveResizeHints(trimmed, 480, 72),
        width: 800,
        height: 600,
        order: i,
      });
      continue;
    }

    const imgBuffer = decodeImagePayload(trimmed);
    if (!imgBuffer || imgBuffer.length === 0) {
      continue;
    }

    const [processedMain, processedThumb] = await Promise.all([
      processPostImage(imgBuffer),
      processPostThumbnail(imgBuffer),
    ]);

    const mainFileName = `post_${timestamp}_${i}.webp`;
    const thumbFileName = `post_${timestamp}_${i}_thumb.webp`;

    let mainUrl = '';
    let thumbUrl = '';

    try {
      const [mainDrive, thumbDrive] = await Promise.all([
        uploader({
          fileBuffer: processedMain.buffer,
          fileName: mainFileName,
          mimeType: 'image/webp',
          documentType: 'CAMPUS_MEDIA',
          isPublicMedia: true,
          accessToken: driveAccessToken,
          refreshToken: driveRefreshToken,
        }),
        uploader({
          fileBuffer: processedThumb.buffer,
          fileName: thumbFileName,
          mimeType: 'image/webp',
          documentType: 'CAMPUS_MEDIA',
          isPublicMedia: true,
          accessToken: driveAccessToken,
          refreshToken: driveRefreshToken,
        }),
      ]);

      mainUrl = resolveCompactDriveUrl(mainDrive, processedMain.buffer, mainFileName);
      thumbUrl = resolveCompactDriveUrl(thumbDrive, processedThumb.buffer, thumbFileName);
    } catch (uploadErr) {
      console.warn('[PostMedia Upload] Drive upload failed, using cached proxy fallback:', uploadErr);
      const baseId = `srec-${crypto.randomUUID().slice(0, 10)}`;
      mainUrl = persistFallbackMediaFile(`${baseId}-full`, processedMain.buffer, mainFileName);
      thumbUrl = persistFallbackMediaFile(`${baseId}-thumb`, processedThumb.buffer, thumbFileName);
    }

    results.push({
      url: mainUrl,
      thumbnailUrl: thumbUrl,
      width: processedMain.width,
      height: processedMain.height,
      order: i,
    });
  }

  return results;
}
