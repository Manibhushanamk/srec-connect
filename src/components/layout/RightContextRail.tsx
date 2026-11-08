'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Bell, Sparkles, Award, ChevronRight, Megaphone, Clock } from 'lucide-react';

export const RightContextRail: React.FC = () => {
  const notices = [
    {
      id: 'n1',
      title: 'Smart India Hackathon 2026 - Final PPT Submission',
      date: 'Tomorrow, 5:00 PM',
      isUrgent: true,
    },
    {
      id: 'n2',
      title: 'Workshop on Deep Learning using PyTorch & TensorRT',
      date: 'Nov 12, 10:00 AM',
      isUrgent: false,
    },
    {
      id: 'n3',
      title: 'Pre-Placement Training for 3rd Year AIML Students',
      date: 'Nov 15, 2:00 PM',
      isUrgent: false,
    },
  ];

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
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            CSE - AIML
          </span>
        </div>

        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="p-3 rounded-xl bg-secondary/50 border border-border/70 hover:bg-secondary transition-colors"
            >
              <h5 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
                {notice.title}
              </h5>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5 font-mono">
                <Clock className="w-3 h-3" />
                <span>{notice.date}</span>
                {notice.isUrgent && (
                  <span className="text-rose-500 font-bold ml-auto text-[10px] uppercase">Urgent</span>
                )}
              </div>
            </div>
          ))}
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
    </div>
  );
};

export default RightContextRail;
