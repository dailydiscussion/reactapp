// Define the cache name for your PWA assets.
const CACHE_NAME = 'education-dashboard-v1';
// List all the files you want to cache. This includes HTML, CSS, JS, etc.
// Important: Ensure these paths are correct relative to the service worker file.
const urlsToCache = [
  '/', // Caches the root HTML file
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js',
  'https://fonts.googleapis.com/css2?family=Josefin+Sans&family=Kalnia:wght@600&family=Lemon&family=Raleway:wght@700&family=Tilt+Prism&display=swap',
  // Placeholder images for icons (replace with actual icons if you have them)
  'https://placehold.co/192x192/2563eb/ffffff?text=ED',
  'https://placehold.co/512x512/2563eb/ffffff?text=ED',
  'https://placehold.co/48x48/007bff/ffffff?text=🔔',
  'https://placehold.co/80x80/E2E8F0/4A5568?text=NK'
];

// Install event: caches all the essential assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install Event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event: cleans up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate Event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: intercepts network requests and serves from cache if available
self.addEventListener('fetch', (event) => {
  // We only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Define a network-first strategy for most requests,
  // falling back to cache if network is unavailable.
  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        // If the network request was successful, cache the new response
        // Do not cache opaque responses (e.g., from different origins that don't support CORS)
        if (response.ok || response.type === 'opaque') {
          const cache = await caches.open(CACHE_NAME);
          // Put a clone of the response into the cache
          cache.put(event.request, response.clone());
        }
        return response; // Return the network response
      })
      .catch(async () => {
        // If network request fails, try to serve from cache
        console.log('Service Worker: Network failed, serving from cache:', event.request.url);
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // If not in cache, fallback for specific content types (e.g., HTML pages)
        // For example, if it's a navigation request and no cache, you might serve an offline page.
        // For this app, simply return a generic offline response or let it fail if not in cache.
        if (event.request.mode === 'navigate') {
          // You could return a custom offline.html here if you had one
          // return caches.match('/offline.html');
          return new Response('<h1>You are offline!</h1><p>Please check your internet connection.</p>', {
            headers: { 'Content-Type': 'text/html' }
          });
        }
      })
  );
});
