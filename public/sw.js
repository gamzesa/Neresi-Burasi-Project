// Neresi Burası? servis işçisi: yalnızca bağlantı yokken sayfa açılışında "çevrimdışı" sayfasını gösterir.
// Başka hiçbir isteğe karışmaz (API, harita dosyaları ve oyun verisi her zaman ağdan gelir); eski veri sunmaz.
const CACHE = "neresi-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // Yalnızca sayfa gezintileri; API ve diğer istekler tarayıcıya bırakılır.
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
