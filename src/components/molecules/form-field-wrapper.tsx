// src/components/molecules/form-field-wrapper.tsx
'use client';
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { colors } from '@/lib/colors';
import { Control, FieldPath, FieldValues } from 'react-hook-form';

interface FormFieldWrapperProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  children: (field: any) => React.ReactNode;
  description?: string;
  required?: boolean;
}

export function FormFieldWrapper<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  children,
  description,
  required = false
}: FormFieldWrapperProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={required ? `after:content-["*"] after:ml-0.5 ${colors.error.required}` : ''}>
            {label}
          </FormLabel>
          <FormControl>
            {children(field)}
          </FormControl>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default FormFieldWrapper;