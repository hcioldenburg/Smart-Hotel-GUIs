import { useRef } from 'react';
import type { ReactNode } from 'react';

interface Props {
  frac: number;                  // 0..1 fill fraction
  active: boolean;
  accent?: string;
  onFrac: (f: number) => void;   // drag the arc
  onToggle: () => void;          // tap the centre button
  center: ReactNode;             // centre content (icon / value)
}

// 300° arc dial (matches the design): start -150°, sweep 300°.
// Dragging is RELATIVE — the value changes by how far you rotate the pointer
// around the centre, so the knob follows your drag instead of jumping to it.
export default function ArcDial({ frac, active, accent = '#E0992F', onFrac, onToggle, center }: Props) {
  const cx = 60, cy = 60, r = 46, sw = 9, start = -150, span = 300;
  const toXY = (deg: number) => { const t = (deg * Math.PI) / 180; return [cx + r * Math.sin(t), cy - r * Math.cos(t)]; };
  const f = Math.max(0, Math.min(1, frac));
  const ang = start + f * span;
  const [sx, sy] = toXY(start), [ex, ey] = toXY(start + span), [kx, ky] = toXY(ang);
  const trackPath = `M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`;
  const progPath = `M ${sx} ${sy} A ${r} ${r} 0 ${f * span > 180 ? 1 : 0} 1 ${kx} ${ky}`;

  const lastAngle = useRef<number | null>(null);
  const acc = useRef(f);

  // Pointer position relative to the dial centre (in the 120-unit viewBox).
  const posAt = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rx = ((e.clientX - rect.left) / rect.width) * 120 - cx;
    const ry = ((e.clientY - rect.top) / rect.height) * 120 - cy;
    return { angle: (Math.atan2(rx, -ry) * 180) / Math.PI, dist: Math.hypot(rx, ry) };
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    lastAngle.current = posAt(e).angle;
    acc.current = f; // start from the current value, no jump
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!e.buttons || lastAngle.current === null) return;
    const { angle, dist } = posAt(e);
    // ignore noisy angles near the dead centre, but keep tracking the angle
    if (dist < 16) { lastAngle.current = angle; return; }
    let delta = angle - lastAngle.current;
    if (delta > 180) delta -= 360;   // normalise across the bottom gap
    if (delta < -180) delta += 360;
    lastAngle.current = angle;
    acc.current = Math.max(0, Math.min(1, acc.current + delta / span));
    onFrac(acc.current);
  };

  const onUp = () => { lastAngle.current = null; };

  return (
    <div style={{ position: 'relative', width: 118, height: 118 }}>
      <svg
        viewBox="0 0 120 120"
        style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'grab', display: 'block' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* transparent hit area so a drag registers anywhere on the dial */}
        <rect x={0} y={0} width={120} height={120} fill="transparent" />
        <path d={trackPath} fill="none" stroke="#EAE3D5" strokeWidth={sw} strokeLinecap="round" />
        {f > 0.002 && (
          <path d={progPath} fill="none" stroke={active ? accent : '#CFC8B9'} strokeWidth={sw} strokeLinecap="round" />
        )}
        <circle cx={kx} cy={ky} r={7} fill="#fff" stroke={active ? accent : '#CFC8B9'} strokeWidth={3} />
      </svg>
      <button
        onClick={e => { e.stopPropagation(); onToggle(); }}
        style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 60, height: 60, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: active ? accent : '#F4F0E7',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: active ? '0 0 16px rgba(224,153,47,.45)' : 'inset 0 0 0 1px #ECE6D9',
        }}
      >
        {center}
      </button>
    </div>
  );
}
