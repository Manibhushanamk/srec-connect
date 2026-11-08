'use client';

import React, { useState } from 'react';
import { Sparkles, Trophy, Briefcase, GraduationCap, Award, Cpu, X, ChevronRight, ChevronLeft } from 'lucide-react';

export interface StoryItem {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  imageUrl?: string;
  date: string;
  description: string;
  hasUnseen: boolean;
}

const DEFAULT_STORIES: StoryItem[] = [
  {
    id: 's1',
    title: 'HOD Desk',
    category: 'Official Notice',
    icon: <GraduationCap className="w-5 h-5 text-white" />,
    date: 'Today',
    description: 'Welcome CSE (AI & ML) students to the new semester! Focus on research projects and national hackathons.',
    hasUnseen: true,
  },
  {
    id: 's2',
    title: 'Hackathon',
    category: 'Achievement',
    icon: <Trophy className="w-5 h-5 text-white" />,
    date: 'Yesterday',
    description: 'AIML 3rd year team secured 1st prize at Smart India Hackathon internal rounds with their Agri-AI project.',
    hasUnseen: true,
  },
  {
    id: 's3',
    title: 'Placements',
    category: 'Career',
    icon: <Briefcase className="w-5 h-5 text-white" />,
    date: 'Nov 6',
    description: '14 AIML students received pre-placement offers from top AI research & engineering firms.',
    hasUnseen: false,
  },
  {
    id: 's4',
    title: 'AI Tech Fest',
    category: 'Department Event',
    icon: <Cpu className="w-5 h-5 text-white" />,
    date: 'Nov 5',
    description: 'Annual National AI Symposium & Bot Challenge registrations are now open. Check the Events tab.',
    hasUnseen: true,
  },
  {
    id: 's5',
    title: 'IEEE Workshop',
    category: 'Workshop',
    icon: <Award className="w-5 h-5 text-white" />,
    date: 'Nov 3',
    description: 'Hands-on Generative AI & Deep Learning workshop held with industry experts from Bengaluru.',
    hasUnseen: false,
  },
];

export const StoryHighlights: React.FC<{ stories?: StoryItem[] }> = ({ stories = DEFAULT_STORIES }) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

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

  return (
    <div className="w-full bg-card rounded-2xl border border-border p-3.5 shadow-subtle mb-5">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Department Highlights</span>
        </div>
        <span className="text-xs text-muted-foreground">Tap to view</span>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar py-1 px-1">
        {stories.map((story, idx) => (
          <button
            key={story.id}
            onClick={() => setActiveStoryIndex(idx)}
            className="flex flex-col items-center gap-1.5 focus:outline-none group flex-shrink-0"
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
                  {story.icon}
                </div>
              </div>
            </div>
            <span className="text-xs font-medium text-foreground truncate max-w-[64px] text-center">
              {story.title}
            </span>
          </button>
        ))}
      </div>

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
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    AIML
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-none">{activeStory.title}</p>
                    <p className="text-[10px] text-white/70">{activeStory.category} • {activeStory.date}</p>
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
              <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center mb-6 text-primary scale-125">
                {activeStory.icon}
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary mb-3">
                {activeStory.category}
              </span>
              <h3 className="text-xl font-bold text-foreground mb-3">{activeStory.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                {activeStory.description}
              </p>
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
