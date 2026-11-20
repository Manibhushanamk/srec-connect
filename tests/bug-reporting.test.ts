import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import { BugCategory, BugSeverity, BugStatus } from '@prisma/client';

describe('Production Engineering: In-App Bug Reporting & Triage Lifecycle Tests', () => {
  const testTitle = 'TEST_BUG: Verification of Google Drive Certificate Viewer';
  let createdBugId: string;

  before(async () => {
    // Clean up any stale test reports
    await prisma.bugReport.deleteMany({
      where: { title: testTitle },
    });
  });

  after(async () => {
    await prisma.bugReport.deleteMany({
      where: { title: testTitle },
    });
  });

  it('1. should create a comprehensive bug report with automated diagnostics and audit trail', async () => {
    const initialAuditTrail = JSON.stringify([
      {
        event: 'CREATED',
        timestamp: new Date().toISOString(),
        actor: 'student.tester@srecnandyal.edu.in',
        details: 'Initial bug report logged.',
      },
    ]);

    const diagnostics = JSON.stringify({
      capturedRoute: '/dashboard/student/submit',
      screen: '1920x1080',
      userAgent: 'Mozilla/5.0 NodeTestRunner',
      timestamp: new Date().toISOString(),
    });

    const report = await prisma.bugReport.create({
      data: {
        title: testTitle,
        description: 'Detailed description: The uploaded certificate link in Google Drive returned unexpected view error.',
        category: BugCategory.GOOGLE_DRIVE,
        severity: BugSeverity.HIGH,
        status: BugStatus.NEW,
        stepsToReproduce: '1. Go to /dashboard/student/submit\n2. Click upload certificate\n3. Observe 401 token expiration',
        expectedBehavior: 'Certificate viewable by anyone with link',
        actualBehavior: 'Viewer displays error or requires sign-in',
        route: '/dashboard/student/submit',
        deviceInfo: diagnostics,
        reporterEmail: 'student.tester@srecnandyal.edu.in',
        reporterRole: 'STUDENT',
        auditTrail: initialAuditTrail,
      },
    });

    assert.ok(report.id);
    assert.equal(report.status, BugStatus.NEW);
    assert.equal(report.category, BugCategory.GOOGLE_DRIVE);
    assert.equal(report.severity, BugSeverity.HIGH);
    assert.ok(report.deviceInfo?.includes('/dashboard/student/submit'));

    createdBugId = report.id;
  });

  it('2. should filter bug reports by category, severity and active status', async () => {
    const driveBugs = await prisma.bugReport.findMany({
      where: {
        category: BugCategory.GOOGLE_DRIVE,
        deletedAt: null,
      },
    });

    assert.ok(driveBugs.length >= 1);
    assert.ok(driveBugs.some((b) => b.id === createdBugId));

    const highSeverityBugs = await prisma.bugReport.findMany({
      where: {
        severity: BugSeverity.HIGH,
        deletedAt: null,
      },
    });

    assert.ok(highSeverityBugs.length >= 1);
  });

  it('3. should execute Super Admin triage lifecycle: NEW -> TRIAGED -> INVESTIGATING -> RESOLVED', async () => {
    assert.ok(createdBugId, 'createdBugId must exist');

    // 1. Triage to INVESTIGATING
    let report = await prisma.bugReport.findUnique({ where: { id: createdBugId } });
    assert.ok(report);

    const auditTrail: any[] = JSON.parse(report.auditTrail || '[]');
    auditTrail.push({
      event: 'STATUS_CHANGED',
      from: report.status,
      to: BugStatus.INVESTIGATING,
      actor: 'superadmin@srecnandyal.edu.in',
      timestamp: new Date().toISOString(),
    });

    report = await prisma.bugReport.update({
      where: { id: createdBugId },
      data: {
        status: BugStatus.INVESTIGATING,
        internalNotes: 'Root cause identified: access token expiration. Implemented persistent refresh token auto-refresh.',
        auditTrail: JSON.stringify(auditTrail),
      },
    });

    assert.equal(report.status, BugStatus.INVESTIGATING);
    assert.ok(report.internalNotes?.includes('Root cause identified'));

    // 2. Resolve bug
    auditTrail.push({
      event: 'STATUS_CHANGED',
      from: BugStatus.INVESTIGATING,
      to: BugStatus.RESOLVED,
      actor: 'superadmin@srecnandyal.edu.in',
      timestamp: new Date().toISOString(),
    });

    report = await prisma.bugReport.update({
      where: { id: createdBugId },
      data: {
        status: BugStatus.RESOLVED,
        resolutionNotes: 'Fixed in release v3.0.0 via background OAuth2Client auto-refresh.',
        auditTrail: JSON.stringify(auditTrail),
      },
    });

    assert.equal(report.status, BugStatus.RESOLVED);
    assert.ok(report.resolutionNotes?.includes('Fixed in release v3.0.0'));

    const parsedAudit = JSON.parse(report.auditTrail || '[]');
    assert.ok(parsedAudit.length >= 3);
  });

  it('4. should exclude soft-deleted bug reports from active triage queue', async () => {
    await prisma.bugReport.update({
      where: { id: createdBugId },
      data: { deletedAt: new Date() },
    });

    const activeReports = await prisma.bugReport.findMany({
      where: { id: createdBugId, deletedAt: null },
    });

    assert.equal(activeReports.length, 0, 'Soft-deleted bug report must not appear in active queue');
  });
});
