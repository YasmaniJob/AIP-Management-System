'use client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MaintenanceStatusBadgeProps {
  status: string;
  className?: string;
}

const getStatusConfig = (status: string) => {
  const normalizedStatus = status?.toLowerCase() || '';
  
  switch (normalizedStatus) {
    case 'pendiente':
    case 'pending':
      return {
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        label: 'Pendiente'
      };
    case 'en progreso':
    case 'in_progress':
    case 'en_progreso':
      return {
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        label: 'En Progreso'
      };
    case 'completado':
    case 'completed':
      return {
        className: 'bg-green-100 text-green-700 border-green-200',
        label: 'Completado'
      };
    case 'cancelado':
    case 'cancelled':
      return {
        className: 'bg-red-100 text-red-700 border-red-200',
        label: 'Cancelado'
      };
    case 'pausado':
    case 'paused':
      return {
        className: 'bg-orange-100 text-orange-700 border-orange-200',
        label: 'Pausado'
      };
    default:
      return {
        className: 'bg-gray-100 text-gray-700 border-gray-200',
        label: status || 'Sin Estado'
      };
  }
};

export function MaintenanceStatusBadge({ status, className }: MaintenanceStatusBadgeProps) {
  const config = getStatusConfig(status);
  
  return (
    <Badge className={cn('text-xs font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
}

export default MaintenanceStatusBadge;