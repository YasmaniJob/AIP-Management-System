// src/lib/data/maintenance-simplified.ts
'use server';

import { createServerClient } from '../supabase/server';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * FUNCIONES SIMPLIFICADAS DE MANTENIMIENTO
 * Diseñadas para usar la nueva tabla unificada maintenance_unified
 * Eliminan la complejidad de múltiples consultas y parsing JSON
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
 * Obtener recursos que requieren mantenimiento (reemplazo de getResourcesRequiringMaintenance)
 * UNA SOLA CONSULTA - Sin JOINs complejos ni parsing JSON
 */
export async function getResourcesRequiringMaintenance(
  categoryFilter?: string,
  limit?: number,
  offset?: number
): Promise<MaintenanceRecord[]> {
  const supabase = await createServerClient();
  
  let query = supabase
    .from('maintenance_unified')
    .select('*')
    .neq('current_status', 'Completado');

  // Filtrar por categoría si se especifica
  if (categoryFilter && categoryFilter !== 'Todos') {
    query = query.eq('resource_category', categoryFilter);
  }

  // Paginación
  if (limit) {
    query = query.limit(limit);
  }

  if (offset) {
    query = query.range(offset, offset + (limit || 10) - 1);
  }

  // Ordenar por fecha
  query = query.order('created_at', { ascending: false })
               .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching resources requiring maintenance:', error);
    return [];
  }

  // Transformar datos para compatibilidad con la UI existente
  return (data || []).map(record => ({
    ...record,
    resource_name: record.resource_category || 'Recurso',
    formatted_created_at: format(parseISO(record.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
    teacher_context: {
      teacherName: record.reporter_teacher_name || 'Docente no identificado',
      gradeName: record.reporter_grade || 'Grado no especificado',
      sectionName: record.reporter_section || 'Sección no especificada',
      reportDate: format(parseISO(record.report_date), 'dd/MM/yyyy', { locale: es })
    }
  }));
}

/**
 * Obtener recursos con mantenimiento completado (reemplazo de getCompletedMaintenanceResources)
 * UNA SOLA CONSULTA - Sin JOINs complejos ni parsing JSON
 */
export async function getCompletedMaintenanceResources(
  categoryFilter?: string,
  limit?: number,
  offset?: number
): Promise<MaintenanceRecord[]> {
  const supabase = await createServerClient();
  
  let query = supabase
    .from('maintenance_unified')
    .select('*')
    .eq('current_status', 'Completado');

  // Filtrar por categoría si se especifica
  if (categoryFilter && categoryFilter !== 'Todos') {
    query = query.eq('resource_category', categoryFilter);
  }

  // Paginación
  if (limit) {
    query = query.limit(limit);
  }

  if (offset) {
    query = query.range(offset, offset + (limit || 10) - 1);
  }

  // Ordenar por fecha de finalización
  query = query.order('completed_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching completed maintenance resources:', error);
    return [];
  }

  // Transformar datos para compatibilidad con la UI existente
  return (data || []).map(record => ({
    ...record,
    resource_name: record.resource_category || 'Recurso',
    formatted_created_at: format(parseISO(record.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
    teacher_context: {
      teacherName: record.reporter_teacher_name || 'Docente no identificado',
      gradeName: record.reporter_grade || 'Grado no especificado',
      sectionName: record.reporter_section || 'Sección no especificada',
      reportDate: format(parseISO(record.report_date), 'dd/MM/yyyy', { locale: es })
    }
  }));
}

/**
 * Obtener estadísticas de mantenimiento usando la función optimizada de la BD
 */
export async function getMaintenanceStats(): Promise<MaintenanceStats> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase.rpc('get_maintenance_stats');

  if (error) {
    console.error('Error fetching maintenance stats:', error);
    return {
      total_records: 0,
      pending_count: 0,
      in_progress_count: 0,
      completed_count: 0,
  
    };
  }

  return data[0] || {
    total_records: 0,
    pending_count: 0,
    in_progress_count: 0,
    completed_count: 0,

  };
}

/**
 * Obtener todas las categorías disponibles (simplificado)
 */
export async function getMaintenanceCategories(): Promise<string[]> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_unified')
    .select('resource_category')
    .not('resource_category', 'is', null);

  if (error) {
    console.error('Error fetching maintenance categories:', error);
    return [];
  }

  // Obtener categorías únicas
  const categories = [...new Set(data.map(item => item.resource_category))]
    .filter(Boolean)
    .sort();

  return categories;
}

/**
 * Crear un nuevo registro de mantenimiento
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
  
  // Obtener información del recurso
  const { data: resource, error: resourceError } = await supabase
    .from('resources')
    .select(`
      id,
      number,
      brand,
      model,
      category:categories(name, type)
    `)
    .eq('id', data.resourceId)
    .single();

  if (resourceError || !resource) {
    console.error('Error fetching resource:', resourceError);
    throw new Error('Recurso no encontrado');
  }

  // Crear registro unificado
  const { data: newRecord, error } = await supabase
    .from('maintenance_unified')
    .insert({
      resource_id: data.resourceId,
      resource_number: resource.number || 'N/A',
      resource_brand: resource.brand || 'N/A',
      resource_model: resource.model || 'N/A',
      resource_category: resource.category?.name || 'Sin Categoría',
      resource_type: resource.category?.type || 'N/A',
      maintenance_type: data.maintenanceType,
      damage_description: data.description,
      current_status: 'Pendiente',
      reporter_teacher_name: data.teacherName,
      reporter_grade: data.gradeName,
      reporter_section: data.sectionName,
      report_date: new Date().toISOString().split('T')[0],
      estimated_completion_date: data.estimatedCompletion || null,
  
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating maintenance record:', error);
    throw new Error('Error al crear el registro de mantenimiento');
  }

  return newRecord;
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

  if (notes) {
    updateData.repair_notes = notes;
  }

  if (assignedTechnician) {
    updateData.assigned_technician = assignedTechnician;
  }

  // Si el estado es 'Completado', establecer fecha de finalización
  if (status === 'Completado') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('maintenance_unified')
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
 * Obtener un registro específico de mantenimiento
 */
export async function getMaintenanceRecord(id: string): Promise<MaintenanceRecord | null> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_unified')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching maintenance record:', error);
    return null;
  }

  if (!data) return null;

  // Transformar datos para compatibilidad
  return {
    ...data,
    resource_name: data.resource_category || 'Recurso',
    formatted_created_at: format(parseISO(data.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
    teacher_context: {
      teacherName: data.reporter_teacher_name || 'Docente no identificado',
      gradeName: data.reporter_grade || 'Grado no especificado',
      sectionName: data.reporter_section || 'Sección no especificada',
      reportDate: format(parseISO(data.report_date), 'dd/MM/yyyy', { locale: es })
    }
  };
}

// =====================================================
// FUNCIONES DE BÚSQUEDA Y FILTRADO
// =====================================================

/**
 * Buscar registros de mantenimiento por texto
 */
export async function searchMaintenanceRecords(
  searchTerm: string,
  status?: string,
  category?: string
): Promise<MaintenanceRecord[]> {
  const supabase = await createServerClient();
  
  let query = supabase
    .from('maintenance_unified')
    .select('*');

  // Filtros opcionales
  if (status && status !== 'Todos') {
    query = query.eq('current_status', status);
  }

  if (category && category !== 'Todos') {
    query = query.eq('resource_category', category);
  }

  // Búsqueda por texto en múltiples campos
  if (searchTerm) {
    query = query.or(`
      resource_number.ilike.%${searchTerm}%,
      resource_brand.ilike.%${searchTerm}%,
      resource_model.ilike.%${searchTerm}%,
      maintenance_type.ilike.%${searchTerm}%,
      damage_description.ilike.%${searchTerm}%,
      reporter_teacher_name.ilike.%${searchTerm}%
    `);
  }

  query = query.order('created_at', { ascending: false }).limit(50);

  const { data, error } = await query;

  if (error) {
    console.error('Error searching maintenance records:', error);
    return [];
  }

  // Transformar datos
  return (data || []).map(record => ({
    ...record,
    resource_name: record.resource_category || 'Recurso',
    formatted_created_at: format(parseISO(record.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
    teacher_context: {
      teacherName: record.reporter_teacher_name || 'Docente no identificado',
      gradeName: record.reporter_grade || 'Grado no especificado',
      sectionName: record.reporter_section || 'Sección no especificada',
      reportDate: format(parseISO(record.report_date), 'dd/MM/yyyy', { locale: es })
    }
  }));
}

// =====================================================
// FUNCIÓN PARA COMPATIBILIDAD CON PÁGINAS EXISTENTES
// =====================================================

/**
 * Obtener registro de mantenimiento con incidencias (para compatibilidad)
 */
export async function getMaintenanceRecordWithIncidents(id: string) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_unified')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching maintenance record:', error);
    throw new Error('Error al obtener el registro de mantenimiento');
  }
  
  if (!data) {
    return null;
  }
  
  // Transformar datos para compatibilidad
  const record = {
    ...data,
    resource_name: data.resource_category || 'Recurso',
    formatted_created_at: format(parseISO(data.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
    teacher_context: {
      teacherName: data.reporter_teacher_name || 'Docente no identificado',
      gradeName: data.reporter_grade || 'Grado no especificado',
      sectionName: data.reporter_section || 'Sección no especificada',
      reportDate: format(parseISO(data.report_date), 'dd/MM/yyyy', { locale: es })
    }
  };
  
  // Para compatibilidad, creamos un objeto que simule la estructura anterior
  return {
    ...record,
    incidents: [{
      id: record.id,
      damage_type: record.maintenance_type,
      damage_description: record.damage_description,
      current_status: record.current_status,
      created_at: record.created_at,
      updated_at: record.updated_at,
      teacher_context: record.teacher_context
    }]
  };
}

/**
 * Obtener incidencias de mantenimiento por recurso (para compatibilidad)
 */
export async function getMaintenanceIncidents(resourceId: string) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_unified')
    .select('*')
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching maintenance incidents:', error);
    return [];
  }
  
  return (data || []).map(record => ({
    id: record.id,
    damage_type: record.maintenance_type,
    damage_description: record.damage_description,
    current_status: record.current_status,
    created_at: record.created_at,
    updated_at: record.updated_at,
    teacher_context: {
      teacherName: record.reporter_teacher_name,
      gradeName: record.reporter_grade,
      sectionName: record.reporter_section,
      reportDate: record.report_date
    }
  }));
}

/**
 * Obtener todos los registros de mantenimiento con incidencias (para compatibilidad)
 */
export async function getMaintenanceRecordsWithIncidents() {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_unified')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching maintenance records:', error);
    return [];
  }
  
  return (data || []).map(record => ({
    resource_id: record.resource_id,
    resource: {
      id: record.resource_id,
      number: record.resource_number,
      name: record.resource_category,
      brand: record.resource_brand,
      model: record.resource_model,
      category: {
        name: record.resource_category,
        type: record.resource_type
      }
    },
    incidents: [{
      id: record.id,
      damage_type: record.maintenance_type,
      damage_description: record.damage_description,
      current_status: record.current_status,
      created_at: record.created_at,
      updated_at: record.updated_at,
      teacher_context: {
        teacherName: record.reporter_teacher_name,
        gradeName: record.reporter_grade,
        sectionName: record.reporter_section,
        reportDate: record.report_date
      }
    }]
  }));
}

// =====================================================
// VENTAJAS DE ESTE ENFOQUE:
// =====================================================
// 1. UNA CONSULTA POR FUNCIÓN: Eliminamos múltiples queries
// 2. SIN PARSING JSON: Datos ya desnormalizados
// 3. RENDIMIENTO OPTIMIZADO: Índices específicos en la BD
// 4. CÓDIGO SIMPLE: Lógica de negocio más clara
// 5. FÁCIL MANTENIMIENTO: Menos complejidad
// 6. COMPATIBILIDAD: Mantiene la misma interfaz para la UI