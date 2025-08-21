/**
 * DWF Helpdesk Service Worker
 * ⚡ High-Performance Caching Strategy
 */

const CACHE_NAME = 'dwf-helpdesk-v1.0.3';
const STATIC_CACHE = 'dwf-static-v1.0.3';
const API_CACHE = 'dwf-api-v1.0.3';

// ⚡ Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/favicon.ico'
];

// ⚡ API endpoints to cache
const API_ENDPOINTS = [
  '/api/categories',
  '/api/priorities',
  '/api/health/db'
];

// 📦 Install Event - Pre-cache critical resources
self.addEventListener('install', (event) => {
  console.log('⚡ Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical static resources
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      // Cache API responses
      caches.open(API_CACHE).then((cache) => {
        return Promise.all(
          API_ENDPOINTS.map(endpoint => {
            return fetch(endpoint)
              .then(response => {
                if (response.ok) {
                  return cache.put(endpoint, response.clone());
                }
              })
              .catch(() => {
                // Silently fail for API pre-caching
              });
          })
        );
      })
    ]).then(() => {
      console.log('⚡ Service Worker: Pre-caching completed');
      return self.skipWaiting();
    })
  );
});

// 🔄 Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== STATIC_CACHE &&
            cacheName !== API_CACHE
          ) {
            console.log('⚡ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('⚡ Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// 🌐 Fetch Event - Intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ⚡ Different strategies for different types of requests
  if (request.method === 'GET') {
    // Static assets - Cache First
    if (isStaticAsset(url)) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    }
    // API calls - Network First with fallback
    else if (isAPICall(url)) {
      event.respondWith(networkFirstWithFallback(request, API_CACHE));
    }
    // Navigation requests - Network First
    else if (isNavigationRequest(request)) {
      event.respondWith(networkFirstNavigation(request));
    }
    // Other requests - Network only
    else {
      event.respondWith(fetch(request));
    }
  }
});

// 🎯 Helper Functions

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/static/') ||
    url.pathname.includes('.css') ||
    url.pathname.includes('.js') ||
    url.pathname.includes('.woff') ||
    url.pathname.includes('.woff2') ||
    url.pathname.includes('.png') ||
    url.pathname.includes('.jpg') ||
    url.pathname.includes('.ico')
  );
}

function isAPICall(url) {
  return url.pathname.startsWith('/api/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// 📦 Cache First Strategy (for static assets)
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached version immediately
      fetchAndUpdateCache(request, cache); // Update in background
      return cachedResponse;
    }
    
    // If not in cache, fetch and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('⚡ Cache First failed:', error);
    return new Response('Service Unavailable', { status: 503 });
  }
}

// 🌐 Network First with Fallback (for API calls)
async function networkFirstWithFallback(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Fallback to cache
    console.log('⚡ Network failed, trying cache for:', request.url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 🧭 Network First for Navigation
async function networkFirstNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Fallback to cached index.html
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match('/');
    return cachedResponse || new Response('App Offline', { status: 503 });
  }
}

// 🔄 Background cache update
async function fetchAndUpdateCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silent fail for background updates
  }
}

// 🧹 Periodic cache cleanup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    cleanupOldCacheEntries();
  }
});

async function cleanupOldCacheEntries() {
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();
  
  const cacheNames = [STATIC_CACHE, API_CACHE];
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const cacheDate = new Date(dateHeader).getTime();
          if (now - cacheDate > maxAge) {
            await cache.delete(request);
          }
        }
      }
    }
  }
}

console.log('⚡ DWF Helpdesk Service Worker loaded successfully');