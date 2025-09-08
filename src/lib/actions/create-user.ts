'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import { z } from 'zod';
import { normalizeRole, ROLES } from '@/lib/utils/roles';

// This file contains server actions for user creation
// All exported functions are automatically marked as server actions by the 'use server' directive at the top

// Server action result type
type ServerActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Esquema para la creación de usuarios
const createUserSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos.'),
  email: z.string().email('Debe ser un email válido.').nullable(),
  role: z.enum(['Administrador', 'Docente']),
  password: z.string().optional()
}).refine(
  (data) => {
    if (data.role === 'Administrador') {
      return data.password && data.password.length >= 6;
    }
    return true;
  },
  {
    message: 'Se requiere una contraseña de al menos 6 caracteres para administradores',
    path: ['password']
  }
);

// Main function to create a user
export const createUser = async (values: z.infer<typeof createUserSchema>): Promise<ServerActionResult> => {
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
    
    const parsedData = createUserSchema.safeParse(values);

    if (!parsedData.success) {
      const errorMessages = parsedData.error.errors.map(e => e.message).join(', ');
      return { success: false, error: `Datos inválidos: ${errorMessages}` };
    }
    
    const { name, dni, email, role, password } = parsedData.data;
    const normalizedRole = normalizeRole(role);
    
    // For teachers, use DNI as password if not provided
    const finalPassword = normalizedRole === ROLES.TEACHER ? dni : (password || '');
    
    // 1. Check if user with same DNI or email exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('dni, email')
      .or(`dni.eq.${dni}${email ? `,email.eq.${email}` : ''}`);
      
    if (checkError) {
      console.error('Error checking for existing users:', checkError);
      throw checkError;
    }
    
    if (existingUsers?.length > 0) {
      if (existingUsers.some(u => u.dni === dni)) {
        return { success: false, error: 'Ya existe un usuario con este DNI.' };
      }
      if (email && existingUsers.some(u => u.email === email)) {
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
      avatar: null,
      area: null
    };
    
    console.log('Inserting user data:', userData);
    
    const { error: dbError } = await supabase
      .from('users')
      .insert(userData);

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
    
    return { 
      success: true, 
      data: { 
        message: `${normalizedRole} creado exitosamente`,
        role: normalizedRole,
        userId: authData.user.id
      } 
    };
    
  } catch (error) {
    console.error('Error in createUser:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al crear el usuario' 
    };
  }
}
