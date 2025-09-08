'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useServerAction } from '@/hooks/use-server-action';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { Input } from '../ui/input';
import { useEffect } from 'react';
import { updateHourAction } from '@/lib/actions/settings';

interface EditHourDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  hour: any;
}

const hourSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre es requerido.'),
});

export function EditHourDialog({ isOpen, setIsOpen, hour }: EditHourDialogProps) {
  const { execute: updateHour, isLoading: isSubmitting } = useServerAction(updateHourAction, {
    successMessage: 'Hora actualizada exitosamente',
    onSuccess: () => {
      setIsOpen(false);
    }
  });
  
  const form = useForm<z.infer<typeof hourSchema>>({
    resolver: zodResolver(hourSchema),
  });

  useEffect(() => {
    if (isOpen && hour) {
      form.reset({
        id: hour.id,
        name: hour.name,
      });
    }
  }, [isOpen, hour, form]);
  
  const onSubmit = async (values: z.infer<typeof hourSchema>) => {
    await updateHour(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Hora Pedagógica</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input {...field} placeholder={`Ej: 1ra Hora`}/></FormControl>
                  <FormMessage/>
                  </FormItem>
              )}/>
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
