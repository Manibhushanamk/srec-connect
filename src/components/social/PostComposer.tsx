'use client';

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Image, Send, X, Lock, Globe, AlertCircle, Sparkles } from 'lucide-react';
import { MAX_POST_IMAGES } from '@/lib/media-constants';

interface PostComposerProps {
  onPostCreated?: (newPost: any) => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated }) => {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'COLLEGE_ONLY'>('PUBLIC');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          visibility,
          images: selectedImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish post');
      }

      setContent('');
      setSelectedImages([]);
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
            <img src={session.user.image} alt={session.user.name || 'User'} className="w-full h-full object-cover" />
          ) : (
            (session.user.name || 'U').substring(0, 2).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <textarea
            rows={isExpanded ? 3 : 2}
            value={content}
            onFocus={() => setIsExpanded(true)}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an academic project, research insight, or department milestone..."
            className="w-full text-xs text-foreground bg-secondary/50 hover:bg-secondary/70 focus:bg-background border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none placeholder:text-muted-foreground"
          />

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

          {/* Action Row */}
          {isExpanded && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
              <div className="flex items-center gap-2">
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
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border'
                  }`}
                >
                  <Image className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Add Images ({selectedImages.length}/{MAX_POST_IMAGES})</span>
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

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                className="btn-primary text-xs py-1.5 px-4 gap-1.5"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Posting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
