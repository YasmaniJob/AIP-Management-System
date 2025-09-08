'use server';
import { createServerClient } from '../supabase/server';
import { cookies } from 'next/headers';

/**
 * Función para limpiar usuarios huérfanos en Supabase Auth
 * que no tienen correspondencia en la tabla users
 */
export async function cleanupOrphanedUsers() {
  try {
    const supabase = await createServerClient();
    
    // Obtener todos los usuarios de auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return { success: false, error: 'Error al obtener usuarios de autenticación' };
    }
    
    // Obtener todos los usuarios de la tabla users
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id');
    
    if (dbError) {
      console.error('Error fetching database users:', dbError);
      return { success: false, error: 'Error al obtener usuarios de la base de datos' };
    }
    
    const dbUserIds = new Set(dbUsers?.map(user => user.id) || []);
    const orphanedUsers = authUsers.users.filter(authUser => !dbUserIds.has(authUser.id));
    
    // Eliminar usuarios huérfanos de auth
    for (const orphanedUser of orphanedUsers) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(orphanedUser.id);
      if (deleteError) {
        console.error(`Error deleting orphaned user ${orphanedUser.id}:`, deleteError);
      }
    }
    
    return { 
      success: true, 
      message: `Limpieza completada. ${orphanedUsers.length} usuarios huérfanos eliminados.` 
    };
    
  } catch (error) {
    console.error('Error in cleanup process:', error);
    return { success: false, error: 'Error inesperado durante la limpieza' };
  }
}

/**
 * Función para verificar si el usuario actual existe en la base de datos
 */
export async function verifyCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return { exists: false, reason: 'No user ID in cookie' };
    }
    
    const supabase = await createServerClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return { exists: false, reason: 'User not found in database', userId };
    }
    
    return { exists: true, user };
    
  } catch (error) {
    console.error('Error verifying current user:', error);
    return { exists: false, reason: 'Error during verification' };
  }
}