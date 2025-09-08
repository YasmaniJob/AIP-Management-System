// src/components/atoms/loading-spinner.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeMap = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text
}) => {
  if (text) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className={cn(sizeMap[size], 'animate-spin', className)} />
        <span className="text-sm text-muted-foreground">{text}</span>
      </div>
    );
  }

  return (
    <Loader2 className={cn(sizeMap[size], 'animate-spin', className)} />
  );
};

export default LoadingSpinner;