// src/hooks/use-action-handlers.ts
'use client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface UseActionHandlersOptions {
  successMessage?: string;
  errorMessage?: string;
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useActionHandlers(options: UseActionHandlersOptions = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (
    action: () => Promise<any>,
    customOptions?: Partial<UseActionHandlersOptions>
  ) => {
    const opts = { ...options, ...customOptions };
    
    try {
      setIsLoading(true);
      const result = await action();
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      if (opts.successMessage) {
        toast({
          title: 'Éxito',
          description: opts.successMessage,
        });
      }
      
      if (opts.redirectTo) {
        router.push(opts.redirectTo);
      } else {
        router.refresh();
      }
      
      opts.onSuccess?.();
      return result;
    } catch (error: any) {
      const errorMsg = opts.errorMessage || error.message || 'Ha ocurrido un error';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      
      opts.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleAction,
    isLoading,
    router,
    toast
  };
}

export default useActionHandlers;