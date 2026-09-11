/**
 * Minimal service worker — its only job is to make Android/Chrome treat this
 * site as an installable app (Chrome requires a registered SW with a fetch
 * handler before it will create a home-screen WebAPK).
 *
 * It deliberately does NOT cache anything. This dashboard shows live Home
 * Assistant state, and serving a stale cached view during a study session would
 * be far worse than simply failing, so every request goes to the network.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  // Only page navigations are handled, and only as a straight passthrough.
  // Everything else (API calls, the HA websocket, HMR) is left untouched.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
  }
});
