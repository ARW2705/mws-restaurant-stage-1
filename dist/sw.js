"use strict";var cacheBaseName="restaurant-reviews",cacheStatic=cacheBaseName+"-static",cacheImages=cacheBaseName+"-images",version="v1.0.1";self.addEventListener("install",function(e){e.waitUntil(caches.open(cacheStatic+"-"+version).then(function(e){return e.addAll(["/","index.html","restaurant.html","css/styles.css","js/index.js","js/main.js","js/restaurant_info.js","js/register-sw.js"])}))}),self.addEventListener("fetch",function(s){s.respondWith(caches.match(s.request,{ignoreSearch:!0}).then(function(e){if(e)return e;var c=s.request.clone();return fetch(c).then(function(e){if(!e||200!==e.status||"basic"!==e.type)return e;var t=e.clone(),n=("image"===c.destination?cacheImages:cacheStatic)+"-"+version;return caches.open(n).then(function(e){e.put(s.request,t)}).catch(function(e){return console.log("uh-oh",e)}),e})}).catch(function(e){return console.log("uh-oh",e)}))}),self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(e){return Promise.all(e.filter(function(e){return e.startsWith(cacheBaseName)&&!e.endsWith(version)}).map(function(e){return caches.delete(e)}))}).catch(function(e){return console.log("uh-oh",e)}))}),self.addEventListener("error",function(e){console.log("SW error",e)});