// src/lib/actions/users.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient, createAdminClient } from '../supabase/server';
import { z } from 'zod';
import { USER_ROLES } from '../types';
import { usersCache } from '../cache/users-cache';
import { performanceMonitor, measurePerformance } from '../monitoring/performance-monitor';


const userRoleTuple = z.enum(USER_ROLES);

const baseUserSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos.'),
  email: z.string().email('Debe ser un email válido.'),
  role: userRoleTuple,
});

const addUserSchema = baseUserSchema.extend({
    password: z.string().optional(),
}).refine(data => {
    if (data.role === 'Administrador') {
        return !!data.email && !!data.password && data.password.length >= 6;
    }
    return true;
}, {
    message: 'El email y una contraseña de al menos 6 caracteres son obligatorios para los administradores.',
    path: ['password'],
});

export async function addUserAction(values: z.infer<typeof addUserSchema>, options?: { skipRevalidation?: boolean }) {
  const supabase = await createServerClient();
  const parsedData = addUserSchema.safeParse(values);

  if (!parsedData.success) {
    const errorMessages = parsedData.error.errors.map(e => e.message).join(', ');
    return { success: false, error: `Datos inválidos: ${errorMessages}` };
  }
  
  const { name, dni, email, role, password } = parsedData.data;

  // Use DNI as password for teachers, or the provided password for admins
  const finalPassword = role === 'Docente' ? dni : password!;

  // Usar cliente administrativo para crear usuarios
  const adminClient = createAdminClient();
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email!,
    password: finalPassword,
    user_metadata: {
      name,
      dni,
      role,
    },
    email_confirm: true
  });

  if (authError) {
    console.error('Error adding user via Auth:', authError);
    if (authError.message.includes('unique constraint')) {
        return { success: false, error: 'El DNI o el email ya existen.' };
    }
    return { success: false, error: `Error de autenticación: ${authError.message}` };
  }

  // Insertar manualmente en la tabla users si el registro fue exitoso
  if (authData.user) {
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name,
        email,
        dni,
        role
      });

    if (dbError) {
      console.error('Error inserting user in database:', dbError);
      // No retornamos error aquí porque el usuario ya fue creado en auth
    }
  }

  // Solo revalidar si no se especifica skipRevalidation
  if (!options?.skipRevalidation) {
    revalidatePath(role === 'Docente' ? '/docentes' : '/configuracion');
  }
  return { success: true };
}

// Schema for updating a user
const updateUserSchema = baseUserSchema.extend({
    id: z.string(),
});


export async function updateUserAction(values: z.infer<typeof updateUserSchema>) {
  const supabase = await createServerClient();
  const parsedData = updateUserSchema.safeParse(values);
  if (!parsedData.success) {
    return { success: false, error: 'Datos inválidos.' };
  }

  const { id, ...dataToUpdate } = parsedData.data;

  const { error } = await supabase
    .from('users')
    .update({ ...dataToUpdate })
    .eq('id', id);

  if (error) {
    console.error('Error updating user:', error);
    if (error.code === '23505') { // unique constraint violation
        return { success: false, error: 'El DNI o el email ya existen.' };
    }
    return { success: false, error: `Error de base de datos: ${error.message}` };
  }
  
  revalidatePath(dataToUpdate.role === 'Docente' ? '/docentes' : '/configuracion');
  return { success: true };
}

// Action to delete a user
export async function deleteUserAction(id: string) {
  const supabase = await createServerClient();
  
  // First, check if the user is the only administrator
  const { data: userToDelete, error: fetchError } = await supabase
    .from('users')
    .select('role')
    .eq('id', id)
    .single();

  if (fetchError) {
    return { success: false, error: "No se pudo encontrar al usuario." };
  }

  if (userToDelete.role === 'Administrador') {
    const { count, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'Administrador');

    if (countError) {
      return { success: false, error: "Error al verificar los administradores." };
    }

    if (count === 1) {
      return { success: false, error: 'No se puede eliminar al único administrador del sistema.' };
    }
  }

  // Primero eliminar de la base de datos
  const { error: dbError } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Error deleting user from database:', dbError);
    return { success: false, error: `No se pudo eliminar el usuario. Es posible que tenga préstamos o reuniones asociadas. ${dbError.message}` };
  }

  // Intentar eliminar de Supabase Auth (puede no existir)
  const adminClient = createAdminClient();
  const { error: authError } = await adminClient.auth.admin.deleteUser(id);
  
  // Solo logear el error de Auth si no es "user_not_found"
  if (authError && authError.code !== 'user_not_found') {
    console.error('Error deleting user from auth:', authError);
    // No retornamos error aquí porque el usuario ya fue eliminado de la DB
  }
  
  revalidatePath('/docentes');
  revalidatePath('/configuracion');
  return { success: true };
}


// Action to search for users (for loans, etc.)
export async function searchUsersAction(searchTerm: string) {
    const supabase = await createServerClient();
    if (!searchTerm) {
        return { success: true, data: [] };
    }
    
    const { data, error } = await supabase
        .from('users')
        .select('id, name, role')
        .or(`name.ilike.%${searchTerm}%,dni.ilike.%${searchTerm}%`)
        .in('role', ['Docente', 'Administrador'])
        .limit(10);
        
    if (error) {
        console.error("Search error:", error);
        return { success: false, error: "Error en la búsqueda." };
    }
    
    return { success: true, data };
}
