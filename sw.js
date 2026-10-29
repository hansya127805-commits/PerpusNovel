/* Service worker: aplikasi tetap bisa dibuka tanpa internet.
   Ganti angka VERSI setiap kali kamu mengunggah index.html baru agar cache diperbarui. */
const VERSI = 'v1';
const CACHE = 'perpus-novel-' + VERSI;
const INTI = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(INTI)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('perpus-novel-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* File milik aplikasi: ambil dari cache dulu, perbarui diam-diam di latar */
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(hit => {
        const jaringan = fetch(req).then(res => {
          if (res && res.ok) { const salin = res.clone(); caches.open(CACHE).then(c => c.put(req, salin)); }
          return res;
        }).catch(() => hit);
        return hit || jaringan;
      })
    );
    return;
  }

  /* Pustaka PDF & font Arab: disimpan setelah pertama kali dipakai, lalu bisa offline */
  if (/(^|\.)(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)$/.test(url.hostname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const salin = res.clone();
        caches.open(CACHE).then(c => c.put(req, salin));
        return res;
      }))
    );
  }
});
