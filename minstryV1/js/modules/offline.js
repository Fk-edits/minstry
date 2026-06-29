// ============================================================
// OFFLINE MODULE – Service Worker Registration
// ============================================================

/**
 * Register the service worker for offline caching
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.warn('⚠️ Service Worker registration failed:', error);
        });
    });
  }
}

/**
 * Check if the app is online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onNetworkChange(callback) {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
}