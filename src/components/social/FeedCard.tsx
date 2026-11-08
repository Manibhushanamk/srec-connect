'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, CheckCircle2, Award, Calendar, FileText, Check } from 'lucide-react';

export interface FeedAuthor {
  id: string;
  name: string;
  role: 'STUDENT' | 'FACULTY' | 'HOD' | 'ADMIN';
  rollNumber?: string;
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
  date: string;
  isVerified: boolean;
  certificateUrl?: string;
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
}) => {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [copied, setCopied] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');

  const toggleLike = () => {
    if (isLiked) {
      setLikesCount((prev) => prev - 1);
      setIsLiked(false);
    } else {
      setLikesCount((prev) => prev + 1);
      setIsLiked(true);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `/feed/post/${id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentsList([...commentsList, newComment.trim()]);
    setNewComment('');
  };

  return (
    <article className="social-card social-card-hover mb-5 overflow-hidden transition-all duration-200">
      {/* 1. Header (LinkedIn + Instagram Profile Row) */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar with optional gradient ring */}
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm overflow-hidden">
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
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground hover:underline cursor-pointer">
                {author.name}
              </span>
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
              ) : (
                author.designation
              )}{' '}
              • {author.department} • <span className="text-muted-foreground/80">{createdAt}</span>
            </p>
          </div>
        </div>

        <button
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Post options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

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
              Issued by <span className="font-medium text-foreground">{achievement.issuer}</span> • {achievement.date}
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
                  <span className="font-semibold text-foreground mr-1.5">You:</span>
                  <span className="text-foreground/90">{cmt}</span>
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
