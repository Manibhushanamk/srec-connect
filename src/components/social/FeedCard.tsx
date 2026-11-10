'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

export interface FeedAuthor {
  id: string;
  name: string;
  role: 'STUDENT' | 'FACULTY' | 'HOD' | 'ADMIN' | 'SUPER_ADMIN' | 'WEB_MANAGER' | string;
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
}

export const FeedCard: React.FC<FeedPostProps> = ({
  id,
  author,
  content,
  images = [],
  createdAt,
  likesCount: initialLikesCount,
  commentsCount,
  isLiked: initialIsLiked = false,
  isBookmarked: initialIsBookmarked = false,
  achievement,
  collaborators = [],
  initialComments = [],
}) => {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
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

  const currentUserRole = (session?.user as any)?.role;
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';
  const isAuthor = currentUserId === author.id;
  const canDeletePost = isAuthor || isSuperAdmin;

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
    if (!confirm('Move this post to Trash? It will be immediately removed from the live feed.')) return;
    setShowOptions(false);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIsTrashed(true);
      } else {
        alert('Failed to remove post');
      }
    } catch (e) {
      console.error(e);
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
    <article id={`post-${id}`} className="social-card social-card-hover mb-5 overflow-hidden transition-all duration-200">
      {/* 1. Header (LinkedIn + Instagram Profile Row) */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar with optional gradient ring */}
          <Link href={getAuthorProfileUrl(author)} className="relative group/avatar block" title={`View ${author.name}'s Profile`}>
            <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm overflow-hidden group-hover/avatar:ring-2 group-hover/avatar:ring-primary transition-all">
              {author.avatarUrl ? (
                <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" />
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
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Post options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showOptions && (
            <div className="absolute right-0 top-8 z-20 w-44 rounded-xl bg-card border border-border shadow-lg py-1 text-xs">
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
                  Move to Trash
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instagram-style Collaboration Invitation Banner */}
      {myPendingCollab && (
        <div className="mx-4 mb-3 p-3 bg-cyan-950/40 border border-cyan-800/70 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2 text-cyan-200 min-w-0">
            <Users className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">
              <strong>{author.name}</strong> invited you to co-author this post.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCollabAction('ACCEPT')}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold text-[11px] transition-colors"
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
          {content}
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

      {/* 4. Instagram Media Frame (Max 2 images) */}
      {images.length > 0 && (
        <div className="w-full bg-slate-950/10 dark:bg-slate-950/40 border-y border-border">
          {images.length === 1 ? (
            <div className="relative aspect-[4/3] max-h-[460px] overflow-hidden bg-black/5 flex items-center justify-center">
              <img
                src={images[0]}
                alt="Post Media"
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.01]"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 max-h-[380px] overflow-hidden">
              {images.slice(0, 2).map((img, idx) => (
                <div key={idx} className="relative aspect-square overflow-hidden bg-black/5">
                  <img
                    src={img}
                    alt={`Post Media ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Instagram Action Row */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-border/50">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-all duration-150 ${
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
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View comments"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{commentsCount + commentsList.length}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
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
          className={`p-1.5 rounded-lg transition-colors ${
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
    </article>
  );
};

export default FeedCard;
