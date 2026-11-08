import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME || 'srec';
const r2PublicDomain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-e7d8279877684f24b897c56ddb84f5d2.r2.dev';

let s3Client: S3Client | null = null;

if (r2AccountId && r2AccessKeyId && r2SecretAccessKey) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });
}

export async function uploadToR2(
  buffer: Buffer,
  originalFilename: string,
  contentType: string
): Promise<{ url: string; fileName: string; fileSize: number }> {
  const ext = originalFilename.split('.').pop() || 'bin';
  const fileName = `${randomUUID()}.${ext}`;

  if (!s3Client) {
    console.warn('R2 credentials not set. Returning mock upload URL.');
    return {
      url: `/uploads/${fileName}`,
      fileName,
      fileSize: buffer.length,
    };
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: r2BucketName,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const url = `${r2PublicDomain.replace(/\/$/, '')}/${fileName}`;
  return {
    url,
    fileName,
    fileSize: buffer.length,
  };
}
