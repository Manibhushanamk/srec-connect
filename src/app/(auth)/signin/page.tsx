'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  AlertCircle,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Building2,
  Users,
  Compass,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getRoleLandingUrl } from '@/lib/rbac';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';
  const errorParam = searchParams.get('error');
  const reasonParam = searchParams.get('reason');

  const { data: session } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set friendly error message based on URL query params
  useEffect(() => {
    if (reasonParam === 'database_unavailable') {
      setErrorMessage('Database is currently reconnecting. Please retry in a few moments.');
    } else if (reasonParam === 'domain_not_allowed') {
      setErrorMessage('Google sign-in is reserved for official @srecnandyal.edu.in accounts or authorized department administrators.');
    } else if (reasonParam === 'not_provisioned') {
      setErrorMessage('Your institutional email is recognized, but your profile has not been provisioned by your department HOD yet.');
    } else if (reasonParam === 'account_suspended') {
      setErrorMessage('This account is suspended. Please contact the administrative office.');
    } else if (reasonParam === 'missing_email') {
      setErrorMessage('Google account did not provide a valid email.');
    } else if (errorParam) {
      setErrorMessage('Authentication rejected or session timed out. Please sign in again.');
    }
  }, [errorParam, reasonParam]);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (session?.user) {
      const role = (session.user as any).role;
      const email = session.user.email || '';
      const target = callbackUrl && callbackUrl !== '/' && callbackUrl !== '/signin'
        ? callbackUrl
        : getRoleLandingUrl(role, email);
      router.replace(target);
    }
  }, [session, callbackUrl, router]);

  // Google OAuth Primary Authentication
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signIn('google', { callbackUrl: callbackUrl || '/auth/landing' });
    } catch (err: any) {
      console.error('[SignIn] Google OAuth Error:', err);
      setErrorMessage('Could not initiate Google OAuth flow. Please check your network connection.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-background">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <img
                src="/images/srec-logo.png"
                alt="SREC Logo"
                width={48}
                height={48}
                fetchPriority="high"
                className="w-12 h-12 object-contain drop-shadow-md"
              />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black tracking-tight text-foreground flex items-center gap-1.5">
                SREC <span className="text-primary font-bold">Connect</span>
              </span>
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Santhiram Engineering College
              </p>
            </div>
          </Link>

          <h1 className="text-xl font-extrabold text-foreground pt-2">
            Campus Single Sign-On
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Authorized institutional gateway for Students, Faculty, Department HODs, and Administrative Staff.
          </p>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive animate-slide-up">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">Authentication Notice</p>
              <p className="opacity-90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Main Sign-In Card */}
        <Card variant="glass" className="border-border/70 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Google Workspace SSO Primary Action */}
            <div className="space-y-4">
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="relative py-4 px-4 text-xs sm:text-sm font-bold rounded-xl border border-border/80 hover:bg-secondary hover:border-primary/50 transition-all duration-200 flex items-center justify-center gap-3 shadow-md bg-card"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                <span>Sign In with Google Workspace</span>
                {isLoading && (
                  <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin ml-2" />
                )}
              </Button>

              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 text-xs space-y-1.5 text-muted-foreground">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Approved Google Accounts</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Sign in using your institutional email (<code className="font-mono text-primary font-bold">@srecnandyal.edu.in</code>) or pre-authorized personal Google account registered by your department.
                </p>
              </div>
            </div>

            {/* Role & Automatic Dashboard Routing Explainer */}
            <div className="pt-4 border-t border-border/80 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                Automatic Institutional Role Routing
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/70 hover:bg-secondary/70 transition-colors">
                  <span className="flex items-center gap-2 font-bold text-foreground">
                    <GraduationCap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Student Scholars
                  </span>
                  <span className="text-muted-foreground font-medium text-[11px] bg-background/60 px-2 py-0.5 rounded-md border border-border/40">
                    Community Feed & Portfolios
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/70 hover:bg-secondary/70 transition-colors">
                  <span className="flex items-center gap-2 font-bold text-foreground">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Faculty Mentors
                  </span>
                  <span className="text-muted-foreground font-medium text-[11px] bg-background/60 px-2 py-0.5 rounded-md border border-border/40">
                    Verification Desk & Reports
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/70 hover:bg-secondary/70 transition-colors">
                  <span className="flex items-center gap-2 font-bold text-foreground">
                    <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    HOD & Web Managers
                  </span>
                  <span className="text-muted-foreground font-medium text-[11px] bg-background/60 px-2 py-0.5 rounded-md border border-border/40">
                    Department Ops & Ingestion
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/70 hover:bg-secondary/70 transition-colors">
                  <span className="flex items-center gap-2 font-bold text-foreground">
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Super Administrator
                  </span>
                  <span className="text-muted-foreground font-medium text-[11px] bg-background/60 px-2 py-0.5 rounded-md border border-border/40">
                    Sovereign Command Center
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Institutional Footer */}
        <div className="text-center text-xs text-muted-foreground font-medium space-y-1">
          <p>Santhiram Engineering College (Autonomous), Nandyal</p>
          <p>Department of CSE (AI & ML) • Academic Year 2026–2027</p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
