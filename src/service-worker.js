"use strict";

var cachedVersion = 'tmp'; // tmp will force a cache reset..

self.addEventListener("install", function(event) {

  console.log('WORKER: install event in progress.');
  self.skipWaiting();
});

self.addEventListener("fetch", function(event) {
  //console.log('WORKER: fetch event in progress.');

  if (event.request.method !== 'GET' || event.request.url.endsWith('/favicon.ico')) {
    console.log('WORKER: fetch event ignored.', event.request.method, event.request.url);
    return;
  }

  // if /index.html
  event.respondWith(
    (function(){
      var url = new URL(event.request.url);
      if (url.pathname == "/") {
        var response;
        return fetch(event.request)
        .then((_response)=>{
          response = _response;
        })
        .then(()=>{return checkVersion(response.clone())})
        .then(()=>{return addToCache(response.clone())})
        .then(()=>{
          return response;
        })
        .catch((err)=>{
          if (err.message == 'Failed to fetch') {
            return caches.match(event.request)
            .then((cached)=>{
              return cached;
            })
          } else {
            console.log(err)
            return unableToResolve()
          }
        })
      } else {
        // cache first, then network
        return caches.match(event.request)
        .then((cached)=>{
          if (cached == null) {
            return fetch(event.request)
            .then(async (response)=>{
              await addToCache(response.clone())
              return response
            })
          } else {
            return cached;
          }
        })
      }
    })()
  )

  function addToCache(response) {
    return caches.open(cachedVersion)
    .then((cache)=>{
      return cache.put(event.request, response);
    })
  }

  function checkVersion(clone) {
    var reader = clone.body.getReader();
    return reader.read()
    .then((chunk)=>{
      var string = new TextDecoder("utf-8").decode(chunk.value);
      var pos = string.indexOf("?v")
      if (pos >= 0) {
        pos = pos + 1
        var endpos = string.indexOf("\"", pos)
        var newVersion = string.substr(pos, endpos - pos)
        return newVersion;
      } else {
        return '';
      }
    })
    .then((newVersion)=>{
      if (newVersion == '')
        newVersion = 'develop';
      if (newVersion != cachedVersion) {
        console.log('erasing old app cache');
        return caches.keys()
        .then(function (keys) {
          return Promise.all(
            keys.filter(function (key) {
              return !key.startsWith(newVersion);
            })
            .map(function (key) {
              return caches.delete(key);
            })
          );
        })
        .then(()=>{
          cachedVersion = newVersion;
        })
      }
    })
  }

  function unableToResolve () {
    console.log('WORKER: fetch request failed in both cache and network.');

    return new Response('<h1>Service Unavailable</h1>', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/html'
      })
    });
  }

});

self.addEventListener("activate", function(event) {
  console.log('WORKER: activate event in progress.');
  clients.claim();
});

self.addEventListener("message", (event)=>{
  if (event.data == "clearAssets") {
    console.log("clearing all assets");
    caches.keys()
    .then(function (keys) {
      for (var a = 0; a < keys.length; a++ ) {
        caches.delete(keys[a]);
      }
    })
  }
})