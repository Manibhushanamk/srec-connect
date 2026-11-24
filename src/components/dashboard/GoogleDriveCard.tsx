'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { HardDrive, FolderCheck, ExternalLink, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface GoogleDriveCardProps {
  className?: string;
  compact?: boolean;
}

export const GoogleDriveCard: React.FC<GoogleDriveCardProps> = ({ className = '', compact = false }) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [driveData, setDriveData] = useState<{
    isConnected?: boolean;
    folderId?: string;
    folderName?: string;
    folderViewLink?: string;
    requiresReauth?: boolean;
    requiresApiEnablement?: boolean;
    enableUrl?: string;
    message?: string;
  } | null>(null);

  const checkStatus = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/drive/init');
      const data = await res.json();
      setDriveData(data);
    } catch (err) {
      console.warn('[Drive Card] Check status error:', err);
      setDriveData({
        isConnected: false,
        requiresReauth: true,
        message: 'Unable to check Google Drive status.',
      });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await signIn('google', {
        callbackUrl: window.location.href,
      });
    } catch (err) {
      console.error('[Drive Connect Error]:', err);
      setConnecting(false);
    }
  };

  if (!session?.user) return null;

  const isConnected = !!driveData?.isConnected;
  const requiresApiEnablement = !!driveData?.requiresApiEnablement;

  if (compact) {
    return (
      <div className={`p-3.5 rounded-2xl border transition-all ${
        isConnected
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
          : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
      } ${className}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {isConnected ? 'Google Drive Connected' : 'Google Drive Required'}
              </p>
              <p className="text-[11px] opacity-80 truncate">
                {isConnected ? 'Folder: SREC CONNECT' : 'Required for photo posts'}
              </p>
            </div>
          </div>

          {isConnected ? (
            driveData?.folderViewLink ? (
              <a
                href={driveData.folderViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
              >
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : null
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 flex items-center gap-1 transition-all shadow-sm disabled:opacity-50"
            >
              {connecting ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <span>Connect</span>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-5 shadow-subtle transition-all duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
            isConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : requiresApiEnablement
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Google Drive Cloud Storage</span>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </span>
              ) : requiresApiEnablement ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  API Setup
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Action Required
                </span>
              )}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Personal institutional folder for posts, media &amp; certificate proofs
            </p>
          </div>
        </div>

        <button
          onClick={checkStatus}
          disabled={loading}
          title="Refresh Drive Connection Status"
          className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Body Content */}
      {loading ? (
        <div className="py-4 text-center">
          <RefreshCw className="w-5 h-5 text-primary animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Checking Google Drive sync status...</p>
        </div>
      ) : isConnected ? (
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FolderCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-foreground block truncate">
                  {driveData?.folderName || 'SREC CONNECT'}
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Root / My Drive / SREC CONNECT
                </span>
              </div>
            </div>
            {driveData?.folderViewLink && (
              <a
                href={driveData.folderViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span>Open Folder</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Your Google Drive is verified. Community posts with photos, research publications, and certificates upload directly to your dedicated folder.
            </span>
          </div>
        </div>
      ) : requiresApiEnablement ? (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Google Cloud API Activation Needed</p>
              <p className="text-[11px] text-purple-300/90 mt-0.5">
                Google Drive API is pending one-click activation in Google Cloud project <code className="px-1 py-0.5 bg-purple-950/40 rounded text-[10px]">127891787958</code>.
              </p>
            </div>
          </div>
          {driveData?.enableUrl && (
            <a
              href={driveData.enableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <span>Enable Google Drive API in Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">Drive Permission Required for Media</p>
              <p className="text-[11px] text-amber-300/90 mt-1 leading-relaxed">
                To upload campus photos, publish posts with media, and submit achievement certificates, authorize SREC Connect to create an isolated <span className="font-semibold text-foreground">SREC CONNECT</span> folder in your Google Drive.
              </p>
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting to Google Drive...</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4" />
                  <span>Connect Google Drive</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground justify-center">
            <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
            <span>Sandboxed: SREC Connect cannot view or access other Drive files.</span>
          </div>
        </div>
      )}
    </div>
  );
};
