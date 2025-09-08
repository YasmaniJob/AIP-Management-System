// src/lib/types/maintenance-types.ts

/**
 * TIPOS CENTRALIZADOS PARA MANTENIMIENTO
 * Consolidación de todas las interfaces y tipos relacionados con mantenimiento
 */

// =====================================================
// INTERFACES PRINCIPALES
// =====================================================

export interface MaintenanceRecord {
  id: string;
  resource_id: string;
  resource_number: string;
  resource_brand: string;
  resource_model: string;
  resource_category: string;
  resource_type: string;
  maintenance_type: string;
  damage_description: string;
  current_status: string;
  reporter_teacher_name: string;
  reporter_grade: string;
  reporter_section: string;
  report_date: string;
  estimated_completion_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;

  assigned_technician?: string;
  repair_notes?: string;
  completion_percentage?: number;
  user_id?: string;
  
  // Campos calculados para compatibilidad
  resource_name: string;
  formatted_created_at: string;
  formatted_estimated_completion?: string;
  
  // Relaciones
  resource?: {
    id: string;
    number: string;
    brand: string;
    model: string;
    status: string;
    processor_brand?: string;
    generation?: string;
    ram?: string;
    storage?: string;
    category?: {
      id: string;
      name: string;
      type: string;
    };
  };
  
  user?: {
    name: string;
  };
  
  teacher_context: {
    teacherName: string;
    gradeName: string;
    sectionName: string;
    reportDate: string;
  };
}

export interface MaintenanceStats {
  total_records: number;
  pending_count: number;
  in_progress_count: number;
  completed_count: number;

}

export interface MaintenanceIncident {
  id: string;
  resource_id: string;
  incident_type: string;
  description: string;
  severity: string;
  status: string;
  reported_by: string;
  reported_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// TIPOS DE ENUMERACIÓN
// =====================================================

export type MaintenanceStatus = 
  | 'Pendiente'
  | 'En Progreso'
  | 'Completado'
  | 'Cancelado'
  | 'Cerrado'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';



export type MaintenanceType = 
  | 'Preventivo'
  | 'Correctivo'
  | 'Emergencia'
  | 'Actualización';

// =====================================================
// INTERFACES PARA FORMULARIOS
// =====================================================

export interface CreateMaintenanceData {
  resourceId: string;
  maintenanceType: string;
  description: string;
  teacherName: string;
  gradeName: string;
  sectionName: string;
  estimatedCompletion?: string;

  userId?: string;
}

export interface UpdateMaintenanceData {
  id: string;
  status: string;
  notes?: string;
  assignedTechnician?: string;
  completionPercentage?: number;
}

// =====================================================
// INTERFACES PARA FILTROS Y BÚSQUEDA
// =====================================================

export interface MaintenanceFilters {
  status?: MaintenanceStatus;
  category?: string;

  dateFrom?: string;
  dateTo?: string;
  assignedTechnician?: string;
  searchTerm?: string;
}

export interface MaintenancePaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface MaintenanceQueryParams extends MaintenanceFilters, MaintenancePaginationParams {
  sortBy?: 'created_at' | 'updated_at' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// =====================================================
// INTERFACES PARA RESPUESTAS DE API
// =====================================================

export interface MaintenanceResponse {
  data: MaintenanceRecord[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface MaintenanceStatsResponse {
  stats: MaintenanceStats;
  categories: string[];
  technicians: string[];
}

// =====================================================
// TIPOS PARA COMPONENTES
// =====================================================

export interface MaintenanceTableProps {
  records: MaintenanceRecord[];
  categories: string[];
  isHistory?: boolean;
  userRole?: string;
  actionLoading?: Record<string, boolean>;
  selectedCategory: string;
  onRecordClick?: (record: MaintenanceRecord) => void;
  onStatusUpdate?: (id: string, status: string, notes?: string) => void;
}

export interface MaintenanceCardProps {
  record: MaintenanceRecord;
  onDetailsClick: (record: MaintenanceRecord) => void;
  onStatusUpdate?: (id: string, status: string, notes?: string) => void;
  isLoading?: boolean;
  userRole?: string;
}

export interface MaintenanceFiltersProps {
  categories: string[];
  selectedCategory: string;
  selectedStatus?: MaintenanceStatus;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: MaintenanceStatus) => void;
  onReset: () => void;
}

// =====================================================
// TIPOS PARA HOOKS
// =====================================================

export interface UseMaintenanceDataReturn {
  records: MaintenanceRecord[];
  stats: MaintenanceStats;
  categories: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createRecord: (data: CreateMaintenanceData) => Promise<boolean>;
  updateRecord: (data: UpdateMaintenanceData) => Promise<boolean>;
  deleteRecord: (id: string) => Promise<boolean>;
}

export interface UseMaintenanceFiltersReturn {
  filters: MaintenanceFilters;
  setFilter: <K extends keyof MaintenanceFilters>(key: K, value: MaintenanceFilters[K]) => void;
  resetFilters: () => void;
  activeFiltersCount: number;
}

export interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setItemsPerPage: (items: number) => void;
}

// =====================================================
// CONSTANTES
// =====================================================

export const MAINTENANCE_STATUS_OPTIONS: { value: MaintenanceStatus; label: string }[] = [
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'En Progreso', label: 'En Progreso' },
  { value: 'Completado', label: 'Completado' },
  { value: 'Cancelado', label: 'Cancelado' }
];



export const MAINTENANCE_TYPE_OPTIONS: { value: MaintenanceType; label: string }[] = [
  { value: 'Preventivo', label: 'Mantenimiento Preventivo' },
  { value: 'Correctivo', label: 'Mantenimiento Correctivo' },
  { value: 'Emergencia', label: 'Reparación de Emergencia' },
  { value: 'Actualización', label: 'Actualización/Mejora' }
];

export const DEFAULT_ITEMS_PER_PAGE = 10;
export const MAX_ITEMS_PER_PAGE = 50;