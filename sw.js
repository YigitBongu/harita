/* Basit service worker: uygulama kabuğu önceden, harita karoları ve yazı tipleri çalışırken önbelleğe alınır. */
const SHELL = 'harita-shell-v1';
const DATA = 'harita-data-v1';
const MAX_DATA = 1200;
const SHELL_FILES = [
  './', 'index.html', 'app.js', 'style.js', 'icons.js', 'manifest.webmanifest',
  'vendor/maplibre-gl.js', 'vendor/maplibre-gl.css',
  'icons/icon-192.png', 'icons/icon-512.png',
];
const DATA_HOSTS = ['tiles.openfreemap.org', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== DATA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_DATA) await Promise.all(keys.slice(0, keys.length - MAX_DATA).map((k) => cache.delete(k)));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // harita verisi / yazı tipleri: önce önbellek, arkada güncelle
  if (DATA_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(DATA).then(async (cache) => {
        const hit = await cache.match(req);
        const net = fetch(req).then((res) => {
          if (res && res.ok) { cache.put(req, res.clone()); trim(cache); }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  // uygulama kabuğu: önce ağ (güncel kalsın), olmazsa önbellek
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((m) => m || caches.match('index.html')))
    );
  }
});
