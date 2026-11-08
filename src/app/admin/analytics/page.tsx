'use client';

import React, { useState, useEffect } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Calendar,
  MessageSquare,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Building2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <AdminShell>
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </AdminShell>
    );
  }

  const summary = data?.summary || {};
  const trendData = data?.trendData || [];
  const departmentStats = data?.departmentStats || [];
  const categoryDistribution = data?.categoryDistribution || [];

  return (
    <AdminShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Badge variant="cyan" size="sm" className="mb-1">
            Departmental Intelligence
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Analytics & Academic Growth
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Operational telemetry covering student enrollment, faculty research, verified achievements, and event participation.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 self-start sm:self-auto text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Enrolled Students</span>
            <GraduationCap className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{summary.studentCount || 0}</p>
          <span className="text-[10px] text-cyan-400">JNTUA University Anchored</span>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Faculty Members</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{summary.facultyCount || 0}</p>
          <span className="text-[10px] text-blue-400">Teaching & Research Mentors</span>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Verified Achievements</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1.5">{summary.publishedAchievements || 0}</p>
          <span className="text-[10px] text-slate-500">
            {summary.pendingAchievements || 0} pending review
          </span>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Event Registrations</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400 mt-1.5">{summary.totalRegistrations || 0}</p>
          <span className="text-[10px] text-purple-300">
            {summary.overallAttendanceRate || 0}% check-in rate
          </span>
        </Card>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Trend Area Chart */}
        <Card className="p-5 bg-slate-900/60 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Semester Growth Trajectory
              </h3>
              <p className="text-[11px] text-slate-400">Monthly publication and attendee activity</p>
            </div>
            <Badge variant="cyan" size="sm">Real-time</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="achievements" stroke="#06b6d4" fillOpacity={1} fill="url(#colorAch)" name="Achievements" />
                <Area type="monotone" dataKey="eventAttendees" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorAtt)" name="Attendees" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department Activity Bar Chart */}
        <Card className="p-5 bg-slate-900/60 border-slate-800 space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              Department Activity Comparison
            </h3>
            <p className="text-[11px] text-slate-400">Student enrollment and verified achievements by branch</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="code" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="students" fill="#3b82f6" name="Students" radius={[4, 4, 0, 0]} />
                <Bar dataKey="achievements" fill="#10b981" name="Achievements" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Categories Breakdown */}
      <Card className="p-5 bg-slate-900/60 border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Achievement Categories Distribution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
          {categoryDistribution.map((cat: any, i: number) => (
            <div key={i} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <p className="text-xs text-slate-400 truncate">{cat.name}</p>
              <p className="text-lg font-bold text-white">{cat.count}</p>
            </div>
          ))}
        </div>
      </Card>
    </AdminShell>
  );
}
