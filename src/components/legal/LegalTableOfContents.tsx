'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ListFilter, ChevronDown, Printer, Shield, FileText, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface TocSection {
  id: string;
  title: string;
  number: string;
}

interface LegalTableOfContentsProps {
  sections: TocSection[];
  currentPage: 'privacy' | 'terms';
}

export function LegalTableOfContents({ sections, currentPage }: LegalTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || '');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0% -65% 0%',
        threshold: 0,
      }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Mobile Collapsible Sticky Jump Bar */}
      <div className="lg:hidden sticky top-16 z-30 mb-6 bg-card/95 backdrop-blur-md border border-border rounded-2xl p-3 shadow-md">
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="w-full flex items-center justify-between text-xs font-semibold text-foreground px-2 py-1"
          aria-expanded={isOpenMobile}
        >
          <span className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-primary" />
            <span>Table of Contents ({sections.length} Sections)</span>
          </span>
          <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', isOpenMobile && 'rotate-180')} />
        </button>

        {isOpenMobile && (
          <div className="mt-3 pt-3 border-t border-border/60 max-h-64 overflow-y-auto space-y-1">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setIsOpenMobile(false)}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                  activeId === section.id
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <span className="font-mono text-[10px] text-muted-foreground/80 w-5">{section.number}.</span>
                <span className="truncate">{section.title}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-20 space-y-6">
          {/* Quick Document Switcher */}
          <div className="bg-card/85 backdrop-blur-md border border-border/80 rounded-2xl p-4 shadow-subtle space-y-3">
            <h4 className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
              Institutional Governance
            </h4>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted rounded-xl text-xs">
              <Link
                href="/privacy"
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all text-center',
                  currentPage === 'privacy'
                    ? 'bg-card text-primary shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                Privacy
              </Link>
              <Link
                href="/terms"
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all text-center',
                  currentPage === 'terms'
                    ? 'bg-card text-primary shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                Terms
              </Link>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="bg-card/85 backdrop-blur-md border border-border/80 rounded-2xl p-5 shadow-subtle space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <ListFilter className="w-3.5 h-3.5 text-primary" />
                Contents Navigation
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                {sections.length} parts
              </span>
            </div>

            <nav className="max-h-[calc(100vh-320px)] overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
              {sections.map((section) => {
                const isActive = activeId === section.id;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={cn(
                      'group flex items-start gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all duration-150',
                      isActive
                        ? 'bg-primary/10 text-primary font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    )}
                  >
                    <span
                      className={cn(
                        'font-mono text-[10px] mt-0.5 w-5 flex-shrink-0 transition-colors',
                        isActive ? 'text-primary font-bold' : 'text-muted-foreground/70'
                      )}
                    >
                      {section.number}.
                    </span>
                    <span className="leading-tight group-hover:translate-x-0.5 transition-transform">
                      {section.title}
                    </span>
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Actions: Print & Share */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex-1 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              title="Copy page link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowRight className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Share'}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
