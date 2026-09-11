/**
 * Universal device tile (126px wide) — direct controls, loyal to the design.
 * Lights/heater use the 300° ArcDial, covers use DragBar, switches use a
 * rounded tile, sensors use a teal pulsing badge.
 *
 * Controls are optimistic: dragging updates the indicator instantly and the
 * Home Assistant service call is debounced, then state re-syncs from HA.
 */
import { useEffect, useRef } from 'react';
import { useDeviceState } from '../hooks/useDeviceState';
import { useOptimistic } from '../hooks/useOptimistic';
import { markPending, usePendingIds } from '../hooks/usePending';
import { markCoverPending, useCoverAck } from '../hooks/useCoverAck';
import ArcDial from './controls/ArcDial';
import DragBar from './controls/DragBar';
import ProcessingBadge from './ProcessingBadge';
import LinkStatusBadge from './LinkStatusBadge';
import SwitchGangs from './SwitchGangs';
import { SvgIcon, DEVICE_ICON } from '../lib/deviceIcons';
import { opennessLabel } from '../lib/covers';
import { sensorStateLabel } from '../lib/sensors';
import { lastActivity } from '../lib/lastActivity';
import type { DeviceDef } from '../data/devices';

interface Props { device: DeviceDef; }

function timeSince(iso: string | undefined): string {
  if (!iso) return '';
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
  return `${Math.round(sec / 86400)}d ago`;
}

export default function DeviceTile({ device }: Props) {
  const { entity, state, attrs, call, callScript } = useDeviceState(device.entityId);
  const iconName = DEVICE_ICON[device.id] ?? 'plug';
  const debounce = useRef<number | undefined>(undefined);

  const isLight  = device.control === 'light';
  const isHeater = device.control === 'heater';
  const isCoverH = device.control === 'cover-h';
  const isCoverV = device.control === 'cover-v';
  const isCover  = isCoverH || isCoverV;
  const isToggle = device.control === 'toggle';
  const isSensor = device.control === 'sensor';
  const isButton = device.control === 'button';
  const isPanel  = device.control === 'switchpanel';

  // Covers deliberately opt out of the unavailable treatment. Under the device-
  // error simulation the shutter/curtain drops off HA, and greying the tile out
  // with "Unavailable" would hand the participant the diagnosis for free. The
  // tile instead stays fully interactive and reports the position it believes in
  // — the command visibly goes out, the physical device just doesn't follow.
  // That matches how AllDevices and the floor map already read.
  const unavailable = !isCover && (state === 'unavailable' || state === 'unknown');
  const on = !isButton && !isPanel && (state === 'on' || state === 'heat');

  // Live HA values
  const haBri = state === 'on' ? Math.round((Number(attrs.brightness ?? 204) / 255) * 100) : 0;
  const haHeaterPct = (((Number(attrs.temperature ?? 21.5)) - 15) / 13) * 100;
  // An unavailable entity comes back with its attributes stripped, so
  // current_position vanishes and the bar would snap to CLOSED — a fault cue in
  // itself. Hold the last position we actually saw instead.
  const lastPos = useRef(0);
  if (typeof attrs.current_position === 'number') lastPos.current = attrs.current_position;
  const haPos = typeof attrs.current_position === 'number' ? attrs.current_position : lastPos.current;

  // Optimistic display values (instant feedback while dragging)
  const [briPct, setBriLocal, briEditing] = useOptimistic(haBri);
  const [heaterPct, setHeaterLocal] = useOptimistic(haHeaterPct);
  const [coverPos, setCoverLocal] = useOptimistic(haPos);

  const heaterTgt = 15 + (heaterPct / 100) * 13;
  const lightActive = on || (briEditing && briPct > 0);

  const sendLater = (fn: () => void) => {
    clearTimeout(debounce.current);
    debounce.current = window.setTimeout(fn, 120);
  };

  // interactions — ArcDial.onFrac yields a 0..1 fraction, convert to 0..100
  const toggleLight = () => { setBriLocal(null); call('light', on ? 'turn_off' : 'turn_on'); };
  const onBriDrag = (frac: number) => { const pct = Math.round(frac * 100); setBriLocal(pct); sendLater(() => call('light', 'turn_on', { brightness: Math.round(pct * 2.55) })); };
  const toggleHeater = () => { setHeaterLocal(null); call('climate', on ? 'turn_off' : 'turn_on'); };
  const onHeaterDrag = (frac: number) => { const pct = frac * 100; setHeaterLocal(pct); const temp = Math.round((15 + frac * 13) * 2) / 2; sendLater(() => call('climate', 'set_temperature', { temperature: temp })); };
  const toggleSwitch = () => {
    // Mark pending so the tile shows "Updating" until the live state confirms.
    markPending(device.entityId, state);
    // Devices whose display entity is read-only (e.g. the TV, a binary_sensor)
    // fire a dedicated control service instead of switch.turn_on/off.
    if (device.toggleAction) { const a = device.toggleAction; call(a.domain, a.service, { entity_id: a.entityId }); return; }
    const domain = device.entityId.startsWith('fan.') ? 'fan' : 'switch';
    call(domain, on ? 'turn_off' : 'turn_on');
  };
  const pending = usePendingIds().has(device.entityId);
  const moveCover = (pct: number) => {
    // Baseline for the ack is the position HA last reported, not the optimistic
    // one — that already shows the target. Commanding the position it's already
    // at can't produce movement, so don't wait for any.
    if (device.reportLink && pct !== lastPos.current) markCoverPending(device.entityId, lastPos.current);
    return device.positionScript
      ? callScript(device.positionScript, { position: pct })
      : call('cover', 'set_cover_position', { position: pct });
  };
  const onCoverDrag = (pct: number) => { setCoverLocal(pct); sendLater(() => moveCover(pct)); };

  // Once the link is declared dead, drop the optimistic position: the bar falls
  // back to where the device actually is, so the failed command doesn't leave a
  // value behind that looks like it took effect.
  const link = useCoverAck(device.reportLink ? device.entityId : '');
  useEffect(() => { if (link === 'failed') setCoverLocal(null); }, [link]);

  // status line + sensor state label
  let status = '';
  let sensorLabel = '';
  if (isLight) status = lightActive ? `${briPct}%` : 'Off';
  else if (isHeater) status = on ? 'On' : 'Off';
  else if (isCover) status = opennessLabel(coverPos);
  else if (isSensor) {
    sensorLabel = sensorStateLabel(device, state);
    // last_changed is a top-level entity field, not an attribute — reading it
    // off `attrs` silently yielded undefined and blanked this line.
    status = timeSince(lastActivity(device, entity));
  } else if (isButton) {
    status = attrs.last_triggered ? `Pressed ${timeSince(attrs.last_triggered as string)}` : 'Never pressed';
  } else if (isPanel) {
    status = '';
  } else status = on ? 'On' : 'Off';

  if (unavailable) status = 'Unavailable';

  // control element
  let ctrl: React.ReactNode = null;
  if (isLight) {
    ctrl = (
      <ArcDial frac={briPct / 100} active={lightActive} onFrac={onBriDrag} onToggle={toggleLight}
        center={<SvgIcon name={iconName} size={26} color={lightActive ? '#2A2008' : '#A39E93'} sw={1.8} />} />
    );
  } else if (isHeater) {
    ctrl = (
      <ArcDial frac={heaterPct / 100} active={on} onFrac={onHeaterDrag} onToggle={toggleHeater}
        center={
          <div style={{ textAlign: 'center', lineHeight: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 3 }}>
              <SvgIcon name={iconName} size={15} color={on ? '#2A2008' : '#A39E93'} sw={1.8} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: on ? '#2A2008' : '#7A756B' }}>{heaterTgt.toFixed(1)}°</div>
          </div>
        } />
    );
  } else if (isCoverH) {
    ctrl = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {/* bar centered in the box (aligns with the other tiles); labels float
            below it. fill runs closed → open, each label centered on the track
            end so it lines up with the handle in its closed / open state */}
        <div style={{ position: 'relative', width: 124 }}>
          <DragBar value={coverPos} onChange={onCoverDrag} orientation="h" pleated />
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, height: 12, fontSize: 9.5, fontWeight: 700, letterSpacing: '.5px' }}>
            <span style={{ position: 'absolute', left: 0, transform: 'translateX(-50%)', color: '#A9A396' }}>CLOSED</span>
            <span style={{ position: 'absolute', right: 0, transform: 'translateX(50%)', color: '#C7871B' }}>OPEN</span>
          </div>
        </div>
      </div>
    );
  } else if (isCoverV) {
    ctrl = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        {/* bar centered in the tile; labels float to its left (fill runs closed
            bottom → open top) */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', right: '100%', marginRight: 6, top: 0, height: 78, fontSize: 9.5, fontWeight: 700, letterSpacing: '.5px', textAlign: 'right', whiteSpace: 'nowrap' }}>
            {/* centered on the track edges so each label lines up with the handle
                center in its fully open (top) / closed (bottom) state */}
            <span style={{ position: 'absolute', top: 0, right: 0, transform: 'translateY(-50%)', color: '#C7871B' }}>OPEN</span>
            <span style={{ position: 'absolute', bottom: 0, right: 0, transform: 'translateY(50%)', color: '#A9A396' }}>CLOSED</span>
          </div>
          <DragBar value={coverPos} onChange={onCoverDrag} orientation="v" pleated />
        </div>
      </div>
    );
  } else if (isToggle) {
    ctrl = (
      <button onClick={toggleSwitch} style={{
        width: 86, height: 86, borderRadius: 22, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
        background: on ? '#E0992F' : '#F1ECE1',
        boxShadow: on ? '0 6px 18px rgba(224,153,47,.4)' : 'inset 0 0 0 1px #ECE6D9',
      }}>
        <SvgIcon name={iconName} size={30} color={on ? '#2A2008' : '#A39E93'} sw={1.7} />
      </button>
    );
  } else if (isButton) {
    // Read-only physical-switch indicator — not actuatable from the UI; the
    // status line reports when the real switch was last pressed.
    ctrl = (
      <div style={{
        width: 86, height: 86, borderRadius: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F1ECE1', boxShadow: 'inset 0 0 0 1px #ECE6D9',
      }}>
        <SvgIcon name={iconName} size={30} color="#A39E93" sw={1.7} />
      </div>
    );
  } else if (isPanel && device.gangs) {
    ctrl = <SwitchGangs gangs={device.gangs} />;
  } else if (isSensor) {
    ctrl = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', width: 52, height: 52, borderRadius: '50%', background: '#FBFAF6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px rgba(47,158,150,.5), 0 2px 8px rgba(0,0,0,.12)' }}>
          <SvgIcon name={iconName} size={22} color="#2A6F69" sw={1.7} />
          <span style={{ position: 'absolute', inset: -1, borderRadius: '50%', border: '2px solid rgba(47,158,150,.5)', animation: 'sense-pulse 2.6s ease-out 0s infinite', pointerEvents: 'none' }} />
          <span style={{ position: 'absolute', inset: -1, borderRadius: '50%', border: '2px solid rgba(47,158,150,.5)', animation: 'sense-pulse 2.6s ease-out 1.3s infinite', pointerEvents: 'none' }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#2A6F69', textAlign: 'center' }}>{sensorLabel}</div>
      </div>
    );
  }

  return (
    <div
      data-device-id={device.id}
      aria-label={device.name}
      style={{ width: 126, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, userSelect: 'none', opacity: unavailable ? 0.55 : 1 }}
    >
      <div style={{ height: 118, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ctrl}</div>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#25242A', textAlign: 'center', lineHeight: 1.2 }}>{device.name}</div>
      <div style={{ fontSize: 11.5, color: unavailable ? '#C0552F' : '#8A857A', textAlign: 'center', minHeight: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {pending ? <ProcessingBadge size={11} />
          : link !== 'idle' ? <LinkStatusBadge status={link} dense />
          : status}
      </div>
    </div>
  );
}
