'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Sparkles,
  Trophy,
  Briefcase,
  GraduationCap,
  Award,
  Cpu,
  X,
  ChevronRight,
  ChevronLeft,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Pencil,
  Settings2,
} from 'lucide-react';

export interface StoryItem {
  id: string;
  title: string;
  category: string;
  authorName?: string;
  authorRole?: string;
  iconType?: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  date: string;
  description: string;
  hasUnseen: boolean;
}

const getIconComponent = (type: string) => {
  switch (type) {
    case 'Trophy':
      return <Trophy className="w-5 h-5 text-white" />;
    case 'Briefcase':
      return <Briefcase className="w-5 h-5 text-white" />;
    case 'GraduationCap':
      return <GraduationCap className="w-5 h-5 text-white" />;
    case 'Cpu':
      return <Cpu className="w-5 h-5 text-white" />;
    case 'Award':
      return <Award className="w-5 h-5 text-white" />;
    default:
      return <Sparkles className="w-5 h-5 text-white" />;
  }
};

const DEFAULT_STORIES: StoryItem[] = [
  {
    id: 's1',
    title: 'HOD Desk',
    category: 'Official Notice',
    authorName: 'Dr. K. Srinivas Rao',
    authorRole: 'Head of Department (HOD)',
    iconType: 'GraduationCap',
    date: 'Today',
    description: 'Welcome CSE (AI & ML) students to the new semester! Focus on research projects, patents, and national hackathons.',
    hasUnseen: true,
  },
  {
    id: 's2',
    title: 'Hackathon',
    category: 'Achievement',
    authorName: 'Faculty Innovation Coordinator',
    authorRole: 'Faculty Mentor',
    iconType: 'Trophy',
    date: 'Yesterday',
    description: 'AIML 3rd year team secured 1st prize at Smart India Hackathon internal rounds with their Agri-AI project.',
    hasUnseen: true,
  },
  {
    id: 's3',
    title: 'Placements',
    category: 'Career',
    authorName: 'Training & Placement Cell',
    authorRole: 'Placement Officer',
    iconType: 'Briefcase',
    date: 'Nov 6',
    description: '14 AIML students received pre-placement offers from top AI research & engineering firms.',
    hasUnseen: false,
  },
  {
    id: 's4',
    title: 'AI Tech Fest',
    category: 'Department Event',
    authorName: 'Technical Club Executive',
    authorRole: 'Department Admin',
    iconType: 'Cpu',
    date: 'Nov 5',
    description: 'Annual National AI Symposium & Bot Challenge registrations are now open. Check the Events tab.',
    hasUnseen: true,
  },
  {
    id: 's5',
    title: 'IEEE Workshop',
    category: 'Workshop',
    authorName: 'IEEE Faculty Advisor',
    authorRole: 'Faculty Coordinator',
    iconType: 'Award',
    date: 'Nov 3',
    description: 'Hands-on Generative AI & Deep Learning workshop held with industry experts from Bengaluru.',
    hasUnseen: false,
  },
];

export const StoryHighlights: React.FC<{ stories?: StoryItem[] }> = ({ stories: initialStories }) => {
  const { data: session } = useSession();
  const user = session?.user as any;
  const userRole = user?.role;
  const canPostHighlight = userRole === 'SUPER_ADMIN' || userRole === 'HOD' || userRole === 'FACULTY';

  const [stories, setStories] = useState<StoryItem[]>(initialStories || DEFAULT_STORIES);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);

  // Form State for creating a new highlight
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Official Notice');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('Sparkles');

  // Form State for editing an existing highlight
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Official Notice');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('Sparkles');

  // Helper to persist stories to localStorage
  const saveStories = (updatedStories: StoryItem[]) => {
    if (typeof window !== 'undefined') {
      try {
        const serialized = updatedStories.map(({ icon, ...rest }) => ({
          ...rest,
          iconType: rest.iconType || 'Sparkles',
        }));
        localStorage.setItem('srec_highlights_v3', JSON.stringify(serialized));
      } catch (err) {
        console.error('Failed to save highlights:', err);
      }
    }
  };

  // Load custom stories from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('srec_highlights_v3');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const rehydrated = parsed.map((item: any) => ({
              ...item,
              icon: getIconComponent(item.iconType || 'Sparkles'),
            }));
            setStories(rehydrated);
            return;
          }
        }
        // If not in storage, initialize storage with the default stories
        saveStories(DEFAULT_STORIES);
        setStories(
          DEFAULT_STORIES.map((item) => ({
            ...item,
            icon: getIconComponent(item.iconType || 'Sparkles'),
          }))
        );
      } catch (err) {
        console.error('Failed to load highlights:', err);
      }
    }
  }, []);

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  const nextStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const prevStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    }
  };

  const handleCreateHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    const newStory: StoryItem = {
      id: `story-${Date.now()}`,
      title: formTitle.trim(),
      category: formCategory,
      authorName: user?.name || (userRole === 'HOD' ? 'Head of Department' : 'Faculty Member'),
      authorRole: userRole === 'SUPER_ADMIN' ? 'Super Administrator' : userRole === 'HOD' ? 'HOD' : 'Faculty Mentor',
      iconType: formIcon,
      icon: getIconComponent(formIcon),
      date: 'Just now',
      description: formDescription.trim(),
      hasUnseen: true,
    };

    const updated = [newStory, ...stories];
    setStories(updated);
    saveStories(updated);

    // Reset and close
    setFormTitle('');
    setFormDescription('');
    setIsCreateOpen(false);
  };

  const handleRemoveStory = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!confirm('Are you sure you want to remove this highlight?')) return;

    const updated = stories.filter((s) => s.id !== id);
    setStories(updated);
    saveStories(updated);

    if (activeStoryIndex !== null) {
      setActiveStoryIndex(null);
    }
  };

  const handleStartEdit = (story: StoryItem, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingStoryId(story.id);
    setEditTitle(story.title);
    setEditCategory(story.category);
    setEditDescription(story.description);
    setEditIcon(story.iconType || 'Sparkles');
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStoryId || !editTitle.trim() || !editDescription.trim()) return;

    const updated = stories.map((s) => {
      if (s.id === editingStoryId) {
        return {
          ...s,
          title: editTitle.trim(),
          category: editCategory,
          description: editDescription.trim(),
          iconType: editIcon,
          icon: getIconComponent(editIcon),
        };
      }
      return s;
    });

    setStories(updated);
    saveStories(updated);
    setIsEditOpen(false);
    setEditingStoryId(null);
  };

  return (
    <div className="w-full max-w-full overflow-hidden bg-card rounded-2xl border border-border p-3.5 shadow-subtle mb-5">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Department Highlights</span>
        </div>
        <div className="flex items-center gap-2">
          {canPostHighlight && (
            <>
              <button
                onClick={() => setIsManageMode(!isManageMode)}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 ${
                  isManageMode
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                }`}
                title="Toggle remove controls on highlights"
              >
                <Settings2 className="w-3 h-3" />
                <span>{isManageMode ? 'Done' : 'Manage'}</span>
              </button>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Post Highlight</span>
              </button>
            </>
          )}
          <span className="text-xs text-muted-foreground">Tap to view</span>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar py-1 px-1">
        {/* If authorized (HOD, Faculty, Super Admin), show Add Highlight avatar */}
        {canPostHighlight && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex flex-col items-center gap-1.5 focus:outline-none group flex-shrink-0"
            aria-label="Post a new highlight"
          >
            <div className="p-[2.5px] rounded-full transition-transform duration-200 group-hover:scale-105 border-2 border-dashed border-primary/50 group-hover:border-primary">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
            </div>
            <span className="text-xs font-semibold text-primary truncate max-w-[64px] text-center">
              + Add
            </span>
          </button>
        )}

        {/* Stories List */}
        {stories.map((story, idx) => (
          <div key={story.id} className="relative group flex-shrink-0">
            {/* Quick Remove Button on avatar for authorized users in manage mode or hover */}
            {canPostHighlight && (isManageMode || false) && (
              <button
                onClick={(e) => handleRemoveStory(story.id, e)}
                className="absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 transition-colors"
                title="Remove highlight"
                aria-label={`Remove highlight ${story.title}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => setActiveStoryIndex(idx)}
              className="flex flex-col items-center gap-1.5 focus:outline-none group"
              aria-label={`View highlight: ${story.title}`}
            >
              <div
                className={`p-[2.5px] rounded-full transition-transform duration-200 group-hover:scale-105 ${
                  story.hasUnseen
                    ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
                    : 'bg-border'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-card p-0.5 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center shadow-inner">
                    {story.icon || getIconComponent(story.iconType || 'Sparkles')}
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-foreground truncate max-w-[64px] text-center">
                {story.title}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Create Highlight Modal (HOD / Faculty / Super Admin only) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Post Department Highlight</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Posting as: {user?.name || 'Authority'} ({userRole})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHighlight} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">Highlight Title</label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  placeholder="e.g. SIH 2026 Winner, HOD Notice"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Official Notice">Official Notice</option>
                    <option value="Achievement">Achievement</option>
                    <option value="Career">Career & Placement</option>
                    <option value="Department Event">Department Event</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Research">Research & Grants</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Icon Style</label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Sparkles">Sparkles (General)</option>
                    <option value="GraduationCap">HOD / Academic</option>
                    <option value="Trophy">Trophy / Award</option>
                    <option value="Briefcase">Placement / Job</option>
                    <option value="Cpu">Tech / Hackathon</option>
                    <option value="Award">Certificate / Honor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Highlight Description</label>
                <textarea
                  required
                  rows={3}
                  maxLength={200}
                  placeholder="Write the highlight summary (max 200 characters)..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Publish Story</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Highlight Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Modify Department Highlight</h3>
                  <p className="text-[11px] text-muted-foreground">Update title, text, or category</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">Highlight Title</label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Official Notice">Official Notice</option>
                    <option value="Achievement">Achievement</option>
                    <option value="Career">Career & Placement</option>
                    <option value="Department Event">Department Event</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Research">Research & Grants</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Icon Style</label>
                  <select
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Sparkles">Sparkles (General)</option>
                    <option value="GraduationCap">HOD / Academic</option>
                    <option value="Trophy">Trophy / Award</option>
                    <option value="Briefcase">Placement / Job</option>
                    <option value="Cpu">Tech / Hackathon</option>
                    <option value="Award">Certificate / Honor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Highlight Description</label>
                <textarea
                  required
                  rows={3}
                  maxLength={200}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instagram Story Lightbox Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-card rounded-3xl overflow-hidden border border-border shadow-2xl flex flex-col max-h-[85vh]">
            {/* Story Progress Bar */}
            <div className="absolute top-0 left-0 right-0 p-3 z-10 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex gap-1.5 mb-2.5">
                {stories.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i === activeStoryIndex
                        ? 'bg-white'
                        : activeStoryIndex !== null && i < activeStoryIndex
                        ? 'bg-white/60'
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-xs">
                    {activeStory.authorRole ? activeStory.authorRole.slice(0, 3).toUpperCase() : 'CSE'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-none">{activeStory.title}</p>
                    <p className="text-[10px] text-white/80 mt-0.5">
                      {activeStory.category} • {activeStory.date}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStoryIndex(null)}
                  className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white"
                  aria-label="Close Highlight"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Story Card Body */}
            <div className="pt-24 pb-8 px-6 flex-1 flex flex-col justify-center items-center text-center bg-gradient-to-b from-primary/10 via-background to-card min-h-[340px]">
              <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center mb-5 text-primary scale-125">
                {activeStory.icon || getIconComponent(activeStory.iconType || 'Sparkles')}
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary mb-2">
                {activeStory.category}
              </span>
              <h3 className="text-xl font-bold text-foreground mb-3">{activeStory.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-4">
                {activeStory.description}
              </p>

              {/* Attribution Footer */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-[11px] text-muted-foreground mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Posted by <strong className="text-foreground">{activeStory.authorName || 'Department Authority'}</strong> ({activeStory.authorRole || 'Official'})
                </span>
              </div>

              {/* Authorized Remove & Edit Action Bar */}
              {canPostHighlight && (
                <div className="flex items-center gap-2 pt-2 border-t border-border/60 w-full justify-center">
                  <button
                    type="button"
                    onClick={(e) => handleStartEdit(activeStory, e)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Modify Highlight</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleRemoveStory(activeStory.id, e)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Highlight</span>
                  </button>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-card">
              <button
                onClick={prevStory}
                disabled={activeStoryIndex === 0}
                className="btn-ghost disabled:opacity-30 text-xs"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </button>
              <button
                onClick={nextStory}
                className="btn-primary text-xs py-2 px-4"
              >
                {activeStoryIndex !== null && activeStoryIndex < stories.length - 1 ? (
                  <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                ) : (
                  'Done'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryHighlights;
