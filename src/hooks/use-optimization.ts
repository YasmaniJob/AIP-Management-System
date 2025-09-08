'use client';

// Hook personalizado para integrar todas las optimizaciones

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePerformanceMonitor } from '@/lib/monitoring/performance-monitor';
import { ClientCache } from '@/lib/cache/client-cache';
import { OptimizedQueries } from '@/lib/services/optimized-queries';
import { BatchProcessor } from '@/lib/batch/batch-operations';
import { createOptimizedSupabaseClient } from '@/lib/supabase/client-optimized';
import { useCacheOptimization } from '@/lib/cache/cache-headers';

interface OptimizationConfig {
  enableCache?: boolean;
  enableBatching?: boolean;
  enableMonitoring?: boolean;
  cacheConfig?: {
    defaultTTL?: number;
    maxSize?: number;
  };
  batchConfig?: {
    maxBatchSize?: number;
    flushInterval?: number;
  };
}

interface OptimizationStats {
  cacheHitRate: number;
  batchOperations: number;
  performanceScore: number;
  resourceUsage: {
    supabaseQueries: number;
    memoryUsage: number;
    authChecks: number;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: number;
  }>;
}

interface OptimizationActions {
  // Cache actions
  clearCache: () => void;
  invalidateCache: (pattern?: string) => void;
  preloadData: (keys: string[]) => Promise<void>;
  
  // Batch actions
  flushBatch: () => Promise<void>;
  addToBatch: (operation: any) => void;
  
  // Monitoring actions
  generateReport: () => any;
  resolveAlert: (alertId: string) => void;
  trackMetric: (name: string, value: number) => void;
  
  // Supabase optimizations
  optimizedQuery: (table: string, options?: any) => Promise<any>;
  batchQuery: (queries: any[]) => Promise<any[]>;
}

export function useOptimization(config: OptimizationConfig = {}) {
  const {
    enableCache = true,
    enableBatching = true,
    enableMonitoring = true,
    cacheConfig = {},
    batchConfig = {}
  } = config;

  // Initialize services
  const [cache] = useState(() => 
    enableCache ? new ClientCache({
      defaultTTL: cacheConfig.defaultTTL || 300000, // 5 minutes
      maxSize: cacheConfig.maxSize || 100
    }) : null
  );

  const [queries] = useState(() => 
    enableCache ? new OptimizedQueries(cache!) : null
  );

  const [batchProcessor] = useState(() => 
    enableBatching ? new BatchProcessor({
      maxBatchSize: batchConfig.maxBatchSize || 10,
      flushInterval: batchConfig.flushInterval || 1000
    }) : null
  );

  const [supabase] = useState(() => createOptimizedSupabaseClient());

  // Hooks
  const performanceMonitor = enableMonitoring ? usePerformanceMonitor() : null;
  const cacheOptimization = useCacheOptimization();

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState<OptimizationStats>({
    cacheHitRate: 0,
    batchOperations: 0,
    performanceScore: 0,
    resourceUsage: {
      supabaseQueries: 0,
      memoryUsage: 0,
      authChecks: 0
    },
    alerts: []
  });

  // Initialize optimization systems
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize cache if enabled
        if (cache) {
          await cache.clear(); // Start with clean cache
        }

        // Initialize batch processor if enabled
        if (batchProcessor) {
          // Set up auto-flush
          const interval = setInterval(() => {
            batchProcessor.flush().catch(console.error);
          }, batchConfig.flushInterval || 1000);

          // Cleanup on unmount
          return () => clearInterval(interval);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing optimization systems:', error);
      }
    };

    initialize();
  }, [cache, batchProcessor, batchConfig.flushInterval]);

  // Update stats periodically
  useEffect(() => {
    if (!isInitialized) return;

    const updateStats = () => {
      const newStats: OptimizationStats = {
        cacheHitRate: cache ? cache.getStats().hitRate : 0,
        batchOperations: batchProcessor ? batchProcessor.getStats().totalOperations : 0,
        performanceScore: performanceMonitor?.stats?.performance?.score || 0,
        resourceUsage: {
          supabaseQueries: performanceMonitor?.stats?.resources?.supabaseQueries || 0,
          memoryUsage: performanceMonitor?.stats?.performance?.currentMemoryUsage || 0,
          authChecks: performanceMonitor?.stats?.resources?.authChecks || 0
        },
        alerts: performanceMonitor?.alerts || []
      };

      setStats(newStats);
    };

    // Update immediately
    updateStats();

    // Set up periodic updates
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isInitialized, cache, batchProcessor, performanceMonitor]);

  // Cache actions
  const clearCache = useCallback(() => {
    if (cache) {
      cache.clear();
      performanceMonitor?.trackMetric('cache_cleared', 1);
    }
  }, [cache, performanceMonitor]);

  const invalidateCache = useCallback((pattern?: string) => {
    if (cache) {
      if (pattern) {
        cache.invalidatePattern(pattern);
      } else {
        cache.clear();
      }
      performanceMonitor?.trackMetric('cache_invalidated', 1);
    }
  }, [cache, performanceMonitor]);

  const preloadData = useCallback(async (keys: string[]) => {
    if (!queries) return;

    try {
      const promises = keys.map(key => {
        // Determine data type from key and preload accordingly
        if (key.includes('resources')) {
          return queries.getResources();
        } else if (key.includes('loans')) {
          return queries.getLoans();
        } else if (key.includes('notifications')) {
          return queries.getNotifications();
        }
        return Promise.resolve(null);
      });

      await Promise.all(promises);
      performanceMonitor?.trackMetric('data_preloaded', keys.length);
    } catch (error) {
      console.error('Error preloading data:', error);
    }
  }, [queries, performanceMonitor]);

  // Batch actions
  const flushBatch = useCallback(async () => {
    if (batchProcessor) {
      await batchProcessor.flush();
      performanceMonitor?.trackMetric('batch_flushed', 1);
    }
  }, [batchProcessor, performanceMonitor]);

  const addToBatch = useCallback((operation: any) => {
    if (batchProcessor) {
      batchProcessor.add(operation);
      performanceMonitor?.trackMetric('batch_operation_added', 1);
    }
  }, [batchProcessor, performanceMonitor]);

  // Monitoring actions
  const generateReport = useCallback(() => {
    if (performanceMonitor) {
      return performanceMonitor.generateReport();
    }
    return null;
  }, [performanceMonitor]);

  const resolveAlert = useCallback((alertId: string) => {
    if (performanceMonitor) {
      performanceMonitor.resolveAlert(alertId);
    }
  }, [performanceMonitor]);

  const trackMetric = useCallback((name: string, value: number) => {
    if (performanceMonitor) {
      performanceMonitor.trackMetric(name, value);
    }
  }, [performanceMonitor]);

  // Optimized Supabase operations
  const optimizedQuery = useCallback(async (table: string, options: any = {}) => {
    try {
      const startTime = performance.now();
      
      // Use cached queries if available
      if (queries) {
        let result;
        switch (table) {
          case 'resources':
            result = await queries.getResources(options);
            break;
          case 'loans':
            result = await queries.getLoans(options);
            break;
          case 'notifications':
            result = await queries.getNotifications(options);
            break;
          default:
            // Fallback to direct Supabase query
            const query = supabase.from(table).select(options.select || '*');
            if (options.filter) {
              Object.entries(options.filter).forEach(([key, value]) => {
                query.eq(key, value);
              });
            }
            if (options.limit) query.limit(options.limit);
            if (options.order) query.order(options.order.column, { ascending: options.order.ascending });
            
            const { data, error } = await query;
            if (error) throw error;
            result = data;
        }
        
        const duration = performance.now() - startTime;
        performanceMonitor?.trackMetric('optimized_query_duration', duration);
        
        return result;
      }
      
      // Fallback to direct query without cache
      const query = supabase.from(table).select(options.select || '*');
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query.eq(key, value);
        });
      }
      if (options.limit) query.limit(options.limit);
      if (options.order) query.order(options.order.column, { ascending: options.order.ascending });
      
      const { data, error } = await query;
      if (error) throw error;
      
      const duration = performance.now() - startTime;
      performanceMonitor?.trackMetric('direct_query_duration', duration);
      
      return data;
    } catch (error) {
      console.error('Error in optimized query:', error);
      throw error;
    }
  }, [queries, supabase, performanceMonitor]);

  const batchQuery = useCallback(async (queries: any[]) => {
    if (!batchProcessor) {
      // Execute queries individually if batching is disabled
      return Promise.all(queries.map(q => optimizedQuery(q.table, q.options)));
    }

    try {
      const startTime = performance.now();
      
      // Add queries to batch
      const promises = queries.map(query => 
        batchProcessor.add({
          type: 'query',
          table: query.table,
          options: query.options
        })
      );

      // Execute batch
      const results = await Promise.all(promises);
      
      const duration = performance.now() - startTime;
      performanceMonitor?.trackMetric('batch_query_duration', duration);
      performanceMonitor?.trackMetric('batch_query_count', queries.length);
      
      return results;
    } catch (error) {
      console.error('Error in batch query:', error);
      throw error;
    }
  }, [batchProcessor, optimizedQuery, performanceMonitor]);

  // Memoized actions object
  const actions: OptimizationActions = useMemo(() => ({
    clearCache,
    invalidateCache,
    preloadData,
    flushBatch,
    addToBatch,
    generateReport,
    resolveAlert,
    trackMetric,
    optimizedQuery,
    batchQuery
  }), [
    clearCache,
    invalidateCache,
    preloadData,
    flushBatch,
    addToBatch,
    generateReport,
    resolveAlert,
    trackMetric,
    optimizedQuery,
    batchQuery
  ]);

  // Optimization status
  const optimizationStatus = useMemo(() => {
    const score = (
      (stats.cacheHitRate > 70 ? 25 : stats.cacheHitRate * 0.35) +
      (stats.batchOperations > 0 ? 25 : 0) +
      (stats.resourceUsage.supabaseQueries < 1000 ? 25 : Math.max(0, 25 - (stats.resourceUsage.supabaseQueries - 1000) * 0.01)) +
      (stats.alerts.length === 0 ? 25 : Math.max(0, 25 - stats.alerts.length * 5))
    );

    return {
      score: Math.round(score),
      status: score > 80 ? 'excellent' : score > 60 ? 'good' : score > 40 ? 'fair' : 'poor',
      recommendations: [
        ...(stats.cacheHitRate < 70 ? ['Mejorar estrategia de caché'] : []),
        ...(stats.batchOperations === 0 ? ['Implementar operaciones batch'] : []),
        ...(stats.resourceUsage.supabaseQueries > 1000 ? ['Optimizar consultas de base de datos'] : []),
        ...(stats.alerts.length > 0 ? ['Resolver alertas pendientes'] : [])
      ]
    };
  }, [stats]);

  return {
    // State
    isInitialized,
    stats,
    optimizationStatus,
    
    // Services (for advanced usage)
    cache,
    queries,
    batchProcessor,
    supabase,
    performanceMonitor,
    cacheOptimization,
    
    // Actions
    ...actions
  };
}

// Hook específico para componentes que solo necesitan datos optimizados
export function useOptimizedData<T>({
  key,
  fetcher,
  options = {}
}: {
  key: string;
  fetcher: () => Promise<T>;
  options?: {
    ttl?: number;
    enabled?: boolean;
    refetchOnMount?: boolean;
  };
}) {
  const { cache, trackMetric } = useOptimization();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!options.enabled && options.enabled !== undefined) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try cache first
      if (cache) {
        const cached = cache.get<T>(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          trackMetric('cache_hit', 1);
          return;
        }
      }

      // Fetch fresh data
      const result = await fetcher();
      
      // Cache the result
      if (cache) {
        cache.set(key, result, options.ttl);
      }
      
      setData(result);
      trackMetric('data_fetched', 1);
    } catch (err) {
      setError(err as Error);
      trackMetric('fetch_error', 1);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options.enabled, options.ttl, cache, trackMetric]);

  useEffect(() => {
    if (options.refetchOnMount !== false) {
      fetchData();
    }
  }, [fetchData, options.refetchOnMount]);

  const refetch = useCallback(() => {
    // Invalidate cache and refetch
    if (cache) {
      cache.delete(key);
    }
    return fetchData();
  }, [cache, key, fetchData]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

// Hook para operaciones batch simplificadas
export function useBatchOperations() {
  const { batchProcessor, addToBatch, flushBatch } = useOptimization({
    enableBatching: true
  });

  const addOperation = useCallback((operation: any) => {
    addToBatch(operation);
  }, [addToBatch]);

  const executeBatch = useCallback(async () => {
    await flushBatch();
  }, [flushBatch]);

  const batchStats = useMemo(() => {
    return batchProcessor ? batchProcessor.getStats() : null;
  }, [batchProcessor]);

  return {
    addOperation,
    executeBatch,
    stats: batchStats
  };
}

export default useOptimization;