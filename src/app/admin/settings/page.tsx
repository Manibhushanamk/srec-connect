'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import {
  Settings,
  HardDrive,
  Database,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FolderSync,
  ExternalLink,
  Loader2,
  Trash2,
  Lock,
  Download,
  Upload,
  Globe,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminSettingsPage() {
  const { data: session } = useSession();

  // Tab state
  const [activeTab, setActiveTab] = useState<'drive' | 'backup' | 'domains' | 'system'>('backup');

  // Drive state
  const [driveStatus, setDriveStatus] = useState<any>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveMessage, setDriveMessage] = useState<string | null>(null);

  // Backup state
  const [backupSchedule, setBackupSchedule] = useState<any>(null);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [isTriggeringBackup, setIsTriggeringBackup] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  // Restore Modal State
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<any>(null);
  const [dryRunData, setDryRunData] = useState<any>(null);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [reauthEmailInput, setReauthEmailInput] = useState('');
  const [restoreChallengeToken, setRestoreChallengeToken] = useState<string | null>(null);
  const [isLiveRestoring, setIsLiveRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  // Fetch Drive & Backup Status
  const fetchData = async () => {
    setBackupLoading(true);
    setDriveLoading(true);
    try {
      const [driveRes, backupRes] = await Promise.all([
        fetch('/api/admin/drive'),
        fetch('/api/admin/backup'),
      ]);

      const driveData = await driveRes.json();
      if (driveData.success) {
        setDriveStatus(driveData.status);
        setDriveFiles(driveData.backupFiles || []);
      }

      const backupData = await backupRes.json();
      if (backupData.success) {
        setBackupSchedule(backupData.schedule);
        setBackupHistory(backupData.history || []);
      }
    } catch (err) {
      console.error('[Admin Settings Fetch Error]', err);
    } finally {
      setBackupLoading(false);
      setDriveLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Trigger Manual Backup
  const handleTriggerBackup = async () => {
    setIsTriggeringBackup(true);
    setBackupMessage(null);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger' }),
      });
      const data = await res.json();
      if (data.success) {
        setBackupMessage('✅ Database backup successfully created and uploaded to Super Admin Google Drive.');
        fetchData();
      } else {
        setBackupMessage(`❌ Backup failed: ${data.error}`);
      }
    } catch (err: any) {
      setBackupMessage(`❌ Backup error: ${err.message}`);
    } finally {
      setIsTriggeringBackup(false);
    }
  };

  // Verify Backup Integrity
  const handleVerifyBackup = async (backupId: string) => {
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', backupId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Verification Passed! Verified SHA-256 Checksum across ${data.totalRecords} records.`);
        fetchData();
      } else {
        alert(`Verification Failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Verification error: ${err.message}`);
    }
  };

  // Dry Run Restore + HMAC Challenge Token fetch
  const handleStartRestoreDryRun = async (backup: any) => {
    setSelectedBackupForRestore(backup);
    setIsDryRunning(true);
    setDryRunData(null);
    setConfirmationInput('');
    setReauthEmailInput('');
    setRestoreChallengeToken(null);
    setRestoreMessage(null);

    try {
      const [challengeRes, res] = await Promise.all([
        fetch('/api/admin/backup/restore'),
        fetch('/api/admin/backup/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            backupId: backup.backupId,
            driveFileId: backup.driveFileId,
            dryRun: true,
          }),
        }),
      ]);
      const challengeData = await challengeRes.json();
      if (challengeData.success && challengeData.challengeToken) {
        setRestoreChallengeToken(challengeData.challengeToken);
      }
      const data = await res.json();
      if (data.success) {
        setDryRunData(data);
      } else {
        setRestoreMessage(`Dry Run Validation Failed: ${data.error}`);
      }
    } catch (err: any) {
      setRestoreMessage(`Dry run error: ${err.message}`);
    } finally {
      setIsDryRunning(false);
    }
  };

  // Execute Live Restore
  const handleExecuteLiveRestore = async () => {
    if (confirmationInput !== 'CONFIRM_RESTORE_SREC') {
      alert('Type exact confirmation string: CONFIRM_RESTORE_SREC');
      return;
    }
    if (!reauthEmailInput.trim()) {
      setRestoreMessage('Re-enter your active SUPER_ADMIN institutional email for secondary re-authentication.');
      return;
    }

    setIsLiveRestoring(true);
    try {
      let activeChallenge = restoreChallengeToken;
      if (!activeChallenge) {
        const challengeRes = await fetch('/api/admin/backup/restore');
        const challengeData = await challengeRes.json();
        activeChallenge = challengeData.challengeToken || null;
      }

      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId: selectedBackupForRestore.backupId,
          driveFileId: selectedBackupForRestore.driveFileId,
          dryRun: false,
          confirmationCode: confirmationInput,
          challengeToken: activeChallenge,
          reauthEmail: reauthEmailInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Live Restore Completed! A safety pre-restore snapshot was automatically created: ${data.safetySnapshotBackupId}`);
        setSelectedBackupForRestore(null);
        fetchData();
      } else {
        setRestoreMessage(`Restore Failed: ${data.error}`);
      }
    } catch (err: any) {
      setRestoreMessage(`Restore error: ${err.message}`);
    } finally {
      setIsLiveRestoring(false);
    }
  };

  // Connect Super Admin Drive
  const handleConnectDrive = async () => {
    setDriveLoading(true);
    setDriveMessage(null);
    try {
      const res = await fetch('/api/admin/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' }),
      });
      const data = await res.json();
      if (data.success) {
        setDriveMessage('✅ Super Admin Google Drive connected and folders initialized.');
        fetchData();
      } else {
        // Direct OAuth Re-authentication with offline Drive consent
        setDriveMessage('Redirecting to Google for Super Admin Drive authorization...');
        await signIn('google', { callbackUrl: '/admin/settings?tab=drive' });
      }
    } catch (err: any) {
      setDriveMessage(`❌ Error connecting Drive: ${err.message}`);
    } finally {
      setDriveLoading(false);
    }
  };

  // Disconnect Drive
  const handleDisconnectDrive = async () => {
    if (!confirm('Are you sure you want to disconnect Google Drive? Automated backups to Drive will pause.')) return;
    setDriveLoading(true);
    try {
      await fetch('/api/admin/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setDriveLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Settings className="w-5 h-5" />
            </div>
            Master System Administration & Backups
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure Google Drive integration, automated 14-day database backups, security domains, and disaster recovery.
          </p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          className="text-xs flex items-center gap-2 self-start sm:self-auto border-slate-800 hover:bg-slate-800/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${backupLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'backup'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Automated 14-Day Backups</span>
        </button>

        <button
          onClick={() => setActiveTab('drive')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'drive'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Google Drive Integration</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'system'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>System Information & Health</span>
        </button>
      </div>

      {/* TAB 1: BACKUPS */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {backupMessage && (
            <div className="p-3.5 rounded-xl bg-space-900 border border-slate-800 text-xs text-white">
              {backupMessage}
            </div>
          )}

          {/* Schedule Banner */}
          <div className="p-5 rounded-2xl bg-space-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Backup Schedule
              </div>
              <div className="text-base font-bold text-white mt-1">Every 14 Days</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Automated Cron Execution</p>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Last Successful Backup
              </div>
              <div className="text-sm font-semibold text-cyan-400 mt-1">
                {backupSchedule?.lastBackupDate
                  ? new Date(backupSchedule.lastBackupDate).toLocaleDateString()
                  : 'No Backups Yet'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {backupSchedule?.lastBackupDate
                  ? new Date(backupSchedule.lastBackupDate).toLocaleTimeString()
                  : 'Awaiting initial snapshot'}
              </p>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Next Scheduled Run
              </div>
              <div className="text-sm font-semibold text-emerald-400 mt-1">
                {backupSchedule?.nextBackupDue
                  ? new Date(backupSchedule.nextBackupDue).toLocaleDateString()
                  : 'Immediately Eligible'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {backupSchedule?.isDue ? '⚡ Due Now' : 'Automatic via Server Cron'}
              </p>
            </div>

            <div className="sm:text-right">
              <Button
                onClick={handleTriggerBackup}
                disabled={isTriggeringBackup}
                className="btn-cyan px-4 py-2.5 text-xs font-semibold flex items-center gap-2 sm:ml-auto"
              >
                {isTriggeringBackup ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Backup...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Trigger Backup Now</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Backup History Table */}
          <div className="bg-space-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Database Backup & Snapshot History</h3>
              <span className="text-xs text-slate-400 font-mono">
                Encrypted with AES-256-GCM
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-space-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Backup ID / Timestamp</th>
                    <th className="px-5 py-3.5">File Size</th>
                    <th className="px-5 py-3.5">Records</th>
                    <th className="px-5 py-3.5">SHA-256 Checksum</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Drive File</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {backupHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                        No database backups recorded yet. Click "Trigger Backup Now" to create the first snapshot.
                      </td>
                    </tr>
                  ) : (
                    backupHistory.map((backup) => (
                      <tr key={backup.id} className="hover:bg-space-800/40">
                        <td className="px-5 py-4 font-mono text-white">
                          <div>{backup.backupId}</div>
                          <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                            {new Date(backup.createdAt).toLocaleString()} • {backup.initiatedBy}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          {(backup.fileSize / 1024).toFixed(1)} KB
                        </td>
                        <td className="px-5 py-4 text-slate-300 font-semibold">
                          {backup.totalRecords.toLocaleString()} records
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px] text-cyan-400 truncate max-w-[120px]">
                          {backup.checksum.slice(0, 16)}...
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                              backup.status === 'VERIFIED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : backup.status === 'COMPLETED'
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {backup.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {backup.driveWebViewLink ? (
                            <a
                              href={backup.driveWebViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                            >
                              <span>Drive File</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Local Record</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyBackup(backup.backupId)}
                            className="text-[11px] px-2.5 py-1 h-7 border-slate-800 hover:bg-slate-800"
                          >
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartRestoreDryRun(backup)}
                            className="text-[11px] px-2.5 py-1 h-7 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                          >
                            Restore
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE DRIVE */}
      {activeTab === 'drive' && (
        <div className="space-y-6">
          {driveMessage && (
            <div className="p-3.5 rounded-xl bg-space-900 border border-slate-800 text-xs text-white">
              {driveMessage}
            </div>
          )}

          {/* Connection Card */}
          <div className="p-6 rounded-2xl bg-space-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Google Drive Cloud Connection
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      driveStatus?.isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {driveStatus?.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Connected Account: <strong className="text-white">{driveStatus?.email || 'None'}</strong> (
                  {driveStatus?.type || 'UNCONFIGURED'})
                </p>
                {driveStatus?.rootFolderId && (
                  <p className="text-[11px] font-mono text-cyan-400 mt-1">
                    Root Folder ID: {driveStatus.rootFolderId} • Backup Folder: {driveStatus.backupFolderId}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {driveStatus?.isConnected ? (
                <>
                  <Button
                    onClick={handleConnectDrive}
                    disabled={driveLoading}
                    variant="outline"
                    className="text-xs border-slate-800 hover:bg-slate-800"
                  >
                    <FolderSync className="w-3.5 h-3.5 mr-1.5" />
                    <span>Sync Folders</span>
                  </Button>
                  <Button
                    onClick={handleDisconnectDrive}
                    disabled={driveLoading}
                    variant="outline"
                    className="text-xs border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    <span>Disconnect</span>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleConnectDrive}
                  disabled={driveLoading}
                  className="btn-cyan px-5 py-2.5 text-xs font-semibold"
                >
                  <HardDrive className="w-3.5 h-3.5 mr-1.5" />
                  <span>Connect Super Admin Drive</span>
                </Button>
              )}
            </div>
          </div>

          {/* Drive Files in Backup Folder */}
          <div className="bg-space-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Files in Google Drive "SREC Connect Backups"</h3>
              <span className="text-xs text-slate-400">Strictly Private to Super Admin</span>
            </div>

            <div className="p-4">
              {driveFiles.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No backup files detected in Google Drive yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-xl bg-space-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{file.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {file.id} • {file.size ? (parseInt(file.size) / 1024).toFixed(1) + ' KB' : 'Unknown size'}
                        </div>
                      </div>
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>View in Drive</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM INFO */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-space-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Security Configuration</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Environment</span>
                  <span className="text-white font-mono">Production Mode</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Session Security</span>
                  <span className="text-emerald-400 font-semibold">httpOnly, sameSite, secure</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Backup Encryption</span>
                  <span className="text-emerald-400 font-semibold">AES-256-GCM Authenticated</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Drive Boundary Check</span>
                  <span className="text-emerald-400 font-semibold">assertDriveAllowed Active</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-space-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Infrastructure & Runtime</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Production Domain</span>
                  <span className="text-cyan-400 font-mono">srecconnect.dpdns.org</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Framework</span>
                  <span className="text-white">Next.js 15.5.25 (React 19)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Database Engine</span>
                  <span className="text-white">Neon Serverless PostgreSQL</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">ORM Schema Version</span>
                  <span className="text-cyan-400 font-mono">v3_production</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE MODAL */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0E12]/75 overflow-y-auto">
          <div className="relative w-full max-w-xl glass-sheet liquid-sheet-enter rounded-3xl shadow-2xl overflow-hidden my-8 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Disaster Recovery & Database Restore</span>
              </h3>
              <button
                onClick={() => setSelectedBackupForRestore(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              <strong>Caution:</strong> Live restoration overwrites records in the production database with this snapshot.
              A safety pre-restore backup snapshot will automatically be generated prior to data ingestion.
            </div>

            <div className="text-xs space-y-1 font-mono text-slate-300">
              <div>Target Snapshot: <strong>{selectedBackupForRestore.backupId}</strong></div>
              <div>Checksum: {selectedBackupForRestore.checksum}</div>
            </div>

            {isDryRunning ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                <span>Executing pre-flight dry-run validation from Google Drive...</span>
              </div>
            ) : dryRunData ? (
              <div className="p-4 rounded-xl bg-space-950 border border-slate-800 space-y-2 text-xs">
                <div className="text-emerald-400 font-bold">✅ Pre-Flight Validation Passed</div>
                <div className="text-slate-300">
                  Total Snapshot Records: <strong>{dryRunData.totalRecords}</strong>
                </div>
                <div className="text-[11px] text-slate-400 font-mono max-h-32 overflow-y-auto">
                  {JSON.stringify(dryRunData.tableCounts, null, 2)}
                </div>
              </div>
            ) : null}

            {restoreMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs">
                {restoreMessage}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Secondary Re-Authentication: Re-enter your SUPER_ADMIN email:
                </label>
                <input
                  type="email"
                  value={reauthEmailInput}
                  onChange={(e) => setReauthEmailInput(e.target.value)}
                  placeholder={(session?.user?.email as string) || 'admin@srecnandyal.edu.in'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-space-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Type <code className="text-rose-400">CONFIRM_RESTORE_SREC</code> to authorize:
                </label>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="CONFIRM_RESTORE_SREC"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-space-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedBackupForRestore(null)}
                className="text-xs border-slate-800 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteLiveRestore}
                disabled={isLiveRestoring || confirmationInput !== 'CONFIRM_RESTORE_SREC' || !reauthEmailInput.trim()}
                className="btn-cyan bg-rose-600 hover:bg-rose-500 px-5 py-2 text-xs font-semibold text-white"
              >
                {isLiveRestoring ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Restoring Database...</span>
                  </>
                ) : (
                  <span>Authorize & Restore</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
