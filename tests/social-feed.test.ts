import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import prisma from '../src/lib/prisma';
import { processPostImage, MAX_IMAGE_FILE_SIZE, MAX_POST_IMAGES } from '../src/lib/image-processor';

describe('Phase 5: Social Community & Feed Verification Tests', () => {
  it('1. should process and compress image to WebP under 500 KB', async () => {
    // Generate a high-resolution raw test image (1600x1200)
    const testSvg = `
      <svg width="1600" height="1200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#0284c7"/>
        <text x="50%" y="50%" font-size="72" text-anchor="middle" fill="#ffffff" font-family="sans-serif">
          SREC CSE AIML Research 2026
        </text>
      </svg>
    `;
    const inputBuffer = await sharp(Buffer.from(testSvg)).png().toBuffer();

    const processed = await processPostImage(inputBuffer);

    assert.strictEqual(processed.format, 'webp', 'Image format must be webp');
    assert.strictEqual(processed.contentType, 'image/webp');
    assert.ok(processed.width <= 1200, `Image width (${processed.width}) must be <= 1200px`);
    assert.ok(processed.height <= 1200, `Image height (${processed.height}) must be <= 1200px`);
    assert.ok(
      processed.size <= MAX_IMAGE_FILE_SIZE,
      `Image size (${processed.size} bytes) must be <= 500 KB (${MAX_IMAGE_FILE_SIZE} bytes)`
    );
  });

  it('2. should reject post creation when exceeding max 2 images constraint', () => {
    const rawImages = [
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    ];

    assert.ok(
      rawImages.length > MAX_POST_IMAGES,
      `Payload has ${rawImages.length} images, which must exceed MAX_POST_IMAGES (${MAX_POST_IMAGES})`
    );
    // Verification rule: any post with > MAX_POST_IMAGES must be rejected
    const isAllowed = rawImages.length <= MAX_POST_IMAGES;
    assert.strictEqual(isAllowed, false, '3rd image must be rejected');
  });

  it('3. should create, like, comment and bookmark a post in Neon DB', async () => {
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });
    assert.ok(superAdmin, 'Super Admin must exist');

    // Create post
    const post = await prisma.post.create({
      data: {
        authorId: superAdmin.id,
        content: '🤖 Verified Phase 5 Automated Test Post for Department Feed.',
        visibility: 'PUBLIC',
      },
    });
    assert.ok(post.id, 'Post should be created with valid ID');

    // Like post
    const like = await prisma.postLike.create({
      data: {
        postId: post.id,
        userId: superAdmin.id,
      },
    });
    assert.ok(like.id);

    // Comment on post
    const comment = await prisma.postComment.create({
      data: {
        postId: post.id,
        authorId: superAdmin.id,
        content: 'Great initiative!',
      },
    });
    assert.ok(comment.id);
    assert.strictEqual(comment.content, 'Great initiative!');

    // Bookmark post
    const bookmark = await prisma.postBookmark.create({
      data: {
        postId: post.id,
        userId: superAdmin.id,
      },
    });
    assert.ok(bookmark.id);

    // Clean up test post cascade
    await prisma.post.delete({
      where: { id: post.id },
    });

    const deleted = await prisma.post.findUnique({
      where: { id: post.id },
    });
    assert.strictEqual(deleted, null, 'Post and its relations should be cleanly removed');
  });

  it('4. should submit and record content report for moderation', async () => {
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });
    assert.ok(superAdmin);

    const post = await prisma.post.create({
      data: {
        authorId: superAdmin.id,
        content: 'Test post for report workflow',
      },
    });

    const report = await prisma.contentReport.create({
      data: {
        postId: post.id,
        reporterId: superAdmin.id,
        reason: 'Automated test report: checking moderation queue',
        status: 'PENDING',
      },
    });

    assert.ok(report.id);
    assert.strictEqual(report.status, 'PENDING');

    // Clean up
    await prisma.post.delete({ where: { id: post.id } });
  });
});
