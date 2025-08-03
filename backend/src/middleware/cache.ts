import { Request, Response, NextFunction } from 'express';

// Simple in-memory cache with TTL
class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiry });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clean expired items every 5 minutes
  startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expiry) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }
}

export const memoryCache = new MemoryCache();
memoryCache.startCleanup();

// Cache middleware
export const cacheMiddleware = (ttlSeconds: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache for search requests to avoid UTF-8 issues during development
    if (req.path.includes('/search')) {
      console.log(`⚡ Cache SKIP for search: ${req.originalUrl}`);
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;
    const cachedData = memoryCache.get(cacheKey);

    if (cachedData) {
      console.log(`🚀 Cache HIT: ${cacheKey}`);
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache the response
    res.json = function(data: any) {
      if (res.statusCode === 200) {
        memoryCache.set(cacheKey, data, ttlSeconds);
        console.log(`💾 Cache SET: ${cacheKey}`);
      }
      return originalJson(data);
    };

    next();
  };
};

// Cache invalidation helpers
export const invalidateTicketCache = () => {
  const keysToDelete: string[] = [];
  for (const [key] of memoryCache['cache'].entries()) {
    if (key.includes('/api/tickets') || key.includes('/api/dashboard')) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => memoryCache.delete(key));
  console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries`);
};