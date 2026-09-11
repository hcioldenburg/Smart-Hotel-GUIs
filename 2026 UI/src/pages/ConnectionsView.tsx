import { DEVICES, DEVICE_BY_ID } from '../data/devices';
import type { DeviceCategory } from '../data/devices';
import { useDevices } from '../hooks/useDevices';
import FloorMapFrame from '../components/FloorMapFrame';
import GraphBubble from '../components/GraphBubble';
import { SvgIcon } from '../lib/deviceIcons';

interface Props {
  selectedDevice: string | null;
  onSelectDevice: (id: string | null) => void;
  categories: DeviceCategory[];
}

const HUB_X = 50;
const HUB_Y = 50;

export default function ConnectionsView({ selectedDevice, onSelectDevice, categories }: Props) {
  const { devices } = useDevices();

  const catFilter = categories.length > 0;
  const matchCat = (id: string) => { const c = DEVICE_BY_ID[id]?.category; return !catFilter || (!!c && categories.includes(c)); };

  return (
    <FloorMapFrame onBackgroundClick={() => onSelectDevice(null)}>
      {/* Static "knowledge base" wiring: every device links to the room hub.
          Lines run full-length under the solid hub bubble. */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {DEVICES.map(d => {
          const active = matchCat(d.id);
          const dx = HUB_X - d.x, dy = HUB_Y - d.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ux = dx / len, uy = dy / len;
          return (
            <line
              key={d.id}
              x1={d.x + ux * 4} y1={d.y + uy * 4}
              x2={HUB_X}        y2={HUB_Y}
              stroke={active ? 'rgba(224,153,47,.8)' : 'rgba(232,226,214,.5)'}
              strokeWidth={active ? 0.22 : 0.16}
              strokeLinecap="round"
              opacity={active ? 1 : catFilter ? 0.25 : 1}
            />
          );
        })}
      </svg>

      {/* Device nodes — all shown active (category filter dims non-matching) */}
      {DEVICES.map(d => {
        const entity = devices.find(e => e.entity_id === d.entityId);
        const on = d.control !== 'button' && d.control !== 'switchpanel' && (entity?.state === 'on' || entity?.state === 'heat');
        return (
          <GraphBubble
            key={d.id}
            device={d}
            on={on}
            selected={selectedDevice === d.id}
            active={matchCat(d.id)}
            mini={d.mini}
            onClick={() => onSelectDevice(selectedDevice === d.id ? null : d.id)}
          />
        );
      })}

      {/* Hub node — solid dark, sits above the converging line ends */}
      <div style={{
        position: 'absolute',
        left: `${HUB_X}%`, top: `${HUB_Y}%`,
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        zIndex: 5,
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: '50%',
          background: '#24242A', color: '#E7A53A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,.45)',
        }}>
          <SvgIcon name="home" size={24} color="#E7A53A" sw={1.9} />
        </div>
        <span style={{
          background: '#24242A', color: '#F4F1EA',
          fontSize: 11, fontWeight: 600,
          padding: '3px 9px', borderRadius: 999,
          whiteSpace: 'nowrap', boxShadow: '0 3px 10px rgba(0,0,0,.3)',
          pointerEvents: 'none',
        }}>
          Hub
        </span>
      </div>
    </FloorMapFrame>
  );
}
