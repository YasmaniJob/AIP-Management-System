
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CategoryIcon } from './category-icon';
import { Card, CardContent } from '../ui/card';
import { categoryColorService } from '@/lib/services/category-color-service';
import { updateCategoryAction } from '@/lib/actions/inventory';
import { useServerAction } from '@/hooks/use-server-action';

interface EditCategoryDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  category: any;
}

const updateCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  type: z.enum(['Laptops', 'Tablets', 'Proyectores', 'Cámaras Fotográficas', 'Filmadoras', 'Periféricos', 'Redes', 'Cables y Adaptadores', 'Audio', 'PCs de Escritorio', 'Mobiliario', 'Otros'], {
    required_error: 'Debes seleccionar un tipo de categoría.',
  }),
});

const categoryTypes: any[] = ['Laptops', 'Tablets', 'Proyectores', 'Cámaras Fotográficas', 'Filmadoras', 'Periféricos', 'Redes', 'Cables y Adaptadores', 'Audio', 'PCs de Escritorio', 'Mobiliario', 'Otros'];

export function EditCategoryDialog({ isOpen, setIsOpen, category }: EditCategoryDialogProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof updateCategorySchema>>({
    resolver: zodResolver(updateCategorySchema),
  });
  

  const nameValue = form.watch('name');
  const typeValue = form.watch('type');
  
  useEffect(() => {
    if (isOpen && category) {
      form.reset({
        id: category.id,
        name: category.name,
        type: category.type,
      });
    }
  }, [isOpen, category, form]);

  useEffect(() => {
    const lowerCaseName = nameValue?.toLowerCase();
    const matchingType = categoryTypes.find(type => type.toLowerCase() === lowerCaseName);
    if (matchingType) {
      form.setValue('type', matchingType, { shouldValidate: true });
    }
  }, [nameValue, form]);

  useEffect(() => {
    if (typeValue) {
        form.setValue('name', typeValue, { shouldValidate: true });
    }
  }, [typeValue, form]);

  const { execute: executeUpdateCategory, isPending: isSubmitting } = useServerAction(
    updateCategoryAction,
    {
      successMessage: 'Categoría actualizada exitosamente',
      onSuccess: () => {
        setIsOpen(false);
        router.refresh();
      }
    }
  );

  const onSubmit = (values: z.infer<typeof updateCategorySchema>) => {
    executeUpdateCategory(values);
  };

  const selectedType = form.watch('type');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Categoría</DialogTitle>
          <DialogDescription>Modifica el nombre o el tipo de la categoría.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Categoría</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Laptops del 5to Grado" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Categoría</FormLabel>
                   <FormControl>
                    <div className="grid grid-cols-6 gap-2">
                        {categoryTypes.map(type => {
                           const color = categoryColorService.getLegacyColorMap()[type] || '#6b7280';
                           const isSelected = selectedType === type;
                           return (
                           <Card
                                key={type}
                                onClick={() => field.onChange(type)}
                                className={cn(
                                    "cursor-pointer transition-all rounded-md focus-visible:ring-2 focus-visible:ring-offset-2",
                                    isSelected
                                        ? "shadow-sm"
                                        : "hover:shadow-sm hover:bg-accent/50"
                                )}
                                style={{
                                  '--category-color': color,
                                  borderColor: isSelected ? color : 'hsl(var(--border))',
                                  boxShadow: isSelected ? `0 0 0 1px ${color}` : '',
                                } as React.CSSProperties}
                            >
                                <CardContent className="p-3 flex flex-col items-center justify-center gap-2">
                                     <CategoryIcon type={type} color={color} />
                                     <span className="text-xs text-center">{type}</span>
                                </CardContent>
                            </Card>
                        )})}
                    </div>
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
