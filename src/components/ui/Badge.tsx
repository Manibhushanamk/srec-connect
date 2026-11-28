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
      default: 'bg-muted text-muted-foreground border border-border',
      brand: 'bg-primary/12 text-[#C2410C] dark:text-[#FB923C] border border-primary/30',
      cyan: 'bg-primary/15 text-[#C2410C] dark:text-[#F97316] border border-primary/35',
      emerald: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
      amber: 'bg-[#CA8A04]/15 text-[#92400E] dark:bg-[#FACC15]/15 dark:text-[#FACC15] border border-[#CA8A04]/35 dark:border-[#FACC15]/35',
      rose: 'bg-rose-500/12 text-rose-700 dark:text-rose-400 border border-rose-500/30',
      violet: 'bg-violet-500/12 text-violet-700 dark:text-violet-400 border border-violet-500/30',
      slate: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border border-zinc-500/20',
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
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { variant: 'slate' | 'amber' | 'emerald' | 'rose' | 'cyan' | 'brand'; label: string }> = {
  DRAFT: { variant: 'slate', label: 'Draft' },
  PENDING: { variant: 'amber', label: 'Pending Review' },
  UNDER_REVIEW: { variant: 'amber', label: 'Under Review' },
  APPROVED: { variant: 'emerald', label: 'Approved' },
  PUBLISHED: { variant: 'emerald', label: 'Published' },
  REJECTED: { variant: 'rose', label: 'Rejected' },
  RESUBMISSION_REQUIRED: { variant: 'amber', label: 'Resubmission Required' },
  WITHDRAWN: { variant: 'slate', label: 'Withdrawn' },
  UPCOMING: { variant: 'cyan', label: 'Upcoming' },
  COMPLETED: { variant: 'emerald', label: 'Completed' },
  CANCELLED: { variant: 'rose', label: 'Cancelled' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || { variant: 'slate', label: status };
  return <Badge variant={config.variant} size={size} glow>{config.label}</Badge>;
}