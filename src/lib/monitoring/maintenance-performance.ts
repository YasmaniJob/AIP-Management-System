// src/lib/monitoring/maintenance-performance.ts
'use client';

// =====================================================
// TIPOS PARA MONITOREO
// =====================================================

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface QueryPerformance {
  query: string;
  executionTime: number;
  rowsAffected: number;
  cacheHit: boolean;
  timestamp: Date;
}

export interface MaintenancePerformanceStats {
  // Métricas de base de datos
  avgQueryTime: number;
  slowQueries: QueryPerformance[];
  cacheHitRate: number;
  
  // Métricas de UI
  componentRenderTime: number;
  dataLoadTime: number;
  userInteractionLatency: number;
  
  // Métricas de negocio
  maintenanceProcessingTime: number;
  completionRate: number;
  errorRate: number;
  
  // Recursos del sistema
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

// =====================================================
// CLASE PRINCIPAL DE MONITOREO
// =====================================================

class MaintenancePerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private queryLog: QueryPerformance[] = [];
  private alerts: PerformanceAlert[] = [];
  private observers: ((stats: MaintenancePerformanceStats) => void)[] = [];
  
  // Configuración de umbrales
  private thresholds = {
    queryTime: { warning: 1000, critical: 3000 }, // ms
    cacheHitRate: { warning: 0.8, critical: 0.6 }, // porcentaje
    renderTime: { warning: 100, critical: 300 }, // ms
    loadTime: { warning: 2000, critical: 5000 }, // ms
    errorRate: { warning: 0.05, critical: 0.1 }, // porcentaje
    memoryUsage: { warning: 0.8, critical: 0.9 }, // porcentaje
    cpuUsage: { warning: 0.7, critical: 0.9 } // porcentaje
  };
  
  // =====================================================
  // MÉTODOS DE REGISTRO DE MÉTRICAS
  // =====================================================
  
  recordQueryPerformance(query: string, executionTime: number, rowsAffected: number, cacheHit: boolean) {
    const performance: QueryPerformance = {
      query: query.substring(0, 100), // Truncar para evitar logs muy largos
      executionTime,
      rowsAffected,
      cacheHit,
      timestamp: new Date()
    };
    
    this.queryLog.push(performance);
    
    // Mantener solo los últimos 1000 registros
    if (this.queryLog.length > 1000) {
      this.queryLog = this.queryLog.slice(-1000);
    }
    
    // Verificar umbrales
    this.checkQueryThreshold(performance);
    
    // Actualizar métricas
    this.updateMetric('avgQueryTime', executionTime, 'ms');
    this.updateMetric('cacheHitRate', cacheHit ? 1 : 0, 'ratio');
  }
  
  recordComponentRender(componentName: string, renderTime: number) {
    this.updateMetric(`render_${componentName}`, renderTime, 'ms');
    this.updateMetric('componentRenderTime', renderTime, 'ms');
    
    if (renderTime > this.thresholds.renderTime.warning) {
      this.createAlert(
        'warning',
        'componentRenderTime',
        renderTime,
        this.thresholds.renderTime.warning,
        `Componente ${componentName} tardó ${renderTime}ms en renderizar`
      );
    }
  }
  
  recordDataLoad(operation: string, loadTime: number, success: boolean) {
    this.updateMetric(`load_${operation}`, loadTime, 'ms');
    this.updateMetric('dataLoadTime', loadTime, 'ms');
    this.updateMetric('errorRate', success ? 0 : 1, 'ratio');
    
    if (loadTime > this.thresholds.loadTime.warning) {
      this.createAlert(
        loadTime > this.thresholds.loadTime.critical ? 'critical' : 'warning',
        'dataLoadTime',
        loadTime,
        this.thresholds.loadTime.warning,
        `Operación ${operation} tardó ${loadTime}ms en cargar`
      );
    }
  }
  
  recordUserInteraction(action: string, latency: number) {
    this.updateMetric(`interaction_${action}`, latency, 'ms');
    this.updateMetric('userInteractionLatency', latency, 'ms');
  }
  
  recordSystemResource(type: 'memory' | 'cpu', usage: number) {
    this.updateMetric(`${type}Usage`, usage, 'percentage');
    
    const threshold = this.thresholds[`${type}Usage`];
    if (usage > threshold.warning) {
      this.createAlert(
        usage > threshold.critical ? 'critical' : 'warning',
        `${type}Usage`,
        usage,
        threshold.warning,
        `Uso de ${type} alto: ${(usage * 100).toFixed(1)}%`
      );
    }
  }
  
  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================
  
  private updateMetric(name: string, value: number, unit: string) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricHistory = this.metrics.get(name)!;
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      threshold: this.thresholds[name as keyof typeof this.thresholds]
    };
    
    metricHistory.push(metric);
    
    // Mantener solo las últimas 100 mediciones por métrica
    if (metricHistory.length > 100) {
      metricHistory.splice(0, metricHistory.length - 100);
    }
  }
  
  private checkQueryThreshold(performance: QueryPerformance) {
    if (performance.executionTime > this.thresholds.queryTime.critical) {
      this.createAlert(
        'critical',
        'queryTime',
        performance.executionTime,
        this.thresholds.queryTime.critical,
        `Consulta muy lenta: ${performance.executionTime}ms - ${performance.query}`
      );
    } else if (performance.executionTime > this.thresholds.queryTime.warning) {
      this.createAlert(
        'warning',
        'queryTime',
        performance.executionTime,
        this.thresholds.queryTime.warning,
        `Consulta lenta: ${performance.executionTime}ms - ${performance.query}`
      );
    }
  }
  
  private createAlert(
    type: 'warning' | 'critical',
    metric: string,
    value: number,
    threshold: number,
    message: string
  ) {
    const alert: PerformanceAlert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      metric,
      value,
      threshold,
      message,
      timestamp: new Date(),
      resolved: false
    };
    
    this.alerts.push(alert);
    
    // Mantener solo las últimas 50 alertas
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
    
    // Log en consola para desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Performance Alert] ${type.toUpperCase()}: ${message}`);
    }
  }
  
  // =====================================================
  // MÉTODOS DE CONSULTA
  // =====================================================
  
  getStats(): MaintenancePerformanceStats {
    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;
    
    // Filtrar métricas recientes
    const recentQueries = this.queryLog.filter(q => q.timestamp.getTime() > last5Minutes);
    const slowQueries = recentQueries
      .filter(q => q.executionTime > this.thresholds.queryTime.warning)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);
    
    return {
      // Métricas de base de datos
      avgQueryTime: this.getAverageMetric('avgQueryTime', 5),
      slowQueries,
      cacheHitRate: this.getAverageMetric('cacheHitRate', 5),
      
      // Métricas de UI
      componentRenderTime: this.getAverageMetric('componentRenderTime', 5),
      dataLoadTime: this.getAverageMetric('dataLoadTime', 5),
      userInteractionLatency: this.getAverageMetric('userInteractionLatency', 5),
      
      // Métricas de negocio
      maintenanceProcessingTime: this.getAverageMetric('maintenanceProcessingTime', 5),
      completionRate: this.getAverageMetric('completionRate', 60), // Última hora
      errorRate: this.getAverageMetric('errorRate', 5),
      
      // Recursos del sistema
      memoryUsage: this.getLatestMetric('memoryUsage'),
      cpuUsage: this.getLatestMetric('cpuUsage'),
      networkLatency: this.getAverageMetric('networkLatency', 5)
    };
  }
  
  private getAverageMetric(name: string, minutesBack: number): number {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return 0;
    
    const cutoff = Date.now() - minutesBack * 60 * 1000;
    const recentMetrics = metrics.filter(m => m.timestamp.getTime() > cutoff);
    
    if (recentMetrics.length === 0) return 0;
    
    const sum = recentMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / recentMetrics.length;
  }
  
  private getLatestMetric(name: string): number {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return 0;
    
    return metrics[metrics.length - 1].value;
  }
  
  getAlerts(includeResolved = false): PerformanceAlert[] {
    return this.alerts.filter(alert => includeResolved || !alert.resolved);
  }
  
  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }
  
  // =====================================================
  // OBSERVADORES
  // =====================================================
  
  subscribe(callback: (stats: MaintenancePerformanceStats) => void) {
    this.observers.push(callback);
    
    // Retornar función de desuscripción
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }
  
  private notifyObservers() {
    const stats = this.getStats();
    this.observers.forEach(callback => {
      try {
        callback(stats);
      } catch (error) {
        console.error('Error in performance observer:', error);
      }
    });
  }
  
  // =====================================================
  // MÉTODOS DE CONTROL
  // =====================================================
  
  startMonitoring(intervalMs = 30000) {
    // Notificar observadores cada 30 segundos por defecto
    setInterval(() => {
      this.notifyObservers();
    }, intervalMs);
    
    // Monitorear recursos del sistema si está disponible
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.startSystemMonitoring();
    }
  }
  
  private startSystemMonitoring() {
    // Monitorear memoria si está disponible
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
          this.recordSystemResource('memory', usage);
        }
      }, 10000); // Cada 10 segundos
    }
    
    // Monitorear latencia de red
    setInterval(() => {
      const start = performance.now();
      fetch('/api/health', { method: 'HEAD' })
        .then(() => {
          const latency = performance.now() - start;
          this.updateMetric('networkLatency', latency, 'ms');
        })
        .catch(() => {
          // Ignorar errores de conectividad
        });
    }, 60000); // Cada minuto
  }
  
  reset() {
    this.metrics.clear();
    this.queryLog = [];
    this.alerts = [];
  }
  
  // =====================================================
  // EXPORTAR DATOS
  // =====================================================
  
  exportData() {
    return {
      metrics: Object.fromEntries(this.metrics),
      queryLog: this.queryLog,
      alerts: this.alerts,
      stats: this.getStats(),
      timestamp: new Date().toISOString()
    };
  }
}

// =====================================================
// INSTANCIA SINGLETON
// =====================================================

export const performanceMonitor = new MaintenancePerformanceMonitor();

// =====================================================
// DECORADORES Y UTILIDADES
// =====================================================

// Decorador para medir tiempo de ejecución de funciones
export function measurePerformance(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - start;
        performanceMonitor.recordDataLoad(name, duration, true);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        performanceMonitor.recordDataLoad(name, duration, false);
        throw error;
      }
    };
    
    return descriptor;
  };
}

// Hook para medir tiempo de renderizado de componentes
export function useMeasureRender(componentName: string) {
  React.useEffect(() => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      performanceMonitor.recordComponentRender(componentName, duration);
    };
  }, [componentName]);
}

// Función para medir operaciones manuales
export async function measureOperation<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - start;
    performanceMonitor.recordDataLoad(name, duration, true);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordDataLoad(name, duration, false);
    throw error;
  }
}

// Inicializar monitoreo automáticamente
if (typeof window !== 'undefined') {
  performanceMonitor.startMonitoring();
}

export default performanceMonitor;