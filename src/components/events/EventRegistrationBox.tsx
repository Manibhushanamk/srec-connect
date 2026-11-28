'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
  ExternalLink,
  MessageCircle,
  UserCheck,
  XCircle,
  Loader2,
} from 'lucide-react';

interface EventRegistrationBoxProps {
  eventId: string;
  initialCapacity: number;
  initialRegisteredCount: number;
  status: string;
  registrationDeadline: string | null;
}

export function EventRegistrationBox({
  eventId,
  initialCapacity,
  initialRegisteredCount,
  status,
  registrationDeadline,
}: EventRegistrationBoxProps) {
  const { data: session, status: authStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [userAttendance, setUserAttendance] = useState<any>(null);
  const [isOrganizerOrAdmin, setIsOrganizerOrAdmin] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEventData(data.event);
        setUserRegistration(data.userRegistration);
        setUserAttendance(data.userAttendance);
        setIsOrganizerOrAdmin(data.isOrganizerOrAdmin);
        if (data.userRegistration?.status === 'REGISTERED') {
          try {
            const QRCode = (await import('qrcode')).default;
            const qrPayload = JSON.stringify({
              type: 'EVENT_CHECKIN_PASS',
              eventId,
              registrationId: data.userRegistration.id,
            });
            const url = await QRCode.toDataURL(qrPayload, { width: 180, margin: 1 });
            setQrDataUrl(url);
          } catch {
            // ignore QR generation fallback
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [eventId, session]);

  const handleRegister = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: data.message, type: 'success' });
        await fetchStatus();
      } else {
        setMessage({ text: data.error || 'Failed to register', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error submitting registration', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your event registration?')) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: 'Registration cancelled', type: 'success' });
        await fetchStatus();
      } else {
        setMessage({ text: data.error || 'Failed to cancel', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error cancelling registration', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const isDeadlinePassed =
    registrationDeadline && new Date() > new Date(registrationDeadline);
  const isEventClosed = status === 'COMPLETED' || status === 'CANCELLED';

  const registeredCount = eventData?.registeredCount ?? initialRegisteredCount;
  const capacity = eventData?.capacity ?? initialCapacity;
  const seatsRemaining = Math.max(0, capacity - registeredCount);
  const capacityPct = Math.min(100, Math.round((registeredCount / (capacity || 1)) * 100));

  if (loading) {
    return (
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-center min-h-[140px]">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-subtle space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-400 uppercase tracking-wider">Seat Availability</span>
          <span className={seatsRemaining > 10 ? 'text-emerald-400' : 'text-amber-400'}>
            {seatsRemaining > 0 ? `${seatsRemaining} Seats Remaining` : 'Full Capacity (Waitlist Open)'}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              capacityPct >= 100
                ? 'bg-amber-500'
                : capacityPct > 80
                ? 'bg-amber-400'
                : 'bg-gradient-to-r from-blue-500 to-cyan-400'
            }`}
            style={{ width: `${capacityPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>{registeredCount} Registered</span>
          <span>{capacity} Total Capacity</span>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
              : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Unauthenticated State */}
      {authStatus !== 'authenticated' && (
        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-3">
          <p className="text-xs text-slate-300">
            Sign in with your verified SREC institutional Google account to register for this event.
          </p>
          <Link href={`/login?callbackUrl=/events/${eventId}`} className="block">
            <Button variant="primary" className="w-full justify-center">
              Sign In to Register
            </Button>
          </Link>
        </div>
      )}

      {/* Authenticated State */}
      {authStatus === 'authenticated' && (
        <>
          {/* Confirmed Registration */}
          {userRegistration?.status === 'REGISTERED' && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-300">Registration Confirmed</h4>
                  <p className="text-xs text-emerald-400/80 mt-0.5">
                    Your seat is officially reserved for this event.
                  </p>
                </div>
              </div>

              {/* Attendance Status */}
              {userAttendance ? (
                <div className="p-2.5 bg-emerald-900/30 border border-emerald-700/40 rounded-lg flex items-center gap-2 text-xs text-emerald-200">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Checked In on {new Date(userAttendance.checkedInAt).toLocaleDateString()} via {userAttendance.checkInMethod}</span>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-800/70 border border-slate-700 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Attendance: Not Checked In
                  </span>
                  <span className="text-[11px] text-cyan-400 font-medium">Event Check-In Pass Ready</span>
                </div>
              )}

              {/* Check-In-Only QR Pass (Not an institutional student ID) */}
              {qrDataUrl && (
                <div className="p-3 bg-card border border-border rounded-xl flex items-center gap-3">
                  <img
                    src={qrDataUrl}
                    alt="Event Check-In Pass QR"
                    width={76}
                    height={76}
                    className="rounded-lg bg-white p-1 shrink-0"
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-primary" />
                      Event Check-In Pass
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      For venue entry scanning at this event only (not an institutional student ID).
                    </p>
                  </div>
                </div>
              )}

              {/* Exclusive Post-Registration WhatsApp Group Link */}
              {eventData?.whatsappGroupUrl && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      Official Attendees WhatsApp Group
                    </span>
                    <Badge variant="cyan" size="sm">Registrants Only</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Join for real-time announcements, speaker slides, and resource links.
                  </p>
                  <a
                    href={eventData.whatsappGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-950/30"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Join WhatsApp Group
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}

              {/* Cancel Button */}
              <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Need to cancel?</span>
                <button
                  onClick={handleCancel}
                  disabled={submitting}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
                >
                  Cancel Registration
                </button>
              </div>
            </div>
          )}

          {/* Waitlisted State */}
          {userRegistration?.status === 'WAITLISTED' && (
            <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-300">On Priority Waitlist</h4>
                  <p className="text-xs text-amber-400/80 mt-0.5">
                    The event is currently full. If another attendee cancels, you will automatically be promoted to confirmed!
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                disabled={submitting}
                className="w-full text-xs text-rose-300 hover:text-rose-200"
              >
                Cancel Waitlist Position
              </Button>
            </div>
          )}

          {/* Not Registered State */}
          {(!userRegistration || userRegistration.status === 'CANCELLED') && (
            <div className="space-y-3">
              {isEventClosed ? (
                <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-center text-xs text-slate-400">
                  This event is {status.toLowerCase()}. Registration is closed.
                </div>
              ) : isDeadlinePassed ? (
                <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-center text-xs text-rose-400">
                  Registration deadline has passed.
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="w-full justify-center py-2.5 font-semibold text-sm shadow-lg shadow-cyan-950/50"
                  onClick={handleRegister}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {seatsRemaining > 0 ? 'Register for Event' : 'Join Priority Waitlist'}
                </Button>
              )}
            </div>
          )}

          {/* Organizer / Admin Quick Check-In Desk Link */}
          {isOrganizerOrAdmin && (
            <div className="pt-4 border-t border-slate-800">
              <Link href={`/admin/events/${eventId}/attendance`}>
                <Button variant="secondary" size="sm" className="w-full justify-center text-xs text-cyan-400">
                  <QrCode className="w-3.5 h-3.5 mr-1.5" />
                  Open QR Attendance Desk
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
