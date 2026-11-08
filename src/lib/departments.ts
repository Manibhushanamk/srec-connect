import { prisma } from './prisma';

export async function getAllDepartments() {
  return prisma.department.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });
}

export async function getDepartmentByCode(code: string) {
  return prisma.department.findUnique({
    where: { code },
  });
}

export async function getDepartmentById(id: string) {
  return prisma.department.findUnique({
    where: { id },
  });
}

export async function getDepartmentWithStats(id: string) {
  const [students, faculty, achievements, events] = await Promise.all([
    prisma.student.count({ where: { departmentId: id, isActive: true } }),
    prisma.faculty.count({ where: { departmentId: id, isActive: true } }),
    prisma.achievement.count({ where: { departmentId: id, status: 'PUBLISHED' } }),
    prisma.event.count({ where: { departmentId: id, status: 'UPCOMING' } }),
  ]);
  
  return { students, faculty, achievements, events };
}

export const DEPARTMENT_CODES = [
  'AIML', 'CSE', 'CSD', 'CSG', 'CSIT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'MCA'
] as const;

export type DepartmentCode = typeof DEPARTMENT_CODES[number];

export function isValidDepartmentCode(code: string): code is DepartmentCode {
  return DEPARTMENT_CODES.includes(code as DepartmentCode);
}

export const DEPARTMENT_DISPLAY_ORDER: Record<DepartmentCode, number> = {
  AIML: 1,
  CSE: 2,
  CSD: 3,
  CSG: 4,
  CSIT: 5,
  ECE: 6,
  EEE: 7,
  MECH: 8,
  CIVIL: 9,
  MBA: 10,
  MCA: 11,
};