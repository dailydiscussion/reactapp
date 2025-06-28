// Define the cache name for your PWA assets.
// IMPORTANT: Increment this version number when you make changes to files
// listed in urlsToCache or core application logic to ensure users get the latest updates.
const CACHE_NAME = 'education-dashboard-v2'; // <--- UPDATED CACHE NAME

// List all the files you want to cache. This includes HTML, CSS, JS, etc.
// Important: Ensure these paths are correct relative to the service worker file.
const urlsToCache = [
  '/', // Caches the root HTML file
  '/index.html',
  '/manifest.json',
  // Your CDN links for libraries and fonts
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
  // Add any other static assets (e.g., custom CSS files, images) here
  // For example, if you move your inline CSS to style.css:
  // '/style.css'
];

// During the install phase, cache all static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install Event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Caching failed', error);
      })
  );
});

// Activate event: Clean up old caches
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

// Fetch event: Implement caching strategies
self.addEventListener('fetch', (event) => {
  // Check if the request is for a cached URL (e.g., main app resources)
  const requestUrl = new URL(event.request.url);
  const isPrecachedAsset = urlsToCache.includes(requestUrl.href) || urlsToCache.includes(requestUrl.pathname);

  // Strategy for pre-cached assets (Cache-First, with network revalidation)
  // This is a form of Stale-While-Revalidate for precached items.
  if (isPrecachedAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // If network is successful, update the cache
          if (networkResponse.ok || networkResponse.type === 'opaque') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          // If network fails for a precached asset, return cached response if available
          return cachedResponse || new Response('<h1>Offline Content Unavailable</h1><p>The requested content is not available offline.</p>', { headers: { 'Content-Type': 'text/html' } });
        });

        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return; // Stop further processing for precached assets
  }

  // Default strategy for all other requests (Network-First, then Cache Fallback)
  // This is good for dynamic content or assets not explicitly precached.
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
        if (event.request.mode === 'navigate') {
          // You could return a custom offline.html here if you had one
          return new Response('<h1>You are offline!</h1><p>Please check your internet connection.</p>', {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        // For other types of requests (e.g., images, scripts) that are not cached and network fails,
        // you might want to return an empty response or a generic fallback.
        // For now, it will effectively return nothing, leading to a network error in the browser.
      })
  );
});