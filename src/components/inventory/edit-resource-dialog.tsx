
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import React, { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { updateResourceAction } from '@/lib/actions/inventory';
import { useServerAction } from '@/hooks/use-server-action';

interface EditResourceDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  resource: any;
  categoryType: any;
}

const updateResourceSchema = z.object({
  id: z.string(),
  model: z.string().optional(),
  brand: z.string().optional(),
  processorBrand: z.string().optional(),
  generation: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['Disponible', 'En Mantenimiento', 'Dañado']), // Only these are editable by user
});

const editableStatuses: any[] = ['Disponible', 'En Mantenimiento', 'Dañado'];
const laptopProcessorBrands: any[] = ['Intel', 'AMD', 'Otro'];
const tabletProcessorBrands: any[] = ['Apple', 'Qualcomm', 'Samsung', 'MediaTek', 'Google', 'Otro'];

export function EditResourceDialog({ isOpen, setIsOpen, resource, categoryType }: EditResourceDialogProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof updateResourceSchema>>({
    resolver: zodResolver(updateResourceSchema),
  });

  const { execute: executeUpdateResource, isPending } = useServerAction(
    updateResourceAction,
    {
      successMessage: 'Recurso actualizado exitosamente',
      onSuccess: () => {
        setIsOpen(false);
        router.refresh();
      }
    }
  );

  useEffect(() => {
    if (isOpen) {
      form.reset({
        id: resource.id,
        brand: resource.brand || '',
        model: resource.model || '',
        status: resource.status,
        processorBrand: resource.processor_brand || '',
        generation: resource.generation || '',
        ram: resource.ram || '',
        storage: resource.storage || '',
        notes: resource.notes || '',
      });
    }
  }, [isOpen, resource, form]);
  
  const isTechCategory = categoryType === 'Laptops' || categoryType === 'Tablets';
  const processorBrandOptions = categoryType === 'Tablets' ? tabletProcessorBrands : laptopProcessorBrands;

  const onSubmit = (values: z.infer<typeof updateResourceSchema>) => {
    executeUpdateResource(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Recurso</DialogTitle>
           <DialogDescription>Actualiza los detalles del recurso. Código: {resource.number}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            {isTechCategory && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="processorBrand" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Marca Proc.</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {processorBrandOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="generation" render={({ field }) => (<FormItem><FormLabel>Serie/Gen</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="ram" render={({ field }) => (<FormItem><FormLabel>RAM</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="storage" render={({ field }) => (<FormItem><FormLabel>Almacenamiento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </>
            )}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {editableStatuses.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notas</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            
            <DialogFooter className="pt-4">
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
