/* Generated at build time. Only application resources; never user IndexedDB. */
const VERSION = __PWA_VERSION__;
const BUILD = __PWA_BUILD__;
const FILES = __PWA_FILES__;
const PREFIX = 'ege-offline:' + encodeURIComponent(self.registration.scope) + ':';
const CACHE = PREFIX + VERSION;
const resourceUrl = file => new URL(file, self.registration.scope).href;
const INDEX = resourceUrl('index.html');
const RESOURCES = new Set(FILES.map(file => resourceUrl(file.path)));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const results = await Promise.allSettled(FILES.map(async file => {
      const url = resourceUrl(file.path);
      const response = await fetch(new Request(url, { cache: 'no-store', credentials: 'same-origin' }));
      if (!response.ok || response.type === 'opaque') throw new Error('Resource unavailable: ' + file.path);
      const hash = await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer());
      const actual = [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
      if (actual !== file.sha256) throw new Error('Inconsistent deployment: ' + file.path);
      await cache.put(url, response);
    }));
    const failure = results.find(result => result.status === 'rejected');
    if (failure) { await caches.delete(CACHE); throw failure.reason; }
    // No skipWaiting: a different version never replaces the worker of an open lesson.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== new URL(self.registration.scope).origin) return;
  url.search = ''; url.hash = '';
  if (request.mode !== 'navigate' && !RESOURCES.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const response = await cache.match(request.mode === 'navigate' ? INDEX : url.href);
    // Never obtain a missing resource from another release or silently claim offline readiness.
    return response ?? new Response('Учебный комплект недоступен. Подключитесь к сети и откройте приложение заново.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'OFFLINE_STATUS' || !event.ports[0]) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const checks = await Promise.all(FILES.map(file => cache.match(resourceUrl(file.path))));
    event.ports[0].postMessage({ type: 'OFFLINE_STATUS', version: VERSION, build: BUILD, ready: checks.every(Boolean), resources: FILES.length });
  })());
});
