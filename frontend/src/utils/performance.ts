/**
 * Performance Optimization Utilities
 * ระบบเพิ่มประสิทธิภาพสำหรับ DWF Helpdesk
 */

// ⚡ Cache Management
export class CacheManager {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static set(key: string, data: any, ttl: number = 300000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  static clear(): void {
    this.cache.clear();
  }

  static size(): number {
    return this.cache.size;
  }
}

// ⚡ Debounce Function for Search
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ⚡ Throttle Function for Scroll Events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ⚡ Image Lazy Loading
export const lazyLoadImage = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
};

// ⚡ API Response Compression Check
export const isCompressionSupported = (): boolean => {
  return 'CompressionStream' in window;
};

// ⚡ Memory Usage Monitor (Development)
export const getMemoryUsage = (): any => {
  if ('memory' in performance) {
    return (performance as any).memory;
  }
  return null;
};

// ⚡ Performance Metrics
export class PerformanceMonitor {
  private static metrics: { [key: string]: number } = {};

  static start(label: string): void {
    this.metrics[label] = performance.now();
  }

  static end(label: string): number {
    const startTime = this.metrics[label];
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    delete this.metrics[label];
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ Performance [${label}]: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  static getMetrics(): { [key: string]: number } {
    return { ...this.metrics };
  }
}

// ⚡ Bundle Size Optimization
export const preloadCriticalResources = (): void => {
  // Preload critical CSS
  const criticalCSS = document.createElement('link');
  criticalCSS.rel = 'preload';
  criticalCSS.as = 'style';
  criticalCSS.href = '/static/css/main.css';
  document.head.appendChild(criticalCSS);

  // Preload fonts
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preload';
  fontPreload.as = 'font';
  fontPreload.type = 'font/woff2';
  fontPreload.crossOrigin = 'anonymous';
  fontPreload.href = '/fonts/inter.woff2';
  document.head.appendChild(fontPreload);
};

// ⚡ Network Status Detection
export const getNetworkStatus = (): { effectiveType?: string; downlink?: number } => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink
    };
  }
  return {};
};

// ⚡ Service Worker Registration for Caching
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('⚡ Service Worker registered successfully:', registration.scope);
    } catch (error) {
      console.error('⚡ Service Worker registration failed:', error);
    }
  }
};

// ⚡ Critical Path CSS Inlining
export const inlineCriticalCSS = (): void => {
  const criticalCSS = `
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
};

// ⚡ Efficient DOM Updates
export const batchDOMUpdates = (updates: (() => void)[]): void => {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};

// ⚡ Export all utilities
export default {
  CacheManager,
  debounce,
  throttle,
  lazyLoadImage,
  PerformanceMonitor,
  preloadCriticalResources,
  getNetworkStatus,
  registerServiceWorker,
  inlineCriticalCSS,
  batchDOMUpdates,
  isCompressionSupported,
  getMemoryUsage
};