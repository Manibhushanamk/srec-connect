'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Shield, Mail, AlertCircle, ArrowLeft, LayoutDashboard, Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function AccessDeniedPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role;

  const getDashboardHref = () => {
    if (role === 'STUDENT') return '/dashboard/student';
    if (role === 'FACULTY') return '/dashboard/faculty';
    if (role === 'HOD' || role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'WEB_MANAGER') return '/admin';
    return '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-background text-foreground">
      <div className="relative w-full max-w-md text-center">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="relative w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-foreground">
              SREC Connect
            </span>
          </Link>
        </div>

        <Card className="bg-card border-border shadow-md">
          <CardContent className="p-8 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {session ? 'Restricted Access' : 'Access Denied'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                {session
                  ? `Your account does not have sufficient clearance to view this administrative resource.`
                  : 'You must be signed in with an approved institutional account to access this section.'}
              </p>
            </div>

            {session && (
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Current Account:</span>
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
                      Sign In with SREC Account
                    </Button>
                  </Link>
                  <Link href="/" className="w-full block">
                    <Button variant="outline" size="md" fullWidth leftIcon={<Home className="w-4 h-4" />}>
                      Back to Home
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
