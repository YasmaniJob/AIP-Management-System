// src/hooks/use-maintenance-optimized.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  MaintenanceOptimized,
  MaintenanceStats,
  MaintenanceFilters,
  PaginationParams,
  MaintenanceResponse,
  getActiveMaintenanceOptimized,
  getMaintenanceHistoryOptimized,
  getMaintenanceStatsOptimized,
  updateMaintenanceOptimized,
  completeMaintenanceOptimized,
  getMaintenanceCategoriesOptimized,
  getAssignedTechniciansOptimized,
  searchMaintenanceOptimized
} from '@/lib/services/maintenance-optimized-service';

// =====================================================
// TIPOS PARA EL HOOK
// =====================================================

export interface UseMaintenanceOptimizedProps {
  initialTab?: 'active' | 'history';
  initialFilters?: MaintenanceFilters;
  initialPagination?: PaginationParams;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseMaintenanceOptimizedReturn {
  // Datos
  activeRecords: MaintenanceOptimized[];
  historyRecords: MaintenanceOptimized[];
  stats: MaintenanceStats | null;
  categories: string[];
  technicians: string[];
  
  // Estado
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Paginación
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  
  // Filtros
  activeTab: 'active' | 'history';
  filters: MaintenanceFilters;
  
  // Acciones
  setActiveTab: (tab: 'active' | 'history') => void;
  setFilters: (filters: Partial<MaintenanceFilters>) => void;
  setPage: (page: number) => void;
  refreshData: () => Promise<void>;
  searchRecords: (searchTerm: string) => Promise<MaintenanceOptimized[]>;
  updateRecord: (id: string, updates: Partial<MaintenanceOptimized>) => Promise<void>;
  completeRecord: (id: string, completionData: any) => Promise<void>;
  
  // Datos computados
  currentRecords: MaintenanceOptimized[];
  filteredCount: number;
  isActiveTab: boolean;
  isHistoryTab: boolean;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useMaintenanceOptimized({
  initialTab = 'active',
  initialFilters = {},
  initialPagination = { page: 1, limit: 10 },
  autoRefresh = false,
  refreshInterval = 30000 // 30 segundos
}: UseMaintenanceOptimizedProps = {}): UseMaintenanceOptimizedReturn {
  
  // =====================================================
  // ESTADO LOCAL
  // =====================================================
  
  const [activeRecords, setActiveRecords] = useState<MaintenanceOptimized[]>([]);
  const [historyRecords, setHistoryRecords] = useState<MaintenanceOptimized[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [technicians, setTechnicians] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'active' | 'history'>(initialTab);
  const [filters, setFiltersState] = useState<MaintenanceFilters>(initialFilters);
  const [pagination, setPagination] = useState<PaginationParams>(initialPagination);
  
  const [activeResponse, setActiveResponse] = useState<MaintenanceResponse | null>(null);
  const [historyResponse, setHistoryResponse] = useState<MaintenanceResponse | null>(null);
  
  // =====================================================
  // DATOS COMPUTADOS
  // =====================================================
  
  const currentRecords = useMemo(() => {
    return activeTab === 'active' ? activeRecords : historyRecords;
  }, [activeTab, activeRecords, historyRecords]);
  
  const currentResponse = useMemo(() => {
    return activeTab === 'active' ? activeResponse : historyResponse;
  }, [activeTab, activeResponse, historyResponse]);
  
  const totalCount = currentResponse?.total || 0;
  const totalPages = Math.ceil(totalCount / (pagination.limit || 10));
  const hasMore = currentResponse?.hasMore || false;
  const filteredCount = currentRecords.length;
  
  const isActiveTab = activeTab === 'active';
  const isHistoryTab = activeTab === 'history';
  
  // =====================================================
  // FUNCIONES DE CARGA DE DATOS
  // =====================================================
  
  const loadActiveRecords = useCallback(async () => {
    try {
      const response = await getActiveMaintenanceOptimized(filters, pagination);
      setActiveRecords(response.data);
      setActiveResponse(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar mantenimientos activos';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [filters, pagination]);
  
  const loadHistoryRecords = useCallback(async () => {
    try {
      const response = await getMaintenanceHistoryOptimized(filters, pagination);
      setHistoryRecords(response.data);
      setHistoryResponse(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar historial de mantenimientos';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [filters, pagination]);
  
  const loadStats = useCallback(async () => {
    try {
      const statsData = await getMaintenanceStatsOptimized();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);
  
  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await getMaintenanceCategoriesOptimized();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }, []);
  
  const loadTechnicians = useCallback(async () => {
    try {
      const techniciansData = await getAssignedTechniciansOptimized();
      setTechnicians(techniciansData);
    } catch (err) {
      console.error('Error loading technicians:', err);
    }
  }, []);
  
  // =====================================================
  // FUNCIÓN PRINCIPAL DE CARGA
  // =====================================================
  
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    setError(null);
    
    try {
      // Cargar datos según la pestaña activa
      if (activeTab === 'active') {
        await loadActiveRecords();
      } else {
        await loadHistoryRecords();
      }
      
      // Cargar datos auxiliares solo en la carga inicial
      if (showLoading) {
        await Promise.all([
          loadStats(),
          loadCategories(),
          loadTechnicians()
        ]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, loadActiveRecords, loadHistoryRecords, loadStats, loadCategories, loadTechnicians]);
  
  // =====================================================
  // EFECTOS
  // =====================================================
  
  // Carga inicial
  useEffect(() => {
    loadData(true);
  }, []);
  
  // Recargar cuando cambian filtros, paginación o pestaña
  useEffect(() => {
    if (!isLoading) {
      loadData(false);
    }
  }, [activeTab, filters, pagination.page]);
  
  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      if (!isLoading && !isRefreshing) {
        loadData(false);
      }
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isLoading, isRefreshing, loadData]);
  
  // =====================================================
  // ACCIONES PÚBLICAS
  // =====================================================
  
  const handleSetActiveTab = useCallback((tab: 'active' | 'history') => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset page
  }, []);
  
  const handleSetFilters = useCallback((newFilters: Partial<MaintenanceFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset page
  }, []);
  
  const handleSetPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);
  
  const refreshData = useCallback(async () => {
    await loadData(false);
    toast.success('Datos actualizados');
  }, [loadData]);
  
  const searchRecords = useCallback(async (searchTerm: string): Promise<MaintenanceOptimized[]> => {
    try {
      return await searchMaintenanceOptimized(searchTerm);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en la búsqueda';
      toast.error(errorMessage);
      return [];
    }
  }, []);
  
  const updateRecord = useCallback(async (id: string, updates: Partial<MaintenanceOptimized>) => {
    try {
      await updateMaintenanceOptimized(id, updates);
      
      // Actualizar estado local
      const updateRecords = (records: MaintenanceOptimized[]) =>
        records.map(record => record.id === id ? { ...record, ...updates } : record);
      
      setActiveRecords(updateRecords);
      setHistoryRecords(updateRecords);
      
      toast.success('Mantenimiento actualizado');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar mantenimiento';
      toast.error(errorMessage);
      throw err;
    }
  }, []);
  
  const completeRecord = useCallback(async (id: string, completionData: any) => {
    try {
      await completeMaintenanceOptimized(id, completionData);
      
      // Remover de activos y recargar datos
      setActiveRecords(prev => prev.filter(record => record.id !== id));
      await loadData(false);
      
      toast.success('Mantenimiento completado');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al completar mantenimiento';
      toast.error(errorMessage);
      throw err;
    }
  }, [loadData]);
  
  // =====================================================
  // RETORNO DEL HOOK
  // =====================================================
  
  return {
    // Datos
    activeRecords,
    historyRecords,
    stats,
    categories,
    technicians,
    
    // Estado
    isLoading,
    isRefreshing,
    error,
    
    // Paginación
    currentPage: pagination.page || 1,
    totalPages,
    totalCount,
    hasMore,
    
    // Filtros
    activeTab,
    filters,
    
    // Acciones
    setActiveTab: handleSetActiveTab,
    setFilters: handleSetFilters,
    setPage: handleSetPage,
    refreshData,
    searchRecords,
    updateRecord,
    completeRecord,
    
    // Datos computados
    currentRecords,
    filteredCount,
    isActiveTab,
    isHistoryTab
  };
}

// =====================================================
// HOOK SIMPLIFICADO PARA CASOS BÁSICOS
// =====================================================

export function useMaintenanceSimple(tab: 'active' | 'history' = 'active') {
  return useMaintenanceOptimized({
    initialTab: tab,
    initialPagination: { page: 1, limit: 20 },
    autoRefresh: true,
    refreshInterval: 60000 // 1 minuto
  });
}

// =====================================================
// HOOK PARA ESTADÍSTICAS SOLAMENTE
// =====================================================

export function useMaintenanceStats() {
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const statsData = await getMaintenanceStatsOptimized();
      setStats(statsData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadStats();
  }, [loadStats]);
  
  return {
    stats,
    isLoading,
    error,
    refresh: loadStats
  };
}

export default useMaintenanceOptimized;