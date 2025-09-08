// src/components/inventory/resources-grid.tsx
'use client';
import { ResourceCard } from './resource-card';
import { isTechCategory } from '@/lib/constants/shared-schemas';
import type { LoanWithResources } from '@/lib/types';


interface ResourcesGridProps {
  resources: any[];
  category: any;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onEdit: (resource: any) => void;
  onDelete: (resource: any) => void;
  loanByResourceId: Map<string, LoanWithResources>;
  maintenanceByResourceId: Map<string, any>;
  isAdmin: boolean;
}

export function ResourcesGrid({
  resources,
  category,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
  loanByResourceId,
  maintenanceByResourceId,
  isAdmin
}: ResourcesGridProps) {
  const isCurrentlyTechCategory = isTechCategory(category?.type || '');



  if (resources.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg">No hay recursos que coincidan con el filtro.</p>
        <p className="text-sm text-muted-foreground mt-2">Prueba cambiando los filtros o añade nuevos recursos.</p>
      </div>
    );
  }

  return (
    <div className="pr-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            category={category}
            isSelected={selectedIds.includes(resource.id)}
            onSelect={onToggleSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            loan={loanByResourceId.get(resource.id)}
            maintenance={maintenanceByResourceId.get(resource.id)}
            isAdmin={isAdmin}
            isTechCategory={isCurrentlyTechCategory}
          />
        ))}
      </div>
    </div>
  );
}