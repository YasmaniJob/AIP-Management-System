// Simple monitoring utility for performance and error tracking

type ResourceUsage = {
  count: number;
  totalTime: number;
  errors: number;
};

type ResourceType = 'supabaseQueries' | 'cacheHits' | 'cacheMisses' | 'apiCalls';

export const performanceMonitor = {
  resources: new Map<ResourceType, ResourceUsage>(),

  startTimer() {
    return process.hrtime();
  },

  endTimer(startTime: [number, number]) {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    return (seconds * 1000) + (nanoseconds / 1e6); // Convert to milliseconds
  },

  measure<T>(resource: ResourceType, fn: () => T): T {
    const start = this.startTimer();
    try {
      const result = fn();
      this.recordSuccess(resource, start);
      return result;
    } catch (error) {
      this.recordError(resource, error);
      throw error;
    }
  },

  async measureAsync<T>(resource: ResourceType, fn: () => Promise<T>): Promise<T> {
    const start = this.startTimer();
    try {
      const result = await fn();
      this.recordSuccess(resource, start);
      return result;
    } catch (error) {
      this.recordError(resource, error);
      throw error;
    }
  },

  recordSuccess(resource: ResourceType, startTime: [number, number]) {
    const duration = this.endTimer(startTime);
    const usage = this.resources.get(resource) || { count: 0, totalTime: 0, errors: 0 };
    
    this.resources.set(resource, {
      count: usage.count + 1,
      totalTime: usage.totalTime + duration,
      errors: usage.errors
    });
  },

  recordError(resource: ResourceType, error: unknown) {
    const usage = this.resources.get(resource) || { count: 0, totalTime: 0, errors: 0 };
    
    this.resources.set(resource, {
      ...usage,
      errors: usage.errors + 1
    });

    // Log the error
    console.error(`[MONITORING] Error in ${resource}:`, error);
  },

  getStats() {
    const stats: Record<string, any> = {};
    
    this.resources.forEach((usage, resource) => {
      const avgTime = usage.count > 0 ? (usage.totalTime / usage.count).toFixed(2) : 0;
      
      stats[resource] = {
        count: usage.count,
        averageTime: `${avgTime}ms`,
        errorRate: usage.count > 0 ? ((usage.errors / usage.count) * 100).toFixed(2) + '%' : '0%',
        errors: usage.errors
      };
    });

    return stats;
  },

  reset() {
    this.resources.clear();
  }
};

// Export the performance monitor
export default performanceMonitor;
