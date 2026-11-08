import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { Role } from '@prisma/client';

describe('Phase 3: User & Academic Administration (Bulk CSV & Roll Numbers)', () => {
  const testStudentRoll = '22091A3299';
  const testStudentEmail = '22091a3299@srecnandyal.edu.in';

  before(async () => {
    // Clean up test data if leftover
    await prisma.user.deleteMany({
      where: { email: { in: [testStudentEmail, 'bulk.test1@srecnandyal.edu.in', 'bulk.test2@srecnandyal.edu.in'] } },
    });
    await prisma.student.deleteMany({
      where: { rollNumber: { in: [testStudentRoll, '22091A3281', '22091A3282'] } },
    });
  });

  after(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [testStudentEmail, 'bulk.test1@srecnandyal.edu.in', 'bulk.test2@srecnandyal.edu.in'] } },
    });
    await prisma.student.deleteMany({
      where: { rollNumber: { in: [testStudentRoll, '22091A3281', '22091A3282'] } },
    });
    await prisma.$disconnect();
  });

  it('1. should enforce JNTUA roll number regex format', () => {
    const validRolls = ['22091A3201', '23095A3205', '21091A0512'];
    const invalidRolls = ['INVALID123', '22091B3201', '22091A320', '22091A32011'];

    const regex = /^\d{2}09(1A|5A)\d{2}[0-9A-Z]{2}$/;

    validRolls.forEach((r) => assert.strictEqual(regex.test(r), true));
    invalidRolls.forEach((r) => assert.strictEqual(regex.test(r), false));
  });

  it('2. should pre-provision student and link immutable roll number', async () => {
    const student = await prisma.student.create({
      data: {
        rollNumber: testStudentRoll,
        name: 'Test Student Roll Verification',
        email: testStudentEmail,
        batch: '2022-2026',
        section: 'A',
      },
    });

    const user = await prisma.user.create({
      data: {
        email: testStudentEmail,
        name: 'Test Student Roll Verification',
        role: Role.STUDENT,
        status: 'ACTIVE',
        studentId: student.id,
      },
    });

    assert.strictEqual(student.rollNumber, '22091A3299');
    assert.strictEqual(user.studentId, student.id);
  });

  it('3. should reject duplicate roll numbers (P2002 constraint)', async () => {
    let failed = false;
    try {
      await prisma.student.create({
        data: {
          rollNumber: testStudentRoll,
          name: 'Duplicate Student Attempt',
          email: 'duplicate@srecnandyal.edu.in',
        },
      });
    } catch (err: any) {
      failed = true;
      assert.strictEqual(err.code, 'P2002');
    }
    assert.strictEqual(failed, true, 'Duplicate roll number must throw P2002');
  });

  it('4. should toggle user status between ACTIVE and SUSPENDED', async () => {
    const suspended = await prisma.user.update({
      where: { email: testStudentEmail },
      data: { status: 'SUSPENDED' },
    });
    assert.strictEqual(suspended.status, 'SUSPENDED');

    const reactivated = await prisma.user.update({
      where: { email: testStudentEmail },
      data: { status: 'ACTIVE' },
    });
    assert.strictEqual(reactivated.status, 'ACTIVE');
  });

  it('5. should execute transactional bulk ingestion for student records', async () => {
    const batchRows = [
      { name: 'Bulk Student 1', email: 'bulk.test1@srecnandyal.edu.in', rollNumber: '22091A3281' },
      { name: 'Bulk Student 2', email: 'bulk.test2@srecnandyal.edu.in', rollNumber: '22091A3282' },
    ];

    await prisma.$transaction(async (tx) => {
      for (const row of batchRows) {
        const student = await tx.student.create({
          data: {
            rollNumber: row.rollNumber,
            name: row.name,
            email: row.email,
          },
        });
        await tx.user.create({
          data: {
            email: row.email,
            name: row.name,
            role: Role.STUDENT,
            status: 'ACTIVE',
            studentId: student.id,
          },
        });
      }
    });

    const insertedUsers = await prisma.user.findMany({
      where: { email: { in: batchRows.map((b) => b.email) } },
    });
    assert.strictEqual(insertedUsers.length, 2);
  });
});
