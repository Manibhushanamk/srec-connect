import { PrismaClient, Role, UserStatus } from '@prisma/client';
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../src/lib/rbac';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting SREC Connect v3.0 Phase 2 Bootstrap...');

  // 1. Seed Institutional Email Domains
  const domains = ['srecnandyal.edu.in', 'gmail.com'];
  for (const domain of domains) {
    await prisma.approvedEmailDomain.upsert({
      where: { domain },
      update: { isActive: true },
      create: { domain, isActive: true },
    });
  }
  console.log('✅ Approved email domains configured.');

  // 2. Seed Granular Permissions & Role Mappings
  for (const permKey of Object.values(PERMISSIONS)) {
    const perm = await prisma.permission.upsert({
      where: { key: permKey },
      update: { description: `Permission for ${permKey}` },
      create: { key: permKey, description: `Permission for ${permKey}` },
    });

    // Map to roles per DEFAULT_ROLE_PERMISSIONS
    for (const [roleStr, allowedKeys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const role = roleStr as Role;
      if (allowedKeys.includes(permKey as any)) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            role,
            permissionId: perm.id,
          },
        });
      }
    }
  }
  console.log('✅ Granular RBAC permissions synchronized.');

  // 3. Seed Primary Department: CSE (Artificial Intelligence & Machine Learning)
  const aimlDept = await prisma.department.upsert({
    where: { code: 'AIML' },
    update: {
      name: 'CSE (AI & ML)',
      fullName: 'Computer Science & Engineering — Artificial Intelligence & Machine Learning',
      shortName: 'CSE-AIML',
      hodName: 'Dr. B. Ramanjaneyulu',
      hodEmail: 'hod.aiml@srecnandyal.edu.in',
      intake: 60,
      established: 2022,
      isActive: true,
    },
    create: {
      code: 'AIML',
      name: 'CSE (AI & ML)',
      fullName: 'Computer Science & Engineering — Artificial Intelligence & Machine Learning',
      shortName: 'CSE-AIML',
      description: 'Department of CSE (Artificial Intelligence & Machine Learning) at Santhiram Engineering College, Nandyal.',
      hodName: 'Dr. B. Ramanjaneyulu',
      hodEmail: 'hod.aiml@srecnandyal.edu.in',
      intake: 60,
      established: 2022,
      isActive: true,
    },
  });
  console.log('✅ CSE (AI & ML) Department record verified.');

  // 4. Seed Batches & Sections
  const batch2022 = await prisma.batch.upsert({
    where: { name: '2022-2026' },
    update: {},
    create: { name: '2022-2026', startYear: 2022, endYear: 2026 },
  });

  await prisma.section.upsert({
    where: { name_batchName: { name: 'A', batchName: '2022-2026' } },
    update: {},
    create: { name: 'A', batchName: '2022-2026' },
  });
  console.log('✅ Academic Batches and Sections verified.');

  // 5. Bootstrap Initial Super Admin
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'manibhushanam4k@gmail.com').toLowerCase().trim();
  const adminName = process.env.INITIAL_ADMIN_NAME || 'Mani Bhushanam K';

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      name: adminName,
      departmentId: aimlDept.id,
    },
    create: {
      email: adminEmail,
      name: adminName,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      departmentId: aimlDept.id,
    },
  });
  console.log(`⭐ Initial Super Admin bootstrapped: ${superAdmin.email} [${superAdmin.role}]`);

  // 6. Pre-provision Sample Student Profile with permanent Roll Number
  const studentEmail = 'student.aiml@srecnandyal.edu.in';
  const studentRecord = await prisma.student.upsert({
    where: { rollNumber: '22091A3201' },
    update: {
      name: 'Mani Bhushanam K',
      departmentId: aimlDept.id,
      batch: '2022-2026',
      section: 'A',
      email: adminEmail,
    },
    create: {
      rollNumber: '22091A3201',
      name: 'Mani Bhushanam K',
      departmentId: aimlDept.id,
      batch: '2022-2026',
      section: 'A',
      email: adminEmail,
      headline: 'Undergraduate Researcher • Deep Learning & Mobile Vision Specialist',
      bio: 'Pursuing B.Tech in CSE (AI & ML) at Santhiram Engineering College, Nandyal.',
    },
  });

  // Link Super Admin user to Student record for seamless portfolio testing
  await prisma.user.update({
    where: { id: superAdmin.id },
    data: { studentId: studentRecord.id },
  });
  console.log(`✅ Student identity record linked with permanent roll: ${studentRecord.rollNumber}`);

  console.log('🎉 Phase 2 Database & Auth Bootstrap Complete!');
}

main()
  .catch((e) => {
    console.error('Bootstrap error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
