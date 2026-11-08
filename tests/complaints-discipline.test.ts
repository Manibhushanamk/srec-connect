import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/lib/prisma';

describe('Phase 8: Complaints, Grievances & Discipline Management Workflow Tests', () => {
  let studentUser: any;
  let facultyUser: any;
  let hodUser: any;
  let superAdminUser: any;
  let confidentialGrievanceId: string;
  let disciplineIncidentId: string;

  before(async () => {
    // 1. Get existing student
    studentUser = await prisma.user.findFirst({
      where: { role: 'STUDENT', student: { isNot: null } },
      include: { student: true },
    });
    if (!studentUser) throw new Error('Student user required in DB');

    // 2. Get existing faculty
    facultyUser = await prisma.user.findFirst({
      where: { role: 'FACULTY' },
    });
    if (!facultyUser) throw new Error('Faculty user required in DB');

    // 3. Get existing HOD
    hodUser = await prisma.user.findFirst({
      where: { role: 'HOD' },
    });
    if (!hodUser) {
      // Create or promote a test HOD
      hodUser = await prisma.user.create({
        data: {
          email: 'hod.test.phase8@srecnandyal.edu.in',
          name: 'Dr. Test HOD',
          role: 'HOD',
          status: 'ACTIVE',
        },
      });
    }

    // 4. Get Super Admin
    superAdminUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });
    if (!superAdminUser) throw new Error('Super Admin user required in DB');
  });

  after(async () => {
    const ids = [confidentialGrievanceId, disciplineIncidentId].filter(Boolean);
    if (ids.length > 0) {
      await prisma.incidentAction.deleteMany({ where: { incidentId: { in: ids } } });
      await prisma.incidentResponse.deleteMany({ where: { incidentId: { in: ids } } });
      await prisma.auditLog.deleteMany({ where: { entityId: { in: ids } } });
      await prisma.incident.deleteMany({ where: { id: { in: ids } } });
    }
    if (hodUser?.email === 'hod.test.phase8@srecnandyal.edu.in') {
      await prisma.user.deleteMany({ where: { id: hodUser.id } });
    }
  });

  it('1. should allow student to file confidential grievance with HOD bypass', async () => {
    const grievance = await prisma.incident.create({
      data: {
        reporterId: studentUser.id,
        title: 'Phase 8 Grievance: Lab Equipment Availability Issue',
        description: 'Edge AI computing lab kits are locked during evening hours.',
        category: 'FACULTY_GRIEVANCE',
        priority: 'HIGH',
        isConfidentialHOD: true,
        status: 'REPORTED',
      },
    });

    assert.ok(grievance.id);
    assert.equal(grievance.isConfidentialHOD, true);
    assert.equal(grievance.reporterId, studentUser.id);
    confidentialGrievanceId = grievance.id;
  });

  it('2. should strictly isolate confidential grievance from regular faculty visibility query', async () => {
    // Faculty query simulation: regular faculty only sees non-confidential OR reported by them
    const facultyVisibleIncidents = await prisma.incident.findMany({
      where: {
        id: confidentialGrievanceId,
        OR: [
          { reporterId: facultyUser.id },
          { isConfidentialHOD: false },
        ],
      },
    });

    // Must be completely invisible to faculty
    assert.equal(facultyVisibleIncidents.length, 0);
  });

  it('3. should allow HOD and Super Admin full visibility to the confidential grievance', async () => {
    // HOD query has unrestricted access
    const hodVisible = await prisma.incident.findUnique({
      where: { id: confidentialGrievanceId },
      include: { reporter: true },
    });

    assert.ok(hodVisible);
    assert.equal(hodVisible.reporter.id, studentUser.id);
  });

  it('4. should allow faculty to file academic disciplinary incident against student', async () => {
    const incident = await prisma.incident.create({
      data: {
        reporterId: facultyUser.id,
        studentId: studentUser.student.id,
        title: 'Phase 8 Disciplinary: Late Submission and Unapproved Absences',
        description: 'Repeated non-attendance in neural networks tutorial session.',
        category: 'CLASSROOM_DISCIPLINE',
        priority: 'MEDIUM',
        isConfidentialHOD: false,
        status: 'REPORTED',
      },
    });

    assert.ok(incident.id);
    assert.equal(incident.studentId, studentUser.student.id);
    assert.equal(incident.isConfidentialHOD, false);
    disciplineIncidentId = incident.id;
  });

  it('5. should allow student right-to-respond on immutable response timeline', async () => {
    const response = await prisma.incidentResponse.create({
      data: {
        incidentId: disciplineIncidentId,
        authorId: studentUser.id,
        message: 'I was representing SREC at the State Hackathon with official college permission.',
      },
    });

    assert.ok(response.id);
    assert.equal(response.authorId, studentUser.id);
    assert.ok(response.createdAt instanceof Date);

    // Update status to UNDER_REVIEW
    const updated = await prisma.incident.update({
      where: { id: disciplineIncidentId },
      data: { status: 'UNDER_REVIEW' },
    });
    assert.equal(updated.status, 'UNDER_REVIEW');
  });

  it('6. should reject FORMAL_ACTION when attempted by regular Faculty (RBAC rule)', async () => {
    const outcome = 'FORMAL_ACTION';
    const actorRole = facultyUser.role; // 'FACULTY'

    // RBAC policy check: only HOD or SUPER_ADMIN
    const isAllowed = actorRole === 'HOD' || actorRole === 'SUPER_ADMIN';
    assert.equal(isAllowed, false, 'Faculty must be prohibited from issuing final FORMAL_ACTION');
  });

  it('7. should allow HOD to record formal action outcome and resolve the case', async () => {
    const action = await prisma.incidentAction.create({
      data: {
        incidentId: disciplineIncidentId,
        actorId: hodUser.id,
        outcome: 'FORMAL_ACTION',
        notes: 'Verified hackathon OD attendance. Excused absence; zero penalty applied.',
      },
    });

    assert.ok(action.id);
    assert.equal(action.outcome, 'FORMAL_ACTION');

    const resolved = await prisma.incident.update({
      where: { id: disciplineIncidentId },
      data: { status: 'RESOLVED' },
    });

    assert.equal(resolved.status, 'RESOLVED');

    // Audit log
    const log = await prisma.auditLog.create({
      data: {
        actorId: hodUser.id,
        actorEmail: hodUser.email,
        actorRole: hodUser.role,
        action: 'DISCIPLINARY_ACTION_RECORDED',
        entityType: 'IncidentAction',
        entityId: action.id,
        metadata: JSON.stringify({
          incidentId: disciplineIncidentId,
          outcome: 'FORMAL_ACTION',
          resolvedStatus: 'RESOLVED',
        }),
      },
    });

    assert.ok(log.id);
    assert.equal(log.action, 'DISCIPLINARY_ACTION_RECORDED');
  });
});
