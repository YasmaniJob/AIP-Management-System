// Configuración de headers de caché para optimización de recursos

import { NextResponse } from 'next/server';

// Tipos para configuración de caché
interface CacheConfig {
  maxAge: number; // segundos
  staleWhileRevalidate?: number; // segundos
  mustRevalidate?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  public?: boolean;
  private?: boolean;
  immutable?: boolean;
}

// Configuraciones predefinidas para diferentes tipos de contenido
export const CacheConfigs = {
  // Contenido estático (imágenes, CSS, JS)
  static: {
    maxAge: 31536000, // 1 año
    public: true,
    immutable: true
  } as CacheConfig,
  
  // Contenido semi-estático (páginas que cambian poco)
  semiStatic: {
    maxAge: 3600, // 1 hora
    staleWhileRevalidate: 86400, // 1 día
    public: true
  } as CacheConfig,
  
  // API responses (datos que pueden cambiar)
  api: {
    maxAge: 300, // 5 minutos
    staleWhileRevalidate: 600, // 10 minutos
    public: false,
    private: true
  } as CacheConfig,
  
  // Datos dinámicos (perfil de usuario, notificaciones)
  dynamic: {
    maxAge: 60, // 1 minuto
    staleWhileRevalidate: 300, // 5 minutos
    private: true
  } as CacheConfig,
  
  // Contenido que no debe cachearse
  noCache: {
    maxAge: 0,
    noCache: true,
    noStore: true,
    mustRevalidate: true
  } as CacheConfig,
  
  // Funciones serverless (Edge Functions)
  serverless: {
    maxAge: 0,
    staleWhileRevalidate: 60, // 1 minuto
    public: true
  } as CacheConfig,
  
  // CDN optimizado
  cdn: {
    maxAge: 86400, // 1 día
    staleWhileRevalidate: 604800, // 1 semana
    public: true
  } as CacheConfig
};

/**
 * Generar header Cache-Control basado en configuración
 */
export function generateCacheControl(config: CacheConfig): string {
  const directives: string[] = [];
  
  // Visibilidad
  if (config.public) {
    directives.push('public');
  } else if (config.private) {
    directives.push('private');
  }
  
  // Max age
  if (config.maxAge !== undefined) {
    directives.push(`max-age=${config.maxAge}`);
  }
  
  // Stale while revalidate
  if (config.staleWhileRevalidate) {
    directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }
  
  // Otras directivas
  if (config.mustRevalidate) {
    directives.push('must-revalidate');
  }
  
  if (config.noCache) {
    directives.push('no-cache');
  }
  
  if (config.noStore) {
    directives.push('no-store');
  }
  
  if (config.immutable) {
    directives.push('immutable');
  }
  
  return directives.join(', ');
}

/**
 * Aplicar headers de caché a una respuesta
 */
export function applyCacheHeaders(
  response: NextResponse, 
  config: CacheConfig,
  additionalHeaders?: Record<string, string>
): NextResponse {
  // Cache-Control principal
  response.headers.set('Cache-Control', generateCacheControl(config));
  
  // Headers adicionales para optimización
  if (config.public) {
    // Permitir caché en CDN
    response.headers.set('CDN-Cache-Control', generateCacheControl({
      ...config,
      maxAge: Math.min(config.maxAge, 86400) // Máximo 1 día en CDN
    }));
  }
  
  // ETag para validación condicional
  if (!config.noCache && !config.noStore) {
    const etag = generateETag(response);
    if (etag) {
      response.headers.set('ETag', etag);
    }
  }
  
  // Vary header para contenido dinámico
  if (config.private || !config.public) {
    response.headers.set('Vary', 'Authorization, Cookie');
  }
  
  // Headers adicionales
  if (additionalHeaders) {
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  return response;
}

/**
 * Generar ETag simple basado en contenido
 */
function generateETag(response: NextResponse): string | null {
  try {
    // Para respuestas JSON, generar hash del contenido
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const timestamp = Date.now();
      const hash = btoa(timestamp.toString()).slice(0, 8);
      return `"${hash}"`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Middleware para aplicar caché automáticamente basado en la ruta
 */
export function autoCacheMiddleware(request: Request): CacheConfig {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Rutas estáticas
  if (pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    return CacheConfigs.static;
  }
  
  // API routes
  if (pathname.startsWith('/api/')) {
    // APIs de datos dinámicos
    if (pathname.includes('/notifications') || pathname.includes('/profile')) {
      return CacheConfigs.dynamic;
    }
    
    // APIs de datos semi-estáticos
    if (pathname.includes('/resources') || pathname.includes('/categories')) {
      return CacheConfigs.semiStatic;
    }
    
    // APIs que no deben cachearse
    if (pathname.includes('/auth') || pathname.includes('/admin')) {
      return CacheConfigs.noCache;
    }
    
    // API general
    return CacheConfigs.api;
  }
  
  // Páginas dinámicas
  if (pathname.includes('/dashboard') || pathname.includes('/profile')) {
    return CacheConfigs.dynamic;
  }
  
  // Páginas semi-estáticas
  if (pathname === '/' || pathname.includes('/about') || pathname.includes('/help')) {
    return CacheConfigs.semiStatic;
  }
  
  // Por defecto, caché corto
  return CacheConfigs.api;
}

/**
 * Utilidades para optimización de caché en Vercel
 */
export const VercelCacheUtils = {
  /**
   * Headers optimizados para Edge Functions
   */
  edgeFunction: {
    'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    'CDN-Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    'Vercel-CDN-Cache-Control': 'public, max-age=3600'
  },
  
  /**
   * Headers para funciones serverless
   */
  serverlessFunction: {
    'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
    'CDN-Cache-Control': 'public, max-age=300'
  },
  
  /**
   * Headers para contenido estático
   */
  staticContent: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'public, max-age=31536000, immutable'
  },
  
  /**
   * Headers para ISR (Incremental Static Regeneration)
   */
  isr: (revalidate: number) => ({
    'Cache-Control': `public, max-age=0, s-maxage=${revalidate}, stale-while-revalidate=${revalidate * 2}`,
    'CDN-Cache-Control': `public, max-age=${revalidate}`
  })
};

/**
 * Clase para gestión avanzada de caché
 */
export class CacheManager {
  private static instance: CacheManager;
  private cacheStats = new Map<string, { hits: number; misses: number; lastAccess: number }>();
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
  
  /**
   * Registrar hit de caché
   */
  recordHit(key: string) {
    const stats = this.cacheStats.get(key) || { hits: 0, misses: 0, lastAccess: 0 };
    stats.hits++;
    stats.lastAccess = Date.now();
    this.cacheStats.set(key, stats);
  }
  
  /**
   * Registrar miss de caché
   */
  recordMiss(key: string) {
    const stats = this.cacheStats.get(key) || { hits: 0, misses: 0, lastAccess: 0 };
    stats.misses++;
    stats.lastAccess = Date.now();
    this.cacheStats.set(key, stats);
  }
  
  /**
   * Obtener estadísticas de caché
   */
  getStats() {
    const totalHits = Array.from(this.cacheStats.values()).reduce((sum, stats) => sum + stats.hits, 0);
    const totalMisses = Array.from(this.cacheStats.values()).reduce((sum, stats) => sum + stats.misses, 0);
    const hitRate = totalHits / (totalHits + totalMisses) || 0;
    
    return {
      totalHits,
      totalMisses,
      hitRate: Math.round(hitRate * 100) / 100,
      entries: this.cacheStats.size,
      topEntries: Array.from(this.cacheStats.entries())
        .sort(([, a], [, b]) => (b.hits + b.misses) - (a.hits + a.misses))
        .slice(0, 10)
    };
  }
  
  /**
   * Limpiar estadísticas antiguas
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    for (const [key, stats] of this.cacheStats.entries()) {
      if (now - stats.lastAccess > maxAge) {
        this.cacheStats.delete(key);
      }
    }
  }
}

/**
 * Hook React para gestión de caché del lado del cliente
 */
import { useEffect, useState } from 'react';

export function useCacheOptimization() {
  const [cacheStats, setCacheStats] = useState(CacheManager.getInstance().getStats());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(CacheManager.getInstance().getStats());
    }, 30000); // Actualizar cada 30 segundos
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    stats: cacheStats,
    recordHit: (key: string) => CacheManager.getInstance().recordHit(key),
    recordMiss: (key: string) => CacheManager.getInstance().recordMiss(key)
  };
}

/**
 * Utilidades para Next.js App Router
 */
export const NextCacheUtils = {
  /**
   * Configuración para páginas estáticas
   */
  staticPage: {
    revalidate: 3600, // 1 hora
    tags: ['static']
  },
  
  /**
   * Configuración para páginas dinámicas
   */
  dynamicPage: {
    revalidate: 300, // 5 minutos
    tags: ['dynamic']
  },
  
  /**
   * Configuración para datos de API
   */
  apiData: {
    revalidate: 60, // 1 minuto
    tags: ['api']
  },
  
  /**
   * Invalidar caché por tags
   */
  revalidateTag: (tag: string) => {
    // En producción, esto usaría la API de revalidación de Next.js
    console.log(`🔄 Invalidando caché para tag: ${tag}`);
  }
};

// Ejemplos de uso
export const CacheExamples = {
  /**
   * Ejemplo: API route con caché optimizado
   */
  async apiRoute(request: Request) {
    const response = NextResponse.json({ data: 'example' });
    
    return applyCacheHeaders(response, CacheConfigs.api, {
      'X-Cache-Strategy': 'api-optimized'
    });
  },
  
  /**
   * Ejemplo: Página estática con ISR
   */
  async staticPage() {
    const response = NextResponse.next();
    
    return applyCacheHeaders(response, CacheConfigs.semiStatic, {
      'X-Cache-Strategy': 'isr',
      'X-Revalidate': '3600'
    });
  },
  
  /**
   * Ejemplo: Contenido dinámico con caché corto
   */
  async dynamicContent(userId: string) {
    const response = NextResponse.json({ userId, data: 'dynamic' });
    
    return applyCacheHeaders(response, CacheConfigs.dynamic, {
      'X-Cache-Strategy': 'dynamic',
      'X-User-Specific': 'true'
    });
  }
};

export default {
  CacheConfigs,
  generateCacheControl,
  applyCacheHeaders,
  autoCacheMiddleware,
  VercelCacheUtils,
  CacheManager,
  NextCacheUtils
};