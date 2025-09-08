'use client';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

interface MaintenanceActionsProps {
  record: any;
  isHistory?: boolean;
  actionLoading?: any;
  onShowDetails: () => void;
}

export function MaintenanceActions({ record, isHistory = false, actionLoading, onShowDetails }: MaintenanceActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    
    try {
      switch (action) {
        case 'details':
          onShowDetails();
          break;
        case 'complete':
          // Implementar lógica para completar mantenimiento
          console.log('Completar mantenimiento:', record.id);
          break;
        case 'cancel':
          // Implementar lógica para cancelar mantenimiento
          console.log('Cancelar mantenimiento:', record.id);
          break;
        case 'delete':
          // Implementar lógica para eliminar mantenimiento
          console.log('Eliminar mantenimiento:', record.id);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error en acción de mantenimiento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 hover:bg-gray-100"
          disabled={isLoading || actionLoading?.[record.id]}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={(e) => handleAction('details', e)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalles
        </DropdownMenuItem>
        
        {!isHistory && (
          <>
            
            <DropdownMenuItem onClick={(e) => handleAction('complete', e)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar Completado
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={(e) => handleAction('cancel', e)}
              className="text-yellow-600"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={(e) => handleAction('delete', e)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}