import { SvgIcon } from '../lib/deviceIcons';

/**
 * An automation "gear" node on the dependency graph. Sits at the centroid of
 * the devices its rule touches. Rendered as a diamond — a touch smaller than the
 * circular device bubbles — so rules read as a distinct "condition" shape.
 * Click to open the rule panel.
 */
interface Props {
  name: string;
  x: number;            // percent
  y: number;            // percent
  selected: boolean;
  active?: boolean;     // in-focus (false = dimmed)
  onClick: () => void;
}

// Diamond = a rounded square rotated 45° (rx gives the smooth corners).
// Side 68 → half-diagonal ≈ 48, so it spans the same extent as the old polygon.
const DIA = { x: 16, y: 16, size: 68, rx: 13, rot: 'rotate(45 50 50)' };

export default function GearBubble({ name, x, y, selected, active = true, onClick }: Props) {
  const dim = !active;
  const bg = '#FFFFFF';
  const iconColor = dim ? '#B8B2A6' : '#2A2A30';

  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      opacity: active ? 1 : 0.42, transition: 'opacity .2s',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
      zIndex: selected ? 11 : 3,
    }}>
      <button
        aria-label={name}
        onClick={e => { e.stopPropagation(); onClick(); }}
        style={{
          position: 'relative',
          width: 40, height: 40, border: 'none', background: 'transparent',
          cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .2s',
        }}
      >
        <svg
          viewBox="0 0 100 100" width={40} height={40}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.3))' }}
        >
          {/* Selection ring: an outer orange halo (inner half is covered by the fill) */}
          {selected && (
            <rect x={DIA.x} y={DIA.y} width={DIA.size} height={DIA.size} rx={DIA.rx} transform={DIA.rot}
              fill="none" stroke="#E0992F" strokeWidth={14} opacity={0.35} />
          )}
          <rect x={DIA.x} y={DIA.y} width={DIA.size} height={DIA.size} rx={DIA.rx} transform={DIA.rot}
            fill={bg} />
        </svg>
        <span style={{ position: 'relative', display: 'flex' }}>
          <SvgIcon name="gear" size={16} color={iconColor} sw={1.9} />
        </span>
      </button>
      {selected && (
        <span style={{
          background: '#24242A', color: '#F4F1EA',
          fontSize: 11, fontWeight: 600,
          padding: '3px 9px', borderRadius: 999,
          whiteSpace: 'nowrap', boxShadow: '0 3px 10px rgba(0,0,0,.3)',
          pointerEvents: 'none',
        }}>
          {name}
        </span>
      )}
    </div>
  );
}
