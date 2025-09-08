'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Hook para usar autenticación optimizada en componentes
 */
export function useOptimizedAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error obteniendo sesión:', error);
        
        // Si es un error de refresh token, limpiar todo y redirigir
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found')) {
          console.warn('🔄 Token de refresh inválido, limpiando sesión...');
          await clearAuthData();
          router.push('/login?error=session_expired');
          return;
        }
        
        setUser(null);
        setSession(null);
        return;
      }

      setSession(session);
      setUser(session?.user || null);
    } catch (error) {
      console.error('Error en refreshSession:', error);
      
      // Manejar errores de red o otros errores críticos
      if (error instanceof Error && error.message?.includes('refresh')) {
        await clearAuthData();
        router.push('/login?error=auth_error');
      }
      
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  const clearAuthData = useCallback(async () => {
    try {
      // Limpiar localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('supabase.auth.token') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Limpiar sessionStorage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('supabase.auth.token') || key.includes('supabase'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      console.log('🧹 Datos de autenticación limpiados');
    } catch (error) {
      console.error('Error limpiando datos de auth:', error);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      await clearAuthData();
      setUser(null);
      setSession(null);
      router.push('/login');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      // Aún así limpiar datos locales
      await clearAuthData();
      setUser(null);
      setSession(null);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [supabase, router, clearAuthData]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setSession(data.session);
      setUser(data.user);
      return { data, error: null };
    } catch (error) {
      console.error('Error iniciando sesión:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string, metadata?: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error registrando usuario:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Obtener sesión inicial
    refreshSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);

        // Redirigir según el evento
        if (event === 'SIGNED_OUT') {
          await clearAuthData();
          router.push('/login');
        } else if (event === 'SIGNED_IN') {
          router.push('/dashboard');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Token refreshed successfully');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, refreshSession]);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
    clearAuthData,
  };
}