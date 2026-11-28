import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveAchievementCardProof } from '@/lib/admin-auth';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStatePreset } from '@/components/ui/EmptyState';
import { AchievementsFilterBar } from '@/components/achievements/AchievementsFilterBar';
import { AchievementCard } from '@/components/cards/AchievementCard';
import { formatDate } from '@/lib/utils';
import { buildDateRangePrismaFilter } from '@/lib/timeline';
import {
  getCachedAchievementAcademicYears,
  getCachedCategories,
  getCachedDepartments,
} from '@/lib/filter-cache';
import {
  Award,
  Calendar,
  Users,
  Star,
  Trophy,
  Medal,
  BookOpen,
  ChevronDown,
  ArrowRight,
  Globe,
  Building2,
  User,
  MapPin,
  GraduationCap,
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
  timeline?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) {
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: any = {
    status: { in: ['APPROVED', 'PUBLISHED'] },
    deletedAt: null,
    AND: [
      {
        OR: [
          { primaryStudentId: null },
          { primaryStudent: { deletedAt: null, isActive: true } },
        ],
      },
      {
        OR: [
          { facultyId: null },
          { faculty: { deletedAt: null, isActive: true } },
        ],
      },
      {
        OR: [
          { createdById: null },
          { createdBy: { deletedAt: null, status: 'ACTIVE' } },
        ],
      },
    ],
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
  const dateFilter = buildDateRangePrismaFilter(
    searchParams.timeline,
    searchParams.dateFrom,
    searchParams.dateTo
  );
  if (dateFilter) {
    where.achievementDate = dateFilter;
  }
  if (searchParams.search) {
    where.AND.push({
      OR: [
        { title: { contains: searchParams.search, mode: 'insensitive' } },
        { personName: { contains: searchParams.search, mode: 'insensitive' } },
        { organizationEventName: { contains: searchParams.search, mode: 'insensitive' } },
        { primaryStudentRoll: { contains: searchParams.search, mode: 'insensitive' } },
      ],
    });
  }

  try {
    const [achievements, total, categories, departments, academicYears] = await Promise.all([
      prisma.achievement.findMany({
        where,
        include: {
          category: true,
          department: true,
          primaryStudent: { include: { user: { select: { id: true } } } },
          faculty: { include: { user: { select: { id: true } } } },
          media: { where: { isCover: true }, take: 1 },
        },
        orderBy: { achievementDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.achievement.count({ where }),
      getCachedCategories(['ACHIEVEMENT', 'BOTH']),
      getCachedDepartments(),
      getCachedAchievementAcademicYears(),
    ]);

    return {
      achievements,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      categories,
      departments,
      academicYears,
    };
  } catch (error) {
    console.error('[Achievements] Failed to fetch achievements from database:', error);
    return {
      achievements: [],
      total: 0,
      totalPages: 1,
      currentPage: 1,
      categories: [],
      departments: [],
      academicYears: [],
    };
  }
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

export default async function AchievementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    level?: string;
    category?: string;
    department?: string;
    academicYear?: string;
    timeline?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const [data, session] = await Promise.all([
    getAchievements(params),
    getServerSession(authOptions).catch(() => null),
  ]);
  let viewer: { id: string; role: string; departmentId: string | null } | null = null;
  if (session?.user?.email) {
    viewer = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true, role: true, departmentId: true },
    });
  }
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
    <div className="w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#CA8A04]/15 dark:bg-[#FACC15]/15 text-[#92400E] dark:text-[#FACC15] border border-[#CA8A04]/35 dark:border-[#FACC15]/35 mb-3">
            <Medal className="w-3.5 h-3.5" />
            Verified &amp; Published Honors
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Verified Achievements</h1>
          <p className="mt-2 text-muted-foreground font-medium">
            {data.total} verified {data.total === 1 ? 'honor' : 'honors'} published • Department of Computer Science & Engineering (AI & ML)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/achievements/submit" className="btn-primary gap-2">
            <Award className="w-4 h-4" />
            Submit Achievement
          </Link>
        </div>
      </div>

      {/* Top Horizontal Filter Bar */}
      <Suspense fallback={<div className="h-12 w-full bg-card rounded-2xl animate-pulse" />}>
        <AchievementsFilterBar
          levels={LEVELS}
          categories={data.categories}
          departments={data.departments}
          academicYears={data.academicYears}
        />
      </Suspense>

      <main className="w-full">
        {data.achievements.length === 0 ? (
          <EmptyStatePreset type="achievements" />
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 mb-8">
              {data.achievements.map((achievement) => {
                const proofProps = resolveAchievementCardProof(achievement, viewer);
                return (
                  <AchievementCard
                    key={achievement.id}
                    id={achievement.id}
                    title={achievement.title}
                    description={achievement.description}
                    categoryName={achievement.category?.name || 'Honor'}
                    level={achievement.level}
                    positionRank={achievement.positionRank}
                    participationType={achievement.participationType}
                    organizationEventName={achievement.organizationEventName}
                    academicYear={achievement.academicYear}
                    achievementDate={formatDate(achievement.achievementDate)}
                    personName={achievement.personName}
                    personType={achievement.personType as any}
                    rollNumber={achievement.primaryStudentRoll || achievement.primaryStudent?.rollNumber}
                    departmentName={achievement.department?.name || achievement.departmentName || 'Computer Science & Engineering (AI & ML)'}
                    googleDriveUrl={proofProps.visibleProofUrl}
                    certificateUrl={proofProps.visibleProofUrl}
                    coverImageUrl={proofProps.coverImageUrl}
                    hasPrivateProof={proofProps.hasPrivateProof}
                    tags={achievement.tags}
                    href={`/achievements/${achievement.id}`}
                  />
                );
              })}
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
  );
}