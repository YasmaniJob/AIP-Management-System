// src/hooks/use-form-state.ts
'use client';
import { useState, useCallback } from 'react';
import { z } from 'zod';
import { useActionHandlers } from './use-action-handlers';
import { appConfig } from '@/lib/config/app-config';

interface UseFormStateOptions<T> {
  schema?: z.ZodSchema<T>;
  initialValues?: Partial<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
  redirectTo?: string;
}

interface FormState<T> {
  values: Partial<T>;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
}

export function useFormState<T extends Record<string, any>>(
  options: UseFormStateOptions<T> = {}
) {
  const { handleAction, isLoading } = useActionHandlers({
    successMessage: options.successMessage,
    errorMessage: options.errorMessage,
    redirectTo: options.redirectTo,
    onSuccess: options.onSuccess,
    onError: options.onError,
  });

  const [formState, setFormState] = useState<FormState<T>>(() => ({
    values: options.initialValues || {},
    errors: {},
    touched: {},
    isValid: false,
    isDirty: false,
  }));

  const validateField = useCallback(
    (name: keyof T, value: any): string | undefined => {
      if (!options.schema) return undefined;

      try {
        const fieldSchema = options.schema.shape?.[name as string];
        if (fieldSchema) {
          fieldSchema.parse(value);
        }
        return undefined;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.errors[0]?.message;
        }
        return 'Valor inválido';
      }
    },
    [options.schema]
  );

  const validateForm = useCallback(
    (values: Partial<T>): Partial<Record<keyof T, string>> => {
      if (!options.schema) return {};

      try {
        options.schema.parse(values);
        return {};
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors: Partial<Record<keyof T, string>> = {};
          error.errors.forEach((err) => {
            if (err.path.length > 0) {
              const field = err.path[0] as keyof T;
              errors[field] = err.message;
            }
          });
          return errors;
        }
        return {};
      }
    },
    [options.schema]
  );

  const setValue = useCallback(
    (name: keyof T, value: any) => {
      setFormState((prev) => {
        const newValues = { ...prev.values, [name]: value };
        const fieldError = validateField(name, value);
        const newErrors = { ...prev.errors };
        
        if (fieldError) {
          newErrors[name] = fieldError;
        } else {
          delete newErrors[name];
        }

        const allErrors = validateForm(newValues);
        const isValid = Object.keys(allErrors).length === 0;
        const isDirty = JSON.stringify(newValues) !== JSON.stringify(options.initialValues || {});

        return {
          values: newValues,
          errors: newErrors,
          touched: { ...prev.touched, [name]: true },
          isValid,
          isDirty,
        };
      });
    },
    [validateField, validateForm, options.initialValues]
  );

  const setValues = useCallback(
    (values: Partial<T>) => {
      setFormState((prev) => {
        const newValues = { ...prev.values, ...values };
        const errors = validateForm(newValues);
        const isValid = Object.keys(errors).length === 0;
        const isDirty = JSON.stringify(newValues) !== JSON.stringify(options.initialValues || {});

        return {
          values: newValues,
          errors,
          touched: prev.touched,
          isValid,
          isDirty,
        };
      });
    },
    [validateForm, options.initialValues]
  );

  const setError = useCallback((name: keyof T, error: string) => {
    setFormState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
      isValid: false,
    }));
  }, []);

  const clearError = useCallback((name: keyof T) => {
    setFormState((prev) => {
      const newErrors = { ...prev.errors };
      delete newErrors[name];
      const isValid = Object.keys(newErrors).length === 0;
      
      return {
        ...prev,
        errors: newErrors,
        isValid,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setFormState({
      values: options.initialValues || {},
      errors: {},
      touched: {},
      isValid: false,
      isDirty: false,
    });
  }, [options.initialValues]);

  const touch = useCallback((name: keyof T) => {
    setFormState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [name]: true },
    }));
  }, []);

  const touchAll = useCallback(() => {
    setFormState((prev) => {
      const touched: Partial<Record<keyof T, boolean>> = {};
      Object.keys(prev.values).forEach((key) => {
        touched[key as keyof T] = true;
      });
      return { ...prev, touched };
    });
  }, []);

  const submitForm = useCallback(
    async (action: (data: T) => Promise<any>) => {
      touchAll();
      
      if (!formState.isValid) {
        return;
      }

      return handleAction(async () => {
        return action(formState.values as T);
      });
    },
    [formState.isValid, formState.values, touchAll, handleAction]
  );

  const getFieldProps = useCallback(
    (name: keyof T) => ({
      name: name as string,
      value: formState.values[name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValue(name, e.target.value);
      },
      onBlur: () => touch(name),
      error: formState.touched[name] ? formState.errors[name] : undefined,
      'aria-invalid': formState.touched[name] && formState.errors[name] ? 'true' : 'false',
    }),
    [formState.values, formState.errors, formState.touched, setValue, touch]
  );

  return {
    // State
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isValid: formState.isValid,
    isDirty: formState.isDirty,
    isLoading,
    
    // Actions
    setValue,
    setValues,
    setError,
    clearError,
    reset,
    touch,
    touchAll,
    submitForm,
    
    // Helpers
    getFieldProps,
    
    // Config
    config: appConfig.ui.form,
  };
}

export default useFormState;