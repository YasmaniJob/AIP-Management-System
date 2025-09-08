// Cliente de Supabase optimizado para planes gratuitos

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Configuración optimizada para reducir uso de recursos
const optimizedConfig = {
  auth: {
    // Mantener sesión en localStorage para evitar verificaciones constantes
    persistSession: true,
    // Refrescar token automáticamente pero con menos frecuencia
    autoRefreshToken: true,
    // No detectar sesión en URL para evitar llamadas innecesarias
    detectSessionInUrl: false,
    // Configurar storage personalizado si es necesario
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Configuración de retry para tokens
    retryAttempts: 3,
    // Tiempo de espera para refresh
    refreshTokenTimeout: 30000, // 30 segundos
  },
  realtime: {
    params: {
      // Limitar eventos por segundo para no exceder límites
      eventsPerSecond: 2,
    },
  },
  // Configuración de red optimizada
  global: {
    headers: {
      'X-Client-Info': 'optimized-client',
    },
  },
};

// Cliente principal optimizado
export const supabaseOptimized: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseAnonKey,
  optimizedConfig
);

// Clase para manejar conexiones realtime de manera eficiente
class RealtimeManager {
  private subscriptions = new Map<string, any>();
  private connectionCount = 0;
  private maxConnections = 2; // Límite para plan gratuito

  /**
   * Suscribirse a cambios en tiempo real con límites
   */
  subscribe(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: any) => void,
    filter?: string
  ) {
    const key = `${table}:${event}:${filter || 'all'}`;
    
    // Verificar límite de conexiones
    if (this.connectionCount >= this.maxConnections) {
      console.warn('⚠️ Límite de conexiones realtime alcanzado. Usando polling como alternativa.');
      return this.createPollingAlternative(table, callback);
    }

    // Si ya existe una suscripción, reutilizarla
    if (this.subscriptions.has(key)) {
      return this.subscriptions.get(key);
    }

    let channel = supabaseOptimized
      .channel(`realtime:${key}`)
      .on('postgres_changes', {
        event,
        schema: 'public',
        table,
        filter
      }, callback);

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.connectionCount++;
        console.log(`✅ Suscrito a ${key}. Conexiones activas: ${this.connectionCount}`);
      }
    });

    this.subscriptions.set(key, channel);
    return channel;
  }

  /**
   * Desuscribirse y limpiar recursos
   */
  unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
      this.connectionCount--;
      console.log(`❌ Desuscrito de ${key}. Conexiones activas: ${this.connectionCount}`);
    }
  }

  /**
   * Alternativa de polling cuando se alcanza el límite de realtime
   */
  private createPollingAlternative(table: string, callback: (data: any) => void) {
    let lastCheck = Date.now();
    
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabaseOptimized
          .from(table)
          .select('*')
          .gte('updated_at', new Date(lastCheck).toISOString())
          .limit(10);
        
        if (data && data.length > 0) {
          data.forEach(item => callback({ new: item, eventType: 'UPDATE' }));
        }
        
        lastCheck = Date.now();
      } catch (error) {
        console.error('Error en polling:', error);
      }
    }, 30000); // Polling cada 30 segundos

    return {
      unsubscribe: () => clearInterval(pollInterval)
    };
  }

  /**
   * Obtener estadísticas de conexiones
   */
  getStats() {
    return {
      activeConnections: this.connectionCount,
      maxConnections: this.maxConnections,
      subscriptions: Array.from(this.subscriptions.keys())
    };
  }

  /**
   * Limpiar todas las suscripciones
   */
  cleanup() {
    this.subscriptions.forEach((subscription, key) => {
      this.unsubscribe(key);
    });
  }
}

// Instancia del manager de realtime
export const realtimeManager = new RealtimeManager();

// Utilidades para autenticación optimizada
export class AuthManager {
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private lastSessionCheck = 0;
  private sessionCheckCooldown = 300000; // 5 minutos

  /**
   * Verificar sesión con throttling para evitar llamadas excesivas
   */
  async checkSession(force = false) {
    const now = Date.now();
    
    if (!force && (now - this.lastSessionCheck) < this.sessionCheckCooldown) {
      // Retornar sesión desde localStorage si está disponible
      const session = await supabaseOptimized.auth.getSession();
      return session.data.session;
    }

    this.lastSessionCheck = now;
    const { data: { session }, error } = await supabaseOptimized.auth.getSession();
    
    if (error) {
      console.error('Error verificando sesión:', error);
    }

    return session;
  }

  /**
   * Configurar verificación periódica de sesión
   */
  startSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    // Verificar sesión cada 10 minutos en lugar de constantemente
    this.sessionCheckInterval = setInterval(() => {
      this.checkSession(true);
    }, 600000); // 10 minutos
  }

  /**
   * Detener monitoreo de sesión
   */
  stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Inicializar autenticación optimizada
   */
  async initialize() {
    // Verificar sesión inicial
    const session = await this.checkSession(true);
    
    // Configurar listener de cambios de auth (solo eventos importantes)
    supabaseOptimized.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        console.log(`🔐 Auth event: ${event}`);
        // Limpiar caché relacionado con usuario cuando cambie la sesión
        if (event === 'SIGNED_OUT') {
          // Limpiar caché y suscripciones
          realtimeManager.cleanup();
        }
      }
    });

    this.startSessionMonitoring();
    return session;
  }
}

// Instancia del manager de autenticación
export const authManager = new AuthManager();

// Hook optimizado para autenticación
import { useEffect, useState } from 'react';

export function useOptimizedAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const initAuth = async () => {
      try {
        const session = await authManager.initialize();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error inicializando auth:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();

    // Cleanup al desmontar
    return () => {
      authManager.stopSessionMonitoring();
    };
  }, [initialized]);

  return { user, loading };
}

// Utilidades para monitoreo de uso
export const usageMonitor = {
  // Contadores de uso
  counters: {
    queries: 0,
    realtimeEvents: 0,
    authChecks: 0,
    storageOperations: 0
  },

  // Incrementar contador
  increment(type: keyof typeof usageMonitor.counters) {
    this.counters[type]++;
    
    // Alertas cuando se acerque a límites
    if (this.counters.queries > 50000 * 0.8) {
      console.warn('⚠️ Acercándose al límite de consultas mensuales');
    }
  },

  // Obtener estadísticas
  getStats() {
    return {
      ...this.counters,
      realtime: realtimeManager.getStats(),
      timestamp: new Date().toISOString()
    };
  },

  // Resetear contadores (llamar mensualmente)
  reset() {
    Object.keys(this.counters).forEach(key => {
      this.counters[key as keyof typeof this.counters] = 0;
    });
  }
};

// Wrapper del cliente que incluye monitoreo
export const monitoredSupabase = new Proxy(supabaseOptimized, {
  get(target, prop) {
    const value = target[prop as keyof typeof target];
    
    // Interceptar llamadas a 'from' para contar queries
    if (prop === 'from') {
      return (...args: any[]) => {
        usageMonitor.increment('queries');
        return (value as any).apply(target, args);
      };
    }
    
    return value;
  }
});

// Exportar cliente optimizado como default
export default supabaseOptimized;