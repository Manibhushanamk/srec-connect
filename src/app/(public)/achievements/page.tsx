import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStatePreset } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import {
  Award,
  Calendar,
  Users,
  Star,
  Trophy,
  Medal,
  BookOpen,
  Search,
  Filter,
  ChevronDown,
  ArrowRight,
  Globe,
  Building2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verified Achievements',
  description: 'Browse verified student and faculty achievements, honors, awards, and recognitions at SREC Connect.',
};

const LEVELS = ['INTERNATIONAL', 'NATIONAL', 'STATE', 'UNIVERSITY', 'COLLEGE', 'DEPARTMENT'];
const PARTICIPATION_TYPES = ['SOLO', 'TEAM'];

async function getAchievements(searchParams: {
  page?: string;
  level?: string;
  category?: string;
  department?: string;
  academicYear?: string;
  search?: string;
}) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: any = {
    status: 'PUBLISHED',
  };

  if (searchParams.level && searchParams.level !== 'all') {
    where.level = searchParams.level;
  }
  if (searchParams.category && searchParams.category !== 'all') {
    where.category = { name: searchParams.category };
  }
  if (searchParams.department && searchParams.department !== 'all') {
    where.department = { code: searchParams.department };
  }
  if (searchParams.academicYear && searchParams.academicYear !== 'all') {
    where.academicYear = searchParams.academicYear;
  }
  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: 'insensitive' } },
      { personName: { contains: searchParams.search, mode: 'insensitive' } },
      { organizationEventName: { contains: searchParams.search, mode: 'insensitive' } },
      { primaryStudentRoll: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  const [achievements, total, categories, departments, academicYears] = await Promise.all([
    prisma.achievement.findMany({
      where,
      include: {
        category: true,
        department: true,
        primaryStudent: true,
        faculty: true,
        media: { where: { isCover: true }, take: 1 },
      },
      orderBy: { achievementDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.achievement.count({ where }),
    prisma.category.findMany({ where: { type: { in: ['ACHIEVEMENT', 'BOTH'] }, isActive: true }, orderBy: { displayOrder: 'asc' } }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
    prisma.achievement.findMany({
      where: { status: 'PUBLISHED' },
      select: { academicYear: true },
      distinct: ['academicYear'],
      orderBy: { academicYear: 'desc' },
    }),
  ]);

  return {
    achievements,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    categories,
    departments,
    academicYears: academicYears.map((a) => a.academicYear),
  };
}

function LevelBadge({ level }: { level: string }) {
  const configs: Record<string, { variant: 'brand' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet'; icon: React.ReactNode }> = {
    INTERNATIONAL: { variant: 'violet', icon: <Globe className="w-3 h-3" /> },
    NATIONAL: { variant: 'brand', icon: <Building2 className="w-3 h-3" /> },
    STATE: { variant: 'cyan', icon: <MapPin className="w-3 h-3" /> },
    UNIVERSITY: { variant: 'emerald', icon: <GraduationCap className="w-3 h-3" /> },
    COLLEGE: { variant: 'amber', icon: <Award className="w-3 h-3" /> },
    DEPARTMENT: { variant: 'rose', icon: <Building2 className="w-3 h-3" /> },
  };
  const config = configs[level] || { variant: 'slate', icon: <Award className="w-3 h-3" /> };
  return <Badge variant={config.variant} size="sm" className="gap-1"><span>{config.icon}</span>{level}</Badge>;
}

function ParticipationBadge({ type }: { type: string }) {
  return (
    <Badge variant={type === 'TEAM' ? 'cyan' : 'emerald'} size="sm" className="gap-1">
      {type === 'TEAM' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
      {type}
    </Badge>
  );
}

import { User, MapPin, GraduationCap } from 'lucide-react';

export default async function AchievementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    level?: string;
    category?: string;
    department?: string;
    academicYear?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getAchievements(params);
  const currentPage = data.currentPage;
  const totalPages = data.totalPages;

  const buildUrl = (overrides: Record<string, string>) => {
    const newParams = new URLSearchParams(params as any);
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === 'all' || value === '') newParams.delete(key);
      else newParams.set(key, value);
    });
    return `/achievements?${newParams.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <Badge variant="emerald" size="md" glow className="mb-3">
            <Medal className="w-3.5 h-3.5 mr-1.5" />
            Verified & Published
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">Verified Achievements</h1>
          <p className="mt-2 text-slate-400">
            {data.total} {data.total === 1 ? 'achievement' : 'achievements'} published across all departments
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/achievements/submit" className="btn-primary gap-2">
            <Award className="w-4 h-4" />
            Submit Achievement
          </Link>
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
                    placeholder="Search achievements..."
                    defaultValue={params.search || ''}
                    className="input-field pl-10"
                    onChange={(e) => window.location.href = buildUrl({ search: e.target.value, page: '1' })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="level" className="label-text">Level</label>
                <select
                  id="level"
                  defaultValue={params.level || 'all'}
                  className="input-field appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2394a3b8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E')] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                  onChange={(e) => window.location.href = buildUrl({ level: e.target.value, page: '1' })}
                >
                  <option value="all">All Levels</option>
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category" className="label-text">Category</label>
                <select
                  id="category"
                  defaultValue={params.category || 'all'}
                  className="input-field appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2394a3b8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E')] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                  onChange={(e) => window.location.href = buildUrl({ category: e.target.value, page: '1' })}
                >
                  <option value="all">All Categories</option>
                  {data.categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="department" className="label-text">Department</label>
                <select
                  id="department"
                  defaultValue={params.department || 'all'}
                  className="input-field appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2394a3b8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E')] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                  onChange={(e) => window.location.href = buildUrl({ department: e.target.value, page: '1' })}
                >
                  <option value="all">All Departments</option>
                  {data.departments.map((dept) => (
                    <option key={dept.code} value={dept.code}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="academicYear" className="label-text">Academic Year</label>
                <select
                  id="academicYear"
                  defaultValue={params.academicYear || 'all'}
                  className="input-field appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2394a3b8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E')] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                  onChange={(e) => window.location.href = buildUrl({ academicYear: e.target.value, page: '1' })}
                >
                  <option value="all">All Years</option>
                  {data.academicYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <Button variant="secondary" fullWidth onClick={() => window.location.href = '/achievements'}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 min-w-0">
          {data.achievements.length === 0 ? (
            <EmptyStatePreset type="achievements" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {data.achievements.map((achievement) => (
                  <Link key={achievement.id} href={`/achievements/${achievement.id}`} className="group">
                    <Card variant="bento" hover className="h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <LevelBadge level={achievement.level} />
                          </div>
                          <ParticipationBadge type={achievement.participationType} />
                        </div>
                        <h3 className="font-semibold text-slate-100 mb-2 line-clamp-2 group-hover:text-brand-400 transition-colors">
                          {achievement.title}
                        </h3>
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                          {achievement.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="slate" size="sm">{achievement.category.name}</Badge>
                          <Badge variant="brand" size="sm">{achievement.department?.shortName || 'N/A'}</Badge>
                          <Badge variant="slate" size="sm">{achievement.academicYear}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(achievement.achievementDate)}
                          </div>
                          {achievement.primaryStudentRoll && (
                            <Badge variant="cyan" size="sm" className="gap-1">
                              <GraduationCap className="w-2.5 h-2.5" />
                              {achievement.primaryStudentRoll}
                            </Badge>
                          )}
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