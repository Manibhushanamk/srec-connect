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
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-space-900 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 focus:ring-brand-500/50 shadow-brand-500/20',
      secondary: 'bg-space-800/60 text-slate-100 border border-slate-700/50 hover:bg-space-700/80 hover:border-brand-500/50 focus:ring-brand-500/50',
      cyan: 'bg-neon-cyan text-space-950 hover:bg-neon-cyan/90 active:bg-neon-cyan focus:ring-neon-cyan/50 shadow-neon-cyan/20',
      outline: 'bg-transparent text-slate-300 border border-slate-700/50 hover:bg-space-800/50 hover:text-white hover:border-brand-500/50 focus:ring-brand-500/50',
      danger: 'bg-neon-rose text-white hover:bg-neon-rose/90 active:bg-neon-rose focus:ring-neon-rose/50 shadow-neon-rose/20',
      success: 'bg-neon-emerald text-white hover:bg-neon-emerald/90 active:bg-neon-emerald focus:ring-neon-emerald/50 shadow-neon-emerald/20',
      ghost: 'bg-transparent text-slate-300 hover:bg-space-800/50 hover:text-white focus:ring-brand-500/50',
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