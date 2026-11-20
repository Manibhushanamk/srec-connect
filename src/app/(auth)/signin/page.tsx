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
  ChevronDown,
  ChevronUp,
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
  const isDevMode = searchParams.get('dev') === 'true' || searchParams.get('dev') === '1';

  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam ? 'Authentication rejected. Please sign in with your approved institutional Google account.' : null
  );

  // Hidden Dev/Test Fallback state (Only shown if ?dev=true)
  const [devIdentifier, setDevIdentifier] = useState('');
  const [showDevFallback, setShowDevFallback] = useState(isDevMode);

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
      setErrorMessage('Could not initiate Google OAuth flow. Please check network connection.');
      setIsLoading(false);
    }
  };

  // Dev / Automation Credentials Handler (only available via ?dev=true)
  const handleDevSignIn = async (emailOrRoll: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await signIn('credentials', {
        email: emailOrRoll.trim(),
        password: 'admin',
        redirect: false,
        callbackUrl: callbackUrl || '/auth/landing',
      });

      if (res?.error) {
        setErrorMessage('Account not found or access denied in credentials store.');
        setIsLoading(false);
      } else if (res?.ok) {
        window.location.href = callbackUrl || '/auth/landing';
      }
    } catch (err) {
      setErrorMessage('Error during dev authentication.');
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
            Authorized institutional gateway for CSE (AI & ML) students, faculty, and administrative staff.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive animate-slide-up">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">Authentication Notice</p>
              <p className="opacity-90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Main Clean Sign-In Card */}
        <Card variant="glass" className="border-border/70 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Primary Action: Single Google Sign-In Button */}
            <div className="space-y-3">
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="relative py-4 px-4 text-xs sm:text-sm font-bold rounded-xl border border-border/80 hover:bg-secondary transition-all duration-200 flex items-center justify-center gap-3 shadow-md bg-card"
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
                <span>Continue with Google Workspace</span>
                {isLoading && (
                  <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin ml-2" />
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                College email domain: <code className="font-mono text-primary font-bold bg-muted/60 px-1.5 py-0.5 rounded border border-border/40">@srecnandyal.edu.in</code>
              </p>
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
                  <span className="text-muted-foreground font-medium text-[11px] bg-background/60 px-2 py-0.5 rounded-md border border-border/40">Community Feed & Portfolios</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/70 hover:bg-secondary/70 transition-colors">
                  <span className="flex items-center gap-2 font-bold text-foreground">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Faculty Mentors
                  </span>
                  <span className="text-muted-foreground font-medium text-[11px] bg-background/60 px-2 py-0.5 rounded-md border border-border/40">Verification Desk & Reports</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/70 hover:bg-secondary/70 transition-colors">
                  <span className="flex items-center gap-2 font-bold text-foreground">
                    <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    HOD & Web Managers
                  </span>
                  <span className="text-muted-foreground font-medium text-[11px] bg-background/60 px-2 py-0.5 rounded-md border border-border/40">Department Ops & Ingestion</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/70 hover:bg-secondary/70 transition-colors">
                  <span className="flex items-center gap-2 font-bold text-foreground">
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Super Administrator
                  </span>
                  <span className="text-muted-foreground font-medium text-[11px] bg-background/60 px-2 py-0.5 rounded-md border border-border/40">Sovereign Command Center</span>
                </div>
              </div>
            </div>

            {/* Developer Testing Fallback (Only available if explicitly queried via ?dev=true) */}
            {isDevMode && (
              <div className="pt-3 border-t border-dashed border-border/80">
                <button
                  type="button"
                  onClick={() => setShowDevFallback(!showDevFallback)}
                  className="w-full flex items-center justify-between text-[11px] font-bold text-amber-500 py-1"
                >
                  <span>🛠️ Local Testing Personas (?dev=true)</span>
                  {showDevFallback ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showDevFallback && (
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleDevSignIn('manibhushanam4k@gmail.com')}
                      className="p-2 rounded-lg border border-border hover:border-primary text-left bg-secondary/40"
                    >
                      <p className="font-bold text-[11px] text-foreground">Super Admin</p>
                      <p className="text-[10px] text-muted-foreground truncate">Mani Bhushanam</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDevSignIn('manibhushanam5k@gmail.com')}
                      className="p-2 rounded-lg border border-border hover:border-primary text-left bg-secondary/40"
                    >
                      <p className="font-bold text-[11px] text-foreground">HOD (AIML)</p>
                      <p className="text-[10px] text-muted-foreground truncate">Mani Bhushanam K</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDevSignIn('viswanadhum9985559753@gmail.com')}
                      className="p-2 rounded-lg border border-border hover:border-primary text-left bg-secondary/40"
                    >
                      <p className="font-bold text-[11px] text-foreground">Student (22439EC024)</p>
                      <p className="text-[10px] text-muted-foreground truncate">M. Viswanadham</p>
                    </button>
                  </div>
                )}
              </div>
            )}
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
