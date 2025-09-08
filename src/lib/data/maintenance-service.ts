// src/lib/data/maintenance-service.ts
'use server';

import { createServerClient } from '../supabase/server';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MaintenanceRecord,
  MaintenanceStats,
  MaintenanceIncident,
  CreateMaintenanceData,
  UpdateMaintenanceData,
  MaintenanceQueryParams,
  MaintenanceResponse,
  MaintenanceStatsResponse
} from '../types/maintenance-types';

/**
 * SERVICIO UNIFICADO DE MANTENIMIENTO
 * Consolidación de maintenance.ts y maintenance-fallback.ts
 */

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

/**
 * Formatea un registro de mantenimiento desde la base de datos
 */
function formatMaintenanceRecord(data: any): MaintenanceRecord {
  const resource = data.resource || data.resources;
  const category = resource?.category || resource?.categories;
  
  return {
    id: data.id,
    resource_id: data.resource_id,
    resource_number: resource?.number || '',
    resource_brand: resource?.brand || '',
    resource_model: resource?.model || '',
    resource_category: category?.name || '',
    resource_type: category?.type || '',
    maintenance_type: data.maintenance_type || data.incident_type || '',
    damage_description: data.damage_description || data.description || '',
    current_status: data.current_status || data.status || '',
    reporter_teacher_name: data.reporter_teacher_name || data.reported_by || '',
    reporter_grade: data.reporter_grade || '',
    reporter_section: data.reporter_section || '',
    report_date: data.report_date || data.reported_at || data.created_at,
    estimated_completion_date: data.estimated_completion_date,
    completed_at: data.completed_at || data.resolved_at,
    created_at: data.created_at,
    updated_at: data.updated_at,

    // Campo actualizado para usar assigned_to en lugar de assigned_technician
    assigned_technician: data.assigned_to || data.assigned_technician || null,
    repair_notes: data.repair_notes || data.resolution_notes || data.incident_description || '',
    completion_percentage: data.completion_percentage || 0,
    user_id: data.user_id,
    
    // Campos calculados
    resource_name: category?.name || 'Recurso',
    formatted_created_at: format(parseISO(data.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
    formatted_estimated_completion: data.estimated_completion_date 
      ? format(parseISO(data.estimated_completion_date), 'dd/MM/yyyy', { locale: es })
      : undefined,
    
    // Relaciones
    resource: resource ? {
      id: resource.id,
      number: resource.number,
      brand: resource.brand,
      model: resource.model,
      status: resource.status,
      processor_brand: resource.processor_brand,
      generation: resource.generation,
      ram: resource.ram,
      storage: resource.storage,
      category: category ? {
        id: category.id,
        name: category.name,
        type: category.type
      } : undefined
    } : undefined,
    
    user: data.user || data.users ? {
      name: (data.user || data.users).name
    } : undefined,
    
    teacher_context: {
      teacherName: data.reporter_teacher_name || data.reported_by || '',
      gradeName: data.reporter_grade || '',
      sectionName: data.reporter_section || '',
      reportDate: data.report_date || data.reported_at || data.created_at
    }
  };
}

// =====================================================
// FUNCIONES PRINCIPALES DE CONSULTA
// =====================================================

/**
 * Obtener registros de mantenimiento con filtros y paginación
 */
export async function getMaintenanceRecords(
  params: MaintenanceQueryParams = {}
): Promise<MaintenanceResponse> {
  const supabase = await createServerClient();
  
  const {
    status,
    category,

    dateFrom,
    dateTo,
    searchTerm,
    limit = 10,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = params;
  
  let query = supabase
    .from('maintenance_tracking')
    .select(`
      *,
      resource:resources(
        id,
        number,
        brand,
        model,
        status,
        processor_brand,
        generation,
        ram,
        storage,
        category:categories(id, name, type)
      ),
      user:users(name)
    `, { count: 'exact' });
  
  // Aplicar filtros
  if (status && status !== 'all') {
    query = query.eq('current_status', status);
  }
  
  if (category && category !== 'all' && category !== 'todos') {
    query = query.eq('resource.category.name', category);
  }
  

  
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }
  
  if (searchTerm) {
    query = query.or(`
      damage_description.ilike.%${searchTerm}%,
      resource.number.ilike.%${searchTerm}%,
      resource.brand.ilike.%${searchTerm}%,
      resource.model.ilike.%${searchTerm}%,
      reporter_teacher_name.ilike.%${searchTerm}%
    `);
  }
  
  // Aplicar ordenamiento y paginación
  const { data, error, count } = await query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error('Error fetching maintenance records:', error);
    return {
      data: [],
      total: 0,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: false
    };
  }
  
  const formattedData = (data || []).map(formatMaintenanceRecord);
  const total = count || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  
  return {
    data: formattedData,
    total,
    page: currentPage,
    limit,
    hasMore: offset + limit < total
  };
}

/**
 * Obtener recursos que requieren mantenimiento (activos)
 */
export async function getActiveMaintenanceRecords(
  categoryFilter?: string,
  limit?: number,
  offset?: number
): Promise<MaintenanceRecord[]> {
  const params: MaintenanceQueryParams = {
    limit,
    offset,
    category: categoryFilter
  };
  
  // Excluir registros completados y cerrados
  const supabase = await createServerClient();
  
  let query = supabase
    .from('maintenance_tracking')
    .select(`
      *,
      resource:resources(
        id,
        number,
        brand,
        model,
        status,
        processor_brand,
        generation,
        ram,
        storage,
        category:categories(id, name, type)
      ),
      user:users(name)
    `)
    .neq('current_status', 'Completado')
    .neq('current_status', 'Cerrado');
  
  if (categoryFilter && categoryFilter !== 'all' && categoryFilter !== 'todos') {
    query = query.eq('resource.category.name', categoryFilter);
  }
  
  if (limit) {
    query = query.limit(limit);
  }
  
  if (offset) {
    query = query.range(offset, offset + (limit || 10) - 1);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching active maintenance records:', error);
    return [];
  }
  
  return (data || []).map(formatMaintenanceRecord);
}

/**
 * Obtener historial de mantenimiento completado
 */
export async function getCompletedMaintenanceRecords(
  categoryFilter?: string,
  limit?: number,
  offset?: number
): Promise<MaintenanceRecord[]> {
  const supabase = await createServerClient();
  
  let query = supabase
    .from('maintenance_tracking')
    .select(`
      *,
      resource:resources(
        id,
        number,
        brand,
        model,
        status,
        processor_brand,
        generation,
        ram,
        storage,
        category:categories(id, name, type)
      ),
      user:users(name)
    `)
    .in('current_status', ['Completado', 'Cerrado']);
  
  if (categoryFilter && categoryFilter !== 'all' && categoryFilter !== 'todos') {
    query = query.eq('resource.category.name', categoryFilter);
  }
  
  if (limit) {
    query = query.limit(limit);
  }
  
  if (offset) {
    query = query.range(offset, offset + (limit || 10) - 1);
  }
  
  const { data, error } = await query.order('completed_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching completed maintenance records:', error);
    return [];
  }
  
  return (data || []).map(formatMaintenanceRecord);
}

/**
 * Obtener un registro específico de mantenimiento
 */
export async function getMaintenanceRecord(id: string): Promise<MaintenanceRecord | null> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_tracking')
    .select(`
      *,
      resource:resources(
        id,
        number,
        brand,
        model,
        status,
        processor_brand,
        generation,
        ram,
        storage,
        category:categories(id, name, type)
      ),
      user:users(name)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching maintenance record:', error);
    return null;
  }
  
  return data ? formatMaintenanceRecord(data) : null;
}

// =====================================================
// FUNCIONES DE ESTADÍSTICAS
// =====================================================

/**
 * Obtener estadísticas de mantenimiento
 */
export async function getMaintenanceStats(): Promise<MaintenanceStats> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_tracking')
    .select('current_status');
  
  if (error) {
    console.error('Error fetching maintenance stats:', error);
    return {
      total_records: 0,
      pending_count: 0,
      in_progress_count: 0,
      completed_count: 0,
  
    };
  }
  
  const stats = data.reduce((acc, record) => {
    acc.total_records++;
    
    switch (record.current_status?.toLowerCase()) {
      case 'pendiente':
      case 'pending':
        acc.pending_count++;
        break;
      case 'en progreso':
      case 'in_progress':
        acc.in_progress_count++;
        break;
      case 'completado':
      case 'completed':
      case 'cerrado':
        acc.completed_count++;
        break;
    }
    
    return acc;
  }, {
    total_records: 0,
    pending_count: 0,
    in_progress_count: 0,
    completed_count: 0
  });
  
  return stats;
}

/**
 * Obtener categorías disponibles para filtros
 */
export async function getMaintenanceCategories(): Promise<string[]> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('name');
  
  if (error) {
    console.error('Error fetching maintenance categories:', error);
    return [];
  }
  
  return data.map(category => category.name);
}

// =====================================================
// FUNCIONES DE MODIFICACIÓN
// =====================================================

/**
 * Crear un nuevo registro de mantenimiento
 */
export async function createMaintenanceRecord(data: CreateMaintenanceData): Promise<boolean> {
  const supabase = await createServerClient();
  
  const { error } = await supabase
    .from('maintenance_tracking')
    .insert({
      resource_id: data.resourceId,
      maintenance_type: data.maintenanceType,
      damage_description: data.description,
      reporter_teacher_name: data.teacherName,
      reporter_grade: data.gradeName,
      reporter_section: data.sectionName,
      estimated_completion_date: data.estimatedCompletion,
  
      current_status: 'Pendiente',
      user_id: data.userId,
      report_date: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error creating maintenance record:', error);
    return false;
  }
  
  return true;
}

/**
 * Actualizar el estado de un registro de mantenimiento
 */
export async function updateMaintenanceRecord(data: UpdateMaintenanceData): Promise<boolean> {
  const supabase = await createServerClient();
  
  const updateData: any = {
    current_status: data.status,
    updated_at: new Date().toISOString()
  };
  
  if (data.notes) {
    updateData.incident_description = data.notes;
  }
  
  // Campo actualizado para usar assigned_technician en maintenance_tracking
    if (data.assignedTechnician) {
      updateData.assigned_technician = data.assignedTechnician;
    }
  // 
  // if (data.completionPercentage !== undefined) {
  //   updateData.completion_percentage = data.completionPercentage;
  // }
  
  if (data.status.toLowerCase() === 'completado' || data.status.toLowerCase() === 'completed') {
    updateData.completed_at = new Date().toISOString();
    // completion_percentage no existe en la tabla actual
    // updateData.completion_percentage = 100;
  }
  
  const { error } = await supabase
    .from('maintenance_tracking')
    .update(updateData)
    .eq('id', data.id);
  
  if (error) {
    console.error('Error updating maintenance record:', error);
    return false;
  }
  
  return true;
}

/**
 * Buscar registros de mantenimiento
 */
export async function searchMaintenanceRecords(
  searchTerm: string,
  status?: string,
  category?: string
): Promise<MaintenanceRecord[]> {
  const params: MaintenanceQueryParams = {
    searchTerm,
    status: status as any,
    category,
    limit: 50
  };
  
  const response = await getMaintenanceRecords(params);
  return response.data;
}

// =====================================================
// FUNCIONES DE INCIDENTES
// =====================================================

/**
 * Obtener incidentes de mantenimiento para un recurso
 */
export async function getMaintenanceIncidents(resourceId: string): Promise<MaintenanceIncident[]> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_tracking')
    .select('*')
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching maintenance incidents:', error);
    return [];
  }
  
  return (data || []).map(record => ({
    id: record.id,
    resource_id: record.resource_id,
    incident_type: record.maintenance_type || 'Mantenimiento',
    description: record.damage_description || '',
    severity: 'Media',
    status: record.current_status || 'Pendiente',
    reported_by: record.reporter_teacher_name || '',
    reported_at: record.report_date || record.created_at,
    resolved_at: record.completed_at,
    resolution_notes: record.repair_notes,
    created_at: record.created_at,
    updated_at: record.updated_at
  }));
}

/**
 * Obtener registro de mantenimiento con incidentes relacionados
 */
export async function getMaintenanceRecordWithIncidents(id: string) {
  const record = await getMaintenanceRecord(id);
  if (!record) return null;
  
  const incidents = await getMaintenanceIncidents(record.resource_id);
  
  return {
    ...record,
    incidents
  };
}