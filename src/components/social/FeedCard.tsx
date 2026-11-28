'use client';

import React, { memo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  CheckCircle2,
  Award,
  Check,
  Flag,
  Users,
  Trash2,
  Pencil,
  X,
  Lock,
  Globe,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

export interface FeedAuthor {
  id: string;
  name: string;
  role: 'STUDENT' | 'FACULTY' | 'HOD' | 'ADMIN' | 'SUPER_ADMIN' | 'WEB_MANAGER' | string;
  departmentId?: string | null;
  rollNumber?: string;
  facultyId?: string;
  studentId?: string;
  designation?: string;
  department: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

export interface FeedAchievementAttachment {
  id: string;
  title: string;
  category: string;
  issuer: string;
  date?: string;
  isVerified: boolean;
  certificateUrl?: string;
}

export interface FeedComment {
  id?: string;
  content: string;
  author?: {
    name?: string | null;
    avatarUrl?: string | null;
  };
}

export interface FeedPostProps {
  id: string;
  author: FeedAuthor;
  content: string;
  images?: string[];
  createdAt: string;
  updatedAt?: string;
  visibility?: 'PUBLIC' | 'COLLEGE_ONLY' | 'PRIVATE' | string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  achievement?: FeedAchievementAttachment;
  collaborators?: {
    id: string;
    userId: string;
    name: string;
    rollNumber?: string;
    designation?: string;
    role: string;
    avatarUrl?: string;
    status: string;
  }[];
  initialComments?: FeedComment[];
  isPriority?: boolean;
  isAboveFold?: boolean;
}

const FeedCardComponent: React.FC<FeedPostProps> = ({
  id,
  author,
  content,
  images = [],
  createdAt,
  updatedAt,
  visibility: initialVisibility = 'PUBLIC',
  likesCount: initialLikesCount,
  commentsCount,
  isLiked: initialIsLiked = false,
  isBookmarked: initialIsBookmarked = false,
  achievement,
  collaborators = [],
  initialComments = [],
  isPriority = false,
  isAboveFold = false,
}) => {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const [postContent, setPostContent] = useState(content);
  const [postImages, setPostImages] = useState<string[]>(images);
  const [postVisibility, setPostVisibility] = useState<string>(initialVisibility);
  const [postUpdatedAt, setPostUpdatedAt] = useState<string | undefined>(updatedAt);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editVisibility, setEditVisibility] = useState<'PUBLIC' | 'COLLEGE_ONLY' | 'PRIVATE'>(
    (initialVisibility as any) || 'PUBLIC'
  );
  const [editImages, setEditImages] = useState<string[]>(images.slice(0, 2));
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [postCollabs, setPostCollabs] = useState(collaborators);
  const [copied, setCopied] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<FeedComment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [isTrashed, setIsTrashed] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const activeImages = postImages.filter((img) => !failedImages[img]);

  const currentUserRole = (session?.user as any)?.role;
  const currentUserDeptId = (session?.user as any)?.departmentId;
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';
  const isAuthor = currentUserId === author.id;
  const isSameDeptHod =
    currentUserRole === 'HOD' && Boolean(currentUserDeptId) && currentUserDeptId === author.departmentId;
  const isWebManagerModeratable = currentUserRole === 'WEB_MANAGER' && postVisibility !== 'PRIVATE';
  const canDeletePost = isAuthor || isSuperAdmin || isSameDeptHod || isWebManagerModeratable;

  const isEdited =
    Boolean(postUpdatedAt) &&
    new Date(postUpdatedAt!).getTime() - new Date(createdAt).getTime() > 60_000;

  const getAuthorProfileUrl = (auth: FeedAuthor) => {
    if (session?.user && ((session.user as any).id === auth.id || session.user.name === auth.name)) {
      return '/profile';
    }
    if (auth.rollNumber) return `/students/${auth.rollNumber}`;
    if (auth.studentId) return `/students/${auth.studentId}`;
    if (auth.facultyId) return `/faculty/${auth.facultyId}`;
    if (auth.role === 'FACULTY' || auth.role === 'HOD' || auth.designation) {
      return `/faculty/${auth.facultyId || auth.id}`;
    }
    if (auth.role === 'STUDENT') {
      return `/students/${auth.rollNumber || auth.id}`;
    }
    return '/profile';
  };

  const getCollabProfileUrl = (c: {
    userId: string;
    name: string;
    rollNumber?: string;
    role: string;
  }) => {
    if (session?.user && ((session.user as any).id === c.userId || session.user.name === c.name)) {
      return '/profile';
    }
    if (c.rollNumber) return `/students/${c.rollNumber}`;
    if (c.role === 'FACULTY' || c.role === 'HOD') return `/faculty/${c.userId}`;
    if (c.role === 'STUDENT') return `/students/${c.rollNumber || c.userId}`;
    return '/profile';
  };

  const handleTrashPost = async () => {
    const isModAction = !isAuthor;
    const reason = isModAction
      ? window.prompt('Optional moderation reason for audit log (or leave blank):') ?? undefined
      : undefined;
    if (!isModAction && !confirm('Move this post to Trash? It will be immediately removed from the live feed.')) return;
    if (isModAction && !confirm('Remove this post under moderation policy?')) return;
    setShowOptions(false);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setIsTrashed(true);
      } else {
        alert('Failed to remove post');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) {
      setEditError('Post content cannot be empty.');
      return;
    }
    setIsSavingEdit(true);
    setEditError('');
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent.trim(),
          visibility: editVisibility,
          images: editImages.slice(0, 2),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Failed to update post');
      } else {
        setPostContent(data.post.content);
        setPostVisibility(data.post.visibility);
        setPostImages(data.post.images || []);
        setPostUpdatedAt(data.post.updatedAt || new Date().toISOString());
        setIsEditingModalOpen(false);
      }
    } catch {
      setEditError('Network error saving post changes');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const toggleLike = async () => {
    // Optimistic UI update
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : prev - 1));

    try {
      const res = await fetch(`/api/posts/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLikesCount(data.likesCount);
        setIsLiked(data.isLiked);
      }
    } catch (e) {
      console.warn('Failed to sync like state:', e);
    }
  };

  const toggleBookmark = async () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);

    try {
      const res = await fetch(`/api/posts/${id}/bookmark`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsBookmarked(data.isBookmarked);
      }
    } catch (e) {
      console.warn('Failed to sync bookmark state:', e);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `/#post-${id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;

    setNewComment('');
    setCommentsList((prev) => [...prev, { content: trimmed, author: { name: 'You' } }]);

    try {
      await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });
    } catch (err) {
      console.warn('Failed to persist comment:', err);
    }
  };

  const handleReportPost = async () => {
    try {
      await fetch(`/api/posts/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Reported by user as inappropriate or inaccurate' }),
      });
      setReportSubmitted(true);
      setShowOptions(false);
      setTimeout(() => setReportSubmitted(false), 3000);
    } catch (err) {
      console.warn('Failed to report post:', err);
    }
  };

  const acceptedCollabs = postCollabs.filter((c) => c.status === 'ACCEPTED');
  const myPendingCollab = currentUserId
    ? postCollabs.find((c) => c.userId === currentUserId && c.status === 'PENDING')
    : null;

  if (isTrashed) {
    return null;
  }

  const handleCollabAction = async (action: 'ACCEPT' | 'DECLINE') => {
    try {
      const res = await fetch(`/api/posts/${id}/collaborate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setPostCollabs((prev) =>
          prev.map((c) =>
            c.userId === currentUserId
              ? { ...c, status: action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED' }
              : c
          )
        );
      }
    } catch (e) {
      console.error('Failed to submit collab action:', e);
    }
  };

  return (
    <article
      id={`post-${id}`}
      className={`social-card social-card-hover mb-5 overflow-hidden transition-colors duration-150 ${
        isPriority || isAboveFold ? '' : 'feed-offscreen-card'
      }`}
    >
      {/* 1. Header (LinkedIn + Instagram Profile Row) */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar with optional gradient ring */}
          <Link href={getAuthorProfileUrl(author)} className="relative group/avatar block" title={`View ${author.name}'s Profile`}>
            <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm overflow-hidden group-hover/avatar:ring-2 group-hover/avatar:ring-primary transition-all">
              {author.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt={author.name}
                  width={44}
                  height={44}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                author.name.substring(0, 2).toUpperCase()
              )}
            </div>
            {author.isVerified && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 fill-primary text-white" />
              </span>
            )}
          </Link>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={getAuthorProfileUrl(author)}
                className="font-semibold text-sm text-foreground hover:underline hover:text-primary transition-colors cursor-pointer"
                title={`View ${author.name}'s Profile`}
              >
                {author.name}
              </Link>
              {acceptedCollabs.map((c) => (
                <span key={c.id} className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <span className="text-muted-foreground font-normal">&amp;</span>
                  <Link
                    href={getCollabProfileUrl(c)}
                    className="hover:underline hover:text-primary transition-colors cursor-pointer"
                    title={`View ${c.name}'s Profile`}
                  >
                    {c.name}
                  </Link>
                </span>
              ))}
              {acceptedCollabs.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/60 px-1.5 py-0.5 rounded-full">
                  <Users className="w-2.5 h-2.5" /> Collab
                </span>
              )}
              {author.isVerified && (
                <span className="verified-badge">
                  <CheckCircle2 className="w-3 h-3 text-primary fill-primary/20" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-tight">
              {author.rollNumber ? (
                <span className="font-mono font-medium text-foreground/80">{author.rollNumber}</span>
              ) : author.designation ? (
                author.designation
              ) : author.role === 'SUPER_ADMIN' ? (
                <span className="font-semibold text-purple-400">Super Administrator</span>
              ) : author.role === 'HOD' ? (
                <span className="font-semibold text-blue-400">Head of Department</span>
              ) : (
                <span className="font-medium text-muted-foreground">{author.role}</span>
              )}{' '}
              • {author.department} • <span className="text-muted-foreground/80">{formatTimeAgo(createdAt)}</span>
              {isEdited && (
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-secondary text-[10px] font-medium text-muted-foreground border border-border">
                  Edited
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Post options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showOptions && (
            <div className="absolute right-0 top-8 z-20 w-44 rounded-xl bg-card border border-border shadow-lg py-1 text-xs">
              {isAuthor && (
                <button
                  onClick={() => {
                    setEditContent(postContent);
                    setEditVisibility((postVisibility as any) || 'PUBLIC');
                    setEditImages(postImages.slice(0, 2));
                    setEditError('');
                    setShowOptions(false);
                    setIsEditingModalOpen(true);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-muted text-foreground font-medium border-b border-border"
                >
                  <Pencil className="w-3.5 h-3.5 text-primary" />
                  Edit Post
                </button>
              )}
              <button
                onClick={handleReportPost}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-muted text-muted-foreground hover:text-foreground font-medium"
              >
                <Flag className="w-3.5 h-3.5" />
                Report Post
              </button>
              {canDeletePost && (
                <button
                  onClick={handleTrashPost}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-rose-500/10 text-rose-500 font-medium border-t border-border"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isAuthor ? 'Delete Post' : 'Remove Post'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instagram-style Collaboration Invitation Banner */}
      {myPendingCollab && (
        <div className="mx-4 mb-3 p-3 bg-primary/12 border border-primary/35 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2 text-foreground min-w-0">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">
              <strong>{author.name}</strong> invited you to co-author this post.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCollabAction('ACCEPT')}
              className="px-2.5 py-1 bg-primary hover:bg-[#C2410C] dark:hover:bg-[#FB923C] text-white rounded-lg font-semibold text-[11px] transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => handleCollabAction('DECLINE')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {reportSubmitted && (
        <div className="mx-4 mb-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs text-center font-medium">
          Report submitted for faculty moderation.
        </div>
      )}

      {/* 2. Content Body */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
          {postContent}
        </p>
      </div>

      {/* 3. LinkedIn-style Verified Achievement Attachment (if present) */}
      {achievement && (
        <div className="mx-4 mb-3 p-3.5 rounded-xl bg-secondary/50 border border-border flex items-start gap-3 hover:bg-secondary/70 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                {achievement.category}
              </span>
              {achievement.isVerified && (
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-1.5 py-0.2 rounded-full">
                  Official Record
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-foreground truncate mt-0.5">
              {achievement.title}
            </h4>
            <p className="text-xs text-muted-foreground">
              Issued by <span className="font-medium text-foreground">{achievement.issuer}</span>
              {achievement.date ? ` • ${achievement.date}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* 4. Instagram Media Frame (Max 2 images, immediate SSR LCP paint with fixed aspect ratios) */}
      {activeImages.length > 0 && (
        <div className="w-full bg-black/10 dark:bg-white/5 border-y border-border overflow-hidden">
          {activeImages.length === 1 ? (
            <div className="relative aspect-[4/3] max-h-[460px] overflow-hidden bg-black/15 dark:bg-white/5 flex items-center justify-center">
              <img
                src={activeImages[0]}
                alt=""
                aria-label="Post media attachment"
                width={800}
                height={600}
                loading={isPriority || isAboveFold ? 'eager' : 'lazy'}
                fetchPriority={isPriority ? 'high' : undefined}
                decoding={isPriority ? 'sync' : 'async'}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  setFailedImages((prev) => ({ ...prev, [activeImages[0]]: true }));
                }}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.01]"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 max-h-[380px] overflow-hidden">
              {activeImages.slice(0, 2).map((img, idx) => (
                <div key={idx} className="relative aspect-square overflow-hidden bg-black/15 dark:bg-white/5">
                  <img
                    src={img}
                    alt=""
                    aria-label={`Post media attachment ${idx + 1}`}
                    width={400}
                    height={400}
                    loading={(isPriority || isAboveFold) && idx === 0 ? 'eager' : 'lazy'}
                    fetchPriority={isPriority && idx === 0 ? 'high' : undefined}
                    decoding={isPriority && idx === 0 ? 'sync' : 'async'}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      setFailedImages((prev) => ({ ...prev, [img]: true }));
                    }}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Instagram Action Row */}
      <div className="px-3 sm:px-4 py-1.5 flex items-center justify-between border-t border-border/50">
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Like Button */}
          <button
            onClick={toggleLike}
            className={`min-h-[44px] min-w-[44px] px-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all duration-150 ${
              isLiked ? 'text-rose-500 scale-105' : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Like post"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="min-h-[44px] min-w-[44px] px-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View comments"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{commentsCount + commentsList.length}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="min-h-[44px] min-w-[44px] px-2 flex items-center justify-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Share post"
          >
            {copied ? (
              <span className="flex items-center text-primary text-xs">
                <Check className="w-4 h-4 mr-1" /> Copied!
              </span>
            ) : (
              <Share2 className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Bookmark Button */}
        <button
          onClick={toggleBookmark}
          className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg transition-colors ${
            isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Save post"
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-primary' : ''}`} />
        </button>
      </div>

      {/* 6. Expandable Comments Drawer */}
      {showComments && (
        <div className="px-4 py-3 bg-muted/30 border-t border-border">
          {commentsList.length > 0 && (
            <div className="space-y-2 mb-3">
              {commentsList.map((cmt, idx) => (
                <div key={idx} className="text-xs bg-card p-2.5 rounded-xl border border-border">
                  <span className="font-semibold text-foreground mr-1.5">
                    {cmt.author?.name || 'Peer'}:
                  </span>
                  <span className="text-foreground/90">{cmt.content}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add an academic comment or congratulations..."
              className="flex-1 text-xs px-3 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            <button type="submit" className="btn-primary text-xs py-1.5 px-3">
              Post
            </button>
          </form>
        </div>
      )}

      {/* Author-Only Edit Sheet/Modal (.glass-sheet) */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0D0E12]/70">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit post"
            className="w-full sm:max-w-lg glass-sheet liquid-sheet-enter border rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Edit Campus Post</h3>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                aria-label="Close edit dialog"
                className="p-2 rounded-xl bg-secondary border border-border text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <textarea
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="input-field resize-y"
                placeholder="Update your post..."
              />
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  {editVisibility === 'PRIVATE' ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                  Visibility:
                </label>
                <select
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value as any)}
                  className="input-field max-w-[180px]"
                >
                  <option value="PUBLIC">Public Campus Feed</option>
                  <option value="COLLEGE_ONLY">College Members Only</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
              {editImages.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Attached Photos (max 2)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {editImages.slice(0, 2).map((img, i) => (
                      <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border">
                        <img src={img} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditImages(editImages.filter((_, idx) => idx !== i))}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white"
                          aria-label={`Remove image ${i + 1}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {editError && <p className="text-xs text-rose-400 font-medium">{editError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="btn-primary text-xs"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
  );
};

export const FeedCard = memo(FeedCardComponent);
export default FeedCard;
