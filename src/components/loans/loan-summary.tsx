// src/components/loans/loan-summary.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { User as UserIcon, Calendar, Hash, X, Book, GraduationCap, Grid3x3, MessageSquare } from 'lucide-react';
import { singularize } from '@/lib/utils';
import { CategoryIcon } from '../inventory/category-icon';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';

interface LoanSummaryProps {
  selectedTeacherId: string | undefined;
  area: string | undefined;
  grade: string | undefined;
  section: string | undefined;
  notes: string | undefined;
  selectedResources: any[];
  onRemoveResource: (resource: any) => void;
  onSubmit: () => void;
  docentes: any[];
  isSubmitting: boolean;
}

export function LoanSummary({ 
    selectedTeacherId, 
    area,
    grade,
    section,
    notes,
    selectedResources, 
    onRemoveResource, 
    onSubmit, 
    docentes, 
    isSubmitting 
}: LoanSummaryProps) {
  const selectedUser = selectedTeacherId ? docentes.find(p => p.id === selectedTeacherId) : null;
  const isFormComplete = selectedTeacherId && area && grade && section && selectedResources.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Resumen del Préstamo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectedUser ? (
          <div className="flex items-center gap-3">
            <UserIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold">{selectedUser.name}</p>
              <p className="text-sm text-muted-foreground">{selectedUser.role}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground">
            <UserIcon className="h-5 w-5" />
            <span>Ningún usuario seleccionado</span>
          </div>
        )}
        
        <Separator />
        
         <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
                <Book className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Área:</span>
                <span className="text-muted-foreground">{area || 'No especificada'}</span>
            </div>
            <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Grado:</span>
                <span className="text-muted-foreground">{grade || 'No especificado'}</span>
            </div>
            <div className="flex items-center gap-3">
                <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Sección:</span>
                <span className="text-muted-foreground">{section || 'No especificada'}</span>
            </div>
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-3 mb-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <p className="font-semibold">Recursos Seleccionados ({selectedResources.length})</p>
          </div>
          <ScrollArea className="max-h-48">
            <div className="space-y-2 pr-4">
              {selectedResources.length > 0 ? (
                selectedResources.map(resource => (
                  <div key={resource.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                    <div className="flex items-center gap-2">
                       <CategoryIcon type={resource.category?.type} className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">{singularize(typeof resource.category?.name === 'object' ? resource.category?.name?.name || resource.category?.name?.type || 'Recurso' : resource.category?.name || 'Recurso')} {resource.number}</p>
                            <p className="text-xs text-muted-foreground">{[resource.brand, resource.model].filter(Boolean).join(' ')}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveResource(resource)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Ningún recurso seleccionado.</p>
              )}
            </div>
          </ScrollArea>
        </div>
        {notes && (
            <>
                <Separator />
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                         <MessageSquare className="h-4 w-4 text-muted-foreground" />
                         <p className="font-semibold text-sm">Notas Adicionales</p>
                    </div>
                    <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md whitespace-pre-wrap">{notes}</p>
                </div>
            </>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          type="submit" 
          className="w-full" 
          size="lg" 
          onClick={onSubmit} 
          disabled={!isFormComplete || isSubmitting}
        >
          {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
          {isSubmitting ? 'Creando Préstamo...' : 'Registrar Préstamo'}
        </Button>
      </CardFooter>
    </Card>
  );
}
