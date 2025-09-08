// Consultas optimizadas de Supabase para reducir uso de recursos

import { supabase } from '@/lib/supabase/client';
import { clientCache, supabaseCache } from '@/lib/cache/client-cache';

// Tipos para las respuestas optimizadas
interface OptimizedResource {
  id: string;
  name: string;
  category: string;
  status: string;
  location?: string;
}

interface OptimizedLoan {
  id: string;
  resource_id: string;
  user_id: string;
  status: string;
  loan_date: string;
  return_date?: string;
  resource?: {
    name: string;
    category: string;
  };
}

// interface OptimizedNotification {
//   id: string;
//   title: string;
//   message: string;
//   type: string;

//   read: boolean;
//   created_at: string;
// }

// Clase para manejar consultas optimizadas
class OptimizedQueries {
  
  /**
   * Obtiene recursos con caché y campos optimizados
   */
  async getResources(filters: {
    category?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OptimizedResource[]> {
    const cacheKey = supabaseCache.keys.resources(filters);
    
    // Intentar obtener del caché
    const cached = clientCache.get<OptimizedResource[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Construir consulta optimizada
    let query = supabase
      .from('resources')
      .select('id, name, category, status, location') // Solo campos necesarios
      .eq('active', true)
      .limit(filters.limit || 50); // Limitar resultados
    
    // Aplicar filtros
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Guardar en caché
    clientCache.set(cacheKey, data || [], supabaseCache.TTL.RESOURCES);
    
    return data || [];
  }
  
  /**
   * Obtiene préstamos con información mínima necesaria
   */
  async getLoans(userId: string, filters: {
    status?: string;
    limit?: number;
    includeResource?: boolean;
  } = {}): Promise<OptimizedLoan[]> {
    const cacheKey = supabaseCache.keys.loans(userId, filters);
    
    const cached = clientCache.get<OptimizedLoan[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Selección condicional de campos
    const selectFields = filters.includeResource 
      ? 'id, resource_id, user_id, status, loan_date, return_date, resources(name, category)'
      : 'id, resource_id, user_id, status, loan_date, return_date';
    
    let query = supabase
      .from('loans')
      .select(selectFields)
      .eq('user_id', userId)
      .order('loan_date', { ascending: false })
      .limit(filters.limit || 20);
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    clientCache.set(cacheKey, data || [], supabaseCache.TTL.LOANS);
    
    return data || [];
  }
  
  /**
   * Obtiene notificaciones con paginación - DESHABILITADO
   * La tabla notifications no existe en el esquema actual
   */
  // async getNotifications(userId: string, options: {
  //   unreadOnly?: boolean;
  //   limit?: number;
  //   offset?: number;
  // } = {}): Promise<OptimizedNotification[]> {
  //   // Método deshabilitado - tabla notifications no existe
  //   return [];
  // }
  
  /**
   * Operación batch para obtener datos del dashboard
   */
  async getDashboardData(userId: string): Promise<{
    activeLoans: OptimizedLoan[];
    availableResources: OptimizedResource[];
    stats: {
      totalLoans: number;
      availableResources: number;
    };
  }> {
    const cacheKey = `dashboard:${userId}`;
    
    const cached = clientCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Ejecutar consultas en paralelo para reducir tiempo total
    const [activeLoans, resources, statsData] = await Promise.all([
      this.getLoans(userId, { status: 'active', limit: 5, includeResource: true }),
      this.getResources({ status: 'available', limit: 10 }),
      this.getDashboardStats(userId)
    ]);
    
    const dashboardData = {
      activeLoans,
      availableResources: resources,
      stats: statsData
    };
    
    // Caché más corto para datos del dashboard
    clientCache.set(cacheKey, dashboardData, 180000); // 3 minutos
    
    return dashboardData;
  }
  
  /**
   * Obtiene estadísticas con una sola consulta optimizada
   */
  private async getDashboardStats(userId: string): Promise<{
    totalLoans: number;
    availableResources: number;
  }> {
    const cacheKey = `stats:${userId}`;
    
    const cached = clientCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Usar consultas count optimizadas
    const [loansCount, resourcesCount] = await Promise.all([
      supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active'),
      supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')
        .eq('active', true)
    ]);
    
    const stats = {
      totalLoans: loansCount.count || 0,
      availableResources: resourcesCount.count || 0
    };
    
    clientCache.set(cacheKey, stats, 300000); // 5 minutos
    
    return stats;
  }
  
  /**
   * Obtiene configuración del sistema (datos que cambian poco)
   */
  async getSystemSettings(): Promise<any> {
    const cacheKey = supabaseCache.keys.settings();
    
    const cached = clientCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();
    
    if (error) throw error;
    
    // TTL largo para configuración
    clientCache.set(cacheKey, data, supabaseCache.TTL.SETTINGS);
    
    return data;
  }
  
  /**
   * Obtiene categorías (datos estáticos)
   */
  async getCategories(): Promise<any[]> {
    const cacheKey = supabaseCache.keys.categories();
    
    const cached = clientCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description')
      .eq('active', true)
      .order('name');
    
    if (error) throw error;
    
    // TTL muy largo para categorías
    clientCache.set(cacheKey, data || [], supabaseCache.TTL.CATEGORIES);
    
    return data || [];
  }
  
  /**
   * Invalida caché relacionado con un usuario
   */
  invalidateUserCache(userId: string): void {
    const keysToInvalidate = [
      supabaseCache.keys.userProfile(userId),
      supabaseCache.keys.loans(userId),
      supabaseCache.keys.notifications(userId),
      `dashboard:${userId}`,
      `stats:${userId}`
    ];
    
    keysToInvalidate.forEach(key => clientCache.delete(key));
  }
  
  /**
   * Invalida caché de recursos
   */
  invalidateResourcesCache(): void {
    // Limpiar todas las claves que empiecen con 'resources'
    const stats = clientCache.getStats();
    // Implementar limpieza por patrón si es necesario
  }
}

// Instancia singleton
export const optimizedQueries = new OptimizedQueries();

// Hooks personalizados para usar las consultas optimizadas
export function useOptimizedResources(filters: any = {}) {
  const cacheKey = supabaseCache.keys.resources(filters);
  
  return {
    key: cacheKey,
    fetcher: () => optimizedQueries.getResources(filters),
    ttl: supabaseCache.TTL.RESOURCES
  };
}

export function useOptimizedLoans(userId: string, filters: any = {}) {
  const cacheKey = supabaseCache.keys.loans(userId, filters);
  
  return {
    key: cacheKey,
    fetcher: () => optimizedQueries.getLoans(userId, filters),
    ttl: supabaseCache.TTL.LOANS
  };
}

export function useOptimizedDashboard(userId: string) {
  const cacheKey = `dashboard:${userId}`;
  
  return {
    key: cacheKey,
    fetcher: () => optimizedQueries.getDashboardData(userId),
    ttl: 180000 // 3 minutos
  };
}