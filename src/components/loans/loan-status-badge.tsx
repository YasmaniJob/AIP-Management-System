'use client';

import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  HourglassIcon,
  RotateCcw,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoanStatusBadgeProps {
  status?: string;
  isAuthorized?: boolean;
  daysOverdue?: number | null;
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
  loan?: any;
  userRole?: string;
}

export function LoanStatusBadge({ 
  status, 
  isAuthorized = true, 
  daysOverdue, 
  size = 'default',
  showIcon = true,
  className,
  loan,
  userRole
}: LoanStatusBadgeProps) {
  
  // Extraer datos del objeto loan si se proporciona
  const actualStatus = status || loan?.status;
  const actualIsAuthorized = isAuthorized ?? loan?.is_authorized ?? true;
  const actualDaysOverdue = daysOverdue ?? loan?.daysOverdue;
  
  // Determinar el estado real considerando autorización
  const getEffectiveStatus = () => {
    if (!actualIsAuthorized && actualStatus !== 'Rechazado') {
      return 'Pendiente';
    }
    return actualStatus;
  };

  const effectiveStatus = getEffectiveStatus();
  const isOverdue = actualStatus === 'Atrasado' || (actualDaysOverdue && actualDaysOverdue > 0);

  // Configuración de estilos por estado
  const getStatusConfig = () => {
    switch (effectiveStatus) {
      case 'Atrasado':
        const daysText = actualDaysOverdue && actualDaysOverdue > 0 
          ? ` (${actualDaysOverdue} día${actualDaysOverdue !== 1 ? 's' : ''})`
          : '';
        return {
          variant: 'destructive' as const,
          icon: AlertTriangle,
          label: `Atrasado${daysText}`,
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 animate-pulse'
        };
      
      case 'Devuelto':
        return {
          variant: 'secondary' as const,
          icon: CheckCircle,
          label: 'Devuelto',
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-all duration-200'
        };
      
      case 'Rechazado':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Rechazado',
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 transition-all duration-200'
        };
      
      default:
        // Solo mostrar 'Desconocido' para docentes, otros roles no ven badge
        if (userRole === 'Docente') {
          return {
            variant: 'outline' as const,
            icon: Clock,
            label: actualStatus || 'Desconocido',
            className: 'bg-gray-100 text-gray-600 border-gray-200'
          };
        } else {
          // Para otros roles, no mostrar badge
          return null;
        }
    }
  };

  const config = getStatusConfig();
  
  // Si no hay configuración, no renderizar nada
  if (!config) {
    return null;
  }
  
  const Icon = config.icon;

  // Tamaños de iconos y texto
  const sizeConfig = {
    sm: {
      iconSize: 'h-3 w-3',
      textSize: 'text-xs',
      padding: 'px-2 py-1'
    },
    default: {
      iconSize: 'h-4 w-4',
      textSize: 'text-sm',
      padding: 'px-2.5 py-1.5'
    },
    lg: {
      iconSize: 'h-5 w-5',
      textSize: 'text-base',
      padding: 'px-3 py-2'
    }
  };

  const currentSize = sizeConfig[size];

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        'flex items-center gap-1.5 font-medium transition-colors',
        config.className,
        currentSize.padding,
        currentSize.textSize,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn('flex-shrink-0', currentSize.iconSize)} />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}

// Componente específico para mostrar días de retraso
export function OverdueBadge({ 
  daysOverdue, 
  size = 'default' 
}: { 
  daysOverdue: number; 
  size?: 'sm' | 'default' | 'lg';
}) {
  if (daysOverdue <= 0) return null;

  const sizeConfig = {
    sm: { iconSize: 'h-3 w-3', textSize: 'text-xs' },
    default: { iconSize: 'h-4 w-4', textSize: 'text-sm' },
    lg: { iconSize: 'h-5 w-5', textSize: 'text-base' }
  };

  const currentSize = sizeConfig[size];

  return (
    <Badge 
      variant="destructive"
      className={cn(
        'flex items-center gap-1 bg-red-100 text-red-800 border-red-200',
        currentSize.textSize
      )}
    >
      <AlertTriangle className={cn('flex-shrink-0', currentSize.iconSize)} />
      <span>
        {daysOverdue} día{daysOverdue !== 1 ? 's' : ''} de retraso
      </span>
    </Badge>
  );
}

// Componente combinado que muestra estado y retraso
export function CompleteLoanStatus({ 
  status, 
  isAuthorized, 
  daysOverdue, 
  size = 'default',
  showIcon = true,
  vertical = false 
}: LoanStatusBadgeProps & { vertical?: boolean }) {
  const hasOverdue = daysOverdue && daysOverdue > 0;
  
  if (vertical) {
    return (
      <div className="flex flex-col gap-1">
        <LoanStatusBadge 
          status={status}
          isAuthorized={isAuthorized}
          daysOverdue={daysOverdue}
          size={size}
          showIcon={showIcon}
        />
        {hasOverdue && (
          <OverdueBadge daysOverdue={daysOverdue} size={size} />
        )}
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <LoanStatusBadge 
        status={status}
        isAuthorized={isAuthorized}
        daysOverdue={daysOverdue}
        size={size}
        showIcon={showIcon}
      />
      {hasOverdue && (
        <OverdueBadge daysOverdue={daysOverdue} size={size} />
      )}
    </div>
  );
}

// Hook para obtener información de estado
export function useLoanStatus(status: string, isAuthorized: boolean, daysOverdue?: number | null) {
  const isOverdue = status === 'Atrasado' || (daysOverdue && daysOverdue > 0);
  const isPending = !isAuthorized && status !== 'Rechazado';
  const isActive = (status === 'Activo' || status === 'Atrasado') && isAuthorized;
  const isReturned = status === 'Devuelto';
  const isRejected = status === 'Rechazado';
  
  const effectiveStatus = isPending ? 'Pendiente' : status;
  
  const priority = {
    'Atrasado': 1,
    'Pendiente': 2,
    'Activo': 3,
    'Devuelto': 4,
    'Rechazado': 5
  }[effectiveStatus] || 6;
  
  return {
    effectiveStatus,
    isOverdue,
    isPending,
    isActive,
    isReturned,
    isRejected,
    priority,
    needsAttention: isOverdue || isPending
  };
}