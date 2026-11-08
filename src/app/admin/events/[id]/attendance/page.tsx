'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/layout/AdminShell';
import { Card } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  QrCode,
  CheckCircle2,
  Clock,
  Users,
  Search,
  ArrowLeft,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Loader2,
  Download,
  Calendar,
  MapPin,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminEventAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);

  const [event, setEvent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CHECKED_IN' | 'PENDING' | 'WAITLIST'>('ALL');
  const [search, setSearch] = useState('');

  // Fast Roll Number Check-in input
  const [rollInput, setRollInput] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [lastCheckInAlert, setLastCheckInAlert] = useState<{
    text: string;
    type: 'success' | 'error';
    attendee?: any;
  } | null>(null);

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/attendance`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data.event);
        setStats(data.stats);
        setAttendees(data.attendees || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [eventId]);

  const handleQuickCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rollInput.trim()) return;

    setCheckingIn(true);
    setLastCheckInAlert(null);

    try {
      const res = await fetch(`/api/events/${eventId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber: rollInput.trim().toUpperCase(),
          checkInMethod: 'QR_SCAN',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastCheckInAlert({
          text: data.message || `Checked in: ${data.attendee?.name} (${rollInput.toUpperCase()})`,
          type: 'success',
          attendee: data.attendee,
        });
        setRollInput('');
        await fetchAttendance();
      } else {
        setLastCheckInAlert({
          text: data.error || 'Failed to check in attendee',
          type: 'error',
        });
      }
    } catch (err: any) {
      setLastCheckInAlert({
        text: err.message || 'Error processing check-in',
        type: 'error',
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleManualToggle = async (userId: string, isCheckedIn: boolean) => {
    try {
      if (isCheckedIn) {
        // Revert / Undo
        const res = await fetch(`/api/events/${eventId}/attendance`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        if (res.ok) fetchAttendance();
      } else {
        // Check in
        const res = await fetch(`/api/events/${eventId}/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, checkInMethod: 'MANUAL' }),
        });
        if (res.ok) fetchAttendance();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAttendees = attendees.filter((a) => {
    if (filter === 'CHECKED_IN' && !a.isCheckedIn) return false;
    if (filter === 'PENDING' && (a.isCheckedIn || a.registrationStatus !== 'REGISTERED')) return false;
    if (filter === 'WAITLIST' && a.registrationStatus !== 'WAITLISTED') return false;

    if (search) {
      const term = search.toLowerCase();
      return (
        a.name?.toLowerCase().includes(term) ||
        a.rollNumber?.toLowerCase().includes(term) ||
        a.email?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <AdminShell>
      {/* Back button */}
      <div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Events Management
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Badge variant="cyan" size="sm" className="mb-1">
            Live Check-In Desk
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {event?.title || 'Event Attendance Desk'}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              {event?.startDate ? formatDate(event.startDate) : ''}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              {event?.venue}
            </span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAttendance}
          className="flex items-center gap-1.5 self-start sm:self-auto text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Roster
        </Button>
      </div>

      {/* Real-time Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <p className="text-xs text-slate-400">Total Capacity</p>
          <p className="text-2xl font-bold text-white mt-1">{stats?.capacity || 0}</p>
          <span className="text-[10px] text-slate-500">Maximum audience limit</span>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <p className="text-xs text-slate-400">Confirmed Registered</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{stats?.confirmedCount || 0}</p>
          <span className="text-[10px] text-slate-500">Seats officially booked</span>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <p className="text-xs text-slate-400">Checked In</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats?.checkedInCount || 0}</p>
          <span className="text-[10px] text-slate-500">Verified attendance</span>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <p className="text-xs text-slate-400">Attendance Rate</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats?.attendanceRate || 0}%</p>
          <span className="text-[10px] text-slate-500">{stats?.waitlistedCount || 0} in waitlist</span>
        </Card>
      </div>

      {/* Fast Check-In Scanner Bar */}
      <Card className="p-5 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border-cyan-500/30">
        <form onSubmit={handleQuickCheckIn} className="space-y-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Fast QR / Roll Number Entry</h3>
          </div>
          <p className="text-xs text-slate-400">
            Scan attendee QR code or type student roll number (e.g. <code className="text-cyan-300">22091A3201</code>) and press Enter.
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Roll Number (e.g. 22091A3201)"
                value={rollInput}
                onChange={(e) => setRollInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <Button
              variant="primary"
              type="submit"
              disabled={checkingIn || !rollInput.trim()}
              className="px-6 font-semibold"
            >
              {checkingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check In'}
            </Button>
          </div>

          {lastCheckInAlert && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 mt-2 ${
                lastCheckInAlert.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800/80'
              }`}
            >
              {lastCheckInAlert.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{lastCheckInAlert.text}</span>
            </div>
          )}
        </form>
      </Card>

      {/* Roster Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roster by name, roll number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-stretch sm:self-auto text-xs">
          {[
            { id: 'ALL', label: `All (${attendees.length})` },
            { id: 'CHECKED_IN', label: `Checked In (${stats?.checkedInCount || 0})` },
            { id: 'PENDING', label: `Pending (${Math.max(0, (stats?.confirmedCount || 0) - (stats?.checkedInCount || 0))})` },
            { id: 'WAITLIST', label: `Waitlist (${stats?.waitlistedCount || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Attendee Roster Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      ) : filteredAttendees.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-xs text-slate-400">
          No attendees match the selected filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Registration</th>
                <th className="py-3.5 px-4">Attendance Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAttendees.map((a) => (
                <tr key={a.registrationId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-xs">
                        {a.name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{a.name}</p>
                        <p className="text-[11px] text-slate-400">{a.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {a.rollNumber ? (
                      <span className="font-mono text-cyan-300 font-semibold">{a.rollNumber}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <Badge
                      variant={a.registrationStatus === 'REGISTERED' ? 'emerald' : 'amber'}
                      size="sm"
                    >
                      {a.registrationStatus}
                    </Badge>
                  </td>

                  <td className="py-3 px-4">
                    {a.isCheckedIn ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Checked In ({a.checkInMethod})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Not Checked In</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {a.registrationStatus === 'REGISTERED' && (
                      <Button
                        variant={a.isCheckedIn ? 'ghost' : 'secondary'}
                        size="sm"
                        onClick={() => handleManualToggle(a.userId, a.isCheckedIn)}
                        className={`text-xs ${
                          a.isCheckedIn
                            ? 'text-slate-400 hover:text-rose-400'
                            : 'text-cyan-300 border-cyan-800/60 hover:bg-cyan-950/40'
                        }`}
                      >
                        {a.isCheckedIn ? 'Undo Check-In' : 'Mark Checked In'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
