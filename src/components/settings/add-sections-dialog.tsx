'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useServerAction } from '@/hooks/use-server-action';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { PlusCircle, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import React, { useEffect, useState, KeyboardEvent } from 'react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { addSectionAction } from '@/lib/actions/settings';

interface AddSectionsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  gradeId: string | null;
}

const sectionSchema = z.object({
  names: z.string().min(1, 'Debes seleccionar o añadir al menos una sección.'),
  gradeId: z.string().min(1, 'El ID del grado es requerido.')
});

const commonSections = ['A', 'B', 'C', 'D', 'E'];

export function AddSectionsDialog({ isOpen, setIsOpen, gradeId }: AddSectionsDialogProps) {
  const { execute: addSections, isLoading: isSubmitting } = useServerAction(addSectionAction, {
    successMessage: 'Secciones añadidas exitosamente',
    onSuccess: () => {
      setIsOpen(false);
    }
  });
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [customSection, setCustomSection] = useState('');

  const form = useForm<z.infer<typeof sectionSchema>>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { names: '', gradeId: gradeId || '' },
  });
  
  useEffect(() => {
    if (isOpen) {
        setSelectedSections([]);
        setCustomSection('');
        form.reset({ names: '', gradeId: gradeId || '' });
    }
  }, [isOpen, gradeId, form]);

  useEffect(() => {
    form.setValue('names', selectedSections.join(' '));
     if (selectedSections.length > 0) {
        form.clearErrors('names');
    }
  }, [selectedSections, form]);

  const handleToggleCommonSection = (section: string) => {
    setSelectedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleAddCustomSection = () => {
    const trimmedSection = customSection.trim().toUpperCase();
    if (trimmedSection && !selectedSections.includes(trimmedSection)) {
      setSelectedSections(prev => [...prev, trimmedSection]);
    }
    setCustomSection('');
  };
  
  const handleCustomSectionKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomSection();
    }
  }

  const handleRemoveSection = (section: string) => {
    setSelectedSections(prev => prev.filter(s => s !== section));
  };

  const onSubmit = async (values: z.infer<typeof sectionSchema>) => {
    await addSections(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir Nuevas Secciones</DialogTitle>
          <DialogDescription>Selecciona las secciones comunes o añade una personalizada.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <FormField
              control={form.control}
              name="gradeId"
              render={({ field }) => <Input type="hidden" {...field} />}
            />
            
            <div>
              <h4 className="text-sm font-medium mb-2">Secciones Comunes</h4>
              <div className="flex flex-wrap gap-2">
                {commonSections.map(section => (
                  <Button
                    key={section}
                    type="button"
                    variant={selectedSections.includes(section) ? 'default' : 'outline'}
                    onClick={() => handleToggleCommonSection(section)}
                    className="rounded-full w-12 h-12 text-lg"
                  >
                    {section}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Añadir otra sección</h4>
               <div className="flex gap-2">
                <Input
                  value={customSection}
                  onChange={(e) => setCustomSection(e.target.value)}
                  onKeyDown={handleCustomSectionKeyDown}
                  placeholder="Escribe una sección y presiona Enter"
                />
                <Button type="button" variant="secondary" onClick={handleAddCustomSection}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {selectedSections.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Secciones a crear ({selectedSections.length})</h4>
                <div className="flex flex-wrap gap-2 p-3 bg-secondary rounded-lg">
                  {selectedSections.map(section => (
                    <Badge key={section} variant="outline" className="text-base bg-background py-1 pl-3 pr-2">
                      {section}
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(section)}
                        className="ml-2 rounded-full hover:bg-destructive/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
             
            <FormField
                control={form.control}
                name="names"
                render={() => (
                    <FormItem>
                        <FormControl>
                            <Input type="hidden" />
                        </FormControl>
                         <FormMessage />
                    </FormItem>
                )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting || selectedSections.length === 0 || !gradeId}>
                {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Añadir Secciones
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
