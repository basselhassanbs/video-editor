let CACHE_NAME = 'my-site-cache-v1';
const urlsToCache = ['/', '/index.html'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', function (event) {
  const request = event.request;
  event.respondWith(
    caches.match(request).then(function (response) {
      if (response) {
        // If we have a cached response, clone it to modify the headers
        let modifiedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers(response.headers),
        });

        // Set the desired headers
        modifiedResponse.headers.set(
          'Cross-Origin-Opener-Policy',
          'same-origin'
        );
        modifiedResponse.headers.set(
          'Cross-Origin-Embedder-Policy',
          'require-corp'
        );

        return modifiedResponse;
      }

      // Fetch from network if not available in cache
      return fetch(request).then(function (networkResponse) {
        // Cache the fetched response
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, networkResponse.clone());
        });

        // Modify the network response headers before returning
        let modifiedNetworkResponse = new Response(networkResponse.body, {
          status: networkResponse.status,
          statusText: networkResponse.statusText,
          headers: new Headers(networkResponse.headers),
        });

        modifiedNetworkResponse.headers.set(
          'Cross-Origin-Opener-Policy',
          'same-origin'
        );
        modifiedNetworkResponse.headers.set(
          'Cross-Origin-Embedder-Policy',
          'require-corp'
        );

        return modifiedNetworkResponse;
      });
    })
  );
});

self.addEventListener('fetch', function (event) {
  const request = event.request;

  // Check if the request includes a Range header
  const range = request.headers.get('Range');
  if (range) {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          return response.arrayBuffer();
        })
        .then(function (buffer) {
          const [start, end] = range.replace(/bytes=/, '').split('-');
          const startByte = parseInt(start, 10);
          const endByte = end ? parseInt(end, 10) : buffer.byteLength - 1;
          const slicedBuffer = buffer.slice(startByte, endByte + 1);
          const slicedBlob = new Blob([slicedBuffer]);
          return new Response(slicedBlob, {
            status: 206,
            statusText: 'Partial Content',
            headers: [
              [
                'Content-Range',
                `bytes ${startByte}-${endByte}/${buffer.byteLength}`,
              ],
              ['Content-Type', response.headers.get('Content-Type')],
              ['Cross-Origin-Opener-Policy', 'same-origin'],
              ['Cross-Origin-Embedder-Policy', 'require-corp'],
            ],
          });
        })
    );
  } else {
    event.respondWith(
      fetch(request).then(function (response) {
        return caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, response.clone());
          return response;
        });
      })
    );
  }
});
