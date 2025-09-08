// Sistema de monitoreo de rendimiento para optimización de recursos

import { supabaseOptimized } from '@/lib/supabase/client-optimized';

// Tipos para métricas
interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  timestamp: number;
}

interface ResourceUsage {
  supabaseQueries: number;
  realtimeConnections: number;
  storageOperations: number;
  authChecks: number;
  cacheHits: number;
  cacheMisses: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
  resolved: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private resourceUsage: ResourceUsage = {
    supabaseQueries: 0,
    realtimeConnections: 0,
    storageOperations: 0,
    authChecks: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  private alerts: Alert[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  // Límites para planes gratuitos
  private readonly limits = {
    supabase: {
      monthlyQueries: 50000,
      realtimeConnections: 2,
      storageSize: 500 * 1024 * 1024, // 500MB
      authUsers: 50000
    },
    vercel: {
      functionExecutions: 100000,
      functionDuration: 10, // segundos
      bandwidth: 100 * 1024 * 1024 * 1024, // 100GB
      edgeRequests: 1000000
    },
    performance: {
      maxPageLoadTime: 3000, // 3 segundos
      maxApiResponseTime: 1000, // 1 segundo
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxBundleSize: 1024 * 1024 // 1MB
    }
  };

  /**
   * Inicializar monitoreo
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Iniciando monitoreo de rendimiento...');

    // Monitorear Web Vitals
    this.setupWebVitalsMonitoring();
    
    // Monitorear uso de memoria
    this.setupMemoryMonitoring();
    
    // Monitorear APIs
    this.setupApiMonitoring();
    
    // Verificar límites periódicamente
    this.startLimitChecking();
  }

  /**
   * Detener monitoreo
   */
  stopMonitoring() {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    console.log('⏹️ Monitoreo detenido');
  }

  /**
   * Configurar monitoreo de Web Vitals
   */
  private setupWebVitalsMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitorear Navigation Timing
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          const pageLoadTime = navEntry.loadEventEnd - navEntry.navigationStart;
          
          this.recordMetric({
            pageLoadTime,
            apiResponseTime: 0,
            renderTime: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
            memoryUsage: this.getMemoryUsage(),
            bundleSize: 0,
            timestamp: Date.now()
          });

          // Alertar si el tiempo de carga es muy alto
          if (pageLoadTime > this.limits.performance.maxPageLoadTime) {
            this.createAlert('warning', `Tiempo de carga alto: ${pageLoadTime}ms`);
          }
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  /**
   * Configurar monitoreo de memoria
   */
  private setupMemoryMonitoring() {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    setInterval(() => {
      const memoryUsage = this.getMemoryUsage();
      
      if (memoryUsage > this.limits.performance.maxMemoryUsage) {
        this.createAlert('warning', `Uso de memoria alto: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      }
    }, 30000); // Cada 30 segundos
  }

  /**
   * Configurar monitoreo de APIs
   */
  private setupApiMonitoring() {
    // Interceptar fetch para monitorear llamadas a API
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Verificar si es una llamada a Supabase
        const url = args[0] as string;
        if (url.includes('supabase')) {
          this.incrementResourceUsage('supabaseQueries');
          
          if (responseTime > this.limits.performance.maxApiResponseTime) {
            this.createAlert('warning', `API response lenta: ${responseTime.toFixed(2)}ms`);
          }
        }
        
        return response;
      } catch (error) {
        this.createAlert('error', `Error en API: ${error}`);
        throw error;
      }
    };
  }

  /**
   * Verificar límites periódicamente
   */
  private startLimitChecking() {
    setInterval(() => {
      this.checkLimits();
    }, 60000); // Cada minuto
  }

  /**
   * Verificar límites de recursos
   */
  private checkLimits() {
    const usage = this.resourceUsage;
    
    // Verificar límites de Supabase
    if (usage.supabaseQueries > this.limits.supabase.monthlyQueries * 0.8) {
      this.createAlert('warning', `Acercándose al límite de consultas Supabase: ${usage.supabaseQueries}/${this.limits.supabase.monthlyQueries}`);
    }
    
    if (usage.realtimeConnections >= this.limits.supabase.realtimeConnections) {
      this.createAlert('error', `Límite de conexiones realtime alcanzado: ${usage.realtimeConnections}`);
    }
    
    // Verificar eficiencia de caché
    const totalCacheOperations = usage.cacheHits + usage.cacheMisses;
    if (totalCacheOperations > 0) {
      const hitRate = usage.cacheHits / totalCacheOperations;
      if (hitRate < 0.7) {
        this.createAlert('info', `Tasa de acierto de caché baja: ${(hitRate * 100).toFixed(1)}%`);
      }
    }
  }

  /**
   * Registrar métrica de rendimiento
   */
  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Mantener solo las últimas 100 métricas
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Incrementar uso de recursos
   */
  incrementResourceUsage(type: keyof ResourceUsage) {
    this.resourceUsage[type]++;
  }

  /**
   * Crear alerta
   */
  private createAlert(type: Alert['type'], message: string) {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      resolved: false
    };
    
    this.alerts.push(alert);
    
    // Mantener solo las últimas 50 alertas
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
    
    // Log según el tipo
    const emoji = type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} ${message}`);
  }

  /**
   * Obtener uso de memoria actual
   */
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Obtener estadísticas completas
   */
  getStats() {
    const recentMetrics = this.metrics.slice(-10);
    const avgPageLoadTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.pageLoadTime, 0) / recentMetrics.length 
      : 0;
    
    return {
      performance: {
        avgPageLoadTime: Math.round(avgPageLoadTime),
        currentMemoryUsage: this.getMemoryUsage(),
        metricsCount: this.metrics.length
      },
      resources: { ...this.resourceUsage },
      alerts: {
        total: this.alerts.length,
        unresolved: this.alerts.filter(a => !a.resolved).length,
        recent: this.alerts.slice(-5)
      },
      limits: this.limits,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtener alertas no resueltas
   */
  getUnresolvedAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolver alerta
   */
  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Generar reporte de optimización
   */
  generateOptimizationReport() {
    const stats = this.getStats();
    const recommendations: string[] = [];
    
    // Recomendaciones basadas en métricas
    if (stats.performance.avgPageLoadTime > this.limits.performance.maxPageLoadTime) {
      recommendations.push('Optimizar tiempo de carga: implementar lazy loading, comprimir imágenes');
    }
    
    if (stats.resources.cacheMisses > stats.resources.cacheHits) {
      recommendations.push('Mejorar estrategia de caché: aumentar TTL, implementar caché predictivo');
    }
    
    if (stats.resources.supabaseQueries > this.limits.supabase.monthlyQueries * 0.5) {
      recommendations.push('Optimizar consultas: implementar paginación, reducir frecuencia de polling');
    }
    
    return {
      summary: {
        status: stats.alerts.unresolved > 0 ? 'needs-attention' : 'good',
        score: this.calculatePerformanceScore(stats)
      },
      stats,
      recommendations,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calcular puntuación de rendimiento (0-100)
   */
  private calculatePerformanceScore(stats: any): number {
    let score = 100;
    
    // Penalizar por tiempo de carga alto
    if (stats.performance.avgPageLoadTime > this.limits.performance.maxPageLoadTime) {
      score -= 20;
    }
    
    // Penalizar por alertas no resueltas
    score -= stats.alerts.unresolved * 5;
    
    // Penalizar por uso alto de recursos
    const queryUsagePercent = stats.resources.supabaseQueries / this.limits.supabase.monthlyQueries;
    if (queryUsagePercent > 0.8) {
      score -= 15;
    }
    
    // Bonificar por buena tasa de caché
    const totalCacheOps = stats.resources.cacheHits + stats.resources.cacheMisses;
    if (totalCacheOps > 0) {
      const hitRate = stats.resources.cacheHits / totalCacheOps;
      if (hitRate > 0.8) {
        score += 5;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Resetear estadísticas (llamar mensualmente)
   */
  resetStats() {
    this.resourceUsage = {
      supabaseQueries: 0,
      realtimeConnections: 0,
      storageOperations: 0,
      authChecks: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    this.metrics = [];
    this.alerts = this.alerts.filter(a => !a.resolved); // Mantener alertas no resueltas
    
    console.log('📊 Estadísticas de monitoreo reseteadas');
  }
}

// Instancia global del monitor
export const performanceMonitor = new PerformanceMonitor();

// El hook de React ha sido movido a: @/hooks/use-performance-monitor

// Utilidad para medir rendimiento de funciones
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve) => {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      
      resolve({ result, duration });
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`❌ ${name} falló después de ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  });
}

// Decorator para medir métodos de clase
export function measure(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const className = target.constructor.name;
    const methodName = `${className}.${propertyName}`;
    
    return measurePerformance(methodName, () => method.apply(this, args));
  };
  
  return descriptor;
}

export default performanceMonitor;