
// src/components/loans/new-loan-form.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Info, User, Book, GraduationCap, Grid3x3, Tag, Cpu, MemoryStick, HardDrive, CircleDotDashed, Calendar, MessageSquare, ChevronsUpDown, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoanSummary } from './loan-summary';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn, singularize } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Textarea } from '../ui/textarea';
import { SelectUserDialog } from '../users/select-user-dialog';
import { createLoanAction } from '@/lib/actions/loans';
import { CategoryIcon } from '../inventory/category-icon';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { useAsyncState } from '@/hooks/use-async-state';
import { UnifiedFilterTabs } from '@/components/shared/unified-filter-tabs';
import { categoryService } from '@/lib/services/category-service';


const loanSchema = z.object({
  teacherId: z.string({ required_error: 'Debes seleccionar un docente.' }).min(1, 'Debes seleccionar un docente.'),
  areaId: z.string({ required_error: 'Debes seleccionar un área.' }).min(1, 'Debes seleccionar un área.'),
  gradeId: z.string({ required_error: 'Debes seleccionar un grado.' }).min(1, 'Debes seleccionar un grado.'),
  sectionId: z.string({ required_error: 'Debes seleccionar una sección.' }).min(1, 'Debes seleccionar una sección.'),
  resourceIds: z.array(z.string()).min(1, 'Debes seleccionar al menos un recurso.'),
  notes: z.string().optional(),
});

interface NewLoanFormProps {
    docentes: any[];
    categories: any[];
    initialResources: any[];
    areas: any[];
    gradesWithSections: any[];
    activeLoans: any[];
}

export function NewLoanForm({ docentes, categories, initialResources, areas, gradesWithSections, activeLoans }: NewLoanFormProps) {
  const router = useRouter();
  const [selectedResources, setSelectedResources] = useState<any[]>([]);
  const [infoResource, setInfoResource] = useState<{ resource: any, loan: any | null } | null>(null);
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categories[0]?.id || null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>(categories[0]?.name || '');
  
  const { execute: submitLoan, isLoading: isSubmitting } = useAsyncState({
    successMessage: 'Préstamo registrado exitosamente',
    onSuccess: () => router.push('/prestamos')
  });

  const form = useForm<z.infer<typeof loanSchema>>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      teacherId: '',
      areaId: '',
      gradeId: '',
      sectionId: '',
      resourceIds: [],
      notes: '',
    },
  });
  
  const selectedTeacherId = form.watch('teacherId');
  const selectedGradeId = form.watch('gradeId');
  
  const selectedUser = useMemo(() => selectedTeacherId ? docentes.find(p => p.id === selectedTeacherId) : null, [docentes, selectedTeacherId]);
  const selectedAreaId = form.watch('areaId');
  const selectedArea = useMemo(() => areas.find(a => a.id === selectedAreaId), [areas, selectedAreaId]);
  const selectedGrade = useMemo(() => gradesWithSections.find(g => g.id === selectedGradeId), [gradesWithSections, selectedGradeId]);
  
  const selectedSectionId = form.watch('sectionId');
  const selectedSection = useMemo(() => selectedGrade?.sections.find((s:any) => s.id === selectedSectionId), [selectedGrade, selectedSectionId]);

  useEffect(() => {
    form.setValue('resourceIds', selectedResources.map(r => r.id));
    if (selectedResources.length > 0) {
        form.clearErrors('resourceIds');
    }
  }, [selectedResources, form]);

  const handleResourceToggle = (resource: any) => {
    const isAvailable = resource.status === 'Disponible';
    
    if (!isAvailable) {
        const loan = activeLoans.find(l => l.resources.some((r: any) => r.id === resource.id)) || null;
        setInfoResource({ resource, loan });
        return;
    }

    setSelectedResources((prevSelected) => {
      const isSelected = prevSelected.some((r) => r.id === resource.id);
      if (isSelected) {
        return prevSelected.filter((r) => r.id !== resource.id);
      } else {
        const category = categories.find(c => c.id === resource.category_id);
        const resourceWithCategory = { ...resource, category };
        return [...prevSelected, resourceWithCategory];
      }
    });
  };

  const onSubmit = (values: z.infer<typeof loanSchema>) => {
    return submitLoan(() => createLoanAction(values));
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
    return initialResources.reduce((acc, resource) => {
        const categoryId = resource.category_id;
        if (!acc[categoryId]) {
            acc[categoryId] = 0;
        }
        if (resource.status === 'Disponible') {
            acc[categoryId]++;
        }
        return acc;
    }, {} as Record<string, number>);
  }, [initialResources]);

  // Generar filtros de categorías usando el sistema unificado (sin filtro 'todos')
  const categoryFilters = useMemo(() => {
    const categoriesWithStats = categories.map(cat => ({
      ...cat,
      resourceCount: initialResources.filter(r => r.category_id === cat.id).length,
      availableCount: availableCountByCategory[cat.id] || 0,
      maintenanceCount: 0,

    }));
    
    return categoryService.generateCategoryFilters(categoriesWithStats, 'loans', false);
  }, [categories, initialResources, availableCountByCategory]);

  const resourcesForSelectedCategory = useMemo(() => {
    const selectedCategory = categories.find(cat => cat.name === selectedCategoryFilter);
    if (!selectedCategory) return [];
    return initialResources.filter(r => r.category_id === selectedCategory.id);
  }, [selectedCategoryFilter, initialResources, categories]);

  // Actualizar selectedCategoryId cuando cambie el filtro
  useEffect(() => {
    const selectedCategory = categories.find(cat => cat.name === selectedCategoryFilter);
    setSelectedCategoryId(selectedCategory?.id || null);
  }, [selectedCategoryFilter, categories]);

  return (
    <>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold font-headline">Crear Nuevo Préstamo</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">1. Detalles del Préstamo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuario (Docente o Admin)</FormLabel>
                        <FormControl>
                            <Button
                                variant="outline"
                                className="w-full justify-between font-normal"
                                onClick={() => setIsTeacherDialogOpen(true)}
                                type="button"
                            >
                                {selectedUser ? selectedUser.name : 'Selecciona un usuario'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid sm:grid-cols-3 gap-4">
                    <FormField control={form.control} name="areaId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Área</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        <Book className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Selecciona un área" />
                                    </div>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {areas.map(area => (
                                        <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="gradeId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Grado</FormLabel>
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('sectionId', '');
                            }} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Selecciona un grado" />
                                    </div>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {gradesWithSections.map(grade => (
                                        <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="sectionId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sección</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedGradeId}>
                                <FormControl>
                                    <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder={!selectedGradeId ? "Selecciona un grado primero" : "Selecciona una sección"} />
                                    </div>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {selectedGrade?.sections.map((section: any) => (
                                        <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="font-headline">2. Selecciona los Recursos a Prestar</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {categories.length > 0 ? (
                      <div className="space-y-4">
                         <div className="space-y-2">
                           <h3 className="text-sm font-medium text-muted-foreground">Filtrar por categoría</h3>
                           <UnifiedFilterTabs
                             tabs={categoryFilters}
                             defaultTab={categories[0]?.name || ''}
                             value={selectedCategoryFilter}
                             onTabChange={setSelectedCategoryFilter}
                             className="w-full"
                           />
                         </div>
                         
                        <div className="border-t pt-4">
                            <ScrollArea className="h-96 max-h-96">
                                <div className="grid gap-4 pr-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                                    {resourcesForSelectedCategory.length > 0 ? (
                                        resourcesForSelectedCategory.map(resource => {
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
                                        })
                                    ) : (
                                        <p className="col-span-full text-center text-muted-foreground py-8">No hay recursos en esta categoría.</p>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                      </div>
                  ) : (
                      <p className="text-center text-muted-foreground py-8">No hay categorías de recursos definidas.</p>
                  )}
                  <FormField control={form.control} name="resourceIds" render={({ field }) => ( <FormItem><FormMessage className="pt-4" /></FormItem> )} />
                   <Separator />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Notas (Opcional)</FormLabel>
                          <FormControl>
                              <Textarea
                              placeholder="Añade cualquier detalle relevante. Ej: Recoge el alumno Juan Pérez del 5to A."
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
            </div>

            <div className="lg:col-span-1">
               <div className="sticky top-8">
                    <LoanSummary
                        selectedTeacherId={selectedTeacherId}
                        area={selectedArea?.name}
                        grade={selectedGrade?.name}
                        section={selectedSection?.name}
                        notes={form.watch('notes')}
                        selectedResources={selectedResources}
                        onRemoveResource={handleResourceToggle}
                        onSubmit={form.handleSubmit(onSubmit)}
                        docentes={docentes}
                        isSubmitting={isSubmitting}
                    />
               </div>
            </div>
          </form>
        </Form>
        
        <Dialog open={!!infoResource} onOpenChange={(open) => !open && setInfoResource(null)}>
          <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                  <DialogTitle>{singularize(typeof infoResource?.resource.category?.name === 'object' ? infoResource?.resource.category?.name?.name || infoResource?.resource.category?.name?.type || 'Recurso' : infoResource?.resource.category?.name || 'Recurso')} {infoResource?.resource.number}</DialogTitle>
                  <DialogDescription className="text-destructive font-semibold">
                    No Disponible
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Card>
                    <CardContent className="p-4 space-y-4 text-sm">
                        <div className="flex items-center gap-2">
                        <CircleDotDashed className="h-4 w-4 text-muted-foreground"/>
                        <span className="font-medium">Estado:</span>
                        <Badge variant={getStatusVariant(infoResource?.resource.status || 'Disponible')}>{infoResource?.resource.status}</Badge>
                        </div>
                        {infoResource?.resource.brand && (
                        <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-medium">Recurso:</span>
                            <span>{infoResource.resource.brand} {infoResource.resource.model}</span>
                        </div>
                        )}
                        {infoResource?.resource.processorBrand && (
                        <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-medium">Procesador:</span>
                            <span>{infoResource.resource.processorBrand} {infoResource.resource.generation}</span>
                        </div>
                        )}
                        {infoResource?.resource.ram && (
                        <div className="flex items-center gap-2">
                            <MemoryStick className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-medium">RAM:</span>
                            <span>{infoResource.resource.ram}</span>
                        </div>
                        )}
                        {infoResource?.resource.storage && (
                        <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-medium">Almacenamiento:</span>
                            <span>{infoResource.resource.storage}</span>
                        </div>
                        )}
                        {infoResource?.resource.notes && (
                            <div className="pt-2">
                                <h4 className="font-medium text-xs mb-1">Notas Adicionales:</h4>
                                <p className="text-xs text-muted-foreground bg-secondary p-2 rounded-md">{infoResource.resource.notes}</p>
                            </div>
                        )}

                        {infoResource?.loan && (
                            <div className="pt-4 mt-4 border-t space-y-3">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground"/>
                                    <div>
                                        <p className="font-medium">{infoResource.loan.user?.name}</p>
                                        <p className="text-xs text-muted-foreground">Docente a Cargo</p>
                                    </div>
                                </div>
                                {infoResource.loan.area?.name &&
                                    <div className="flex items-center gap-2">
                                        <Book className="h-4 w-4 text-muted-foreground"/>
                                        <span>{infoResource.loan.area.name}</span>
                                    </div>
                                }
                                {infoResource.loan.grade?.name && infoResource.loan.section?.name &&
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-muted-foreground"/>
                                        <span>{infoResource.loan.grade.name} - {infoResource.loan.section.name}</span>
                                    </div>
                                }
                                {infoResource.loan.created_at && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">{format(parseISO(infoResource.loan.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}</p>
                                        <p className="text-xs text-muted-foreground">Fecha de Préstamo</p>
                                    </div>
                                  </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
              </div>
               <DialogFooter>
                  <Button variant="outline" onClick={() => setInfoResource(null)}>Cerrar</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <SelectUserDialog
        isOpen={isTeacherDialogOpen}
        setIsOpen={setIsTeacherDialogOpen}
        onSelectUser={(user) => {
          form.setValue('teacherId', user.id);
          setIsTeacherDialogOpen(false);
        }}
        users={docentes}
      />
    </>
  );
}
