'use client';

import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '@/components/layout/ThemeProvider';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={`min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] p-2 inline-flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground bg-secondary/80 hover:bg-secondary border border-border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
      aria-label={`Current theme: ${theme}. Click to switch theme.`}
      title={`Theme: ${theme.toUpperCase()}`}
    >
      {theme === 'system' ? (
        <Laptop className="w-4 h-4 text-primary" />
      ) : resolvedTheme === 'dark' ? (
        <Moon className="w-4 h-4 text-blue-400" />
      ) : (
        <Sun className="w-4 h-4 text-amber-500" />
      )}
    </button>
  );
};

export default ThemeToggle;
