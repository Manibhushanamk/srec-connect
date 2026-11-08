'use client';

import { useState } from 'react';
import { ReactNode } from 'react';
import { Menu, X, ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminSidebar } from './AdminSidebar';

interface AdminShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
}

export function AdminShell({ children, title, description, breadcrumbs, actions }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-space-900">
      <AdminSidebar />

      <div
        className={cn(
          'transition-all duration-300 min-h-screen',
          isSidebarOpen ? 'lg:pl-72' : 'lg:pl-20'
        )}
      >
        <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-space-950/95 backdrop-blur-2xl border-b border-slate-800/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-space-800/50 transition-all duration-200"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-slate-100 truncate">{title || 'Admin Panel'}</h1>
            <div className="w-10" />
          </div>
        </div>

        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-space-950/80 backdrop-blur-sm"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute left-0 top-16 bottom-16 w-72 bg-space-900/95 backdrop-blur-2xl border-r border-slate-800/50 animate-slide-in">
              <AdminSidebar />
            </div>
          </div>
        )}

        <main
          className={cn(
            'pt-16 lg:pt-0 min-h-screen transition-all duration-300',
            isSidebarOpen ? 'lg:pl-72' : 'lg:pl-20'
          )}
        >
          <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
            {(title || breadcrumbs) && (
              <div className="mb-8 animate-fade-in">
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <nav className="flex items-center gap-2 text-sm text-slate-500 mb-3" aria-label="Breadcrumb">
                    <Link href="/admin" className="hover:text-brand-400 transition-colors flex items-center gap-1">
                      <LayoutDashboard className="w-4 h-4" />
                      Admin
                    </Link>
                    {breadcrumbs.map((crumb, index) => (
                      <span key={crumb.label} className="flex items-center gap-1">
                        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                        {crumb.href ? (
                          <Link href={crumb.href} className="hover:text-brand-400 transition-colors">
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
                  <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-brand-400 to-cyan-400">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="mt-2 text-slate-400 text-sm max-w-2xl">{description}</p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>{children}</div>
              {actions && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </main>

        <button
          className={cn(
            'fixed bottom-6 right-6 z-40 lg:hidden p-3 rounded-2xl bg-brand-500 text-white shadow-glass-glow transition-all duration-200',
            isMobileSidebarOpen && 'rotate-180'
          )}
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          aria-label={isMobileSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

import Link from 'next/link';