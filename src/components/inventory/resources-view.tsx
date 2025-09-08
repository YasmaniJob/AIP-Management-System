// src/components/inventory/resources-view.tsx
'use client';
import { useState, useMemo, useEffect, useCallback, useTransition, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PlusCircle, ArrowLeft, AlertTriangle, Trash2, Package, Clock, Settings, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import Link from 'next/link';
import { NewResourceForm } from './new-resource-form';
import { ResourcesGrid } from './resources-grid';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { EditResourceDialog } from './edit-resource-dialog';
import { Checkbox } from '../ui/checkbox';
import { singularize } from '@/lib/utils';
import { deleteResourceAction, deleteMultipleResourcesAction } from '@/lib/actions/inventory';
import { useServerAction } from '@/hooks/use-server-action';
import type { LoanWithResources } from '@/lib/types';
import { ResourceInfoModal } from './resource-info-modal';
import { isTechCategory } from '@/lib/constants/shared-schemas';

import { UnifiedFilterTabs } from '@/components/shared/unified-filter-tabs';


interface ResourcesViewProps {
  category: any;
  initialResources: any[];
  activeLoans: LoanWithResources[];
  maintenanceRecords: any[];
  userRole: string;

}


export const ResourcesView = memo(function ResourcesView({ category, initialResources, activeLoans, maintenanceRecords, userRole }: ResourcesViewProps) {
  const [view, setView] = useState<'list' | 'new'>('list');
  const [resourceFilter, setResourceFilter] = useState<any>('Disponible');
  const isCurrentlyTechCategory = isTechCategory(category?.type || '');
  const isAdmin = userRole === 'Administrador';
  const { toast } = useToast();
  const router = useRouter();

  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  


  useEffect(() => {
    setSelectedIds([]);
  }, [resourceFilter, initialResources]);

  const filteredResources = useMemo(() => {
    // Si el filtro es "En mantenimiento", incluir todos los estados de mantenimiento
    if (resourceFilter === 'En mantenimiento') {
      const maintenanceStates = [
        'En mantenimiento',
        'En Mantenimiento', // Agregado para manejar inconsistencia de mayúsculas
        'En Reparación', 
        'Parcialmente Reparado',
        'Esperando Repuestos',
        'Reparado - Pendiente Prueba'
      ];
      return initialResources.filter(r => maintenanceStates.includes(r.status));
    }
    
    return initialResources.filter(r => r.status === resourceFilter);
  }, [resourceFilter, initialResources]);

  // Contar recursos por estado
  const resourceCounts = useMemo(() => {
    const counts = {
      'Todos': initialResources.length,
      'Disponible': 0,
      'En Préstamo': 0,
      'Dañado': 0,
      'En mantenimiento': 0
    };
    
    // Estados que se consideran "En mantenimiento"
    const maintenanceStates = [
      'En mantenimiento',
      'En Mantenimiento', // Agregado para manejar inconsistencia de mayúsculas
      'En Reparación', 
      'Parcialmente Reparado',
      'Esperando Repuestos',
      'Reparado - Pendiente Prueba'
    ];
    
    initialResources.forEach(resource => {
      if (maintenanceStates.includes(resource.status)) {
        counts['En mantenimiento']++;
      } else if (counts.hasOwnProperty(resource.status)) {
        counts[resource.status as keyof typeof counts]++;
      }
    });
    
    return counts;
  }, [initialResources]);

  // Definir las pestañas de filtro
  const filterTabs = [
    {
      value: 'Disponible',
      label: 'Disponible',
      color: 'green' as const,
      count: resourceCounts['Disponible'],
      icon: CheckCircle
    },
    {
      value: 'En Préstamo',
      label: 'En Préstamo',
      color: 'yellow' as const,
      count: resourceCounts['En Préstamo'],
      icon: Clock
    },
    {
      value: 'Dañado',
      label: 'Dañado',
      color: 'red' as const,
      count: resourceCounts['Dañado'],
      icon: AlertTriangle
    },
    {
      value: 'En mantenimiento',
      label: 'En mantenimiento',
      color: 'purple' as const,
      count: resourceCounts['En mantenimiento'],
      icon: Settings
    }
  ];
  
  const loanByResourceId = useMemo(() => {
    const map = new Map<string, LoanWithResources>();
    activeLoans.forEach(loan => {
        loan.resources.forEach(resource => {
            map.set(resource.id, loan);
        });
    });
    return map;
  }, [activeLoans]);

  const maintenanceByResourceId = useMemo(() => {
    const map = new Map<string, any>();
    maintenanceRecords.forEach(maintenance => {
      map.set(maintenance.resource_id, maintenance);
    });
    return map;
  }, [maintenanceRecords]);



  const toggleSelectAll = () => {
    if (selectedIds.length === filteredResources.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredResources.map(r => r.id));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusVariant = useCallback((status: any) => {
    switch (status) {
      case 'Disponible': return 'default';
      case 'En Préstamo': return 'secondary';
      case 'Dañado': return 'destructive';
      default: return 'default';
    }
  }, []);
  
  const handleEdit = useCallback((resource: any) => {
    setSelectedResource(resource);
    setIsEditOpen(true);
  }, []);
  
  const handleDelete = useCallback((resource: any) => {
    setSelectedResource(resource);
    setIsDeleteOpen(true);
  }, []);

  const { execute: executeDeleteResource } = useServerAction(
    deleteResourceAction,
    {
      successMessage: 'Recurso eliminado exitosamente',
      onSuccess: () => {
        setSelectedResource(null);
        setIsDeleteOpen(false);
      }
    }
  );

  const handleConfirmDelete = () => {
    if (!selectedResource) return;
    executeDeleteResource(selectedResource.id);
  };

  const { execute: executeDeleteMultipleResources } = useServerAction(
    deleteMultipleResourcesAction,
    {
      successMessage: 'Recursos eliminados exitosamente',
      onSuccess: () => {
        setSelectedIds([]);
        setIsBulkDeleteOpen(false);
      }
    }
  );

  const handleConfirmBulkDelete = () => {
    executeDeleteMultipleResources(selectedIds);
  };


  
  const handleFormSubmit = () => {
    setView('list');
  }

  const getBrandHeader = () => {
    switch (category?.type) {
        case 'Cables y Adaptadores': return 'Tipo';
        case 'Mobiliario': return 'Tipo de Mueble';
        case 'Otros': return 'Tipo de Equipo';
        default: return 'Marca';
    }
  };
  
   const getModelHeader = () => {
    switch (category?.type) {
        case 'Cables y Adaptadores': return 'Longitud/Espec.';
        case 'Mobiliario': return 'Descripción';
        case 'Proyectores': return 'Tecnología/Mod.';
        case 'Periféricos': return 'Conectividad/Mod.';
        default: return 'Modelo';
    }
  };

  if (!category) {
      return (
        <div className="text-center py-16 border border-dashed rounded-lg">
            <p className="text-muted-foreground">Categoría no encontrada.</p>
            <p className="text-sm text-muted-foreground mt-2">Vuelve al inventario para seleccionar una categoría válida.</p>
            <Button variant="outline" asChild className="mt-4">
                <Link href="/inventario">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Inventario
                </Link>
            </Button>
        </div>
      )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {view === 'list' ? (
          <>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                     <h1 className="text-3xl font-bold font-headline">{category.name}</h1>
                    {isAdmin && (
                        <Button onClick={() => setView('new')}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Recurso
                        </Button>
                    )}
                </div>
                <div className="flex items-center justify-between">
                    <UnifiedFilterTabs
                        tabs={filterTabs}
                        defaultTab="Disponible"
                        onTabChange={(value) => setResourceFilter(value)}
                    />
                    {isAdmin && selectedIds.length > 0 && (
                        <Button 
                            variant="destructive"
                            size="sm"
                            onClick={() => setIsBulkDeleteOpen(true)}
                            disabled={isDeleting}
                        >
                             <Trash2 className="mr-2 h-4 w-4" />
                             Eliminar ({selectedIds.length})
                        </Button>
                    )}
                </div>
            </div>

            
            {/* Grid de recursos */}
            <ResourcesGrid
              resources={filteredResources}
              category={category}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelectId}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loanByResourceId={loanByResourceId}
              maintenanceByResourceId={maintenanceByResourceId}
              isAdmin={isAdmin}
            />
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setView('list')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold font-headline">Añadir {category.name}</h1>
                </div>
            </div>
            <NewResourceForm category={category} onFormSubmit={handleFormSubmit} />
        </div>
        )}
      </div>

       {selectedResource && (
        <EditResourceDialog
          isOpen={isEditOpen}
          setIsOpen={setIsEditOpen}
          resource={selectedResource}
          categoryType={category.type}
        />
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este recurso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el recurso.
              No podrás eliminarlo si está actualmente <strong>En Préstamo</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <LoadingSpinner className="mr-2 h-4 w-4" />}
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedIds.length} recurso(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente los recursos seleccionados.
              Los recursos que estén actualmente <strong>En Préstamo</strong> serán omitidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBulkDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <LoadingSpinner className="mr-2 h-4 w-4" />}
              {isDeleting ? 'Eliminando...' : `Sí, eliminar (${selectedIds.length})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </TooltipProvider>
  );
});
