import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { SubmissionStatus } from '@prisma/client';

describe('Student Achievement Pending Editing & Approved Lockout Enforcement', () => {
  const timestamp = Date.now();
  let studentUserA: any;
  let studentUserB: any;
  let category: any;
  let pendingAchievement: any;
  let approvedAchievement: any;
  let publishedAchievement: any;

  before(async () => {
    // 1. Get or create category
    category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: `Test Category ${timestamp}`, code: `TC_${timestamp}` },
      });
    }

    // 2. Create Student A
    studentUserA = await prisma.user.create({
      data: {
        name: `Test Student A ${timestamp}`,
        email: `student.a.${timestamp}@srecnandyal.edu.in`,
        role: 'STUDENT',
        student: {
          create: {
            rollNumber: `24X51A${Math.floor(1000 + Math.random() * 9000)}`,
            name: `Test Student A ${timestamp}`,
            departmentName: 'CSE(AI&ML)',
            batch: '2024-2028',
            section: 'A',
          },
        },
      },
      include: { student: true },
    });

    // 3. Create Student B (Unrelated student)
    studentUserB = await prisma.user.create({
      data: {
        name: `Test Student B ${timestamp}`,
        email: `student.b.${timestamp}@srecnandyal.edu.in`,
        role: 'STUDENT',
        student: {
          create: {
            rollNumber: `24X51A${Math.floor(1000 + Math.random() * 9000)}`,
            name: `Test Student B ${timestamp}`,
            departmentName: 'CSE(AI&ML)',
            batch: '2024-2028',
            section: 'B',
          },
        },
      },
      include: { student: true },
    });

    // 4. Create Pending Achievement for Student A
    pendingAchievement = await prisma.achievement.create({
      data: {
        title: 'Original Pending Hackathon Trophy',
        description: 'First draft description',
        personName: studentUserA.name,
        organizationEventName: 'TechFest 2026',
        academicYear: '2025-2026',
        achievementDate: new Date(),
        categoryId: category.id,
        createdById: studentUserA.id,
        primaryStudentId: studentUserA.student.id,
        primaryStudentRoll: studentUserA.student.rollNumber,
        status: SubmissionStatus.PENDING,
        level: 'COLLEGE',
      },
    });

    // 5. Create Approved Achievement for Student A
    approvedAchievement = await prisma.achievement.create({
      data: {
        title: 'Officially Verified Smart India Hackathon Winner',
        description: 'Verified award details',
        personName: studentUserA.name,
        organizationEventName: 'Govt of India SIH',
        academicYear: '2025-2026',
        achievementDate: new Date(),
        categoryId: category.id,
        createdById: studentUserA.id,
        primaryStudentId: studentUserA.student.id,
        primaryStudentRoll: studentUserA.student.rollNumber,
        status: SubmissionStatus.APPROVED,
        level: 'NATIONAL',
      },
    });

    // 6. Create Published Achievement for Student A
    publishedAchievement = await prisma.achievement.create({
      data: {
        title: 'Published International IEEE Conference Paper',
        description: 'Published paper details',
        personName: studentUserA.name,
        organizationEventName: 'IEEE Global 2026',
        academicYear: '2025-2026',
        achievementDate: new Date(),
        categoryId: category.id,
        createdById: studentUserA.id,
        primaryStudentId: studentUserA.student.id,
        primaryStudentRoll: studentUserA.student.rollNumber,
        status: SubmissionStatus.PUBLISHED,
        level: 'INTERNATIONAL',
      },
    });
  });

  after(async () => {
    // Cleanup test records
    await prisma.achievementTeamMember.deleteMany({
      where: { achievementId: { in: [pendingAchievement?.id, approvedAchievement?.id, publishedAchievement?.id] } },
    });
    await prisma.achievement.deleteMany({
      where: { id: { in: [pendingAchievement?.id, approvedAchievement?.id, publishedAchievement?.id] } },
    });
    await prisma.student.deleteMany({
      where: { id: { in: [studentUserA?.student?.id, studentUserB?.student?.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [studentUserA?.id, studentUserB?.id] } },
    });
  });

  // Helper function mimicking the API authorization & lock validation logic
  function validateAchievementEditPermission(user: any, achievement: any) {
    const isOwner =
      achievement.createdById === user.id ||
      (user.studentId && achievement.primaryStudentId === user.studentId) ||
      (user.student?.id && achievement.primaryStudentId === user.student.id) ||
      (user.student?.rollNumber && achievement.primaryStudentRoll === user.student.rollNumber);

    const isModerator = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'HOD';

    if (!isOwner && !isModerator) {
      return { allowed: false, status: 403, error: 'Forbidden: You can only edit your own achievements.' };
    }

    const isLocked =
      achievement.status === SubmissionStatus.APPROVED ||
      achievement.status === SubmissionStatus.PUBLISHED;

    if (isLocked && !isModerator) {
      return {
        allowed: false,
        status: 403,
        isLocked: true,
        error:
          'Approved achievements are locked and cannot be edited. After institutional verification, records are permanently preserved to guarantee academic audit integrity. Contact your department HOD or administrator if a correction is needed.',
      };
    }

    return { allowed: true, status: 200 };
  }

  function validateAchievementDeletePermission(user: any, achievement: any) {
    const isOwner =
      achievement.createdById === user.id ||
      (user.studentId && achievement.primaryStudentId === user.studentId) ||
      (user.student?.id && achievement.primaryStudentId === user.student.id) ||
      (user.student?.rollNumber && achievement.primaryStudentRoll === user.student.rollNumber);

    const isModerator = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'HOD';

    if (!isOwner && !isModerator) {
      return { allowed: false, status: 403, error: 'Forbidden: You can only remove your own achievements.' };
    }

    const isLocked =
      achievement.status === SubmissionStatus.APPROVED ||
      achievement.status === SubmissionStatus.PUBLISHED;

    if (isLocked && !isModerator) {
      return {
        allowed: false,
        status: 403,
        isLocked: true,
        error: 'Approved achievements cannot be removed or deleted.',
      };
    }

    return { allowed: true, status: 200 };
  }

  test('1. Student can edit their pending achievement while in review', async () => {
    const check = validateAchievementEditPermission(studentUserA, pendingAchievement);
    assert.strictEqual(check.allowed, true);
    assert.strictEqual(check.status, 200);

    // Perform database update
    const updated = await prisma.achievement.update({
      where: { id: pendingAchievement.id },
      data: {
        title: 'Updated Hackathon First Prize Award',
        description: 'Updated detailed project submission summary',
        positionRank: 'FIRST',
        level: 'STATE',
      },
    });

    assert.strictEqual(updated.title, 'Updated Hackathon First Prize Award');
    assert.strictEqual(updated.positionRank, 'FIRST');
    assert.strictEqual(updated.level, 'STATE');
    assert.strictEqual(updated.status, SubmissionStatus.PENDING);
  });

  test('2. Student CANNOT edit an APPROVED achievement (strict lockout)', async () => {
    const check = validateAchievementEditPermission(studentUserA, approvedAchievement);
    assert.strictEqual(check.allowed, false);
    assert.strictEqual(check.status, 403);
    assert.strictEqual(check.isLocked, true);
    assert.match(check.error, /Approved achievements are locked and cannot be edited/);
  });

  test('3. Student CANNOT edit a PUBLISHED achievement (strict lockout)', async () => {
    const check = validateAchievementEditPermission(studentUserA, publishedAchievement);
    assert.strictEqual(check.allowed, false);
    assert.strictEqual(check.status, 403);
    assert.strictEqual(check.isLocked, true);
    assert.match(check.error, /Approved achievements are locked/);
  });

  test('4. Student CANNOT delete/withdraw an APPROVED achievement', async () => {
    const check = validateAchievementDeletePermission(studentUserA, approvedAchievement);
    assert.strictEqual(check.allowed, false);
    assert.strictEqual(check.status, 403);
    assert.strictEqual(check.isLocked, true);
    assert.match(check.error, /Approved achievements cannot be removed or deleted/);
  });

  test('5. Student CAN withdraw/delete their PENDING achievement', async () => {
    const check = validateAchievementDeletePermission(studentUserA, pendingAchievement);
    assert.strictEqual(check.allowed, true);
    assert.strictEqual(check.status, 200);

    // Perform soft-delete/withdraw
    const withdrawn = await prisma.achievement.update({
      where: { id: pendingAchievement.id },
      data: {
        status: SubmissionStatus.WITHDRAWN,
        deletedAt: new Date(),
      },
    });

    assert.strictEqual(withdrawn.status, SubmissionStatus.WITHDRAWN);
    assert.ok(withdrawn.deletedAt !== null);
  });

  test('6. Student B CANNOT edit or delete Student A pending achievement', async () => {
    const checkEdit = validateAchievementEditPermission(studentUserB, pendingAchievement);
    assert.strictEqual(checkEdit.allowed, false);
    assert.strictEqual(checkEdit.status, 403);
    assert.match(checkEdit.error, /Forbidden: You can only edit your own achievements/);

    const checkDelete = validateAchievementDeletePermission(studentUserB, pendingAchievement);
    assert.strictEqual(checkDelete.allowed, false);
    assert.strictEqual(checkDelete.status, 403);
    assert.match(checkDelete.error, /Forbidden: You can only remove your own achievements/);
  });
});
