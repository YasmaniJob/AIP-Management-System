// src/lib/data/maintenance-fallback.ts
'use server';

import { createServerClient } from '../supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { MaintenanceRecord } from '@/lib/types/maintenance-types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * FUNCIONES DE FALLBACK PARA MANTENIMIENTO
 * Usa las tablas existentes mientras se migra al nuevo esquema
 */

// =====================================================
// TIPOS DE DATOS
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
  // Campos calculados para compatibilidad
  resource_name: string;
  formatted_created_at: string;
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

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

/**
 * Obtener recursos que requieren mantenimiento (usando tablas existentes)
 */
export async function getResourcesRequiringMaintenance(
  supabase: any,
  options: {
    limit?: number;
    offset?: number;
    category?: string;
    count?: boolean;
  } = {}
): Promise<{ data?: MaintenanceRecord[]; count?: number }> {
  
  let query = supabase
    .from('maintenance_tracking')
    .select(`
      *,
      resources:resource_id (
        id,
        number,
        brand,
        model,
        processor_brand,
        generation,
        ram,
        storage,
        categories:category_id (
          name,
          type
        )
      )
    `)
    .neq('current_status', 'Completado')
    .neq('current_status', 'Cerrado');
  
  if (options.category && options.category !== 'todos') {
    query = query.eq('resources.categories.name', options.category);
  }
  
  if (options.count) {
    const { count, error } = await query;
    if (error) {
      console.error('Error counting maintenance resources:', error);
      return { count: 0 };
    }
    return { count: count || 0 };
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching maintenance resources:', error);
    return { data: [] };
  }
  
  return { data: (data || []).map(formatMaintenanceRecordFromSummary) };
}

/**
 * Obtener recursos con mantenimiento completado
 */
export async function getCompletedMaintenanceResources(
  supabase: any,
  options: {
    limit?: number;
    offset?: number;
    category?: string;
    date?: string;
    count?: boolean;
  } = {}
): Promise<{ data?: MaintenanceRecord[]; count?: number }> {
  
  let query = supabase
    .from('maintenance_resource_summary')
    .select(`
      *,
      resource:resources (
        id,
        number,
        brand,
        model,
        processor_brand,
        generation,
        ram,
        storage,
        category:categories (
          name,
          type
        )
      )
    `)
    .eq('overall_status', 'Completado');
  
  if (options.category && options.category !== 'todos') {
    query = query.eq('resource.category.name', options.category);
  }
  
  if (options.date) {
    query = query.gte('updated_at', options.date + 'T00:00:00')
                 .lte('updated_at', options.date + 'T23:59:59');
  }
  
  if (options.count) {
    const { count, error } = await query;
    if (error) {
      console.error('Error counting completed maintenance resources:', error);
      return { count: 0 };
    }
    return { count: count || 0 };
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }
  
  const { data, error } = await query.order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching completed maintenance resources:', error);
    return { data: [] };
  }
  
  return { data: (data || []).map(formatMaintenanceRecordFromSummary) };
}

/**
 * Obtener estadísticas de mantenimiento
 */
export async function getMaintenanceStats(): Promise<MaintenanceStats> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_resource_summary')
    .select('overall_status');
  
  if (error) {
    console.error('Error fetching maintenance stats:', error);
    return {
      total_records: 0,
      pending_count: 0,
      in_progress_count: 0,
      completed_count: 0,
  
    };
  }
  
  const stats = (data || []).reduce((acc, record) => {
    acc.total_records++;
    
    switch (record.overall_status?.toLowerCase()) {
      case 'pendiente':
        acc.pending_count++;
        break;
      case 'en progreso':
      case 'en_progreso':
        acc.in_progress_count++;
        break;
      case 'completado':
      case 'cerrado':
        acc.completed_count++;
        break;
    }
    
    return acc;
  }, {
    total_records: 0,
    pending_count: 0,
    in_progress_count: 0,
    completed_count: 0,

  });
  
  return stats;
}

/**
 * Obtener categorías de mantenimiento
 */
export async function getMaintenanceCategories(): Promise<string[]> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_tracking')
    .select(`
      resources:resource_id (
        categories:category_id (
          name
        )
      )
    `);
  
  if (error) {
    console.error('Error fetching maintenance categories:', error);
    return [];
  }
  
  const categories = new Set<string>();
  (data || []).forEach(record => {
    if (record.resources?.categories?.name) {
      categories.add(record.resources.categories.name);
    }
  });
  
  return Array.from(categories);
}

/**
 * Obtener un registro de mantenimiento específico
 */
export async function getMaintenanceRecord(id: string): Promise<MaintenanceRecord | null> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_tracking')
    .select(`
      *,
      resources:resource_id (
        id,
        number,
        brand,
        model,
        processor_brand,
        generation,
        ram,
        storage,
        categories:category_id (
          name,
          type
        )
      ),
      users:user_id (
        name
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching maintenance record:', error);
    return null;
  }
  
  return data ? formatMaintenanceRecordFromTracking(data) : null;
}

/**
 * Obtener registro de mantenimiento con incidencias (para compatibilidad)
 */
export async function getMaintenanceRecordWithIncidents(id: string) {
  const record = await getMaintenanceRecord(id);
  
  if (!record) {
    return null;
  }
  
  // Obtener incidencias relacionadas
  const incidents = await getMaintenanceIncidents(record.resource_id);
  
  return {
    ...record,
    incidents
  };
}

/**
 * Obtener incidencias de mantenimiento por recurso
 */
export async function getMaintenanceIncidents(resourceId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_incidents_individual')
    .select('*')
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching maintenance incidents:', error);
    return [];
  }
  
  return (data || []).map(incident => {
    const teacherContext = {
      teacherName: incident.reporter_name || 'Docente no identificado',
      gradeName: incident.reporter_grade || 'Grado no especificado',
      sectionName: incident.reporter_section || 'Sección no especificada',
      reportDate: format(parseISO(incident.created_at), 'dd/MM/yyyy', { locale: es })
    };
    
    return {
      id: incident.id,
      damage_type: incident.damage_type || 'Mantenimiento General',
      damage_description: incident.damage_description || 'Sin descripción',
      current_status: incident.current_status || 'Pendiente',
      created_at: incident.created_at,
      updated_at: incident.updated_at,
      teacher_context: teacherContext
    };
  });
}

/**
 * Obtener todos los registros de mantenimiento con incidencias
 */
export async function getMaintenanceRecordsWithIncidents() {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_tracking')
    .select(`
      *,
      resources:resource_id (
        id,
        number,
        brand,
        model,
        processor_brand,
        generation,
        ram,
        storage,
        categories:category_id (
          name,
          type
        )
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching maintenance records:', error);
    return [];
  }
  
  const records = await Promise.all(
    (data || []).map(async (record) => {
      const incidents = await getMaintenanceIncidents(record.resource_id);
      
      return {
        resource_id: record.resource_id,
        resource: {
          id: record.resources?.id || record.resource_id,
          number: record.resources?.number || 'N/A',
          name: [
            record.resources?.brand,
            record.resources?.model,
            record.resources?.processor_brand,
            record.resources?.generation
          ].filter(Boolean).join(' ') || record.resources?.categories?.name || 'Recurso',
          brand: record.resources?.brand || 'N/A',
          model: record.resources?.model || 'N/A',
          category: {
            name: record.resources?.categories?.name || 'Sin Categoría',
            type: record.resources?.categories?.type || 'N/A'
          }
        },
        incidents
      };
    })
  );
  
  return records;
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Formatear registro de mantenimiento desde maintenance_tracking
 */
function formatMaintenanceRecordFromSummary(data: any): MaintenanceRecord {
  // Obtener información del contexto del docente desde maintenance_tracking
  let teacherContext = {
    teacherName: data.reporter_teacher_name || 'Docente no identificado',
    gradeName: data.reporter_grade || 'Grado no especificado',
    sectionName: data.reporter_section || 'Sección no especificada',
    reportDate: format(parseISO(data.created_at), 'dd/MM/yyyy', { locale: es })
  };
  
  // Generar nombre del recurso combinando marca y modelo
  const resourceName = [
    data.resources?.brand,
    data.resources?.model,
    data.resources?.processor_brand,
    data.resources?.generation
  ].filter(Boolean).join(' ') || data.resources?.categories?.name || 'Recurso';
  
  return {
    id: data.id,
    resource_id: data.resource_id,
    resource_number: data.resources?.number || 'N/A',
    resource_brand: data.resources?.brand || 'N/A',
    resource_model: data.resources?.model || 'N/A',
    resource_category: data.resources?.categories?.name || 'Sin Categoría',
    resource_type: data.resources?.categories?.type || 'N/A',
    maintenance_type: data.maintenance_type || 'Mantenimiento General',
    damage_description: data.damage_description || 'Sin descripción disponible',
    current_status: data.current_status || 'Pendiente',
    reporter_teacher_name: teacherContext.teacherName,
    reporter_grade: teacherContext.gradeName,
    reporter_section: teacherContext.sectionName,
    report_date: teacherContext.reportDate,
    estimated_completion_date: data.estimated_completion_date,
    completed_at: data.current_status === 'Completado' ? data.updated_at : null,
    created_at: data.created_at,
    updated_at: data.updated_at || data.created_at,

    assigned_technician: data.assigned_technician || 'N/A',
    repair_notes: data.repair_notes || 'Sin notas de reparación',
    // Campos calculados
    resource_name: resourceName,
    formatted_created_at: format(parseISO(data.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
    teacher_context: teacherContext
  };
}

/**
 * Crear registro de mantenimiento (funcionalidad básica)
 */
export async function createMaintenanceRecord(data: {
  resourceId: string;
  maintenanceType: string;
  description: string;
  teacherName: string;
  gradeName: string;
  sectionName: string;
  estimatedCompletion?: string;

}) {
  const supabase = await createServerClient();
  
  const { data: result, error } = await supabase
    .from('maintenance_tracking')
    .insert({
      resource_id: data.resourceId,
      maintenance_type: data.maintenanceType,
      incident_description: data.description,
      current_status: 'Pendiente',
      estimated_completion_date: data.estimatedCompletion,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating maintenance record:', error);
    throw new Error('Error al crear el registro de mantenimiento');
  }
  
  return result;
}

/**
 * Actualizar estado de mantenimiento
 */
export async function updateMaintenanceStatus(
  id: string,
  status: string,
  notes?: string,
  assignedTechnician?: string
) {
  const supabase = await createServerClient();
  
  const updateData: any = {
    current_status: status,
    updated_at: new Date().toISOString()
  };
  
  if (status === 'Completado' || status === 'Cerrado') {
    updateData.completed_at = new Date().toISOString();
  }
  
  if (notes) {
    updateData.repair_notes = notes;
  }
  
  const { data, error } = await supabase
    .from('maintenance_tracking')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating maintenance status:', error);
    throw new Error('Error al actualizar el estado de mantenimiento');
  }
  
  return data;
}

/**
 * Buscar registros de mantenimiento
 */
export async function searchMaintenanceRecords(
  searchTerm: string,
  status?: string,
  category?: string
): Promise<MaintenanceRecord[]> {
  const supabase = await createServerClient();
  
  let query = supabase
    .from('maintenance_tracking')
    .select(`
      *,
      resources:resource_id (
        id,
        number,
        name,
        brand,
        model,
        categories:category_id (
          name,
          type
        )
      ),
      users:user_id (
        name
      )
    `);
  
  if (searchTerm) {
    query = query.or(`incident_description.ilike.%${searchTerm}%,maintenance_type.ilike.%${searchTerm}%`);
  }
  
  if (status) {
    query = query.eq('current_status', status);
  }
  
  if (category) {
    query = query.eq('resources.categories.name', category);
  }
  
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('Error searching maintenance records:', error);
    return [];
  }
  
  return (data || []).map(formatMaintenanceRecordFromTracking);
}