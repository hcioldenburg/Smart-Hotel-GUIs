import type { JSX } from 'react';

export const ICON_PATHS: Record<string, string[]> = {
  bulb:       ['M9 18h6','M10 21h4','M8.5 14a5 5 0 1 1 7 0c-.7.8-1.2 1.6-1.4 2.5H9.9C9.7 15.6 9.2 14.8 8.5 14Z'],
  floorlamp:  ['M9.4 3h5.2l1.9 7H7.5z','M12 10v8','M9 21h6'],
  fan:        ['M12 12V3a4.5 4.5 0 0 1 0 9','M12 12h9a4.5 4.5 0 0 1-9 0','M12 12v9a4.5 4.5 0 0 1 0-9','M12 12H3a4.5 4.5 0 0 1 9 0','M12 12.4a.4.4 0 1 0 0-.8.4.4 0 0 0 0 .8Z'],
  tv:         ['M2 7h20v12H2z','M8 3l4 4 4-4'],
  curtains:   ['M3 3h18','M6 3v17','M18 3v17','M6 3c3.4 2.5 3.4 14.5 0 17','M18 3c-3.4 2.5-3.4 14.5 0 17','M12 3v17'],
  shutter:    ['M4 4h16','M4 4v13','M20 4v13','M4 8h16','M4 12h16','M4 16.5h16'],
  thermometer:['M14 14.8V6a2 2 0 1 0-4 0v8.8a4 4 0 1 0 4 0Z'],
  motion:     ['M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z','M9 22v-5l-1.5-3 4-2 4 2L14 17v5','M4 9a8 8 0 0 1 16 0'],
  presence:   ['M12 6.4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z','M12 6.4V13','M12 8.4 8.9 11.6','M12 8.4 15.1 11.6','M12 13 9.4 19.8','M12 13 14.6 19.8','M7.4 9.8q-2.2 3.2 0 6.4','M4.9 7.8q-3.2 5.2 0 10.4','M16.6 9.8q2.2 3.2 0 6.4','M19.1 7.8q3.2 5.2 0 10.4'],
  door:       ['M6 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17','M4 21h16','M13 12v1.5'],
  window:     ['M4 4h16v16H4z','M12 4v16','M4 12h16'],
  plug:       ['M9 3v5','M15 3v5','M7 8h10v2a5 5 0 0 1-10 0z','M12 15v6'],
  heater:     ['M12 3c2 3 4 4.6 4 8a4 4 0 0 1-8 0c0-1.6.7-2.9 1.5-3.8C9.8 8.5 11 6 12 3Z'],
  radiator:   ['M4 7h16v10H4z','M8 7v10','M12 7v10','M16 7v10','M6 17v3','M18 17v3'],
  grid:       ['M5 4h6v7H5zM13 4h6v4h-6zM13 11h6v9h-6zM5 14h6v6H5z'],
  rules:      ['M4 5h11M4 12h11M4 19h7','M18 4l3 3M21 4l-3 3','M18 17l3 3M21 17l-3 3'],
  gear:       ['M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z','M12 2.2v3','M12 18.8v3','M2.2 12h3','M18.8 12h3','M5.1 5.1l2.1 2.1','M16.8 16.8l2.1 2.1','M18.9 5.1 16.8 7.2','M7.2 16.8 5.1 18.9'],
  chevron:    ['M9 6l6 6-6 6'],
  close:      ['M6 6l12 12M18 6L6 18'],
  arrowDown:  ['M12 5v14','M6 13l6 6 6-6'],
  home:       ['M5 11l7-6 7 6','M6.5 9.6V20h11V9.6'],
  record:     ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z','M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z'],
  power:      ['M12 2v10','M18.36 6.64a9 9 0 1 1-12.73 0'],
  // Double-gang wall rocker switch: square faceplate, centre divider, two dots.
  wallswitch: ['M6.5 4 H17.5 A2.5 2.5 0 0 1 20 6.5 V17.5 A2.5 2.5 0 0 1 17.5 20 H6.5 A2.5 2.5 0 0 1 4 17.5 V6.5 A2.5 2.5 0 0 1 6.5 4 Z','M12 4 V20','M8.4 16.4 h0.01','M15.6 16.4 h0.01'],
  // Aqara Wireless Mini Switch T1: square housing with a single round button.
  minibutton: ['M6.5 4 H17.5 A2.5 2.5 0 0 1 20 6.5 V17.5 A2.5 2.5 0 0 1 17.5 20 H6.5 A2.5 2.5 0 0 1 4 17.5 V6.5 A2.5 2.5 0 0 1 6.5 4 Z','M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  // IKEA TRADFRI on/off switch: round puck split into a big (on) and small (off) button.
  tradfri: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z','M3.5 12 H20.5','M12 9.6a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z','M12 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'],
};

export const DEVICE_ICON: Record<string, string> = {
  wld: 'bulb',  wlw: 'bulb',
  bll: 'floorlamp', blr: 'floorlamp', flr: 'floorlamp',
  cur: 'curtains', rsh: 'shutter',
  fan: 'fan',   fansock: 'plug',
  htr: 'radiator',
  tv:  'tv',
  pres: 'presence', door: 'door', win: 'window', th: 'thermometer',
  // Physical switches. The floor-lamp and bed-light lamps plug into a socket, so
  // their switches use the plug glyph; the wall switches use the power glyph.
  sw_walllights: 'wallswitch', sw_rsh: 'tradfri',
  sw_bll: 'minibutton', sw_blr: 'minibutton', sw_flr: 'minibutton',
};

// Detailed multi-element icons that need their own viewBox / stroke weight and
// mix primitives (paths, circles, lines). Kept separate from the simple
// single-viewBox glyphs in ICON_PATHS.
// A clean, symmetric cloud (bottom flat at y≈18, centred on x≈12).
const CLOUD_PATH = 'M6.657 18c-2.572 0-4.657-2.007-4.657-4.483c0-2.475 2.085-4.482 4.657-4.482c.393-1.762 1.794-3.2 3.675-3.773c1.88-.572 3.956-.193 5.444.996c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.483c0 1.92-1.551 3.48-3.465 3.48h-15.59z';

const COMPLEX_ICONS: Record<string, { viewBox: string; sw: number; render: (color: string) => JSX.Element }> = {
  // "Connections" — a cloud feeding three linked network nodes.
  connections: {
    viewBox: '0 0 24 24',
    sw: 1.9,
    render: () => (
      <>
        {/* Cloud scaled into the upper area; non-scaling-stroke keeps its weight equal to the nodes */}
        <g transform="translate(0.48 0.6) scale(0.8)">
          <path d={CLOUD_PATH} vectorEffect="non-scaling-stroke" />
        </g>
        {/* Cloud → middle node, and the node bus */}
        <path d="M12 15 V18.8" />
        <path d="M7.7 20.5 H10.3 M13.7 20.5 H16.3" />
        {/* Nodes */}
        <circle cx="6" cy="20.5" r="1.7" />
        <circle cx="12" cy="20.5" r="1.7" />
        <circle cx="18" cy="20.5" r="1.7" />
      </>
    ),
  },
  // "Devices" — tablet (back) + smartphone (right) + smartwatch (lower-left).
  devices: {
    viewBox: '0 0 512 512',
    sw: 18,
    render: (color) => (
      <>
        {/* Tablet: outer frame (top + sides), inner screen bezel with camera gap, screen circle */}
        <path d="M70 330 V49 A24 24 0 0 1 94 25 H346 A24 24 0 0 1 370 49 V150" />
        <path d="M104 72 H196" />
        <path d="M268 72 H336" />
        <circle cx="205" cy="250" r="76" />
        {/* Smartphone */}
        <path d="M328 150 H456 A30 30 0 0 1 486 180 V470 A30 30 0 0 1 456 500 H328 A30 30 0 0 1 298 470 V180 A30 30 0 0 1 328 150 Z" />
        <path d="M356 196 H428" />
        <circle cx="450" cy="196" r="7" fill={color} stroke="none" />
        <circle cx="392" cy="315" r="46" />
        <path d="M358 432 H426" />
        {/* Smartwatch */}
        <path d="M62 332 H126 A34 34 0 0 1 160 366 V430 A34 34 0 0 1 126 464 H62 A34 34 0 0 1 28 430 V366 A34 34 0 0 1 62 332 Z" />
        <circle cx="94" cy="398" r="34" />
        <circle cx="172" cy="398" r="8" />
        <path d="M64 332 L70 258 H118 L124 332" />
        <path d="M64 464 L70 505 H118 L124 464" />
      </>
    ),
  },
};

export function SvgIcon({ name, size, color, sw = 1.7 }: { name: string; size: number; color: string; sw?: number }) {
  const complex = COMPLEX_ICONS[name];
  if (complex) {
    return (
      <svg viewBox={complex.viewBox} width={size} height={size} fill="none" stroke={color} strokeWidth={complex.sw} strokeLinecap="round" strokeLinejoin="round">
        {complex.render(color)}
      </svg>
    );
  }
  const paths = ICON_PATHS[name] ?? ICON_PATHS.plug;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
