/**
 * ⚡ API Performance Middleware
 * DWF Helpdesk API Optimization & Monitoring
 */

import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { createHash } from 'crypto';

// 🚀 Response Time Monitor
export const responseTimeMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`🐌 Slow API Request: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Add response time header
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

// 🗜️ Smart Compression Middleware
export const smartCompression = compression({
  filter: (req, res) => {
    // Don't compress if response is already small
    const contentLength = res.getHeader('content-length');
    if (contentLength && parseInt(contentLength.toString()) < 1024) {
      return false;
    }
    
    // Compress JSON and text responses
    const contentType = res.getHeader('content-type')?.toString() || '';
    return contentType.includes('json') || 
           contentType.includes('text') || 
           contentType.includes('html');
  },
  level: 6, // Balanced compression
  threshold: 1024 // Only compress files > 1KB
});

// 🎯 API Response Cache Manager
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 100; // Maximum cache entries
  
  generateKey(req: Request): string {
    const { method, path, query } = req;
    return createHash('md5')
      .update(`${method}:${path}:${JSON.stringify(query)}`)
      .digest('hex');
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

export const apiCache = new APICache();

// 🔄 Caching Middleware
export const cacheMiddleware = (ttl: number = 300000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip caching for authenticated endpoints that might have user-specific data
    if (req.headers.authorization && req.path.includes('/dashboard')) {
      return next();
    }
    
    const cacheKey = apiCache.generateKey(req);
    const cachedData = apiCache.get(cacheKey);
    
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);
      return res.json(cachedData);
    }
    
    // Override res.json to cache successful responses
    const originalJson = res.json;
    res.json = function(data: any) {
      if (res.statusCode === 200) {
        apiCache.set(cacheKey, data, ttl);
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// 📊 API Performance Metrics
class PerformanceMetrics {
  private metrics = {
    totalRequests: 0,
    averageResponseTime: 0,
    slowRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errorCount: 0,
    endpointStats: new Map<string, {
      count: number;
      totalTime: number;
      averageTime: number;
      errors: number;
    }>()
  };
  
  recordRequest(endpoint: string, duration: number, isError: boolean = false): void {
    this.metrics.totalRequests++;
    
    // Update overall average
    this.metrics.averageResponseTime = 
      ((this.metrics.averageResponseTime * (this.metrics.totalRequests - 1)) + duration) / 
      this.metrics.totalRequests;
    
    // Count slow requests
    if (duration > 1000) {
      this.metrics.slowRequests++;
    }
    
    // Count errors
    if (isError) {
      this.metrics.errorCount++;
    }
    
    // Update endpoint-specific stats
    const endpointStat = this.metrics.endpointStats.get(endpoint) || {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      errors: 0
    };
    
    endpointStat.count++;
    endpointStat.totalTime += duration;
    endpointStat.averageTime = endpointStat.totalTime / endpointStat.count;
    
    if (isError) {
      endpointStat.errors++;
    }
    
    this.metrics.endpointStats.set(endpoint, endpointStat);
  }
  
  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }
  
  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRatio: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      errorRate: this.metrics.errorCount / this.metrics.totalRequests || 0,
      slowRequestRate: this.metrics.slowRequests / this.metrics.totalRequests || 0,
      endpointStats: Object.fromEntries(this.metrics.endpointStats)
    };
  }
  
  reset(): void {
    this.metrics = {
      totalRequests: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errorCount: 0,
      endpointStats: new Map()
    };
  }
}

export const performanceMetrics = new PerformanceMetrics();

// 📈 Performance Monitoring Middleware
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    
    performanceMetrics.recordRequest(endpoint, duration, isError);
    
    // Record cache metrics
    const cacheHeader = res.getHeader('X-Cache') as string;
    if (cacheHeader === 'HIT') {
      performanceMetrics.recordCacheHit();
    } else if (cacheHeader === 'MISS') {
      performanceMetrics.recordCacheMiss();
    }
  });
  
  next();
};

// 🔧 Database Connection Pool Optimization
export const optimizeDbQueries = (req: Request, res: Response, next: NextFunction) => {
  // Add query optimization hints
  req.queryHints = {
    useIndex: true,
    limit: 100, // Default limit for pagination
    includeCount: false // Don't count total records unless needed
  };
  
  next();
};

// 🚀 Static Asset Optimization
export const staticAssetOptimization = (req: Request, res: Response, next: NextFunction) => {
  // Set aggressive caching for static assets
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
    res.setHeader('ETag', createHash('md5').update(req.path).digest('hex'));
  }
  
  // Set moderate caching for API responses
  if (req.path.startsWith('/api/') && req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
  }
  
  next();
};

// 🎯 Request Size Limiter
export const requestSizeLimiter = (maxSize: number = 10 * 1024 * 1024) => { // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        error: 'Request entity too large',
        maxSize: `${maxSize / (1024 * 1024)}MB`
      });
    }
    
    next();
  };
};

export default {
  responseTimeMonitor,
  smartCompression,
  cacheMiddleware,
  performanceMonitoring,
  optimizeDbQueries,
  staticAssetOptimization,
  requestSizeLimiter,
  apiCache,
  performanceMetrics
};