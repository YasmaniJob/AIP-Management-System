'use client';
import { useEffect } from 'react';
import { clearUserSessionAction } from '@/lib/actions/auth';
import { colors } from '@/lib/colors';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ErrorHandlerProps {
  error?: Error | null;
  reset?: () => void;
}

export function ErrorHandler({ error, reset }: ErrorHandlerProps) {
  const router = useRouter();
  
  useEffect(() => {
    if (error) {
      console.error('Layout error detected:', error);
      // If it's a user authentication error, clear session
      if (error.message.includes('user') || error.message.includes('auth')) {
        clearUserSessionAction().then((result) => {
          if (result.success && result.redirect) {
            router.push(result.redirect);
          }
        });
      }
    }
  }, [error, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Algo salió mal</h2>
          <p className={cn("mb-4", colors.neutral.textMuted)}>Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return null;
}