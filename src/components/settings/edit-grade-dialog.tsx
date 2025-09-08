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
import { updateGradeAction } from '@/lib/actions/settings';
import { useServerAction } from '@/hooks/use-server-action';

interface EditGradeDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  grade: any;
}

const gradeSchema = z.object({
  id: z.string().min(1, 'ID del grado es requerido.'),
  name: z.string().min(1, 'El nombre del grado es requerido.'),
});

export function EditGradeDialog({ isOpen, setIsOpen, grade }: EditGradeDialogProps) {
  const router = useRouter();
  
  const { execute: executeUpdateGrade, isPending: isSubmitting } = useServerAction(
    updateGradeAction,
    {
      successMessage: 'El grado se ha actualizado correctamente',
      onSuccess: () => {
        setIsOpen(false);
        router.refresh();
      }
    }
  );

  const form = useForm<z.infer<typeof gradeSchema>>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      id: grade.id,
      name: grade.name,
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            id: grade.id,
            name: grade.name,
        });
    }
  }, [isOpen, grade, form]);


  const onSubmit = (values: z.infer<typeof gradeSchema>) => {
    executeUpdateGrade(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Grado</DialogTitle>
          <DialogDescription>Cambia el nombre del grado a continuación.</DialogDescription>
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
                  <FormLabel>Nombre del Grado</FormLabel>
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
