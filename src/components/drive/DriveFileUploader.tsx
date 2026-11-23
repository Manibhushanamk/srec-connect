'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ExternalLink, RefreshCw, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface DriveFileUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
  documentType?: string;
  helpText?: string;
}

export function DriveFileUploader({
  value,
  onChange,
  label = 'Certificate / Proof Document',
  required = false,
  documentType = 'STUDENT_CERTIFICATE',
  helpText = 'Files are uploaded to institutional Google Drive and automatically shared with view access ("Anyone with the link can view").',
}: DriveFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate size (15 MB max)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError(`File is too large (${formatFileSize(file.size)}). Maximum allowed size is 15 MB.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload document to Google Drive.');
      }

      setUploadedFileName(data.fileName);
      setUploadedFileSize(data.fileSize);
      onChange(data.webViewLink);
    } catch (err: any) {
      console.error('[Drive Upload Component Error]', err);
      setUploadError(err.message || 'Network error occurred while uploading.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    onChange('');
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setManualMode(!manualMode)}
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1 transition-colors"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{manualMode ? 'Switch to Direct File Upload' : 'Paste Existing Drive Link'}</span>
        </button>
      </div>

      {manualMode ? (
        /* Manual URL Input Option */
        <div className="space-y-2">
          <div className="relative">
            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="url"
              placeholder="https://drive.google.com/file/d/..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Please make sure the link sharing setting in Google Drive is configured to &quot;Anyone with the link can view&quot;.
          </p>
        </div>
      ) : value ? (
        /* Uploaded Success Card */
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs sm:text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
                    {uploadedFileName || 'Google Drive Document Linked'}
                  </p>
                  <Badge variant="emerald" size="sm" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Shared with Anyone (Viewer)</span>
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {uploadedFileSize ? formatFileSize(uploadedFileSize) + ' • ' : ''}
                  {value}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-background border border-border text-foreground hover:bg-muted transition-colors shadow-2xs"
              >
                <span>View on Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                title="Remove uploaded file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {value && (
            <div className="mt-3 pt-3 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground min-w-0">
                <span className="font-semibold text-emerald-400">Direct CDN Display:</span>
                <span className="font-mono text-[10px] truncate max-w-xs">{value}</span>
              </div>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                <span>Direct View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.005]'
              : 'border-border hover:border-primary/50 hover:bg-muted/30 bg-card/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.doc"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          {isUploading ? (
            <div className="py-4 space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  Uploading to Google Drive...
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Setting public sharing permissions (&quot;Anyone with the link can view&quot;)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  Upload file directly to Google Drive
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Drag and drop your file here, or{' '}
                  <span className="text-primary font-semibold hover:underline">browse your device</span>
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  Supported formats: PDF, PNG, JPG, JPEG, WEBP, DOCX (Max 15 MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-[10px] font-bold uppercase hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Help text */}
      {helpText && !uploadError && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>{helpText}</span>
        </p>
      )}
    </div>
  );
}
