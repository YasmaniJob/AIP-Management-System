// Cache simple para optimizar consultas de usuarios
type UserCacheData = {
  existingDnis: Set<string>;
  existingEmails: Set<string>;
  timestamp: number;
};

class UsersCache {
  private cache: UserCacheData | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  isValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp < this.CACHE_DURATION;
  }

  set(existingDnis: Set<string>, existingEmails: Set<string>): void {
    this.cache = {
      existingDnis,
      existingEmails,
      timestamp: Date.now()
    };
  }

  get(): { existingDnis: Set<string>; existingEmails: Set<string> } | null {
    if (!this.isValid()) {
      this.cache = null;
      return null;
    }
    return {
      existingDnis: this.cache!.existingDnis,
      existingEmails: this.cache!.existingEmails
    };
  }

  clear(): void {
    this.cache = null;
  }
}

// Instancia singleton del cache
export const usersCache = new UsersCache();