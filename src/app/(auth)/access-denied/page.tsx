'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Shield, AlertCircle, RefreshCw, LayoutDashboard, Home, LogIn, UserX, Database, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const rawReason = searchParams.get('reason') || '';
  const rawError = searchParams.get('error') || '';
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role;

  const getDashboardHref = () => {
    if (role === 'STUDENT') return '/dashboard/student';
    if (role === 'FACULTY') return '/dashboard/faculty';
    if (role === 'HOD' || role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'WEB_MANAGER') return '/admin';
    return '/';
  };

  // Determine error details
  let title = session ? 'Restricted Access' : 'Access Denied';
  let description = session
    ? 'Your account does not have sufficient clearance to view this administrative resource.'
    : 'You must be signed in with an approved institutional account to access this section.';
  let icon = <AlertCircle className="w-7 h-7 text-rose-500" />;
  let iconBg = 'bg-rose-500/10 border-rose-500/20';

  if (rawReason === 'domain_not_allowed') {
    title = 'Institutional Email Required';
    description = 'Google sign-in is restricted to official Santhiram Engineering College accounts (@srecnandyal.edu.in) and pre-authorized administrators. Alternatively, you can sign in directly using your Student Roll Number.';
    icon = <UserX className="w-7 h-7 text-amber-500" />;
    iconBg = 'bg-amber-500/10 border-amber-500/20';
  } else if (rawReason === 'not_provisioned') {
    title = 'Account Not Provisioned';
    description = 'Your email domain is recognized, but your student or faculty record has not yet been registered in the SREC Connect directory. Please ask your department HOD or Web Manager to provision your profile.';
    icon = <HelpCircle className="w-7 h-7 text-blue-500" />;
    iconBg = 'bg-blue-500/10 border-blue-500/20';
  } else if (rawReason === 'account_suspended') {
    title = 'Account Suspended';
    description = 'This campus account is currently suspended. Please contact your department head or the principal’s office to resolve access restrictions.';
    icon = <AlertCircle className="w-7 h-7 text-rose-500" />;
    iconBg = 'bg-rose-500/10 border-rose-500/20';
  } else if (rawReason === 'database_unavailable') {
    title = 'Database Synchronizing';
    description = 'The campus database is currently reconnecting or completing background synchronization. Please wait a few moments and click retry.';
    icon = <Database className="w-7 h-7 text-amber-500" />;
    iconBg = 'bg-amber-500/10 border-amber-500/20';
  } else if (rawReason === 'missing_email') {
    title = 'Account Email Missing';
    description = 'Google OAuth did not return a verified email address for this session. Please verify your Google account permissions.';
    icon = <AlertCircle className="w-7 h-7 text-rose-500" />;
    iconBg = 'bg-rose-500/10 border-rose-500/20';
  } else if (rawReason === 'auth_error' || rawError) {
    title = 'Authentication Notice';
    description = 'A temporary authentication issue was detected. Please return to the sign-in portal and try again.';
    icon = <RefreshCw className="w-7 h-7 text-amber-500" />;
    iconBg = 'bg-amber-500/10 border-amber-500/20';
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-background text-foreground">
      <div className="relative w-full max-w-md text-center">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="relative w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-foreground">
              SREC Connect
            </span>
          </Link>
        </div>

        <Card className="bg-card border-border shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto ${iconBg}`}>
              {icon}
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>

            {session && (
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Current Session:</span>
                  <Badge variant="brand" size="sm">{role || 'CAMPUS MEMBER'}</Badge>
                </div>
                <p className="text-xs font-mono font-medium text-foreground truncate">{session.user?.email}</p>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              {session ? (
                <>
                  <Link href={getDashboardHref()} className="w-full block">
                    <Button variant="primary" size="md" fullWidth leftIcon={<LayoutDashboard className="w-4 h-4" />}>
                      Go to Your Dashboard
                    </Button>
                  </Link>
                  <Link href="/" className="w-full block">
                    <Button variant="outline" size="md" fullWidth leftIcon={<Home className="w-4 h-4" />}>
                      Back to Campus Feed
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signin" className="w-full block">
                    <Button variant="primary" size="md" fullWidth leftIcon={<LogIn className="w-4 h-4" />}>
                      Return to Sign In
                    </Button>
                  </Link>
                  <Link href="/" className="w-full block">
                    <Button variant="outline" size="md" fullWidth leftIcon={<Home className="w-4 h-4" />}>
                      Back to Campus Feed
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
