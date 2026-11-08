'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, AlertCircle, CheckCircle, Sparkles, ArrowRight, Eye, EyeOff, Brain, Code, Globe, Zap, Building2, Target, TrendingUp, GraduationCap, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRollLookup, setShowRollLookup] = useState(false);
  const [rollNumber, setRollNumber] = useState('');
  const [rollInfo, setRollInfo] = useState<{ department: string; batch: string } | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch (err) {
      console.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollLookup = () => {
    const cleaned = rollNumber.trim().toUpperCase();
    if (!/^\d{4}1A\d{2}\d{3}$/.test(cleaned)) {
      setRollInfo(null);
      return;
    }

    const year = cleaned.slice(0, 4);
    const deptCode = cleaned.slice(6, 8);
    const deptMap: Record<string, string> = {
      '32': 'AIML', '05': 'CSE', '33': 'CSD', '34': 'CSG',
      '06': 'CSIT', '04': 'ECE', '02': 'EEE', '03': 'MECH',
      '01': 'CIVIL', '62': 'MBA', '63': 'MCA',
    };

    const department = deptMap[deptCode] || 'Unknown';
    const batch = `${year}-${parseInt(year) + 4}`;

    setRollInfo({ department, batch });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-500/10 via-transparent to-cyan-500/10" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Cpath d=%27M50 0L100 50L50 100L0 50Z%27 fill=%27none%27 stroke=%27%231e293b%27 stroke-width=%270.5%27/%3E%3C/svg%27')] opacity-30" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)]">
              <Shield className="w-7 h-7 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500/30 via-cyan-500/20 to-emerald-500/30 blur-xl opacity-50 animate-pulse" />
            </div>
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-cyan-400 to-emerald-400">
              SREC Connect
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Sign In to Your Dashboard</h1>
          <p className="text-slate-400">Access your personalized portal with Google OAuth</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-neon-rose/10 border border-neon-rose/30 flex items-start gap-3 animate-slide-up">
            <AlertCircle className="w-5 h-5 text-neon-rose flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-neon-rose font-medium">Access Denied</p>
              <p className="text-sm text-slate-400 mt-1">
                Your email is not whitelisted. Please contact your department administrator to request access.
              </p>
            </div>
          </div>
        )}

        <Card variant="glass">
          <CardContent className="p-6 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-space-800/60 text-slate-500">Or continue with</span>
              </div>
            </div>

            <Button
              variant="secondary"
              fullWidth
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="gap-3 py-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium">Continue with Google</span>
              {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Only whitelisted emails can access the portal.{' '}
              <Link href="/auth/access-denied" className="text-brand-400 hover:text-brand-300 underline">
                Request Access
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card variant="bento" className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              Student Roll Number Lookup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-400">
              Enter your JNTUA roll number to instantly detect your department and batch.
            </p>
            <div className="space-y-3">
              <Input
                label="Roll Number"
                placeholder="e.g., 22091A3201"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                onBlur={handleRollLookup}
                maxLength={10}
              />
              {rollInfo && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Roll Number Recognized</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Department:</span>
                      <span className="text-slate-100 ml-2 font-mono">{rollInfo.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Batch:</span>
                      <span className="text-slate-100 ml-2 font-mono">{rollInfo.batch}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-slate-500">
          <p>New to SREC Connect? <Link href="/auth/access-denied" className="text-brand-400 hover:text-brand-300 underline">Request whitelist access</Link></p>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2">
        {DEPARTMENTS.map((dept) => (
          <Badge key={dept.code} variant="slate" size="sm" className="gap-1">
            <dept.icon className="w-3 h-3" style={{ background: `linear-gradient(135deg, ${dept.color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
            {dept.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}