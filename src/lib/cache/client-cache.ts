// Sistema de caché del lado del cliente para optimizar llamadas a Supabase

interface CacheItem<T> {
  value: T;
  expires: number;
  timestamp: number;
}

class ClientCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100; // Límite de entradas para evitar uso excesivo de memoria

  /**
   * Obtiene un valor del caché si existe y no ha expirado
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * Almacena un valor en el caché con TTL (tiempo de vida)
   */
  set<T>(key: string, value: T, ttlMs: number = 300000): void { // 5 minutos por defecto
    // Limpiar caché si está lleno
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      value,
      expires: Date.now() + ttlMs,
      timestamp: Date.now()
    });
  }

  /**
   * Verifica si una clave existe y es válida
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Elimina una entrada específica del caché
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpia entradas expiradas y las más antiguas si es necesario
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Eliminar entradas expiradas
    entries.forEach(([key, item]) => {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    });
    
    // Si aún está lleno, eliminar las más antiguas
    if (this.cache.size >= this.maxSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toDelete = sortedEntries.slice(0, Math.floor(this.maxSize * 0.3));
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    const expired = entries.filter(item => now > item.expires).length;
    
    return {
      total: this.cache.size,
      expired,
      valid: this.cache.size - expired,
      maxSize: this.maxSize
    };
  }

  /**
   * Genera una clave de caché basada en parámetros
   */
  generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    
    return `${prefix}${sortedParams ? `|${sortedParams}` : ''}`;
  }
}

// Instancia singleton del caché
export const clientCache = new ClientCache();

// Hook personalizado para usar el caché con React
import { useCallback, useEffect, useState } from 'react';

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 300000,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Intentar obtener del caché primero
      const cached = clientCache.get<T>(key);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
      
      // Si no está en caché, hacer la petición
      const result = await fetcher();
      clientCache.set(key, result, ttlMs);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttlMs]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => {
    clientCache.delete(key);
    fetchData();
  }, [key, fetchData]);

  return { data, loading, error, refetch };
}

// Utilidades para caché específico de Supabase
export const supabaseCache = {
  // TTL específicos para diferentes tipos de datos
  TTL: {
    USER_PROFILE: 600000, // 10 minutos
    RESOURCES: 300000,    // 5 minutos
    LOANS: 180000,        // 3 minutos
    NOTIFICATIONS: 60000, // 1 minuto
    SETTINGS: 1800000,    // 30 minutos
    CATEGORIES: 3600000,  // 1 hora
  },
  
  // Generar claves específicas para consultas de Supabase
  keys: {
    userProfile: (userId: string) => `user_profile:${userId}`,
    resources: (filters?: any) => clientCache.generateKey('resources', filters),
    loans: (userId: string, filters?: any) => clientCache.generateKey(`loans:${userId}`, filters),
    notifications: (userId: string) => `notifications:${userId}`,
    categories: () => 'categories',
    settings: () => 'system_settings'
  }
};