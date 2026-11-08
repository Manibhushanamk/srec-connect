import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStatePreset } from '@/components/ui/EmptyState';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  ArrowRight,
  Search,
  Filter,
  Building2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Events & Symposia',
  description: 'Browse upcoming and past events, workshops, seminars, conferences, and symposiums at SREC Connect.',
};

const EVENT_STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];

async function getEvents(searchParams: {
  page?: string;
  status?: string;
  category?: string;
  department?: string;
  academicYear?: string;
  search?: string;
}) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (searchParams.status && searchParams.status !== 'all') {
    where.status = searchParams.status;
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
      { description: { contains: searchParams.search, mode: 'insensitive' } },
      { venue: { contains: searchParams.search, mode: 'insensitive' } },
      { speaker: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  const [events, total, categories, departments, academicYears] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        category: true,
        department: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { startDate: 'asc' },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
    prisma.category.findMany({ where: { type: { in: ['EVENT', 'BOTH'] }, isActive: true }, orderBy: { displayOrder: 'asc' } }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
    prisma.event.findMany({
      select: { academicYear: true },
      distinct: ['academicYear'],
      orderBy: { academicYear: 'desc' },
    }),
  ]);

  return {
    events,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    categories,
    departments,
    academicYears: academicYears.map((a) => a.academicYear),
  };
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    category?: string;
    department?: string;
    academicYear?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getEvents(params);
  const currentPage = data.currentPage;
  const totalPages = data.totalPages;

  const buildUrl = (overrides: Record<string, string>) => {
    const newParams = new URLSearchParams(params as any);
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === 'all' || value === '') newParams.delete(key);
      else newParams.set(key, value);
    });
    return `/events?${newParams.toString()}`;
  };

  const statusTabs = ['all', 'UPCOMING', 'ONGOING', 'COMPLETED'] as const;
  const currentStatus = (params.status as typeof statusTabs[number]) || 'all';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <Badge variant="cyan" size="md" glow className="mb-3">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Events & Symposia
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">Campus Events</h1>
          <p className="mt-2 text-slate-400">
            {data.total} {data.total === 1 ? 'event' : 'events'} across all departments
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
                    placeholder="Search events..."
                    defaultValue={params.search || ''}
                    className="input-field pl-10"
                    onChange={(e) => window.location.href = buildUrl({ search: e.target.value, page: '1' })}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Status</label>
                <div className="flex gap-2 flex-wrap" role="tablist">
                  {statusTabs.map((status) => (
                    <button
                      key={status}
                      role="tab"
                      aria-selected={currentStatus === status}
                      onClick={() => window.location.href = buildUrl({ status: status === 'all' ? '' : status, page: '1' })}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        currentStatus === status
                          ? 'bg-brand-500 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-space-700/50'
                      }`}
                    >
                      {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
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
                    <option key={year || ''} value={year || ''}>{year}</option>
                  ))}
                </select>
              </div>

              <Button variant="secondary" fullWidth onClick={() => window.location.href = '/events'}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 min-w-0">
          {data.events.length === 0 ? (
            <EmptyStatePreset type="events" />
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {data.events.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="group">
                    <Card variant="bento" hover className="overflow-hidden">
                      <div className="relative h-48">
                        {event.posterUrl ? (
                          <img
                            src={event.posterUrl}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-space-800 to-space-900 flex items-center justify-center">
                            <Calendar className="w-16 h-16 text-slate-700" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <StatusBadge status={event.status as any} size="sm" />
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <Badge variant="brand" size="sm">{event.department?.shortName || 'N/A'}</Badge>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="slate" size="sm">{event.category.name}</Badge>
                          <Badge variant="brand" size="sm">{event.academicYear}</Badge>
                        </div>
                        <h3 className="font-semibold text-slate-100 mb-2 line-clamp-1 group-hover:text-brand-400 transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="space-y-2 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDateTime(event.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>{event.venue}</span>
                          </div>
                          {event.speaker && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 flex-shrink-0" />
                              <span>{event.speaker}</span>
                            </div>
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