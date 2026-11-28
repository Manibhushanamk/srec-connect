import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * Cached active departments list (revalidated every 5 minutes).
 */
export const getCachedDepartments = unstable_cache(
  async () => {
    return prisma.department.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  },
  ['public-active-departments'],
  { revalidate: 300, tags: ['departments'] }
);

/**
 * Cached active categories for achievements/events (revalidated every 5 minutes).
 */
export function getCachedCategories(types: string[]) {
  const key = [...types].sort().join(',');
  return unstable_cache(
    async () => {
      return prisma.category.findMany({
        where: { type: { in: types }, isActive: true, deletedAt: null },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
    },
    ['public-active-categories', key],
    { revalidate: 300, tags: ['categories'] }
  )();
}

/**
 * Cached distinct academic years for published achievements (revalidated every 2 minutes).
 */
export const getCachedAchievementAcademicYears = unstable_cache(
  async () => {
    const rows = await prisma.achievement.findMany({
      where: { status: { in: ['APPROVED', 'PUBLISHED'] }, deletedAt: null },
      select: { academicYear: true },
      distinct: ['academicYear'],
      orderBy: { academicYear: 'desc' },
    });
    return rows.map((a) => a.academicYear).filter((y): y is string => Boolean(y));
  },
  ['public-achievement-academic-years'],
  { revalidate: 120, tags: ['achievements'] }
);

/**
 * Cached distinct academic years for events (revalidated every 2 minutes).
 */
export const getCachedEventAcademicYears = unstable_cache(
  async () => {
    const rows = await prisma.event.findMany({
      where: { deletedAt: null },
      select: { academicYear: true },
      distinct: ['academicYear'],
      orderBy: { academicYear: 'desc' },
    });
    return rows.map((a) => a.academicYear).filter((y): y is string => Boolean(y));
  },
  ['public-event-academic-years'],
  { revalidate: 120, tags: ['events'] }
);
