'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, User, MapPin, Calendar, Package } from 'lucide-react';
import type { LoanWithResources } from '@/lib/types';
import { LoanActions } from './loan-actions';
import { LoanStatusBadge } from './loan-status-badge';

interface LoanCardProps {
  loan: LoanWithResources;
  onAction?: (action: string, loanId: string, reason?: string) => Promise<void>;
  showActions?: boolean;
  compact?: boolean;
  userRole?: string;
}

export function LoanCard({ loan, onAction, showActions = true, compact = false, userRole }: LoanCardProps) {
  const {
    id,
    teacher_name,
    teacher_email,
    teacher_dni,
    area,
    grade,
    section,
    status,
    resources,
    formattedLoanDateTime,
    formattedActualReturnDate,
    days_overdue,
    is_authorized
  } = loan;

  const resourceCount = resources?.length || 0;
  const isOverdue = status === 'Atrasado' || (days_overdue && days_overdue > 0);
  const isPending = !is_authorized;

  return (
    <Card className={`w-full transition-all duration-200 hover:shadow-md ${
      isOverdue ? 'border-red-200 bg-red-50/50' : 
      isPending ? 'border-yellow-200 bg-yellow-50/50' : 
      'border-gray-200'
    }`}>
      <CardHeader className={`pb-3 ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">
                  {teacher_name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {teacher_email || 'N/A'}
                </p>
                {teacher_dni && (
                  <p className="text-xs text-gray-500">
                    DNI: {teacher_dni}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{area}</span>
              </div>
              {grade && section && (
                <span>{grade} - {section}</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <LoanStatusBadge 
              status={status} 
              isAuthorized={is_authorized}
              daysOverdue={days_overdue}
              userRole={userRole}
            />
            {isOverdue && days_overdue && (
              <Badge variant="destructive" className="text-xs">
                {days_overdue} días de retraso
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`pt-0 ${compact ? 'p-4 pt-0' : 'p-6 pt-0'}`}>
        {/* Información de fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-500" />
            <div>
              <p className="font-medium text-gray-700">Fecha de préstamo</p>
              <p className="text-gray-600">{formattedLoanDateTime}</p>
            </div>
          </div>
          
          {status === 'Devuelto' && formattedActualReturnDate !== 'N/A' && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-green-500" />
              <div>
                <p className="font-medium text-gray-700">Fecha de devolución</p>
                <p className="text-gray-600">{formattedActualReturnDate}</p>
              </div>
            </div>
          )}
        </div>
        
        <Separator className="my-4" />
        
        {/* Recursos */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-purple-500" />
            <h4 className="font-medium text-gray-700">
              Recursos ({resourceCount})
            </h4>
          </div>
          
          {resourceCount > 0 ? (
            <div className="grid gap-2">
              {resources.slice(0, compact ? 2 : 5).map((resource, index) => (
                <div 
                  key={resource.id || index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {resource.name || 'Recurso sin nombre'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {resource.number && (
                        <span>#{resource.number}</span>
                      )}
                      {resource.brand && (
                        <span>{resource.brand}</span>
                      )}
                      {resource.model && (
                        <span>{resource.model}</span>
                      )}
                    </div>
                  </div>
                  
                  {resource.categoryType && (
                    <Badge variant="outline" className="text-xs ml-2">
                      {resource.categoryName || (typeof resource.categoryType === 'object' ? resource.categoryType?.name || resource.categoryType?.type : resource.categoryType)}
                    </Badge>
                  )}
                </div>
              ))}
              
              {resourceCount > (compact ? 2 : 5) && (
                <p className="text-xs text-gray-500 text-center py-1">
                  +{resourceCount - (compact ? 2 : 5)} recursos más
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No hay recursos asociados
            </p>
          )}
        </div>
        
        {/* Acciones */}
        {showActions && onAction && (
          <>
            <Separator className="my-4" />
            <LoanActions 
              loan={loan}
              onAction={onAction}
              compact={compact}
              userRole={userRole}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para vista de lista compacta
export function LoanCardCompact({ loan, onAction, showActions = true, userRole }: LoanCardProps) {
  return (
    <LoanCard 
      loan={loan}
      onAction={onAction}
      showActions={showActions}
      compact={true}
      userRole={userRole}
    />
  );
}

// Componente para vista de grilla
export function LoanCardGrid({ loans, onAction, showActions = true, userRole }: {
  loans: LoanWithResources[];
  onAction?: (action: string, loanId: string, reason?: string) => Promise<void>;
  showActions?: boolean;
  userRole?: string;
}) {
  if (!loans.length) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No hay préstamos para mostrar</p>
        <p className="text-gray-400 text-sm">Los préstamos aparecerán aquí cuando estén disponibles</p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 md:gap-6">
      {loans.map((loan) => (
        <LoanCard
          key={loan.id}
          loan={loan}
          onAction={onAction}
          showActions={showActions}
          userRole={userRole}
        />
      ))}
    </div>
  );
}