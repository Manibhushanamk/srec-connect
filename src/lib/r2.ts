/**
 * Deprecated / Decommissioned Storage Module:
 * Cloudflare R2 and AWS S3 have been superseded by Institutional Google Drive.
 * All media, student proofs, and faculty records are stored exclusively in Google Drive.
 */

import { uploadCertificateToDrive } from './drive';

export async function uploadToR2(
  key: string,
  body: Buffer | ReadableStream | Blob,
  contentType: string
): Promise<string> {
  let fileBuffer: Buffer;
  if (Buffer.isBuffer(body)) {
    fileBuffer = body;
  } else if (body instanceof Blob) {
    const arrayBuffer = await body.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } else {
    fileBuffer = Buffer.from(body as any);
  }

  const result = await uploadCertificateToDrive({
    fileBuffer,
    fileName: key.split('/').pop() || `media_${Date.now()}`,
    mimeType: contentType || 'application/octet-stream',
    documentType: 'CAMPUS_MEDIA',
  });

  return result.directDisplayUrl || result.webViewLink;
}

export async function deleteFromR2(_key: string): Promise<void> {
  // No-op: Managed via Google Drive
}

export function generateR2Key(prefix: string, fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = fileName.split('.').pop() || '';
  const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '');
  return `${prefix}/${timestamp}-${random}-${baseName}.${ext}`;
}

export function getPublicUrl(key: string): string {
  return `/api/drive/file/${key}`;
}
