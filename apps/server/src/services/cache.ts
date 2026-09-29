interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class CacheService {
  private store: Map<string, CacheItem<unknown>> = new Map();

  public get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  public set<T>(key: string, value: T, ttlSeconds: number = 30): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  public delete(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }
}

export const appCache = new CacheService();
