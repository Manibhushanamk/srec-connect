'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Calendar,
  ChevronRight,
  Megaphone,
  Clock,
  Plus,
  X,
  FileText,
  User,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const RightContextRail: React.FC = () => {
  const { data: session } = useSession();
  const user = session?.user as any;
  const userRole = user?.role;
  const canPostNotice = userRole === 'SUPER_ADMIN' || userRole === 'HOD' || userRole === 'FACULTY';

  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);

  const defaultNotices = [
    {
      id: 'n1',
      title: 'Smart India Hackathon 2026 - Final PPT Submission',
      content: 'All shortlisted teams across Sec A and Sec B must submit their finalized presentation slide decks by 5:00 PM tomorrow to the Department Innovation Cell.',
      date: 'Tomorrow, 5:00 PM',
      priority: 'URGENT',
      targetRole: 'STUDENT',
      section: 'All Sections',
      batch: '2022-2026',
      author: { name: 'Dr. K. Subhashini', role: 'HOD' },
    },
    {
      id: 'n2',
      title: 'Workshop on Deep Learning using PyTorch & TensorRT',
      content: 'Hands-on training session on model acceleration and high-throughput inference in the High Performance Computing Lab.',
      date: 'Nov 12, 10:00 AM',
      priority: 'NORMAL',
      targetRole: 'ALL',
      section: 'Sec A & B',
      batch: '2023-2027',
      author: { name: 'Faculty Coordinator', role: 'FACULTY' },
    },
    {
      id: 'n3',
      title: 'Pre-Placement Training for 3rd Year AIML Students',
      content: 'Mandatory technical resume review, mock system design rounds, and aptitude diagnostics in APJ Abdul Kalam Auditorium.',
      date: 'Nov 15, 2:00 PM',
      priority: 'NORMAL',
      targetRole: 'STUDENT',
      section: 'All Sections',
      batch: '2022-2026',
      author: { name: 'T&P Officer', role: 'FACULTY' },
    },
  ];

  useEffect(() => {
    async function loadNotices() {
      try {
        const res = await fetch('/api/announcements?limit=5');
        if (res.ok) {
          const data = await res.json();
          if (data.announcements && data.announcements.length > 0) {
            setNotices(data.announcements);
          } else {
            setNotices(defaultNotices);
          }
        } else {
          setNotices(defaultNotices);
        }
      } catch {
        setNotices(defaultNotices);
      } finally {
        setLoading(false);
      }
    }
    loadNotices();
  }, []);

  const upcomingEvents = [
    {
      id: 'e1',
      title: 'AI Innovate Symposium 2026',
      type: 'National Hackathon',
      date: 'Nov 20 - 21',
      seatsLeft: '18 seats left',
    },
    {
      id: 'e2',
      title: 'Hands-on Generative AI with LLMs',
      type: 'Workshop',
      date: 'Nov 25',
      seatsLeft: 'Registration Open',
    },
  ];

  return (
    <div className="hidden xl:flex flex-col w-80 flex-shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto no-scrollbar pb-6 space-y-4">
      {/* 1. Official Announcements */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <span>Official Notices</span>
          </div>
          <div className="flex items-center gap-2">
            {canPostNotice && (
              <Link
                href="/admin/notices"
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Post</span>
              </Link>
            )}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              CSE - AIML
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {notices.map((notice) => {
            const isUrgent = notice.priority === 'URGENT' || notice.priority === 'CRITICAL';
            return (
              <div
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className="p-3 rounded-xl bg-secondary/50 border border-border/70 hover:bg-secondary cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <span className="font-semibold text-muted-foreground">
                    {notice.section ? `Sec ${notice.section}` : notice.targetRole || 'Department'}
                  </span>
                  {isUrgent && (
                    <span className="text-rose-500 font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/20">
                      Urgent
                    </span>
                  )}
                </div>

                <h5 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {notice.title}
                </h5>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-0.5">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{notice.date || formatDate(notice.createdAt)}</span>
                  </div>
                  <span className="text-[10px] font-sans text-muted-foreground">
                    {notice.author?.name ? notice.author.name.split(' ')[0] : 'HOD'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Upcoming Events Card */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Upcoming Events</span>
          </div>
          <Link href="/events" className="text-xs text-primary font-medium hover:underline flex items-center">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-3">
          {upcomingEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-3 rounded-xl bg-secondary/50 border border-border/70 hover:bg-secondary transition-colors"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                {evt.type}
              </span>
              <h5 className="text-xs font-semibold text-foreground mt-0.5">
                {evt.title}
              </h5>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
                <span>{evt.date}</span>
                <span className="text-primary font-medium">{evt.seatsLeft}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                    <Megaphone className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Official Department Notice
                  </span>
                  {selectedNotice.priority === 'URGENT' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                      URGENT
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-foreground mt-1">
                  {selectedNotice.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target & Authority Meta */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/60 border border-border text-xs">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Target Audience</p>
                <p className="font-semibold text-foreground">
                  {selectedNotice.targetRole || 'All'} • {selectedNotice.section || 'All Sections'}
                </p>
                {selectedNotice.batch && (
                  <p className="text-[10px] text-muted-foreground font-mono">Batch {selectedNotice.batch}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Issuing Authority</p>
                <p className="font-semibold text-foreground">
                  {selectedNotice.author?.name || 'Head of Department (HOD)'}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {selectedNotice.author?.role || 'Department Leadership'}
                </p>
              </div>
            </div>

            {/* Circular Body */}
            <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line p-3 rounded-xl bg-background border border-border">
              {selectedNotice.content}
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border">
              <span>Date: {selectedNotice.date || formatDate(selectedNotice.createdAt)}</span>
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RightContextRail;
