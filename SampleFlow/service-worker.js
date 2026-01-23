// service-worker.js - Final Resilient Version
const CACHE_NAME = 'sampleflow-v10'; // Updated version to force reload
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// 1. Install & Force Activation (Resilient Mode)
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We use map + add + catch to ensure the worker installs 
      // even if one icon file is missing from the server.
      return Promise.allSettled(
        ASSETS.map(asset => {
          return cache.add(asset).catch(err => 
            console.warn(`PWA Service Worker: Skipping missing asset ${asset}`)
          );
        })
      );
    })
  );
});

// 2. Cleanup Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('PWA Service Worker: Cleaning up old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) 
  );
});

// 3. Network-First Strategy
self.addEventListener('fetch', (event) => {
  // Only cache GET requests (prevents issues with Supabase/API calls)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
