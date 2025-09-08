// src/components/inventory/resource-info-tooltip.tsx
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { LoanWithResources } from '@/lib/types';
import { User, Calendar, Settings, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ResourceInfoTooltipProps {
  loan?: LoanWithResources;
  notes?: string | null;
  maintenance?: any;
  children: React.ReactNode;
}

export function ResourceInfoTooltip({ loan, notes, maintenance, children }: ResourceInfoTooltipProps) {
  const hasContent = !!loan || !!notes || !!maintenance;

  if (!hasContent) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {loan && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-semibold text-xs">Docente a Cargo:</p>
                <p>{loan.user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-semibold text-xs">Devolución:</p>
                <p>{loan.return_date ? format(parseISO(loan.return_date), 'dd MMM yyyy', { locale: es }) : 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
        {maintenance && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-semibold text-xs">En Mantenimiento:</p>
                <p className="text-xs">{maintenance.current_status}</p>
              </div>
            </div>

            {maintenance.assigned_user_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-xs">Asignado a:</p>
                  <p className="text-xs">{maintenance.assigned_user_name}</p>
                </div>
              </div>
            )}
            {maintenance.estimated_completion_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-xs">Estimado:</p>
                  <p className="text-xs">{format(parseISO(maintenance.estimated_completion_date), 'dd MMM yyyy', { locale: es })}</p>
                </div>
              </div>
            )}
          </div>
        )}
        {notes && (
          <div className="mt-2">
            <p className="font-semibold text-xs mb-1">Notas:</p>
            <p className="max-w-xs text-xs">{notes}</p>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
