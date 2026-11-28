import prisma from '@/lib/prisma';
import { sanitizeText } from '@/lib/sanitize';
import { ACADEMIC_BATCH_OPTIONS, parseBatchYearRange } from '@/lib/studentHelper';

/**
 * Resolves an existing categoryId or finds/creates a Category row from customCategoryName.
 * Uses case-insensitive name matching to prevent duplicates.
 */
export async function resolveOrCreateCategoryId(input: {
  categoryId?: string | null;
  customCategoryName?: string | null;
  type?: 'ACHIEVEMENT' | 'EVENT' | 'BOTH';
}): Promise<string | null> {
  const customName = input.customCategoryName ? sanitizeText(input.customCategoryName) : '';
  if (customName && customName.length >= 2) {
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: customName, mode: 'insensitive' },
      },
      select: { id: true, deletedAt: true, isActive: true, type: true },
    });

    if (existing) {
      if (existing.deletedAt || !existing.isActive) {
        await prisma.category.update({
          where: { id: existing.id },
          data: {
            deletedAt: null,
            isActive: true,
            ...(input.type && existing.type !== input.type && existing.type !== 'BOTH'
              ? { type: 'BOTH' }
              : {}),
          },
        });
      }
      return existing.id;
    }

    const created = await prisma.category.create({
      data: {
        name: customName.slice(0, 80),
        type: input.type || 'BOTH',
        displayOrder: 99,
        isActive: true,
      },
      select: { id: true },
    });
    return created.id;
  }

  return input.categoryId?.trim() || null;
}

/**
 * Ensures one or more batch names exist in the Batch registry table
 * so newly introduced custom cohorts immediately surface across directory selectors.
 */
export async function ensureBatchesRegistered(batchNames: Array<string | null | undefined>): Promise<void> {
  const normalizedMap = new Map<string, { name: string; startYear: number; endYear: number }>();

  for (const raw of batchNames) {
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (!trimmed) continue;
    const parsed = parseBatchYearRange(trimmed);
    if (!normalizedMap.has(parsed.name)) {
      normalizedMap.set(parsed.name, parsed);
    }
  }

  const rows = Array.from(normalizedMap.values());
  if (rows.length === 0) return;

  await prisma.batch.createMany({
    data: rows.map((r) => ({
      name: r.name,
      startYear: r.startYear,
      endYear: r.endYear,
      isActive: true,
    })),
    skipDuplicates: true,
  });
}

/**
 * Returns sorted combined batches from Batch registry + distinct Student cohorts + built-in defaults.
 */
export async function getAllAvailableBatches(): Promise<Array<{ value: string; label: string }>> {
  const [dbBatches, studentBatches] = await Promise.all([
    prisma.batch.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: [{ startYear: 'desc' }, { name: 'desc' }],
    }),
    prisma.student.findMany({
      where: { deletedAt: null, batch: { not: null } },
      select: { batch: true },
      distinct: ['batch'],
    }),
  ]);

  const map = new Map<string, string>();
  for (const opt of ACADEMIC_BATCH_OPTIONS) {
    map.set(opt.value, opt.label);
  }
  for (const b of dbBatches) {
    if (b.name && !map.has(b.name)) {
      map.set(b.name, `${b.name} (Custom Cohort)`);
    }
  }
  for (const s of studentBatches) {
    if (s.batch && !map.has(s.batch)) {
      map.set(s.batch, `${s.batch} (Custom Cohort)`);
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([value, label]) => ({ value, label }));
}
