'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  ArrowLeft,
  Search,
  Bug,
  Compass,
  Calendar,
  Award,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full text-center space-y-6">
        {/* College Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
          <Compass className="w-4 h-4 animate-spin-slow" />
          <span>SREC CONNECT NAVIGATION GUARD</span>
        </div>

        {/* 404 Headline */}
        <div className="space-y-2">
          <h1 className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-cyan-400 to-emerald-400 tracking-tight">
            404
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Page Not Found or Destination Moved
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            The page you requested does not exist or may have been relocated.
            Use the search below or explore the campus portal directories.
          </p>
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scholars, faculty, events, or circulars..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-space-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-cyan-500 text-space-950 font-bold text-xs hover:bg-cyan-400 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Quick Destinations Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <Link
            href="/"
            className="p-3 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 hover:bg-space-800/50 transition-all text-center group"
          >
            <Home className="w-5 h-5 mx-auto mb-1 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-semibold text-slate-300">Feed</span>
          </Link>

          <Link
            href="/events"
            className="p-3 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 hover:bg-space-800/50 transition-all text-center group"
          >
            <Calendar className="w-5 h-5 mx-auto mb-1 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-semibold text-slate-300">Events</span>
          </Link>

          <Link
            href="/students"
            className="p-3 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 hover:bg-space-800/50 transition-all text-center group"
          >
            <Users className="w-5 h-5 mx-auto mb-1 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-semibold text-slate-300">Students</span>
          </Link>

          <Link
            href="/achievements"
            className="p-3 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 hover:bg-space-800/50 transition-all text-center group"
          >
            <Award className="w-5 h-5 mx-auto mb-1 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-semibold text-slate-300">Honors</span>
          </Link>
        </div>

        {/* Broken Link Report Callout */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            href="/report-bug"
            className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors font-medium"
          >
            <Bug className="w-4 h-4" />
            <span>Report Broken Link / 404 to Engineering</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
