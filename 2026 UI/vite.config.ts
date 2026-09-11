import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const LOGS_DIR = resolve(ROOT, 'logs');

// Dev-only endpoint: the Study Recorder POSTs a recorded session to
// `/save-activity` and it is written to <project>/logs/activity-<ts>.json.
// (Browsers can't write to disk; this runs on the Vite dev server.)
function sessionLogger(): Plugin {
  return {
    name: 'study-session-logger',
    configureServer(server) {
      server.middlewares.use('/save-activity', (req, res, next) => {
        if (req.method !== 'POST') return next();
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            mkdirSync(LOGS_DIR, { recursive: true });
            const cond = new URL(req.url || '/', 'http://localhost').searchParams.get('condition');
            const suffix = cond === '1' || cond === '2' ? `cond${cond}-` : '';
            const name = `activity-${suffix}${Date.now()}.json`;
            writeFileSync(resolve(LOGS_DIR, name), body, 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, file: `logs/${name}` }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: String(err) }));
          }
        });
      });
    },
  };
}

// Each condition runs on its own port, and a PWA is scoped per origin — so the
// two ports install as two separate home-screen apps. This serves a different
// manifest (name + badged icon) depending on which port the request came in on,
// so the icon on the tablet says which build it is.
//
// display:'fullscreen' is what hides the Android status/navigation bars once the
// app is launched from the home screen.
const PWA_CONDITIONS: Record<string, { n: 1 | 2; name: string; short: string }> = {
  '5172': { n: 1, name: 'SmartHotel — Dashboard', short: 'SH Dashboard' },
  '5173': { n: 2, name: 'SmartHotel — Floor Map', short: 'SH Floor Map' },
};

function manifestFor(port: string) {
  const c = PWA_CONDITIONS[port] ?? { n: 1 as const, name: 'SmartHotel', short: 'SmartHotel' };
  return {
    // Each condition gets its OWN SCOPE (/c1/, /c2/), not just its own start_url.
    // Android derives a WebAPK's package identity from the scope, so two apps
    // that both declared scope '/' — differing only by port — were treated as the
    // same app and the second install replaced the first. Distinct scopes make
    // them genuinely separate installs.
    //
    // Vite's SPA fallback serves index.html at these paths, and every asset in
    // index.html is an absolute URL, so the app loads normally from a sub-path.
    // ?condition=N is read by getCondition() in App.tsx, so each app opens its
    // own build regardless of the port it was installed from.
    id: `/c${c.n}/`,
    name: c.name,
    short_name: c.short,
    description: 'Smart Hotel room control for the OFFIS smart-home study.',
    start_url: `/c${c.n}/?condition=${c.n}`,
    scope: `/c${c.n}/`,
    display: 'fullscreen',
    display_override: ['fullscreen', 'standalone'],
    // No `orientation` on purpose. Declaring it — including "any" — makes the
    // installed WebAPK request a fixed screen orientation from Android ("any"
    // becomes full-sensor), which OVERRIDES the tablet's auto-rotate lock: the
    // app kept rotating while every other app stayed put. Omitting the field
    // leaves the activity unspecified, so it follows the system setting.
    background_color: '#DCD6CA',
    theme_color: '#E0992F',
    icons: [
      { src: `/icon-cond${c.n}-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `/icon-cond${c.n}-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `/icon-cond${c.n}-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

type Req = { url?: string; headers: Record<string, unknown> };
type Res = { statusCode: number; setHeader: (k: string, v: string) => void; end: (b?: string) => void };

const portOf = (req: Req) => String(req.headers.host ?? '').split(':')[1] ?? '';

function pwaManifest(): Plugin {
  const manifest = (req: Req, res: Res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(manifestFor(portOf(req)), null, 2));
  };

  // The app now lives at /c1/ and /c2/ so each condition has its own PWA scope.
  // Opening the bare root would land OUTSIDE that scope (Chrome only offers to
  // install from a page inside it), so send / straight to the right sub-path.
  const rootRedirect = (req: Req, res: Res, next: () => void) => {
    if (req.url !== '/') return next();          // assets, /@vite, /c1/... pass through
    const c = PWA_CONDITIONS[portOf(req)];
    if (!c) return next();
    res.statusCode = 302;
    res.setHeader('Location', `/c${c.n}/`);
    res.end();
  };

  const attach = (server: { middlewares: { use: (...a: never[]) => void } }) => {
    (server.middlewares.use as unknown as (fn: typeof rootRedirect) => void)(rootRedirect);
    (server.middlewares.use as unknown as (p: string, fn: typeof manifest) => void)('/manifest.webmanifest', manifest);
  };

  return {
    name: 'pwa-manifest',
    configureServer(server) { attach(server as never); },
    configurePreviewServer(server) { attach(server as never); },
  };
}

// HTTPS is opt-in and switches on only once `bash scripts/make-certs.sh` has been
// run. Android/Chrome will not install the app as a real PWA (the thing that
// actually hides the browser + system bars) unless the origin is genuinely
// secure — a plain http LAN address only ever yields a bookmark. Without the
// certs present the server still starts on http, so a fresh checkout works.
const CERT_FILE = resolve(ROOT, 'certs', 'cert.pem');
const KEY_FILE = resolve(ROOT, 'certs', 'key.pem');
const httpsOptions = existsSync(CERT_FILE) && existsSync(KEY_FILE)
  ? { cert: readFileSync(CERT_FILE), key: readFileSync(KEY_FILE) }
  : undefined;

export default defineConfig({
  plugins: [react(), tailwindcss(), sessionLogger(), pwaManifest()],
  server: {
    host: true, // allow access from other devices on the network
    https: httpsOptions,
    proxy: {
      '/api': {
        target: 'http://localhost:8123',
        changeOrigin: true,
        secure: false,
        ws: true, // proxy the Home Assistant WebSocket (/api/websocket) too, so
                  // other devices connect through this dev server, not HA directly
      },
    },
  },
});
