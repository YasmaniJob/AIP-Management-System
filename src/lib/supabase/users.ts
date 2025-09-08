import { createServerClient } from '@/lib/supabase/server';
import { Database } from './database.types';
import { ROLES, normalizeRole } from '@/lib/utils/roles';

type UserInsert = Database['public']['Tables']['users']['Insert'];

export async function createUserInDatabase(userData: Omit<UserInsert, 'id' | 'created_at'>) {
  const supabase = createServerClient();
  
  // First, check if user with same DNI or email exists
  const { data: existingUsers, error: checkError } = await supabase
    .from('users')
    .select('dni, email')
    .or(`dni.eq.${userData.dni},email.eq.${userData.email}`);
    
  if (checkError) {
    console.error('Error checking for existing users:', checkError);
    throw new Error('Error al verificar usuarios existentes');
  }
  
  if (existingUsers && existingUsers.length > 0) {
    const existingDni = existingUsers.some(u => u.dni === userData.dni);
    const existingEmail = existingUsers.some(u => u.email === userData.email);
    
    if (existingDni) throw new Error('Ya existe un usuario con este DNI');
    if (existingEmail) throw new Error('Ya existe un usuario con este correo electrónico');
  }
  
  // Insert the new user
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating user in database:', error);
    throw new Error(`Error al crear el usuario: ${error.message}`);
  }
  
  return data;
}

export async function createUserWithAuth(
  email: string,
  password: string,
  userData: Omit<UserInsert, 'id' | 'email' | 'created_at'>
) {
  const supabase = createServerClient();
  
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          dni: userData.dni,
          role: userData.role,
        },
        emailRedirectTo: undefined
      }
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear el usuario de autenticación');
    
    // 2. Create database user
    const dbUser = await createUserInDatabase({
      ...userData,
      id: authData.user.id,
      email: email,
      role: userData.role
    });
    
    return { authData, dbUser };
    
  } catch (error) {
    // Clean up auth user if something went wrong
    if (error?.authError?.user?.id) {
      await supabase.auth.admin.deleteUser(error.authError.user.id);
    }
    throw error;
  }
}
