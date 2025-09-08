// src/app/(app)/prestamos/page.tsx
import { LoansClientView } from "@/components/loans/loans-client-view";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoans, getPendingLoans } from "@/lib/data/loans";
import { getUsers } from "@/lib/data/users";
import { getGradesWithSections } from "@/lib/data/settings";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

function LoansTableSkeleton() {
    return (
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

const LOANS_PER_PAGE = 10;

export default async function PrestamosPage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
    date?: string;
    loan_tab?: 'activos' | 'historial';
    tz?: string;
  };
}) {
    const params = await searchParams;
    const supabase = await createServerClient();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    const { data: profile } = await supabase.from('users').select('role').eq('id', userId!).single();
    const userRole = profile?.role;
    const isTeacher = userRole === 'Docente';
    const teacherId = isTeacher ? userId : undefined;

    const currentPage = Number(params?.page) || 1;
    const activeTab = params?.loan_tab || 'activos';
    const selectedDate = params?.date;
    const timezone = params?.tz || 'UTC';

    const usersPromise = getUsers({ role: 'Docente' }).then(docentes => 
        getUsers({ role: 'Administrador' }).then(admins => [...docentes, ...admins])
    );
    const gradesWithSectionsPromise = getGradesWithSections();
    
    const activeLoansPromise = getLoans({
        page: activeTab === 'activos' ? currentPage : 1,
        perPage: LOANS_PER_PAGE,
        status: ['Activo', 'Atrasado'],
        timezone: timezone,
        teacherId: teacherId,
    });
    
    const historyLoansPromise = getLoans({
        page: activeTab === 'historial' ? currentPage : 1,
        perPage: LOANS_PER_PAGE,
        status: ['Devuelto'],
        date: selectedDate,
        timezone: timezone,
        teacherId: teacherId,
    });
    
    // Incluir solicitudes pendientes en la vista de activos para administradores
    const pendingLoansPromise = !isTeacher ? getPendingLoans({
        page: activeTab === 'activos' ? currentPage : 1,
        perPage: LOANS_PER_PAGE,
        timezone: timezone,
    }) : Promise.resolve({ loans: [], count: 0 });

    const [
        users, 
        gradesWithSections, 
        { loans: activeLoans, count: activeTotalCount }, 
        { loans: historyLoans, count: historyTotalCount },
        { loans: pendingLoans, count: pendingTotalCount }
    ] = await Promise.all([
        usersPromise,
        gradesWithSectionsPromise,
        activeLoansPromise,
        historyLoansPromise,
        pendingLoansPromise
    ]);

    return (
        <Suspense fallback={<LoansTableSkeleton />}>
            <LoansClientView
                initialActiveLoans={activeLoans}
                initialHistoryLoans={historyLoans}
                initialPendingLoans={pendingLoans}
                users={users}
                gradesWithSections={gradesWithSections}
                historyTotalCount={historyTotalCount || 0}
                activeTotalCount={activeTotalCount || 0}
                pendingTotalCount={pendingTotalCount || 0}
                currentPage={currentPage}
                selectedDate={selectedDate}
                activeTab={activeTab}
                userRole={userRole}
            />
        </Suspense>
    );
}
