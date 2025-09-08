'use client';
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { MaintenanceRecord } from '@/lib/types/maintenance-types';
import { UserRole } from '@/lib/types';

// Types
export interface MaintenanceState {
  activeRecords: MaintenanceRecord[];
  historyRecords: MaintenanceRecord[];
  categories: any[];
  activeTotalCount: number;
  historyTotalCount: number;
  userRole: UserRole;
  isLoading: boolean;
  error: string | null;
  filters: {
    activeTab: 'active' | 'history';
    selectedCategory: string;
    selectedDate?: string;
    currentPage: number;
  };
}

export type MaintenanceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_RECORDS'; payload: MaintenanceRecord[] }
  | { type: 'SET_HISTORY_RECORDS'; payload: MaintenanceRecord[] }
  | { type: 'UPDATE_RECORD'; payload: { id: string; updates: Partial<MaintenanceRecord> } }
  | { type: 'SET_ACTIVE_TAB'; payload: 'active' | 'history' }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_DATE'; payload: string | undefined }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'RESET_FILTERS' }
  | { type: 'INITIALIZE'; payload: Partial<MaintenanceState> };

// Initial state
const initialState: MaintenanceState = {
  activeRecords: [],
  historyRecords: [],
  categories: [],
  activeTotalCount: 0,
  historyTotalCount: 0,
  userRole: 'Docente',
  isLoading: false,
  error: null,
  filters: {
    activeTab: 'active',
    selectedCategory: 'todos',
    selectedDate: undefined,
    currentPage: 1
  }
};

// Reducer
function maintenanceReducer(state: MaintenanceState, action: MaintenanceAction): MaintenanceState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_ACTIVE_RECORDS':
      return { ...state, activeRecords: action.payload };
    
    case 'SET_HISTORY_RECORDS':
      return { ...state, historyRecords: action.payload };
    
    case 'UPDATE_RECORD': {
      const { id, updates } = action.payload;
      const updateRecords = (records: MaintenanceRecord[]) =>
        records.map(record => record.id === id ? { ...record, ...updates } : record);
      
      return {
        ...state,
        activeRecords: updateRecords(state.activeRecords),
        historyRecords: updateRecords(state.historyRecords)
      };
    }
    
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        filters: {
          ...state.filters,
          activeTab: action.payload,
          currentPage: 1,
          selectedDate: action.payload === 'active' ? undefined : state.filters.selectedDate
        }
      };
    
    case 'SET_CATEGORY':
      return {
        ...state,
        filters: {
          ...state.filters,
          selectedCategory: action.payload,
          currentPage: 1
        }
      };
    
    case 'SET_DATE':
      return {
        ...state,
        filters: {
          ...state.filters,
          selectedDate: action.payload,
          currentPage: 1
        }
      };
    
    case 'SET_PAGE':
      return {
        ...state,
        filters: {
          ...state.filters,
          currentPage: action.payload
        }
      };
    
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: {
          activeTab: 'active',
          selectedCategory: 'todos',
          selectedDate: undefined,
          currentPage: 1
        }
      };
    
    case 'INITIALIZE':
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
}

// Context
interface MaintenanceContextType {
  state: MaintenanceState;
  dispatch: React.Dispatch<MaintenanceAction>;
  // Helper functions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateRecord: (id: string, updates: Partial<MaintenanceRecord>) => void;
  setActiveTab: (tab: 'active' | 'history') => void;
  setCategory: (category: string) => void;
  setDate: (date: string | undefined) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

// Provider
interface MaintenanceProviderProps {
  children: ReactNode;
  initialData?: Partial<MaintenanceState>;
}

export function MaintenanceProvider({ children, initialData }: MaintenanceProviderProps) {
  const [state, dispatch] = useReducer(maintenanceReducer, {
    ...initialState,
    ...initialData
  });

  // Helper functions
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const updateRecord = (id: string, updates: Partial<MaintenanceRecord>) => {
    dispatch({ type: 'UPDATE_RECORD', payload: { id, updates } });
  };

  const setActiveTab = (tab: 'active' | 'history') => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  const setCategory = (category: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  };

  const setDate = (date: string | undefined) => {
    dispatch({ type: 'SET_DATE', payload: date });
  };

  const setPage = (page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  };

  const resetFilters = () => {
    dispatch({ type: 'RESET_FILTERS' });
  };

  const value: MaintenanceContextType = {
    state,
    dispatch,
    setLoading,
    setError,
    updateRecord,
    setActiveTab,
    setCategory,
    setDate,
    setPage,
    resetFilters
  };

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
}

// Hook
export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
}

export default MaintenanceContext;