'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoanSkeletonProps {
  count?: number;
}

export function LoanSkeleton({ count = 3 }: LoanSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header con estado y acciones */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20" /> {/* Badge de estado */}
                  <Skeleton className="h-4 w-32" /> {/* ID del préstamo */}
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" /> {/* Botón 1 */}
                  <Skeleton className="h-8 w-20" /> {/* Botón 2 */}
                </div>
              </div>

              {/* Información del préstamo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" /> {/* Label */}
                  <Skeleton className="h-5 w-24" /> {/* Valor */}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" /> {/* Label */}
                  <Skeleton className="h-5 w-32" /> {/* Valor */}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-18" /> {/* Label */}
                  <Skeleton className="h-5 w-28" /> {/* Valor */}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" /> {/* Label */}
                  <Skeleton className="h-5 w-20" /> {/* Valor */}
                </div>
              </div>

              {/* Recursos */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" /> {/* Label "Recursos" */}
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-24" /> {/* Recurso 1 */}
                  <Skeleton className="h-6 w-32" /> {/* Recurso 2 */}
                  <Skeleton className="h-6 w-28" /> {/* Recurso 3 */}
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" /> {/* Label fecha */}
                  <Skeleton className="h-4 w-32" /> {/* Valor fecha */}
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" /> {/* Label fecha */}
                  <Skeleton className="h-4 w-32" /> {/* Valor fecha */}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton para la vista de tabla compacta
export function LoanTableSkeleton({ count = 5 }: LoanSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border rounded-lg p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-20" /> {/* Estado */}
              <Skeleton className="h-4 w-32" /> {/* Docente */}
              <Skeleton className="h-4 w-24" /> {/* Área */}
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" /> {/* Acción 1 */}
              <Skeleton className="h-8 w-16" /> {/* Acción 2 */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}