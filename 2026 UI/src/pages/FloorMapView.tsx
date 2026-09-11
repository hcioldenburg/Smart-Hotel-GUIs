import { DEVICES, DEVICE_BY_ID, isSwitch } from '../data/devices';
import type { DeviceCategory } from '../data/devices';
import { useDevices } from '../hooks/useDevices';
import { usePendingIds } from '../hooks/usePending';
import FloorMapFrame from '../components/FloorMapFrame';
import GraphBubble from '../components/GraphBubble';

interface Props {
  selectedDevice: string | null;
  onSelectDevice: (id: string | null) => void;
  categories: DeviceCategory[];
}

export default function FloorMapView({ selectedDevice, onSelectDevice, categories }: Props) {
  const { devices } = useDevices();
  const pendingIds = usePendingIds();
  const catFilter = categories.length > 0;
  const matchCat = (id: string) => { const c = DEVICE_BY_ID[id]?.category; return !catFilter || (!!c && categories.includes(c)); };

  return (
    <FloorMapFrame onBackgroundClick={() => onSelectDevice(null)}>
      {DEVICES.map(d => {
        const entity = devices.find(e => e.entity_id === d.entityId);
        // A physical switch's bubble never lights up: its display entity is the
        // light it controls, so an "on" bubble would report the light's state, not
        // the switch's. The switch only reports when it was last pressed (in its
        // detail card), so the icon stays neutral.
        const on = !isSwitch(d.id) && d.control !== 'button' && d.control !== 'switchpanel' &&
          (entity?.state === 'on' || entity?.state === 'heat' ||
          ((d.control === 'cover-h' || d.control === 'cover-v') && Number(entity?.attributes?.current_position ?? 0) > 0));
        return (
          <GraphBubble
            key={d.id}
            device={d}
            on={on}
            selected={selectedDevice === d.id}
            active={matchCat(d.id)}
            pending={pendingIds.has(d.entityId)}
            mini={d.mini}
            onClick={() => onSelectDevice(selectedDevice === d.id ? null : d.id)}
          />
        );
      })}
    </FloorMapFrame>
  );
}
