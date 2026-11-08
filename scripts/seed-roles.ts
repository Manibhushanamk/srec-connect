import { prisma } from '../src/lib/prisma';
import { Role } from '@prisma/client';

async function main() {
  console.log('[Seed] Seeding departments, batches, sections, and test persona accounts...');

  // 1. Ensure AIML Department exists
  let aimlDept = await prisma.department.findUnique({
    where: { code: 'AIML' },
  });
  if (!aimlDept) {
    aimlDept = await prisma.department.create({
      data: {
        code: 'AIML',
        name: 'Artificial Intelligence & Machine Learning',
        description: 'Department of CSE - Artificial Intelligence and Machine Learning at SREC Nandyal',
      },
    });
  }

  // 2. Ensure Batch exists
  let batch = await prisma.batch.findUnique({
    where: { name: '2022-2026' },
  });
  if (!batch) {
    batch = await prisma.batch.create({
      data: {
        name: '2022-2026',
        startYear: 2022,
        endYear: 2026,
        academicYear: '2025-2026',
        isActive: true,
      },
    });
  }

  // 3. Ensure Section exists
  let section = await prisma.section.findFirst({
    where: {
      name: 'A',
      batchName: '2022-2026',
    },
  });
  if (!section) {
    section = await prisma.section.create({
      data: {
        name: 'A',
        batchName: '2022-2026',
      },
    });
  }

  // 4. Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'manibhushanam4k@gmail.com' },
    update: {
      role: Role.SUPER_ADMIN,
      status: 'ACTIVE',
      departmentId: aimlDept.id,
    },
    create: {
      email: 'manibhushanam4k@gmail.com',
      name: 'Mani Bhushanam K (Super Admin)',
      role: Role.SUPER_ADMIN,
      status: 'ACTIVE',
      departmentId: aimlDept.id,
    },
  });

  // 5. HOD Account
  const hodUser = await prisma.user.upsert({
    where: { email: 'hod.aiml@srecnandyal.edu.in' },
    update: {
      role: Role.HOD,
      status: 'ACTIVE',
      departmentId: aimlDept.id,
    },
    create: {
      email: 'hod.aiml@srecnandyal.edu.in',
      name: 'Dr. K. Srinivas Rao (HOD AIML)',
      role: Role.HOD,
      status: 'ACTIVE',
      departmentId: aimlDept.id,
    },
  });

  // 6. Web Manager Account
  const webManagerUser = await prisma.user.upsert({
    where: { email: 'webmanager@srecnandyal.edu.in' },
    update: {
      role: Role.WEB_MANAGER,
      status: 'ACTIVE',
    },
    create: {
      email: 'webmanager@srecnandyal.edu.in',
      name: 'SREC Web Operations Manager',
      role: Role.WEB_MANAGER,
      status: 'ACTIVE',
    },
  });

  // 7. Faculty Account & Profile
  let faculty = await prisma.faculty.findFirst({
    where: { email: 'faculty.aiml@srecnandyal.edu.in' },
  });
  if (!faculty) {
    faculty = await prisma.faculty.create({
      data: {
        name: 'A. Ramesh',
        designation: 'Assistant Professor',
        roleCategory: 'ASSISTANT_PROFESSOR',
        departmentId: aimlDept.id,
        departmentName: aimlDept.name,
        email: 'faculty.aiml@srecnandyal.edu.in',
        experience: '6+ Years',
        degrees: 'M.Tech (CSE)',
        specialization: 'Deep Learning & Natural Language Processing',
      },
    });
  }

  const facultyUser = await prisma.user.upsert({
    where: { email: 'faculty.aiml@srecnandyal.edu.in' },
    update: {
      role: Role.FACULTY,
      status: 'ACTIVE',
      departmentId: aimlDept.id,
      facultyId: faculty.id,
    },
    create: {
      email: 'faculty.aiml@srecnandyal.edu.in',
      name: 'A. Ramesh (Asst. Prof)',
      role: Role.FACULTY,
      status: 'ACTIVE',
      departmentId: aimlDept.id,
      facultyId: faculty.id,
    },
  });

  // 8. Student Account & Student Profile (Sai Kumar - 22091A3202)
  const student = await prisma.student.upsert({
    where: { rollNumber: '22091A3202' },
    update: {
      name: 'P. Sai Kumar',
      departmentId: aimlDept.id,
      departmentName: aimlDept.name,
      batchId: batch.id,
      batch: '2022-2026',
      sectionId: section.id,
      section: 'A',
      email: '22091a3202@srecnandyal.edu.in',
      bio: 'AIML student interested in Computer Vision and Robotics.',
      headline: 'Student & AI Researcher | JNTUA Roll 22091A3202',
    },
    create: {
      rollNumber: '22091A3202',
      name: 'P. Sai Kumar',
      departmentId: aimlDept.id,
      departmentName: aimlDept.name,
      batchId: batch.id,
      batch: '2022-2026',
      sectionId: section.id,
      section: 'A',
      email: '22091a3202@srecnandyal.edu.in',
      bio: 'AIML student interested in Computer Vision and Robotics.',
      headline: 'Student & AI Researcher | JNTUA Roll 22091A3202',
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: '22091a3202@srecnandyal.edu.in' },
    update: {
      name: 'P. Sai Kumar (Student)',
      role: Role.STUDENT,
      status: 'ACTIVE',
      departmentId: aimlDept.id,
      studentId: student.id,
    },
    create: {
      email: '22091a3202@srecnandyal.edu.in',
      name: 'P. Sai Kumar (Student)',
      role: Role.STUDENT,
      status: 'ACTIVE',
      departmentId: aimlDept.id,
      studentId: student.id,
    },
  });

  console.log('[Seed] All 5 institutional roles seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
