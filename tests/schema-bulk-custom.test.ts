import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import {
  canAccessAdminUsersApi,
  canAccessBulkImportApi,
  canExportCategory,
  canManageCategories,
  isWebManagerRestrictedRoute,
  resolveAchievementCardProof,
  toPrivateDocumentUrl,
} from '../src/lib/admin-auth';
import { GET as docGet } from '../src/app/api/drive/document/[id]/route';
import { getVisibleMenuGroups } from '../src/lib/rbac';
import {
  EVENT_TIMELINE_PRESETS,
  resolveTimelineDateRange,
  buildDateRangePrismaFilter,
} from '../src/lib/timeline';
import {
  buildMergedBatchOptions,
  parseBatchYearRange,
  getBatchLabel,
} from '../src/lib/studentHelper';
import {
  BulkImportRequestSchema,
  AchievementSubmitSchema,
  AdminAchievementsQuerySchema,
  AdminExportQuerySchema,
  CategoryDeleteSchema,
  IncidentCreateSchema,
  BugReportCreateSchema,
  AdminUserCreateSchema,
  EventCreateSchema,
  AnnouncementCreateSchema,
  PostCreateSchema,
  parseJsonBody,
} from '../src/lib/schemas';
import { GET as bulkImportGet, POST as bulkImportPost } from '../src/app/api/admin/users/bulk-import/route';
import {
  GET as categoriesGet,
  POST as categoriesPost,
  DELETE as categoriesDelete,
} from '../src/app/api/categories/route';
import { GET as batchesGet, POST as batchesPost, DELETE as batchesDelete } from '../src/app/api/batches/route';
import { POST as announcementPost } from '../src/app/api/announcements/route';
import { POST as eventCheckinPost } from '../src/app/api/events/[id]/checkin/route';
import { Role } from '@prisma/client';

describe('Bulk Upload Dept Isolation, Zod Call Schemas & Custom Category/Batch', () => {
  it('allows WEB_MANAGER department-scoped bulk upload while preserving /admin/users isolation', async () => {
    assert.equal(isWebManagerRestrictedRoute('/admin/bulk-upload'), false);
    assert.equal(isWebManagerRestrictedRoute('/admin/users'), true);
    assert.equal(canAccessBulkImportApi('WEB_MANAGER'), true);
    assert.equal(canAccessBulkImportApi('HOD'), true);
    assert.equal(canAccessBulkImportApi('SUPER_ADMIN'), true);
    assert.equal(canAccessBulkImportApi('FACULTY'), false);
    assert.equal(canAccessAdminUsersApi('WEB_MANAGER'), false);

    const wmMenu = getVisibleMenuGroups({
      userId: 'wm-1',
      role: Role.WEB_MANAGER,
      departmentId: 'dept-1',
    });
    assert.equal(wmMenu.includes('bulk-upload'), true);
    assert.equal(wmMenu.includes('users'), false);

    // Unauthenticated GET/POST bulk-import fail closed with 403
    const [resGet, resPost] = await Promise.all([
      bulkImportGet(),
      bulkImportPost(
        new NextRequest('http://localhost/api/admin/users/bulk-import', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'validate', rows: [{}] }),
        })
      ),
    ]);
    assert.equal(resGet.status, 403);
    assert.equal(resPost.status, 403);
  });

  it('validates API request schemas cleanly with Zod and blocks unauth spoofing', async () => {
    // Reject empty bulk rows
    const badBulk = BulkImportRequestSchema.safeParse({
      action: 'validate',
      type: 'STUDENT',
      rows: [],
    });
    assert.equal(badBulk.success, false);

    // Allow custom category name without existing categoryId on achievements & events
    const customAch = AchievementSubmitSchema.safeParse({
      title: 'Patent Granted in Edge AI',
      customCategoryName: 'Patent Innovation',
      organizationEventName: 'Indian Patent Office',
    });
    assert.equal(customAch.success, true);

    const customEvt = EventCreateSchema.safeParse({
      title: 'GenAI Sprint',
      customCategoryName: 'Agentic Bootcamp',
      startDate: '2026-12-01T09:00',
      endDate: '2026-12-01T17:00',
      venue: 'Auditorium',
    });
    assert.equal(customEvt.success, true);

    // Custom category on Grievance & Bug Report schemas
    const customIncident = IncidentCreateSchema.safeParse({
      title: 'Lab WiFi Drop',
      description: 'Lab WiFi disconnected during coding exam.',
      category: 'Network Infrastructure',
    });
    assert.equal(customIncident.success, true);

    const customBug = BugReportCreateSchema.safeParse({
      title: 'Chart overlap on mobile screen',
      description: 'The bar chart labels clip at 360px width on dark mode.',
      category: 'Analytics UI',
    });
    assert.equal(customBug.success, true);

    // Admin user schema accepts custom cohorts (unlisted batch)
    const customUser = AdminUserCreateSchema.safeParse({
      email: '26091a3201@srecnandyal.edu.in',
      name: 'New Batch Student',
      role: 'STUDENT',
      batch: '2026-2030',
      section: 'Honors',
    });
    assert.equal(customUser.success, true);

    // Post schema enforces max 2 images
    const badPost = PostCreateSchema.safeParse({
      content: 'Valid post',
      images: ['a', 'b', 'c'],
    });
    assert.equal(badPost.success, false);

    // Malformed JSON returns 400 cleanly via parseJsonBody
    const malformedReq = new NextRequest('http://localhost/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{invalid json',
    });
    const parsedBadJson = await parseJsonBody(malformedReq, AnnouncementCreateSchema);
    assert.equal(parsedBadJson.success, false);
    if (!parsedBadJson.success) assert.equal(parsedBadJson.response.status, 400);

    // Unauthenticated body-email spoofing blocked on /api/announcements & /api/events/[id]/checkin
    const spoofAnnRes = await announcementPost(
      new NextRequest('http://localhost/api/announcements', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Fake Notice',
          content: 'Spoof attempt',
          authorEmail: 'manibhushanam4k@gmail.com',
        }),
      })
    );
    assert.equal(spoofAnnRes.status, 401);

    const spoofCheckinRes = await eventCheckinPost(
      new NextRequest('http://localhost/api/events/ev-1/checkin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          rollNumber: '22091A3201',
          operatorEmail: 'manibhushanam4k@gmail.com',
        }),
      }),
      { params: Promise.resolve({ id: 'ev-1' }) }
    );
    assert.equal(spoofCheckinRes.status, 401);
  });

  it('parses custom batch ranges, merges cohort options, and exposes /api/batches & /api/categories auth guards', async () => {
    assert.deepEqual(parseBatchYearRange('2027-2031'), {
      name: '2027-2031',
      startYear: 2027,
      endYear: 2031,
    });
    assert.deepEqual(parseBatchYearRange('2026-30'), {
      name: '2026-2030',
      startYear: 2026,
      endYear: 2030,
    });

    const merged = buildMergedBatchOptions(['2019-2023', '2027-2031']);
    assert.ok(merged.some((o) => o.value === '2019-2023'));
    assert.ok(merged.some((o) => o.value === '2027-2031'));
    assert.equal(getBatchLabel('2019-2023'), '2019-2023 (Custom Cohort)');

    // GET /api/batches succeeds, unauth POST fails with 401
    const [bGet, bPost, cPost] = await Promise.all([
      batchesGet(),
      batchesPost(
        new NextRequest('http://localhost/api/batches', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: '2027-2031' }),
        })
      ),
      categoriesPost(
        new NextRequest('http://localhost/api/categories', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: 'Quantum Systems' }),
        })
      ),
    ]);
    assert.equal(bGet.status, 200);
    const bData = await bGet.json();
    assert.ok(Array.isArray(bData.batches) && bData.batches.length >= 7);
    assert.equal(bPost.status, 401);
    assert.equal(cPost.status, 401);
  });

  it('supports category deletion auth guard, timeline presets, and Web Manager+ achievement exports', async () => {
    // RBAC for category removal & multi-format achievement download
    assert.equal(canManageCategories('WEB_MANAGER'), true);
    assert.equal(canManageCategories('HOD'), true);
    assert.equal(canManageCategories('ADMIN'), true);
    assert.equal(canManageCategories('SUPER_ADMIN'), true);
    assert.equal(canManageCategories('FACULTY'), false);
    assert.equal(canManageCategories('STUDENT'), false);

    assert.equal(canExportCategory('WEB_MANAGER', 'ACHIEVEMENTS'), true);
    assert.equal(canExportCategory('WEB_MANAGER', 'EVENTS'), true);
    assert.equal(canExportCategory('HOD', 'ACHIEVEMENTS'), true);
    assert.equal(canExportCategory('HOD', 'EVENTS'), true);
    assert.equal(canExportCategory('SUPER_ADMIN', 'ACHIEVEMENTS'), true);
    assert.equal(canExportCategory('STUDENT', 'ACHIEVEMENTS'), false);
    assert.equal(canExportCategory('STUDENT', 'EVENTS'), false);

    // Event & Achievement timeline presets + custom date resolution
    assert.ok(EVENT_TIMELINE_PRESETS.some((p) => p.value === 'THIS_WEEK'));
    assert.ok(EVENT_TIMELINE_PRESETS.some((p) => p.value === 'NEXT_30_DAYS'));
    const fixedNow = new Date('2026-11-28T12:00:00.000Z');
    const thisWeek = resolveTimelineDateRange('THIS_WEEK', undefined, undefined, fixedNow);
    assert.equal(thisWeek.label, 'This Week');
    assert.ok(thisWeek.gte && thisWeek.lte && thisWeek.gte < thisWeek.lte);

    const next30 = resolveTimelineDateRange('NEXT_30_DAYS', undefined, undefined, fixedNow);
    assert.equal(next30.label, 'Next 30 Days');
    assert.equal(next30.gte?.toISOString().slice(0, 10), '2026-11-28');
    assert.equal(next30.lte?.toISOString().slice(0, 10), '2026-12-28');

    const last3 = resolveTimelineDateRange('LAST_3_MONTHS', undefined, undefined, fixedNow);
    assert.equal(last3.preset, 'LAST_3_MONTHS');
    assert.ok(last3.gte && last3.lte && last3.gte < last3.lte);

    const ay = resolveTimelineDateRange('CURRENT_ACADEMIC_YEAR', undefined, undefined, fixedNow);
    assert.equal(ay.label, 'AY 2026-2027');
    assert.equal(ay.gte?.toISOString().slice(0, 10), '2026-06-01');
    assert.equal(ay.lte?.toISOString().slice(0, 10), '2027-05-31');

    const customFilter = buildDateRangePrismaFilter('CUSTOM', '2026-01-01', '2026-06-30');
    assert.equal(customFilter?.gte?.toISOString().slice(0, 10), '2026-01-01');
    assert.equal(customFilter?.lte?.toISOString().slice(0, 10), '2026-06-30');

    // Schema validations for query & category delete
    assert.equal(
      AdminExportQuerySchema.safeParse({ category: 'ACHIEVEMENTS', format: 'xlsx', timeline: 'LAST_6_MONTHS', status: 'VERIFIED' }).success,
      true
    );
    assert.equal(
      AdminExportQuerySchema.safeParse({ category: 'EVENTS', format: 'csv', timeline: 'NEXT_30_DAYS', search: 'workshop' }).success,
      true
    );
    assert.equal(
      AdminExportQuerySchema.safeParse({ category: 'ACHIEVEMENTS', format: 'bad_fmt' }).success,
      false
    );
    assert.equal(
      AdminAchievementsQuerySchema.safeParse({ timeline: 'CUSTOM', dateFrom: 'bad-date' }).success,
      false
    );
    assert.equal(CategoryDeleteSchema.safeParse({}).success, false);
    assert.equal(CategoryDeleteSchema.safeParse({ id: 'cat-1' }).success, true);

    // Unauthenticated DELETE on /api/categories and /api/batches fails closed (401) + clean GET excludes [cite] rows
    const [cGet, cDel, bDel] = await Promise.all([
      categoriesGet(new NextRequest('http://localhost/api/categories?type=ACHIEVEMENT')),
      categoriesDelete(new NextRequest('http://localhost/api/categories?id=test-cat', { method: 'DELETE' })),
      batchesDelete(new NextRequest('http://localhost/api/batches?name=2027-2031', { method: 'DELETE' })),
    ]);
    assert.equal(cGet.status, 200);
    const cData = await cGet.json();
    assert.ok(Array.isArray(cData.categories) && cData.categories.length >= 10);
    assert.equal(cData.categories.some((c: any) => String(c.name).includes('[cite')), false);
    assert.equal(cDel.status, 401);
    assert.equal(bDel.status, 401);
  });

  it('normalizes achievement proof previews safely across guests, reviewers, and /api/drive/document/[id]', async () => {
    assert.equal(
      toPrivateDocumentUrl('https://drive.usercontent.google.com/download?id=12WteH3aWss9QIlIAcWxn_7&export=download'),
      '/api/drive/document/12WteH3aWss9QIlIAcWxn_7'
    );
    assert.equal(
      toPrivateDocumentUrl('https://lh3.googleusercontent.com/d/12WteH3aWss9QIlIAcWxn_7'),
      '/api/drive/document/12WteH3aWss9QIlIAcWxn_7'
    );
    assert.equal(
      toPrivateDocumentUrl('/api/drive/file/12WteH3aWss9QIlIAcWxn_7'),
      '/api/drive/document/12WteH3aWss9QIlIAcWxn_7'
    );

    const sampleAchievement = {
      googleDriveUrl: '/api/drive/file/12WteH3aWss9QIlIAcWxn_7-1L89lIPXd',
      certificateUrl: null,
      departmentId: 'dept-aiml',
      createdById: 'owner-1',
      primaryStudent: { userId: 'owner-1' },
      faculty: null,
      media: [],
    };

    // Unauthenticated guest: no raw Drive URL leaked, protected indicator enabled
    const guestProps = resolveAchievementCardProof(sampleAchievement, null);
    assert.equal(guestProps.visibleProofUrl, null);
    assert.equal(guestProps.hasPrivateProof, true);

    // Owner & same-dept HOD get authenticated /api/drive/document/[id] stream URL
    const ownerProps = resolveAchievementCardProof(sampleAchievement, {
      id: 'owner-1',
      role: 'STUDENT',
      departmentId: 'dept-aiml',
    });
    assert.equal(ownerProps.visibleProofUrl, '/api/drive/document/12WteH3aWss9QIlIAcWxn_7-1L89lIPXd');

    const hodProps = resolveAchievementCardProof(sampleAchievement, {
      id: 'hod-1',
      role: 'HOD',
      departmentId: 'dept-aiml',
    });
    assert.equal(hodProps.visibleProofUrl, '/api/drive/document/12WteH3aWss9QIlIAcWxn_7-1L89lIPXd');

    // Cross-dept HOD & WEB_MANAGER do not receive private student proof URL
    const wmProps = resolveAchievementCardProof(sampleAchievement, {
      id: 'wm-1',
      role: 'WEB_MANAGER',
      departmentId: 'dept-aiml',
    });
    assert.equal(wmProps.visibleProofUrl, null);

    // Unauthenticated /api/drive/document fails closed (401)
    const docRes = await docGet(new NextRequest('http://localhost/api/drive/document/12WteH3aWss9QIlIAcWxn_7'), {
      params: Promise.resolve({ id: '12WteH3aWss9QIlIAcWxn_7' }),
    });
    assert.equal(docRes.status, 401);
  });

  after(async () => {
    await prisma.$disconnect();
  });
});
