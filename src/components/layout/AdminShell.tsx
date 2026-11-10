'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight, LayoutDashboard } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AppHeader } from './AppHeader';

interface AdminShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
}

export function AdminShell({ children, title, description, breadcrumbs, actions }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-space-900 overflow-x-hidden w-full flex flex-col">
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
                      <Link href="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Admin
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
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminShell;
