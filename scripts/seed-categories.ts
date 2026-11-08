import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Categories and Events from backup...');
  const backupPath = '/home/kmanib/Documents/v3_backup_pre_revert.json';
  if (!fs.existsSync(backupPath)) {
    console.error('Backup not found');
    return;
  }

  const raw = fs.readFileSync(backupPath, 'utf8');
  const backup = JSON.parse(raw);
  const data = backup.data || backup.tables || backup;

  // 1. Categories
  for (const c of data.categories) {
    await prisma.category.upsert({
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
  }
  console.log(`✅ Seeded ${data.categories.length} categories.`);

  // 2. Sample Events
  const aimlDept = await prisma.department.findUnique({ where: { code: 'AIML' } });
  const workshopCat = await prisma.category.findFirst({ where: { name: { contains: 'Workshop', mode: 'insensitive' } } });
  const hackathonCat = await prisma.category.findFirst({ where: { name: { contains: 'Hackathon', mode: 'insensitive' } } }) || workshopCat;

  if (aimlDept && workshopCat) {
    await prisma.event.upsert({
      where: { id: 'evt-aiml-1' },
      update: {},
      create: {
        id: 'evt-aiml-1',
        title: 'Deep Learning & Edge AI Symposium 2026',
        description: 'Comprehensive national workshop on PyTorch, TensorRT and mobile vision edge inference.',
        departmentId: aimlDept.id,
        departmentName: aimlDept.name,
        categoryId: workshopCat.id,
        startDate: new Date('2026-11-20T09:30:00Z'),
        endDate: new Date('2026-11-21T17:00:00Z'),
        venue: 'APJ Abdul Kalam Seminar Hall, SREC Campus',
        organizer: 'CSE (AI & ML) Department',
        speaker: 'Dr. K. Subhashini, AI Research Lead',
        capacity: 120,
        status: 'UPCOMING',
        academicYear: '2025-2026',
      },
    });

    if (hackathonCat) {
      await prisma.event.upsert({
        where: { id: 'evt-aiml-2' },
        update: {},
        create: {
          id: 'evt-aiml-2',
          title: 'Smart India Hackathon 2026 — Internal Department Round',
          description: 'Department screening and prototype demonstration for Smart India Hackathon shortlisted problem statements.',
          departmentId: aimlDept.id,
          departmentName: aimlDept.name,
          categoryId: hackathonCat.id,
          startDate: new Date('2026-11-15T10:00:00Z'),
          endDate: new Date('2026-11-15T18:00:00Z'),
          venue: 'AIML High Performance Computing Lab 3',
          organizer: 'AIML Innovation Cell',
          capacity: 80,
          status: 'UPCOMING',
          academicYear: '2025-2026',
        },
      });
    }
    console.log('✅ Sample upcoming events seeded.');
  }

  console.log('🎉 Seed completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
