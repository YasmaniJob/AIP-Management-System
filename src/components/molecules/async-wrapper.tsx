// src/components/molecules/async-wrapper.tsx
'use client';
import React from 'react';
import { LoadingState, TableLoadingState, FormLoadingState, CardLoadingState } from '@/components/atoms/loading-state';
import { ErrorState } from '@/components/atoms/error-state';
import { cn } from '@/lib/utils';

interface AsyncWrapperProps {
  isLoading: boolean;
  error?: Error | string | null;
  data?: any;
  children: React.ReactNode;
  loadingVariant?: 'default' | 'minimal' | 'card' | 'skeleton' | 'table' | 'form' | 'cards';
  errorVariant?: 'default' | 'minimal' | 'card';
  loadingText?: string;
  loadingDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showGoHome?: boolean;
  className?: string;
  // Loading state specific props
  skeletonLines?: number;
  tableRows?: number;
  tableColumns?: number;
  formFields?: number;
  cardCount?: number;
  // Conditional rendering
  showWhenEmpty?: boolean;
  emptyMessage?: string;
}

export const AsyncWrapper: React.FC<AsyncWrapperProps> = ({
  isLoading,
  error,
  data,
  children,
  loadingVariant = 'default',
  errorVariant = 'default',
  loadingText = 'Cargando...',
  loadingDescription,
  errorTitle = 'Ha ocurrido un error',
  errorDescription = 'Algo salió mal. Por favor, inténtalo de nuevo.',
  onRetry,
  onGoHome,
  showRetry = true,
  showGoHome = false,
  className,
  skeletonLines = 3,
  tableRows = 5,
  tableColumns = 4,
  formFields = 4,
  cardCount = 3,
  showWhenEmpty = false,
  emptyMessage = 'No hay datos disponibles',
}) => {
  // Show loading state
  if (isLoading) {
    const loadingProps = {
      text: loadingText,
      description: loadingDescription,
      variant: loadingVariant as any,
      className,
      skeletonLines,
    };

    switch (loadingVariant) {
      case 'table':
        return <TableLoadingState rows={tableRows} columns={tableColumns} className={className} />;
      case 'form':
        return <FormLoadingState fields={formFields} className={className} />;
      case 'cards':
        return <CardLoadingState cards={cardCount} className={className} />;
      default:
        return <LoadingState {...loadingProps} />;
    }
  }

  // Show error state
  if (error) {
    return (
      <ErrorState
        title={errorTitle}
        description={errorDescription}
        error={error}
        variant={errorVariant}
        onRetry={onRetry}
        onGoHome={onGoHome}
        showRetry={showRetry}
        showGoHome={showGoHome}
        className={className}
      />
    );
  }

  // Show empty state if data is empty and showWhenEmpty is true
  if (showWhenEmpty && (!data || (Array.isArray(data) && data.length === 0))) {
    return (
      <div className={cn('flex flex-col items-center justify-center min-h-[200px] p-4 text-center', className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Show children when everything is loaded successfully
  return <>{children}</>;
};

// Specialized wrappers for common use cases
export const TableWrapper: React.FC<Omit<AsyncWrapperProps, 'loadingVariant'>> = (props) => (
  <AsyncWrapper {...props} loadingVariant="table" />
);

export const FormWrapper: React.FC<Omit<AsyncWrapperProps, 'loadingVariant'>> = (props) => (
  <AsyncWrapper {...props} loadingVariant="form" />
);

export const CardWrapper: React.FC<Omit<AsyncWrapperProps, 'loadingVariant'>> = (props) => (
  <AsyncWrapper {...props} loadingVariant="cards" />
);

export const PageWrapper: React.FC<Omit<AsyncWrapperProps, 'loadingVariant' | 'errorVariant'>> = (props) => (
  <AsyncWrapper {...props} loadingVariant="default" errorVariant="default" />
);

export const ModalWrapper: React.FC<Omit<AsyncWrapperProps, 'loadingVariant' | 'errorVariant'>> = (props) => (
  <AsyncWrapper {...props} loadingVariant="minimal" errorVariant="minimal" />
);

export default AsyncWrapper;