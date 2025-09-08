'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { numberToOrdinal } from '@/lib/utils';
import { useEffect } from 'react';
import { addHoursAction } from '@/lib/actions/settings';
import { useServerAction } from '@/hooks/use-server-action';

interface AddHoursDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const formSchema = z.object({
  count: z.number().min(1, 'Debes crear al menos 1 hora.').max(15, 'No puedes crear más de 15 horas a la vez.'),
});

export function AddHoursDialog({ isOpen, setIsOpen }: AddHoursDialogProps) {
  const router = useRouter();
  
  const { execute: executeAddHours, isPending: isSubmitting } = useServerAction(
    addHoursAction,
    {
      onSuccess: (data) => {
        setIsOpen(false);
        router.refresh();
      }
    }
  );
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      count: 7, // Default to a standard school day
    },
  });
  
  const hourCount = form.watch('count');

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    executeAddHours(values);
  };

  useEffect(() => {
    if (!isOpen) {
        form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir Horas Pedagógicas</DialogTitle>
          <DialogDescription>Selecciona cuántas horas pedagógicas quieres crear. Se nombrarán automáticamente (1ra Hora, 2da Hora, etc.).</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cantidad de horas a crear</FormLabel>
                    <FormControl>
                        <div className='flex items-center gap-4'>
                            <Slider
                                min={1}
                                max={15}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                            />
                            <Input
                                type="number"
                                min={1}
                                max={15}
                                className="w-20 text-center font-bold text-lg"
                                value={field.value}
                                onChange={(e) => {
                                    const value = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                                     if (!isNaN(value) && value >= 1) {
                                        field.onChange(value);
                                    }
                                }}
                            />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <div className="space-y-2">
                <h4 className="text-sm font-medium">Previsualización</h4>
                <div className="flex flex-wrap gap-2 p-3 bg-secondary rounded-lg text-sm">
                    {Array.from({ length: hourCount }, (_, i) => (
                        <div key={i} className="bg-primary/10 border border-primary/20 text-primary font-medium rounded-md px-3 py-1">
                            {numberToOrdinal(i + 1)} Hora
                        </div>
                    ))}
                </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoadingSpinner size="sm" />}
                {isSubmitting ? 'Creando...' : `Crear ${hourCount} Horas`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
