import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', glow = false, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center font-mono tracking-wider transition-all duration-200';
    
    const variants = {
      default: 'bg-slate-700/50 text-slate-300 border border-slate-600/50',
      brand: 'bg-brand-500/20 text-brand-400 border border-brand-500/30',
      cyan: 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30',
      emerald: 'bg-neon-emerald/20 text-neon-emerald border border-neon-emerald/30',
      amber: 'bg-neon-amber/20 text-neon-amber border border-neon-amber/30',
      rose: 'bg-neon-rose/20 text-neon-rose border border-neon-rose/30',
      violet: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
      slate: 'bg-slate-700/50 text-slate-300 border border-slate-600/50',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-[10px]',
      md: 'px-2.5 py-0.5 text-[11px]',
      lg: 'px-3 py-1 text-[12px]',
    };

    const glowStyles = glow 
      ? 'shadow-[0_0_8px_-2px_currentColor]' 
      : '';

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], glowStyles, className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

interface StatusBadgeProps {
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  DRAFT: { variant: 'slate' as const, label: 'Draft' },
  PENDING: { variant: 'amber' as const, label: 'Pending Review' },
  PUBLISHED: { variant: 'emerald' as const, label: 'Published' },
  REJECTED: { variant: 'rose' as const, label: 'Rejected' },
  UPCOMING: { variant: 'cyan' as const, label: 'Upcoming' },
  COMPLETED: { variant: 'emerald' as const, label: 'Completed' },
  CANCELLED: { variant: 'rose' as const, label: 'Cancelled' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant} size={size} glow>{config.label}</Badge>;
}