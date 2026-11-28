import { PrismaClient, Role, AdminType, PersonType, SubmissionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { code: 'AIML', name: 'Artificial Intelligence & Machine Learning', fullName: 'Department of Artificial Intelligence & Machine Learning', shortName: 'AIML', icon: '🤖', hodName: 'Dr. S. Venkateswarlu', hodEmail: 'hod.aiml@srec.ac.in', intake: 60, established: 2022, displayOrder: 1 },
  { code: 'CSE', name: 'Computer Science & Engineering', fullName: 'Department of Computer Science & Engineering', shortName: 'CSE', icon: '💻', hodName: 'Dr. P. Sreenivasulu', hodEmail: 'hod.cse@srec.ac.in', intake: 180, established: 2007, displayOrder: 2 },
  { code: 'CSD', name: 'Computer Science & Engineering (Data Science)', fullName: 'Department of CSE (Data Science)', shortName: 'CSD', icon: '📊', hodName: 'Dr. K. Srinivasa Rao', hodEmail: 'hod.csd@srec.ac.in', intake: 60, established: 2021, displayOrder: 3 },
  { code: 'CSG', name: 'Computer Science & Engineering (Cyber Security)', fullName: 'Department of CSE (Cyber Security)', shortName: 'CSG', icon: '🔒', hodName: 'Dr. B. Nageswara Rao', hodEmail: 'hod.csg@srec.ac.in', intake: 60, established: 2021, displayOrder: 4 },
  { code: 'CSIT', name: 'Computer Science & Information Technology', fullName: 'Department of Computer Science & Information Technology', shortName: 'CSIT', icon: '🌐', hodName: 'Dr. G. Sreenivasa Rao', hodEmail: 'hod.csit@srec.ac.in', intake: 60, established: 2011, displayOrder: 5 },
  { code: 'ECE', name: 'Electronics & Communication Engineering', fullName: 'Department of Electronics & Communication Engineering', shortName: 'ECE', icon: '📡', hodName: 'Dr. M. Srinivasa Rao', hodEmail: 'hod.ece@srec.ac.in', intake: 120, established: 2007, displayOrder: 6 },
  { code: 'EEE', name: 'Electrical & Electronics Engineering', fullName: 'Department of Electrical & Electronics Engineering', shortName: 'EEE', icon: '⚡', hodName: 'Dr. V. Srinivasa Rao', hodEmail: 'hod.eee@srec.ac.in', intake: 60, established: 2007, displayOrder: 7 },
  { code: 'MECH', name: 'Mechanical Engineering', fullName: 'Department of Mechanical Engineering', shortName: 'MECH', icon: '⚙️', hodName: 'Dr. S. Sreenivasa Rao', hodEmail: 'hod.mech@srec.ac.in', intake: 60, established: 2007, displayOrder: 8 },
  { code: 'CIVIL', name: 'Civil Engineering', fullName: 'Department of Civil Engineering', shortName: 'CIVIL', icon: '🏗️', hodName: 'Dr. R. Sreenivasa Rao', hodEmail: 'hod.civil@srec.ac.in', intake: 60, established: 2007, displayOrder: 9 },
  { code: 'MBA', name: 'Master of Business Administration', fullName: 'Department of Master of Business Administration', shortName: 'MBA', icon: '📈', hodName: 'Dr. K. Sreenivasa Rao', hodEmail: 'hod.mba@srec.ac.in', intake: 60, established: 2009, displayOrder: 10 },
  { code: 'MCA', name: 'Master of Computer Applications', fullName: 'Department of Master of Computer Applications', shortName: 'MCA', icon: '🖥️', hodName: 'Dr. P. Sreenivasa Rao', hodEmail: 'hod.mca@srec.ac.in', intake: 60, established: 2009, displayOrder: 11 },
];

const ACHIEVEMENT_CATEGORIES = [
  { name: 'Research Publications & Patents', type: 'ACHIEVEMENT', displayOrder: 1 },
  { name: 'Journal Publications (SCI / Scopus)', type: 'ACHIEVEMENT', displayOrder: 2 },
  { name: 'Patents & Intellectual Property', type: 'ACHIEVEMENT', displayOrder: 3 },
  { name: 'Book Chapters & Monographs', type: 'ACHIEVEMENT', displayOrder: 4 },
  { name: 'Research Grants & Funding', type: 'ACHIEVEMENT', displayOrder: 5 },
  { name: 'Hackathons & Innovation Contests', type: 'ACHIEVEMENT', displayOrder: 6 },
  { name: 'Ideathons & Startup Pitch', type: 'ACHIEVEMENT', displayOrder: 7 },
  { name: 'Paper & Poster Presentations', type: 'ACHIEVEMENT', displayOrder: 8 },
  { name: 'Project Expo & Robotics', type: 'ACHIEVEMENT', displayOrder: 9 },
  { name: 'Coding Competitions & CP', type: 'ACHIEVEMENT', displayOrder: 10 },
  { name: 'NPTEL / MOOC & Industry Certifications', type: 'ACHIEVEMENT', displayOrder: 11 },
  { name: 'Student Placements & Internships', type: 'ACHIEVEMENT', displayOrder: 12 },
  { name: 'Faculty Honors & Awards', type: 'ACHIEVEMENT', displayOrder: 13 },
  { name: 'Institutional MoUs & Collaborations', type: 'ACHIEVEMENT', displayOrder: 14 },
  { name: 'Open Source Contributions', type: 'ACHIEVEMENT', displayOrder: 15 },
  { name: 'Sports & Athletics', type: 'ACHIEVEMENT', displayOrder: 16 },
  { name: 'Extracurricular & Cultural', type: 'ACHIEVEMENT', displayOrder: 17 },
  { name: 'NSS / NCC & Community Service', type: 'ACHIEVEMENT', displayOrder: 18 },
  { name: 'Scholarships & Fellowships', type: 'ACHIEVEMENT', displayOrder: 19 },
  { name: 'Leadership & Student Chapters', type: 'ACHIEVEMENT', displayOrder: 20 },
  { name: 'Workshops & Technical Bootcamps', type: 'BOTH', displayOrder: 21 },
  { name: 'Seminars & Conferences', type: 'BOTH', displayOrder: 22 },
  { name: 'Faculty Development Programs (FDP)', type: 'BOTH', displayOrder: 23 },
  { name: 'Guest Lectures & Alumni Talks', type: 'EVENT', displayOrder: 24 },
  { name: 'Student Club Activities', type: 'EVENT', displayOrder: 25 },
  { name: 'Industrial Visits & Training', type: 'BOTH', displayOrder: 26 },
  { name: 'Symposiums & Technical Fests', type: 'EVENT', displayOrder: 27 },
];

const SYSTEM_SETTINGS = [
  { key: 'ROOT_ADMIN_EMAIL', value: 'manibhushanam4k@gmail.com', description: 'Root Sovereign Admin email (immutable)' },
  { key: 'APP_NAME', value: 'SREC Connect v3.0', description: 'Application name' },
  { key: 'COLLEGE_NAME', value: 'Santhiram Engineering College (Autonomous), Nandyal', description: 'College full name' },
  { key: 'MAX_BULK_ROWS', value: '500', description: 'Maximum rows allowed in bulk upload' },
  { key: 'ENABLE_BULK_UPLOAD', value: 'true', description: 'Enable/disable bulk upload feature' },
  { key: 'DEFAULT_BATCH', value: '2024-2028', description: 'Default academic batch for new students' },
];

async function main() {
  console.log('🌱 Starting database seed...');

  console.log('📦 Seeding Departments...');
  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: dept,
      create: dept,
    });
  }
  console.log(`✅ ${DEPARTMENTS.length} departments seeded`);

  console.log('📦 Seeding Categories...');
  for (const cat of ACHIEVEMENT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: cat,
      create: cat,
    });
  }
  console.log(`✅ ${ACHIEVEMENT_CATEGORIES.length} categories seeded`);

  console.log('📦 Seeding System Settings...');
  for (const setting of SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }
  console.log(`✅ ${SYSTEM_SETTINGS.length} system settings seeded`);

  console.log('👑 Seeding Root Sovereign Admin...');
  const rootAdmin = await prisma.user.upsert({
    where: { email: 'manibhushanam4k@gmail.com' },
    update: {
      name: 'Mani Bhushanam K',
      role: Role.ADMIN,
      adminType: AdminType.ROOT,
      isRoot: true,
      status: 'ACTIVE',
    },
    create: {
      email: 'manibhushanam4k@gmail.com',
      name: 'Mani Bhushanam K',
      role: Role.ADMIN,
      adminType: AdminType.ROOT,
      isRoot: true,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Root Admin created: ${rootAdmin.email}`);

  console.log('🌱 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });