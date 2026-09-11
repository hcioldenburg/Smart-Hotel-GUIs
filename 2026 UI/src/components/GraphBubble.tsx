import { SvgIcon, DEVICE_ICON } from '../lib/deviceIcons';
import type { DeviceDef } from '../data/devices';

/**
 * One device node rendered on the floor-map graph. Identical across
 * Device View, Dependencies and Connections (design "graph" bubble: 46px, icon 20).
 */
interface Props {
  device: DeviceDef;
  on: boolean;            // device is on/lit
  selected: boolean;
  active?: boolean;       // in-focus (false = dimmed grey)
  showLabel?: boolean;    // force the name pill (defaults to selected)
  pending?: boolean;      // command sent, awaiting state confirmation
  mini?: boolean;         // render a smaller bubble (physical wall switches)
  onClick: () => void;
}

export default function GraphBubble({ device: d, on, selected, active = true, showLabel, pending = false, mini = false, onClick }: Props) {
  const size = mini ? 28 : 46;
  const iconSize = mini ? 14 : 20;
  const labelShown = showLabel ?? selected;
  const isSensor = d.control === 'sensor';
  // Background reflects the real on-state even when the bubble is out of focus,
  // so a focused rule doesn't hide which devices are running. Focused-on bubbles
  // glow brighter; unfocused-on bubbles stay lit but muted.
  const lit = on;
  const selRing = selected ? '0 0 0 3px #E0992F, ' : '';

  let bg: string, shadow: string, iconColor: string;
  if (isSensor) {
    bg = '#FBFAF6';
    shadow = `${selRing}0 0 0 2px rgba(47,158,150,${active ? '.6' : '.28'}), 0 2px 8px rgba(0,0,0,.30)`;
    iconColor = active ? '#2A6F69' : '#A8A399';
  } else {
    bg = lit ? '#E0992F' : '#FBFAF6';
    const glow = lit ? `0 0 16px 3px rgba(224,153,47,${active ? '.55' : '.35'}), ` : '';
    shadow = `${selRing}${glow}0 2px 8px rgba(0,0,0,.30)`;
    iconColor = lit ? '#2A2A30' : active ? '#2A2A30' : '#A8A399';
  }

  return (
    <div style={{
      position: 'absolute',
      left: `${d.x}%`, top: `${d.y}%`,
      transform: 'translate(-50%, -50%)',
      // Out-of-focus bubbles dim, but on devices stay clearly readable
      // in the background rather than fading out with the off ones.
      opacity: active ? 1 : on ? 0.75 : 0.42, transition: 'opacity .2s',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
      zIndex: selected ? 10 : 2,
    }}>
      <button
        data-device-id={d.id}
        aria-label={d.name}
        onClick={e => { e.stopPropagation(); onClick(); }}
        style={{
          position: 'relative',
          width: size, height: size, borderRadius: '50%',
          border: 'none', background: bg, boxShadow: shadow,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .2s', padding: 0,
        }}
      >
        <SvgIcon name={DEVICE_ICON[d.id] ?? 'plug'} size={iconSize} color={iconColor} sw={1.7} />
        {pending && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            width: 15, height: 15, borderRadius: '50%',
            background: '#24242A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,.4)',
          }}>
            <span style={{
              width: 9, height: 9, borderRadius: '50%',
              border: '2px solid rgba(224,153,47,.35)', borderTopColor: '#E0992F',
              animation: 'spin .7s linear infinite',
            }} />
          </span>
        )}
        {isSensor && active && (
          <>
            <span style={{ position: 'absolute', inset: -1, borderRadius: '50%', border: '2px solid rgba(47,158,150,.5)', animation: 'sense-pulse 2.6s ease-out 0s infinite', pointerEvents: 'none' }} />
            <span style={{ position: 'absolute', inset: -1, borderRadius: '50%', border: '2px solid rgba(47,158,150,.5)', animation: 'sense-pulse 2.6s ease-out 1.3s infinite', pointerEvents: 'none' }} />
          </>
        )}
      </button>
      {labelShown && (
        <span style={{
          background: '#24242A', color: '#F4F1EA',
          fontSize: 11, fontWeight: 600,
          padding: '3px 9px', borderRadius: 999,
          whiteSpace: 'nowrap', boxShadow: '0 3px 10px rgba(0,0,0,.3)',
          pointerEvents: 'none',
        }}>
          {d.name}
        </span>
      )}
    </div>
  );
}
