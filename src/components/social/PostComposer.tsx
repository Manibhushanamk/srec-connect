'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Image, Send, X, Lock, Globe, AlertCircle, Sparkles, Users, UserPlus, HardDrive, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { MAX_POST_IMAGES } from '@/lib/media-constants';
import { MemberSelector, SelectedMember } from '@/components/shared/MemberSelector';

interface PostComposerProps {
  onPostCreated?: (newPost: any) => void;
}

const TOPIC_TAGS = [
  '#Project',
  '#Research',
  '#Hackathon',
  '#Placement',
  '#Achievement',
  '#Announcement',
];

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated }) => {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'COLLEGE_ONLY'>('PUBLIC');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [collaborators, setCollaborators] = useState<SelectedMember[]>([]);
  const [showCollabSelector, setShowCollabSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [driveStatus, setDriveStatus] = useState<{
    isConnected?: boolean;
    folderId?: string;
    folderName?: string;
    folderViewLink?: string;
    requiresReauth?: boolean;
    requiresApiEnablement?: boolean;
    enableUrl?: string;
    emailMismatch?: boolean;
    expectedEmail?: string;
    actualEmail?: string;
    email?: string;
    message?: string;
  } | null>(null);
  const [checkingDrive, setCheckingDrive] = useState(true);
  const [connectingDrive, setConnectingDrive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session?.user) {
      setCheckingDrive(false);
      return;
    }
    fetch('/api/drive/init')
      .then((res) => res.json())
      .then((data) => setDriveStatus(data))
      .catch(() => setDriveStatus({ isConnected: false, requiresReauth: true }))
      .finally(() => setCheckingDrive(false));
  }, [session]);

  const handleConnectDrive = async () => {
    setConnectingDrive(true);
    try {
      await signIn('google', {
        callbackUrl: window.location.href,
      }, {
        login_hint: session?.user?.email || undefined,
        prompt: 'consent select_account',
      } as any);
    } catch (err) {
      console.error('[Drive Connect Error]:', err);
      setConnectingDrive(false);
    }
  };

  const userRole = (session?.user as any)?.role;
  const roleBadge =
    userRole === 'SUPER_ADMIN' ? '👑 Super Admin' :
    userRole === 'HOD' ? '🏛️ HOD' :
    userRole === 'FACULTY' ? '🎓 Faculty' :
    userRole === 'STUDENT' ? '🎒 Student' : null;

  const insertTag = (tag: string) => {
    if (!content.includes(tag)) {
      setContent((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  if (!session?.user) {
    return (
      <div className="social-card p-4 mb-5 border-border bg-card/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              SREC
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Join the Academic Community</p>
              <p className="text-[11px] text-muted-foreground">Sign in to share project updates, research papers & achievements.</p>
            </div>
          </div>
          <Link href="/signin" className="btn-primary text-xs py-2 px-4 shrink-0">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (selectedImages.length + files.length > MAX_POST_IMAGES) {
      setErrorMessage(`Maximum ${MAX_POST_IMAGES} images permitted per post.`);
      return;
    }

    const readers: Promise<string>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Only valid image files (JPG, PNG, WebP) are accepted.');
        return;
      }
      readers.push(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
      );
    }

    Promise.all(readers)
      .then((newBase64s) => {
        setSelectedImages((prev) => [...prev, ...newBase64s].slice(0, MAX_POST_IMAGES));
      })
      .catch((err) => {
        setErrorMessage('Failed to read image file.');
      });

    // Reset file input so user can reselect if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!content.trim()) {
      setErrorMessage('Post content cannot be empty.');
      return;
    }

    if (selectedImages.length > MAX_POST_IMAGES) {
      setErrorMessage(`Maximum ${MAX_POST_IMAGES} images allowed.`);
      return;
    }

    if (selectedImages.length > 0 && !driveStatus?.isConnected) {
      setErrorMessage('Google Drive permission is mandatory to post media. Please connect your Google Drive first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          visibility,
          images: selectedImages,
          collaboratorIds: collaborators.map((c) => c.id),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresDriveConnect) {
          setDriveStatus((prev) => ({ ...prev, isConnected: false, requiresReauth: true }));
        }
        throw new Error(data.error || 'Failed to publish post');
      }

      setContent('');
      setSelectedImages([]);
      setCollaborators([]);
      setShowCollabSelector(false);
      setIsExpanded(false);
      if (onPostCreated && data.post) {
        onPostCreated(data.post);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while publishing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="social-card p-4 mb-5 border-border bg-card shadow-subtle transition-all duration-200">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            (session.user.name || 'U').substring(0, 2).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                {session.user.name || 'Campus Member'}
              </span>
              {roleBadge && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {roleBadge}
                </span>
              )}
            </div>
            {isExpanded && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {content.length}/2000
              </span>
            )}
          </div>

          <textarea
            rows={isExpanded ? 3 : 2}
            value={content}
            onFocus={() => setIsExpanded(true)}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an academic project, research insight, or department milestone..."
            maxLength={2000}
            className="w-full text-xs text-foreground bg-secondary/50 hover:bg-secondary/70 focus:bg-background border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none placeholder:text-muted-foreground"
          />

          {/* Quick Topic Tags */}
          {isExpanded && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                Topics:
              </span>
              {TOPIC_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertTag(tag)}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-secondary/80 hover:bg-secondary hover:text-primary border border-border/80 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {errorMessage && (
            <div className="mt-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Image Previews */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black/10">
                  <img src={img} alt={`Attached ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Mandatory Google Drive Notice when images are attached */}
          {selectedImages.length > 0 && !driveStatus?.isConnected && (
            <div className={`mt-3 p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              driveStatus?.emailMismatch
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-start gap-2 min-w-0">
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${driveStatus?.emailMismatch ? 'text-rose-400' : 'text-amber-400'}`} />
                <div>
                  <p className="font-bold text-foreground">
                    {driveStatus?.emailMismatch ? 'Drive & Account Email Must Match' : 'Google Drive Connection Required'}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${driveStatus?.emailMismatch ? 'text-rose-300/90' : 'text-amber-300/90'}`}>
                    {driveStatus?.emailMismatch
                      ? `Drive was connected with ${driveStatus.actualEmail}, but your account is ${session.user.email}. Drive must match this exact account.`
                      : `Drive authorization is mandatory to upload images. Your media is saved directly to your private SREC CONNECT folder (${session.user.email}).`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConnectDrive}
                disabled={connectingDrive}
                className={`px-3.5 py-1.5 rounded-lg font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 ${
                  driveStatus?.emailMismatch
                    ? 'bg-rose-500 hover:bg-rose-400 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {connectingDrive ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <HardDrive className="w-3.5 h-3.5" />
                )}
                <span>{connectingDrive ? 'Connecting...' : driveStatus?.emailMismatch ? `Connect with ${session.user.email}` : 'Connect Drive'}</span>
              </button>
            </div>
          )}

          {/* Instagram-style Co-author / Collaborators Section */}
          {isExpanded && showCollabSelector && (
            <div className="mt-3 p-3 bg-secondary/30 rounded-xl border border-border/80">
              <MemberSelector
                label="Invite Team Collaborators (Co-authors)"
                placeholder="Type roll number (e.g. 22091A3201) or scholar name..."
                selected={collaborators}
                onChange={setCollaborators}
                max={4}
                excludeSelfId={(session.user as any)?.id}
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                💡 Invited collaborators will receive an instant notification to accept before co-author badge is displayed.
              </p>
            </div>
          )}

          {/* Action Row */}
          {isExpanded && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedImages.length >= MAX_POST_IMAGES}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    selectedImages.length >= MAX_POST_IMAGES
                      ? 'bg-muted text-muted-foreground border-transparent cursor-not-allowed opacity-60'
                      : !driveStatus?.isConnected
                      ? 'bg-amber-950/20 text-amber-300 border-amber-600/30 hover:bg-amber-950/40'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border'
                  }`}
                >
                  <Image className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Add Images ({selectedImages.length}/{MAX_POST_IMAGES}){!driveStatus?.isConnected ? ' • Drive Req' : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCollabSelector(!showCollabSelector)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    collaborators.length > 0 || showCollabSelector
                      ? 'bg-cyan-950/60 border-cyan-700/80 text-cyan-300'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Collaborators {collaborators.length > 0 && `(${collaborators.length})`}</span>
                </button>

                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="text-xs bg-secondary border border-border text-foreground rounded-xl px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="PUBLIC">🌍 Public</option>
                  <option value="COLLEGE_ONLY">🔒 College Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    setContent('');
                    setSelectedImages([]);
                    setErrorMessage('');
                  }}
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !content.trim() || (selectedImages.length > 0 && !driveStatus?.isConnected)}
                  className="btn-primary text-xs py-1.5 px-4 gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Posting...</span>
                  ) : selectedImages.length > 0 && !driveStatus?.isConnected ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Connect Drive to Post Media</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
