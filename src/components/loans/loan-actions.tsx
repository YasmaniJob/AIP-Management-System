'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import type { LoanWithResources } from '@/lib/types';
import { authorizeLoanAction, rejectLoanAction } from '@/lib/actions/loans';
import { toast } from 'sonner';

interface LoanActionsProps {
  loan: LoanWithResources;
  onAction?: (action: string, loanId: string, reason?: string) => Promise<void>;
  compact?: boolean;
  userRole?: string;
}

export function LoanActions({ 
  loan, 
  onAction, 
  compact = false,
  userRole
}: LoanActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    id,
    status,
    is_authorized,
    days_overdue
  } = loan;

  const isPending = !is_authorized;
  const isActive = status === 'Activo' || status === 'Atrasado';
  const isReturned = status === 'Devuelto';
  const isRejected = status === 'Rechazado';
  const isOverdue = status === 'Atrasado' || (days_overdue && days_overdue > 0);

  const handleAction = async (action: string, reason?: string) => {
    setActionLoading(action);
    setLoading(true);
    
    try {
      if (onAction) {
        await onAction(action, id, reason);
      } else {
        let result;
        if (action === 'authorize') {
          result = await authorizeLoanAction(id);
        } else if (action === 'reject') {
          result = await rejectLoanAction(id, reason);
        }
        
        if (result?.success) {
          toast.success(result.message || 'Acción completada exitosamente');
          router.refresh();
        } else {
          toast.error(result?.error || 'Error al procesar la acción');
        }
      }
    } catch (error) {
      toast.error('Error al procesar la acción');
    } finally {
      setActionLoading(null);
      setLoading(false);
      setShowRejectDialog(false);
      setRejectReason('');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      return;
    }
    await handleAction('reject', rejectReason);
  };

  const handleReturn = async () => {
    // Navegar a la página de devolución detallada
    router.push(`/prestamos/${id}/devolver`);
  };

  const handleAuthorize = async () => {
    await handleAction('authorize');
  };

  const getActionButtons = () => {
    const buttons = [];

    // Solo los administradores pueden autorizar o rechazar préstamos
    const isAdmin = userRole === 'Administrador';

    // Acciones para préstamos pendientes (solo para administradores)
    if (isPending && !isRejected && isAdmin) {
      buttons.push(
        <Button
          key="authorize"
          variant="default"
          size={compact ? "sm" : "default"}
          onClick={handleAuthorize}
          disabled={loading || actionLoading === 'authorize'}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-all duration-200"
        >
          {actionLoading === 'authorize' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          {!compact && (actionLoading === 'authorize' ? "Autorizando..." : "Autorizar")}
        </Button>
      );

      buttons.push(
        <Button
          key="reject"
          variant="destructive"
          size={compact ? "sm" : "default"}
          onClick={() => setShowRejectDialog(true)}
          disabled={loading || actionLoading === 'reject'}
          className="flex items-center gap-2 transition-all duration-200"
        >
          <XCircle className="h-4 w-4" />
          {!compact && "Rechazar"}
        </Button>
      );
    }

    // Acciones para préstamos activos - Solo mostrar botón devolver para administradores
    if (isActive && is_authorized && isAdmin) {
      buttons.push(
        <Button
          key="return"
          variant="default"
          size={compact ? "sm" : "default"}
          onClick={handleReturn}
          disabled={loading || actionLoading === 'return'}
          className={`flex items-center gap-2 transition-all duration-200 ${
            isOverdue 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          {!compact && "Devolver"}
        </Button>
      );
    }

    return buttons;
  };

  const actionButtons = getActionButtons();

  if (actionButtons.length === 0) {
    return (
      <div className="flex items-center justify-center py-2">
        <Badge 
          variant={isReturned ? "default" : isRejected ? "destructive" : is_authorized ? "default" : "secondary"} 
          className="text-xs"
        >
          {isReturned && "Préstamo devuelto"}
          {isRejected && "Préstamo rechazado"}
          {is_authorized && !isReturned && !isRejected && "Préstamo autorizado"}
          {!is_authorized && !isReturned && !isRejected && "Pendiente de autorización"}
        </Badge>
      </div>
    );
  }

  return (
    <>
      <div className={`flex gap-2 ${
        compact ? 'flex-wrap' : 'flex-wrap sm:flex-nowrap'
      }`}>
        {actionButtons}
      </div>

      {/* Dialog para rechazar préstamo */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Rechazar Préstamo
            </DialogTitle>
            <DialogDescription>
              Por favor, proporciona una razón para rechazar este préstamo.
              Esta información será enviada al solicitante.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Razón del rechazo *</Label>
              <Textarea
                id="reject-reason"
                placeholder="Explica por qué se rechaza este préstamo..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2"
                rows={4}
                disabled={actionLoading === 'reject'}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                 setShowRejectDialog(false);
                 setRejectReason('');
               }}
               disabled={actionLoading === 'reject'}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || actionLoading === 'reject'}
              className="flex items-center gap-2 min-w-[140px]"
            >
              {actionLoading === 'reject' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rechazando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Rechazar Préstamo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </>
  );
}

// Componente simplificado para acciones rápidas
export function QuickLoanActions({ 
  loan, 
  onAction,
  userRole
}: {
  loan: LoanWithResources;
  onAction?: (action: string, loanId: string, reason?: string) => Promise<void>;
  userRole?: string;
}) {
  return (
    <LoanActions
      loan={loan}
      onAction={onAction}
      compact={true}
      userRole={userRole}
    />
  );
}