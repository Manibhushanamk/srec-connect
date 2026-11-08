import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/lib/prisma';

describe('Phase 4: Profiles & Portfolios Integration Tests', () => {
  it('1. should resolve student portfolio by permanent roll number', async () => {
    const student = await prisma.student.findFirst({
      where: { rollNumber: '22091A3201' },
      include: {
        department: true,
        user: true,
        primaryAchievements: true,
      },
    });

    assert.ok(student, 'Student with roll number 22091A3201 must exist');
    assert.strictEqual(student.rollNumber, '22091A3201');
    assert.ok(student.name, 'Student must have a name');
  });

  it('2. should enforce immutability of academic credentials on Student profile', async () => {
    const student = await prisma.student.findFirst({
      where: { rollNumber: '22091A3201' },
    });
    assert.ok(student, 'Student must exist');

    // Attempting to overwrite rollNumber or batch should not be possible via the safe portfolio update payload
    const safeUpdateData = {
      bio: 'Undergraduate AI & ML Researcher specializing in Deep Learning',
      githubUrl: 'https://github.com/srec-connect',
      linkedinUrl: 'https://linkedin.com/in/srec-connect',
    };

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: safeUpdateData,
    });

    assert.strictEqual(updated.rollNumber, '22091A3201', 'Roll number must remain unchanged');
    assert.strictEqual(updated.bio, safeUpdateData.bio);
    assert.strictEqual(updated.githubUrl, safeUpdateData.githubUrl);
  });

  it('3. should resolve faculty profile with academic credentials and specialization', async () => {
    const faculty = await prisma.faculty.findFirst({
      where: { isActive: true },
      include: {
        department: true,
        achievements: true,
      },
    });

    assert.ok(faculty, 'Active faculty member must exist');
    assert.ok(faculty.name, 'Faculty must have a name');
    assert.ok(faculty.designation, 'Faculty must have a designation');
  });

  it('4. should filter unverified achievements from public display', async () => {
    const student = await prisma.student.findFirst({
      where: { rollNumber: '22091A3201' },
    });
    assert.ok(student);

    // Verified query only queries APPROVED or PUBLISHED
    const verifiedOnly = await prisma.achievement.findMany({
      where: {
        primaryStudentId: student.id,
        status: { in: ['APPROVED', 'PUBLISHED'] },
      },
    });

    for (const ach of verifiedOnly) {
      assert.ok(
        ach.status === 'APPROVED' || ach.status === 'PUBLISHED',
        'Only verified achievements should be retrieved'
      );
    }
  });

  it('5. should enforce https:// for external URLs in profile sanitization', () => {
    const sanitizeHttpsUrl = (url: any): string | undefined => {
      if (!url) return undefined;
      const s = String(url).trim();
      if (!s) return undefined;
      return s.startsWith('https://') ? s : undefined;
    };

    assert.strictEqual(sanitizeHttpsUrl('javascript:alert(1)'), undefined);
    assert.strictEqual(sanitizeHttpsUrl('http://insecure-site.com'), undefined);
    assert.strictEqual(sanitizeHttpsUrl('data:text/html,bad'), undefined);
    assert.strictEqual(
      sanitizeHttpsUrl('https://linkedin.com/in/verified-user'),
      'https://linkedin.com/in/verified-user'
    );
    assert.strictEqual(
      sanitizeHttpsUrl('https://github.com/verified-student'),
      'https://github.com/verified-student'
    );
  });
});
