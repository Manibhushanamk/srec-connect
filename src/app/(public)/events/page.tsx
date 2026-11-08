import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStatePreset } from '@/components/ui/EmptyState';
import { EventsFilterBar } from '@/components/events/EventsFilterBar';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  ArrowRight,
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

  try {
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
      academicYears: academicYears.map((a) => a.academicYear).filter((y): y is string => Boolean(y)),
    };
  } catch (error) {
    console.error('[Events] Failed to fetch events from database:', error);
    return {
      events: [],
      total: 0,
      totalPages: 1,
      currentPage: 1,
      categories: [],
      departments: [],
      academicYears: [],
    };
  }
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
          <EventsFilterBar
            categories={data.categories}
            departments={data.departments}
            academicYears={data.academicYears}
          />
        </aside>

        <main className="flex-1 min-w-0">
          {data.events.length === 0 ? (
            <EmptyStatePreset type="events" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                {data.events.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="group">
                    <Card variant="bento" hover className="overflow-hidden h-full flex flex-col">
                      <div className="relative h-44 flex-shrink-0">
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
                          <Badge variant="brand" size="sm">{event.department?.shortName || event.department?.name || 'CSE (AI & ML)'}</Badge>
                        </div>
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Badge variant="slate" size="sm">{event.category.name}</Badge>
                            {event.academicYear && <Badge variant="brand" size="sm">{event.academicYear}</Badge>}
                          </div>
                          <h3 className="font-bold text-sm text-slate-100 mb-1.5 line-clamp-1 group-hover:text-brand-400 transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{event.venue}</span>
                          </div>
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