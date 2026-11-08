import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  Award,
  Shield,
  Users,
  BookOpen,
  Target,
  TrendingUp,
  Brain,
  Code,
  Globe,
  Zap,
  Building2,
  CheckCircle,
  Star,
  Medal,
  GraduationCap,
  Briefcase,
  Calendar,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About SREC',
  description: 'Learn about Santhiram Engineering College (Autonomous), Nandyal - accreditations, departments, and institutional excellence.',
};

const ACCREDITATIONS = [
  { name: 'AICTE Approved', icon: Shield, description: 'Approved by All India Council for Technical Education', color: 'brand' },
  { name: 'JNTUA Affiliated', icon: GraduationCap, description: 'Affiliated to Jawaharlal Nehru Technological University Anantapur', color: 'cyan' },
  { name: 'NAAC A+ Grade', icon: Award, description: 'Accredited by National Assessment and Accreditation Council with A+ Grade', color: 'amber' },
  { name: 'NBA Accredited', icon: Medal, description: 'Programs accredited by National Board of Accreditation', color: 'emerald' },
  { name: 'Autonomous Status', icon: Star, description: 'Granted autonomous status by UGC', color: 'violet' },
  { name: 'ISO 9001:2015', icon: Shield, description: 'Quality Management System Certified', color: 'rose' },
];

const DEPARTMENTS_DATA = [
  { code: 'AIML', name: 'Artificial Intelligence & Machine Learning', shortName: 'AIML', icon: Brain, color: 'from-violet-500 to-purple-500', intake: 60, established: 2022 },
  { code: 'CSE', name: 'Computer Science & Engineering', shortName: 'CSE', icon: Code, color: 'from-brand-500 to-cyan-500', intake: 180, established: 2007 },
  { code: 'CSD', name: 'CSE (Data Science)', shortName: 'CSD', icon: Brain, color: 'from-emerald-500 to-teal-500', intake: 60, established: 2021 },
  { code: 'CSG', name: 'CSE (Cyber Security)', shortName: 'CSG', icon: Shield, color: 'from-rose-500 to-red-500', intake: 60, established: 2021 },
  { code: 'CSIT', name: 'CSE & Information Technology', shortName: 'CSIT', icon: Globe, color: 'from-sky-500 to-blue-500', intake: 60, established: 2011 },
  { code: 'ECE', name: 'Electronics & Communication Engineering', shortName: 'ECE', icon: Zap, color: 'from-amber-500 to-orange-500', intake: 120, established: 2007 },
  { code: 'EEE', name: 'Electrical & Electronics Engineering', shortName: 'EEE', icon: Zap, color: 'from-yellow-500 to-amber-500', intake: 60, established: 2007 },
  { code: 'MECH', name: 'Mechanical Engineering', shortName: 'MECH', icon: Target, color: 'from-slate-500 to-gray-500', intake: 60, established: 2007 },
  { code: 'CIVIL', name: 'Civil Engineering', shortName: 'CIVIL', icon: Building2, color: 'from-stone-500 to-amber-500', intake: 60, established: 2007 },
  { code: 'MBA', name: 'Master of Business Administration', shortName: 'MBA', icon: TrendingUp, color: 'from-emerald-500 to-green-500', intake: 60, established: 2009 },
  { code: 'MCA', name: 'Master of Computer Applications', shortName: 'MCA', icon: Code, color: 'from-indigo-500 to-violet-500', intake: 60, established: 2009 },
];

const GOVERNANCE_TIERS = [
  {
    tier: 'Tier 1',
    title: 'Root Sovereign Admin',
    description: 'Full campus-wide control across all 11 departments. Manages system settings, user provisioning, disaster recovery, and ownership transfer.',
    icon: Shield,
    color: 'amber',
    permissions: ['System Configuration', 'User Management', 'Backup & Restore', 'Root Transfer', 'Deduplication Engine', 'Audit Logs'],
  },
  {
    tier: 'Tier 2',
    title: 'Department Admin',
    description: 'Scoped authority over a specific engineering branch. Manages achievements, events, faculty, students, and sub-admin delegation.',
    icon: Building2,
    color: 'brand',
    permissions: ['Branch Achievements', 'Branch Events', 'Faculty Roster', 'Student Directory', 'Sub-Admin Delegation', 'Branch Analytics'],
  },
  {
    tier: 'Tier 3',
    title: 'Manage Sub-Admin',
    description: 'Operational coordinator for faculty and student management within assigned department. Handles registries and verification workflows.',
    icon: Users,
    color: 'cyan',
    permissions: ['Student Management', 'Faculty Management', 'Achievement Verification', 'Bulk Upload Review', 'Branch Reports'],
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      <section className="text-center max-w-3xl mx-auto">
        <Badge variant="brand" size="lg" glow className="mb-4">
          <Award className="w-3.5 h-3.5 mr-1.5" />
          About Santhiram Engineering College
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-4">
          Empowering Excellence Since 2007
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed">
          Santhiram Engineering College (Autonomous), Nandyal is a premier technical institution 
          established in 2007, approved by AICTE, affiliated to JNTUA, and accredited with NAAC A+ Grade. 
          The college offers 11 undergraduate and postgraduate programs across engineering and management disciplines.
        </p>
      </section>

      <section id="accreditations" aria-labelledby="accreditations-heading">
        <h2 id="accreditations-heading" className="text-3xl font-bold text-slate-100 mb-8 text-center">Accreditations & Recognitions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ACCREDITATIONS.map((acc) => (
            <Card key={acc.name} variant="bento" hover className="text-center">
              <CardContent className="p-8">
                <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4', `bg-gradient-to-br ${acc.color}-500/20 text-${acc.color}-400`)}>
                  <acc.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2">{acc.name}</h3>
                <p className="text-slate-400">{acc.description}</p>
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="departments" aria-labelledby="departments-heading">
        <h2 id="departments-heading" className="text-3xl font-bold text-slate-100 mb-8 text-center">11 Academic Departments</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DEPARTMENTS_DATA.map((dept) => (
            <Card key={dept.code} variant="bento" hover className="group">
              <CardContent className="p-5">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform', `bg-gradient-to-br ${dept.color}`)}>
                  <dept.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-100 mb-1">{dept.name}</h3>
                <p className="text-sm text-slate-500 mb-3">{dept.shortName} • Est. {dept.established}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="slate" size="sm">{dept.intake} Seats</Badge>
                  <Badge variant="cyan" size="sm">UG/PG</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="governance" aria-labelledby="governance-heading">
        <h2 id="governance-heading" className="text-3xl font-bold text-slate-100 mb-8 text-center">Three-Tier Governance Architecture</h2>
        <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
          SREC Connect implements a sovereign three-tier administrative hierarchy ensuring 
          clear accountability, scoped authority, and secure data management across the institution.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GOVERNANCE_TIERS.map((tier) => (
            <Card key={tier.tier} variant="bento" hover className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 opacity-10" style={{ background: `linear-gradient(to bottom left, transparent, var(--color-${tier.color}-500))` }} />
              <CardContent className="p-6 relative h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', `bg-${tier.color}-500/20 text-${tier.color}-400`)}>
                    <tier.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className={cn('text-sm font-medium', `text-${tier.color}-400`)}>{tier.tier}</span>
                    <h3 className="text-lg font-bold text-slate-100">{tier.title}</h3>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-4 flex-1">{tier.description}</p>
                <div className="flex flex-wrap gap-1">
                  {tier.permissions.map((perm) => (
                    <Badge key={perm} variant="slate" size="sm">{perm}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="contact" aria-labelledby="contact-heading" className="pt-8 border-t border-slate-800/50">
        <h2 id="contact-heading" className="text-3xl font-bold text-slate-100 mb-8 text-center">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card variant="glass" className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-100 mb-2">Address</h3>
              <p className="text-slate-400">NH-40, Nandyal, Kurnool District, Andhra Pradesh - 518501</p>
            </CardContent>
          </Card>
          <Card variant="glass" className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-100 mb-2">Phone</h3>
              <p className="text-slate-400">+91 8514 275 200</p>
              <p className="text-slate-400">+91 8514 275 201</p>
            </CardContent>
          </Card>
          <Card variant="glass" className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-100 mb-2">Email</h3>
              <p className="text-slate-400">principal@srec.ac.in</p>
              <p className="text-slate-400">admin@srec.ac.in</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}