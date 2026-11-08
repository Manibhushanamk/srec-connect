'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Building2,
  Users,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const errorParam = searchParams.get('error');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam ? 'Authentication failed. Please verify your institutional account.' : null
  );

  // Roll Number live lookup state
  const [lookupRoll, setLookupRoll] = useState('');
  const [lookupResult, setLookupResult] = useState<{
    valid: boolean;
    deptName?: string;
    deptCode?: string;
    batch?: string;
    type?: string;
  } | null>(null);

  // 1. Google OAuth Flow
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signIn('google', { callbackUrl });
    } catch (err: any) {
      console.error('[SignIn] Google error:', err);
      setErrorMessage('Could not connect to Google OAuth service. Please retry.');
      setIsLoading(false);
    }
  };

  // 2. Direct Campus Email / Roll Number Flow
  const handleCredentialsSignIn = async (emailOrRoll?: string) => {
    const target = emailOrRoll || identifier;
    if (!target.trim()) {
      setErrorMessage('Please enter your campus email or roll number.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn('credentials', {
        email: target.trim(),
        password: password || 'default',
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMessage('Account not found or access denied. Please verify credentials.');
        setIsLoading(false);
      } else if (res?.ok) {
        window.location.href = callbackUrl || '/';
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred during sign in.');
      setIsLoading(false);
    }
  };

  // 3. JNTUA Roll Number Parser
  const handleRollLookup = (val: string) => {
    const cleaned = val.trim().toUpperCase();
    setLookupRoll(cleaned);

    if (!cleaned) {
      setLookupResult(null);
      return;
    }

    // Pattern: 22091A3201 (10 chars: 2 digits year, 091 college code, 1A b.tech, 2 digits dept, 2 digits seq)
    const match = cleaned.match(/^(\d{2})09(1A|5A)(\d{2})([0-9A-Z]{2})$/);
    if (!match) {
      setLookupResult({ valid: false });
      return;
    }

    const yearPrefix = parseInt(match[1], 10);
    const fullYear = 2000 + yearPrefix;
    const isLateral = match[2] === '5A';
    const deptCodeNum = match[3];

    const DEPT_MAP: Record<string, string> = {
      '32': 'CSE (AI & ML)',
      '05': 'Computer Science & Engineering',
      '33': 'CSE (Data Science)',
      '34': 'CSE (Cyber Security)',
      '06': 'Information Technology',
      '04': 'Electronics & Communication',
      '02': 'Electrical & Electronics',
      '03': 'Mechanical Engineering',
      '01': 'Civil Engineering',
    };

    const deptName = DEPT_MAP[deptCodeNum] || 'Engineering Department';
    const endYear = isLateral ? fullYear + 3 : fullYear + 4;

    setLookupResult({
      valid: true,
      deptName,
      deptCode: deptCodeNum,
      batch: `${fullYear}-${endYear}`,
      type: isLateral ? 'Lateral Entry' : 'Regular B.Tech',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-background">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <div className="relative w-full max-w-lg space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform duration-300">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black tracking-tight text-foreground flex items-center gap-1.5">
                SREC <span className="text-primary font-bold">Connect</span>
              </span>
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Santhiram Engineering College
              </p>
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-foreground pt-3">Campus Authentication</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Sign in with your verified institutional Google identity or permanent roll number.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 animate-slide-up text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Authentication Notice</p>
              <p className="text-xs opacity-90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <Card variant="glass" className="border-border/60 shadow-xl backdrop-blur-xl">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Primary Action: Google OAuth Button */}
            <Button
              variant="secondary"
              fullWidth
              size="lg"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="relative py-3.5 px-4 text-sm font-semibold rounded-xl border-border hover:bg-muted transition-all duration-200 flex items-center justify-center gap-3 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
              {isLoading && <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin ml-2" />}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/80" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="px-3 bg-card text-muted-foreground font-semibold">
                  Or sign in with roll number / email
                </span>
              </div>
            </div>

            {/* Direct Credentials Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCredentialsSignIn();
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="identifier" className="block text-xs font-semibold text-foreground mb-1.5">
                  Campus Email or Permanent Roll Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="identifier"
                    type="text"
                    required
                    placeholder="e.g. 22091A3201 or manibhushanam4k@gmail.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                disabled={isLoading}
                className="py-3 font-semibold rounded-xl shadow-md shadow-primary/20 flex items-center justify-center gap-2"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {/* Quick Test Switcher (Development & Verification) */}
            <div className="pt-2 border-t border-border/60">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                ⚡ Quick Test Persona (Instant Local Sign-In)
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleCredentialsSignIn('manibhushanam4k@gmail.com')}
                  className="p-2 rounded-lg border border-border/70 hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">Super Admin</p>
                    <p className="text-[10px] text-muted-foreground truncate">Mani Bhushanam</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleCredentialsSignIn('hod.aiml@srecnandyal.edu.in')}
                  className="p-2 rounded-lg border border-border/70 hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-2"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">HOD AIML</p>
                    <p className="text-[10px] text-muted-foreground truncate">Dr. K. Srinivas</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleCredentialsSignIn('faculty.aiml@srecnandyal.edu.in')}
                  className="p-2 rounded-lg border border-border/70 hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-2"
                >
                  <Briefcase className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">Faculty</p>
                    <p className="text-[10px] text-muted-foreground truncate">A. Ramesh</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleCredentialsSignIn('22091A3202')}
                  className="p-2 rounded-lg border border-border/70 hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-2"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">Student</p>
                    <p className="text-[10px] text-muted-foreground truncate">P. Sai Kumar</p>
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Roll Number Inspector */}
        <Card variant="glass" className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              JNTUA Roll Number Validator & Decoder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <input
              type="text"
              placeholder="Test any roll number (e.g., 22091A3201)"
              value={lookupRoll}
              onChange={(e) => handleRollLookup(e.target.value)}
              maxLength={10}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs font-mono uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {lookupResult && (
              lookupResult.valid ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Valid JNTUA Roll Number Format</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground pt-1">
                    <div>Department: <span className="font-semibold text-foreground">{lookupResult.deptName}</span></div>
                    <div>Batch: <span className="font-semibold text-foreground">{lookupResult.batch}</span></div>
                    <div>Admission: <span className="font-semibold text-foreground">{lookupResult.type}</span></div>
                    <div>College: <span className="font-semibold text-foreground">SREC (09)</span></div>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Invalid format. JNTUA format example: <code className="font-mono">22091A3201</code></span>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
