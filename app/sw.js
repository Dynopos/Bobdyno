/* Bob — Self Development Apps · service worker v3
   HTML: network-first (deploy baru muncul serta-merta)
   Aset lain: cache-first (laju + offline) */
const VERSION = 'v33';
const CACHE = 'bobapp-' + VERSION;
const ASSETS = [
  './', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // POST /api/coach lalu terus
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;           // jangan sentuh API

  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // network-first: sentiasa cuba versi terbaru dulu
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // aset: cache-first, segarkan di belakang
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});

/* ── Peringatan latar: berbunyi walaupun app ditutup ──
   Chrome Android, hanya untuk PWA yang dipasang ke home screen.
   Keadaan dibaca dari IndexedDB kerana localStorage tidak boleh dicapai di sini. */

function bacaState() {
  return new Promise(res => {
    let done = false;
    const fail = () => { if (!done) { done = true; res(null); } };
    try {
      const r = indexedDB.open('bobdyno', 1);
      r.onupgradeneeded = () => { try { r.result.createObjectStore('kv'); } catch (e) {} };
      r.onerror = fail;
      r.onsuccess = () => {
        try {
          const g = r.result.transaction('kv', 'readonly').objectStore('kv').get('state');
          g.onsuccess = () => { done = true; res(g.result || null); };
          g.onerror = fail;
        } catch (e) { fail(); }
      };
    } catch (e) { fail(); }
    setTimeout(fail, 4000);
  });
}

const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
              + '-' + String(d.getDate()).padStart(2, '0');

function jurang(lastEntry) {
  if (!lastEntry) return 99;
  const a = new Date(lastEntry + 'T12:00:00'), b = new Date(ymd(new Date()) + 'T12:00:00');
  return Math.max(0, Math.round((b - a) / 864e5));
}

function mesej(st) {
  const gap = jurang(st.lastEntry);
  const n = (st.nama || '').trim() || 'kamu';
  const ayat = st.ayat || {};
  const petik = ayat.ms ? `${ayat.ms} — ${ayat.ref}\n` : '';
  if (gap === 0) return null;                       // dah catat hari ni
  if (gap === 1) return { t: `Satu baris je, ${n}`,
    b: st.janjiTerbuka ? `Janji kamu masih terbuka: "${st.janjiTerbuka}". Catat apa yang berlaku hari ni.`
                       : 'Hari ni belum ada catatan. Satu perkara kecil pun dikira.' };
  if (gap <= 3) return { t: `${gap} hari senyap`, b: petik + 'Satu baris malam ni sudah dikira sebagai gerak.' };
  if (gap <= 7) return { t: `Seminggu tanpa catatan, ${n}`,
    b: petik + 'Kamu tak perlu ganti hari yang hilang. Mula dari malam ni sahaja.' };
  return { t: `Pintu ni masih terbuka, ${n}`,
    b: petik + 'Tiada siapa kira berapa lama kamu hilang. Catat satu perkara.' };
}

async function semak() {
  const st = await bacaState();
  if (!st) return;
  const jam = new Date().getHours();
  if (jam < (st.hour ?? 21)) return;                // belum sampai waktu peringatan
  const m = mesej(st);
  if (!m) return;
  await self.registration.showNotification(m.t, {
    body: m.b, icon: './icons/icon-192.png', badge: './icons/icon-192.png',
    tag: 'bobdyno-nudge', renotify: false, data: { url: './index.html' }
  });
}

self.addEventListener('periodicsync', e => {
  if (e.tag === 'bob-semak') e.waitUntil(semak());
});
self.addEventListener('sync', e => {
  if (e.tag === 'bob-semak') e.waitUntil(semak());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) if ('focus' in c) return c.focus();
    if (self.clients.openWindow) return self.clients.openWindow('./index.html');
  })());
});
