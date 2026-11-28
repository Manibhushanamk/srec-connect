import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import sharp from 'sharp';
import { prisma } from '../src/lib/prisma';
import {
  MAX_IMAGE_FILE_SIZE,
  THUMBNAIL_MAX_BYTES,
  processPostImage,
  processPostThumbnail,
} from '../src/lib/image-processor';
import { appendDriveResizeHints, isDataUriImage, resolveFeedMediaUrl } from '../src/lib/feed-media';
import { uploadPostMediaWithThumbnail } from '../src/lib/post-media-upload';
import { validatePostUpdatePayload } from '../src/lib/post-auth';
import { isPublicMediaDocumentType } from '../src/lib/drive';
import { GET as postsGet } from '../src/app/api/posts/route';
import { POST as uploadPost } from '../src/app/api/upload/route';

describe('Phase 4: Media Pipeline, Cursor Pagination & Feed Performance', () => {
  const createdTempFiles: string[] = [];

  it('Task 1: compresses WebP main + <= 80 KB WebP thumbnail via Sharp and stores compact Drive URLs (no Base64)', async () => {
    // Generate synthetic PNG test image buffer using Sharp
    const samplePng = await sharp({
      create: {
        width: 1400,
        height: 1050,
        channels: 3,
        background: { r: 27, g: 41, b: 53 },
      },
    })
      .png()
      .toBuffer();

    const [mainImg, thumbImg] = await Promise.all([
      processPostImage(samplePng),
      processPostThumbnail(samplePng),
    ]);

    assert.equal(mainImg.format, 'webp');
    assert.ok(mainImg.size <= MAX_IMAGE_FILE_SIZE, `Main WebP ${mainImg.size} exceeded 500 KB`);
    assert.equal(thumbImg.format, 'webp');
    assert.ok(thumbImg.size <= THUMBNAIL_MAX_BYTES, `Thumb WebP ${thumbImg.size} exceeded 80 KB`);
    assert.ok(thumbImg.width <= 480);

    // Upload pipeline test with Google Drive mock enforcing isPublicMedia=true
    const uploadedCalls: Array<{ fileName: string; mimeType: string; isPublicMedia?: boolean }> = [];
    const dataUriInput = `data:image/png;base64,${samplePng.toString('base64')}`;

    const mediaRecords = await uploadPostMediaWithThumbnail({
      rawImages: [dataUriInput],
      uploader: async (args) => {
        uploadedCalls.push({
          fileName: args.fileName,
          mimeType: args.mimeType,
          isPublicMedia: args.isPublicMedia,
        });
        const id = args.fileName.includes('_thumb') ? 'driveThumbId9876543210' : 'driveMainId9876543210';
        return {
          fileId: id,
          webViewLink: `https://drive.google.com/file/d/${id}/view`,
          webContentLink: `https://drive.google.com/uc?id=${id}`,
          directDisplayUrl: `/api/drive/file/${id}`,
          isPublicLink: true,
          storageProvider: 'GOOGLE_DRIVE',
        };
      },
    });

    assert.equal(mediaRecords.length, 1);
    assert.equal(uploadedCalls.length, 2);
    assert.ok(uploadedCalls.every((c) => c.mimeType === 'image/webp' && c.isPublicMedia === true));
    assert.equal(mediaRecords[0].url, '/api/drive/file/driveMainId9876543210');
    assert.equal(mediaRecords[0].thumbnailUrl, '/api/drive/file/driveThumbId9876543210');
    assert.equal(isDataUriImage(mediaRecords[0].thumbnailUrl), false);

    // Even under serverless DATA_URI Drive failure fallback, never write Base64 data:image into PostMedia.thumbnailUrl
    const fallbackRecords = await uploadPostMediaWithThumbnail({
      rawImages: [dataUriInput],
      uploader: async () => ({
        fileId: 'inline-fallback-id',
        webViewLink: 'data:image/webp;base64,AAAA',
        webContentLink: 'data:image/webp;base64,AAAA',
        directDisplayUrl: 'data:image/webp;base64,AAAA',
        isPublicLink: true,
        storageProvider: 'DATA_URI',
      }),
    });
    assert.equal(fallbackRecords.length, 1);
    assert.equal(isDataUriImage(fallbackRecords[0].url), false);
    assert.equal(isDataUriImage(fallbackRecords[0].thumbnailUrl), false);
    assert.ok(fallbackRecords[0].thumbnailUrl.startsWith('/api/drive/file/srec-'));

    // Track generated fallback disk artifacts for cleanup
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    for (const rec of fallbackRecords) {
      const id = rec.url.split('/').pop();
      const thumbId = rec.thumbnailUrl.split('/').pop();
      if (fs.existsSync(uploadsDir)) {
        for (const f of fs.readdirSync(uploadsDir)) {
          if ((id && f.startsWith(id)) || (thumbId && f.startsWith(thumbId))) {
            createdTempFiles.push(path.join(uploadsDir, f));
          }
        }
      }
    }
  });

  it('Task 1 & 2: strips legacy Base64 thumbnail bloat and delivers < 50 KB cursor-paginated feed', async () => {
    // Legacy Base64 read guard unit checks
    const giantBase64 = `data:image/webp;base64,${'A'.repeat(250_000)}`;
    assert.equal(
      resolveFeedMediaUrl({ url: '/api/drive/file/driveAbc123', thumbnailUrl: giantBase64 }),
      '/api/drive/file/driveAbc123?w=900&q=80'
    );
    assert.equal(
      resolveFeedMediaUrl({ url: giantBase64, thumbnailUrl: giantBase64 }),
      null
    );
    assert.equal(
      appendDriveResizeHints('/api/drive/file/xyz123', 480, 72),
      '/api/drive/file/xyz123?w=480&q=72'
    );

    // Profile avatar documentType stays public-media Drive scoped & upload route blocks unauthenticated requests
    assert.equal(isPublicMediaDocumentType('PROFILE_AVATAR'), true);
    const unauthUpload = await uploadPost(
      new NextRequest('http://localhost/api/upload', { method: 'POST' })
    );
    assert.equal(unauthUpload.status, 401);

    // Patch payload validation accepts both Drive URLs and inline WebP uploads
    assert.equal(
      validatePostUpdatePayload({
        content: 'Updated with crisp WebP image',
        images: ['data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA='],
      }).valid,
      true
    );

    // Live GET /api/posts?take=10 payload budget + timing test on v3_production
    const t0 = performance.now();
    const page1Res = await postsGet(new NextRequest('http://localhost/api/posts?take=10'));
    const t1 = performance.now();
    assert.equal(page1Res.status, 200);

    const rawJson = await page1Res.text();
    const payloadBytes = Buffer.byteLength(rawJson, 'utf8');
    const page1 = JSON.parse(rawJson);

    console.log(
      `[Phase 4 Feed Benchmark] 10-post GET /api/posts payload=${payloadBytes} bytes, latency=${Math.round(t1 - t0)}ms, count=${page1.posts?.length ?? 0}`
    );

    assert.ok(Array.isArray(page1.posts));
    assert.ok(payloadBytes < 50 * 1024, `10-post feed JSON payload (${payloadBytes} bytes) exceeded 50 KB budget`);
    assert.equal(rawJson.includes('data:image/'), false, 'Feed list payload must never contain inline data:image/ Base64 strings');

    // Cursor pagination without duplicates
    const p1Res = await postsGet(new NextRequest('http://localhost/api/posts?take=2'));
    assert.equal(p1Res.status, 200);
    const p1Data = await p1Res.json();
    assert.ok(p1Data.posts.length <= 2);

    if (p1Data.hasMore && p1Data.nextCursor) {
      const p2Res = await postsGet(
        new NextRequest(`http://localhost/api/posts?take=2&cursor=${encodeURIComponent(p1Data.nextCursor)}`)
      );
      assert.equal(p2Res.status, 200);
      const p2Data = await p2Res.json();
      const ids1 = new Set(p1Data.posts.map((p: any) => p.id));
      for (const p of p2Data.posts) {
        assert.equal(ids1.has(p.id), false, `Cursor pagination returned duplicate post ID: ${p.id}`);
      }
    }
  });

  after(async () => {
    for (const filePath of createdTempFiles) {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {
        // ignore cleanup error
      }
    }
    await prisma.$disconnect();
  });
});
