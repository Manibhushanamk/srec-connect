import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStatePreset } from '@/components/ui/EmptyState';
import { AchievementsFilterBar } from '@/components/achievements/AchievementsFilterBar';
import { ScholarDirectoryCard } from '@/components/cards/ScholarDirectoryCard';
import { formatDate } from '@/lib/utils';
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
  search?: string;
}) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: any = {
    status: 'PUBLISHED',
    deletedAt: null,
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

  try {
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
        where: { status: 'PUBLISHED', deletedAt: null },
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
      academicYears: academicYears.map((a) => a.academicYear).filter((y): y is string => Boolean(y)),
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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Verified Achievements</h1>
          <p className="mt-2 text-muted-foreground font-medium">
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

      {/* Top Horizontal Filter Bar */}
      <AchievementsFilterBar
        levels={LEVELS}
        categories={data.categories}
        departments={data.departments}
        academicYears={data.academicYears}
      />

      <main className="w-full">
        {data.achievements.length === 0 ? (
          <EmptyStatePreset type="achievements" />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {data.achievements.map((achievement) => (
                <ScholarDirectoryCard
                  key={achievement.id}
                  type="ACHIEVEMENT"
                  id={achievement.id}
                  name={achievement.title}
                  avatarUrl={achievement.media?.[0]?.url}
                  role={achievement.personType || 'STUDENT'}
                  departmentName={achievement.department?.name || achievement.departmentName || 'Computer Science & Engineering (AI & ML)'}
                  headline={`${achievement.personName} • ${achievement.organizationEventName}`}
                  achievementTitle={achievement.title}
                  category={achievement.category?.name}
                  level={achievement.level}
                  positionRank={achievement.positionRank}
                  achievementDate={formatDate(achievement.achievementDate)}
                  organization={achievement.organizationEventName}
                  googleDriveUrl={achievement.googleDriveUrl || achievement.certificateUrl}
                  rollNumber={achievement.primaryStudentRoll || achievement.primaryStudent?.rollNumber}
                  batch={achievement.academicYear}
                  stats={{
                    postsCount: 1,
                    verifiedCount: 1,
                    eventsCount: 1,
                    skillsCount: 4,
                  }}
                  skills={[
                    achievement.level,
                    achievement.category?.name,
                    achievement.academicYear,
                    achievement.participationType === 'TEAM' ? 'Team Project' : 'Solo Entry',
                  ].filter(Boolean)}
                  actionLabel="View Proof"
                  href={`/achievements/${achievement.id}`}
                />
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
  );
}