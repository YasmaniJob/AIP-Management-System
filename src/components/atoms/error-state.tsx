// src/components/atoms/error-state.tsx
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { colors } from '@/lib/colors';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showGoHome?: boolean;
  variant?: 'default' | 'minimal' | 'card';
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Ha ocurrido un error',
  description = 'Algo salió mal. Por favor, inténtalo de nuevo.',
  error,
  onRetry,
  onGoHome,
  showRetry = true,
  showGoHome = false,
  variant = 'default',
  className,
}) => {
  const errorMessage = error instanceof Error ? error.message : error;
  
  if (variant === 'minimal') {
    return (
      <div className={cn('flex flex-col items-center justify-center p-6 text-center', className)}>
        <AlertTriangle className={cn('h-8 w-8 mb-3', colors.error.icon)} />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className={cn('text-sm mb-4', colors.neutral.textMuted)}>{description}</p>
        {errorMessage && (
          <p className={cn('text-xs mb-4 font-mono p-2 rounded', colors.error.bg, colors.error.text)}>
            {errorMessage}
          </p>
        )}
        <div className="flex gap-2">
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          )}
          {showGoHome && onGoHome && (
            <Button onClick={onGoHome} variant="ghost" size="sm">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardHeader className="text-center">
          <div className={cn('mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full', colors.error.bg)}>
            <AlertTriangle className={cn('h-6 w-6', colors.error.icon)} />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          {errorMessage && (
            <div className={cn('text-xs font-mono p-2 rounded mt-2', colors.error.bg, colors.error.text)}>
              {errorMessage}
            </div>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-2">
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar de nuevo
            </Button>
          )}
          {showGoHome && onGoHome && (
            <Button onClick={onGoHome} variant="ghost" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={cn('flex items-center justify-center min-h-[200px] p-4', className)}>
      <div className="text-center max-w-md">
        <div className={cn('mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full', colors.error.bg)}>
          <AlertTriangle className={cn('h-8 w-8', colors.error.icon)} />
        </div>
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className={cn('text-sm mb-4', colors.neutral.textMuted)}>{description}</p>
        {errorMessage && (
          <div className={cn('text-xs font-mono p-3 rounded mb-4', colors.error.bg, colors.error.text)}>
            {errorMessage}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar de nuevo
            </Button>
          )}
          {showGoHome && onGoHome && (
            <Button onClick={onGoHome} variant="ghost">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;