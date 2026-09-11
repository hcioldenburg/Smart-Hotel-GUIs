/**
 * Custom draggable fill bar (matches the design's hBar / vBar). Amber fill on a
 * #EAE3D5 track with a white thumb that sits on top of the track (not clipped),
 * so at 0% / 100% the track reads as fully empty / fully filled.
 *
 * The `pleated` variant styles the cover sliders (curtain / roller shutter) as a
 * cream pill track with a chunky amber "curtain-fabric" thumb — vertical pleats
 * on the horizontal bar, horizontal slats on the vertical one.
 */
interface Props {
  value: number;                 // 0..100
  onChange: (v: number) => void;
  orientation?: 'h' | 'v';
  width?: number | string;       // horizontal may pass '100%' to fill its container
  height?: number;
  pleated?: boolean;             // amber pleated-fabric thumb on a cream track
}

export default function DragBar({ value, onChange, orientation = 'h', width, height, pleated }: Props) {
  const horiz = orientation === 'h';
  const v = Math.max(0, Math.min(100, value));
  const W = width ?? (horiz ? 124 : 30);
  const H = height ?? (horiz ? 30 : 78);
  // Cross-axis thickness — for vertical this is the (numeric) width.
  const trackThick = horiz ? H : (typeof W === 'number' ? W : 30);

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let f = horiz ? (e.clientX - rect.left) / rect.width : 1 - (e.clientY - rect.top) / rect.height;
    f = Math.max(0, Math.min(1, f));
    onChange(Math.round(f * 100));
  };

  // Pleated fabric thumb: wider/chunkier than the plain white thumb and pokes a
  // little past the track ends. Pleats run across the slide direction.
  const pleatDeg = horiz ? '90deg' : '0deg';
  const pleatFabric = `linear-gradient(${horiz ? '180deg' : '90deg'}, rgba(255,255,255,.30), rgba(90,55,5,.12)), repeating-linear-gradient(${pleatDeg}, #B87A18 0, #E3A73E 3px, #B87A18 6.5px)`;

  const thumbBox = pleated
    ? (horiz
        ? { width: 24, height: trackThick + 8 }
        : { width: trackThick + 8, height: 24 })
    : (horiz
        ? { width: 12, height: trackThick + 6 }
        : { width: trackThick + 6, height: 12 });

  const handlePos: React.CSSProperties = horiz
    ? { position: 'absolute', top: '50%', left: `${v}%`, transform: 'translate(-50%, -50%)' }
    : { position: 'absolute', left: '50%', bottom: `${v}%`, transform: 'translate(-50%, 50%)' };

  const thumbStyle: React.CSSProperties = pleated
    ? { ...handlePos, ...thumbBox, borderRadius: 7, background: pleatFabric, boxShadow: '0 4px 11px rgba(150,95,10,.45), inset 0 0 0 1px rgba(120,75,10,.35)' }
    : { ...handlePos, ...thumbBox, borderRadius: 8, background: '#fff', boxShadow: '0 1px 5px rgba(0,0,0,.35)' };

  return (
    <div
      onPointerDown={e => { e.stopPropagation(); e.currentTarget.setPointerCapture?.(e.pointerId); move(e); }}
      onPointerMove={e => { if (e.buttons) move(e); }}
      style={{ position: 'relative', width: W, height: H, cursor: 'pointer', touchAction: 'none' }}
    >
      {/* track + fill (rounded, clipped) */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: trackThick / 2, overflow: 'hidden',
        background: pleated ? '#FBF6EC' : '#EAE3D5',
        boxShadow: pleated ? 'inset 0 1px 3px rgba(120,90,30,.14), 0 2px 6px rgba(120,90,30,.10)' : undefined,
      }}>
        <div style={horiz
          ? { position: 'absolute', top: 0, bottom: 0, left: 0, width: `${v}%`, background: pleated ? '#EFE4CE' : '#E0992F' }
          : { position: 'absolute', left: 0, right: 0, bottom: 0, height: `${v}%`, background: pleated ? '#EFE4CE' : '#E0992F' }} />
      </div>
      {/* thumb — on top, not clipped, so it pokes slightly past the ends */}
      <div style={thumbStyle} />
    </div>
  );
}
