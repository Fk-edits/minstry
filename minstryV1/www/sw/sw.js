const CACHE_NAME = 'ethio-ministry-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/signup.html',
  '/dashboard.html',
  '/admin.html',
  '/note.html',
  '/exam.html',
  '/subject-detail.html',
  '/result.html',
  '/payment.html',
  '/settings.html',
  '/css/global.css',
  '/css/theme.css',
  '/css/login.css',
  '/css/dashboard.css',
  '/css/admin.css',
  '/css/note.css',
  '/css/exam.css',
  '/css/result.css',
  '/js/firebase-config.js',
  '/js/modules/languages.js',
  '/js/modules/utils.js',
  '/js/modules/auth.js',
  '/js/modules/dashboard.js',
  '/js/modules/admin.js',
  '/js/modules/note.js',
  '/js/modules/exam.js',
  '/js/modules/result.js',
  '/js/modules/subject-detail.js',
  '/js/modules/payment.js',
  '/js/modules/settings.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request).then(networkResponse => {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return networkResponse;
      }).catch(() => new Response('Offline')))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});