import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getAllDepartments } from '@/lib/departments';
import { cn } from '@/lib/utils';
import {
  Building2,
  Users,
  Award,
  BookOpen,
  Calendar,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Target,
  TrendingUp,
  Brain,
  Code,
  Globe,
  Zap,
  Shield,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Academic Departments',
  description: 'Explore all 11 academic departments at Santhiram Engineering College - faculty, students, achievements, and events.',
};

const DEPARTMENT_ICONS: Record<string, React.ReactNode> = {
  AIML: <Brain className="w-7 h-7" />,
  CSE: <Code className="w-7 h-7" />,
  CSD: <Brain className="w-7 h-7" />,
  CSG: <Shield className="w-7 h-7" />,
  CSIT: <Globe className="w-7 h-7" />,
  ECE: <Zap className="w-7 h-7" />,
  EEE: <Zap className="w-7 h-7" />,
  MECH: <Target className="w-7 h-7" />,
  CIVIL: <Building2 className="w-7 h-7" />,
  MBA: <TrendingUp className="w-7 h-7" />,
  MCA: <Code className="w-7 h-7" />,
};

const DEPARTMENT_GRADIENTS: Record<string, string> = {
  AIML: 'from-violet-500 via-purple-500 to-violet-600',
  CSE: 'from-brand-500 via-brand-600 to-cyan-500',
  CSD: 'from-emerald-500 via-teal-500 to-emerald-600',
  CSG: 'from-rose-500 via-red-500 to-rose-600',
  CSIT: 'from-sky-500 via-blue-500 to-sky-600',
  ECE: 'from-amber-500 via-orange-500 to-amber-600',
  EEE: 'from-yellow-500 via-amber-500 to-yellow-600',
  MECH: 'from-slate-500 via-gray-500 to-slate-600',
  CIVIL: 'from-stone-500 via-amber-500 to-stone-600',
  MBA: 'from-emerald-500 via-green-500 to-emerald-600',
  MCA: 'from-indigo-500 via-violet-500 to-indigo-600',
};

async function getDepartmentStats(departmentId: string) {
  const [students, faculty, achievements, events] = await Promise.all([
    prisma.student.count({ where: { departmentId, isActive: true } }),
    prisma.faculty.count({ where: { departmentId, isActive: true } }),
    prisma.achievement.count({ where: { departmentId, status: 'PUBLISHED' } }),
    prisma.event.count({ where: { departmentId } }),
  ]);
  return { students, faculty, achievements, events };
}

export default async function DepartmentsPage() {
  const departments = await getAllDepartments();
  const statsMap = await Promise.all(
    departments.map(async (dept) => {
      const stats = await getDepartmentStats(dept.id);
      return { dept, stats };
    })
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <Badge variant="brand" size="lg" glow className="mb-4">
          <Building2 className="w-3.5 h-3.5 mr-1.5" />
          11 Academic Departments
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-4">
          Academic Excellence Across Disciplines
        </h1>
        <p className="text-lg text-slate-400">
          Each department at SREC fosters innovation, research, and academic excellence.
          Explore faculty expertise, student achievements, and upcoming events.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsMap.map(({ dept, stats }) => (
          <Link key={dept.id} href={`/departments/${dept.code}`} className="group">
            <Card variant="bento" hover className="h-full overflow-hidden relative">
              <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-br" style={{ background: DEPARTMENT_GRADIENTS[dept.code] }} />
              </div>
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300', `bg-gradient-to-br ${DEPARTMENT_GRADIENTS[dept.code]}`)}>
                    {DEPARTMENT_ICONS[dept.code] || <Building2 className="w-8 h-8" />}
                  </div>
                  <Badge variant="cyan" size="sm">{dept.shortName}</Badge>
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-1">{dept.name}</h3>
                <p className="text-sm text-slate-500 mb-4 flex-1">{dept.fullName}</p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-space-800/50 border border-slate-700/30 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{stats.students}</div>
                    <div className="text-xs text-slate-500">Students</div>
                  </div>
                  <div className="p-3 rounded-xl bg-space-800/50 border border-slate-700/30 text-center">
                    <div className="text-2xl font-bold text-brand-400">{stats.faculty}</div>
                    <div className="text-xs text-slate-500">Faculty</div>
                  </div>
                  <div className="p-3 rounded-xl bg-space-800/50 border border-slate-700/30 text-center">
                    <div className="text-2xl font-bold text-amber-400">{stats.achievements}</div>
                    <div className="text-xs text-slate-500">Achievements</div>
                  </div>
                  <div className="p-3 rounded-xl bg-space-800/50 border border-slate-700/30 text-center">
                    <div className="text-2xl font-bold text-cyan-400">{stats.events}</div>
                    <div className="text-xs text-slate-500">Events</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-400 border-t border-slate-800/50 pt-4">
                  {dept.hodName && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>HOD: {dept.hodName}</span>
                    </div>
                  )}
                  {dept.hodEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{dept.hodEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Intake: {dept.intake} seats</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Established: {dept.established}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Explore Department</span>
                  <ArrowRight className="w-5 h-5 text-brand-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <section className="pt-8 border-t border-slate-800/50" aria-labelledby="stats-heading">
        <div className="text-center mb-10">
          <h2 id="stats-heading" className="text-3xl font-bold text-slate-100">Campus-Wide Statistics</h2>
          <p className="mt-2 text-slate-400">Aggregate metrics across all 11 departments</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', icon: Users, color: 'emerald', getValue: () => statsMap.reduce((sum, s) => sum + s.stats.students, 0) },
            { label: 'Total Faculty', icon: Briefcase, color: 'brand', getValue: () => statsMap.reduce((sum, s) => sum + s.stats.faculty, 0) },
            { label: 'Total Achievements', icon: Award, color: 'amber', getValue: () => statsMap.reduce((sum, s) => sum + s.stats.achievements, 0) },
            { label: 'Total Events', icon: Calendar, color: 'cyan', getValue: () => statsMap.reduce((sum, s) => sum + s.stats.events, 0) },
          ].map((stat, index) => (
            <Card key={stat.label} variant="bento" hover className="text-center">
              <CardContent className="py-8">
                <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4', `bg-${stat.color}-500/20 text-${stat.color}-400`)}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div className="text-4xl font-bold text-slate-100">{stat.getValue()}</div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}