'use strict';

const cacheBaseName = 'restaurant-reviews';
const cacheStatic = `${cacheBaseName}-static`;
const cacheImages = `${cacheBaseName}-images`;
const version = 'v1.0.0';

/**
 * Cache html/css/js/json and images in their respective caches
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(`${cacheStatic}-${version}`)
      .then(cache => {
        return cache.addAll([
          '/',
          'index.html',
          'restaurant.html',
          'css/styles.css',
          'js/dbhelper.js',
          'js/main.js',
          'js/restaurant_info.js',
          'data/restaurants.json'
        ])
      })
  );
});

/**
 * On fetch event, check cache for match and return from cache if present,
 * otherwise, continue fetch request to network, then cache the network's response
 */
self.addEventListener('fetch', event => {
  const options = {ignoreSearch: true};
  event.respondWith(
    caches.match(event.request, options)
      .then(response => {
        // if requested asset in cache, return cached asset as response
        if (response) return response;

        const fetchRequest = event.request.clone();

        // if requested asset not in cache, get from network
        return fetch(fetchRequest)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') return response;
            // clone response to enter into cache
            const responseToCache = response.clone();
            // select cache name based on request destination
            const cacheTarget = ((fetchRequest.destination === 'image') ? cacheImages: cacheStatic) + `-${version}`;
            caches.open(cacheTarget)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => console.log('uh-oh', err));
            return response;
          });
      })
      .catch(err => console.log('uh-oh', err))
  );
});

/**
 * On activate event, delete all caches that are not on the current version
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            return cacheName.startsWith(cacheBaseName)
              && !cacheName.endsWith(version);
          })
          .map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      })
      .catch(err => console.log('uh-oh', err))
  );
});

self.addEventListener('error', event => {
  console.log('SW error', event);
});
