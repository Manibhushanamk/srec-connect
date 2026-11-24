import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { Role } from '@prisma/client';
import { parseRollNumber, isLateralEntryRoll, getBatchLabel } from '../src/lib/studentHelper';

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
    }, { maxWait: 25000, timeout: 35000 });

    const insertedUsers = await prisma.user.findMany({
      where: { email: { in: batchRows.map((b) => b.email) } },
    });
    assert.strictEqual(insertedUsers.length, 2);
  });

  it('6. should correctly identify regular vs diploma lateral entry roll numbers', () => {
    // Regular 4-year B.Tech students
    const reg1 = parseRollNumber('22091A3205');
    assert.strictEqual(reg1.isValid, true);
    assert.strictEqual(reg1.isLateralEntry, false);
    assert.strictEqual(reg1.admissionYear, 2022);
    assert.strictEqual(reg1.graduationYear, 2026);
    assert.strictEqual(reg1.batchYear, '2022-2026');
    assert.strictEqual(isLateralEntryRoll('22091A3205'), false);

    const reg2 = parseRollNumber('24091A0501');
    assert.strictEqual(reg2.isValid, true);
    assert.strictEqual(reg2.isLateralEntry, false);
    assert.strictEqual(reg2.admissionYear, 2024);
    assert.strictEqual(reg2.graduationYear, 2028);
    assert.strictEqual(reg2.batchYear, '2024-2028');

    // Diploma Lateral Entry (ECET) students admitted directly into 2nd year
    // E.g. admitted in 2025 -> joins 2024-2028 batch!
    const lat1 = parseRollNumber('25X55A3306');
    assert.strictEqual(lat1.isValid, true);
    assert.strictEqual(lat1.isLateralEntry, true);
    assert.strictEqual(lat1.admissionYear, 2025);
    assert.strictEqual(lat1.graduationYear, 2028);
    assert.strictEqual(lat1.batchYear, '2024-2028');
    assert.strictEqual(isLateralEntryRoll('25X55A3306'), true);

    const lat2 = parseRollNumber('25095A3206');
    assert.strictEqual(lat2.isValid, true);
    assert.strictEqual(lat2.isLateralEntry, true);
    assert.strictEqual(lat2.admissionYear, 2025);
    assert.strictEqual(lat2.graduationYear, 2028);
    assert.strictEqual(lat2.batchYear, '2024-2028');
    assert.strictEqual(isLateralEntryRoll('25095A3206'), true);

    const lat3 = parseRollNumber('24095A0101');
    assert.strictEqual(lat3.isValid, true);
    assert.strictEqual(lat3.isLateralEntry, true);
    assert.strictEqual(lat3.admissionYear, 2024);
    assert.strictEqual(lat3.graduationYear, 2027);
    assert.strictEqual(lat3.batchYear, '2023-2027');
  });

  it('7. should format batch labels with both regular and lateral entry cohorts', () => {
    const label2024_2028 = getBatchLabel('2024-2028');
    assert.strictEqual(label2024_2028.includes('Lateral Entry 2025'), true);
    assert.strictEqual(label2024_2028.includes('Regular 2024'), true);

    const label2025_2029 = getBatchLabel('2025-2029');
    assert.strictEqual(label2025_2029.includes('Lateral Entry 2026'), true);
  });
});
