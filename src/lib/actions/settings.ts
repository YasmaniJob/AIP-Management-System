// src/lib/actions/settings.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '../supabase/server';
import { z } from 'zod';
import { numberToOrdinal } from '../utils';

// ========== AREAS ==========

// Schema for adding areas
const addAreasSchema = z.object({
  names: z.string().min(1, 'Debe haber al menos un nombre de área.'),
});

export async function addAreaAction(values: z.infer<typeof addAreasSchema>) {
  const supabase = await createServerClient();
  const parsedData = addAreasSchema.safeParse(values);
  if (!parsedData.success) {
    return { success: false, error: 'Datos inválidos.' };
  }

  const areasToInsert = parsedData.data.names.split('\n').map(name => ({
    name: name.trim(),
  })).filter(area => area.name.length > 0);

  if (areasToInsert.length === 0) {
    return { success: false, error: 'No se proporcionaron áreas válidas.' };
  }

  const { error } = await supabase.from('areas').insert(areasToInsert);

  if (error) {
    console.error('Error adding areas:', error);
    return { success: false, error: `Error de base de datos: ${error.message}` };
  }

  revalidatePath('/configuracion');
  return { success: true };
}


// Schema for editing an area
const editAreaSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre es requerido.'),
});

export async function updateAreaAction(values: z.infer<typeof editAreaSchema>) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('areas')
    .update({ name: values.name })
    .eq('id', values.id);

  if (error) {
    console.error('Error updating area:', error);
    return { success: false, error: `Error de base de datos: ${error.message}` };
  }
  revalidatePath('/configuracion');
  return { success: true };
}


// Action to delete an area
export async function deleteAreaAction(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from('areas').delete().eq('id', id);

  if (error) {
    console.error('Error deleting area:', error);
    return { success: false, error: `No se pudo eliminar el área. Es posible que esté en uso. ${error.message}` };
  }
  revalidatePath('/configuracion');
  return { success: true };
}


// Schema and action for adding grades
const addGradesSchema = z.object({
  names: z.string().min(1, 'Debe haber al menos un nombre de grado.'),
});

export async function addGradeAction(values: z.infer<typeof addGradesSchema>) {
  const supabase = await createServerClient();
    const parsedData = addGradesSchema.safeParse(values);
    if (!parsedData.success) {
        return { success: false, error: 'Datos inválidos.' };
    }
    
    const gradesToInsert = parsedData.data.names.split('\n').map(name => ({
        name: name.trim(),
    })).filter(grade => grade.name.length > 0);

    if (gradesToInsert.length === 0) {
        return { success: false, error: 'No se proporcionaron grados válidos.' };
    }
    
    const { error } = await supabase.from('grades').insert(gradesToInsert);
    
    if (error) {
        console.error('Error adding grades:', error);
        return { success: false, error: `Error de base de datos: ${error.message}` };
    }
    
    revalidatePath('/configuracion');
    return { success: true };
}

// Schema and action for editing a grade
const editGradeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre es requerido.'),
});

export async function updateGradeAction(values: z.infer<typeof editGradeSchema>) {
  const supabase = await createServerClient();
    const { error } = await supabase
        .from('grades')
        .update({ name: values.name })
        .eq('id', values.id);
    
    if (error) {
        console.error('Error updating grade:', error);
        return { success: false, error: `Error de base de datos: ${error.message}` };
    }
    revalidatePath('/configuracion');
    return { success: true };
}

// Action to delete a grade
export async function deleteGradeAction(id: string) {
  const supabase = await createServerClient();
    const { error } = await supabase.from('grades').delete().eq('id', id);
    if (error) {
        console.error('Error deleting grade:', error);
        return { success: false, error: `No se pudo eliminar el grado. Asegúrate de que no tenga secciones asociadas. ${error.message}` };
    }
    revalidatePath('/configuracion');
    return { success: true };
}


// Schema and action for adding sections
const addSectionsSchema = z.object({
    names: z.string().min(1, 'Debe haber al menos un nombre de sección.'),
    gradeId: z.string()
});

export async function addSectionAction(values: z.infer<typeof addSectionsSchema>) {
    const supabase = await createServerClient();
    const parsedData = addSectionsSchema.safeParse(values);
    if (!parsedData.success) {
        return { success: false, error: 'Datos inválidos.' };
    }

    const sectionsToInsert = parsedData.data.names.split(' ').map(name => ({
        name: name.trim(),
        grade_id: parsedData.data.gradeId,
    })).filter(section => section.name.length > 0);

    if (sectionsToInsert.length === 0) {
        return { success: false, error: 'No se proporcionaron secciones válidas.' };
    }

    const { error } = await supabase.from('sections').insert(sectionsToInsert);

    if (error) {
        console.error('Error adding sections:', error);
        return { success: false, error: `Error de base de datos: ${error.message}` };
    }
    
    revalidatePath('/configuracion');
    return { success: true, message: `${sectionsToInsert.length} sección(es) añadida(s) correctamente.` };
}

// Schema and action for editing a section
const editSectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre es requerido.'),
});

export async function updateSectionAction(values: z.infer<typeof editSectionSchema>) {
  const supabase = await createServerClient();
    const { error } = await supabase
        .from('sections')
        .update({ name: values.name })
        .eq('id', values.id);
    
    if (error) {
        console.error('Error updating section:', error);
        return { success: false, error: `Error de base de datos: ${error.message}` };
    }
    revalidatePath('/configuracion');
    return { success: true };
}

// Action to delete a section
export async function deleteSectionAction(id: string) {
  const supabase = await createServerClient();
    const { error } = await supabase.from('sections').delete().eq('id', id);
    if (error) {
        console.error('Error deleting section:', error);
        return { success: false, error: `No se pudo eliminar la sección. Es posible que esté en uso. ${error.message}` };
    }
    revalidatePath('/configuracion');
    return { success: true };
}

// Schema and action for adding pedagogical hours
const addHoursSchema = z.object({
  count: z.number().min(1),
});

export async function addHoursAction(values: z.infer<typeof addHoursSchema>) {
  const supabase = await createServerClient();
    
    // Get current max order
    const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('pedagogical_hours')
        .select('hour_order')
        .order('hour_order', { ascending: false })
        .limit(1)
        .single();
    
    if (maxOrderError && maxOrderError.code !== 'PGRST116') { // Ignore 'exact one row' error if table is empty
        console.error('Error getting max hour order:', maxOrderError);
        return { success: false, error: 'No se pudo obtener el orden actual.' };
    }
    
    const startOrder = maxOrderData ? maxOrderData.hour_order + 1 : 1;
    
    const hoursToInsert = Array.from({ length: values.count }, (_, i) => {
        const order = startOrder + i;
        return {
            name: `${numberToOrdinal(order)} Hora`,
            hour_order: order,
        };
    });
    
    const { error } = await supabase.from('pedagogical_hours').insert(hoursToInsert);
    
    if (error) {
        console.error('Error adding hours:', error);
        return { success: false, error: `Error de base de datos: ${error.message}` };
    }
    
    revalidatePath('/configuracion');
    return { success: true };
}

// Schema and action for editing an hour
const editHourSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre es requerido.'),
});

export async function updateHourAction(values: z.infer<typeof editHourSchema>) {
  const supabase = await createServerClient();
    const { error } = await supabase
        .from('pedagogical_hours')
        .update({ name: values.name })
        .eq('id', values.id);
    
    if (error) {
        console.error('Error updating hour:', error);
        return { success: false, error: `Error de base de datos: ${error.message}` };
    }
    revalidatePath('/configuracion');
    return { success: true };
}

// Action to delete an hour
export async function deleteHourAction(id: string) {
  const supabase = await createServerClient();
    const { error } = await supabase.from('pedagogical_hours').delete().eq('id', id);
    if (error) {
        console.error('Error deleting hour:', error);
        return { success: false, error: `No se pudo eliminar la hora. Es posible que esté en uso. ${error.message}` };
    }
    revalidatePath('/configuracion');
    return { success: true };
}

// ========== SYSTEM SETTINGS ==========
const settingsSchema = z.object({
  allow_registration: z.boolean(),
});

export async function updateSettingsAction(values: z.infer<typeof settingsSchema>) {
  const supabase = await createServerClient();
    const { error } = await supabase
        .from('system_settings')
        .update({ allow_registration: values.allow_registration })
        .eq('id', 1); // Assuming there's only one row for settings

    if (error) {
        console.warn('Warning: Error updating settings:', {
            code: error.code,
            message: error.message
        });
        return { success: false, error: 'No se pudieron guardar los ajustes.' };
    }

    revalidatePath('/configuracion');
    return { success: true };
}

// ========== CUSTOMIZATION SETTINGS ==========
const customizationSchema = z.object({
  app_name: z.string().min(1, 'El nombre de la aplicación es requerido.'),
  app_logo_url: z.string().nullable(),
  primary_color: z.string().min(1, 'El color primario es requerido.'),
  accent_color: z.string().min(1, 'El color de acento es requerido.'),
  theme_preset: z.string().min(1, 'El preset de tema es requerido.'),
});

export async function updateCustomizationAction(values: z.infer<typeof customizationSchema>) {
  const supabase = await createServerClient();
    const { error } = await supabase
        .from('system_settings')
        .update({
          app_name: values.app_name,
          app_logo_url: values.app_logo_url,
          primary_color: values.primary_color,
          accent_color: values.accent_color,
          theme_preset: values.theme_preset,
        })
        .eq('id', 1);

    if (error) {
        console.error('Error updating customization:', error);
        return { success: false, error: 'No se pudieron guardar los ajustes de personalización.' };
    }

    revalidatePath('/configuracion');
    revalidatePath('/');
    return { success: true };
}

// Get system settings including customization
export async function getSystemSettings() {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error) {
        // Use console.warn instead of console.error to avoid client-side errors
        console.warn('Warning: Could not fetch system settings, using defaults:', {
          code: error.code,
          message: error.message
        });
        
        // Return default settings if there's an error
        return {
          id: 1,
          allow_registration: false,
          app_name: 'AIP Manager',
          app_logo_url: null,
          primary_color: '#3b82f6',
          accent_color: '#10b981',
          theme_preset: 'default',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
    }

    return data;
  } catch (error) {
    // Use console.warn instead of console.error to avoid client-side errors
    console.warn('Warning: Unexpected error fetching system settings, using defaults:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return default settings if there's an unexpected error
    return {
      id: 1,
      allow_registration: false,
      app_name: 'AIP Manager',
      app_logo_url: null,
      primary_color: '#3b82f6',
      accent_color: '#10b981',
      theme_preset: 'default',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}
