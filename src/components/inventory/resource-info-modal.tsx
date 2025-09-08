// src/components/inventory/resource-info-modal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LoanWithResources } from '@/lib/types';
import { User, Calendar, AlertTriangle, FileText, Bug, Settings } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';


interface ResourceInfoModalProps {
  loan?: LoanWithResources;
  notes?: string | null;
  maintenance?: any;
  children: React.ReactNode;
  resourceName?: string;
  resourceId?: string;
  resourceStatus?: string;
  onStatusChange?: () => void;
}

export function ResourceInfoModal({ 
  loan, 
  notes, 
  maintenance, 
  children, 
  resourceName, 
  resourceId, 
  resourceStatus,
  onStatusChange 
}: ResourceInfoModalProps) {

  const { toast } = useToast();

  const hasContent = !!loan || !!notes || !!maintenance;





  if (!hasContent) {
    return <>{children}</>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información del Recurso
            {resourceName && (
              <Badge variant="outline" className="ml-2">
                {resourceName}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">

          
          {loan && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Préstamo Activo
              </h4>
              <div className="pl-6 space-y-2">
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Docente a Cargo:</p>
                  <p className="text-sm">{loan.user.name}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Fecha de Devolución:</p>
                  <p className="text-sm">
                    {loan.return_date ? format(parseISO(loan.return_date), 'dd MMM yyyy', { locale: es }) : 'No especificada'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Área:</p>
                  <p className="text-sm">{loan.area || 'No especificada'}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Grado y Sección:</p>
                  <p className="text-sm">{loan.grade} {loan.section}</p>
                </div>
              </div>
            </div>
          )}
          
          {maintenance && (
            <>
              {loan && <Separator />}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4 text-orange-600" />
                  Estado de Mantenimiento
                </h4>
                <div className="pl-6 space-y-2">
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Estado Actual:</p>
                    <Badge variant="outline" className="mt-1">
                      {maintenance.current_status}
                    </Badge>
                  </div>

                  {maintenance.assigned_user_name && (
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Asignado a:</p>
                      <p className="text-sm">{maintenance.assigned_user_name}</p>
                    </div>
                  )}
                  {maintenance.estimated_completion_date && (
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Fecha Estimada de Finalización:</p>
                      <p className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(maintenance.estimated_completion_date), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  )}
                  {maintenance.description && (
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Descripción:</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                        {maintenance.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {notes && (
            <>
              {(loan || maintenance) && <Separator />}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  Notas Adicionales
                </h4>
                <div className="pl-6">
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md leading-relaxed">
                    {notes}
                  </p>
                </div>
              </div>
            </>
          )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}