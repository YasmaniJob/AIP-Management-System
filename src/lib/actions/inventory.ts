// src/lib/actions/inventory.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '../supabase/server';
import { z } from 'zod';
import { categoryColorService } from '../services/category-color-service';
import { 
  resourceCategorySchema, 
  resourceStatusSchema, 
  nameFieldSchema, 
  idFieldSchema, 
  optionalStringSchema 
} from '../constants/shared-schemas';

// ========== CATEGORIES ==========

const categorySchema = z.object({
  name: nameFieldSchema,
  type: resourceCategorySchema,
});

export async function addCategoryAction(values: z.infer<typeof categorySchema>) {
  const supabase = await createServerClient();
  const parsedData = categorySchema.safeParse(values);

  if (!parsedData.success) {
    const errorMessages = parsedData.error.errors.map(e => e.message).join(', ');
    return { success: false, error: `Datos inválidos: ${errorMessages}` };
  }

  const { name, type } = parsedData.data;
  const color = categoryColorService.getLegacyColorMap()[type] || '#6b7280';

  const { error } = await supabase.from('categories').insert({ name, type, color });

  if (error) {
    console.error('Error adding category:', error);
    if (error.code === '23505') {
        return { success: false, error: 'Ya existe una categoría con este nombre.' };
    }
    // Return the specific database error message for better debugging
    return { success: false, error: `Error de base de datos: ${error.message}` };
  }

  revalidatePath('/inventario');
  return { success: true, message: `Categoría "${name}" añadida correctamente.` };
}

const updateCategorySchema = z.object({
    id: idFieldSchema,
    name: nameFieldSchema,
    type: resourceCategorySchema,
});

export async function updateCategoryAction(values: z.infer<typeof updateCategorySchema>) {
  const supabase = await createServerClient();
    const parsedData = updateCategorySchema.safeParse(values);
    
    if (!parsedData.success) {
        const errorMessages = parsedData.error.errors.map(e => e.message).join(', ');
        return { success: false, error: `Datos inválidos: ${errorMessages}` };
    }
    
    const { id, name, type } = parsedData.data;
    const color = categoryColorService.getLegacyColorMap()[type] || '#6b7280';

    const { error } = await supabase
        .from('categories')
        .update({ name, type, color })
        .eq('id', id);

    if (error) {
        console.error('Error updating category:', error);
         if (error.code === '23505') {
            return { success: false, error: 'Ya existe una categoría con este nombre.' };
        }
        return { success: false, error: `Error de base de datos: ${error.message}` };
    }

    revalidatePath('/inventario');
    revalidatePath(`/inventario/${id}`);
    return { success: true, message: 'Categoría actualizada.' };
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createServerClient();
    
    // Check if category has resources
    const { count, error: countError } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);

    if (countError) {
        console.error('Error counting resources in category:', countError);
        return { success: false, error: 'Error al verificar los recursos de la categoría.' };
    }

    if (count !== null && count > 0) {
        return { success: false, error: `No se puede eliminar. La categoría contiene ${count} recurso(s).` };
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
        console.error('Error deleting category:', error);
        return { success: false, error: 'No se pudo eliminar la categoría.' };
    }

    revalidatePath('/inventario');
    return { success: true, message: 'Categoría eliminada.' };
}


// ========== RESOURCES ==========

const resourceSchema = z.object({
  brand: z.string().min(1, 'La marca o tipo es obligatoria.'),
  model: z.string().optional(),
  processorBrand: z.string().optional(),
  generation: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  notes: z.string().optional(),
  quantity: z.number().min(1, 'La cantidad debe ser al menos 1.'),
  categoryId: z.string(),
});

export async function addResourceAction(values: z.infer<typeof resourceSchema>) {
  const supabase = await createServerClient();
    const parsedData = resourceSchema.safeParse(values);

    if (!parsedData.success) {
        const errorMessages = parsedData.error.errors.map(e => e.message).join(', ');
        return { success: false, error: `Datos inválidos: ${errorMessages}` };
    }

    const { quantity, categoryId, ...resourceData } = parsedData.data;

    const resourcesToInsert = Array.from({ length: quantity }, () => ({
        category_id: categoryId,
        brand: resourceData.brand,
        model: resourceData.model,
        processor_brand: resourceData.processorBrand,
        generation: resourceData.generation,
        ram: resourceData.ram,
        storage: resourceData.storage,
        notes: resourceData.notes,
    }));

    const { error } = await supabase.from('resources').insert(resourcesToInsert);

    if (error) {
        console.error('Error adding resources:', error);
        return { success: false, error: `Error de base de datos: ${error.message}` };
    }

    revalidatePath('/inventario');
    revalidatePath(`/inventario/${categoryId}`);
    return { success: true, message: `${quantity} recurso(s) añadido(s) correctamente.` };
}

const updateResourceSchema = z.object({
  id: idFieldSchema,
  model: optionalStringSchema,
  brand: optionalStringSchema,
  processorBrand: optionalStringSchema,
  generation: optionalStringSchema,
  ram: optionalStringSchema,
  storage: optionalStringSchema,
  notes: optionalStringSchema,
  status: resourceStatusSchema,
});

export async function updateResourceAction(values: z.infer<typeof updateResourceSchema>) {
  const supabase = await createServerClient();
    const parsedData = updateResourceSchema.safeParse(values);

    if (!parsedData.success) {
        const errorMessages = parsedData.error.errors.map(e => e.message).join(', ');
        return { success: false, error: `Datos inválidos: ${errorMessages}` };
    }

    const { id, processorBrand, ...dataToUpdate } = parsedData.data;
    
    const { data: resource, error: fetchError } = await supabase
        .from('resources')
        .select('category_id')
        .eq('id', id)
        .single();
    
    if (fetchError || !resource) {
         return { success: false, error: 'No se pudo encontrar el recurso a actualizar.' };
    }

    const { error } = await supabase
        .from('resources')
        .update({ ...dataToUpdate, processor_brand: processorBrand })
        .eq('id', id);

    if (error) {
        console.error('Error updating resource:', error);
        return { success: false, error: `Error de base de datos: ${error.message}` };
    }

    revalidatePath('/inventario');
    revalidatePath(`/inventario/${resource.category_id}`);
    return { success: true, message: 'Recurso actualizado.' };
}


export async function deleteResourceAction(id: string) {
  const supabase = await createServerClient();
    
    const { data: resource, error: fetchError } = await supabase
        .from('resources')
        .select('status, category_id')
        .eq('id', id)
        .single();

    if (fetchError || !resource) {
        return { success: false, error: 'No se pudo encontrar el recurso.' };
    }

    if (resource.status === 'En Préstamo') {
        return { success: false, error: 'No se puede eliminar un recurso que está en préstamo.' };
    }

    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) {
        console.error('Error deleting resource:', error);
        return { success: false, error: `Error de base de datos: ${error.message}` };
    }

    revalidatePath('/inventario');
    revalidatePath(`/inventario/${resource.category_id}`);
    return { success: true, message: 'Recurso eliminado.' };
}

export async function deleteMultipleResourcesAction(ids: string[]) {
  const supabase = await createServerClient();
    
    const { data: resources, error: fetchError } = await supabase
        .from('resources')
        .select('id, status')
        .in('id', ids);

    if (fetchError) {
        return { success: false, error: 'Error al buscar los recursos a eliminar.' };
    }

    const deletableIds = resources.filter(r => r.status !== 'En Préstamo').map(r => r.id);
    const nonDeletableCount = ids.length - deletableIds.length;

    if (deletableIds.length === 0) {
        return { success: true, message: 'No se eliminó ningún recurso porque todos estaban en préstamo.', nonDeletableCount };
    }
    
    const { error } = await supabase
        .from('resources')
        .delete()
        .in('id', deletableIds);

    if (error) {
        console.error('Error deleting multiple resources:', error);
        return { success: false, error: 'Ocurrió un error al eliminar los recursos.' };
    }

    revalidatePath('/inventario');
    // We don't know which category pages to revalidate, so we rely on the main inventory revalidation
    
    return { success: true, message: `Se eliminaron ${deletableIds.length} recurso(s).`, nonDeletableCount };
}

export async function resolveResourceIssueAction(id: string) {
  const supabase = await createServerClient();
    
    const { error } = await supabase
        .from('resources')
        .update({ status: 'Disponible', notes: null })
        .eq('id', id);

    if (error) {
        console.error('Error resolving issue:', error);
        return { success: false, error: 'No se pudo resolver la incidencia.' };
    }

    revalidatePath('/inventario');
    return { success: true };
}
