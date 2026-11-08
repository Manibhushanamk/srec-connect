'use client';

import Link from 'next/link';
import { Shield, Mail, AlertCircle, ArrowLeft, Sparkles, Brain, Code, Globe, Zap, Building2, Target, TrendingUp, GraduationCap, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const DEPARTMENTS = [
  { code: 'AIML', name: 'AI & ML', icon: Brain, color: 'from-violet-500 to-purple-500' },
  { code: 'CSE', name: 'CSE', icon: Code, color: 'from-brand-500 to-cyan-500' },
  { code: 'CSD', name: 'CSD', icon: Brain, color: 'from-emerald-500 to-teal-500' },
  { code: 'CSG', name: 'CSG', icon: Shield, color: 'from-rose-500 to-red-500' },
  { code: 'CSIT', name: 'CSIT', icon: Globe, color: 'from-sky-500 to-blue-500' },
  { code: 'ECE', name: 'ECE', icon: Zap, color: 'from-amber-500 to-orange-500' },
  { code: 'EEE', name: 'EEE', icon: Zap, color: 'from-yellow-500 to-amber-500' },
  { code: 'MECH', name: 'MECH', icon: Target, color: 'from-slate-500 to-gray-500' },
  { code: 'CIVIL', name: 'CIVIL', icon: Building2, color: 'from-stone-500 to-amber-500' },
  { code: 'MBA', name: 'MBA', icon: TrendingUp, color: 'from-emerald-500 to-green-500' },
  { code: 'MCA', name: 'MCA', icon: Code, color: 'from-indigo-500 to-violet-500' },
];

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-500/10 via-transparent to-amber-500/10" />
      
      <div className="relative w-full max-w-md text-center">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)]">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-cyan-400 to-emerald-400">
              SREC Connect
            </span>
          </Link>
        </div>

        <Card variant="bento">
          <CardContent className="p-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-neon-rose/20 border border-neon-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-neon-rose" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-100">Access Denied</h1>
            <p className="text-slate-400">
              Your email address is not whitelisted for SREC Connect. 
              Only pre-approved users can access the portal.
            </p>

            <div className="p-4 rounded-xl bg-space-800/50 border border-slate-700/30 text-left">
              <h3 className="font-medium text-slate-100 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                What you can do:
              </h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                  Contact your Department Admin or HOD to request whitelist access
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                  Provide your full name, roll number (for students), and department
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                  Use your official SREC Google account for authentication
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link href="/auth/signin">
                <Button variant="secondary" fullWidth className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Button>
              </Link>
              <Button variant="outline" fullWidth onClick={() => window.location.href = 'mailto:admin@srec.ac.in?subject=SREC Connect Access Request'} className="gap-2">
                <Mail className="w-4 h-4" />
                Email Admin for Access
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {DEPARTMENTS.map((dept) => (
            <Badge key={dept.code} variant="slate" size="sm" className="gap-1">
              <dept.icon className="w-3 h-3" style={{ background: `linear-gradient(135deg, ${dept.color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
              {dept.name}
            </Badge>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-500">
          SREC Connect v3.0 &copy; {new Date().getFullYear()} Santhiram Engineering College (Autonomous), Nandyal
        </p>
      </div>
    </div>
  );
}