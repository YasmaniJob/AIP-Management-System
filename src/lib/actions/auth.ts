// src/lib/actions/auth.ts
'use server';
import { z } from 'zod';
import { createServerClient } from '../supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { emailFieldSchema, passwordFieldSchema, dniFieldSchema } from '../constants/shared-schemas';

const loginSchema = z.object({
  email: emailFieldSchema,
  password: passwordFieldSchema,
});

export async function loginAction(values: z.infer<typeof loginSchema>) {
  const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
    });

    if (authError) {
        return { success: false, error: 'Credenciales inválidas. Por favor, verifica tu email y contraseña.' };
    }

    if (user) {
        (await cookies()).set('user_id', user.id, {
            path: '/',
            httpOnly: true,
            maxAge: 60 * 60 * 24, // 1 day
        });
        
        return { success: true, redirect: '/dashboard' };
    }

    return { success: true };
}

export async function logoutAction() {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    (await cookies()).delete('user_id');
    return { success: true, redirect: '/' };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Error al cerrar sesión' };
  }
}

export async function clearUserSessionAction() {
  try {
    // Server action to clear user session when layout fails
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    const cookieStore = await cookies();
    
    // Clear all auth-related cookies
    cookieStore.delete('user_id');
    cookieStore.delete('sb-access-token');
    cookieStore.delete('sb-refresh-token');
    
    // Clear all Supabase cookies that might exist
    const allCookies = cookieStore.getAll();
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
        cookieStore.delete(cookie.name);
      }
    });
    
    return { success: true, redirect: '/' };
  } catch (error) {
    console.error('Clear session error:', error);
    return { success: false, error: 'Error al limpiar sesión' };
  }
}

export async function getCurrentUser() {
  const supabase = await createServerClient();
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  
  if (!userId) {
    return null;
  }
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}



const registerSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: emailFieldSchema,
  dni: dniFieldSchema,
  password: passwordFieldSchema,
});

export async function registerAction(values: z.infer<typeof registerSchema>) {
  const supabase = await createServerClient();

    // Todos los usuarios se registran como administradores
    const userRole = 'Administrador';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
            data: {
                name: values.name,
                dni: values.dni,
                role: userRole
            }
        }
    });

    if (signUpError) {
        console.error("SignUp Error:", signUpError)
        return { error: `Error de autenticación: ${signUpError.message}` };
    }
    
    if (!signUpData.user) {
        return { error: 'No se pudo crear el usuario en el sistema de autenticación.' };
    }

    // Insertar manualmente en la tabla users
    const { error: dbError } = await supabase
        .from('users')
        .insert({
            id: signUpData.user.id,
            name: values.name,
            email: values.email,
            dni: values.dni,
            role: userRole
        });

    if (dbError) {
        console.error('Error inserting user in database:', dbError);
        if (dbError.code === '23505') {
            // Unique constraint violation
            if (dbError.message.includes('email')) {
                return { error: 'Este email ya está registrado en el sistema.' };
            }
            if (dbError.message.includes('dni')) {
                return { error: 'Este DNI ya está registrado en el sistema.' };
            }
            return { error: 'Ya existe un usuario con estos datos.' };
        }
        return { error: 'Error al crear el usuario en la base de datos. Inténtalo de nuevo.' };
    }
    
    // Usuario registrado exitosamente, redirigir al login
    // No establecemos cookie automáticamente - el usuario debe iniciar sesión
    
    return { success: true, redirect: '/?registered=true' };
}