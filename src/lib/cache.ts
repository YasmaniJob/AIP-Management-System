// Simple in-memory cache implementation
type CacheValue<T> = {
  value: T;
  expiresAt: number;
};

export class Cache<T = any> {
  private store = new Map<string, CacheValue<T>>();
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) {
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl = this.defaultTTL): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }

  get(key: string): T | undefined {
    const item = this.store.get(key);
    if (!item) return undefined;
    
    if (item.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Export a default cache instance
export const usersCache = new Cache<Set<string>>();

// For testing purposes
export function clearAllCaches() {
  usersCache.clear();
}
