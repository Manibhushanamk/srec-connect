import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '../src/lib/prisma';
import {
  IQAC_EXPORT_NOTICE,
  JNTUA_5A_NOTICE,
  canAccessAdminUsersApi,
  canAccessBulkImportApi,
  canExportCategory,
  isWebManagerRestrictedRoute,
  resolveScopedDepartmentId,
  toPrivateDocumentUrl,
  validateAchievementTransition,
} from '../src/lib/admin-auth';
import {
  canManageTargetUser,
  getAllowedAssignableRoles,
  getVisibleMenuGroups,
} from '../src/lib/rbac';
import { generateExcelBuffer } from '../src/lib/exportHelper';
import { isLateralEntryRoll, parseRollNumber } from '../src/lib/studentHelper';
import {
  GET as achievementsGet,
  PATCH as achievementsPatch,
  DELETE as achievementsDelete,
} from '../src/app/api/admin/achievements/route';
import {
  GET as usersGet,
  POST as usersPost,
  PATCH as usersPatch,
  DELETE as usersDelete,
} from '../src/app/api/admin/users/route';
import { GET as analyticsGet } from '../src/app/api/admin/analytics/route';
import { GET as exportGet } from '../src/app/api/admin/export/route';
import { POST as bulkImportPost } from '../src/app/api/admin/users/bulk-import/route';
import { Role } from '@prisma/client';

describe('Phase 3: Institutional Admin Console, Split-Screen Desk & RBAC Isolation', () => {
  it('Task 1: enforces mandatory reasons (400) for REJECTED / RESUBMISSION_REQUIRED and blocks self-approval (403)', async () => {
    // Missing/blank rejectionReason must fail with HTTP 400 for REJECTED and RESUBMISSION_REQUIRED
    const emptyReject = validateAchievementTransition({
      status: 'REJECTED',
      rejectionReason: '   ',
      actorId: 'fac-1',
      actorRole: 'FACULTY',
      createdById: 'stu-1',
    });
    assert.equal(emptyReject.valid, false);
    if (!emptyReject.valid) assert.equal(emptyReject.httpStatus, 400);

    const emptyResubmit = validateAchievementTransition({
      status: 'RESUBMISSION_REQUIRED',
      rejectionReason: '',
      actorId: 'fac-1',
      actorRole: 'FACULTY',
      createdById: 'stu-1',
    });
    assert.equal(emptyResubmit.valid, false);
    if (!emptyResubmit.valid) assert.equal(emptyResubmit.httpStatus, 400);

    // Valid non-empty reasons pass transition validation
    const validReject = validateAchievementTransition({
      status: 'REJECTED',
      rejectionReason: 'Certificate verification QR missing.',
      actorId: 'fac-1',
      actorRole: 'FACULTY',
      createdById: 'stu-1',
    });
    assert.deepEqual(validReject, {
      valid: true,
      status: 'REJECTED',
      sanitizedReason: 'Certificate verification QR missing.',
    });

    const validResubmit = validateAchievementTransition({
      status: 'RESUBMISSION_REQUIRED',
      rejectionReason: 'Please upload high-resolution PDF copy.',
      actorId: 'hod-1',
      actorRole: 'HOD',
      createdById: 'stu-1',
    });
    assert.deepEqual(validResubmit, {
      valid: true,
      status: 'RESUBMISSION_REQUIRED',
      sanitizedReason: 'Please upload high-resolution PDF copy.',
    });

    // Self-approval blocked for FACULTY/HOD/WEB_MANAGER, exempt for SUPER_ADMIN
    const selfHodApprove = validateAchievementTransition({
      status: 'PUBLISHED',
      actorId: 'hod-1',
      actorRole: 'HOD',
      createdById: 'hod-1',
    });
    assert.equal(selfHodApprove.valid, false);
    if (!selfHodApprove.valid) assert.equal(selfHodApprove.httpStatus, 403);

    const selfSuperApprove = validateAchievementTransition({
      status: 'PUBLISHED',
      actorId: 'sa-1',
      actorRole: 'SUPER_ADMIN',
      createdById: 'sa-1',
    });
    assert.equal(selfSuperApprove.valid, true);

    // Certificate URLs normalize to private /api/drive/document/[id] stream
    assert.equal(toPrivateDocumentUrl('/api/drive/file/file123'), '/api/drive/document/file123');
    assert.equal(
      toPrivateDocumentUrl('https://drive.google.com/file/d/driveDoc99/view?usp=sharing'),
      '/api/drive/document/driveDoc99'
    );
    assert.equal(toPrivateDocumentUrl('/api/drive/document/alreadyPrivate'), '/api/drive/document/alreadyPrivate');

    // Unauthenticated route handler checks
    const [rGet, rPatch, rDel] = await Promise.all([
      achievementsGet(new NextRequest('http://localhost/api/admin/achievements')),
      achievementsPatch(
        new NextRequest('http://localhost/api/admin/achievements', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: 'ach-1', status: 'REJECTED' }),
        })
      ),
      achievementsDelete(
        new NextRequest('http://localhost/api/admin/achievements', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: 'ach-1' }),
        })
      ),
    ]);
    assert.equal(rGet.status, 401);
    assert.equal(rPatch.status, 401);
    assert.equal(rDel.status, 401);
  });

  it('Task 2: enforces fail-closed HOD department scoping, JNTUA 5A tagging, and IQAC notices in Excel exports', async () => {
    // Non-Super-Admin roles ignore query parameter tampering and fail closed on missing departmentId
    assert.equal(resolveScopedDepartmentId('HOD', 'dept-aiml', 'dept-cse'), 'dept-aiml');
    assert.equal(resolveScopedDepartmentId('HOD', 'dept-aiml', 'ALL'), 'dept-aiml');
    assert.equal(resolveScopedDepartmentId('HOD', null, 'dept-cse'), 'no_department_bound');
    assert.equal(resolveScopedDepartmentId('FACULTY', null, 'ALL'), 'no_department_bound');
    assert.equal(resolveScopedDepartmentId('SUPER_ADMIN', null, 'ALL'), null);
    assert.equal(resolveScopedDepartmentId('SUPER_ADMIN', null, 'dept-cse'), 'dept-cse');

    // Export category authorization
    assert.equal(canExportCategory('HOD', 'INCIDENTS'), true);
    assert.equal(canExportCategory('WEB_MANAGER', 'INCIDENTS'), false);
    assert.equal(canExportCategory('WEB_MANAGER', 'STUDENTS'), false);
    assert.equal(canExportCategory('WEB_MANAGER', 'ACHIEVEMENTS'), true);
    assert.equal(canExportCategory('FACULTY', 'COMPLETE_INSTITUTIONAL_DUMP'), false);

    // JNTUA 5A lateral entry verification rule
    assert.equal(isLateralEntryRoll('25X55A3306'), true);
    assert.equal(isLateralEntryRoll('24091A3201'), false);
    const parsedLateral = parseRollNumber('25095A3206');
    assert.equal(parsedLateral.isLateralEntry, true);
    assert.equal(parsedLateral.batchYear, '2024-2028');

    // Multi-sheet XLSX generation includes IQAC & JNTUA 5A notices and strips legacy v3.0 labels
    const xlsxBuffer = generateExcelBuffer(
      {
        departmentCode: 'AIML',
        departmentName: 'CSE (AI & ML) (AIML)',
        academicYear: '2025-2026',
        generatedBy: 'Dr. HOD (HOD)',
        achievements: [
          {
            id: 'ach-test-1',
            title: 'National AI Hackathon Winner',
            personName: 'Mani K',
            personType: 'STUDENT',
            primaryStudentRoll: '25X55A3306',
            department: { code: 'AIML' },
            category: { name: 'Hackathon' },
            level: 'NATIONAL',
            positionRank: '1st Prize',
            organizationEventName: 'IIT TechFest',
            academicYear: '2025-2026',
            status: 'PUBLISHED',
          },
        ],
        students: [],
        faculty: [],
        events: [],
        incidents: [],
      },
      'COMPLETE_INSTITUTIONAL_DUMP'
    );

    const workbook = XLSX.read(xlsxBuffer, { type: 'buffer' });
    assert.ok(workbook.SheetNames.includes('NAAC_Honors_Audit'));
    assert.ok(workbook.SheetNames.includes('Audit_Manifest'));

    const manifestSheet = XLSX.utils.sheet_to_json<{ Attribute: string; Value: string }>(
      workbook.Sheets['Audit_Manifest']
    );
    const serializedManifest = JSON.stringify(manifestSheet);
    assert.ok(serializedManifest.includes(IQAC_EXPORT_NOTICE));
    assert.ok(serializedManifest.includes(JNTUA_5A_NOTICE));
    assert.equal(serializedManifest.includes('v3.0'), false);

    const [aGet, eGet] = await Promise.all([
      analyticsGet(new NextRequest('http://localhost/api/admin/analytics')),
      exportGet(new NextRequest('http://localhost/api/admin/export?category=ACHIEVEMENTS')),
    ]);
    assert.equal(aGet.status, 401);
    assert.equal(eGet.status, 401);
  });

  it('Task 3: isolates WEB_MANAGER from user management, grievances, audit logs, and backups', async () => {
    assert.equal(canAccessAdminUsersApi('WEB_MANAGER'), false);
    assert.equal(canAccessBulkImportApi('WEB_MANAGER'), true);
    assert.equal(canAccessBulkImportApi('FACULTY'), false);
    assert.equal(canAccessBulkImportApi('STUDENT'), false);
    assert.equal(canAccessAdminUsersApi('FACULTY'), false);
    assert.equal(canAccessAdminUsersApi('STUDENT'), false);
    assert.equal(canAccessAdminUsersApi('HOD'), true);
    assert.equal(canAccessAdminUsersApi('SUPER_ADMIN'), true);

    assert.deepEqual(getAllowedAssignableRoles('WEB_MANAGER'), []);
    assert.equal(
      canManageTargetUser(
        { id: 'wm-1', role: Role.WEB_MANAGER, departmentId: 'dept-1' },
        { id: 'stu-1', role: Role.STUDENT, departmentId: 'dept-1' }
      ).allowed,
      false
    );

    const wmMenu = getVisibleMenuGroups({
      userId: 'wm-1',
      role: Role.WEB_MANAGER,
      departmentId: 'dept-1',
    });
    assert.equal(wmMenu.includes('users'), false);
    assert.equal(wmMenu.includes('discipline'), false);
    assert.equal(wmMenu.includes('logs'), false);
    assert.equal(wmMenu.includes('trash'), false);
    assert.equal(wmMenu.includes('notices'), true);
    assert.equal(wmMenu.includes('events'), true);
    assert.equal(wmMenu.includes('achievements'), true);

    assert.equal(isWebManagerRestrictedRoute('/admin/users'), true);
    assert.equal(isWebManagerRestrictedRoute('/admin/bulk-upload'), false);
    assert.equal(isWebManagerRestrictedRoute('/admin/discipline'), true);
    assert.equal(isWebManagerRestrictedRoute('/admin/settings'), true);
    assert.equal(isWebManagerRestrictedRoute('/admin/logs'), true);
    assert.equal(isWebManagerRestrictedRoute('/admin/achievements'), false);
    assert.equal(isWebManagerRestrictedRoute('/admin/events'), false);
    assert.equal(isWebManagerRestrictedRoute('/admin/notices'), false);

    // Unauthenticated users API & bulk import calls fail closed with 403
    const [uGet, uPost, uPatch, uDel, bPost] = await Promise.all([
      usersGet(new NextRequest('http://localhost/api/admin/users')),
      usersPost(
        new NextRequest('http://localhost/api/admin/users', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
        })
      ),
      usersPatch(
        new NextRequest('http://localhost/api/admin/users', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
        })
      ),
      usersDelete(new NextRequest('http://localhost/api/admin/users?userId=u-1', { method: 'DELETE' })),
      bulkImportPost(
        new NextRequest('http://localhost/api/admin/users/bulk-import', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'validate', rows: [] }),
        })
      ),
    ]);
    assert.equal(uGet.status, 403);
    assert.equal(uPost.status, 403);
    assert.equal(uPatch.status, 403);
    assert.equal(uDel.status, 403);
    assert.equal(bPost.status, 403);

    // Verify Prisma connectivity and schema compatibility for status counts query
    const auditSample = await prisma.auditLog.count();
    assert.ok(auditSample >= 0);
  });

  after(async () => {
    await prisma.$disconnect();
  });
});
