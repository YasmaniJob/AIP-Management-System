// src/lib/data/loans.ts
'use server';
import { dataService } from '../services/data-service';
import type { Loan, LoanWithResources } from '../types';
import { format, addDays, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { createServerClient } from '../supabase/server';

const LOANS_PER_PAGE = 10;

// Consulta optimizada reutilizable para préstamos con recursos
const LOAN_SELECT_QUERY = `
    *,
    user:users (id, name, email, dni),
    area:areas (name),
    grade:grades (name),
    section:sections (name),
    loan_resources (
        resources (
            id, number, brand, model, status,
            category:categories(type, name)
        )
    )
`;

// Función helper para formatear préstamos
function formatLoanData(loan: any) {
    const formattedLoanDateTime = format(parseISO(loan.created_at), 'dd MMM yyyy, HH:mm', { locale: es });
    const formattedActualReturnDate = loan.actual_return_date 
        ? format(parseISO(loan.actual_return_date), 'dd MMM yyyy, HH:mm', { locale: es }) 
        : 'N/A';
    
    const resources = loan.loan_resources?.map((lr: any) => ({
        ...lr.resources,
        name: lr.resources.number ? `Recurso #${lr.resources.number}` : 'Recurso sin número',
        categoryType: lr.resources.category?.type,
        categoryName: lr.resources.category?.name
    })) || [];
    
    return {
        ...loan,
        teacher_id: loan.user?.id || '',
        teacher_name: loan.user?.name || 'N/A',
        teacher_email: loan.user?.email || 'N/A',
        teacher_dni: loan.user?.dni || 'N/A',
        area: loan.area?.name || 'N/A',
        grade: loan.grade?.name || 'N/A',
        section: loan.section?.name || 'N/A',
        resources,
        formattedLoanDateTime,
        formattedActualReturnDate,
    };
}

interface GetLoansParams {
  page?: number;
  perPage?: number;
  status: Array<'Activo' | 'Devuelto' | 'Atrasado' | 'Pendiente' | 'Rechazado'>;
  date?: string; // yyyy-MM-dd
  timezone?: string;
  teacherId?: string;
}


export async function getLoans({ 
    page = 1, 
    perPage = LOANS_PER_PAGE,
    status,
    date,
    timezone = 'UTC',
    teacherId
}: GetLoansParams) {
    const filters: any = {
        status: status
    };

    if (teacherId) {
        filters.teacher_id = teacherId;
    }
    
    if (date && status.includes('Devuelto')) {
        const parsedDate = parseISO(date);
        const startDate = formatInTimeZone(parsedDate, timezone, 'yyyy-MM-dd HH:mm:ss.SSSxxx');
        const endDate = formatInTimeZone(addDays(parsedDate, 1), timezone, 'yyyy-MM-dd HH:mm:ss.SSSxxx');

        filters.actual_return_date = { gte: startDate, lt: endDate };
    }
    
    const orderBy = status.includes('Devuelto') 
        ? { actual_return_date: 'desc' as const }
        : { created_at: 'desc' as const };

    const { data, count } = await dataService.findManyWithCount('loans', {
        select: LOAN_SELECT_QUERY,
        filters,
        orderBy,
        pagination: { page, perPage }
    });

    const loans = data.map(formatLoanData);
    
    return { loans, count };
}


export async function getActiveLoans(): Promise<LoanWithResources[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from('loans')
        .select(LOAN_SELECT_QUERY)
        .in('status', ['Activo', 'Atrasado']);

    if (error) {
        // Error fetching active loans
        return [];
    }
    
    return data.map(formatLoanData);
}


export async function getPendingLoans({ 
    page = 1, 
    perPage = LOANS_PER_PAGE,
    timezone = 'UTC'
}: {
    page?: number;
    perPage?: number;
    timezone?: string;
}) {
    const supabase = await createServerClient();
    const offset = (page - 1) * perPage;

    // Query loans that are not authorized (pending approval)
    const { data, error, count } = await supabase
        .from('loans')
        .select(LOAN_SELECT_QUERY, { count: 'exact' })
        .eq('is_authorized', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + perPage - 1);

    if (error) {
        // Error fetching pending loans
        return { loans: [], count: 0 };
    }
    
    const loans = data.map(formatLoanData);
    
    return { loans, count: count || 0 };
}

export async function getLoanById(id: string) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from('loans')
        .select(LOAN_SELECT_QUERY)
        .eq('id', id)
        .single();
        
    if (error) {
        // Error fetching loan by id
        return null;
    }
    
    const formattedLoan = formatLoanData(data);
    
    return {
        ...formattedLoan,
        returnDate: data.return_date,
        loanDate: data.created_at,
    };
}
