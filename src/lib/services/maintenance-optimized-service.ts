// src/lib/services/maintenance-optimized-service.ts
'use server';

import { createServerClient } from '../supabase/server';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cache } from 'react';

// =====================================================
// TIPOS OPTIMIZADOS
// =====================================================

export interface MaintenanceOptimized {
  id: string;
  resource_id: string;
  resource_number: string;
  resource_name: string;
  resource_category: string;
  resource_brand?: string;
  resource_model?: string;
  maintenance_type: string;
  description: string;

  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  reporter_name?: string;
  reporter_grade?: string;
  reporter_section?: string;
  report_date: string;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  assigned_technician?: string;
  repair_notes?: string;
  estimated_cost?: number;
  actual_cost?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  is_overdue?: boolean;
  days_since_report?: number;
  resolution_days?: number;
}

export interface MaintenanceStats {
  total_active: number;
  pending_count: number;
  in_progress_count: number;
  overdue_count: number;
  completed_this_month: number;
  avg_resolution_days: number;
}

export interface MaintenanceFilters {
  status?: string;
  category?: string;

  search?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedTechnician?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface MaintenanceResponse {
  data: MaintenanceOptimized[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// =====================================================
// SERVICIO OPTIMIZADO CON CACHÉ
// =====================================================

/**
 * Obtener mantenimientos activos con caché
 */
export const getActiveMaintenanceOptimized = cache(async (
  filters: MaintenanceFilters = {},
  pagination: PaginationParams = {}
): Promise<MaintenanceResponse> => {
  const supabase = await createServerClient();
  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('maintenance_active_optimized')
    .select('*', { count: 'exact' });

  // Aplicar filtros
  if (filters.category && filters.category !== 'todos') {
    query = query.eq('resource_category', filters.category);
  }



  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  // Campo actualizado para usar assigned_technician
    if (filters.assignedTechnician) {
      query = query.eq('assigned_technician', filters.assignedTechnician);
    }

  // Búsqueda de texto completo
  if (filters.search) {
    query = query.or(`
      resource_number.ilike.%${filters.search}%,
      resource_name.ilike.%${filters.search}%,
      description.ilike.%${filters.search}%,
      reporter_name.ilike.%${filters.search}%
    `);
  }

  // Filtros de fecha
  if (filters.dateFrom) {
    query = query.gte('report_date', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('report_date', filters.dateTo);
  }

  // Paginación y ordenamiento
  const { data, error, count } = await query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })
    .order('report_date', { ascending: true });

  if (error) {
    console.error('Error fetching active maintenance:', error);
    throw new Error('Error al obtener mantenimientos activos');
  }

  const total = count || 0;
  const hasMore = offset + limit < total;

  return {
    data: data || [],
    total,
    page,
    limit,
    hasMore
  };
});

/**
 * Obtener historial de mantenimientos con caché
 */
export const getMaintenanceHistoryOptimized = cache(async (
  filters: MaintenanceFilters = {},
  pagination: PaginationParams = {}
): Promise<MaintenanceResponse> => {
  const supabase = await createServerClient();
  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('maintenance_history_optimized')
    .select('*', { count: 'exact' });

  // Aplicar filtros similares a los activos
  if (filters.category && filters.category !== 'todos') {
    query = query.eq('resource_category', filters.category);
  }

  if (filters.search) {
    query = query.or(`
      resource_number.ilike.%${filters.search}%,
      resource_name.ilike.%${filters.search}%,
      description.ilike.%${filters.search}%,
      reporter_name.ilike.%${filters.search}%
    `);
  }

  if (filters.dateFrom) {
    query = query.gte('actual_completion_date', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('actual_completion_date', filters.dateTo);
  }

  const { data, error, count } = await query
    .range(offset, offset + limit - 1)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance history:', error);
    throw new Error('Error al obtener historial de mantenimientos');
  }

  const total = count || 0;
  const hasMore = offset + limit < total;

  return {
    data: data || [],
    total,
    page,
    limit,
    hasMore
  };
});

/**
 * Obtener estadísticas optimizadas con caché
 */
export const getMaintenanceStatsOptimized = cache(async (): Promise<MaintenanceStats> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .rpc('get_maintenance_stats_optimized');

  if (error) {
    console.error('Error fetching maintenance stats:', error);
    throw new Error('Error al obtener estadísticas de mantenimiento');
  }

  return data[0] || {
    total_active: 0,
    pending_count: 0,
    in_progress_count: 0,
    overdue_count: 0,
    completed_this_month: 0,
    avg_resolution_days: 0
  };
});

/**
 * Crear nuevo mantenimiento
 */
export async function createMaintenanceOptimized(
  maintenanceData: Partial<MaintenanceOptimized>
): Promise<MaintenanceOptimized> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('maintenance_optimized')
    .insert({
      ...maintenanceData,
      status: 'pending',
      report_date: maintenanceData.report_date || new Date().toISOString().split('T')[0]
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating maintenance:', error);
    throw new Error('Error al crear mantenimiento');
  }

  return data;
}

/**
 * Actualizar mantenimiento
 */
export async function updateMaintenanceOptimized(
  id: string,
  updates: Partial<MaintenanceOptimized>
): Promise<MaintenanceOptimized> {
  const supabase = await createServerClient();

  // Mapear campos de MaintenanceOptimized a maintenance_tracking
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (updates.status) {
    updateData.current_status = updates.status === 'pending' ? 'Pendiente' : 
                               updates.status === 'in_progress' ? 'En Progreso' : 
                               updates.status === 'completed' ? 'Completado' : 
                               updates.status === 'cancelled' ? 'Cancelado' : updates.status;
  }

  if (updates.repair_notes) {
    updateData.incident_description = updates.repair_notes;
  }

  if (updates.status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('maintenance_tracking')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating maintenance:', error);
    throw new Error('Error al actualizar mantenimiento');
  }

  // Convertir de vuelta al formato MaintenanceOptimized
  return {
    id: data.id,
    resource_id: data.resource_id,
    status: data.current_status === 'Pendiente' ? 'pending' : 
            data.current_status === 'En Progreso' ? 'in_progress' : 
            data.current_status === 'Completado' ? 'completed' : 
            data.current_status === 'Cancelado' ? 'cancelled' : 'pending',
    ...updates
  } as MaintenanceOptimized;
}

/**
 * Completar mantenimiento
 */
export async function completeMaintenanceOptimized(
  id: string,
  completionData: {
    repair_notes?: string;
    actual_cost?: number;
    assigned_technician?: string;
  }
): Promise<MaintenanceOptimized> {
  const supabase = await createServerClient();

  const updateData: any = {
    current_status: 'Completado',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (completionData.repair_notes) {
    updateData.incident_description = completionData.repair_notes;
  }

  const { data, error } = await supabase
    .from('maintenance_tracking')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error completing maintenance:', error);
    throw new Error('Error al completar mantenimiento');
  }

  // Convertir de vuelta al formato MaintenanceOptimized
  return {
    id: data.id,
    resource_id: data.resource_id,
    status: 'completed',
    actual_completion_date: data.completed_at?.split('T')[0],
    repair_notes: completionData.repair_notes,
    ...completionData
  } as MaintenanceOptimized;
}

/**
 * Obtener categorías disponibles
 */
export const getMaintenanceCategoriesOptimized = cache(async (): Promise<string[]> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('maintenance_optimized')
    .select('resource_category')
    .not('resource_category', 'is', null);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  // Obtener categorías únicas
  const categories = [...new Set(data.map(item => item.resource_category))];
  return categories.sort();
});

/**
 * Obtener técnicos asignados
 */
export const getAssignedTechniciansOptimized = cache(async (): Promise<string[]> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('maintenance_tracking')
    .select('assigned_technician')
    .not('assigned_technician', 'is', null);

  if (error) {
    console.error('Error fetching technicians:', error);
    return [];
  }

  // Obtener técnicos únicos
  const technicians = [...new Set(data.map(item => item.assigned_technician))];}]}
  return technicians.sort();
});

/**
 * Búsqueda rápida con texto completo
 */
export async function searchMaintenanceOptimized(
  searchTerm: string,
  limit: number = 20
): Promise<MaintenanceOptimized[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('maintenance_optimized')
    .select('*')
    .textSearch('fts', searchTerm, {
      type: 'websearch',
      config: 'spanish'
    })
    .limit(limit);

  if (error) {
    console.error('Error searching maintenance:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtener mantenimientos por recurso
 */
export async function getMaintenanceByResourceOptimized(
  resourceId: string
): Promise<MaintenanceOptimized[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('maintenance_optimized')
    .select('*')
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance by resource:', error);
    throw new Error('Error al obtener mantenimientos del recurso');
  }

  return data || [];
}

// =====================================================
// UTILIDADES DE FORMATEO
// =====================================================

export function formatMaintenanceDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
  } catch {
    return dateString;
  }
}

export function formatMaintenanceDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
  } catch {
    return dateString;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function getIncidentTypeColor(incidentType: string | null | undefined): string {
  if (!incidentType) return 'bg-gray-100 text-gray-700 border-gray-200';
  
  const type = incidentType.toLowerCase();
  switch (type) {
    case 'daño':
    case 'damage':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'sugerencia':
    case 'suggestion':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

// =====================================================
// INVALIDACIÓN DE CACHÉ
// =====================================================

/**
 * Invalidar caché después de cambios
 */
export function invalidateMaintenanceCache() {
  // En Next.js 13+, el caché se invalida automáticamente
  // pero podemos forzar revalidación si es necesario
  console.log('Cache invalidated for maintenance data');
}

export default {
  getActiveMaintenanceOptimized,
  getMaintenanceHistoryOptimized,
  getMaintenanceStatsOptimized,
  createMaintenanceOptimized,
  updateMaintenanceOptimized,
  completeMaintenanceOptimized,
  getMaintenanceCategoriesOptimized,
  getAssignedTechniciansOptimized,
  searchMaintenanceOptimized,
  getMaintenanceByResourceOptimized,
  formatMaintenanceDate,
  formatMaintenanceDateTime,
  getStatusColor,
  getIncidentTypeColor,
  invalidateMaintenanceCache
};