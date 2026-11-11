import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStatePreset } from '@/components/ui/EmptyState';
import { FacultyFilterBar } from '@/components/faculty/FacultyFilterBar';
import { ScholarDirectoryCard } from '@/components/cards/ScholarDirectoryCard';
import { formatDate } from '@/lib/utils';
import {
  Users,
  BookOpen,
  Award,
  Building2,
  GraduationCap,
  Briefcase,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Mail,
  MapPin,
  List,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Faculty & Research',
  description: 'Explore faculty profiles, research publications, patents, and academic achievements at SREC Connect.',
};

const ROLE_CATEGORIES = ['HOD', 'PROFESSOR', 'ASSOCIATE_PROFESSOR', 'ASSISTANT_PROFESSOR'];

async function getFaculty(searchParams: {
  page?: string;
  department?: string;
  roleCategory?: string;
  search?: string;
  view?: string;
}) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: any = { isActive: true, deletedAt: null };

  if (searchParams.department && searchParams.department !== 'all') {
    where.departmentId = searchParams.department;
  }
  if (searchParams.roleCategory && searchParams.roleCategory !== 'all') {
    where.roleCategory = searchParams.roleCategory;
  }
  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { designation: { contains: searchParams.search, mode: 'insensitive' } },
      { specialization: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  try {
    const [faculty, total, departments] = await Promise.all([
      prisma.faculty.findMany({
        where,
        include: {
          department: true,
          achievements: { where: { status: 'PUBLISHED' }, take: 5, orderBy: { achievementDate: 'desc' } },
          user: {
            select: {
              email: true,
              _count: { select: { posts: true } },
            },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { roleCategory: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.faculty.count({ where }),
      prisma.department.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
    ]);

    return {
      faculty,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      departments,
    };
  } catch (error) {
    console.error('[Faculty] Failed to fetch faculty from database:', error);
    return {
      faculty: [],
      total: 0,
      totalPages: 1,
      currentPage: 1,
      departments: [],
    };
  }
}

export default async function FacultyPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    department?: string;
    roleCategory?: string;
    search?: string;
    view?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getFaculty(params);
  const currentPage = data.currentPage;
  const totalPages = data.totalPages;
  const viewMode = params.view || 'cards';

  const buildUrl = (overrides: Record<string, string>) => {
    const newParams = new URLSearchParams(params as any);
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === 'all' || value === '') newParams.delete(key);
      else newParams.set(key, value);
    });
    return `/faculty?${newParams.toString()}`;
  };

  const roleLabels: Record<string, string> = {
    HOD: 'Head of Department',
    PROFESSOR: 'Professor',
    ASSOCIATE_PROFESSOR: 'Associate Professor',
    ASSISTANT_PROFESSOR: 'Assistant Professor',
  };

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <Badge variant="brand" size="md" glow className="mb-3">
            <Briefcase className="w-3.5 h-3.5 mr-1.5" />
            Faculty & Research
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Faculty Directory</h1>
          <p className="mt-2 text-muted-foreground font-medium">
            {data.total} {data.total === 1 ? 'faculty member' : 'faculty members'} across all departments
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={buildUrl({ view: 'cards' })}>
            <Button variant="secondary" size="sm">
              <Users className="w-4 h-4" />
              Cards
            </Button>
          </Link>
          <Link href={buildUrl({ view: 'list' })}>
            <Button variant="secondary" size="sm">
              <List className="w-4 h-4" />
              List
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Horizontal Filter Bar */}
      <FacultyFilterBar
        departments={data.departments}
        roleCategories={ROLE_CATEGORIES}
      />

      <main className="w-full">
          {data.faculty.length === 0 ? (
            <EmptyStatePreset type="faculty" />
          ) : viewMode === 'list' ? (
            <div className="table-container">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header">Faculty</th>
                    <th className="table-header">Designation</th>
                    <th className="table-header">Department</th>
                    <th className="table-header">Specialization</th>
                    <th className="table-header">Research</th>
                  </tr>
                </thead>
                <tbody>
                  {data.faculty.map((member) => (
                    <tr key={member.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-xl object-cover" />
                            ) : (
                              <span className="text-white font-bold">{member.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <Badge variant="brand" size="sm">{member.roleCategory ? roleLabels[member.roleCategory] : 'N/A'}</Badge>
                      </td>
                      <td className="table-cell">
                        <Badge variant="cyan" size="sm">{member.department?.shortName || 'N/A'}</Badge>
                      </td>
                      <td className="table-cell text-foreground/80 max-w-xs truncate">
                        {member.specialization || '-'}
                      </td>
                      <td className="table-cell">
                        <span className="text-muted-foreground">{member.achievements.length} publications</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 mb-8">
              {data.faculty.map((member) => {
                const facultySkills = member.specialization
                  ? member.specialization
                      .split(/[,;&•]/)
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                  : ['Artificial Intelligence', 'Machine Learning'];
                const expYears = parseInt(member.experience || '8', 10) || 8;

                return (
                  <ScholarDirectoryCard
                    key={member.id}
                    type="FACULTY"
                    id={member.id}
                    name={member.name}
                    avatarUrl={member.avatarUrl}
                    role={member.roleCategory ? roleLabels[member.roleCategory] : 'FACULTY'}
                    departmentName={member.department?.name || member.departmentName || 'Computer Science & Engineering (AI & ML)'}
                    headline={`${member.designation} • ${member.specialization || 'AI & Machine Learning'}`}
                    designation={member.designation}
                    qualification={member.degrees}
                    specialization={member.specialization}
                    email={member.email || member.user?.email}
                    stats={{
                      postsCount: member.user?._count?.posts ?? 0,
                      verifiedCount: member.achievements?.length ?? 0,
                      eventsCount: expYears,
                      skillsCount: facultySkills.length,
                    }}
                    skills={facultySkills}
                    actionLabel="Connect"
                    href={`/faculty/${member.id}`}
                  />
                );
              })}
            </div>
          )}

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
        </main>
    </div>
  );
}
