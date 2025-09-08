// src/hooks/use-form-handler.ts
import { useState, useTransition } from 'react';
import { useForm, UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from './use-toast';

interface UseFormHandlerOptions<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseFormHandlerReturn<T extends FieldValues> {
  form: UseFormReturn<T>;
  isSubmitting: boolean;
  handleSubmit: (action: (data: T) => Promise<{ error?: string; success?: boolean }>) => (data: T) => Promise<void>;
  resetForm: () => void;
}

/**
 * Custom hook for handling forms with consistent error handling and loading states
 * Eliminates duplication across form components
 */
export function useFormHandler<T extends FieldValues>({
  schema,
  defaultValues,
  onSuccess,
  onError,
  successMessage = 'Operación completada exitosamente',
  errorMessage = 'Ocurrió un error inesperado'
}: UseFormHandlerOptions<T>): UseFormHandlerReturn<T> {
  const { toast } = useToast();
  const [isSubmitting, startTransition] = useTransition();
  
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues
  });

  const handleSubmit = (action: (data: T) => Promise<{ error?: string; success?: boolean }>) => {
    return async (data: T) => {
      startTransition(async () => {
        try {
          const result = await action(data);
          
          if (result.error) {
            toast({
              title: 'Error',
              description: result.error,
              variant: 'destructive'
            });
            onError?.(result.error);
          } else {
            toast({
              title: 'Éxito',
              description: successMessage,
              variant: 'default'
            });
            form.reset();
            onSuccess?.(data);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : errorMessage;
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive'
          });
          onError?.(message);
        }
      });
    };
  };

  const resetForm = () => {
    form.reset(defaultValues);
  };

  return {
    form,
    isSubmitting,
    handleSubmit,
    resetForm
  };
}

/**
 * Hook for handling delete operations with confirmation
 */
export function useDeleteHandler() {
  const { toast } = useToast();
  const [isDeleting, startDeleteTransition] = useTransition();
  
  const handleDelete = (action: () => Promise<{ error?: string; success?: boolean }>) => {
    return () => {
      startDeleteTransition(async () => {
        try {
          const result = await action();
          
          if (result.error) {
            toast({
              title: 'Error',
              description: result.error,
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Éxito',
              description: 'Elemento eliminado exitosamente',
              variant: 'default'
            });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al eliminar';
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive'
          });
        }
      });
    };
  };

  return {
    isDeleting,
    handleDelete
  };
}

/**
 * Hook for handling async operations with loading states
 */
export function useAsyncOperation() {
  const { toast } = useToast();
  const [isLoading, startTransition] = useTransition();
  
  const execute = (action: () => Promise<{ error?: string; success?: boolean }>, options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
  }) => {
    return () => {
      startTransition(async () => {
        try {
          const result = await action();
          
          if (result.error) {
            toast({
              title: 'Error',
              description: result.error,
              variant: 'destructive'
            });
            options?.onError?.(result.error);
          } else {
            if (options?.successMessage) {
              toast({
                title: 'Éxito',
                description: options.successMessage,
                variant: 'default'
              });
            }
            options?.onSuccess?.();
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : (options?.errorMessage || 'Ocurrió un error inesperado');
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive'
          });
          options?.onError?.(message);
        }
      });
    };
  };

  return {
    isLoading,
    execute
  };
}