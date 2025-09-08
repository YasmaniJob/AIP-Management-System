// src/lib/actions/maintenance.ts
'use server';

import { createServerClient } from '../supabase/server';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';
import { processIncidentNotifications } from '@/lib/services/notification-service';

// Define types based on the database schema
type MaintenanceTracking = {
  id: string;
  resource_id: string;
  user_id: string | null;
  maintenance_type: string;
  incident_category: string | null;
  incident_description: string | null;
  current_status: string;
  estimated_completion_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type MaintenanceStatusHistory = {
  id: string;
  maintenance_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  change_reason: string | null;
  notes: string | null;
  created_at: string;
};

// Helper type for the Supabase client
type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

/**
 * Crear un nuevo registro de mantenimiento
 */
export async function createMaintenanceRecord(data: {
  resourceId: string;
  maintenanceType: string;
  incidentCategory?: string;
  description: string;
  estimatedCompletion?: string;
}) {
  try {
    const supabase = await createServerClient();
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' };
    }

    const { data: newRecord, error } = await supabase
      .from('maintenance_tracking')
      .insert({
        resource_id: data.resourceId,
        user_id: user.id,
        maintenance_type: data.maintenanceType,
        incident_category: data.incidentCategory,
        incident_description: data.description,
        estimated_completion_date: data.estimatedCompletion,
        current_status: 'Pendiente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating maintenance record:', error);
      return { success: false, error: `Error al crear registro: ${error.message}` };
    }

    // Actualizar el estado del recurso a "En Mantenimiento"
    const { error: resourceError } = await supabase
      .from('resources')
      .update({ status: 'En Mantenimiento' })
      .eq('id', data.resourceId);

    if (resourceError) {
      console.error('Error updating resource status:', resourceError);
    }

    // Revalidar las páginas relacionadas
    revalidatePath('/inventario');
    revalidatePath('/prestamos');

    return { success: true, record: newRecord };
  } catch (error: any) {
    console.error('Error in createMaintenanceRecord:', error);
    return { success: false, error: `Error interno: ${error.message}` };
  }
}

/**
 * Actualizar el estado de un registro de mantenimiento
 */
export async function updateMaintenanceStatus(
  maintenanceId: string,
  newStatus: string,
  notes?: string,
  estimatedCompletionDate?: string
) {
  try {
    const supabase = await createServerClient();
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' };
    }

    // Obtener el estado actual
    const { data: currentRecord, error: fetchError } = await supabase
      .from('maintenance_tracking')
      .select('current_status, resource_id')
      .eq('id', maintenanceId)
      .single();

    if (fetchError || !currentRecord) {
      return { success: false, error: 'Registro de mantenimiento no encontrado.' };
    }

    // Preparar datos de actualización
    const updateData: any = {
      current_status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.incident_description = notes;
    }

    if (estimatedCompletionDate) {
      updateData.estimated_completion_date = estimatedCompletionDate;
    }

    // Si se marca como completado, establecer fecha de completado
    if (newStatus === 'Completado') {
      updateData.completed_at = new Date().toISOString();
    }

    // Actualizar el registro
    const { error: updateError } = await supabase
      .from('maintenance_tracking')
      .update(updateData)
      .eq('id', maintenanceId);

    if (updateError) {
      console.error('Error updating maintenance status:', updateError);
      return { success: false, error: `Error al actualizar estado: ${updateError.message}` };
    }

    // Registrar el cambio en el historial
    const { error: historyError } = await supabase
      .from('maintenance_status_history')
      .insert({
        maintenance_id: maintenanceId,
        previous_status: currentRecord.current_status,
        new_status: newStatus,
        changed_by: user.id,
        notes: notes || `Estado cambiado de ${currentRecord.current_status} a ${newStatus}`,
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error creating status history:', historyError);
    }

    // Si se completa el mantenimiento, actualizar el estado del recurso y enviar notificaciones
    if (newStatus === 'Completado') {
      const { error: resourceError } = await supabase
        .from('resources')
        .update({ status: 'Disponible' })
        .eq('id', currentRecord.resource_id);

      if (resourceError) {
        console.error('Error updating resource status:', resourceError);
      }

      // Enviar notificaciones de mantenimiento completado
      try {
        // Obtener información completa del registro para las notificaciones
        const { data: maintenanceRecord, error: recordError } = await supabase
          .from('maintenance_tracking')
          .select(`
            *,
            resource:resources (
              id,
              number,
              brand,
              model,
              category:categories(name, type)
            )
          `)
          .eq('id', maintenanceId)
          .single();

        if (!recordError && maintenanceRecord) {
          // Crear un objeto compatible con el tipo Incident para las notificaciones
          const incidentForNotification = {
            id: maintenanceRecord.id,
            title: `Mantenimiento de ${maintenanceRecord.resource?.category?.name} ${maintenanceRecord.resource?.number}`,
            type: maintenanceRecord.incident_type || 'Mantenimiento',
            status: 'Resuelto',
            resource_id: maintenanceRecord.resource_id,
            resource: maintenanceRecord.resource,
            created_at: maintenanceRecord.created_at
          };

          // Procesar notificaciones de mantenimiento completado
          await processIncidentNotifications(
            incidentForNotification as any,
            'resolved'
          );
        }
      } catch (notificationError) {
        console.error('Error sending maintenance completion notifications:', notificationError);
        // No fallar la operación principal si las notificaciones fallan
      }
    }

    // Revalidar las páginas relacionadas
    revalidatePath('/inventario');
    revalidatePath('/prestamos');

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateMaintenanceStatus:', error);
    return { success: false, error: `Error interno: ${error.message}` };
  }
}

/**
 * Función de compatibilidad para actualizar estado de mantenimiento
 * (mantiene la misma interfaz que updateMaintenanceIncidentStatus)
 */
export async function updateMaintenanceIncidentStatus(
  maintenanceId: string,
  newStatus: string,
  notes?: string,
  estimatedCompletionDate?: string
) {
  return updateMaintenanceStatus(maintenanceId, newStatus, notes, estimatedCompletionDate);
}

/**
 * Eliminar un registro de mantenimiento
 */
export async function deleteMaintenanceRecord(maintenanceId: string) {
  try {
    const supabase = await createServerClient();
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' };
    }

    // Obtener información del recurso antes de eliminar
    const { data: record, error: fetchError } = await supabase
      .from('maintenance_tracking')
      .select('resource_id')
      .eq('id', maintenanceId)
      .single();

    if (fetchError || !record) {
      return { success: false, error: 'Registro de mantenimiento no encontrado.' };
    }

    // Eliminar el registro
    const { error: deleteError } = await supabase
      .from('maintenance_tracking')
      .delete()
      .eq('id', maintenanceId);

    if (deleteError) {
      console.error('Error deleting maintenance record:', deleteError);
      return { success: false, error: `Error al eliminar registro: ${deleteError.message}` };
    }

    // Actualizar el estado del recurso a "Disponible"
    const { error: resourceError } = await supabase
      .from('resources')
      .update({ status: 'Disponible' })
      .eq('id', record.resource_id);

    if (resourceError) {
      console.error('Error updating resource status:', resourceError);
    }

    // Revalidar las páginas relacionadas
    revalidatePath('/inventario');
    revalidatePath('/prestamos');

    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteMaintenanceRecord:', error);
    return { success: false, error: `Error interno: ${error.message}` };
  }
}

/**
 * Obtener historial de estados de un registro de mantenimiento
 */
export async function getMaintenanceStatusHistory(maintenanceId: string) {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('maintenance_status_history')
      .select(`
        *,
        user:users(name)
      `)
      .eq('maintenance_id', maintenanceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching status history:', error);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getMaintenanceStatusHistory:', error);
    return [];
  }
}

/**
 * Asignar un usuario a un registro de mantenimiento
 */
export async function assignMaintenanceUser(maintenanceId: string, userId: string) {
  try {
    const supabase = await createServerClient();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado.' };
    }

    const { error } = await supabase
      .from('maintenance_tracking')
      .update({
        user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', maintenanceId);

    if (error) {
      console.error('Error assigning user:', error);
      return { success: false, error: `Error al asignar usuario: ${error.message}` };
    }

    // Revalidar las páginas relacionadas
    revalidatePath('/inventario');
    revalidatePath('/prestamos');

    return { success: true };
  } catch (error: any) {
    console.error('Error in assignMaintenanceUser:', error);
    return { success: false, error: `Error interno: ${error.message}` };
  }
}