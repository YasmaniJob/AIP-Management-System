// src/lib/data/maintenance.ts
'use server';

import { createServerClient } from '../supabase/server';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Obtener registros de mantenimiento con información del recurso
 */
export async function getMaintenanceRecords(categoryFilter?: string) {
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
        category:categories(id, name, type)
      ),
      user:users(name)
    `);

  // Filtrar por categoría si se especifica
  if (categoryFilter && categoryFilter !== 'Todos') {
    query = query.eq('resource.category.name', categoryFilter);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance records:', error);
    return [];
  }

  return data.map(record => ({
    ...record,
    resource_name: record.resource?.category?.name || 'Recurso',
    resource_type: record.resource?.category?.type || 'N/A',
    formatted_created_at: format(parseISO(record.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
    formatted_estimated_completion: record.estimated_completion_date 
      ? format(parseISO(record.estimated_completion_date), 'dd/MM/yyyy', { locale: es })
      : 'No estimado',
  }));
}

/**
 * Obtener registros de mantenimiento filtrados por estado
 */
export async function getMaintenanceRecordsByStatus(status?: string) {
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
        category:categories(name, type)
      ),
      user:users(name)
    `);

  if (status) {
    query = query.eq('current_status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance records by status:', error);
    return [];
  }

  return data.map(record => ({
    ...record,
    resource_name: record.resource?.category?.name || 'Recurso',
    resource_type: record.resource?.category?.type || 'N/A',
    formatted_created_at: format(parseISO(record.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
    formatted_estimated_completion: record.estimated_completion_date 
      ? format(parseISO(record.estimated_completion_date), 'dd/MM/yyyy', { locale: es })
      : 'No estimado',
  }));
}

/**
 * Obtener un registro específico de mantenimiento
 */
export async function getMaintenanceRecord(id: string) {
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
        category:categories(name, type)
      ),
      user:users(name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching maintenance record:', error);
    return null;
  }

  return {
    ...data,
    resource_name: data.resource?.category?.name || 'Recurso',
    resource_type: data.resource?.category?.type || 'N/A',
    formatted_created_at: format(parseISO(data.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
    formatted_estimated_completion: data.estimated_completion_date 
      ? format(parseISO(data.estimated_completion_date), 'dd/MM/yyyy', { locale: es })
      : 'No estimado',
  };
}

/**
 * Obtener un registro específico de mantenimiento con incidencias individuales
 */
export async function getMaintenanceRecordWithIncidents(id: string) {
  const supabase = await createServerClient();
  
  // Obtener el registro principal por resource_id (el más reciente)
  const { data: records, error: recordError } = await supabase
    .from('maintenance_tracking')
    .select(`
      *,
      resource:resources(
        id,
        number,
        brand,
        model,
        status,
        category:categories(name, type)
      ),
      assigned_user:users(id, name)
    `)
    .eq('resource_id', id)
    .order('created_at', { ascending: false })
    .limit(1);



  if (recordError) {
    console.error('Error fetching maintenance record:', recordError);
    return null;
  }

  if (!records || records.length === 0) {
    console.log('No maintenance record found for resource:', id);
    return null;
  }

  const record = records[0];

  // Obtener las incidencias individuales asociadas al recurso
  const resourceId = id; // El ID que recibimos es el resource_id
  const { data: incidents, error: incidentsError } = await supabase
      .from('maintenance_incidents_individual')
      .select(`
        id,
        incident_number,
        damage_type,
        damage_description,
        incident_context,
        reporter_name,
        reporter_grade,
        reporter_section,
        current_status,
        estimated_completion_date,
        created_at,
        updated_at
      `)
      .eq('resource_id', resourceId)
      .order('incident_number', { ascending: true });

  if (incidentsError) {
    console.error('Error fetching maintenance incidents:', incidentsError);
  }

  // Calcular estadísticas
  const totalIncidents = incidents?.length || 0;
  const completedIncidents = incidents?.filter(i => i.current_status === 'Completado').length || 0;
  const completionPercentage = totalIncidents > 0 ? Math.round((completedIncidents / totalIncidents) * 100) : 0;

  // Obtener contexto del profesor si existe
  let teacherContext = null;
  if (incidents && incidents.length > 0) {
    const firstIncident = incidents[0];
    teacherContext = {
      teacherName: firstIncident.reporter_name || 'Usuario no especificado',
      gradeName: firstIncident.reporter_grade || '',
      sectionName: firstIncident.reporter_section || ''
    };
  }

  return {
    ...record,
    incidents: incidents || [],
    totalIncidents,
    completedIncidents,
    completionPercentage,
    teacherContext,
    resource_name: record.resource?.category?.name || 'Recurso',
    resource_type: record.resource?.category?.type || 'N/A',
    formatted_created_at: format(parseISO(record.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
    formatted_estimated_completion: record.estimated_completion_date 
      ? format(parseISO(record.estimated_completion_date), 'dd/MM/yyyy', { locale: es })
      : 'No estimado',
  };
}

/**
 * Obtener estadísticas generales de mantenimiento
 */
export async function getMaintenanceStats() {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_tracking')
    .select('current_status, maintenance_type');

  if (error) {
    console.error('Error fetching maintenance stats:', error);
    return {
      totalRecords: 0,
      pendingRecords: 0,
      inProgressRecords: 0,
      completedRecords: 0,
    };
  }

  const totalRecords = data.length;
  const pendingRecords = data.filter(r => r.current_status === 'Pendiente').length;
  const inProgressRecords = data.filter(r => ['En Proceso', 'En Reparación'].includes(r.current_status)).length;
  const completedRecords = data.filter(r => r.current_status === 'Completado').length;

  return {
    totalRecords,
    pendingRecords,
    inProgressRecords,
    completedRecords,
  };
}

/**
 * Obtener recursos que requieren mantenimiento
 */
export async function getResourcesRequiringMaintenance(categoryFilter?: string, limit?: number, offset?: number) {
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
        category:categories(name, type)
      ),
      user:users(name)
    `)
    .neq('current_status', 'Completado');

  if (categoryFilter && categoryFilter !== 'Todos') {
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
    console.error('Error fetching resources requiring maintenance:', error);
    return [];
  }

  // Obtener información del docente desde las incidencias de mantenimiento
  const resourceIds = data.map(record => record.resource_id);
  const { data: incidents, error: incidentsError } = await supabase
    .from('maintenance_incidents_individual')
    .select(`
      resource_id,
      incident_context,
      reporter_name,
      reporter_grade,
      reporter_section,
      created_at
    `)
    .in('resource_id', resourceIds)
    .order('created_at', { ascending: true }); // Obtener la primera incidencia reportada

  if (incidentsError) {
    console.error('Error fetching incident context:', incidentsError);
  }

  return data.map(record => {
    // Obtener la primera incidencia para contexto del docente que reportó
    const resourceIncidents = incidents?.filter(incident => incident.resource_id === record.resource_id) || [];
    const firstIncident = resourceIncidents[0];
    
    let teacherContext = null;
    if (firstIncident) {
      teacherContext = {
        teacherName: firstIncident.reporter_name || 'Docente no identificado',
        gradeName: firstIncident.reporter_grade || 'Grado no especificado',
        sectionName: firstIncident.reporter_section || 'Sección no especificada',
        reportDate: format(parseISO(firstIncident.created_at), 'dd/MM/yyyy', { locale: es })
      };
    } else {
      teacherContext = {
        teacherName: 'Docente no identificado',
        gradeName: 'Grado no especificado',
        sectionName: 'Sección no especificada',
        reportDate: format(parseISO(record.created_at), 'dd/MM/yyyy', { locale: es })
      };
    }
    
    return {
      ...record,
      resource_name: record.resource?.category?.name || 'Recurso',
      resource_type: record.resource?.category?.type || 'N/A',
      formatted_created_at: format(parseISO(record.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
      teacher_context: teacherContext
    };
  });
}

/**
 * Obtener recursos completados para el historial de mantenimiento
 */
export async function getCompletedMaintenanceResources(categoryFilter?: string, limit?: number, offset?: number) {
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
        category:categories(name, type)
      ),
      user:users(name)
    `)
    .eq('current_status', 'Completado');

  if (categoryFilter && categoryFilter !== 'Todos') {
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
    console.error('Error fetching completed maintenance resources:', error);
    return [];
  }

  // Obtener información del docente desde las incidencias de mantenimiento
  const resourceIds = data.map(record => record.resource_id);
  const { data: incidents, error: incidentsError } = await supabase
    .from('maintenance_incidents_individual')
    .select(`
      resource_id,
      incident_context,
      reporter_name,
      reporter_grade,
      reporter_section,
      created_at
    `)
    .in('resource_id', resourceIds)
    .order('created_at', { ascending: true }); // Obtener la primera incidencia reportada

  if (incidentsError) {
    console.error('Error fetching incident context:', incidentsError);
  }

  return data.map(record => {
    // Obtener la primera incidencia para contexto del docente que reportó
    const resourceIncidents = incidents?.filter(incident => incident.resource_id === record.resource_id) || [];
    const firstIncident = resourceIncidents[0];
    
    let teacherContext = null;
    if (firstIncident) {
      teacherContext = {
        teacherName: firstIncident.reporter_name || 'Docente no identificado',
        gradeName: firstIncident.reporter_grade || 'Grado no especificado',
        sectionName: firstIncident.reporter_section || 'Sección no especificada',
        reportDate: format(parseISO(firstIncident.created_at), 'dd/MM/yyyy', { locale: es })
      };
    } else {
      teacherContext = {
        teacherName: 'Docente no identificado',
        gradeName: 'Grado no especificado',
        sectionName: 'Sección no especificada',
        reportDate: format(parseISO(record.created_at), 'dd/MM/yyyy', { locale: es })
      };
    }
    
    return {
      ...record,
      resource_name: record.resource?.category?.name || 'Recurso',
      resource_type: record.resource?.category?.type || 'N/A',
      formatted_created_at: format(parseISO(record.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
      teacher_context: teacherContext
    };
  });
}

/**
 * Crear un nuevo registro de mantenimiento
 */
export async function createMaintenanceRecord(data: {
  resourceId: string;
  maintenanceType: string;
  description: string;
  estimatedCompletion?: string;
  userId?: string;
}) {
  const supabase = await createServerClient();
  
  const { data: newRecord, error } = await supabase
    .from('maintenance_tracking')
    .insert({
      resource_id: data.resourceId,
      maintenance_type: data.maintenanceType,
      incident_description: data.description,
      estimated_completion_date: data.estimatedCompletion,
      user_id: data.userId,
      current_status: 'Pendiente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating maintenance record:', error);
    return { success: false, error: error.message };
  }

  return { success: true, record: newRecord };
}

/**
 * Actualizar el estado de un registro de mantenimiento
 */
export async function updateMaintenanceStatus(id: string, status: string, notes?: string) {
  const supabase = await createServerClient();
  
  const updateData: any = {
    current_status: status,
    updated_at: new Date().toISOString()
  };

  if (status === 'Completado') {
    updateData.completed_at = new Date().toISOString();
  }

  if (notes) {
    updateData.incident_description = notes;
  }

  const { data, error } = await supabase
    .from('maintenance_tracking')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating maintenance status:', error);
    return { success: false, error: error.message };
  }

  return { success: true, record: data };
}

/**
 * Obtener incidencias individuales de mantenimiento por recurso
 */
export async function getMaintenanceIncidents(resourceId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('maintenance_incidents_individual')
    .select(`
      id,
      incident_number,
      damage_type,
      damage_description,
      incident_context,
      current_status,

      estimated_completion_date,
      created_at,
      updated_at
    `)
    .eq('resource_id', resourceId)
    .order('incident_number', { ascending: true });

  if (error) {
    console.error('Error fetching maintenance incidents:', error);
    return [];
  }

  return data.map(incident => ({
    ...incident,
    formatted_created_at: format(parseISO(incident.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
    formatted_estimated_completion: incident.estimated_completion_date 
      ? format(parseISO(incident.estimated_completion_date), 'dd/MM/yyyy', { locale: es })
      : 'No estimado',
  }));
}

/**
 * Obtener categorías disponibles para filtros
 */
export async function getMaintenanceCategories() {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data.map(cat => cat.name);
}