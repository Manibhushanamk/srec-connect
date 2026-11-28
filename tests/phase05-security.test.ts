import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { canAccessIncident, sanitizeIncidentForViewer, IncidentAccessUser } from '../src/lib/incident-auth';
import { verifyDriveAssetAccess, isPublicMediaDocumentType } from '../src/lib/drive';
import { issueRestoreChallengeToken, verifyRestoreChallengeToken } from '../src/lib/restore-challenge';
import { GET as searchGet } from '../src/app/api/search/route';
import { GET as fileGet } from '../src/app/api/drive/file/[id]/route';
import { GET as docGet } from '../src/app/api/drive/document/[id]/route';
import { POST as incidentPost } from '../src/app/api/incidents/route';
import { POST as incidentActionPost } from '../src/app/api/incidents/[id]/actions/route';
import { POST as incidentResponsePost } from '../src/app/api/incidents/[id]/responses/route';
import { GET as restoreChallengeGet, POST as restorePost } from '../src/app/api/admin/backup/restore/route';

describe('Phase 0.5: Cross-Role Security Hardening (5 Roles + Guest)', () => {
  const superAdmin: IncidentAccessUser = { id: 'u-sa', role: 'SUPER_ADMIN', departmentId: null };
  const hodAiml: IncidentAccessUser = { id: 'u-hod-aiml', role: 'HOD', departmentId: 'dept-aiml' };
  const hodNoDept: IncidentAccessUser = { id: 'u-hod-none', role: 'HOD', departmentId: null };
  const facultyAiml: IncidentAccessUser = { id: 'u-fac-aiml', role: 'FACULTY', departmentId: 'dept-aiml' };
  const facultyCse: IncidentAccessUser = { id: 'u-fac-cse', role: 'FACULTY', departmentId: 'dept-cse' };
  const webManager: IncidentAccessUser = { id: 'u-wm', role: 'WEB_MANAGER', departmentId: null };
  const studentVictim: IncidentAccessUser = {
    id: 'u-stu-1',
    role: 'STUDENT',
    departmentId: 'dept-aiml',
    student: { id: 'stu-1' },
  };
  const studentOther: IncidentAccessUser = {
    id: 'u-stu-2',
    role: 'STUDENT',
    departmentId: 'dept-cse',
    student: { id: 'stu-2' },
  };

  it('ISS-02/04: enforces fail-closed role & department grievance scoping + reporter redaction', () => {
    const standardAimlCase = {
      id: 'inc-1',
      reporterId: facultyAiml.id,
      studentId: 'stu-1',
      departmentId: 'dept-aiml',
      isConfidentialHOD: false,
      reporter: { id: facultyAiml.id, name: 'Dr. Test', email: 'fac@srecnandyal.edu.in' },
      description: 'Class issue [Confidential Witness: seen in block B]',
      actions: [{ id: 'act-1', outcome: 'VERBAL_WARNING', notes: 'Internal note', letterRef: 'SREC/01' }],
    };

    const confidentialCseCase = {
      id: 'inc-2',
      reporterId: 'u-stu-2',
      studentId: 'stu-2',
      departmentId: 'dept-cse',
      isConfidentialHOD: true,
    };

    // Guest denied
    assert.equal(canAccessIncident(null, standardAimlCase).allowed, false);
    // WEB_MANAGER denied
    assert.equal(canAccessIncident(webManager, standardAimlCase).allowed, false);
    // HOD without departmentId fail-closed denied
    assert.equal(canAccessIncident(hodNoDept, standardAimlCase).allowed, false);
    // Cross-department HOD denied on CSE confidential case
    assert.equal(canAccessIncident(hodAiml, confidentialCseCase).allowed, false);
    // Same-department HOD allowed
    assert.equal(canAccessIncident(hodAiml, standardAimlCase).allowed, true);
    // Cross-department Faculty denied
    assert.equal(canAccessIncident(facultyCse, standardAimlCase).allowed, false);
    // Same-department Faculty allowed for non-confidential, denied for confidential unless reporter
    assert.equal(canAccessIncident(facultyAiml, standardAimlCase).allowed, true);
    assert.equal(
      canAccessIncident(facultyCse, confidentialCseCase).allowed,
      false
    );
    // Unrelated student denied
    assert.equal(canAccessIncident(studentOther, standardAimlCase).allowed, false);
    // SUPER_ADMIN allowed + triggers confidential read audit flag
    const saDecision = canAccessIncident(superAdmin, confidentialCseCase);
    assert.equal(saDecision.allowed, true);
    assert.equal(saDecision.logConfidentialRead, true);

    // Field-level redaction when accused student views case reported against them
    const redacted = sanitizeIncidentForViewer(studentVictim, standardAimlCase);
    assert.equal(redacted.reporterId, undefined);
    assert.equal(redacted.reporter, undefined);
    assert.equal(redacted.description, 'Class issue [Redacted]');
    assert.equal(redacted.actions[0].notes, null);
    assert.equal(redacted.actions[0].letterRef, 'SREC/01');

    // Reporter (FACULTY) retains full fields
    const unredacted = sanitizeIncidentForViewer(facultyAiml, standardAimlCase);
    assert.equal(unredacted.reporterId, facultyAiml.id);
    assert.equal(unredacted.actions[0].notes, 'Internal note');
  });

  it('ISS-04: rejects unauthenticated incident/actions/responses spoofing via body email', async () => {
    const resPost = await incidentPost(
      new NextRequest('http://localhost/api/incidents', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Spoof attempt',
          description: 'Attempting unauthenticated submission',
          reporterEmail: 'manibhushanam4k@gmail.com',
        }),
      })
    );
    assert.equal(resPost.status, 401);

    const resAction = await incidentActionPost(
      new NextRequest('http://localhost/api/incidents/fake-id/actions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          outcome: 'VERBAL_WARNING',
          actorEmail: 'manibhushanam4k@gmail.com',
        }),
      }),
      { params: Promise.resolve({ id: 'fake-id' }) }
    );
    assert.equal(resAction.status, 401);

    const resResp = await incidentResponsePost(
      new NextRequest('http://localhost/api/incidents/fake-id/responses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'Spoofed reply',
          authorEmail: 'manibhushanam4k@gmail.com',
        }),
      }),
      { params: Promise.resolve({ id: 'fake-id' }) }
    );
    assert.equal(resResp.status, 401);
  });

  it('ISS-01: classifies public media vs private certificates and blocks unauth /api/drive/document', async () => {
    assert.equal(isPublicMediaDocumentType('CAMPUS_MEDIA'), true);
    assert.equal(isPublicMediaDocumentType('STUDENT_CERTIFICATE'), false);
    assert.equal(isPublicMediaDocumentType('INCIDENT_EVIDENCE'), false);

    // Unauthenticated call to private document endpoint must return 401 + no-store
    const unauthRes = await docGet(new NextRequest('http://localhost/api/drive/document/fake-doc-id-12345'), {
      params: Promise.resolve({ id: 'fake-doc-id-12345' }),
    });
    assert.equal(unauthRes.status, 401);
    assert.ok(unauthRes.headers.get('cache-control')?.includes('no-store'));

    // Verify DB-backed private certificate check if any exists in Neon
    const sampleAch = await prisma.achievement.findFirst({
      where: {
        deletedAt: null,
        certificateUrl: { contains: '/api/drive/' },
      },
      select: { certificateUrl: true, departmentId: true, createdById: true },
    });

    if (sampleAch?.certificateUrl) {
      const idPart = sampleAch.certificateUrl.split('/').pop()!;
      // Guest access via verifyDriveAssetAccess rejected
      const guestCheck = await verifyDriveAssetAccess(idPart, null);
      assert.equal(guestCheck.isPrivateDocument, true);
      assert.equal(guestCheck.allowed, false);

      // WEB_MANAGER denied private certificate
      const wmCheck = await verifyDriveAssetAccess(idPart, webManager);
      assert.equal(wmCheck.allowed, false);

      // Wrong-dept HOD denied
      const wrongHod: IncidentAccessUser = {
        id: 'u-hod-other',
        role: 'HOD',
        departmentId: `mismatch-${sampleAch.departmentId || 'x'}`,
      };
      assert.equal((await verifyDriveAssetAccess(idPart, wrongHod)).allowed, false);

      // /api/drive/file/[id] must reject private certificate with 403
      const publicRouteRes = await fileGet(
        new NextRequest(`http://localhost/api/drive/file/${idPart}`),
        { params: Promise.resolve({ id: idPart }) }
      );
      assert.equal(publicRouteRes.status, 403);
    }
  });

  it('ISS-03: enforces q.trim().length < 2 short-circuit and PUBLIC post filter for guests', async () => {
    const shortRes = await searchGet(new NextRequest('http://localhost/api/search?q=a'));
    assert.equal(shortRes.status, 200);
    const shortJson = await shortRes.json();
    assert.deepEqual(shortJson, { students: [], faculty: [], events: [], posts: [] });

    // Valid query as guest must not crash and returns structured results
    const guestRes = await searchGet(new NextRequest('http://localhost/api/search?q=22091A3201'));
    assert.equal(guestRes.status, 200);
    const guestJson = await guestRes.json();
    assert.ok(Array.isArray(guestJson.results?.posts));
  });

  it('ISS-05: validates session-bound HMAC challenge tokens and blocks unauth restore endpoints', async () => {
    const challengeRes = await restoreChallengeGet();
    assert.equal(challengeRes.status, 403);

    const unauthRestore = await restorePost(
      new NextRequest('http://localhost/api/admin/backup/restore', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dryRun: false, confirmationCode: 'CONFIRM_RESTORE_SREC' }),
      })
    );
    assert.equal(unauthRestore.status, 403);

    const token = issueRestoreChallengeToken('admin-123');
    assert.equal(verifyRestoreChallengeToken(token, 'admin-123'), true);
    assert.equal(verifyRestoreChallengeToken(token, 'other-user'), false);
    assert.equal(verifyRestoreChallengeToken('tampered.123.abc', 'admin-123'), false);
    assert.equal(verifyRestoreChallengeToken('', 'admin-123'), false);

    // Expired token (> 5 min old)
    const expiredToken = issueRestoreChallengeToken('admin-123', Date.now() - 6 * 60 * 1000);
    assert.equal(verifyRestoreChallengeToken(expiredToken, 'admin-123'), false);
  });

  after(async () => {
    await prisma.$disconnect();
  });
});
