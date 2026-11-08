import { PrismaClient, Role, UserStatus } from '@prisma/client';
import { hasPermission, requirePermission, PERMISSIONS, canAccessAdmin } from '../src/lib/rbac';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Running Phase 2 Authentication & RBAC Verification Tests...');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      process.exit(1);
    }
  }

  // Test 1: Super Admin has all permissions
  const superAdminContext = {
    id: 'u-admin',
    email: 'manibhushanam4k@gmail.com',
    role: Role.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
  };
  assert(hasPermission(superAdminContext, PERMISSIONS.USERS_MANAGE_ROLES), 'SUPER_ADMIN can manage roles');
  assert(hasPermission(superAdminContext, PERMISSIONS.SYSTEM_SETTINGS_MANAGE), 'SUPER_ADMIN can manage system settings');
  assert(hasPermission(superAdminContext, PERMISSIONS.INCIDENTS_RESOLVE), 'SUPER_ADMIN can resolve incidents');

  // Test 2: Student cannot elevate permissions or access admin
  const studentContext = {
    id: 'u-student',
    email: '22091a3201@srecnandyal.edu.in',
    role: Role.STUDENT,
    status: UserStatus.ACTIVE,
  };
  assert(!hasPermission(studentContext, PERMISSIONS.USERS_STUDENT_CREATE), 'STUDENT cannot create student accounts');
  assert(!hasPermission(studentContext, PERMISSIONS.SYSTEM_SETTINGS_MANAGE), 'STUDENT cannot manage settings');
  assert(!canAccessAdmin(studentContext), 'STUDENT cannot access admin console');

  // Test 3: Faculty can review achievements but cannot resolve final formal discipline
  const facultyContext = {
    id: 'u-faculty',
    email: 'faculty@srecnandyal.edu.in',
    role: Role.FACULTY,
    status: UserStatus.ACTIVE,
  };
  assert(hasPermission(facultyContext, PERMISSIONS.ACHIEVEMENTS_REVIEW), 'FACULTY can review achievements');
  assert(!hasPermission(facultyContext, PERMISSIONS.INCIDENTS_RESOLVE), 'FACULTY cannot resolve final formal disciplinary actions');

  // Test 4: HOD can resolve incidents and review achievements
  const hodContext = {
    id: 'u-hod',
    email: 'hod.aiml@srecnandyal.edu.in',
    role: Role.HOD,
    status: UserStatus.ACTIVE,
  };
  assert(hasPermission(hodContext, PERMISSIONS.INCIDENTS_RESOLVE), 'HOD can resolve incidents');
  assert(hasPermission(hodContext, PERMISSIONS.ACHIEVEMENTS_ESCALATE), 'HOD can handle achievement escalations');

  // Test 5: Suspended user loses all permissions
  const suspendedContext = {
    id: 'u-suspended',
    email: 'suspended@srecnandyal.edu.in',
    role: Role.SUPER_ADMIN,
    status: UserStatus.SUSPENDED,
  };
  assert(!hasPermission(suspendedContext, PERMISSIONS.POSTS_CREATE), 'SUSPENDED user denied even if role is SUPER_ADMIN');

  // Test 6: Database verify Super Admin in Neon DB
  const dbSuperAdmin = await prisma.user.findUnique({
    where: { email: 'manibhushanam4k@gmail.com' },
    include: { student: true },
  });
  assert(!!dbSuperAdmin, 'Super Admin user exists in Neon DB');
  assert(dbSuperAdmin?.role === Role.SUPER_ADMIN, 'Super Admin has exact Role.SUPER_ADMIN in Neon DB');
  assert(dbSuperAdmin?.studentId === null, 'Super Admin is distinct administrative role with no student anchor');

  // Verify Student User is correctly linked to Permanent University Roll Number (22091A3201)
  const studentUser = await prisma.user.findUnique({
    where: { email: '22091a3201@srecnandyal.edu.in' },
    include: { student: true },
  });
  assert(studentUser?.student?.rollNumber === '22091A3201', 'Permanent University Roll Number (22091A3201) correctly linked to Student user');

  console.log(`\n🎉 Test Results: ${passed}/${total} tests passed successfully!`);
}

runTests()
  .catch((e) => {
    console.error('Test execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
