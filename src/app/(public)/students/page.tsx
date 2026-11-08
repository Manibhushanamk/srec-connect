import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStatePreset } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import {
  Users,
  GraduationCap,
  Search,
  Filter,
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

  const where: any = { isActive: true };

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

  const [students, total, departments, batches, sections] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        department: true,
        primaryAchievements: { where: { status: 'PUBLISHED' }, take: 3, orderBy: { achievementDate: 'desc' } },
        user: { select: { email: true } },
      },
      orderBy: [{ batch: 'desc' }, { rollNumber: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.student.count({ where }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
    prisma.student.findMany({
      where: { isActive: true },
      select: { batch: true },
      distinct: ['batch'],
      orderBy: { batch: 'desc' },
    }),
    prisma.student.findMany({
      where: { isActive: true },
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <Badge variant="emerald" size="md" glow className="mb-3">
            <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
            Students Directory
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">Student Profiles</h1>
          <p className="mt-2 text-slate-400">
            {data.total} {data.total === 1 ? 'student' : 'students'} enrolled across all departments
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 flex-shrink-0 space-y-6">
          <Card variant="glass">
            <CardContent className="p-5 space-y-6">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </h3>

              <div>
                <label htmlFor="search" className="label-text">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="search"
                    id="search"
                    placeholder="Search by name, roll number..."
                    defaultValue={params.search || ''}
                    className="input-field pl-10"
                    onChange={(e) => window.location.href = buildUrl({ search: e.target.value, page: '1' })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="department" className="label-text">Department</label>
<select
                  id="department"
                  defaultValue={getDefaultValue(params.department)}
                  className="input-field appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2394a3b8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%27')] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                  onChange={(e) => window.location.href = buildUrl({ department: e.target.value, page: '1' })}
                >
                  <option value="all">All Departments</option>
                  {data.departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="batch" className="label-text">Batch</label>
<select
                  id="batch"
                  defaultValue={getDefaultValue(params.batch)}
                  className="input-field appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2394a3b8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%27')] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                  onChange={(e) => window.location.href = buildUrl({ batch: e.target.value, page: '1' })}
                >
                  <option value="all">All Batches</option>
                  {data.batches.map((batch) => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="section" className="label-text">Section</label>
                  <select
                  id="section"
                  defaultValue={getDefaultValue(params.section)}
                  className="input-field appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2394a3b8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%27')] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                  onChange={(e) => window.location.href = buildUrl({ section: e.target.value, page: '1' })}
                >
                  <option value="all">All Sections</option>
                  {data.sections.map((section) => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>

              <Button variant="secondary" fullWidth onClick={() => window.location.href = '/students'}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 min-w-0">
          {data.students.length === 0 ? (
            <EmptyStatePreset type="students" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {data.students.map((student) => (
                  <Link key={student.id} href={`/students/${student.id}`} className="group">
                    <Card variant="bento" hover className="h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            {student.avatarUrl ? (
                              <img src={student.avatarUrl} alt="" className="w-16 h-16 rounded-xl" />
                            ) : (
                              <span className="text-white text-2xl font-bold">{student.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                              {student.name}
                            </h3>
                            <p className="text-sm text-slate-400">{student.rollNumber}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="cyan" size="sm">{student.department?.shortName || 'N/A'}</Badge>
                          <Badge variant="brand" size="sm">{student.batch}</Badge>
                          <Badge variant="slate" size="sm">Sec {student.section}</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-slate-500">
                          {student.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{student.email}</span>
                            </div>
                          )}
                          {student.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between">
                          <Badge variant="emerald" size="sm" className="gap-1">
                            <Award className="w-3 h-3" />
                            {student.primaryAchievements.length} honors
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {currentPage > 1 && (
                    <Link href={buildUrl({ page: String(currentPage - 1) })}>
                      <Button variant="secondary" size="sm">
                        <ChevronDown className="w-4 h-4 rotate-180" />
                        Previous
                      </Button>
                    </Link>
                  )}
                  <span className="px-4 text-sm text-slate-400">
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
    </div>
  );
}