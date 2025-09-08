// src/components/atoms/loading-state.tsx
import React from 'react';
import { LoadingSpinner } from './loading-spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { colors } from '@/lib/colors';

interface LoadingStateProps {
  text?: string;
  description?: string;
  variant?: 'default' | 'minimal' | 'card' | 'skeleton';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  skeletonLines?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  text = 'Cargando...',
  description,
  variant = 'default',
  size = 'md',
  className,
  skeletonLines = 3,
}) => {
  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: skeletonLines }).map((_, i) => (
          <Skeleton key={i} className={cn(
            'h-4 rounded',
            i === 0 && 'w-3/4',
            i === 1 && 'w-full',
            i === 2 && 'w-1/2',
            i > 2 && 'w-2/3'
          )} />
        ))}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        <LoadingSpinner size={size} />
        {text && (
          <span className={cn('text-sm', colors.neutral.textMuted)}>{text}</span>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <LoadingSpinner size={size} />
          </div>
          <CardTitle>{text}</CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[200px] p-4', className)}>
      <div className="text-center">
        <div className="mb-4">
          <LoadingSpinner size={size} />
        </div>
        <h3 className="text-lg font-medium mb-2">{text}</h3>
        {description && (
          <p className={cn('text-sm', colors.neutral.textMuted)}>{description}</p>
        )}
      </div>
    </div>
  );
};

// Specialized loading states for common use cases
export const TableLoadingState: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className,
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const FormLoadingState: React.FC<{ fields?: number; className?: string }> = ({
  fields = 4,
  className,
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
  </div>
);

export const CardLoadingState: React.FC<{ cards?: number; className?: string }> = ({
  cards = 3,
  className,
}) => (
  <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
    {Array.from({ length: cards }).map((_, index) => (
      <Card key={index}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default LoadingState;