'use strict';

importScripts('/js/idb.js');
const cacheBaseName = 'restaurant-reviews';
const cacheStatic = `${cacheBaseName}-static`;
const cacheImages = `${cacheBaseName}-images`;
const version = 'v1.0.0';
let initComplete = false;

const dbPromise = idb.open('restaurantDB', 2, upgradeDb => {
    switch(upgradeDb.oldVersion) {
      case 0:
        const store = upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id'
        });
      case 1:
        const reviewStore = upgradeDb.createObjectStore('reviews', {
          keyPath: 'id'
        });
    }
  });

/**
 * Cache html/css/js/json
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
          'js/idb.js',
          'js/dbhelper.js',
          'js/main.js',
          'js/restaurant_info.js',
          'img/icons/restaurant-icon-sm.png',
          'img/map/staticmap.webp',
          'img/map/staticmap.png'
        ])
      })
  );
});

/**
 * Handle fetch event for database
 * get from idb and fallback to network
 * if request from detail page, use id in url to fetch single record
 * else get all records - force fetch on first call for all records
 */
const handleDBRequest = (event, id) => {
  let url = event.request.url;
  console.log(event.request);
  const parseURL = new URL(event.request.url);
  const path = parseURL.pathname.substring(1, parseURL.pathname.length);
  if (path == 'restaurants' && id != -1) {
    url = `${event.request.url}/${id}`;
  }

  let newHeaders = new Headers();
  for (let oldHeader of event.request.headers.entries()) {
    newHeaders.append(oldHeader[0], oldHeader[1]);
  }
  newHeaders.append('content-type', 'application/json');

  /**
   * create new request from fetch request data substituting
   * url based on if an id for a detail page is present
   * and add headers for JSON
   */
  console.log(`For path ${path}, using url ${url}`);
  const newRequest = new Request(url, {
    method: event.request.method,
    headers: newHeaders,
    body: event.request.body,
    referrer: event.request.referrer,
    referrerPolicy: event.request.referrerPolicy,
    mode: event.request.mode,
    credentials: event.request.credentials,
    cache: event.request.cache,
    redirect: event.request.redirect,
    integrity: event.request.integrity
  });

  event.respondWith(
    dbPromise.then(db => {
      console.log(path);
      const idbRead = db.transaction(path).objectStore(path);
      // get all idb records for restaurants
      return idbRead.getAll()
        .then(response => {
          console.log('should be', path, id);
          console.log(response);
          /**
           *if id is not -1, a single record is requested,
           * return that record from idb if present
           */
          if ((path == 'restaurants' && id != -1) && response && response.length) return response.find(r => r.id == id);
          // if requesting all records and not first page load, return all idb records
          else if (initComplete && response && response.length) return response;

          // get records from network - single record for detail, all for home
          return fetch(newRequest)
            .then(networkResponse => networkResponse.json())
            .then(parsed => {
              // add records to idb
              const idbWrite = db.transaction(path, 'readwrite').objectStore(path);
              if (Array.isArray(parsed)) {
                initComplete = true;
                parsed.forEach(record => {
                  idbWrite.put(record);
                });
              } else {
                idbWrite.put(parsed);
              }
              return parsed;
            })
            .catch(err => console.log('DB fetch event failed', err))
        })
        .then(selectedResponse => new Response(JSON.stringify(selectedResponse)))
        .catch(err => console.log('DB fetch failed', err));
    })
  );
};

/**
 * Handle fetch event for assets
 * get from cache and fallback to network
 */
const handleAssetRequest = event => {
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
              .catch(err => console.log('Cache error', err));
            return response;
          });
      })
      .catch(err => console.log('Cache fetch error', err))
  );
}

/**
 * On fetch event, determine by port if event is for json data from Database
 * or a request for assets. port 1337 == db, port 8000 == assets
 */
self.addEventListener('fetch', event => {
  let id = -1;
  const url = new URL(event.request.url);
  const port = url.port;
  if (port == "1337") {
    const ref = event.request.referrer;
    if (ref.indexOf('restaurant.html') != -1) {
      const index = ref.indexOf('=') + 1;
      id = parseInt(ref.slice(index));
    }
    handleDBRequest(event, id);
  } else if (port == "8000") {
    handleAssetRequest(event);
  }
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

/**
 * Handle service worker error event
 */
self.addEventListener('error', event => {
  console.log('SW error', event);
});

/**
 * Portions of this page are modifications based on work created and shared by
 * Google and used according to terms described in the Creative Commons 3.0
 * Attribution License.
 *
 * https://developers.google.com/web/fundamentals/primers/service-workers/
 */
