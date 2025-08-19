import { Request, Response, NextFunction } from 'express';

// Ultra-fast in-memory caches with different TTLs
class UltraCache {
  private userCache = new Map<number, { data: any; expiry: number }>();
  private queryCache = new Map<string, { data: any; expiry: number }>();
  private tokenCache = new Map<string, { userId: number; role: string; expiry: number }>();

  // User cache with 5-minute TTL
  setUser(userId: number, userData: any, ttlSeconds: number = 300): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.userCache.set(userId, { data: userData, expiry });
  }

  getUser(userId: number): any | null {
    const item = this.userCache.get(userId);
    if (!item || Date.now() > item.expiry) {
      this.userCache.delete(userId);
      return null;
    }
    return item.data;
  }

  // Token cache with 1-hour TTL (matches JWT expiry)
  setToken(token: string, payload: { userId: number; role: string }, ttlSeconds: number = 3600): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.tokenCache.set(token, { ...payload, expiry });
  }

  getToken(token: string): { userId: number; role: string } | null {
    const item = this.tokenCache.get(token);
    if (!item || Date.now() > item.expiry) {
      this.tokenCache.delete(token);
      return null;
    }
    return { userId: item.userId, role: item.role };
  }

  // Generic query cache with configurable TTL
  setQuery(key: string, data: any, ttlSeconds: number = 60): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.queryCache.set(key, { data, expiry });
  }

  getQuery(key: string): any | null {
    const item = this.queryCache.get(key);
    if (!item || Date.now() > item.expiry) {
      this.queryCache.delete(key);
      return null;
    }
    return item.data;
  }

  // Invalidate user-specific caches
  invalidateUser(userId: number): void {
    this.userCache.delete(userId);
    // Clear related token caches
    for (const [token, data] of this.tokenCache.entries()) {
      if (data.userId === userId) {
        this.tokenCache.delete(token);
      }
    }
  }

  // Clear all caches
  clearAll(): void {
    this.userCache.clear();
    this.queryCache.clear();
    this.tokenCache.clear();
  }

  // Get cache statistics
  getStats() {
    return {
      users: this.userCache.size,
      queries: this.queryCache.size,
      tokens: this.tokenCache.size,
      total: this.userCache.size + this.queryCache.size + this.tokenCache.size
    };
  }

  // Cleanup expired entries every 2 minutes
  startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Clean user cache
      for (const [key, item] of this.userCache.entries()) {
        if (now > item.expiry) {
          this.userCache.delete(key);
        }
      }
      
      // Clean query cache
      for (const [key, item] of this.queryCache.entries()) {
        if (now > item.expiry) {
          this.queryCache.delete(key);
        }
      }
      
      // Clean token cache
      for (const [key, item] of this.tokenCache.entries()) {
        if (now > item.expiry) {
          this.tokenCache.delete(key);
        }
      }
      
      console.log(`🧹 Ultra Cache cleanup: ${this.getStats().total} entries remaining`);
    }, 2 * 60 * 1000); // Every 2 minutes
  }
}

export const ultraCache = new UltraCache();
ultraCache.startCleanup();

// Ultra-fast authentication middleware with aggressive caching
export const ultraAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'ไม่พบ Access Token' });
  }

  const token = authHeader.substring(7);
  
  // Try cache first
  const cachedAuth = ultraCache.getToken(token);
  if (cachedAuth) {
    (req as any).user = {
      userId: cachedAuth.userId,
      role: cachedAuth.role,
      username: 'cached' // Will be populated if needed
    };
    return next();
  }

  // If not in cache, verify token (this should rarely happen)
  try {
    const jwt = require('jsonwebtoken');
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Cache the token
    ultraCache.setToken(token, { userId: decoded.userId, role: decoded.role });
    
    (req as any).user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token ไม่ถูกต้อง' });
  }
};

// Ultra-fast query caching middleware
export const ultraQueryCache = (keyGenerator: (req: Request) => string, ttlSeconds: number = 60) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cachedData = ultraCache.getQuery(cacheKey);

    if (cachedData) {
      console.log(`⚡ Ultra Cache HIT: ${cacheKey}`);
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache the response
    res.json = function(data: any) {
      if (res.statusCode === 200) {
        ultraCache.setQuery(cacheKey, data, ttlSeconds);
        console.log(`💾 Ultra Cache SET: ${cacheKey}`);
      }
      return originalJson(data);
    };

    next();
  };
};

// User data caching helper
export const getCachedUser = async (userId: number, prisma: any): Promise<any> => {
  // Try cache first
  const cached = ultraCache.getUser(userId);
  if (cached) {
    return cached;
  }

  // Fetch from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      autoAssignEnabled: true,
      lastLogin: true,
      lastAssignedAt: true
    }
  });

  if (user) {
    ultraCache.setUser(userId, user, 300); // Cache for 5 minutes
  }

  return user;
};

// Batch user loading with caching
export const getCachedUsers = async (userIds: number[], prisma: any): Promise<any[]> => {
  const cached = [];
  const toFetch = [];

  // Check cache for each user
  for (const userId of userIds) {
    const cachedUser = ultraCache.getUser(userId);
    if (cachedUser) {
      cached.push(cachedUser);
    } else {
      toFetch.push(userId);
    }
  }

  // Fetch missing users in batch
  if (toFetch.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: toFetch } },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        autoAssignEnabled: true,
        lastLogin: true,
        lastAssignedAt: true
      }
    });

    // Cache the fetched users
    users.forEach((user:any) => {
      ultraCache.setUser(user.id, user, 300);
      cached.push(user);
    });
  }

  return cached;
};