import { Suspense } from 'react';
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

  const where: any = { deletedAt: null };

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
        where: { deletedAt: null },
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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Campus Events</h1>
          <p className="mt-2 text-muted-foreground font-medium">
            {data.total} {data.total === 1 ? 'event' : 'events'} across all departments
          </p>
        </div>
      </div>

      {/* Top Horizontal Filter Bar */}
      <Suspense fallback={<div className="h-12 w-full bg-card rounded-2xl animate-pulse" />}>
        <EventsFilterBar
          categories={data.categories}
          departments={data.departments}
          academicYears={data.academicYears}
        />
      </Suspense>

      <main className="w-full">
        {data.events.length === 0 ? (
          <EmptyStatePreset type="events" />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {data.events.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="group">
                    <Card variant="bento" hover className="overflow-hidden h-full flex flex-col">
                      <div className="relative h-44 flex-shrink-0">
                        {event.posterUrl ? (
                          <img
                            src={event.posterUrl}
                            alt={event.title}
                            width={400}
                            height={176}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-space-850 via-brand-950/40 to-space-950 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-1.5 shadow-sm">
                              <Calendar className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-semibold text-slate-200">{event.category.name}</span>
                            <span className="text-[10px] text-slate-500">SREC Academic Event</span>
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
                          <h3 className="font-bold text-sm text-foreground mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                        <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
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
  );
}