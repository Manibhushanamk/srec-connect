import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDriveClient } from '@/lib/drive';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params;
  if (!fileId) {
    return new NextResponse('File ID is required', { status: 400 });
  }

  // 1. If it's an R2 key or prefixed with r2-
  if (fileId.startsWith('r2-')) {
    const r2Key = fileId.replace(/^r2-/, '');
    const publicDomain = process.env.R2_PUBLIC_DOMAIN || '';
    if (publicDomain) {
      return NextResponse.redirect(`${publicDomain}/${r2Key}`);
    }
  }

  // 2. If it's a local fallback or mock ID
  if (fileId.startsWith('srec-') || fileId.startsWith('drive-srec-')) {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const match = files.find((f) => f.includes(fileId));
      if (match) {
        return NextResponse.redirect(new URL(`/uploads/${match}`, req.url));
      }
    }
  }

  // 3. Google Drive Direct Streaming
  try {
    const drive = await getAuthenticatedDriveClient();
    if (!drive) {
      return new NextResponse('Drive storage client unauthenticated', { status: 503 });
    }

    // Fetch file metadata
    const meta = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size',
    });

    const mimeType = meta.data.mimeType || 'application/octet-stream';
    const fileName = meta.data.name || 'document';

    // Fetch file media stream
    const fileRes = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    const nodeStream = fileRes.data as Readable;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.warn(`[Drive Direct Stream] Drive fetch failed for ${fileId}:`, err?.message || err);
    // If local file exists with this name, fallback to local
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const match = files.find((f) => f.includes(fileId));
      if (match) {
        return NextResponse.redirect(new URL(`/uploads/${match}`, req.url));
      }
    }
    return new NextResponse('File not found or inaccessible in Google Drive', { status: 404 });
  }
}
