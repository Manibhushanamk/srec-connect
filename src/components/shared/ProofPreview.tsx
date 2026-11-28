'use client';

import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  FileCheck2,
  FileText,
  Loader2,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractDriveFileId, toPrivateDocumentUrl } from '@/lib/admin-auth';

interface ProofPreviewProps {
  url?: string | null;
  title?: string;
  restricted?: boolean;
  restrictedMessage?: string;
  heightClass?: string;
  compact?: boolean;
  className?: string;
}

type PreviewState =
  | { kind: 'empty' }
  | { kind: 'restricted'; message: string }
  | { kind: 'loading' }
  | { kind: 'image'; src: string; externalHref: string }
  | { kind: 'pdf'; src: string; externalHref: string }
  | { kind: 'external'; href: string; label: string }
  | { kind: 'error'; message: string; href: string };

function isExplicitImageExt(raw: string): boolean {
  const clean = raw.split('?')[0].split('#')[0].toLowerCase();
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(clean);
}

function isExplicitPdfExt(raw: string): boolean {
  const clean = raw.split('?')[0].split('#')[0].toLowerCase();
  return /\.pdf$/i.test(clean);
}

/**
 * Normalizes a certificate/proof URL into the app's canonical stream endpoint when Drive-backed,
 * preserving local `/uploads/...` paths and third-party verification links.
 */
export function normalizeProofUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const driveId = extractDriveFileId(trimmed);
  if (driveId) {
    return toPrivateDocumentUrl(trimmed);
  }
  return trimmed;
}

/**
 * Smart proof viewer that probes same-origin authenticated streams/uploads for true MIME type
 * (rendering zoom-to-fit <img> for images, inline PDF <iframe> for PDFs, and clear access/error states)
 * instead of showing raw JSON or X-Frame-Options error frames.
 */
export function ProofPreview({
  url,
  title = 'Certificate Proof',
  restricted = false,
  restrictedMessage = 'Private certificate proof is restricted to the Owner, Peer Faculty, Department HOD, or Super Admin.',
  heightClass = 'h-64',
  compact = false,
  className,
}: ProofPreviewProps) {
  const resolvedUrl = normalizeProofUrl(url);
  const [state, setState] = useState<PreviewState>(() => {
    if (restricted) return { kind: 'restricted', message: restrictedMessage };
    if (!resolvedUrl) return { kind: 'empty' };
    return { kind: 'loading' };
  });

  useEffect(() => {
    if (restricted) {
      setState({ kind: 'restricted', message: restrictedMessage });
      return;
    }
    if (!resolvedUrl) {
      setState({ kind: 'empty' });
      return;
    }

    if (resolvedUrl.startsWith('data:image/')) {
      setState({ kind: 'image', src: resolvedUrl, externalHref: resolvedUrl });
      return;
    }

    const isSameOrigin = resolvedUrl.startsWith('/');
    if (!isSameOrigin) {
      if (isExplicitImageExt(resolvedUrl)) {
        setState({ kind: 'image', src: resolvedUrl, externalHref: resolvedUrl });
      } else if (isExplicitPdfExt(resolvedUrl)) {
        setState({ kind: 'pdf', src: resolvedUrl, externalHref: resolvedUrl });
      } else {
        let host = 'External Verification Link';
        try {
          host = new URL(resolvedUrl).hostname;
        } catch {
          // keep fallback label
        }
        setState({ kind: 'external', href: resolvedUrl, label: host });
      }
      return;
    }

    let revokedUrl: string | null = null;
    const controller = new AbortController();
    setState({ kind: 'loading' });

    fetch(resolvedUrl, { credentials: 'include', signal: controller.signal })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          const err = await res.json().catch(() => null);
          setState({
            kind: 'restricted',
            message: err?.error || restrictedMessage,
          });
          return;
        }

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          setState({
            kind: 'error',
            message: err?.error || `Document preview unavailable (HTTP ${res.status})`,
            href: resolvedUrl,
          });
          return;
        }

        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (ct.includes('application/json')) {
          const data = await res.json().catch(() => null);
          setState({
            kind: 'error',
            message: data?.error || 'Document stream unavailable',
            href: resolvedUrl,
          });
          return;
        }

        const blob = await res.blob();
        const blobMime = (blob.type || ct).toLowerCase();
        const objectUrl = URL.createObjectURL(blob);
        revokedUrl = objectUrl;

        if (blobMime.startsWith('image/') || (!blobMime && isExplicitImageExt(resolvedUrl))) {
          setState({ kind: 'image', src: objectUrl, externalHref: resolvedUrl });
        } else if (blobMime.includes('pdf') || isExplicitPdfExt(resolvedUrl)) {
          setState({ kind: 'pdf', src: objectUrl, externalHref: resolvedUrl });
        } else {
          setState({
            kind: 'external',
            href: resolvedUrl,
            label: `Attached Document (${blobMime || 'file'})`,
          });
        }
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setState({
          kind: 'error',
          message: 'Unable to load proof preview right now.',
          href: resolvedUrl,
        });
      });

    return () => {
      controller.abort();
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [resolvedUrl, restricted, restrictedMessage]);

  if (state.kind === 'empty') {
    return (
      <div className={cn('p-6 text-center text-xs text-muted-foreground rounded-xl border border-border bg-background', className)}>
        No certificate proof attached to this achievement.
      </div>
    );
  }

  if (state.kind === 'restricted') {
    return (
      <div
        className={cn(
          compact
            ? 'p-4 flex flex-col items-center justify-center text-center gap-1.5 bg-gradient-to-br from-slate-900/90 to-slate-950 text-white'
            : 'p-6 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col items-center justify-center text-center gap-2',
          heightClass,
          className
        )}
      >
        <Lock className="w-6 h-6 text-amber-400" />
        <p className="text-xs font-bold">Verified Academic Proof Protected</p>
        <p className={cn('text-[11px] max-w-md', compact ? 'text-slate-300 line-clamp-2' : 'text-muted-foreground')}>
          {state.message}
        </p>
      </div>
    );
  }

  if (state.kind === 'loading') {
    return (
      <div className={cn(compact ? 'flex flex-col items-center justify-center gap-2 bg-secondary/40' : 'rounded-xl border border-border bg-secondary/40 flex flex-col items-center justify-center gap-2', heightClass, className)}>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Loading proof preview...</span>
      </div>
    );
  }

  if (state.kind === 'image') {
    return compact ? (
      <div className={cn('w-full overflow-hidden bg-slate-950/30 flex items-center justify-center', heightClass, className)}>
        <img
          src={state.src}
          alt={`Proof for ${title}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    ) : (
      <div className={cn('p-2 rounded-xl bg-slate-950/85 border border-border flex items-center justify-center overflow-hidden', className)}>
        <img
          src={state.src}
          alt={`Proof for ${title}`}
          className={cn('w-auto max-w-full object-contain rounded-lg', heightClass)}
        />
      </div>
    );
  }

  if (state.kind === 'pdf') {
    return compact ? (
      <div className={cn('relative w-full overflow-hidden bg-white', heightClass, className)}>
        <iframe
          title={`PDF Proof for ${title}`}
          src={`${state.src}#toolbar=0&navpanes=0&scrollbar=0`}
          className="w-full h-full border-none pointer-events-none"
        />
      </div>
    ) : (
      <div className={cn('p-2 rounded-xl bg-slate-950/85 border border-border overflow-hidden', className)}>
        <iframe
          title={`PDF Proof for ${title}`}
          src={state.src}
          className={cn('w-full rounded-lg border border-border bg-white', heightClass)}
        />
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div
        className={cn(
          compact
            ? 'p-4 flex flex-col items-center justify-center text-center gap-1.5 bg-gradient-to-br from-slate-900 to-slate-950 text-white'
            : 'p-5 rounded-xl border border-rose-500/30 bg-rose-500/10 flex flex-col items-center justify-center text-center gap-2',
          compact ? heightClass : '',
          className
        )}
      >
        <FileText className={cn('w-6 h-6', compact ? 'text-[#F97316]' : 'text-rose-400')} />
        <p className={cn('text-xs font-semibold', compact ? 'text-white' : 'text-foreground')}>
          {compact ? 'Certificate Proof Attached' : state.message}
        </p>
        {!compact && (
          <a
            href={state.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold text-primary hover:bg-secondary transition-colors"
          >
            <span>Open Original Stream</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    );
  }

  return compact ? (
    <div
      className={cn(
        'p-4 flex flex-col items-center justify-center text-center gap-1.5 bg-gradient-to-br from-slate-900 to-slate-950 text-white',
        heightClass,
        className
      )}
    >
      <FileCheck2 className="w-6 h-6 text-emerald-400" />
      <p className="text-xs font-bold">Verified Proof Document Linked</p>
      <p className="text-[11px] text-slate-300 truncate max-w-[240px]">{state.label}</p>
    </div>
  ) : (
    <div className={cn('p-5 rounded-xl border border-border bg-secondary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3', className)}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>External Proof / Document Reference</span>
          </p>
          <p className="text-[11px] text-muted-foreground truncate">{state.label}</p>
        </div>
      </div>
      <a
        href={state.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
      >
        <span>Open Document</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
