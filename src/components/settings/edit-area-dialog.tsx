'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import React, { useEffect } from 'react';
import { Input } from '../ui/input';
import { updateAreaAction } from '@/lib/actions/settings';
import { useServerAction } from '@/hooks/use-server-action';

interface EditAreaDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  area: any;
}

const areaSchema = z.object({
  id: z.string().min(1, 'ID del área es requerido.'),
  name: z.string().min(1, 'El nombre del área es requerido.'),
});

export function EditAreaDialog({ isOpen, setIsOpen, area }: EditAreaDialogProps) {
  const router = useRouter();
  const { toast } = useToast();


  const form = useForm<z.infer<typeof areaSchema>>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      id: area.id,
      name: area.name,
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            id: area.id,
            name: area.name,
        });
    }
  }, [isOpen, area, form]);


  const { execute: executeUpdateArea, isPending } = useServerAction(
    updateAreaAction,
    {
      successMessage: 'Área actualizada exitosamente',
      onSuccess: () => {
        setIsOpen(false);
        router.refresh();
      }
    }
  );

  const onSubmit = (values: z.infer<typeof areaSchema>) => {
    executeUpdateArea(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Área Curricular</DialogTitle>
          <DialogDescription>Cambia el nombre del área a continuación.</DialogDescription>
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
                  <FormLabel>Nombre del Área</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
