'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import { z } from 'zod';
import { normalizeRole, ROLES } from '@/lib/utils/roles';

// Define the User type based on the database schema
type User = Database['public']['Tables']['users']['Insert'];

// Server action result type
type ServerActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

// User creation schema
const addUserSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  dni: z.string().min(8, 'El DNI debe tener al menos 8 caracteres'),
  email: z.string().email('Correo electrónico inválido').nullable(),
  role: z.string().min(1, 'El rol es obligatorio'),
  password: z.string().optional()
}).refine(data => {
  // Require password for admin users
  const roleLower = data.role?.toLowerCase();
  if (roleLower === 'admin' || roleLower === 'administrador') {
    return !!data.password && data.password.length >= 6;
  }
  return true;
}, {
  message: 'Se requiere una contraseña de al menos 6 caracteres para administradores',
  path: ['password']
});

export async function addUserAction(values: z.infer<typeof addUserSchema>): Promise<ServerActionResult> {
  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const parsedData = addUserSchema.safeParse(values);

    if (!parsedData.success) {
      const errorMessages = parsedData.error.errors.map(e => e.message).join(', ');
      return { success: false, error: `Datos inválidos: ${errorMessages}` };
    }
    
    const { name, dni, email, role, password } = parsedData.data;
    
    // Normalize the role
    const normalizedRole = normalizeRole(role);
    
    // For teachers, use DNI as password if not provided
    const finalPassword = normalizedRole === ROLES.TEACHER ? dni : (password || '');
    
    // 1. First, check if user with same DNI or email exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('dni, email')
      .or(`dni.eq.${dni}${email ? `,email.eq.${email}` : ''}`);
      
    if (checkError) {
      console.error('Error checking for existing users:', checkError);
      throw checkError;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      if (existingUsers.some((u: { dni: string }) => u.dni === dni)) {
        return { success: false, error: 'Ya existe un usuario con este DNI.' };
      }
      if (email && existingUsers.some((u: { email: string | null }) => u.email === email)) {
        return { success: false, error: 'Ya existe un usuario con este correo electrónico.' };
      }
    }
    
    // 2. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email || undefined,
      password: finalPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        name,
        dni,
        role: normalizedRole,
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return { 
        success: false, 
        error: authError.message.includes('already registered') 
          ? 'Este correo electrónico ya está registrado.' 
          : `Error al crear el usuario: ${authError.message}` 
      };
    }

    if (!authData.user) {
      return { success: false, error: 'No se pudo crear el usuario de autenticación' };
    }

    // 3. Create database user
    const userData = {
      id: authData.user.id,
      name,
      email: email || null,
      dni,
      role: normalizedRole,
      created_at: new Date().toISOString(),
      // Add default values for required fields
      avatar: null,
      area: null
    };
    
    console.log('Inserting user data:', userData);
    
    const { data: insertedUser, error: dbError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (dbError) {
      console.error('Error creating database user:', dbError);
      // Try to delete the auth user if DB insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { 
        success: false, 
        error: `Error al guardar en la base de datos: ${dbError.message}` 
      };
    }
    
    // Invalidate the appropriate cache
    revalidatePath(normalizedRole === ROLES.TEACHER ? '/docentes' : '/configuracion');
    
    if (dbError) throw dbError;
    
    console.log('User created successfully:', insertedUser);
    
    return { 
      success: true, 
      data: { 
        message: `${normalizedRole} creado exitosamente`,
        role: normalizedRole,
        userId: authData.user.id
      } 
    };
    
  } catch (error) {
    console.error('Error in addUserAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al crear el usuario' 
    };
  }
}
