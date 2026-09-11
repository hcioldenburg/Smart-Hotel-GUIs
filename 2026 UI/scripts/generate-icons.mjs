/**
 * Generates the PWA home-screen icons for both study conditions.
 *
 * Each icon is the SmartHotel mark (amber rounded square + house glyph, matching
 * TopBar) with a small badge in the corner saying which build it is:
 *   condition 1 -> Dashboard  (grid badge)
 *   condition 2 -> Floor Map  (floor-plan badge)
 *
 * No image libraries are available here, so this rasterises the shapes itself
 * (4x supersampled for smooth edges) and writes real PNGs using Node's zlib.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public');

// Brand palette (src/index.css)
const AMBER = [224, 153, 47, 255]; // --c-amber
const HOUSE = [42, 32, 8, 255];    // house stroke on amber
const DARK = [37, 36, 42, 255];    // --c-ink, badge fill
const CREAM = [244, 241, 234, 255]; // --c-panel, badge glyph + ring

const SS = 4; // supersampling factor

/* ---------- geometry helpers ---------- */

// Signed distance to a rounded rectangle (<= 0 means inside).
function sdRoundRect(px, py, x, y, w, h, r) {
  const qx = Math.abs(px - (x + w / 2)) - (w / 2 - r);
  const qy = Math.abs(py - (y + h / 2)) - (h / 2 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / len2));
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

// Minimum distance from a point to a polyline (optionally closed).
function distToPolyline(px, py, pts, closed) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    d = Math.min(d, distToSegment(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  }
  if (closed && pts.length > 1) {
    const a = pts[pts.length - 1], b = pts[0];
    d = Math.min(d, distToSegment(px, py, a[0], a[1], b[0], b[1]));
  }
  return d;
}

/* ---------- icon composition ---------- */

/**
 * Builds the layer list for one icon. Each layer is { hit(x,y), color }, painted
 * in order (later layers win). Coordinates are in device pixels.
 */
function buildLayers(size, condition, maskable) {
  const layers = [];

  // Background. Maskable icons must bleed to the edges (the launcher applies its
  // own mask); plain "any" icons carry their own rounded corners.
  if (maskable) {
    layers.push({ hit: () => true, color: AMBER });
  } else {
    const r = size * 0.2;
    layers.push({ hit: (x, y) => sdRoundRect(x, y, 0, 0, size, size, r) <= 0, color: AMBER });
  }

  // Content box: shrunk into the safe zone for maskable icons.
  const C = size * (maskable ? 0.76 : 0.98);
  const c0 = (size - C) / 2;

  // --- House glyph (same shape as the TopBar logo, 24x24 viewBox) ---
  const hs = C * 0.60;                 // glyph size
  const hx = c0 + C * 0.06;            // nudged up-left to clear the badge
  const hy = c0 + C * 0.05;
  const V = (vx, vy) => [hx + (vx / 24) * hs, hy + (vy / 24) * hs];
  const stroke = (2.2 / 24) * hs;      // matches strokeWidth 2.2 in the SVG
  const half = stroke / 2;

  const outline = [V(3, 9.5), V(12, 3), V(21, 9.5), V(21, 21), V(3, 21)];
  const door = [V(9, 21), V(9, 12), V(15, 12), V(15, 21)];
  layers.push({ hit: (x, y) => distToPolyline(x, y, outline, true) <= half, color: HOUSE });
  layers.push({ hit: (x, y) => distToPolyline(x, y, door, false) <= half, color: HOUSE });

  // --- Condition badge (bottom-right) ---
  const bcx = c0 + C * 0.755;
  const bcy = c0 + C * 0.755;
  const br = C * 0.235;
  const ring = C * 0.035;

  // Cream ring separates the dark badge from the amber field.
  layers.push({ hit: (x, y) => Math.hypot(x - bcx, y - bcy) <= br + ring, color: CREAM });
  layers.push({ hit: (x, y) => Math.hypot(x - bcx, y - bcy) <= br, color: DARK });

  if (condition === 1) {
    // Dashboard: 2x2 grid of rounded tiles (grouped device cards).
    const t = br * 0.36;   // tile size
    const g = br * 0.10;   // gap from centre
    const rr = t * 0.28;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const x0 = bcx + (sx < 0 ? -g - t : g);
        const y0 = bcy + (sy < 0 ? -g - t : g);
        layers.push({ hit: (x, y) => sdRoundRect(x, y, x0, y0, t, t, rr) <= 0, color: CREAM });
      }
    }
  } else {
    // Floor Map: a room outline with an interior wall (spatial plan).
    const w = br * 1.06, h = br * 0.88;
    const x0 = bcx - w / 2, y0 = bcy - h / 2;
    const sw = br * 0.15, sh = sw / 2;
    const rect = [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]];
    layers.push({ hit: (x, y) => distToPolyline(x, y, rect, true) <= sh, color: CREAM });
    // interior wall, stopping short of the bottom edge (a doorway)
    const wallX = x0 + w * 0.58;
    const wall = [[wallX, y0], [wallX, y0 + h * 0.58]];
    layers.push({ hit: (x, y) => distToPolyline(x, y, wall, false) <= sh, color: CREAM });
  }

  return layers;
}

/* ---------- rasteriser ---------- */

function render(size, condition, maskable) {
  const layers = buildLayers(size, condition, maskable);
  const big = size * SS;
  // Accumulate supersampled RGBA, then box-downsample.
  const acc = new Float64Array(size * size * 4);

  for (let by = 0; by < big; by++) {
    const py = (by + 0.5) / SS;
    for (let bx = 0; bx < big; bx++) {
      const px = (bx + 0.5) / SS;
      let col = [0, 0, 0, 0];
      for (const l of layers) if (l.hit(px, py)) col = l.color;
      const i = (Math.floor(by / SS) * size + Math.floor(bx / SS)) * 4;
      acc[i] += col[0]; acc[i + 1] += col[1]; acc[i + 2] += col[2]; acc[i + 3] += col[3];
    }
  }

  const n = SS * SS;
  const px = Buffer.alloc(size * size * 4);
  for (let i = 0; i < acc.length; i++) px[i] = Math.round(acc[i] / n);
  return px;
}

/* ---------- PNG encoding ---------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // colour type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw scanlines, each prefixed with filter type 0 (None).
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- favicon (vector, shared by both conditions) ---------- */

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#E0992F"/>
  <g fill="none" stroke="#2A2008" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 13.2 16 6l10 7.2V26a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/>
    <path d="M12.6 27v-8.4h6.8V27"/>
  </g>
</svg>
`;

/* ---------- main ---------- */

mkdirSync(OUT, { recursive: true });
const written = [];

for (const condition of [1, 2]) {
  for (const size of [192, 512]) {
    const file = `icon-cond${condition}-${size}.png`;
    writeFileSync(resolve(OUT, file), encodePNG(size, size, render(size, condition, false)));
    written.push(file);
  }
  const mfile = `icon-cond${condition}-maskable-512.png`;
  writeFileSync(resolve(OUT, mfile), encodePNG(512, 512, render(512, condition, true)));
  written.push(mfile);
}

writeFileSync(resolve(OUT, 'favicon.svg'), FAVICON, 'utf8');
written.push('favicon.svg');

console.log('Wrote to public/:');
for (const f of written) console.log('  ' + f);
