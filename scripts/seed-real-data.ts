import { PrismaClient, Role, AdminType, PersonType, SubmissionStatus } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding SREC Connect v3.0 with REAL BACKUP DATA ---');

  const backupPath = '/home/kmanib/Documents/v3_backup_pre_revert.json';
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found at ${backupPath}`);
  }

  const raw = fs.readFileSync(backupPath, 'utf8');
  const backup = JSON.parse(raw);
  const data = backup.data || backup.tables || backup;

  console.log(`Loaded backup dated: ${backup.backupDate || 'Unknown'}`);

  // 1. Departments
  console.log(`1. Seeding ${data.departments.length} Real Departments...`);
  const deptsByCode = new Map<string, any>();
  for (const d of data.departments) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: {
        name: d.name,
        fullName: d.fullName,
        description: d.description,
        icon: d.icon || 'BookOpen',
        hodName: d.hodName,
        hodEmail: d.hodEmail,
        hodPhone: d.hodPhone,
        vision: d.vision,
        mission: d.mission,
        intake: d.intake ?? 60,
        established: d.established ?? 2022,
        bannerUrl: d.bannerUrl,
        displayOrder: d.displayOrder ?? 0,
        isActive: d.isActive ?? true,
      },
      create: {
        id: d.id,
        code: d.code,
        name: d.name,
        fullName: d.fullName,
        description: d.description,
        icon: d.icon || 'BookOpen',
        hodName: d.hodName,
        hodEmail: d.hodEmail,
        hodPhone: d.hodPhone,
        vision: d.vision,
        mission: d.mission,
        intake: d.intake ?? 60,
        established: d.established ?? 2022,
        bannerUrl: d.bannerUrl,
        displayOrder: d.displayOrder ?? 0,
        isActive: d.isActive ?? true,
      },
    });
    deptsByCode.set(d.code, dept);
  }
  console.log(`✓ Seeded ${deptsByCode.size} departments.`);

  const aimlDept = deptsByCode.get('AIML') || Array.from(deptsByCode.values())[0];
  const csgDept = deptsByCode.get('CSG');
  const csdDept = deptsByCode.get('CSD');
  const cseDept = deptsByCode.get('CSE');

  function resolveDeptId(deptStr?: string | null): string {
    if (!deptStr) return aimlDept.id;
    const lower = deptStr.toLowerCase();
    if (lower.includes('aiml') || lower.includes('artificial intelligence')) return aimlDept.id;
    if (lower.includes('design') || lower.includes('csg')) return csgDept?.id || csdDept?.id || aimlDept.id;
    if (lower.includes('data science') || lower.includes('csd')) return csdDept?.id || aimlDept.id;
    if (lower.includes('computer science') || lower.includes('cse')) return cseDept?.id || aimlDept.id;
    for (const [code, dept] of deptsByCode.entries()) {
      if (lower.includes(code.toLowerCase()) || lower.includes(dept.name.toLowerCase())) {
        return dept.id;
      }
    }
    return aimlDept.id;
  }

  // 2. System Settings
  console.log(`2. Seeding ${data.systemSettings.length} Real System Settings...`);
  for (const s of data.systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: { key: s.key, value: s.value, description: s.description },
    });
  }
  // Ensure ROOT_ADMIN_EMAIL is present
  await prisma.systemSetting.upsert({
    where: { key: 'ROOT_ADMIN_EMAIL' },
    update: { value: 'manibhushanam4k@gmail.com' },
    create: {
      key: 'ROOT_ADMIN_EMAIL',
      value: 'manibhushanam4k@gmail.com',
      description: 'Sovereign Root Administrator Email',
    },
  });
  console.log(`✓ System Settings seeded.`);

  // 3. Categories
  console.log(`3. Seeding ${data.categories.length} Real Categories...`);
  const validCategoryIds = new Set<string>();
  for (const c of data.categories) {
    const cat = await prisma.category.upsert({
      where: { name: c.name },
      update: {
        description: c.description,
        type: c.type || 'BOTH',
        isActive: c.isActive ?? true,
        displayOrder: c.displayOrder ?? 0,
      },
      create: {
        id: c.id,
        name: c.name,
        description: c.description,
        type: c.type || 'BOTH',
        isActive: c.isActive ?? true,
        displayOrder: c.displayOrder ?? 0,
      },
    });
    validCategoryIds.add(cat.id);
  }
  console.log(`✓ Seeded ${validCategoryIds.size} categories.`);

  // 4. Users
  console.log(`4. Seeding ${data.users.length} Real Users...`);
  const userMap = new Map<string, string>(); // email -> id
  for (const u of data.users) {
    const isRootAdmin = u.email === 'manibhushanam4k@gmail.com';
    const deptId = resolveDeptId(u.department);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: isRootAdmin ? Role.ADMIN : (u.role === 'ADMIN' ? Role.ADMIN : Role.STUDENT),
        adminType: isRootAdmin ? AdminType.ROOT : (u.adminType || (u.role === 'ADMIN' ? AdminType.DEPARTMENT : null)),
        isRoot: isRootAdmin,
        departmentId: deptId,
        departmentName: u.department,
        designation: u.designation,
        avatarUrl: u.avatarUrl,
        status: u.status || 'ACTIVE',
      },
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: isRootAdmin ? Role.ADMIN : (u.role === 'ADMIN' ? Role.ADMIN : Role.STUDENT),
        adminType: isRootAdmin ? AdminType.ROOT : (u.adminType || (u.role === 'ADMIN' ? AdminType.DEPARTMENT : null)),
        isRoot: isRootAdmin,
        departmentId: deptId,
        departmentName: u.department,
        designation: u.designation,
        avatarUrl: u.avatarUrl,
        status: u.status || 'ACTIVE',
      },
    });
    userMap.set(u.email, user.id);
  }
  const rootUserId = userMap.get('manibhushanam4k@gmail.com') || Array.from(userMap.values())[0];
  console.log(`✓ Seeded users. Root admin ID: ${rootUserId}`);

  // 5. Faculty
  console.log(`5. Seeding ${data.faculty.length} Real Faculty Members...`);
  const facultyMap = new Map<string, string>(); // id -> id
  for (const f of data.faculty) {
    const deptId = resolveDeptId(f.department);
    const fac = await prisma.faculty.upsert({
      where: { id: f.id },
      update: {
        name: f.name,
        designation: f.designation,
        roleCategory: f.roleCategory,
        departmentId: deptId,
        departmentName: f.department,
        degrees: f.degrees,
        experience: f.experience,
        email: f.email,
        cabin: f.cabin,
        specialization: f.specialization,
        bio: f.bio,
        avatarUrl: f.avatarUrl,
        googleScholar: f.googleScholar,
        displayOrder: f.displayOrder ?? 0,
        isActive: f.isActive ?? true,
      },
      create: {
        id: f.id,
        name: f.name,
        designation: f.designation,
        roleCategory: f.roleCategory,
        departmentId: deptId,
        departmentName: f.department,
        degrees: f.degrees,
        experience: f.experience,
        email: f.email,
        cabin: f.cabin,
        specialization: f.specialization,
        bio: f.bio,
        avatarUrl: f.avatarUrl,
        googleScholar: f.googleScholar,
        displayOrder: f.displayOrder ?? 0,
        isActive: f.isActive ?? true,
      },
    });
    facultyMap.set(f.id, fac.id);
  }
  console.log(`✓ Seeded ${facultyMap.size} faculty members.`);

  // 6. Students
  console.log(`6. Seeding ${data.students.length} Real Students...`);
  const studentMap = new Map<string, string>(); // id -> id
  for (const s of data.students) {
    const deptId = resolveDeptId(s.department);
    const cleanRoll = s.rollNumber ? s.rollNumber.trim().toUpperCase() : s.id;
    const stu = await prisma.student.upsert({
      where: { rollNumber: cleanRoll },
      update: {
        name: s.name,
        departmentId: deptId,
        departmentName: s.department,
        batch: s.batch || '2022-2026',
        section: s.section || 'A',
        email: s.email,
        phone: s.phone,
        bio: s.bio,
        avatarUrl: s.avatarUrl,
        isActive: s.isActive ?? true,
      },
      create: {
        id: s.id,
        rollNumber: cleanRoll,
        name: s.name,
        departmentId: deptId,
        departmentName: s.department,
        batch: s.batch || '2022-2026',
        section: s.section || 'A',
        email: s.email,
        phone: s.phone,
        bio: s.bio,
        avatarUrl: s.avatarUrl,
        isActive: s.isActive ?? true,
      },
    });
    studentMap.set(s.id, stu.id);
  }
  console.log(`✓ Seeded ${studentMap.size} students.`);

  // 7. Achievements
  console.log(`7. Seeding ${data.achievements.length} Real Achievements...`);
  const achievementMap = new Map<string, string>();
  for (const a of data.achievements) {
    const deptId = resolveDeptId(a.departmentProgram);
    const categoryExists = validCategoryIds.has(a.categoryId);
    if (!categoryExists) {
      console.warn(`Skipping or reassigning unknown categoryId ${a.categoryId}`);
      continue;
    }

    const studentExists = a.primaryStudentId ? studentMap.has(a.primaryStudentId) : false;
    const facultyExists = a.facultyId ? facultyMap.has(a.facultyId) : false;

    const ach = await prisma.achievement.upsert({
      where: { id: a.id },
      update: {
        title: a.title,
        description: a.description,
        personName: a.personName,
        personType: a.personType === 'FACULTY' ? PersonType.FACULTY : PersonType.STUDENT,
        participationType: a.participationType || 'SOLO',
        teamName: a.teamName,
        level: a.level || 'COLLEGE',
        positionRank: a.positionRank,
        organizationEventName: a.organizationEventName,
        academicYear: a.academicYear || '2024-2025',
        achievementDate: new Date(a.achievementDate || Date.now()),
        departmentId: deptId,
        departmentName: a.departmentProgram,
        categoryId: a.categoryId,
        primaryStudentId: studentExists ? a.primaryStudentId : null,
        primaryStudentRoll: a.primaryStudentRollNumber,
        facultyId: facultyExists ? a.facultyId : null,
        facultyDesignation: a.facultyDesignation,
        tags: a.tags,
        certificateUrl: a.certificateUrl,
        googleDriveUrl: a.googleDriveUrl,
        externalLinks: a.externalUrl,
        status: (a.status as SubmissionStatus) || SubmissionStatus.PUBLISHED,
        rejectionReason: a.rejectionReason,
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
        createdById: rootUserId,
      },
      create: {
        id: a.id,
        title: a.title,
        description: a.description,
        personName: a.personName,
        personType: a.personType === 'FACULTY' ? PersonType.FACULTY : PersonType.STUDENT,
        participationType: a.participationType || 'SOLO',
        teamName: a.teamName,
        level: a.level || 'COLLEGE',
        positionRank: a.positionRank,
        organizationEventName: a.organizationEventName,
        academicYear: a.academicYear || '2024-2025',
        achievementDate: new Date(a.achievementDate || Date.now()),
        departmentId: deptId,
        departmentName: a.departmentProgram,
        categoryId: a.categoryId,
        primaryStudentId: studentExists ? a.primaryStudentId : null,
        primaryStudentRoll: a.primaryStudentRollNumber,
        facultyId: facultyExists ? a.facultyId : null,
        facultyDesignation: a.facultyDesignation,
        tags: a.tags,
        certificateUrl: a.certificateUrl,
        googleDriveUrl: a.googleDriveUrl,
        externalLinks: a.externalUrl,
        status: (a.status as SubmissionStatus) || SubmissionStatus.PUBLISHED,
        rejectionReason: a.rejectionReason,
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
        createdById: rootUserId,
      },
    });
    achievementMap.set(a.id, ach.id);
  }
  console.log(`✓ Seeded ${achievementMap.size} achievements.`);

  // 8. Achievement Students (Team Members)
  console.log(`8. Seeding Achievement Team Members...`);
  if (data.achievementStudents && Array.isArray(data.achievementStudents)) {
    let count = 0;
    for (const item of data.achievementStudents) {
      if (achievementMap.has(item.achievementId)) {
        await prisma.achievementTeamMember.upsert({
          where: {
            achievementId_rollNumber: {
              achievementId: item.achievementId,
              rollNumber: item.rollNumber,
            },
          },
          update: {
            studentName: item.studentName,
            isLeader: item.isLeader ?? false,
          },
          create: {
            id: item.id,
            achievementId: item.achievementId,
            studentId: studentMap.get(item.studentId) || null,
            rollNumber: item.rollNumber,
            studentName: item.studentName,
            isLeader: item.isLeader ?? false,
          },
        });
        count++;
      }
    }
    console.log(`✓ Seeded ${count} achievement team members.`);
  }

  // 9. Events
  console.log(`9. Seeding ${data.events.length} Real Events...`);
  for (const e of data.events) {
    const deptId = resolveDeptId(e.department);
    const categoryExists = validCategoryIds.has(e.categoryId);
    if (!categoryExists) continue;

    await prisma.event.upsert({
      where: { id: e.id },
      update: {
        title: e.title,
        description: e.description,
        departmentId: deptId,
        departmentName: e.department,
        categoryId: e.categoryId,
        startDate: new Date(e.startDate || Date.now()),
        endDate: new Date(e.endDate || Date.now()),
        venue: e.venue || 'Campus Auditorium',
        organizer: e.organizer || 'SREC',
        speaker: e.speakerResourcePerson,
        speakerResourcePerson: e.speakerResourcePerson,
        registrationInfo: e.registrationInfo,
        participantCount: e.participantCount ?? 0,
        eventReport: e.eventReport,
        posterUrl: e.posterUrl || e.googleDriveUrl,
        googleDriveUrl: e.googleDriveUrl,
        academicYear: e.academicYear || '2024-2025',
        status: e.status || 'UPCOMING',
        publishedAt: e.publishedAt ? new Date(e.publishedAt) : null,
        createdById: rootUserId,
      },
      create: {
        id: e.id,
        title: e.title,
        description: e.description,
        departmentId: deptId,
        departmentName: e.department,
        categoryId: e.categoryId,
        startDate: new Date(e.startDate || Date.now()),
        endDate: new Date(e.endDate || Date.now()),
        venue: e.venue || 'Campus Auditorium',
        organizer: e.organizer || 'SREC',
        speaker: e.speakerResourcePerson,
        speakerResourcePerson: e.speakerResourcePerson,
        registrationInfo: e.registrationInfo,
        participantCount: e.participantCount ?? 0,
        eventReport: e.eventReport,
        posterUrl: e.posterUrl || e.googleDriveUrl,
        googleDriveUrl: e.googleDriveUrl,
        academicYear: e.academicYear || '2024-2025',
        status: e.status || 'UPCOMING',
        publishedAt: e.publishedAt ? new Date(e.publishedAt) : null,
        createdById: rootUserId,
      },
    });
  }
  console.log(`✓ Seeded ${data.events.length} events.`);

  // 10. Achievement Media
  if (data.achievementMedia && Array.isArray(data.achievementMedia)) {
    console.log(`10. Seeding ${data.achievementMedia.length} Achievement Media items...`);
    for (const m of data.achievementMedia) {
      if (achievementMap.has(m.achievementId)) {
        await prisma.achievementMedia.upsert({
          where: { id: m.id },
          update: {
            url: m.url,
            fileName: m.fileName,
            fileType: m.fileType,
            fileSize: m.fileSize,
            isPublic: m.isPublic ?? true,
          },
          create: {
            id: m.id,
            achievementId: m.achievementId,
            url: m.url,
            fileName: m.fileName,
            fileType: m.fileType,
            fileSize: m.fileSize,
            isPublic: m.isPublic ?? true,
          },
        });
      }
    }
  }

  console.log('\n======================================================');
  console.log('REAL BACKUP DATA SEEDED SUCCESSFULLY TO v3_production!');
  console.log('======================================================');
}

main()
  .catch((e) => {
    console.error('Fatal seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
