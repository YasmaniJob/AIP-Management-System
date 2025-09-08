// src/components/inventory/resource-card.tsx
'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { MoreHorizontal, Pencil, Trash2, AlertTriangle, MemoryStick, Cpu } from 'lucide-react';
import { CategoryIcon } from './category-icon';
import { ResourceInfoModal } from './resource-info-modal';
import { singularize } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { LoanWithResources } from '@/lib/types';


interface ResourceCardProps {
  resource: any;
  category: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (resource: any) => void;
  onDelete: (resource: any) => void;
  loan?: LoanWithResources;
  maintenance?: any;
  isAdmin: boolean;
  isTechCategory: boolean;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Disponible': return 'default';
    case 'En Préstamo': return 'secondary';
    case 'En Mantenimiento': return 'outline';
    case 'Dañado': return 'destructive';
    case 'En Reparación': return 'secondary';
    default: return 'default';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Disponible': return 'text-green-600 bg-green-50 border-green-200';
    case 'En Préstamo': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'En Mantenimiento': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'Dañado': return 'text-red-600 bg-red-50 border-red-200';
    case 'En Reparación': return 'text-purple-600 bg-purple-50 border-purple-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export function ResourceCard({
  resource,
  category,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  loan,
  maintenance,
  isAdmin,
  isTechCategory
}: ResourceCardProps) {

  
  return (
    <Card className={cn(
      "relative transition-all duration-200 hover:shadow-md overflow-hidden",
      isSelected && "ring-2 ring-primary ring-offset-2",
      resource.status === 'Dañado' && "border-red-200 bg-red-50/30",
      resource.status === 'En Mantenimiento' && "border-orange-200 bg-orange-50/30"
    )}>
      {/* Cinta de color primario en el lado izquierdo */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
      <CardContent className="p-4">
        {/* Header con checkbox y acciones */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CategoryIcon type={category.type} className="h-8 w-8" />
              <div>
                <h3 className="font-semibold text-lg">
                  {singularize(category.type)} {resource.number}
                </h3>
                <p className="text-sm text-muted-foreground">{resource.brand}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">

            
            {/* Menú de acciones */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onEdit(resource)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(resource)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Información principal */}
        <div className="space-y-3">
          {/* Modelo */}
          <div className="flex items-center gap-2">
            <CategoryIcon type={category.type} className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{resource.model}</span>
          </div>

          {/* Especificaciones técnicas para categorías tech */}
          {isTechCategory && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {resource.ram && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <MemoryStick className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">RAM:</span>
                  <span>{resource.ram}</span>
                </div>
              )}
              {resource.storage && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <Cpu className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">Almacenamiento:</span>
                  <span>{resource.storage}</span>
                </div>
              )}
            </div>
          )}

          {/* Estado */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {resource.status === 'Dañado' || resource.status === 'En reparación' ? (
                <ResourceInfoModal 
                  loan={loan}
                  maintenance={maintenance}
                  resourceName={resource.name}
                  resourceId={resource.id}
                  resourceStatus={resource.status}
                  onStatusChange={() => window.location.reload()}
                >
                  <Badge 
                    variant={getStatusVariant(resource.status)}
                    className={cn("cursor-pointer hover:opacity-80", getStatusColor(resource.status))}
                  >
                    {resource.status}
                  </Badge>
                </ResourceInfoModal>
              ) : (
                <ResourceInfoModal 
                  loan={loan}
                  maintenance={maintenance}
                  resourceName={resource.name}
                  resourceId={resource.id}
                  resourceStatus={resource.status}
                  onStatusChange={() => window.location.reload()}
                >
                  <Badge 
                    variant={getStatusVariant(resource.status)}
                    className={cn("cursor-pointer hover:opacity-80", getStatusColor(resource.status))}
                  >
                    {resource.status}
                  </Badge>
                </ResourceInfoModal>
              )}
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
}