import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function fixRelationships() {
  console.log('=== FIXING & STRENGTHENING DATA RELATIONSHIPS ===\n');

  // 1. Locate AIML Department
  const aimlDept = await prisma.department.findFirst({
    where: {
      OR: [
        { code: 'AIML' },
        { code: 'CSE(AI&ML)' },
        { name: { contains: 'Artificial Intelligence', mode: 'insensitive' } },
      ],
    },
  });

  if (!aimlDept) {
    throw new Error('AIML department not found in database!');
  }
  console.log(`[1] Primary AIML Department ID: ${aimlDept.id} (${aimlDept.code} - ${aimlDept.name})`);

  // 2. Link Student records to Users
  const students = await prisma.student.findMany();
  for (const student of students) {
    // Ensure student has departmentId
    if (!student.departmentId) {
      await prisma.student.update({
        where: { id: student.id },
        data: { departmentId: aimlDept.id, departmentName: aimlDept.name },
      });
      console.log(`  -> Assigned student ${student.rollNumber} to AIML department.`);
    }

    // Check if matching user exists
    if (student.email) {
      const user = await prisma.user.findUnique({
        where: { email: student.email.toLowerCase().trim() },
      });
      if (user && user.studentId !== student.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            studentId: student.id,
            departmentId: student.departmentId || aimlDept.id,
            departmentName: aimlDept.name,
          },
        });
        console.log(`  -> Linked user ${user.email} to student ${student.rollNumber} (id: ${student.id})`);
      }
    }
  }

  // 3. Link Faculty records to Users
  const facultyList = await prisma.faculty.findMany();
  for (const faculty of facultyList) {
    if (!faculty.departmentId) {
      await prisma.faculty.update({
        where: { id: faculty.id },
        data: { departmentId: aimlDept.id, departmentName: aimlDept.name },
      });
      console.log(`  -> Assigned faculty ${faculty.name} to AIML department.`);
    }

    if (faculty.email) {
      const user = await prisma.user.findUnique({
        where: { email: faculty.email.toLowerCase().trim() },
      });
      if (user && user.facultyId !== faculty.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            facultyId: faculty.id,
            departmentId: faculty.departmentId || aimlDept.id,
            departmentName: aimlDept.name,
          },
        });
        console.log(`  -> Linked user ${user.email} to faculty ${faculty.name} (id: ${faculty.id})`);
      }
    }
  }

  // 4. Ensure HOD AIML user has a Faculty record
  const hodUser = await prisma.user.findUnique({
    where: { email: 'hod.aiml@srecnandyal.edu.in' },
    include: { faculty: true },
  });
  if (hodUser && !hodUser.facultyId) {
    let hodFaculty = await prisma.faculty.findFirst({
      where: { email: 'hod.aiml@srecnandyal.edu.in' },
    });
    if (!hodFaculty) {
      hodFaculty = await prisma.faculty.create({
        data: {
          name: 'Dr. K. Srinivas Rao',
          email: 'hod.aiml@srecnandyal.edu.in',
          designation: 'Professor & Head of Department',
          roleCategory: 'HOD',
          departmentId: aimlDept.id,
          departmentName: aimlDept.name,
          experience: '15+ Years',
          degrees: 'M.Tech, Ph.D. (CSE)',
          cabin: 'AIML Block Room 204',
          specialization: 'Artificial Intelligence, Deep Learning & Vision',
        },
      });
      console.log(`  -> Created dedicated Faculty record for hod.aiml: ${hodFaculty.id}`);
    }
    await prisma.user.update({
      where: { id: hodUser.id },
      data: {
        facultyId: hodFaculty.id,
        departmentId: aimlDept.id,
        departmentName: aimlDept.name,
      },
    });
    console.log(`  -> Linked hod.aiml user to faculty record.`);
  }

  // 5. Create Student records for test students without student records
  const unlinkedStudentUsers = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      studentId: null,
    },
  });
  for (const u of unlinkedStudentUsers) {
    // Generate mock roll number for test users
    const match = u.email.match(/(\d+)/);
    const suffix = match ? match[1].slice(-4) : '9999';
    const testRoll = `22091A32${suffix.slice(-2).padStart(2, '9')}`;
    let student = await prisma.student.findUnique({ where: { rollNumber: testRoll } });
    if (!student) {
      student = await prisma.student.create({
        data: {
          rollNumber: testRoll,
          name: u.name || 'Student Candidate',
          email: u.email,
          departmentId: aimlDept.id,
          departmentName: aimlDept.name,
          batch: '2022-2026',
          section: 'A',
        },
      });
    }
    await prisma.user.update({
      where: { id: u.id },
      data: {
        studentId: student.id,
        departmentId: aimlDept.id,
        departmentName: aimlDept.name,
      },
    });
    console.log(`  -> Created and linked Student record ${testRoll} for user ${u.email}`);
  }

  // 6. Update all users with null departmentId to AIML department
  const usersWithNullDept = await prisma.user.findMany({
    where: { departmentId: null },
    include: { student: true, faculty: true },
  });
  for (const u of usersWithNullDept) {
    const targetDeptId = u.student?.departmentId || u.faculty?.departmentId || aimlDept.id;
    await prisma.user.update({
      where: { id: u.id },
      data: {
        departmentId: targetDeptId,
        departmentName: targetDeptId === aimlDept.id ? aimlDept.name : undefined,
      },
    });
    console.log(`  -> Set departmentId on user ${u.email}`);
  }

  // 7. Ensure all AchievementTeamMember records have studentId
  const teamMembers = await prisma.achievementTeamMember.findMany({
    where: { studentId: null },
  });
  for (const tm of teamMembers) {
    const student = await prisma.student.findUnique({
      where: { rollNumber: tm.rollNumber.toUpperCase().trim() },
    });
    if (student) {
      await prisma.achievementTeamMember.update({
        where: { id: tm.id },
        data: { studentId: student.id },
      });
      console.log(`  -> Linked team member ${tm.rollNumber} to student ${student.id}`);
    }
  }

  // 8. Ensure all Achievements have departmentId
  const achievements = await prisma.achievement.findMany({
    where: { departmentId: null },
  });
  for (const ach of achievements) {
    await prisma.achievement.update({
      where: { id: ach.id },
      data: {
        departmentId: aimlDept.id,
        departmentName: aimlDept.name,
      },
    });
    console.log(`  -> Linked achievement "${ach.title}" to AIML department.`);
  }

  // 9. Ensure all Events have departmentId
  const events = await prisma.event.findMany({
    where: { departmentId: null },
  });
  for (const ev of events) {
    await prisma.event.update({
      where: { id: ev.id },
      data: {
        departmentId: aimlDept.id,
        departmentName: aimlDept.name,
      },
    });
    console.log(`  -> Linked event "${ev.title}" to AIML department.`);
  }

  console.log('\n=== RELATIONSHIPS STRENGTHENED SUCCESSFULLY ===');
}

fixRelationships()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
