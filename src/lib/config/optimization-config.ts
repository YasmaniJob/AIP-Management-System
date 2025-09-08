// Configuración global de optimizaciones para la aplicación

export interface OptimizationConfig {
  cache: {
    enabled: boolean;
    defaultTTL: number; // en milisegundos
    maxSize: number; // número máximo de entradas
    cleanupInterval: number; // intervalo de limpieza en ms
    strategies: {
      supabase: {
        ttl: number;
        maxEntries: number;
      };
      auth: {
        ttl: number;
        maxEntries: number;
      };
      static: {
        ttl: number;
        maxEntries: number;
      };
    };
  };
  
  batch: {
    enabled: boolean;
    maxBatchSize: number;
    flushInterval: number; // en milisegundos
    maxWaitTime: number; // tiempo máximo de espera antes de flush forzado
    retryAttempts: number;
    retryDelay: number;
  };
  
  monitoring: {
    enabled: boolean;
    metricsInterval: number; // intervalo de recolección de métricas
    alertThresholds: {
      memoryUsage: number; // en bytes
      pageLoadTime: number; // en milisegundos
      cacheHitRate: number; // porcentaje mínimo
      supabaseQueries: number; // límite mensual
      errorRate: number; // porcentaje máximo de errores
    };
    retentionPeriod: number; // tiempo de retención de métricas en ms
  };
  
  supabase: {
    optimization: {
      enabled: boolean;
      connectionPooling: boolean;
      queryOptimization: boolean;
      realtimeOptimization: boolean;
    };
    limits: {
      monthlyQueries: number;
      realtimeConnections: number;
      storageSize: number; // en bytes
      authUsers: number;
    };
    throttling: {
      queriesPerSecond: number;
      authChecksPerMinute: number;
      realtimeEventsPerSecond: number;
    };
  };
  
  auth: {
    optimization: {
      enabled: boolean;
      sessionCaching: boolean;
      routeProtection: boolean;
      throttling: boolean;
    };
    cache: {
      sessionTTL: number;
      userDataTTL: number;
      permissionsTTL: number;
    };
    security: {
      maxLoginAttempts: number;
      lockoutDuration: number;
      sessionTimeout: number;
    };
  };
  
  performance: {
    webVitals: {
      enabled: boolean;
      thresholds: {
        LCP: number; // Largest Contentful Paint
        FID: number; // First Input Delay
        CLS: number; // Cumulative Layout Shift
        FCP: number; // First Contentful Paint
        TTFB: number; // Time to First Byte
      };
    };
    resourceHints: {
      preload: string[]; // recursos para precargar
      prefetch: string[]; // recursos para prefetch
      preconnect: string[]; // dominios para preconectar
    };
    bundleOptimization: {
      codesplitting: boolean;
      treeShaking: boolean;
      compression: boolean;
      minification: boolean;
    };
  };
  
  development: {
    debugging: boolean;
    verbose: boolean;
    mockData: boolean;
    bypassCache: boolean;
    disableOptimizations: boolean;
  };
}

// Configuración por defecto para producción
export const PRODUCTION_CONFIG: OptimizationConfig = {
  cache: {
    enabled: true,
    defaultTTL: 300000, // 5 minutos
    maxSize: 100,
    cleanupInterval: 600000, // 10 minutos
    strategies: {
      supabase: {
        ttl: 300000, // 5 minutos
        maxEntries: 50
      },
      auth: {
        ttl: 900000, // 15 minutos
        maxEntries: 20
      },
      static: {
        ttl: 3600000, // 1 hora
        maxEntries: 30
      }
    }
  },
  
  batch: {
    enabled: true,
    maxBatchSize: 10,
    flushInterval: 1000, // 1 segundo
    maxWaitTime: 5000, // 5 segundos
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  monitoring: {
    enabled: true,
    metricsInterval: 30000, // 30 segundos
    alertThresholds: {
      memoryUsage: 50 * 1024 * 1024, // 50MB
      pageLoadTime: 3000, // 3 segundos
      cacheHitRate: 70, // 70%
      supabaseQueries: 40000, // 80% del límite gratuito
      errorRate: 5 // 5%
    },
    retentionPeriod: 86400000 // 24 horas
  },
  
  supabase: {
    optimization: {
      enabled: true,
      connectionPooling: true,
      queryOptimization: true,
      realtimeOptimization: true
    },
    limits: {
      monthlyQueries: 50000,
      realtimeConnections: 2,
      storageSize: 500 * 1024 * 1024, // 500MB
      authUsers: 50000
    },
    throttling: {
      queriesPerSecond: 10,
      authChecksPerMinute: 60,
      realtimeEventsPerSecond: 5
    }
  },
  
  auth: {
    optimization: {
      enabled: true,
      sessionCaching: true,
      routeProtection: true,
      throttling: true
    },
    cache: {
      sessionTTL: 3600000, // 1 hora
      userDataTTL: 1800000, // 30 minutos
      permissionsTTL: 900000 // 15 minutos
    },
    security: {
      maxLoginAttempts: 5,
      lockoutDuration: 900000, // 15 minutos
      sessionTimeout: 3600000 // 1 hora
    }
  },
  
  performance: {
    webVitals: {
      enabled: true,
      thresholds: {
        LCP: 2500, // 2.5 segundos
        FID: 100, // 100ms
        CLS: 0.1, // 0.1
        FCP: 1800, // 1.8 segundos
        TTFB: 600 // 600ms
      }
    },
    resourceHints: {
      preload: [
        '/fonts/inter.woff2',
        '/api/auth/session'
      ],
      prefetch: [
        '/api/resources',
        '/api/dashboard'
      ],
      preconnect: [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com'
      ]
    },
    bundleOptimization: {
      codesplitting: true,
      treeShaking: true,
      compression: true,
      minification: true
    }
  },
  
  development: {
    debugging: false,
    verbose: false,
    mockData: false,
    bypassCache: false,
    disableOptimizations: false
  }
};

// Configuración para desarrollo
export const DEVELOPMENT_CONFIG: OptimizationConfig = {
  ...PRODUCTION_CONFIG,
  
  cache: {
    ...PRODUCTION_CONFIG.cache,
    defaultTTL: 60000, // 1 minuto (más corto para desarrollo)
    cleanupInterval: 120000 // 2 minutos
  },
  
  monitoring: {
    ...PRODUCTION_CONFIG.monitoring,
    metricsInterval: 10000, // 10 segundos (más frecuente)
    alertThresholds: {
      ...PRODUCTION_CONFIG.monitoring.alertThresholds,
      memoryUsage: 100 * 1024 * 1024, // 100MB (más permisivo)
      pageLoadTime: 5000 // 5 segundos (más permisivo)
    }
  },
  
  development: {
    debugging: true,
    verbose: true,
    mockData: false,
    bypassCache: false,
    disableOptimizations: false
  }
};

// Configuración para testing
export const TEST_CONFIG: OptimizationConfig = {
  ...DEVELOPMENT_CONFIG,
  
  cache: {
    ...DEVELOPMENT_CONFIG.cache,
    enabled: false // Deshabilitado para tests predecibles
  },
  
  batch: {
    ...DEVELOPMENT_CONFIG.batch,
    enabled: false // Deshabilitado para tests síncronos
  },
  
  monitoring: {
    ...DEVELOPMENT_CONFIG.monitoring,
    enabled: false // Deshabilitado para tests más rápidos
  },
  
  development: {
    debugging: false,
    verbose: false,
    mockData: true,
    bypassCache: true,
    disableOptimizations: true
  }
};

// Función para obtener la configuración según el entorno
export function getOptimizationConfig(): OptimizationConfig {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'production':
      return PRODUCTION_CONFIG;
    case 'test':
      return TEST_CONFIG;
    case 'development':
    default:
      return DEVELOPMENT_CONFIG;
  }
}

// Función para validar la configuración
export function validateConfig(config: OptimizationConfig): string[] {
  const errors: string[] = [];
  
  // Validar cache
  if (config.cache.defaultTTL <= 0) {
    errors.push('cache.defaultTTL debe ser mayor que 0');
  }
  
  if (config.cache.maxSize <= 0) {
    errors.push('cache.maxSize debe ser mayor que 0');
  }
  
  // Validar batch
  if (config.batch.maxBatchSize <= 0) {
    errors.push('batch.maxBatchSize debe ser mayor que 0');
  }
  
  if (config.batch.flushInterval <= 0) {
    errors.push('batch.flushInterval debe ser mayor que 0');
  }
  
  // Validar monitoring
  if (config.monitoring.alertThresholds.cacheHitRate < 0 || config.monitoring.alertThresholds.cacheHitRate > 100) {
    errors.push('monitoring.alertThresholds.cacheHitRate debe estar entre 0 y 100');
  }
  
  // Validar Supabase limits
  if (config.supabase.limits.monthlyQueries <= 0) {
    errors.push('supabase.limits.monthlyQueries debe ser mayor que 0');
  }
  
  if (config.supabase.limits.realtimeConnections <= 0) {
    errors.push('supabase.limits.realtimeConnections debe ser mayor que 0');
  }
  
  // Validar performance thresholds
  if (config.performance.webVitals.thresholds.LCP <= 0) {
    errors.push('performance.webVitals.thresholds.LCP debe ser mayor que 0');
  }
  
  return errors;
}

// Función para fusionar configuraciones personalizadas
export function mergeConfig(
  baseConfig: OptimizationConfig, 
  customConfig: Partial<OptimizationConfig>
): OptimizationConfig {
  return {
    cache: { ...baseConfig.cache, ...customConfig.cache },
    batch: { ...baseConfig.batch, ...customConfig.batch },
    monitoring: { ...baseConfig.monitoring, ...customConfig.monitoring },
    supabase: { ...baseConfig.supabase, ...customConfig.supabase },
    auth: { ...baseConfig.auth, ...customConfig.auth },
    performance: { ...baseConfig.performance, ...customConfig.performance },
    development: { ...baseConfig.development, ...customConfig.development }
  };
}

// Constantes útiles
export const OPTIMIZATION_CONSTANTS = {
  // Límites de planes gratuitos
  FREE_TIER_LIMITS: {
    SUPABASE: {
      MONTHLY_QUERIES: 50000,
      REALTIME_CONNECTIONS: 2,
      STORAGE_SIZE: 500 * 1024 * 1024, // 500MB
      AUTH_USERS: 50000
    },
    VERCEL: {
      FUNCTION_INVOCATIONS: 100000,
      FUNCTION_DURATION: 10, // segundos
      BANDWIDTH: 100 * 1024 * 1024 * 1024, // 100GB
      EDGE_FUNCTIONS: 500000
    }
  },
  
  // Métricas de rendimiento recomendadas
  PERFORMANCE_TARGETS: {
    LCP: 2500, // Largest Contentful Paint
    FID: 100,  // First Input Delay
    CLS: 0.1,  // Cumulative Layout Shift
    FCP: 1800, // First Contentful Paint
    TTFB: 600  // Time to First Byte
  },
  
  // TTL recomendados por tipo de dato
  CACHE_TTL: {
    STATIC_DATA: 3600000,    // 1 hora
    USER_DATA: 900000,       // 15 minutos
    SESSION_DATA: 1800000,   // 30 minutos
    API_RESPONSES: 300000,   // 5 minutos
    REALTIME_DATA: 60000     // 1 minuto
  }
};

export default getOptimizationConfig;