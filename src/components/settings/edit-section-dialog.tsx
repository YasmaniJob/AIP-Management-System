'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import React, { useEffect } from 'react';
import { Input } from '../ui/input';
import { updateSectionAction } from '@/lib/actions/settings';
import { useServerAction } from '@/hooks/use-server-action';

interface EditSectionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  section: any;
}

const sectionSchema = z.object({
  id: z.string().min(1, 'ID de la sección es requerido.'),
  name: z.string().min(1, 'El nombre de la sección es requerido.'),
});

export function EditSectionDialog({ isOpen, setIsOpen, section }: EditSectionDialogProps) {
  const router = useRouter();
  
  const { execute: executeUpdateSection, isPending: isSubmitting } = useServerAction(
    updateSectionAction,
    {
      successMessage: 'Sección actualizada correctamente',
      onSuccess: () => {
        setIsOpen(false);
        router.refresh();
      }
    }
  );

  const form = useForm<z.infer<typeof sectionSchema>>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      id: section.id,
      name: section.name,
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            id: section.id,
            name: section.name,
        });
    }
  }, [isOpen, section, form]);


  const onSubmit = (values: z.infer<typeof sectionSchema>) => {
    executeUpdateSection(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Sección</DialogTitle>
          <DialogDescription>Cambia el nombre de la sección a continuación.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <Input type="hidden" {...field} />
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Sección</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
