// src/components/loans/loans-client-view.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, PlusCircle, X, ArrowRightLeft, History } from 'lucide-react';
import { LoansTable } from './loans-table';
import { ExportButton } from '@/components/shared/export-button';
import Link from 'next/link';
import { LoansPagination } from './loans-pagination';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format, parseISO, startOfDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { UnifiedFilterTabs, useFilterTabs, type FilterTab } from '@/components/shared/unified-filter-tabs';
import { LoanWithResources, User, GradeWithSections, UserRole } from '@/lib/types';
import { LoanSkeleton } from './loan-skeleton';
import { formatLoansForExport } from '@/lib/utils/export-formatters';
import { toast } from 'sonner';



const LOANS_PER_PAGE = 10;
interface LoansClientViewProps {
  initialActiveLoans: LoanWithResources[];
  initialHistoryLoans: LoanWithResources[];
  initialPendingLoans: LoanWithResources[];
  users: User[];
  gradesWithSections: GradeWithSections[];
  historyTotalCount: number;
  activeTotalCount: number;
  pendingTotalCount: number;
  currentPage: number;
  selectedDate?: string;
  activeTab: 'activos' | 'historial';
  userRole: UserRole;
}

export function LoansClientView({ 
    initialActiveLoans,
    initialHistoryLoans,
    initialPendingLoans,
    users, 
    gradesWithSections,
    historyTotalCount,
    activeTotalCount,
    pendingTotalCount,
    currentPage,
    selectedDate,
    activeTab,
    userRole
}: LoansClientViewProps) {

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const { currentTab, isTab } = useFilterTabs('loan_tab', 'activos');
  
  const [date, setDate] = useState<Date | undefined>(
    selectedDate ? startOfDay(parseISO(selectedDate)) : undefined
  );
  
  const [clientDate, setClientDate] = useState<string | null>(null);
  
  const isTeacher = userRole === 'Docente';

  useEffect(() => {
    setClientDate(format(new Date(), 'PPP', { locale: es }));
    const params = new URLSearchParams(searchParams);
    
    if (!params.has('tz')) {
      params.set('tz', Intl.DateTimeFormat().resolvedOptions().timeZone);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [pathname, router, searchParams]);


  const updateURL = (newParams: URLSearchParams) => {
    if (!newParams.has('tz')) {
      newParams.set('tz', Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    router.push(`${pathname}?${newParams.toString()}`);
  }

  const handleDateChange = (newDate: Date | undefined) => {
    const params = new URLSearchParams(searchParams);
    setDate(newDate);
    if (newDate) {
      params.set('date', format(newDate, 'yyyy-MM-dd'));
    } else {
      params.delete('date');
    }
    params.set('page', '1');
    updateURL(params);
  }

  // Combinar préstamos activos y pendientes para la vista unificada, evitando duplicados
  const activeLoansMap = new Map(initialActiveLoans.map(loan => [loan.id, loan]));
  const pendingLoansNotInActive = initialPendingLoans.filter(loan => !activeLoansMap.has(loan.id));
  const combinedActiveLoans = [...initialActiveLoans, ...pendingLoansNotInActive];
  const combinedActiveTotalCount = activeTotalCount + pendingTotalCount;

  const filterTabs: FilterTab[] = [
    {
      value: 'activos',
      label: 'Activos',
      color: 'blue',
      count: combinedActiveTotalCount,
      icon: ArrowRightLeft
    },
    {
      value: 'historial',
      label: 'Historial',
      color: 'green',
      count: historyTotalCount,
      icon: History
    }
  ];



  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('loan_tab', tab);
    params.set('page', '1');
    
    if (tab === 'activos' && params.has('date')) {
      params.delete('date');
      setDate(undefined);
    }

    updateURL(params);
  }

  const pageCount = Math.ceil(
    (activeTab === 'activos' ? combinedActiveTotalCount : historyTotalCount) / LOANS_PER_PAGE
  );

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-headline">{isTeacher ? "Mis Préstamos" : "Gestión de Préstamos"}</h1>
            <div className="flex items-center gap-2">
                {isTeacher ? (
                    <Button asChild>
                        <Link href="/prestamos/solicitar">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Solicitar Préstamo
                        </Link>
                    </Button>
                ) : (
                    <Button asChild>
                        <Link href="/prestamos/nuevo">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nuevo Préstamo
                        </Link>
                    </Button>
                )}
            </div>
        </div>
        
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <UnifiedFilterTabs 
                    tabs={filterTabs} 
                    defaultTab={activeTab} 
                    paramName="loan_tab"
                    onTabChange={handleTabChange}
                />
                <div className="flex items-center gap-2">
                    <ExportButton
                         data={formatLoansForExport(
                             isTab('activos') ? combinedActiveLoans : initialHistoryLoans,
                             users,
                             gradesWithSections
                         )}
                         filename={`prestamos_${isTab('activos') ? 'activos' : 'historial'}_${format(new Date(), 'yyyy-MM-dd')}`}
                         sheetName={isTab('activos') ? 'Préstamos Activos' : 'Historial de Préstamos'}
                         variant="outline"
                         size="sm"
                     />
                    {isTab('historial') ? (
                        <>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP", { locale: es }) : (clientDate || "Filtrar por fecha...")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={handleDateChange}
                                        defaultMonth={date || new Date()}
                                        initialFocus
                                        disabled={(d) => d > new Date()}
                                    />
                                </PopoverContent>
                            </Popover>
                            {date && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDateChange(undefined)}
                                    className="h-9 w-9"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    ) : (
                        <div className="text-sm font-medium text-muted-foreground border rounded-md px-3 h-10 flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span>{clientDate || 'Cargando fecha...'}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 space-y-4">
                {isTab('activos') && (
                    <LoansTable
                        loans={combinedActiveLoans}
                        users={users} 
                        gradesWithSections={gradesWithSections}
                        isHistory={false}
                        isPending={false}
                        actionLoading={actionLoading}
                        userRole={userRole}
                    />
                )}
                {isTab('historial') && (
                    <LoansTable
                        loans={initialHistoryLoans}
                        users={users} 
                        gradesWithSections={gradesWithSections}
                        isHistory={true}
                        isPending={false}
                        actionLoading={actionLoading}
                        userRole={userRole}
                    />
                )}
                {pageCount > 1 && (
                    <div className="mt-4 flex justify-end">
                       <LoansPagination
                            currentPage={currentPage}
                            pageCount={pageCount}
                            isLoading={actionLoading !== null}
                        />
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
