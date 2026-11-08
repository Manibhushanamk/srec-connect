import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { Award, Users, Calendar, FileText, Search, Plus, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'cyan';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const iconMap: Record<string, ReactNode> = {
  achievements: <Award className="w-12 h-12 text-neon-cyan/50" />,
  students: <Users className="w-12 h-12 text-neon-emerald/50" />,
  events: <Calendar className="w-12 h-12 text-neon-amber/50" />,
  faculty: <Users className="w-12 h-12 text-brand-400/50" />,
  search: <Search className="w-12 h-12 text-slate-500/50" />,
  default: <Sparkles className="w-12 h-12 text-brand-400/50" />,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className={cn(
        'relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border border-dashed border-slate-700/50',
        'bg-gradient-to-br from-space-800/50 to-space-900/50'
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 to-neon-emerald/10 rounded-2xl" />
        {icon || iconMap.default}
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-400 text-sm max-w-sm mb-6">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
                action.variant === 'cyan'
                  ? 'bg-neon-cyan text-space-950 hover:bg-neon-cyan/90'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
              )}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm text-slate-300 bg-space-800/60 border border-slate-700/50 hover:bg-space-700/80 hover:text-white transition-all duration-200"
            >
              {secondaryAction.label}
            </button>
          )}
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
  action?: EmptyStateProps['action'];
  secondaryAction?: EmptyStateProps['secondaryAction'];
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