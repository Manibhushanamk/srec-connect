import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN!;

export async function uploadToR2(
  key: string,
  body: Buffer | ReadableStream | Blob,
  contentType: string,
  options?: { cacheControl?: string }
): Promise<string> {
  await r2Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body as any,
    ContentType: contentType,
    CacheControl: options?.cacheControl || 'public, max-age=31536000, immutable',
  }));
  
  return `${PUBLIC_DOMAIN}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });
  const publicUrl = `${PUBLIC_DOMAIN}/${key}`;
  
  return { uploadUrl, publicUrl };
}

export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  
  return getSignedUrl(r2Client, command, { expiresIn });
}

export function generateR2Key(prefix: string, fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = fileName.split('.').pop() || '';
  const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '');
  return `${prefix}/${timestamp}-${random}-${baseName}.${ext}`;
}

export function getPublicUrl(key: string): string {
  return `${PUBLIC_DOMAIN}/${key}`;
}