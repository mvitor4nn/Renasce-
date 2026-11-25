const V = 'renasce-v2';
const FILES = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];
const isFont = u => u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);

  // Fontes: usa o cache primeiro (funciona offline depois da primeira visita).
  if (isFont(u)) {
    e.respondWith(
      caches.match(e.request).then(m => m || fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(V).then(c => c.put(e.request, copy));
        return r;
      }))
    );
    return;
  }

  // Arquivos do app: rede primeiro (pega atualizações); offline usa o cache.
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r && r.ok) {
          const copy = r.clone();
          caches.open(V).then(c => c.put(e.request, copy));
        }
        return r;
      })
      .catch(() => caches.match(e.request).then(m => m || caches.match('index.html')))
  );
});
