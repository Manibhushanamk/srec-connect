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
  BookOpen,
  Award,
  Search,
  Filter,
  Building2,
  GraduationCap,
  Briefcase,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Mail,
  MapPin,
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

  const where: any = { isActive: true };

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

  const [faculty, total, departments] = await Promise.all([
    prisma.faculty.findMany({
      where,
      include: {
        department: true,
        achievements: { where: { status: 'PUBLISHED' }, take: 5, orderBy: { achievementDate: 'desc' } },
        user: { select: { email: true } },
      },
      orderBy: [{ roleCategory: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <Badge variant="brand" size="md" glow className="mb-3">
            <Briefcase className="w-3.5 h-3.5 mr-1.5" />
            Faculty & Research
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">Faculty Directory</h1>
          <p className="mt-2 text-slate-400">
            {data.total} {data.total === 1 ? 'faculty member' : 'faculty members'} across all departments
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.location.href = buildUrl({ view: 'cards' })}>
            <Users className="w-4 h-4" />
            Cards
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.location.href = buildUrl({ view: 'list' })}>
            <List className="w-4 h-4" />
            List
          </Button>
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
                    placeholder="Search faculty..."
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
                  defaultValue={params.department || 'all'}
                  className="input-field appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2394a3b8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E')] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                  onChange={(e) => window.location.href = buildUrl({ department: e.target.value, page: '1' })}
                >
                  <option value="all">All Departments</option>
                  {data.departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="roleCategory" className="label-text">Designation</label>
                <select
                  id="roleCategory"
                  defaultValue={params.roleCategory || 'all'}
                  className="input-field appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2394a3b8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E')] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                  onChange={(e) => window.location.href = buildUrl({ roleCategory: e.target.value, page: '1' })}
                >
                  <option value="all">All Designations</option>
                  {ROLE_CATEGORIES.map((role) => (
                    <option key={role} value={role}>{roleLabels[role]}</option>
                  ))}
                </select>
              </div>

              <Button variant="secondary" fullWidth onClick={() => window.location.href = '/faculty'}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 min-w-0">
          {data.faculty.length === 0 ? (
            <EmptyStatePreset type="faculty" />
          ) : viewMode === 'list' ? (
            <div className="table-container">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-slate-800/50">
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
                              <img src={member.avatarUrl} alt="" className="w-10 h-10 rounded-xl" />
                            ) : (
                              <span className="text-white font-bold">{member.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-100">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <Badge variant="brand" size="sm">{member.roleCategory ? roleLabels[member.roleCategory] : 'N/A'}</Badge>
                      </td>
                      <td className="table-cell">
                        <Badge variant="cyan" size="sm">{member.department?.shortName || 'N/A'}</Badge>
                      </td>
                      <td className="table-cell text-slate-300 max-w-xs truncate">
                        {member.specialization || '-'}
                      </td>
                      <td className="table-cell">
                        <span className="text-slate-400">{member.achievements.length} publications</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {data.faculty.map((member) => (
                <Link key={member.id} href={`/faculty/${member.id}`} className="group">
                  <Card variant="bento" hover className="h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt="" className="w-16 h-16 rounded-xl" />
                          ) : (
                            <span className="text-white text-2xl font-bold">{member.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-100 truncate group-hover:text-brand-400 transition-colors">
                            {member.name}
                          </h3>
                          <p className="text-sm text-slate-400">{member.designation}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="brand" size="sm">{member.roleCategory ? roleLabels[member.roleCategory] : 'N/A'}</Badge>
                        <Badge variant="cyan" size="sm">{member.department?.shortName || 'N/A'}</Badge>
                        {member.degrees && <Badge variant="slate" size="sm">{member.degrees}</Badge>}
                      </div>
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                        {member.specialization || 'No specialization listed'}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{member.achievements.length} publications</span>
                        </div>
                        {member.googleScholar && (
                          <a
                            href={member.googleScholar}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Scholar
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
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
    </div>
  );
}

import { List } from 'lucide-react';