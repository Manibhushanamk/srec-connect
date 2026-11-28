'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Download, FileSpreadsheet, FileText, Printer, Code, Loader2 } from 'lucide-react';
import { canExportCategory } from '@/lib/admin-auth';
import { cn } from '@/lib/utils';

type ExportDomain = 'ACHIEVEMENTS' | 'EVENTS';
type ExportFormat = 'xlsx' | 'csv' | 'html' | 'json';

interface FilteredExportActionsProps {
  domain: ExportDomain;
  filters?: Record<string, string | null | undefined>;
  actorRole?: string | null;
  recordCount?: number;
  timelineLabel?: string;
  showFullFormats?: boolean;
  label?: string;
  className?: string;
}

/**
 * Reusable client export control bar for downloading listed Achievement or Event records
 * in Excel (.xlsx), CSV (UTF-8 BOM), Printable PDF/HTML, or JSON directly via /api/admin/export.
 * Visible automatically to WEB_MANAGER and above (plus FACULTY where allowed).
 */
export function FilteredExportActions({
  domain,
  filters = {},
  actorRole: propRole,
  recordCount,
  timelineLabel,
  showFullFormats = false,
  label,
  className,
}: FilteredExportActionsProps) {
  const { data: session } = useSession();
  const resolvedRole = propRole || ((session?.user as any)?.role as string | undefined);
  const [busyFormat, setBusyFormat] = useState<ExportFormat | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ category: domain });
    Object.entries(filters).forEach(([key, rawVal]) => {
      if (!rawVal) return;
      const trimmed = String(rawVal).trim();
      if (!trimmed || trimmed === 'ALL' || trimmed === 'all') return;
      params.set(key, trimmed);
    });
    return params.toString();
  }, [domain, filters]);

  if (!canExportCategory(resolvedRole, domain)) {
    return null;
  }

  const handleExport = async (fmt: ExportFormat) => {
    setBusyFormat(fmt);
    setStatusMessage(null);
    try {
      const params = new URLSearchParams(queryString);
      params.set('format', fmt);
      const res = await fetch(`/api/admin/export?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Export failed (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      let filename = `SREC_${domain}_${new Date().toISOString().split('T')[0]}.${fmt}`;
      if (disposition) {
        const m = disposition.match(/filename="?([^"]+)"?/);
        if (m?.[1]) filename = m[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMessage({ type: 'ok', text: `Downloaded ${filename}` });
    } catch (err: any) {
      setStatusMessage({ type: 'err', text: err?.message || 'Failed to download filtered export.' });
    } finally {
      setBusyFormat(null);
    }
  };

  const defaultLabel = domain === 'EVENTS' ? 'Export Listed Events:' : 'Export Listed Achievements:';

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Download className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="font-semibold text-foreground">{label || defaultLabel}</span>
          {(typeof recordCount === 'number' || timelineLabel) && (
            <span className="hidden sm:inline">
              (
              {typeof recordCount === 'number' ? `${recordCount} listed` : ''}
              {typeof recordCount === 'number' && timelineLabel ? ' • ' : ''}
              {timelineLabel || ''}
              )
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={Boolean(busyFormat)}
            onClick={() => void handleExport('xlsx')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {busyFormat === 'xlsx' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            <span>{busyFormat === 'xlsx' ? 'Exporting...' : 'Excel (.xlsx)'}</span>
          </button>

          <button
            type="button"
            disabled={Boolean(busyFormat)}
            onClick={() => void handleExport('csv')}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/35 text-cyan-600 dark:text-cyan-400 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {busyFormat === 'csv' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{busyFormat === 'csv' ? 'Exporting...' : 'CSV (.csv)'}</span>
          </button>

          {showFullFormats && (
            <>
              <button
                type="button"
                disabled={Boolean(busyFormat)}
                onClick={() => void handleExport('html')}
                className="px-2.5 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/35 text-purple-600 dark:text-purple-400 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{busyFormat === 'html' ? 'Preparing...' : 'PDF / Print'}</span>
              </button>

              <button
                type="button"
                disabled={Boolean(busyFormat)}
                onClick={() => void handleExport('json')}
                className="px-2.5 py-1.5 rounded-lg bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/35 text-amber-600 dark:text-amber-400 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{busyFormat === 'json' ? 'Exporting...' : 'JSON'}</span>
              </button>
            </>
          )}

          <Link
            href={`/admin/export?${queryString}`}
            className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground inline-flex items-center gap-1"
          >
            <span>Export Studio &rarr;</span>
          </Link>
        </div>
      </div>

      {statusMessage && (
        <p
          role={statusMessage.type === 'err' ? 'alert' : 'status'}
          className={cn(
            'text-[11px] font-medium',
            statusMessage.type === 'ok' ? 'text-emerald-500' : 'text-rose-500'
          )}
        >
          {statusMessage.text}
        </p>
      )}
    </div>
  );
}
