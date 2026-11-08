'use client';

import { useState } from 'react';
import { ReactNode } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-space-900 overflow-x-hidden w-full flex flex-col">
      {/* 1. Sticky Top Navigation */}
      <AppHeader />

      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div className="transition-all duration-300 min-h-screen lg:pl-72 w-full">
        {/* Mobile top bar */}
        <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-space-950/95 backdrop-blur-2xl border-b border-slate-800/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-space-800/50 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-slate-100 truncate">{title || 'Admin Panel'}</h1>
            <div className="w-8" />
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-space-950/80 backdrop-blur-sm"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-space-900 border-r border-slate-800/50 shadow-2xl flex flex-col">
              <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100">Admin Navigation</span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AdminSidebar className="relative top-0 w-full h-full border-r-0" />
              </div>
            </div>
          </div>
        )}

        <main className="pt-24 lg:pt-8 pb-16 min-h-screen w-full">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
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
