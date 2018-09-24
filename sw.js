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
 * Parse event routing and return data needed to determine
 * which handler to use
 */
const createRoutingObject = event => {
  let id = -1;
  const url = new URL(event.request.url);
  const ref = event.request.referrer;
  if (ref.indexOf('restaurant.html') != -1) {
    const index = ref.indexOf('=') + 1;
    id = parseInt(ref.slice(index));
  }
  const method = event.request.method.toUpperCase();
  return {
    url: url,
    port: url.port,
    id: id,
    method: method
  };
}

/**
 * Handle fetch event for database
 * get from idb and fallback to network
 * if request from detail page, use id in url to fetch single record
 * else get all records - force fetch on first call for all records
 */
const handleDBGetRequest = (event, id) => {
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
      const idbRead = db.transaction(path).objectStore(path);
      // get all idb records for restaurants
      return idbRead.getAll()
        .then(response => {
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
 * Handle fetch event for POST, PUT, and DELETE methods
 * Update IDB with server response
 * Continue with fetch request and send response back to caller
 */
const handleDBChangeRequest = (event, id) => {
  console.log(event.request);
  const parseURL = new URL(event.request.url);
  console.log(parseURL);
  let pathname = parseURL.pathname.substring(1, parseURL.pathname.length);
  let path = (pathname.includes('/')) ? pathname.split('/')[0]: pathname;
  console.log(path);
  const queryParams = parseURL.searchParams;
  console.log(queryParams);
  const method = event.request.method;
  if (method == 'POST' || method == 'PUT') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          console.log('handleDBChangeRequest fetch finished');
          if ((method == 'POST' && res.status == 201) || (method == 'PUT' && res.status == 200)) {
            return res.json()
              .then(data => {
                return dbPromise.then(db => {
                  console.log('writing to idb', data);
                  const idbWrite = db.transaction(path, 'readwrite').objectStore(path);
                  idbWrite.put(data);
                  return data;
                })
                .catch(err => console.log(`${path} idb error`, err));
              })
              .catch(err => console.log(`${path} post response parse error`, err));
          } else {
            console.log(`An error occurred during ${method} request, `, res.statusText);
          }
        })
        .then(response => new Response(JSON.stringify(response)))
        .catch(err => console.log('reviews post request error', err))
      );
  } else if (method == 'DELETE') {
    const key = pathname.split('/')[1];
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res.status == 200) {
            return dbPromise.then(db => {
              const idbWrite = db.transaction(path, 'readwrite').objectStore(path);
              idbWrite.delete(parseInt(key));
            })
            .catch(err => console.log('IDB deletion error', err));
          }
        })
        .then(response => new Response(JSON.stringify(response)))
        .catch(err => console.log('Deletion fetch error', err))
    )
  }
}

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
  const routing = createRoutingObject(event);
  if (routing.port == "1337") {
    if (routing.method == 'GET') {
      handleDBGetRequest(event, routing.id);
    } else {
      console.log(`${routing.method} request made by ${routing.url}`);
      handleDBChangeRequest(event, routing.id);
    }
  } else if (routing.port == "8000" || routing.port == "3000") {
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
 * Handle background sync
 */
self.addEventListener('sync', event => {
  if (event.tag === 'bg-sync') {
    console.log('sync event');
    // event.waitUntil(
    //   const routing = createRoutingObject(event);
    //   handleDBChangeRequest(event, event.id);
    // );
  }
})

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
