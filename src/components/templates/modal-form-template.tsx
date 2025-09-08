// src/components/templates/modal-form-template.tsx
'use client';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { X } from 'lucide-react';

interface ModalFormTemplateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const ModalFormTemplate: React.FC<ModalFormTemplateProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  isSubmitting = false,
  submitDisabled = false,
  size = 'md',
  showCloseButton = true
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sizeClasses[size]}>
        {showCloseButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            disabled={isSubmitting}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto px-1">
            {children}
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || submitDisabled}
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" text={submitText} />
              ) : (
                submitText
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalFormTemplate;