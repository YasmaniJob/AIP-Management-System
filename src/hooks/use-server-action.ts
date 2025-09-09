'use client';
// src/hooks/use-server-action.ts
// Hook para ejecutar Server Actions desde componentes cliente de manera segura

import { useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export type ServerActionResult<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
  redirect?: string;
};

type ServerAction<T extends any[]> = (...args: T) => Promise<ServerActionResult>;

export function useServerAction<T extends any[]>(
  action: ServerAction<T>,
  options?: {
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const execute = (...args: T) => {
    startTransition(async () => {
      try {
        const result = await action(...args);
        
        if (result.success) {
          if (options?.successMessage) {
            toast.success(options.successMessage);
          }
          
          // Manejar redirección del lado del cliente
          if (result.redirect) {
            router.push(result.redirect);
          }
          
          // Pasar el resultado completo, no solo result.data
          options?.onSuccess?.(result);
        } else {
          const errorMsg = result.error || options?.errorMessage || 'Ocurrió un error';
          toast.error(errorMsg);
          options?.onError?.(errorMsg);
        }
      } catch (error) {
        console.error('❌ [CATCH] Server action error:', error);
        console.error('❌ [CATCH] Error stack:', error instanceof Error ? error.stack : 'No stack available');
        console.error('❌ [CATCH] Error message:', error instanceof Error ? error.message : String(error));
        console.error('❌ [CATCH] Error type:', typeof error);
        console.error('❌ [CATCH] Error constructor:', error?.constructor?.name);
        
        let errorMsg = 'Error desconocido';
        
        if (error instanceof Error) {
          errorMsg = error.message;
        } else if (typeof error === 'string') {
          errorMsg = error;
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMsg = String(error.message);
        } else {
          errorMsg = String(error);
        }
        
        // Si el mensaje sigue siendo genérico, usar el errorMessage de opciones
        if (errorMsg === 'Ocurrió un error' || errorMsg === 'Error desconocido') {
          errorMsg = options?.errorMessage || 'Error en la operación del servidor';
        }
        
        console.error('❌ [FINAL] Error message to show:', errorMsg);
        toast.error(errorMsg);
        options?.onError?.(errorMsg);
      }
    });
  };

  return {
    execute,
    isPending
  };
}

// Hook específico para acciones que requieren confirmación
export function useServerActionWithConfirmation<T extends any[]>(
  action: ServerAction<T>,
  confirmationMessage: string,
  options?: {
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const { execute, isPending } = useServerAction(action, options);

  const executeWithConfirmation = (...args: T) => {
    if (window.confirm(confirmationMessage)) {
      execute(...args);
    }
  };

  return {
    execute: executeWithConfirmation,
    isPending
  };
}