'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  Calendar,
  Plus,
  QrCode,
  Users,
  MapPin,
  Clock,
  Search,
  ExternalLink,
  Trash2,
  Edit,
  Loader2,
  CheckCircle2,
  CheckCircle,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const EVENT_POSTER_PRESETS = [
  {
    name: 'AI & Neural Systems',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Hackathon & Sprint',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Cyber & Cloud Matrix',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Research Keynote',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Robotics & Hardware',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    departmentId: '',
    startDate: '',
    endDate: '',
    venue: '',
    organizer: '',
    speaker: '',
    capacity: 100,
    registrationDeadline: '',
    whatsappGroupUrl: '',
    posterUrl: '',
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?status=${statusFilter === 'ALL' ? '' : statusFilter}&search=${search}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : { categories: [] }))
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
    fetch('/api/departments')
      .then((r) => (r.ok ? r.json() : { departments: [] }))
      .then((d) => setDepartments(d.departments || []))
      .catch(() => setDepartments([]));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          description: '',
          categoryId: '',
          departmentId: '',
          startDate: '',
          endDate: '',
          venue: '',
          organizer: '',
          speaker: '',
          capacity: 100,
          registrationDeadline: '',
          whatsappGroupUrl: '',
          posterUrl: '',
        });
        fetchEvents();
      } else {
        alert(data.error || 'Failed to create event');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating event');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel and remove this event?')) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEvents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      ev.title.toLowerCase().includes(term) ||
      ev.venue.toLowerCase().includes(term) ||
      ev.organizer.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Badge variant="cyan" size="sm" className="mb-1">
            Academic Operations
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Campus Events Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create symposia, configure seat capacities, manage waitlists, and operate the QR attendance desk.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events by title, venue, organizer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl self-stretch sm:self-auto">
          {['ALL', 'UPCOMING', 'ONGOING', 'COMPLETED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / Card List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No events found</h3>
          <p className="text-xs text-slate-400 mt-1">Get started by creating your first department event.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="p-5 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex gap-4 items-start flex-1">
                  {event.posterUrl ? (
                    <div className="w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700/80 bg-slate-950 shadow-sm hidden sm:block">
                      <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-20 rounded-xl bg-slate-800/80 flex items-center justify-center flex-shrink-0 border border-slate-700/50 text-slate-500 hidden sm:flex">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={event.status as any} size="sm" />
                      <Badge variant="cyan" size="sm">{event.category?.name || 'Workshop'}</Badge>
                      {event.department && (
                        <Badge variant="brand" size="sm">{event.department.shortName || event.department.name}</Badge>
                      )}
                      <span className="text-[11px] text-slate-400">
                        Capacity: {event.registeredCount || 0} / {event.capacity} seats confirmed
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white truncate">{event.title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        {formatDate(event.startDate)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        {event.venue}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        {event.attendedCount || 0} checked in
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operations & Actions Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <Link href={`/admin/events/${event.id}/attendance`}>
                    <Button variant="secondary" size="sm" className="text-xs text-cyan-300 border-cyan-800/60 hover:bg-cyan-950/40">
                      <QrCode className="w-3.5 h-3.5 mr-1.5" />
                      QR Attendance Desk
                    </Button>
                  </Link>

                  <Link href={`/events/${event.id}`} target="_blank">
                    <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      View Public Page
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Campus Event"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Event Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. National Symposium on Deep Learning & Vision"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Category *</label>
              <select
                required
                value={createForm.categoryId}
                onChange={(e) => setCreateForm({ ...createForm, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Department</label>
              <select
                value={createForm.departmentId}
                onChange={(e) => setCreateForm({ ...createForm, departmentId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select Department (or All)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Start Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={createForm.startDate}
                onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">End Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={createForm.endDate}
                onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Venue *</label>
              <input
                type="text"
                required
                placeholder="e.g. APJ Abdul Kalam Auditorium"
                value={createForm.venue}
                onChange={(e) => setCreateForm({ ...createForm, venue: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Seat Capacity *</label>
              <input
                type="number"
                min="1"
                required
                value={createForm.capacity}
                onChange={(e) => setCreateForm({ ...createForm, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Speaker / Resource Person</label>
              <input
                type="text"
                placeholder="e.g. Dr. K. Subhashini"
                value={createForm.speaker}
                onChange={(e) => setCreateForm({ ...createForm, speaker: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Organizer Title</label>
              <input
                type="text"
                placeholder="e.g. CSE (AI & ML) Department"
                value={createForm.organizer}
                onChange={(e) => setCreateForm({ ...createForm, organizer: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              WhatsApp Group Link (Registrants-Only Post-Registration Disclosure)
            </label>
            <input
              type="url"
              placeholder="https://chat.whatsapp.com/..."
              value={createForm.whatsappGroupUrl}
              onChange={(e) => setCreateForm({ ...createForm, whatsappGroupUrl: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Protected: This invite link is securely hidden from public visitors and only revealed after confirmed registration.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Event agenda, topics, prerequisites, and instructions..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Event Banner & Poster */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-medium flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Event Poster / Banner Image</span>
              </label>
              <span className="text-[10px] text-cyan-400">High-Resolution (16:9 Recommended)</span>
            </div>

            <input
              type="url"
              placeholder="Paste public banner/poster URL (e.g. Unsplash or Google Drive)"
              value={createForm.posterUrl}
              onChange={(e) => setCreateForm({ ...createForm, posterUrl: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />

            <div>
              <p className="text-[10px] text-slate-400 mb-1.5">Or choose a curated template poster:</p>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_POSTER_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, posterUrl: preset.url })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                      createForm.posterUrl === preset.url
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-xs'
                        : 'bg-slate-900 text-slate-400 border-slate-700/80 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {createForm.posterUrl && (
              <div className="relative h-32 w-full rounded-xl overflow-hidden border border-slate-700 mt-2">
                <img
                  src={createForm.posterUrl}
                  alt="Poster preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[11px] font-medium text-white flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Poster Preview Ready
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={creating}>
              {creating && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Publish Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
