'use strict';

var cacheBaseName = 'restaurant-reviews';
var cacheStatic = cacheBaseName + '-static';
var cacheImages = cacheBaseName + '-images';
var version = 'v1.0.1';

/**
 * Cache html/css/js/json
 */
self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(cacheStatic + '-' + version).then(function (cache) {
    return cache.addAll(['/', 'index.html', 'restaurant.html', 'css/styles.css', 'js/index.js', 'js/main.js', 'js/restaurant_info.js', 'js/register-sw.js']);
  }));
});

/**
 * On fetch event, check cache for match and return from cache if present,
 * otherwise, continue fetch request to network, then cache the network's response
 */
self.addEventListener('fetch', function (event) {
  var options = { ignoreSearch: true };
  event.respondWith(caches.match(event.request, options).then(function (response) {
    // if requested asset in cache, return cached asset as response
    if (response) return response;

    var fetchRequest = event.request.clone();

    // if requested asset not in cache, get from network
    return fetch(fetchRequest).then(function (response) {
      if (!response || response.status !== 200 || response.type !== 'basic') return response;
      // clone response to enter into cache
      var responseToCache = response.clone();
      // select cache name based on request destination
      var cacheTarget = (fetchRequest.destination === 'image' ? cacheImages : cacheStatic) + ('-' + version);
      caches.open(cacheTarget).then(function (cache) {
        cache.put(event.request, responseToCache);
      }).catch(function (err) {
        return console.log('uh-oh', err);
      });
      return response;
    });
  }).catch(function (err) {
    return console.log('uh-oh', err);
  }));
});

/**
 * On activate event, delete all caches that are not on the current version
 */
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames.filter(function (cacheName) {
      return cacheName.startsWith(cacheBaseName) && !cacheName.endsWith(version);
    }).map(function (cacheName) {
      return caches.delete(cacheName);
    }));
  }).catch(function (err) {
    return console.log('uh-oh', err);
  }));
});

/**
 * Handle service worker error event
 */
self.addEventListener('error', function (event) {
  console.log('SW error', event);
});

/**
 * Portions of this page are modifications based on work created and shared by
 * Google and used according to terms described in the Creative Commons 3.0
 * Attribution License.
 *
 * https://developers.google.com/web/fundamentals/primers/service-workers/
 */