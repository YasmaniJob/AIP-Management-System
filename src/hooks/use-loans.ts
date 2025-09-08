'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import type { LoanWithResources } from '@/lib/types';

interface UseLoansOptions {
  initialTab?: 'active' | 'history' | 'pending';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseLoansReturn {
  // Estado
  activeLoans: LoanWithResources[];
  historyLoans: LoanWithResources[];
  pendingLoans: LoanWithResources[];
  loading: boolean;
  error: string | null;
  actionLoading: string | null;
  
  // Paginación
  currentPage: number;
  totalPages: number;
  totalCount: number;
  
  // Filtros
  selectedDate: string;
  currentTab: string;
  timezone: string;
  
  // Acciones
  setCurrentPage: (page: number) => void;
  setSelectedDate: (date: string) => void;
  setCurrentTab: (tab: string) => void;
  refreshLoans: () => Promise<void>;
  handleLoanAction: (action: string, loanId: string, reason?: string) => Promise<void>;
}

export function useLoans(options: UseLoansOptions = {}): UseLoansReturn {
  const {
    initialTab = 'active',
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estado local
  const [activeLoans, setActiveLoans] = useState<LoanWithResources[]>([]);
  const [historyLoans, setHistoryLoans] = useState<LoanWithResources[]>([]);
  const [pendingLoans, setPendingLoans] = useState<LoanWithResources[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Parámetros de URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const selectedDate = searchParams.get('date') || '';
  const currentTab = searchParams.get('loan_tab') || initialTab;
  const timezone = searchParams.get('tz') || 'UTC';
  
  // Función para actualizar parámetros de URL
  const updateUrlParams = useCallback((params: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });
    
    router.push(`?${newSearchParams.toString()}`);
  }, [router, searchParams]);
  
  // Función para cargar préstamos
  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar acciones de servidor directamente en lugar de API routes
      const { getLoans, getPendingLoans } = await import('@/lib/data/loans');
      
      let data;
      if (currentTab === 'pending') {
        data = await getPendingLoans();
      } else {
        data = await getLoans({
          page: currentPage,
          status: currentTab === 'active' ? 'active' : 'returned',
          date: selectedDate
        });
      }
      
      switch (currentTab) {
        case 'active':
          setActiveLoans(data.loans || []);
          break;
        case 'history':
          setHistoryLoans(data.loans || []);
          break;
        case 'pending':
          setPendingLoans(data.loans || []);
          break;
      }
      
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 10));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar préstamos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentTab, selectedDate, timezone]);
  
  // Función para manejar acciones de préstamos
  const handleLoanAction = useCallback(async (action: string, loanId: string, reason?: string) => {
    try {
      setActionLoading(action);
      
      // Usar acciones de servidor directamente
      const { authorizeLoanAction, rejectLoanAction, returnLoanAction } = await import('@/lib/actions/loans');
      
      let result;
      switch (action) {
        case 'authorize':
          result = await authorizeLoanAction(loanId);
          break;
        case 'reject':
          result = await rejectLoanAction(loanId, reason || '');
          break;
        case 'return':
          result = await returnLoanAction(loanId, reason);
          break;
        default:
          throw new Error(`Acción no válida: ${action}`);
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Error al procesar la acción');
      }
      
      toast.success(result.message || 'Acción completada exitosamente');
      await loadLoans(); // Recargar datos
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar la acción';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  }, [loadLoans]);
  
  // Funciones para actualizar estado
  const setCurrentPage = useCallback((page: number) => {
    updateUrlParams({ page: page.toString() });
  }, [updateUrlParams]);
  
  const setSelectedDate = useCallback((date: string) => {
    updateUrlParams({ date, page: '1' }); // Reset a página 1 al cambiar fecha
  }, [updateUrlParams]);
  
  const setCurrentTab = useCallback((tab: string) => {
    updateUrlParams({ loan_tab: tab, page: '1' }); // Reset a página 1 al cambiar tab
  }, [updateUrlParams]);
  
  const refreshLoans = useCallback(async () => {
    await loadLoans();
  }, [loadLoans]);
  
  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadLoans();
  }, [loadLoans]);
  
  // Efecto para auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadLoans();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadLoans]);
  
  return {
    // Estado
    activeLoans,
    historyLoans,
    pendingLoans,
    loading,
    error,
    actionLoading,
    
    // Paginación
    currentPage,
    totalPages,
    totalCount,
    
    // Filtros
    selectedDate,
    currentTab,
    timezone,
    
    // Acciones
    setCurrentPage,
    setSelectedDate,
    setCurrentTab,
    refreshLoans,
    handleLoanAction
  };
}

// Hook específico para acciones de préstamos
export function useLoanActions() {
  const [loading, setLoading] = useState(false);
  
  const executeAction = useCallback(async (
    action: 'authorize' | 'reject' | 'return',
    loanId: string,
    reason?: string
  ) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/loans/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          loanId,
          reason
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al procesar la acción');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || 'Acción completada exitosamente');
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error || 'Error en la acción');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    loading,
    executeAction
  };
}

// Hook para filtros de préstamos
export function useLoanFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const filters = {
    page: parseInt(searchParams.get('page') || '1'),
    date: searchParams.get('date') || '',
    tab: searchParams.get('loan_tab') || 'active',
    timezone: searchParams.get('tz') || 'UTC'
  };
  
  const updateFilter = useCallback((key: string, value: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    if (value) {
      newSearchParams.set(key, value);
    } else {
      newSearchParams.delete(key);
    }
    
    // Reset página al cambiar filtros (excepto página)
    if (key !== 'page') {
      newSearchParams.set('page', '1');
    }
    
    router.push(`?${newSearchParams.toString()}`);
  }, [router, searchParams]);
  
  const clearFilters = useCallback(() => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('loan_tab', 'active');
    newSearchParams.set('page', '1');
    
    // Mantener timezone
    const tz = searchParams.get('tz');
    if (tz) {
      newSearchParams.set('tz', tz);
    }
    
    router.push(`?${newSearchParams.toString()}`);
  }, [router, searchParams]);
  
  return {
    filters,
    updateFilter,
    clearFilters
  };
}