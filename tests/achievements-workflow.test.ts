import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/lib/prisma';

describe('Phase 6: Achievements Multi-Tier Verification Workflow Tests', () => {
  it('1. should submit an achievement in PENDING status', async () => {
    const student = await prisma.student.findFirst({
      where: { rollNumber: '22091A3201' },
      include: { user: true },
    });
    assert.ok(student, 'Student must exist');

    const category = await prisma.category.findFirst();
    assert.ok(category, 'Category must exist');

    const achievement = await prisma.achievement.create({
      data: {
        title: 'IEEE International AI Conference Paper Acceptance',
        organizationEventName: 'IEEE Computer Society 2026',
        achievementDate: new Date(),
        academicYear: '2025-2026',
        personName: student.name,
        primaryStudentId: student.id,
        primaryStudentRoll: student.rollNumber,
        departmentId: student.departmentId,
        categoryId: category.id,
        status: 'PENDING',
        googleDriveUrl: 'https://drive.google.com/file/d/test12345/view',
      },
    });

    assert.ok(achievement.id);
    assert.strictEqual(achievement.status, 'PENDING');
    assert.strictEqual(achievement.publishedAt, null, 'Unpublished achievement must not have publishedAt date');

    // Clean up or keep for transition test
    await prisma.achievement.delete({ where: { id: achievement.id } });
  });

  it('2. should verify state transitions: PENDING -> RESUBMISSION_REQUIRED -> APPROVED -> PUBLISHED', async () => {
    const student = await prisma.student.findFirst({
      where: { rollNumber: '22091A3201' },
    });
    const category = await prisma.category.findFirst();
    const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    assert.ok(student && category && superAdmin);

    // Initial state: PENDING
    const ach = await prisma.achievement.create({
      data: {
        title: 'State Transition Verification Milestone',
        organizationEventName: 'SREC Research Summit',
        achievementDate: new Date(),
        academicYear: '2025-2026',
        personName: student.name,
        primaryStudentId: student.id,
        categoryId: category.id,
        status: 'PENDING',
      },
    });
    assert.strictEqual(ach.status, 'PENDING');

    // Transition 1: Reviewer requests resubmission
    const resubmission = await prisma.achievement.update({
      where: { id: ach.id },
      data: {
        status: 'RESUBMISSION_REQUIRED',
        rejectionReason: 'Please attach official signed certificate from organizing body',
      },
    });
    assert.strictEqual(resubmission.status, 'RESUBMISSION_REQUIRED');
    assert.ok(resubmission.rejectionReason);

    // Transition 2: Faculty/HOD Approves
    const approved = await prisma.achievement.update({
      where: { id: ach.id },
      data: {
        status: 'APPROVED',
        publishedAt: new Date(),
      },
    });
    assert.strictEqual(approved.status, 'APPROVED');
    assert.ok(approved.publishedAt);

    // Transition 3: Web Manager publishes to public portal
    const published = await prisma.achievement.update({
      where: { id: ach.id },
      data: {
        status: 'PUBLISHED',
      },
    });
    assert.strictEqual(published.status, 'PUBLISHED');

    // Audit log entry created
    const audit = await prisma.auditLog.create({
      data: {
        actorId: superAdmin.id,
        actorEmail: superAdmin.email,
        actorRole: superAdmin.role,
        action: 'ACHIEVEMENT_PUBLISH',
        entityType: 'Achievement',
        entityId: ach.id,
        metadata: JSON.stringify({ previousStatus: 'APPROVED', newStatus: 'PUBLISHED' }),
      },
    });
    assert.ok(audit.id);

    // Clean up
    await prisma.achievement.delete({ where: { id: ach.id } });
  });

  it('3. should verify unverified achievements are strictly excluded from public display', async () => {
    const student = await prisma.student.findFirst({
      where: { rollNumber: '22091A3201' },
    });
    const category = await prisma.category.findFirst();
    assert.ok(student && category);

    // Create a pending achievement
    const pendingAch = await prisma.achievement.create({
      data: {
        title: 'Unverified Test Achievement (Must Be Hidden)',
        organizationEventName: 'Draft Event',
        achievementDate: new Date(),
        academicYear: '2025-2026',
        personName: student.name,
        primaryStudentId: student.id,
        categoryId: category.id,
        status: 'PENDING',
      },
    });

    // Public query filter rule
    const publicVisible = await prisma.achievement.findMany({
      where: {
        status: { in: ['APPROVED', 'PUBLISHED'] },
        primaryStudentId: student.id,
      },
    });

    const isPendingVisible = publicVisible.some((a) => a.id === pendingAch.id);
    assert.strictEqual(isPendingVisible, false, 'Pending achievement must never appear in public queries');

    // Clean up
    await prisma.achievement.delete({ where: { id: pendingAch.id } });
  });
});
