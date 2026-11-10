import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function syncAllNames() {
  console.log('=== SYNCHRONIZING USER NAMES WITH OFFICIAL ACADEMIC RECORDS ===\n');

  const users = await prisma.user.findMany({
    include: { faculty: true, student: true },
  });

  let syncedCount = 0;
  for (const u of users) {
    const officialName = u.faculty?.name || u.student?.name;
    if (officialName && u.name !== officialName) {
      console.log(`Syncing user ${u.email}: "${u.name}" -> "${officialName}"`);
      await prisma.user.update({
        where: { id: u.id },
        data: { name: officialName },
      });

      // Synchronize any achievements authored by this user
      if (u.facultyId) {
        await prisma.achievement.updateMany({
          where: { facultyId: u.facultyId },
          data: { personName: officialName },
        });
      }
      if (u.studentId) {
        await prisma.achievement.updateMany({
          where: { primaryStudentId: u.studentId },
          data: { personName: officialName },
        });
      }

      syncedCount++;
    }
  }

  console.log(`\nSuccessfully synchronized ${syncedCount} user records with official academic records.`);
}

syncAllNames()
  .catch((e) => {
    console.error('Failed to sync names:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
