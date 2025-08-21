/**
 * ⚡ Ultra-Enhanced API Service
 * DWF Helpdesk Production-Ready API Client
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { debounce } from '../utils/performance';

// 🎯 API Configuration
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3002/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
};

// 🔄 Request Queue Manager
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private concurrentLimit = 5;
  private activeRequests = 0;

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.activeRequests++;
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      });
      
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.processing || this.activeRequests >= this.concurrentLimit || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const request = this.queue.shift();
    
    if (request) {
      request().finally(() => {
        this.processing = false;
        this.processQueue();
      });
    } else {
      this.processing = false;
    }
  }
}

// 📊 Simple Cache Implementation
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 100;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any, ttl: number = 300000): void {
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

  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// 📊 Performance Metrics
class APIMetrics {
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    cacheHits: 0,
    retries: 0
  };

  recordRequest(duration: number, success: boolean, fromCache: boolean = false) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      // Update average response time
      const total = (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1)) + duration;
      this.metrics.averageResponseTime = total / this.metrics.totalRequests;
    }
  }

  recordRetry() {
    this.metrics.retries++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 : 0,
      cacheHitRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.cacheHits / this.metrics.totalRequests) * 100 : 0
    };
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      retries: 0
    };
  }
}

// 🚨 Error Types
export enum APIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class APIError extends Error {
  public type: APIErrorType;
  public status?: number;
  public data?: any;
  public requestId?: string;

  constructor(
    message: string,
    type: APIErrorType,
    status?: number,
    data?: any,
    requestId?: string
  ) {
    super(message);
    this.type = type;
    this.status = status;
    this.data = data;
    this.requestId = requestId;
    this.name = 'APIError';
  }
}

// ⚡ Enhanced API Client
class EnhancedAPIClient {
  private client: AxiosInstance;
  private cache: SimpleCache;
  private requestQueue: RequestQueue;
  private metrics: APIMetrics;
  private authToken: string | null = null;

  constructor() {
    this.cache = new SimpleCache();
    this.requestQueue = new RequestQueue();
    this.metrics = new APIMetrics();

    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor
    this.client.interceptors.request.use(
      (config: any) => {
        // Add request ID for tracking
        config.metadata = { 
          startTime: Date.now(),
          requestId: this.generateRequestId()
        };

        // Add auth token
        if (this.authToken) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Add performance headers
        config.headers = config.headers || {};
        config.headers['X-Request-Start'] = Date.now().toString();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config as any).metadata?.startTime || 0;
        this.metrics.recordRequest(duration, true);
        
        // Add performance headers to response
        response.headers['x-response-time'] = `${duration}ms`;
        
        return response;
      },
      async (error) => {
        const duration = Date.now() - (error.config as any)?.metadata?.startTime || 0;
        this.metrics.recordRequest(duration, false);
        
        return this.handleError(error);
      }
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async handleError(error: AxiosError): Promise<never> {
    const requestId = (error.config as any)?.metadata?.requestId;

    // Determine error type
    let errorType: APIErrorType;
    let errorMessage: string;

    if (!error.response) {
      // Network error
      errorType = APIErrorType.NETWORK_ERROR;
      errorMessage = 'Network connection failed. Please check your internet connection.';
    } else {
      const status = error.response.status;
      
      switch (true) {
        case status === 401:
          errorType = APIErrorType.AUTHENTICATION_ERROR;
          errorMessage = 'Authentication required. Please log in.';
          break;
        case status === 403:
          errorType = APIErrorType.AUTHORIZATION_ERROR;
          errorMessage = 'Access denied. Insufficient permissions.';
          break;
        case status >= 400 && status < 500:
          errorType = APIErrorType.CLIENT_ERROR;
          errorMessage = (error.response.data as any)?.message || 'Client error occurred.';
          break;
        case status >= 500:
          errorType = APIErrorType.SERVER_ERROR;
          errorMessage = 'Server error occurred. Please try again later.';
          break;
        default:
          errorType = APIErrorType.UNKNOWN_ERROR;
          errorMessage = 'An unexpected error occurred.';
      }
    }

    throw new APIError(
      errorMessage,
      errorType,
      error.response?.status,
      error.response?.data,
      requestId
    );
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempts: number = API_CONFIG.RETRY_ATTEMPTS
  ): Promise<T> {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        this.metrics.recordRetry();

        if (attempt === attempts) {
          throw error;
        }

        // Don't retry client errors (4xx) except for 408, 429
        if (error instanceof APIError) {
          const shouldRetry = error.type === APIErrorType.NETWORK_ERROR ||
                            error.type === APIErrorType.SERVER_ERROR ||
                            error.type === APIErrorType.TIMEOUT_ERROR ||
                            error.status === 408 || // Request Timeout
                            error.status === 429;   // Too Many Requests

          if (!shouldRetry) {
            throw error;
          }
        }

        // Exponential backoff
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Maximum retry attempts exceeded');
  }

  // 🔐 Authentication Methods
  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  // 🌐 HTTP Methods with Caching and Retry
  async get<T>(
    url: string, 
    config?: AxiosRequestConfig & { 
      cache?: boolean; 
      cacheTTL?: number;
      retry?: boolean;
    }
  ): Promise<T> {
    const { cache = true, cacheTTL = API_CONFIG.CACHE_TTL, retry = true, ...axiosConfig } = config || {};
    
    // Check cache first
    if (cache) {
      const cacheKey = `GET:${url}:${JSON.stringify(axiosConfig)}`;
      const cachedData = this.cache.get<T>(cacheKey);
      
      if (cachedData) {
        this.metrics.recordRequest(0, true, true);
        return cachedData;
      }
    }

    const requestFn = async () => {
      const response = await this.client.get<T>(url, axiosConfig);
      
      // Cache successful responses
      if (cache && response.status === 200) {
        const cacheKey = `GET:${url}:${JSON.stringify(axiosConfig)}`;
        this.cache.set(cacheKey, response.data, cacheTTL);
      }
      
      return response.data;
    };

    if (retry) {
      return this.requestQueue.add(() => this.retryRequest(requestFn));
    } else {
      return this.requestQueue.add(requestFn);
    }
  }

  async post<T, D = any>(
    url: string, 
    data?: D, 
    config?: AxiosRequestConfig & { retry?: boolean }
  ): Promise<T> {
    const { retry = true, ...axiosConfig } = config || {};

    const requestFn = async () => {
      const response = await this.client.post<T>(url, data, axiosConfig);
      
      // Invalidate related cache entries
      this.cache.invalidatePattern(`GET:${url.split('?')[0]}`);
      
      return response.data;
    };

    if (retry) {
      return this.requestQueue.add(() => this.retryRequest(requestFn));
    } else {
      return this.requestQueue.add(requestFn);
    }
  }

  async put<T, D = any>(
    url: string, 
    data?: D, 
    config?: AxiosRequestConfig & { retry?: boolean }
  ): Promise<T> {
    const { retry = true, ...axiosConfig } = config || {};

    const requestFn = async () => {
      const response = await this.client.put<T>(url, data, axiosConfig);
      
      // Invalidate related cache entries
      this.cache.invalidatePattern(`GET:${url.split('?')[0]}`);
      
      return response.data;
    };

    if (retry) {
      return this.requestQueue.add(() => this.retryRequest(requestFn));
    } else {
      return this.requestQueue.add(requestFn);
    }
  }

  async delete<T>(
    url: string, 
    config?: AxiosRequestConfig & { retry?: boolean }
  ): Promise<T> {
    const { retry = true, ...axiosConfig } = config || {};

    const requestFn = async () => {
      const response = await this.client.delete<T>(url, axiosConfig);
      
      // Invalidate related cache entries
      this.cache.invalidatePattern(`GET:${url.split('?')[0]}`);
      
      return response.data;
    };

    if (retry) {
      return this.requestQueue.add(() => this.retryRequest(requestFn));
    } else {
      return this.requestQueue.add(requestFn);
    }
  }

  // 🧹 Cache Management
  clearCache() {
    this.cache.clear();
  }

  invalidateCache(pattern: string) {
    this.cache.invalidatePattern(pattern);
  }

  // 📊 Metrics and Monitoring
  getMetrics() {
    return this.metrics.getMetrics();
  }

  resetMetrics() {
    this.metrics.reset();
  }

  // 🔍 Health Check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { cache: false, retry: false });
      return true;
    } catch {
      return false;
    }
  }
}

// 🚀 Create singleton instance
export const apiClient = new EnhancedAPIClient();

// 🎯 Convenience functions with optimized debouncing
export const debouncedSearch = debounce(
  (query: string, callback: (results: any) => void) => {
    apiClient.get(`/search?q=${encodeURIComponent(query)}`)
      .then(callback)
      .catch(error => console.error('Search error:', error));
  },
  300
);

// 📊 API Status Monitor
export class APIStatusMonitor {
  private static instance: APIStatusMonitor;
  private isOnline = navigator.onLine;
  private listeners: Array<(status: boolean) => void> = [];

  static getInstance(): APIStatusMonitor {
    if (!APIStatusMonitor.instance) {
      APIStatusMonitor.instance = new APIStatusMonitor();
    }
    return APIStatusMonitor.instance;
  }

  constructor() {
    if (APIStatusMonitor.instance) {
      return APIStatusMonitor.instance;
    }

    window.addEventListener('online', () => this.setOnlineStatus(true));
    window.addEventListener('offline', () => this.setOnlineStatus(false));

    // Periodic health check
    setInterval(async () => {
      if (this.isOnline) {
        const healthy = await apiClient.healthCheck();
        if (!healthy) {
          this.setOnlineStatus(false);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private setOnlineStatus(online: boolean) {
    if (this.isOnline !== online) {
      this.isOnline = online;
      this.listeners.forEach(listener => listener(online));
    }
  }

  getStatus(): boolean {
    return this.isOnline;
  }

  subscribe(listener: (status: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export default {
  apiClient,
  APIError,
  APIErrorType,
  APIStatusMonitor,
  debouncedSearch
};