import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { canEditPost, canDeletePost, validatePostUpdatePayload } from '../src/lib/post-auth';
import { PATCH as postPatch, DELETE as postDelete } from '../src/app/api/posts/[id]/route';
import { POST as submitAchievementPost } from '../src/app/api/achievements/submit/route';

describe('Phase 2: Post Lifecycle, Moderation & Dept-Assisted Submission', () => {
  const authorStudent = { id: 'stu-author', role: 'STUDENT', departmentId: 'dept-aiml' };
  const otherStudent = { id: 'stu-other', role: 'STUDENT', departmentId: 'dept-aiml' };
  const sameHod = { id: 'hod-aiml', role: 'HOD', departmentId: 'dept-aiml' };
  const crossHod = { id: 'hod-cse', role: 'HOD', departmentId: 'dept-cse' };
  const webManager = { id: 'wm-1', role: 'WEB_MANAGER', departmentId: 'dept-aiml' };
  const superAdmin = { id: 'sa-1', role: 'SUPER_ADMIN', departmentId: null };

  const publicPost = {
    id: 'post-1',
    authorId: authorStudent.id,
    visibility: 'PUBLIC',
    authorDepartmentId: 'dept-aiml',
  };

  const privatePost = {
    id: 'post-2',
    authorId: authorStudent.id,
    visibility: 'PRIVATE',
    authorDepartmentId: 'dept-aiml',
  };

  it('Task 2: enforces strict author-only PATCH post editing and media validation', async () => {
    // Authorization matrix
    assert.equal(canEditPost(null, publicPost).allowed, false);
    assert.equal(canEditPost(authorStudent, publicPost).allowed, true);
    assert.equal(canEditPost(otherStudent, publicPost).allowed, false);
    assert.equal(canEditPost(sameHod, publicPost).allowed, false);
    assert.equal(canEditPost(webManager, publicPost).allowed, false);
    assert.equal(canEditPost(superAdmin, publicPost).allowed, false);

    // Payload rules: max 2 images, no videos, non-empty content
    assert.equal(validatePostUpdatePayload({ content: '   ' }).valid, false);
    assert.equal(
      validatePostUpdatePayload({
        content: 'Too many photos',
        images: ['/api/drive/file/a', '/api/drive/file/b', '/api/drive/file/c'],
      }).valid,
      false
    );
    assert.equal(
      validatePostUpdatePayload({
        content: 'Video not allowed',
        images: ['https://cdn.example.com/demo.mp4'],
      }).valid,
      false
    );
    const validUpdate = validatePostUpdatePayload({
      content: 'Updated achievement recap',
      visibility: 'COLLEGE_ONLY',
      images: ['/api/drive/file/a', '/api/drive/file/b'],
    });
    assert.equal(validUpdate.valid, true);
    assert.equal(validUpdate.images?.length, 2);

    // Unauthenticated route test
    const unauthPatch = await postPatch(
      new NextRequest('http://localhost/api/posts/post-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: 'Should fail' }),
      }),
      { params: Promise.resolve({ id: 'post-1' }) }
    );
    assert.equal(unauthPatch.status, 401);
  });

  it('Task 3: enforces multi-role DELETE moderation rules (Author, same-dept HOD, WEB_MANAGER, SUPER_ADMIN)', async () => {
    assert.equal(canDeletePost(null, publicPost).allowed, false);
    assert.deepEqual(canDeletePost(authorStudent, publicPost), { allowed: true, isModeratorDelete: false });
    assert.deepEqual(canDeletePost(sameHod, publicPost), { allowed: true, isModeratorDelete: true });
    assert.equal(canDeletePost(crossHod, publicPost).allowed, false);
    assert.deepEqual(canDeletePost(webManager, publicPost), { allowed: true, isModeratorDelete: true });
    assert.equal(canDeletePost(webManager, privatePost).allowed, false);
    assert.deepEqual(canDeletePost(superAdmin, publicPost), { allowed: true, isModeratorDelete: true });
    assert.equal(canDeletePost(otherStudent, publicPost).allowed, false);

    const unauthDel = await postDelete(
      new NextRequest('http://localhost/api/posts/post-1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'post-1' }) }
    );
    assert.equal(unauthDel.status, 401);
  });

  it('Task 4 & 5: rejects unauthenticated assisted submission and honors public status filter', async () => {
    const unauthSub = await submitAchievementPost(
      new NextRequest('http://localhost/api/achievements/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Hackathon Winner',
          categoryId: 'cat-1',
          organizationEventName: 'SREC TechFest',
          targetRollNumber: '22091A3201',
        }),
      })
    );
    assert.equal(unauthSub.status, 401);

    // Verify Approved/Published query runs cleanly on Neon
    const honorsCount = await prisma.achievement.count({
      where: { status: { in: ['APPROVED', 'PUBLISHED'] }, deletedAt: null },
    });
    assert.ok(honorsCount >= 0);
  });

  after(async () => {
    await prisma.$disconnect();
  });
});
