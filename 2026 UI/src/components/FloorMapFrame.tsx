import type { ReactNode } from 'react';

/**
 * Shared dark floor-map container used by Device View, Dependencies and
 * Connections so all three frames + overlays look identical.
 *
 * The image + darkening overlay live in an inner clipped layer (keeps the map's
 * rounded corners), while the children (SVG edges, device bubbles, hub) sit in
 * an overflow-visible outer layer — so a node placed at the very edge can poke
 * past the frame instead of being clipped.
 */
export default function FloorMapFrame({ children, onBackgroundClick }: { children: ReactNode; onBackgroundClick?: () => void }) {
  return (
    <div
      onClick={onBackgroundClick}
      style={{
        position: 'relative', width: '100%', maxWidth: 780,
        aspectRatio: '1 / 1',
      }}
    >
      {/* Clipped layer: rounded map image + overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: 18, overflow: 'hidden',
        border: '1px solid #E2DBCC',
        boxShadow: '0 10px 34px rgba(40,38,32,.14)',
        background: '#24242A',
      }}>
        <img
          src="/floor-map.png"
          alt="Room floor map"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Unified darker overlay (matches design graph mode, slightly deepened) */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(rgba(22,22,28,.24), rgba(22,22,28,.24)), radial-gradient(125% 125% at 50% 45%, rgba(30,30,36,.20) 0%, rgba(30,30,36,.52) 100%)',
        }} />
      </div>
      {children}
    </div>
  );
}
