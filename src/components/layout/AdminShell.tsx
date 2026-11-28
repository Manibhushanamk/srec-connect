'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronRight, LayoutDashboard, GraduationCap, BookOpen, ShieldAlert } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AppHeader } from './AppHeader';
import { isWebManagerRestrictedRoute } from '@/lib/admin-auth';

interface AdminShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
  roleScope?: 'ADMIN' | 'STUDENT' | 'FACULTY';
}

export function AdminShell({ children, title, description, breadcrumbs, actions, roleScope }: AdminShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as string | undefined;
  const isBlockedForWebManager =
    userRole === 'WEB_MANAGER' && isWebManagerRestrictedRoute(pathname);
  const isStudentScope = roleScope === 'STUDENT' || pathname?.startsWith('/dashboard/student');
  const isFacultyScope = roleScope === 'FACULTY' || pathname?.startsWith('/dashboard/faculty');

  const rootBreadcrumb = isStudentScope
    ? { label: 'Student', href: '/dashboard/student', icon: GraduationCap }
    : isFacultyScope
    ? { label: 'Faculty', href: '/dashboard/faculty', icon: BookOpen }
    : { label: 'Admin', href: '/admin', icon: LayoutDashboard };

  const RootIcon = rootBreadcrumb.icon;

  return (
    <div className="relative z-10 min-h-screen bg-transparent text-foreground overflow-x-hidden w-full flex flex-col">
      {/* 1. Sticky Top Navigation with Universal Mobile Drawer */}
      <AppHeader />

      {/* 2. Desktop Fixed Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div className="transition-all duration-300 min-h-screen lg:pl-72 w-full">
        <main className="pt-6 lg:pt-8 pb-16 min-h-screen w-full">
          <div className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            {(title || breadcrumbs || actions) && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5" aria-label="Breadcrumb">
                      <Link href={rootBreadcrumb.href} className="hover:text-primary transition-colors flex items-center gap-1 font-medium text-slate-300">
                        <RootIcon className="w-3.5 h-3.5 text-primary" />
                        {rootBreadcrumb.label}
                      </Link>
                      {breadcrumbs.map((crumb) => (
                        <span key={crumb.label} className="flex items-center gap-1">
                          <ChevronRight className="w-3 h-3 text-slate-600" aria-hidden="true" />
                          {crumb.href ? (
                            <Link href={crumb.href} className="hover:text-primary transition-colors">
                              {crumb.label}
                            </Link>
                          ) : (
                            <span className="text-slate-300 font-medium">{crumb.label}</span>
                          )}
                        </span>
                      ))}
                    </nav>
                  )}
                  {title && (
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="mt-1 text-slate-400 text-xs sm:text-sm">{description}</p>
                  )}
                </div>
                {actions && <div className="shrink-0">{actions}</div>}
              </div>
            )}

            <div className="w-full overflow-x-hidden">
              {isBlockedForWebManager ? (
                <div
                  role="alert"
                  className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-card border border-rose-500/30 text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    403 — Access Restricted for Web Manager
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Department Web Managers are strictly isolated from User Management, Disciplinary Grievances, Audit Logs, and System Backup controls.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <Link
                      href="/admin"
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition"
                    >
                      Return to Web Manager Console
                    </Link>
                    <Link
                      href="/admin/achievements"
                      className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-secondary/60 transition"
                    >
                      Open Verification Desk
                    </Link>
                  </div>
                </div>
              ) : (
                children
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminShell;
