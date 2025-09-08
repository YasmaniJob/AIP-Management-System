// Performance measurement utilities

/**
 * Measures the execution time of a synchronous function
 * @param name - A name for this measurement
 * @param fn - The function to measure
 * @returns The result of the function and the execution time in milliseconds
 */
export function measure<T>(name: string, fn: () => T): { result: T; duration: number } {
  const start = process.hrtime();
  const result = fn();
  const [seconds, nanoseconds] = process.hrtime(start);
  const duration = (seconds * 1000) + (nanoseconds / 1e6);
  
  console.log(`⏱️  [PERF] ${name} took ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}

/**
 * Measures the execution time of an asynchronous function
 * @param name - A name for this measurement
 * @param fn - The async function to measure
 * @returns A promise that resolves with the result and the execution time in milliseconds
 */
export async function measureAsync<T>(
  name: string, 
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = process.hrtime();
  const result = await fn();
  const [seconds, nanoseconds] = process.hrtime(start);
  const duration = (seconds * 1000) + (nanoseconds / 1e6);
  
  console.log(`⏱️  [PERF] ${name} took ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}

/**
 * Creates a performance measurement context that logs when the operation starts and completes
 * @param name - A name for this measurement context
 * @returns An object with start and end methods
 */
type Measurement = {
  end: (success?: boolean) => number;
  wrap: <T>(promise: Promise<T>) => Promise<T>;
};

export function createMeasurement(name: string): Measurement {
  const startTime = process.hrtime();
  
  console.log(`🚀 [PERF] Starting: ${name}`);
  
  return {
    /**
     * Ends the measurement and logs the duration
     * @param success - Whether the operation was successful (default: true)
     */
    end: (success = true) => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = (seconds * 1000) + (nanoseconds / 1e6);
      
      const status = success ? 'completed' : 'failed';
      console.log(`✅ [PERF] ${name} ${status} in ${duration.toFixed(2)}ms`);
      
      return duration;
    },
    
    /**
     * Wraps a promise to automatically end the measurement when it resolves or rejects
     * @param promise - The promise to wrap
     * @returns A new promise that resolves with the same value
     */
    wrap: async function<T>(this: ReturnType<typeof createMeasurement>, promise: Promise<T>): Promise<T> {
      try {
        const result = await promise;
        this.end(true);
        return result;
      } catch (error) {
        this.end(false);
        throw error;
      }
    }
  };
}

// Alias for measureAsync for backward compatibility
export const measurePerformance = measureAsync;
