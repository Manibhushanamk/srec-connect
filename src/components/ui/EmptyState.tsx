import React, { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Award, Users, Calendar, FileText, Search, Plus, Sparkles } from 'lucide-react';

export interface EmptyAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'cyan' | 'secondary';
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: EmptyAction;
  secondaryAction?: EmptyAction;
  className?: string;
}

const iconMap: Record<string, ReactNode> = {
  achievements: <Award className="w-12 h-12 text-cyan-500" />,
  students: <Users className="w-12 h-12 text-emerald-500" />,
  events: <Calendar className="w-12 h-12 text-amber-500" />,
  faculty: <Users className="w-12 h-12 text-primary" />,
  search: <Search className="w-12 h-12 text-muted-foreground" />,
  default: <Sparkles className="w-12 h-12 text-primary" />,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const renderActionButton = (act: EmptyAction, isSecondary = false) => {
    const btnClass = cn(
      'w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 inline-flex items-center justify-center shadow-sm',
      isSecondary
        ? 'text-foreground bg-muted border border-border hover:bg-muted/80'
        : act.variant === 'cyan'
        ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
        : 'bg-primary text-white hover:bg-primary/90'
    );

    if (act.href) {
      return (
        <Link href={act.href} className={btnClass}>
          {act.label}
        </Link>
      );
    }

    return (
      <button onClick={act.onClick} className={btnClass}>
        {act.label}
      </button>
    );
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-14 px-6 text-center glass-card', className)}>
      <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border border-dashed border-border bg-muted/60">
        <div className="absolute inset-0 bg-primary/5 rounded-2xl" />
        {icon || iconMap.default}
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1.5">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-xs sm:text-sm max-w-md mb-6 leading-relaxed">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
          {action && renderActionButton(action, false)}
          {secondaryAction && renderActionButton(secondaryAction, true)}
        </div>
      )}
    </div>
  );
}

export function EmptyStatePreset({
  type,
  title,
  description,
  action,
  secondaryAction,
  className,
}: {
  type: 'achievements' | 'students' | 'events' | 'faculty' | 'search' | 'default';
  title?: string;
  description?: string;
  action?: EmptyAction;
  secondaryAction?: EmptyAction;
  className?: string;
}) {
  const presets = {
    achievements: {
      title: 'No Achievements Yet',
      description: 'Be the first to submit an honor or achievement for your department.',
      icon: iconMap.achievements,
    },
    students: {
      title: 'No Students Found',
      description: 'Add students to the directory or adjust your filters.',
      icon: iconMap.students,
    },
    events: {
      title: 'No Events Scheduled',
      description: 'Create your first event to get started.',
      icon: iconMap.events,
    },
    faculty: {
      title: 'No Faculty Members',
      description: 'Add faculty profiles to showcase your department expertise.',
      icon: iconMap.faculty,
    },
    search: {
      title: 'No Results Found',
      description: 'Try adjusting your search or filter criteria.',
      icon: iconMap.search,
    },
    default: {
      title: 'No Data Available',
      description: 'There is nothing to display at the moment.',
      icon: iconMap.default,
    },
  };

  const preset = presets[type];
  return (
    <EmptyState
      icon={preset.icon}
      title={title || preset.title}
      description={description || preset.description}
      action={action}
      secondaryAction={secondaryAction}
      className={className}
    />
  );
}
