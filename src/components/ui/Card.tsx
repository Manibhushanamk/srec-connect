import { cn } from '@/lib/utils';
import { ReactNode, forwardRef, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'bento' | 'elevated';
  hover?: boolean;
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', hover = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl transition-all duration-300';
    
    const variants = {
      default: 'bg-card text-card-foreground backdrop-blur-md border border-border shadow-subtle',
      glass: 'bg-card/85 text-card-foreground backdrop-blur-md border border-border/80 shadow-xs',
      bento: 'bg-card text-card-foreground border border-border shadow-subtle relative overflow-hidden',
      elevated: 'bg-card text-card-foreground border border-border shadow-card',
    };

    const hoverStyles = hover 
      ? 'hover:border-primary/50 hover:shadow-card hover:scale-[1.01]' 
      : '';

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], hoverStyles, className)}
        {...props}
      >
        {variant === 'bento' && (
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/10 via-transparent to-cyan-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4 border-b border-border', className)} {...props} />
  )
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-bold text-foreground', className)} {...props} />
  )
);

CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground mt-1', className)} {...props} />
  )
);

CardDescription.displayName = 'CardDescription';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4 border-t border-slate-700/30 flex items-center gap-2', className)} {...props} />
  )
);

CardFooter.displayName = 'CardFooter';