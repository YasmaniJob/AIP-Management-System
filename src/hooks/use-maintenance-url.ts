'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export interface MaintenanceUrlParams {
  page?: number;
  maintenance_tab?: 'active' | 'history';
  category?: string;
  date?: string;
}

export function useMaintenanceUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateURL = useCallback((newParams: MaintenanceUrlParams) => {
    const params = new URLSearchParams(searchParams);
    
    // Update or remove parameters
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });

    const url = `${pathname}?${params.toString()}`;
    router.push(url);
  }, [router, pathname, searchParams]);

  const getCurrentParams = useCallback((): MaintenanceUrlParams => {
    return {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      maintenance_tab: (searchParams.get('maintenance_tab') as 'active' | 'history') || 'active',
      category: searchParams.get('category') || 'todos',
      date: searchParams.get('date') || undefined
    };
  }, [searchParams]);

  const setPage = useCallback((page: number) => {
    updateURL({ page });
  }, [updateURL]);

  const setTab = useCallback((tab: 'active' | 'history') => {
    const updates: MaintenanceUrlParams = { 
      maintenance_tab: tab, 
      page: 1 
    };
    
    // Clear date when switching to active tab
    if (tab === 'active') {
      updates.date = undefined;
    }
    
    updateURL(updates);
  }, [updateURL]);

  const setCategory = useCallback((category: string) => {
    updateURL({ category, page: 1 });
  }, [updateURL]);

  const setDate = useCallback((date: string | undefined) => {
    updateURL({ date, page: 1 });
  }, [updateURL]);

  return {
    updateURL,
    getCurrentParams,
    setPage,
    setTab,
    setCategory,
    setDate
  };
}

export default useMaintenanceUrl;