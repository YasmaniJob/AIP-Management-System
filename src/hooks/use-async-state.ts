// src/hooks/use-async-state.ts
'use client';
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAsyncStateOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
}

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
  isError: boolean;
}

export function useAsyncState<T = any>(options: UseAsyncStateOptions = {}) {
  const { toast } = useToast();
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showToast = true,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
    isError: false,
  });

  const execute = useCallback(
    async (asyncFunction: () => Promise<T>) => {
      setState({
        data: null,
        isLoading: true,
        error: null,
        isSuccess: false,
        isError: false,
      });

      try {
        const result = await asyncFunction();
        
        setState({
          data: result,
          isLoading: false,
          error: null,
          isSuccess: true,
          isError: false,
        });

        if (showToast && successMessage) {
          toast({
            title: 'Éxito',
            description: successMessage,
          });
        }

        onSuccess?.(result);
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        
        setState({
          data: null,
          isLoading: false,
          error: errorObj,
          isSuccess: false,
          isError: true,
        });

        if (showToast) {
          toast({
            title: 'Error',
            description: errorMessage || errorObj.message || 'Ha ocurrido un error',
            variant: 'destructive',
          });
        }

        onError?.(errorObj);
        throw errorObj;
      }
    },
    [toast, successMessage, errorMessage, showToast, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
      isSuccess: false,
      isError: false,
    });
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      isSuccess: true,
      isError: false,
    }));
  }, []);

  const setError = useCallback((error: Error | string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    setState(prev => ({
      ...prev,
      error: errorObj,
      isError: true,
      isSuccess: false,
      isLoading: false,
    }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
}

// Specialized hook for form submissions
export function useFormSubmission<T = any>(options: UseAsyncStateOptions = {}) {
  const asyncState = useAsyncState<T>({
    successMessage: 'Operación completada exitosamente',
    errorMessage: 'Error al procesar la solicitud',
    ...options,
  });

  const submit = useCallback(
    async (formData: any, submitFunction: (data: any) => Promise<T>) => {
      return asyncState.execute(() => submitFunction(formData));
    },
    [asyncState.execute]
  );

  return {
    ...asyncState,
    submit,
  };
}

// Specialized hook for data fetching
export function useDataFetch<T = any>(options: UseAsyncStateOptions = {}) {
  const asyncState = useAsyncState<T>({
    showToast: false, // Don't show toast for data fetching by default
    ...options,
  });

  const fetch = useCallback(
    async (fetchFunction: () => Promise<T>) => {
      return asyncState.execute(fetchFunction);
    },
    [asyncState.execute]
  );

  const refetch = useCallback(
    async (fetchFunction: () => Promise<T>) => {
      return asyncState.execute(fetchFunction);
    },
    [asyncState.execute]
  );

  return {
    ...asyncState,
    fetch,
    refetch,
  };
}

export default useAsyncState;