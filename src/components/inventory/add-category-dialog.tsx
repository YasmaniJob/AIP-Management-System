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
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CategoryIcon } from './category-icon';
import { Card, CardContent } from '../ui/card';
import { categoryColorService } from '@/lib/services/category-color-service';
import { addCategoryAction } from '@/lib/actions/inventory';
import { useServerAction } from '@/hooks/use-server-action';

interface AddCategoryDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const categorySchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  type: z.enum(['Laptops', 'Tablets', 'Proyectores', 'Cámaras Fotográficas', 'Filmadoras', 'Periféricos', 'Redes', 'Cables y Adaptadores', 'Audio', 'PCs de Escritorio', 'Mobiliario', 'Otros'], {
    required_error: 'Debes seleccionar un tipo de categoría.',
  }),
});

const categoryTypes: any[] = ['Laptops', 'Tablets', 'Proyectores', 'Cámaras Fotográficas', 'Filmadoras', 'Periféricos', 'Redes', 'Cables y Adaptadores', 'Audio', 'PCs de Escritorio', 'Mobiliario', 'Otros'];

const toSentenceCase = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};

export function AddCategoryDialog({ isOpen, setIsOpen }: AddCategoryDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
    },
  });
  
  const nameValue = form.watch('name');
  const typeValue = form.watch('type');


  useEffect(() => {
    if (nameValue && showSuggestions) {
      const lowerCaseName = nameValue.toLowerCase();
      const filteredSuggestions = categoryTypes.filter(type =>
        type.toLowerCase().startsWith(lowerCaseName) && type.toLowerCase() !== lowerCaseName
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [nameValue, showSuggestions]);

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

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('name', suggestion, { shouldValidate: true });
    setShowSuggestions(false);
    setSuggestions([]);
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = toSentenceCase(e.target.value);
    form.setValue('name', formatted, { shouldValidate: true });
    if (!showSuggestions) {
      setShowSuggestions(true);
    }
  }

  const { execute: executeAddCategory, isPending: isSubmitting } = useServerAction(
    addCategoryAction,
    {
      successMessage: 'Categoría añadida exitosamente',
      onSuccess: () => {
        setIsOpen(false);
        router.refresh();
      }
    }
  );

  const onSubmit = (values: z.infer<typeof categorySchema>) => {
    executeAddCategory(values);
  };

  const selectedType = form.watch('type');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Añadir Nueva Categoría</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField 
              control={form.control} 
              name="name" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Categoría</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        placeholder="Ej: Laptops del 5to Grado" 
                        onChange={handleNameChange}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        onFocus={() => setShowSuggestions(true)}
                        autoComplete="off"
                      />
                       {suggestions.length > 0 && showSuggestions && (
                        <div className="absolute z-10 w-full bg-background border border-border rounded-md mt-1 shadow-md">
                          {suggestions.map(suggestion => (
                            <div
                              key={suggestion}
                              className="p-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSuggestionClick(suggestion);
                              }}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                Añadir Categoría
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
