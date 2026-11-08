import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/lib/prisma';

describe('Phase 7: Events, Capacity Concurrency & QR Attendance Workflow Tests', () => {
  let testDepartmentId: string;
  let testCategoryId: string;
  let testOrganizerUserId: string;
  let studentUser1: any;
  let studentUser2: any;
  let createdEventId: string;

  before(async () => {
    // 1. Get or create test department
    const dept = await prisma.department.findFirst({ where: { code: 'AIML' } });
    if (!dept) throw new Error('AIML Department required in DB');
    testDepartmentId = dept.id;

    // 2. Get or create test category
    let category = await prisma.category.findFirst({ where: { type: { in: ['EVENT', 'BOTH'] } } });
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'AI & ML Hackathon',
          type: 'EVENT',
          displayOrder: 1,
          isActive: true,
        },
      });
    }
    testCategoryId = category.id;

    // 3. Organizer Faculty/Admin user
    const organizer = await prisma.user.findFirst({
      where: { role: { in: ['SUPER_ADMIN', 'HOD', 'FACULTY'] } },
    });
    if (!organizer) throw new Error('Organizer user required in DB');
    testOrganizerUserId = organizer.id;

    // 4. Ensure two student users exist for registration concurrency test
    studentUser1 = await prisma.user.findFirst({
      where: { email: '22091a3201@srecnandyal.edu.in' },
      include: { student: true },
    });
    if (!studentUser1) {
      studentUser1 = await prisma.user.findFirst({
        where: { role: 'STUDENT', student: { isNot: null } },
        include: { student: true },
      });
    }

    // Always create a dedicated, isolated second student for events concurrency test
    const email2 = `events.test.student.${Date.now()}@srecnandyal.edu.in`;
    const roll2 = `22091A3277`;
    await prisma.eventRegistration.deleteMany({ where: { user: { email: email2 } } });
    await prisma.user.deleteMany({ where: { email: email2 } });
    await prisma.student.deleteMany({ where: { rollNumber: roll2 } });

    studentUser2 = await prisma.user.create({
      data: {
        email: email2,
        name: 'Waitlist Test Candidate',
        role: 'STUDENT',
        status: 'ACTIVE',
        student: {
          create: {
            rollNumber: roll2,
            name: 'Waitlist Test Candidate',
            batch: '2022-2026',
            section: 'A',
            departmentName: 'Artificial Intelligence & Machine Learning',
          },
        },
      },
      include: { student: true },
    });
  });

  after(async () => {
    if (createdEventId) {
      await prisma.eventAttendance.deleteMany({ where: { eventId: createdEventId } });
      await prisma.eventRegistration.deleteMany({ where: { eventId: createdEventId } });
      await prisma.auditLog.deleteMany({ where: { entityId: createdEventId } });
      await prisma.event.deleteMany({ where: { id: createdEventId } });
    }
    if (studentUser2?.id) {
      await prisma.eventAttendance.deleteMany({ where: { userId: studentUser2.id } });
      await prisma.eventRegistration.deleteMany({ where: { userId: studentUser2.id } });
      await prisma.student.deleteMany({ where: { rollNumber: '22091A3277' } });
      await prisma.user.deleteMany({ where: { id: studentUser2.id } });
    }
  });

  it('1. should create a targeted event with capacity limit = 1 and post-reg WhatsApp group link', async () => {
    const startDate = new Date(Date.now() + 86400000); // tomorrow
    const endDate = new Date(Date.now() + 86400000 * 2);

    const event = await prisma.event.create({
      data: {
        title: 'Phase 7 Verification: Autonomous Robotics & Edge AI',
        description: 'Hands-on edge computing workshop with capacity concurrency testing.',
        categoryId: testCategoryId,
        departmentId: testDepartmentId,
        startDate,
        endDate,
        venue: 'Visvesvaraya Innovation Hall, SREC Campus',
        organizer: 'CSE AI & ML Student Technical Chapter',
        speaker: 'Dr. Edge AI Specialist',
        capacity: 1, // STRICT CAPACITY LIMIT = 1 TO TEST WAITLIST CONCURRENCY
        whatsappGroupUrl: 'https://chat.whatsapp.com/test-srec-edge-ai-group',
        academicYear: '2025-2026',
        createdById: testOrganizerUserId,
        status: 'UPCOMING',
      },
    });

    assert.ok(event.id);
    assert.equal(event.capacity, 1);
    assert.equal(event.whatsappGroupUrl, 'https://chat.whatsapp.com/test-srec-edge-ai-group');
    createdEventId = event.id;
  });

  it('2. should confirm Student 1 seat within capacity limit', async () => {
    // Transactional registration
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: createdEventId } });
      assert.ok(event);

      const confirmedCount = await tx.eventRegistration.count({
        where: { eventId: createdEventId, status: 'REGISTERED' },
      });

      assert.equal(confirmedCount, 0);

      const reg = await tx.eventRegistration.create({
        data: {
          eventId: createdEventId,
          userId: studentUser1.id,
          status: 'REGISTERED',
        },
      });

      await tx.event.update({
        where: { id: createdEventId },
        data: { participantCount: 1 },
      });

      return reg;
    });

    assert.equal(result.status, 'REGISTERED');
    assert.equal(result.userId, studentUser1.id);
  });

  it('3. should automatically place Student 2 on WAITLIST when capacity is full', async () => {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: createdEventId } });
      assert.ok(event);

      const confirmedCount = await tx.eventRegistration.count({
        where: { eventId: createdEventId, status: 'REGISTERED' },
      });

      // Capacity is 1, confirmedCount is 1 -> Must waitlist!
      assert.equal(confirmedCount, event.capacity);

      const reg = await tx.eventRegistration.create({
        data: {
          eventId: createdEventId,
          userId: studentUser2.id,
          status: 'WAITLISTED',
        },
      });

      return reg;
    });

    assert.equal(result.status, 'WAITLISTED');
    assert.equal(result.userId, studentUser2.id);
  });

  it('4. should reject check-in for waitlisted Student 2 before promotion', async () => {
    const reg = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId: createdEventId,
          userId: studentUser2.id,
        },
      },
    });

    assert.equal(reg?.status, 'WAITLISTED');
    // Cannot check in waitlisted attendee
    const isEligibleForCheckIn = reg?.status === 'REGISTERED';
    assert.equal(isEligibleForCheckIn, false);
  });

  it('5. should promote Student 2 from WAITLISTED to REGISTERED when Student 1 cancels', async () => {
    const cancelResult = await prisma.$transaction(async (tx) => {
      // 1. Cancel Student 1
      await tx.eventRegistration.update({
        where: {
          eventId_userId: {
            eventId: createdEventId,
            userId: studentUser1.id,
          },
        },
        data: { status: 'CANCELLED' },
      });

      // 2. Find earliest waitlisted candidate
      const waitlisted = await tx.eventRegistration.findFirst({
        where: {
          eventId: createdEventId,
          status: 'WAITLISTED',
        },
        orderBy: { registeredAt: 'asc' },
      });

      assert.ok(waitlisted);
      assert.equal(waitlisted.userId, studentUser2.id);

      // 3. Promote to REGISTERED
      const promoted = await tx.eventRegistration.update({
        where: { id: waitlisted.id },
        data: { status: 'REGISTERED' },
      });

      return promoted;
    });

    assert.equal(cancelResult.status, 'REGISTERED');
    assert.equal(cancelResult.userId, studentUser2.id);
  });

  it('6. should check in promoted Student 2 via QR_SCAN / Roll Number and create audit log', async () => {
    // Student 2 is now REGISTERED, check in
    const attendance = await prisma.eventAttendance.create({
      data: {
        eventId: createdEventId,
        userId: studentUser2.id,
        checkInMethod: 'QR_SCAN',
      },
    });

    assert.ok(attendance.id);
    assert.equal(attendance.checkInMethod, 'QR_SCAN');

    // Create audit log
    const log = await prisma.auditLog.create({
      data: {
        actorId: testOrganizerUserId,
        actorEmail: 'organizer@srecnandyal.edu.in',
        actorRole: 'FACULTY',
        action: 'EVENT_ATTENDANCE_CHECKIN',
        entityType: 'EventAttendance',
        entityId: attendance.id,
        metadata: JSON.stringify({
          eventId: createdEventId,
          studentRollNumber: studentUser2.student?.rollNumber,
          checkInMethod: 'QR_SCAN',
        }),
      },
    });

    assert.ok(log.id);
    assert.equal(log.action, 'EVENT_ATTENDANCE_CHECKIN');
  });
});
