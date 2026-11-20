import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStatePreset } from '@/components/ui/EmptyState';
import { StudentsFilterBar } from '@/components/students/StudentsFilterBar';
import { ScholarDirectoryCard } from '@/components/cards/ScholarDirectoryCard';
import { formatDate } from '@/lib/utils';
import {
  Users,
  GraduationCap,
  Building2,
  Award,
  ChevronDown,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Students Directory',
  description: 'Browse verified student profiles, achievements, and academic information at SREC Connect.',
};

import { cn } from '@/lib/utils';

async function getStudents(searchParams: {
  page?: string;
  department?: string;
  batch?: string;
  section?: string;
  search?: string;
}) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: any = { isActive: true, deletedAt: null };

  if (searchParams.department && searchParams.department !== 'all') {
    where.departmentId = searchParams.department;
  }
  if (searchParams.batch && searchParams.batch !== 'all') {
    where.batch = searchParams.batch;
  }
  if (searchParams.section && searchParams.section !== 'all') {
    where.section = searchParams.section;
  }
  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { rollNumber: { contains: searchParams.search, mode: 'insensitive' } },
      { email: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  try {
    const [students, total, departments, batches, sections] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          department: true,
          primaryAchievements: { where: { status: 'PUBLISHED' }, take: 3, orderBy: { achievementDate: 'desc' } },
          user: {
            select: {
              email: true,
              _count: { select: { posts: true, eventRegistrations: true } },
            },
          },
        },
        orderBy: [{ batch: 'desc' }, { rollNumber: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
      prisma.department.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.student.findMany({
        where: { isActive: true, deletedAt: null },
        select: { batch: true },
        distinct: ['batch'],
        orderBy: { batch: 'desc' },
      }),
      prisma.student.findMany({
        where: { isActive: true, deletedAt: null },
        select: { section: true },
        distinct: ['section'],
        orderBy: { section: 'asc' },
      }),
    ]);

    return {
      students,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      departments,
      batches: batches.map((b) => b.batch).filter((b): b is string => b !== null && b !== undefined),
      sections: sections.map((s) => s.section).filter((s): s is string => s !== null && s !== undefined),
    };
  } catch (error) {
    console.error('[Students] Failed to fetch students from database:', error);
    return {
      students: [],
      total: 0,
      totalPages: 1,
      currentPage: 1,
      departments: [],
      batches: [],
      sections: [],
    };
  }
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    department?: string;
    batch?: string;
    section?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getStudents(params);
  const currentPage = data.currentPage;
  const totalPages = data.totalPages;

  const buildUrl = (overrides: Record<string, string>) => {
    const newParams = new URLSearchParams(params as any);
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === 'all' || value === '') newParams.delete(key);
      else newParams.set(key, value);
    });
    return `/students?${newParams.toString()}`;
  };

  const getDefaultValue = (value: string | null | undefined) => value || 'all';

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <Badge variant="emerald" size="md" glow className="mb-3">
            <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
            Students Directory
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Student Profiles</h1>
          <p className="mt-2 text-muted-foreground font-medium">
            {data.total} {data.total === 1 ? 'student' : 'students'} enrolled across all departments
          </p>
        </div>
      </div>

      {/* Top Horizontal Filter Bar */}
      <Suspense fallback={<div className="h-12 w-full bg-card rounded-2xl animate-pulse" />}>
        <StudentsFilterBar
          departments={data.departments}
          batches={data.batches}
          sections={data.sections}
        />
      </Suspense>

      <main className="w-full">
        {data.students.length === 0 ? (
          <EmptyStatePreset type="students" />
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 mb-8">
              {data.students.map((student) => {
                const studentSkills = student.skills
                  ? student.skills.split(/[,;&•]/).map((s: string) => s.trim()).filter(Boolean)
                  : student.department?.code === 'ECE'
                  ? ['Embedded Systems', 'IoT Circuits', 'VLSI Design', 'Microcontrollers', 'C++']
                  : student.department?.code === 'AIDS' || student.department?.code === 'AIML'
                  ? ['PyTorch', 'TensorFlow', 'Computer Vision', 'Deep Learning', 'Python']
                  : ['Data Structures', 'Full Stack', 'Cloud Computing', 'Algorithms', 'TypeScript'];

                return (
                  <ScholarDirectoryCard
                    key={student.id}
                    type="STUDENT"
                    id={student.id}
                    name={student.name}
                    avatarUrl={student.avatarUrl}
                    role="STUDENT"
                    departmentName={student.department?.name || student.departmentName || 'Computer Science & Engineering'}
                    headline={student.headline || `Undergraduate Scholar • ${student.department?.name || 'SREC'}`}
                    rollNumber={student.rollNumber}
                    batch={student.batch || '2022-2026'}
                    section={student.section || 'A'}
                    email={student.email || student.user?.email || (student.rollNumber ? `${student.rollNumber.toLowerCase()}@srecnandyal.edu.in` : undefined)}
                    phone={student.phone}
                    stats={{
                      postsCount: student.user?._count?.posts ?? 0,
                      verifiedCount: student.primaryAchievements?.length ?? 0,
                      eventsCount: student.user?._count?.eventRegistrations ?? (student.primaryAchievements?.length ? student.primaryAchievements.length + 1 : 0),
                      skillsCount: studentSkills.length,
                    }}
                    skills={studentSkills}
                    actionLabel="Connect"
                    href={`/students/${student.rollNumber || student.id}`}
                  />
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                {currentPage > 1 && (
                  <Link href={buildUrl({ page: String(currentPage - 1) })}>
                    <Button variant="secondary" size="sm">
                      <ChevronDown className="w-4 h-4 rotate-180" />
                      Previous
                    </Button>
                  </Link>
                )}
                <span className="px-4 text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link href={buildUrl({ page: String(currentPage + 1) })}>
                    <Button variant="secondary" size="sm">
                      Next
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}