import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { LoanWithResources, User, GradeWithSections } from '@/lib/types';
import { parseNotes } from '@/lib/utils';

export interface FormattedLoanData {
  'ID Préstamo': string;
  'Docente': string;
  'Área': string;
  'Grado': string;
  'Sección': string;
  'Estado': string;
  'Fecha Préstamo': string;
  'Fecha Devolución Programada': string;
  'Fecha Devolución Real'?: string;
  'Días de Retraso'?: number;
  'Recursos': string;
  'Cantidad Total': number;

  'Notas': string;
}



export function formatLoansForExport(
  loans: LoanWithResources[],
  users: User[],
  gradesWithSections: GradeWithSections[]
): FormattedLoanData[] {
  const usersMap = new Map(users.map(u => [u.id, u]));
  const gradesMap = new Map(gradesWithSections.map(g => [g.id, g]));

  return loans.map(loan => {
    const user = usersMap.get(loan.teacher_id);
    const grade = gradesMap.get(loan.grade_id || '');
    const section = grade?.sections.find(s => s.id === loan.section_id);
    
    // Formatear recursos
    const resourcesList = loan.resources.map(r => 
      `${r.name} (${r.category_name}) x${r.quantity}`
    ).join('; ');
    
    const totalQuantity = loan.resources.reduce((sum, r) => sum + r.quantity, 0);
    

    
    return {
      'ID Préstamo': loan.id,
      'Docente': user?.name || 'Usuario desconocido',
      'Área': loan.area || 'N/A',
      'Grado': grade?.name || 'N/A',
      'Sección': section?.name || 'N/A',
      'Estado': loan.status === 'active' ? 'Activo' : 
                loan.status === 'returned' ? 'Devuelto' : 
                loan.status === 'pending' ? 'Pendiente' : 
                loan.status === 'overdue' ? 'Vencido' : loan.status,
      'Fecha Préstamo': loan.loan_date ? 
        format(new Date(loan.loan_date), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A',
      'Fecha Devolución Programada': loan.expected_return_date ? 
        format(new Date(loan.expected_return_date), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A',
      'Fecha Devolución Real': loan.actual_return_date ? 
        format(new Date(loan.actual_return_date), 'dd/MM/yyyy HH:mm', { locale: es }) : undefined,
      'Días de Retraso': loan.days_overdue || undefined,
      'Recursos': resourcesList,
      'Cantidad Total': totalQuantity,

      'Notas': loan.notes || 'Sin notas'
    };
  });
}



// Función para formatear datos de mantenimiento
export function formatMaintenanceForExport(maintenanceRecords: any[]): any[] {
  return maintenanceRecords.map(record => ({
    'ID Mantenimiento': record.id,
    'Fecha Creación': record.created_at ? 
      format(new Date(record.created_at), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A',
    'Tipo': record.type === 'preventive' ? 'Preventivo' : 
            record.type === 'corrective' ? 'Correctivo' : record.type,
    'Estado': record.status === 'pending' ? 'Pendiente' :
              record.status === 'in_progress' ? 'En Progreso' :
              record.status === 'completed' ? 'Completado' : record.status,
    'Descripción': record.description || 'Sin descripción',
    'Costo': record.cost || 0,
    'Fecha Programada': record.scheduled_date ? 
      format(new Date(record.scheduled_date), 'dd/MM/yyyy', { locale: es }) : 'N/A',
    'Fecha Completado': record.completed_date ? 
      format(new Date(record.completed_date), 'dd/MM/yyyy', { locale: es }) : 'N/A'
  }));
}