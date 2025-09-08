'use client';
import { useState, useEffect, useMemo } from 'react';
import { MaintenanceRecord } from '@/lib/types/maintenance-types';
import { getMaintenanceRecords } from '@/lib/data/maintenance-service';
import { toast } from 'sonner';

export interface UseMaintenanceDataProps {
  initialActiveRecords: MaintenanceRecord[];
  initialHistoryRecords: MaintenanceRecord[];
  activeTotalCount: number;
  historyTotalCount: number;
  activeTab: 'active' | 'history';
  selectedCategory: string;
  selectedDate?: string;
  currentPage: number;
  itemsPerPage?: number;
}

export interface UseMaintenanceDataReturn {
  records: MaintenanceRecord[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  filteredRecords: MaintenanceRecord[];
  refreshData: () => Promise<void>;
  updateRecord: (id: string, updates: Partial<MaintenanceRecord>) => void;
}

const ITEMS_PER_PAGE = 10;

export function useMaintenanceData({
  initialActiveRecords,
  initialHistoryRecords,
  activeTotalCount,
  historyTotalCount,
  activeTab,
  selectedCategory,
  selectedDate,
  currentPage,
  itemsPerPage = ITEMS_PER_PAGE
}: UseMaintenanceDataProps): UseMaintenanceDataReturn {
  const [activeRecords, setActiveRecords] = useState<MaintenanceRecord[]>(initialActiveRecords);
  const [historyRecords, setHistoryRecords] = useState<MaintenanceRecord[]>(initialHistoryRecords);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current records based on active tab
  const currentRecords = activeTab === 'active' ? activeRecords : historyRecords;
  const totalCount = activeTab === 'active' ? activeTotalCount : historyTotalCount;

  // Filter records based on category and date
  const filteredRecords = useMemo(() => {
    let filtered = currentRecords;

    // Filter by category
    if (selectedCategory && selectedCategory !== 'todos') {
      filtered = filtered.filter(record => 
        record.resource?.category?.name?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by date (for history tab)
    if (selectedDate && activeTab === 'history') {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.created_at).toISOString().split('T')[0];
        return recordDate === selectedDate;
      });
    }

    return filtered;
  }, [currentRecords, selectedCategory, selectedDate, activeTab]);

  // Paginate filtered records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, currentPage, itemsPerPage]);

  // Refresh data from server
  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { activeRecords: newActiveRecords, historyRecords: newHistoryRecords } = 
        await getMaintenanceRecords();
      
      setActiveRecords(newActiveRecords);
      setHistoryRecords(newHistoryRecords);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los datos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update a specific record
  const updateRecord = (id: string, updates: Partial<MaintenanceRecord>) => {
    const updateRecords = (records: MaintenanceRecord[]) => 
      records.map(record => 
        record.id === id ? { ...record, ...updates } : record
      );

    setActiveRecords(prev => updateRecords(prev));
    setHistoryRecords(prev => updateRecords(prev));
  };

  return {
    records: paginatedRecords,
    isLoading,
    error,
    totalCount: filteredRecords.length,
    filteredRecords,
    refreshData,
    updateRecord
  };
}

export default useMaintenanceData;