// src/components/loans/request-loan-form.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Info, Book, GraduationCap, Grid3x3, Tag, Cpu, MemoryStick, HardDrive, CircleDotDashed, Calendar, MessageSquare, ChevronsUpDown, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn, singularize } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Textarea } from '../ui/textarea';
import { requestLoanAction } from '@/lib/actions/loans';
import { CategoryIcon } from '../inventory/category-icon';
import { useAsyncState } from '@/hooks/use-async-state';
import { LoadingSpinner } from '../atoms/loading-spinner';

const requestLoanSchema = z.object({
  areaId: z.string().min(1, 'Selecciona un área curricular'),
  gradeId: z.string().min(1, 'Selecciona un grado'),
  sectionId: z.string().min(1, 'Selecciona una sección'),
  resourceIds: z.array(z.string()).min(1, 'Selecciona al menos un recurso'),
  notes: z.string().optional(),
});

interface RequestLoanFormProps {
    categories: any[];
    initialResources: any[];
    areas: any[];
    gradesWithSections: any[];
    activeLoans: any[];
    currentUserId: string;
}

export function RequestLoanForm({ categories, initialResources, areas, gradesWithSections, activeLoans, currentUserId }: RequestLoanFormProps) {
  const router = useRouter();
  const [selectedResources, setSelectedResources] = useState<any[]>([]);
  const [infoResource, setInfoResource] = useState<{ resource: any, loan: any | null } | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categories[0]?.id || null);
  
  const { execute: submitRequest, isLoading: isSubmitting } = useAsyncState({
    successMessage: 'Solicitud de préstamo enviada exitosamente',
    onSuccess: () => router.push('/prestamos')
  });

  const form = useForm<z.infer<typeof requestLoanSchema>>({
    resolver: zodResolver(requestLoanSchema),
    defaultValues: {
      areaId: '',
      gradeId: '',
      sectionId: '',
      resourceIds: [],
      notes: '',
    },
  });
  
  const selectedGradeId = form.watch('gradeId');
  const selectedAreaId = form.watch('areaId');
  const selectedArea = useMemo(() => areas.find(a => a.id === selectedAreaId), [areas, selectedAreaId]);
  const selectedGrade = useMemo(() => gradesWithSections.find(g => g.id === selectedGradeId), [gradesWithSections, selectedGradeId]);

  const availableResources = useMemo(() => {
    const resourcesInUse = new Set(
      activeLoans.flatMap(loan => loan.resources?.map((r: any) => r.id) || [])
    );
    return initialResources.filter(resource => 
      resource.status === 'Disponible' && !resourcesInUse.has(resource.id)
    );
  }, [initialResources, activeLoans]);

  const onSubmit = (values: z.infer<typeof requestLoanSchema>) => {
    const requestData = {
      ...values,
      teacherId: currentUserId
    };
    return submitRequest(() => requestLoanAction(requestData));
  };

  const getStatusVariant = (status: any['status']) => {
      switch (status) {
          case 'Disponible': return 'default';
          case 'En Préstamo': return 'secondary';
          case 'Dañado': return 'destructive';
          case 'En Mantenimiento': return 'outline';
          default: return 'default';
      }
  };

  const availableCountByCategory = useMemo(() => {
    return availableResources.reduce((acc, resource) => {
        const categoryId = resource.category_id;
        if (!acc[categoryId]) {
            acc[categoryId] = 0;
        }
        if (resource.status === 'Disponible') {
            acc[categoryId]++;
        }
        return acc;
    }, {} as Record<string, number>);
  }, [availableResources]);

  const resourcesForSelectedCategory = useMemo(() => {
    if (!selectedCategoryId) return [];
    return availableResources.filter(r => r.category_id === selectedCategoryId);
  }, [selectedCategoryId, availableResources]);

  const handleResourceToggle = (resource: any) => {
    const isSelected = selectedResources.some(r => r.id === resource.id);
    if (isSelected) {
      const newSelected = selectedResources.filter(r => r.id !== resource.id);
      setSelectedResources(newSelected);
      form.setValue('resourceIds', newSelected.map(r => r.id));
    } else {
      const newSelected = [...selectedResources, resource];
      setSelectedResources(newSelected);
      form.setValue('resourceIds', newSelected.map(r => r.id));
    }
  };

  const isFormComplete = form.watch('areaId') && form.watch('gradeId') && form.watch('sectionId') && selectedResources.length > 0;

  return (
    <>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold font-headline">Solicitar Préstamo</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Proceso de Solicitud de Préstamo</p>
              <p>Tu solicitud será enviada al administrador para su revisión. Una vez aprobada, podrás enviar a un estudiante a recoger los recursos del aula de innovación.</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">1. Detalles de la Solicitud</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="areaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Área Curricular</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un área" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {areas.map((area) => (
                              <SelectItem key={area.id} value={area.id}>
                                {area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gradeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grado</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('sectionId', '');
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un grado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {gradesWithSections.map((grade) => (
                                <SelectItem key={grade.id} value={grade.id}>
                                  {grade.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sectionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sección</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedGrade}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una sección" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedGrade?.sections?.map((section: any) => (
                                <SelectItem key={section.id} value={section.id}>
                                  {section.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Agrega cualquier información adicional sobre el préstamo..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">2. Seleccionar Recursos</CardTitle>
                  <CardDescription>
                    Elige los recursos que necesitas para tu clase.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Carousel opts={{ align: "start", dragFree: true }} className="w-full mb-6">
                    <CarouselContent>
                      {categories.map((category) => {
                        const availableCount = availableCountByCategory[category.id] || 0;
                        const isSelected = selectedCategoryId === category.id;
                        
                        return (
                          <CarouselItem key={category.id} className="basis-auto">
                            <Button
                              type="button"
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() => setSelectedCategoryId(category.id)}
                              className="h-auto p-2"
                            >
                              <CategoryIcon type={category.type} className="h-4 w-4 mr-2" />
                              {category.name}
                              {availableCount > 0 && (
                                <Badge variant={isSelected ? 'secondary' : 'default'} className="ml-2">
                                  {availableCount}
                                </Badge>
                              )}
                            </Button>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                    <CarouselPrevious className="-left-4"/>
                    <CarouselNext className="-right-4" />
                  </Carousel>

                  {selectedCategoryId && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Recursos Disponibles</h4>
                      <ScrollArea className="max-h-96">
                        <div className="grid gap-4 pr-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                          {resourcesForSelectedCategory.map((resource) => {
                            const isSelected = selectedResources.some(r => r.id === resource.id);
                            const isAvailable = resource.status === 'Disponible';
                            const category = categories.find(c => c.id === resource.category_id);
                            const categoryColor = category?.color;
                            
                            const resourceSingularName = singularize(category?.name);
                            const cardTitle = `${resourceSingularName} ${resource.number}`;
                            const cardDescription = [resource.brand, resource.model].filter(Boolean).join(' ');
                            
                            return (
                              <Card
                                key={resource.id}
                                onClick={() => handleResourceToggle(resource)}
                                className={cn(
                                  "transition-all flex flex-col border relative overflow-hidden",
                                  isAvailable ? "cursor-pointer hover:shadow-md" : "opacity-60 cursor-not-allowed",
                                )}
                              >
                                <CardHeader className="p-3 flex-grow">
                                  <div className="flex justify-between items-start">
                                    <CardTitle className="text-sm font-medium">{cardTitle}</CardTitle>
                                    {category && <CategoryIcon type={category.type} color={categoryColor} className="h-4 w-4" />}
                                  </div>
                                  <CardDescription className="text-xs">
                                    {cardDescription}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="p-3 pt-0 flex items-center justify-between">
                                  <Badge variant={getStatusVariant(resource.status)}>
                                    {resource.status}
                                  </Badge>
                                  {(!isAvailable || resource.notes) && (
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </CardContent>
                                {isSelected && (
                                  <div className="absolute inset-0 bg-primary/20 border-2 border-primary flex items-center justify-center">
                                    <Check className="h-8 w-8 text-white bg-primary rounded-full p-1" />
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-4 sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Resumen de Solicitud</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedArea && (
                    <div className="flex items-center gap-2">
                      <Book className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedArea.name}</span>
                    </div>
                  )}
                  
                  {selectedGrade && form.watch('sectionId') && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedGrade.name} - {selectedGrade.sections?.find((s: any) => s.id === form.watch('sectionId'))?.name}
                      </span>
                    </div>
                  )}

                  {selectedResources.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Recursos Solicitados ({selectedResources.length})</h4>
                        <div className="space-y-2">
                          {selectedResources.map((resource) => {
                            const resourceBrandModel = [resource.brand, resource.model].filter(Boolean).join(' ');
                            return (
                              <div key={resource.id} className="flex items-center gap-2 text-xs">
                                <CategoryIcon type={typeof resource.category?.name === 'object' ? resource.category?.name?.name || resource.category?.name?.type : resource.category?.name} className="h-3 w-3" />
                                <span className="flex-1">
                                  {resource.name}
                                  {resourceBrandModel && <span className="text-muted-foreground"> - {resourceBrandModel}</span>}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {form.watch('notes') && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Notas</h4>
                        <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md whitespace-pre-wrap">{form.watch('notes')}</p>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardContent>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg" 
                    disabled={!isFormComplete || isSubmitting}
                  >
                    {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Enviando Solicitud...' : 'Enviar Solicitud de Préstamo'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}