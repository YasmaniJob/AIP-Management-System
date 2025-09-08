'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  dni: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = createClient();
        
        // Obtener el usuario autenticado
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          setUser(null);
          return;
        }
        
        // Obtener los datos del usuario desde la tabla users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (userError) {
          console.error('Error fetching user data:', userError);
          setError('Error al obtener los datos del usuario');
          setUser(null);
          return;
        }
        
        setUser(userData);
      } catch (err) {
        console.error('Error in getCurrentUser:', err);
        setError('Error inesperado al obtener el usuario');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  return { user, loading, error };
}