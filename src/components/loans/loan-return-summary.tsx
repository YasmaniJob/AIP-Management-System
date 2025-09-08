// src/components/loans/loan-return-summary.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, Hash, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CategoryIcon } from '../inventory/category-icon';
import { Badge } from '../ui/badge';

interface LoanReturnSummaryProps {
  loan: any;
}

export function LoanReturnSummary({ loan }: LoanReturnSummaryProps) {
  const user = loan.user;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Resumen del Préstamo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {user ? (
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.role}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground">
            <User className="h-5 w-5" />
            <span>Usuario no encontrado</span>
          </div>
        )}
        
        <Separator />
        
         <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Fecha Préstamo:</span>
                <span className="text-muted-foreground">{loan.loanDate ? format(parseISO(loan.loanDate), 'dd MMM yyyy, HH:mm', { locale: es }) : 'N/A'}</span>
            </div>
             <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Fecha de Devolución:</span>
                <span className="text-muted-foreground">{format(today, 'dd MMM yyyy, HH:mm', { locale: es })}</span>
            </div>
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-3 mb-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <p className="font-semibold">Recursos en Préstamo ({loan.resources.length})</p>
          </div>
          <ScrollArea className="max-h-60">
            <div className="space-y-2 pr-4">
              {loan.resources.length > 0 ? (
                loan.resources.map((resource: any) => (
                  <div key={resource.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                    <div className="flex items-center gap-2">
                        {resource.categoryType && <CategoryIcon type={resource.categoryType} className="w-4 h-4 text-muted-foreground" />}
                         <div>
                            <p className="text-sm font-medium">{resource.name}</p>
                            <p className="text-xs text-muted-foreground">{resource.brand} {resource.model}</p>
                        </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hay recursos en este préstamo.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
