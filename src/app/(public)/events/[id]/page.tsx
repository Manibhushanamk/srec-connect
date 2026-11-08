import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EventRegistrationBox } from '@/components/events/EventRegistrationBox';
import { formatDate, formatDateTime } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building2,
  ArrowLeft,
  Share2,
  FileText,
  User,
  GraduationCap,
  ExternalLink,
  Edit,
} from 'lucide-react';

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id, deletedAt: null },
    select: { title: true, description: true },
  });

  if (!event) return { title: 'Event Not Found | SREC Connect' };

  return {
    title: `${event.title} | Events & Symposia | SREC Connect`,
    description: event.description || 'SREC Campus Event Details and Registration',
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id, deletedAt: null },
    include: {
      category: true,
      department: true,
      createdBy: {
        select: { id: true, name: true, role: true, avatarUrl: true },
      },
      _count: {
        select: {
          registrations: { where: { status: 'REGISTERED' } },
          attendances: true,
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const registeredCount = event._count.registrations;

  const session = await getServerSession(authOptions);
  let canEdit = false;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true, role: true },
    });
    if (user && (user.role === 'SUPER_ADMIN' || user.role === 'HOD' || user.role === 'FACULTY' || event.createdById === user.id)) {
      canEdit = true;
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar with Back and Edit Action */}
      <div className="flex items-center justify-between">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Events Directory
        </Link>

        {canEdit && (
          <Link href={`/admin/events`}>
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs text-amber-500 border-amber-500/30">
              <Edit className="w-3.5 h-3.5" />
              Edit in Event Desk
            </Button>
          </Link>
        )}
      </div>

      {/* Main Event Header & Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-border bg-card">
        {event.posterUrl ? (
          <div className="h-64 sm:h-96 w-full relative group">
            <img
              src={event.posterUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
            <a
              href={event.posterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-background/80 backdrop-blur-md border border-border text-xs font-medium text-foreground hover:bg-background transition-all shadow-md flex items-center gap-1.5 opacity-90 group-hover:opacity-100"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Full Poster</span>
            </a>
          </div>
        ) : (
          <div className="h-48 sm:h-60 w-full bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
            <Calendar className="w-20 h-20 text-blue-400/20" />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="cyan" size="sm">
              {event.category.name}
            </Badge>
            {event.department && (
              <Badge variant="brand" size="sm">
                {event.department.shortName || event.department.name}
              </Badge>
            )}
            <Badge variant="slate" size="sm">
              AY {event.academicYear || '2025-2026'}
            </Badge>
            <StatusBadge status={event.status as any} size="sm" />
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
            {event.title}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">Date</p>
                <p className="font-semibold text-foreground">
                  {formatDate(event.startDate)} {event.endDate && ` - ${formatDate(event.endDate)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">Time</p>
                <p className="font-semibold text-foreground">{formatDateTime(event.startDate)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">Venue</p>
                <p className="font-semibold text-foreground">{event.venue}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid: Left Details & Right Registration Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Event Specs & Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Event */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              About This Event
            </h2>
            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {event.description || 'No detailed description provided for this campus event.'}
            </div>
          </div>

          {/* Speakers / Resource Persons */}
          {event.speaker && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Featured Speaker & Resource Person
              </h2>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-xl border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                  {event.speaker[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{event.speaker}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {event.speakerResourcePerson || 'Invited Domain Expert / Keynote Presenter'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Department & Organizer Details */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Organizing Body
            </h2>
            <div className="flex items-center gap-3 text-xs text-foreground/90">
              <div className="p-2.5 rounded-xl bg-muted border border-border">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{event.organizer}</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  {event.department?.fullName || 'Santhiram Engineering College'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Registration Card & Capacity Counter */}
        <div className="space-y-6">
          <EventRegistrationBox
            eventId={event.id}
            initialCapacity={event.capacity}
            initialRegisteredCount={registeredCount}
            status={event.status}
            registrationDeadline={event.registrationDeadline ? event.registrationDeadline.toISOString() : null}
          />

          {/* Quick Info Box */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 text-xs text-muted-foreground">
            <h4 className="font-semibold text-foreground">Registration Guidelines</h4>
            <ul className="space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
              <li>Open to enrolled SREC engineering students.</li>
              <li>Attendance verification conducted at entry via digital QR check-in.</li>
              <li>Seat reservations are strictly non-transferable.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
