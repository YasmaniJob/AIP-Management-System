// Middleware de autenticación optimizado para reducir verificaciones innecesarias

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

// Configuración de rutas y caché
interface AuthConfig {
  publicRoutes: string[];
  protectedRoutes: string[];
  adminRoutes: string[];
  sessionCacheTTL: number; // ms
  skipAuthPaths: string[];
}

const authConfig: AuthConfig = {
  publicRoutes: [
    '/',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/auth/callback'
  ],
  protectedRoutes: [
    '/dashboard',
    '/profile',
    '/prestamos',
    '/inventario',
    '/docentes',
    '/reservas',
    '/reuniones',
    '/reportes',
    '/notifications'
  ],
  adminRoutes: [
    '/admin',
    '/api/admin'
  ],
  sessionCacheTTL: 300000, // 5 minutos
  skipAuthPaths: [
    '/_next',
    '/favicon.ico',
    '/api/health',
    '/api/metrics'
  ]
};

// Caché de sesiones en memoria (para reducir llamadas a Supabase)
class SessionCache {
  private cache = new Map<string, { session: any; timestamp: number; userId?: string }>();
  private readonly ttl: number;

  constructor(ttl: number) {
    this.ttl = ttl;
  }

  /**
   * Obtener sesión del caché
   */
  get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Verificar si ha expirado
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.session;
  }

  /**
   * Guardar sesión en caché
   */
  set(key: string, session: any) {
    this.cache.set(key, {
      session,
      timestamp: Date.now(),
      userId: session?.user?.id
    });
    
    // Limpiar caché viejo periódicamente
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  /**
   * Invalidar sesión específica
   */
  invalidate(key: string) {
    this.cache.delete(key);
  }

  /**
   * Invalidar todas las sesiones de un usuario
   */
  invalidateUser(userId: string) {
    for (const [key, value] of this.cache.entries()) {
      if (value.userId === userId) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpiar entradas expiradas
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    return {
      size: this.cache.size,
      ttl: this.ttl,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Instancia del caché de sesiones
const sessionCache = new SessionCache(authConfig.sessionCacheTTL);

/**
 * Generar clave de caché basada en tokens de sesión
 */
function generateCacheKey(request: NextRequest): string {
  const accessToken = request.cookies.get('sb-access-token')?.value;
  const refreshToken = request.cookies.get('sb-refresh-token')?.value;
  
  if (!accessToken && !refreshToken) {
    return 'anonymous';
  }
  
  // Usar hash simple de los tokens para la clave
  const tokenString = `${accessToken || ''}-${refreshToken || ''}`;
  return btoa(tokenString).slice(0, 32);
}

/**
 * Verificar si la ruta requiere autenticación
 */
function requiresAuth(pathname: string): 'public' | 'protected' | 'admin' {
  // Verificar rutas que no requieren auth
  if (authConfig.skipAuthPaths.some(path => pathname.startsWith(path))) {
    return 'public';
  }
  
  // Verificar rutas de admin
  if (authConfig.adminRoutes.some(route => pathname.startsWith(route))) {
    return 'admin';
  }
  
  // Verificar rutas protegidas
  if (authConfig.protectedRoutes.some(route => pathname.startsWith(route))) {
    return 'protected';
  }
  
  // Verificar rutas públicas explícitas
  if (authConfig.publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return 'public';
  }
  
  // Por defecto, considerar protegida
  return 'protected';
}

/**
 * Verificar permisos de admin
 */
function hasAdminPermissions(session: any): boolean {
  return session?.user?.user_metadata?.role === 'admin' || 
         session?.user?.app_metadata?.role === 'admin';
}

/**
 * Middleware principal de autenticación
 */
export async function authMiddleware(request: NextRequest) {
  const startTime = performance.now();
  const pathname = request.nextUrl.pathname;
  
  try {
    // Verificar si la ruta requiere autenticación
    const authRequirement = requiresAuth(pathname);
    
    if (authRequirement === 'public') {
      return NextResponse.next();
    }
    
    // Generar clave de caché
    const cacheKey = generateCacheKey(request);
    
    // Intentar obtener sesión del caché primero
    let session = sessionCache.get(cacheKey);
    let fromCache = true;
    
    if (!session) {
      // Si no está en caché, verificar con Supabase
      fromCache = false;
      const response = NextResponse.next();
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              response.cookies.set({ name, value, ...options });
            },
            remove(name: string, options: any) {
              response.cookies.set({ name, value: '', ...options });
            },
          },
        }
      );
      
      const { data: { session: supabaseSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error verificando sesión:', error);
        return redirectToLogin(request);
      }
      
      session = supabaseSession;
      
      // Guardar en caché si existe
      if (session) {
        sessionCache.set(cacheKey, session);
      }
      
      // Incrementar contador de verificaciones de auth
      performanceMonitor.incrementResourceUsage('authChecks');
    } else {
      // Incrementar contador de cache hits
      performanceMonitor.incrementResourceUsage('cacheHits');
    }
    
    // Verificar si hay sesión válida
    if (!session) {
      if (authRequirement === 'protected' || authRequirement === 'admin') {
        return redirectToLogin(request);
      }
      return NextResponse.next();
    }
    
    // Verificar permisos de admin si es necesario
    if (authRequirement === 'admin' && !hasAdminPermissions(session)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // Agregar headers de información de sesión (opcional)
    const finalResponse = fromCache ? NextResponse.next() : response;
    finalResponse.headers.set('X-User-ID', session.user.id);
    finalResponse.headers.set('X-Auth-From-Cache', fromCache.toString());
    
    // Log de rendimiento
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 100) { // Log si toma más de 100ms
      console.log(`🔐 Auth check for ${pathname}: ${duration.toFixed(2)}ms (cache: ${fromCache})`);
    }
    
    return finalResponse;
    
  } catch (error) {
    console.error('Error en middleware de auth:', error);
    
    // En caso de error, permitir acceso a rutas públicas
    if (authRequirement === 'public') {
      return NextResponse.next();
    }
    
    return redirectToLogin(request);
  }
}

/**
 * Redirigir a login preservando la URL de destino
 */
function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Utilidades para gestión de sesiones
 */
export const AuthUtils = {
  /**
   * Invalidar caché de sesión
   */
  invalidateSession(request: NextRequest) {
    const cacheKey = generateCacheKey(request);
    sessionCache.invalidate(cacheKey);
  },
  
  /**
   * Invalidar todas las sesiones de un usuario
   */
  invalidateUserSessions(userId: string) {
    sessionCache.invalidateUser(userId);
  },
  
  /**
   * Obtener estadísticas del caché
   */
  getCacheStats() {
    return sessionCache.getStats();
  },
  
  /**
   * Configurar TTL del caché
   */
  setCacheTTL(ttl: number) {
    authConfig.sessionCacheTTL = ttl;
  },
  
  /**
   * Agregar ruta pública
   */
  addPublicRoute(route: string) {
    if (!authConfig.publicRoutes.includes(route)) {
      authConfig.publicRoutes.push(route);
    }
  },
  
  /**
   * Agregar ruta protegida
   */
  addProtectedRoute(route: string) {
    if (!authConfig.protectedRoutes.includes(route)) {
      authConfig.protectedRoutes.push(route);
    }
  }
};

// Los hooks y componentes de React han sido movidos a archivos separados:
// - useOptimizedAuth: @/hooks/use-optimized-auth
// - ProtectedRoute: @/components/auth/protected-route

// Configuración para middleware.ts
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default authMiddleware;