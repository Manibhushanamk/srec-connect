import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'cyan' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    children,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary text-white hover:bg-[#C2410C] dark:hover:bg-[#FB923C] active:scale-[0.99] focus:ring-primary/50 shadow-[0_4px_14px_-3px_rgba(234,88,12,0.34)] dark:shadow-[0_4px_18px_-3px_rgba(249,115,22,0.38)] font-semibold',
      secondary: 'bg-secondary text-secondary-foreground border border-border hover:bg-muted focus:ring-primary/50 font-semibold',
      cyan: 'bg-primary/15 text-[#C2410C] dark:text-[#FB923C] border border-primary/40 hover:bg-primary/25 active:scale-[0.99] focus:ring-primary/50 shadow-sm font-semibold',
      outline: 'bg-transparent text-foreground border border-border hover:bg-muted focus:ring-primary/50 font-medium',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500/50 shadow-sm font-semibold',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500/50 shadow-sm font-semibold',
      ghost: 'bg-transparent text-foreground/80 hover:bg-muted hover:text-foreground focus:ring-primary/50',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-base gap-2',
      lg: 'px-7 py-3.5 text-lg gap-2.5',
      xl: 'px-10 py-4 text-xl gap-3',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';