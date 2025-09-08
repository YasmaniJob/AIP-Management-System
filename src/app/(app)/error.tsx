'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { clearUserSessionAction } from '@/lib/actions/auth';
import { colors } from '@/lib/colors';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter();
  
  useEffect(() => {
    console.error('App layout error:', error);
    
    // If it's a user authentication error, clear session automatically
    if (
      error.message.includes('user') || 
      error.message.includes('auth') ||
      error.message.includes('PGRST116') ||
      error.message.includes('Cannot coerce the result to a single JSON object')
    ) {
      // Clear session and redirect
      clearUserSessionAction().then((result) => {
        if (result.success && result.redirect) {
          router.push(result.redirect);
        }
      });
    }
  }, [error, router]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={cn("mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full", colors.error.bg)}>
            <AlertTriangle className={cn("h-6 w-6", colors.error.icon)} />
          </div>
          <CardTitle>Error de Sesión</CardTitle>
          <CardDescription>
            Ha ocurrido un problema con tu sesión. Serás redirigido al inicio de sesión.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={reset} 
            variant="outline" 
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Intentar de nuevo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}