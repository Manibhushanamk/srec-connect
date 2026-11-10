import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('=== IDENTITY & NAME RELATIONSHIP AUDIT ===\n');
  const users = await prisma.user.findMany({
    include: { faculty: true, student: true },
  });

  for (const u of users) {
    const linked = u.faculty ? `Faculty: ${u.faculty.name}` : u.student ? `Student: ${u.student.name}` : 'None';
    const officialName = u.faculty?.name || u.student?.name;
    const isMismatch = officialName && u.name !== officialName;
    console.log(`[${u.email}] (Role: ${u.role})`);
    console.log(`   User Name:     "${u.name}"`);
    console.log(`   Linked Record: "${linked}"`);
    if (isMismatch) {
      console.log(`   ⚠️ MISMATCH DETECTED: User="${u.name}" vs Linked="${officialName}"`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
