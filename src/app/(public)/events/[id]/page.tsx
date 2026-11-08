import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EventRegistrationBox } from '@/components/events/EventRegistrationBox';
import { formatDate, formatDateTime } from '@/lib/utils';
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

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Events Directory
        </Link>
      </div>

      {/* Main Event Header & Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/40">
        {event.posterUrl ? (
          <div className="h-64 sm:h-80 w-full relative">
            <img
              src={event.posterUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
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

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {event.title}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400">Date</p>
                <p className="font-semibold text-white">
                  {formatDate(event.startDate)} {event.endDate && ` - ${formatDate(event.endDate)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400">Time</p>
                <p className="font-semibold text-white">{formatDateTime(event.startDate)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400">Venue</p>
                <p className="font-semibold text-white">{event.venue}</p>
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
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              About This Event
            </h2>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {event.description || 'No detailed description provided for this campus event.'}
            </div>
          </div>

          {/* Speakers / Resource Persons */}
          {event.speaker && (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Featured Speaker & Resource Person
              </h2>
              <div className="flex items-start gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                  {event.speaker[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{event.speaker}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {event.speakerResourcePerson || 'Invited Domain Expert / Keynote Presenter'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Department & Organizer Details */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              Organizing Body
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="font-semibold text-white">{event.organizer}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
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
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-3 text-xs text-slate-400">
            <h4 className="font-semibold text-slate-200">Registration Guidelines</h4>
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
