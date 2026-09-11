import { ChevronRight } from 'lucide-react';
import { DEVICES, RULE_LINKS, isSwitch } from '../data/devices';
import { useEffect, useRef } from 'react';
import { useDeviceState } from '../hooks/useDeviceState';
import { markCoverPending, useCoverAck } from '../hooks/useCoverAck';
import { usePsTriggers } from '../hooks/useAutomation';
import { useOptimistic } from '../hooks/useOptimistic';
import { SvgIcon, DEVICE_ICON } from '../lib/deviceIcons';
import DragBar from './controls/DragBar';
import ProcessingBadge from './ProcessingBadge';
import LinkStatusBadge from './LinkStatusBadge';
import { useIsMobile } from '../hooks/useMediaQuery';
import { markPending, usePendingIds } from '../hooks/usePending';
import { opennessLabel } from '../lib/covers';
import { formatTriggered } from '../lib/time';
import SwitchGangs from './SwitchGangs';
import { sensorStateLabel } from '../lib/sensors';

interface Props {
  deviceId: string;
  onClose: () => void;
  onSelectRule?: (id: string) => void;
  // Hide the State/Category rows when opened from the All Devices list, where
  // both are already shown on the row. On the floor map they're not visible, so
  // the card keeps them (default).
  hideMeta?: boolean;
}

export default function DeviceDetailPanel({ deviceId, onClose, onSelectRule, hideMeta }: Props) {
  const dev = DEVICES.find(d => d.id === deviceId);
  if (!dev) return null;

  const { state, attrs, call, callScript } = useDeviceState(dev.entityId);
  // A switch's last press lives on its ps_* automation, which useDeviceState can
  // never see (useDevices filters automation.* out) — read it from HA directly.
  const psTriggers = usePsTriggers();
  const lastPressed = dev.automationId ? psTriggers[dev.automationId] : undefined;
  const isMobile = useIsMobile();
  const pending = usePendingIds().has(dev.entityId);
  const debounce = useRef<number | undefined>(undefined);
  const isSensor = dev.control === 'sensor';
  const isLight  = dev.control === 'light';
  const isHeater = dev.control === 'heater';
  const isCover  = dev.control === 'cover-h' || dev.control === 'cover-v';
  const isButton = dev.control === 'button';
  const isPanel  = dev.control === 'switchpanel';
  // An unavailable cover comes back with its attributes stripped, so
  // current_position vanishes and the bar would snap to CLOSED. Hold the last
  // position we actually saw — it's also the baseline the link check compares
  // against (see useCoverAck).
  const lastPos = useRef(0);
  if (typeof attrs.current_position === 'number') lastPos.current = attrs.current_position;
  const [coverPos, setCoverLocal] = useOptimistic(lastPos.current);
  const [briPct, setBriLocal] = useOptimistic(state === 'on' ? Math.round((Number(attrs.brightness ?? 204) / 255) * 100) : 0);
  const on = !isButton && !isPanel && (state === 'on' || state === 'heat' || (isCover && coverPos > 0));

  // Heater target temperature — range/step come from the climate entity.
  const tMin  = Number(attrs.min_temp ?? 7);
  const tMax  = Number(attrs.max_temp ?? 35);
  const tStep = Number(attrs.target_temp_step ?? 0.5);
  const [targetTemp, setTargetLocal] = useOptimistic(Number(attrs.temperature ?? 21));
  const targetPct = tMax > tMin ? ((targetTemp - tMin) / (tMax - tMin)) * 100 : 0;

  const toggle = () => {
    if (dev.control === 'light')  call('light', on ? 'turn_off' : 'turn_on');
    else if (dev.control === 'heater') call('climate', on ? 'turn_off' : 'turn_on');
    else if (dev.control === 'toggle') {
      markPending(dev.entityId, state); // show "Updating" until the live state confirms
      // Read-only display entity (e.g. TV binary_sensor): fire its control service.
      if (dev.toggleAction) { const a = dev.toggleAction; call(a.domain, a.service, { entity_id: a.entityId }); return; }
      const domain = dev.entityId.startsWith('fan.') ? 'fan' : 'switch';
      call(domain, on ? 'turn_off' : 'turn_on');
    }
  };
  const setCover = (v: number) => {
    setCoverLocal(v);
    clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      // Commanding the position it already sits at can't produce movement, so
      // there's nothing to wait for — don't arm the link check.
      if (dev.reportLink && v !== lastPos.current) markCoverPending(dev.entityId, lastPos.current);
      return dev.positionScript
        ? callScript(dev.positionScript, { position: v })
        : call('cover', 'set_cover_position', { position: v });
    }, 120);
  };
  // Once the link is declared dead, drop the optimistic position so the bar
  // falls back to where the device actually is.
  const link = useCoverAck(dev.reportLink ? dev.entityId : '');
  useEffect(() => { if (link === 'failed') setCoverLocal(null); }, [link]);
  const setBrightness = (v: number) => {
    setBriLocal(v);
    clearTimeout(debounce.current);
    // Setting brightness also turns the light on (HA turn_on with brightness).
    debounce.current = window.setTimeout(() => call('light', 'turn_on', { brightness: Math.round(v * 2.55) }), 120);
  };
  const setTarget = (pct: number) => {
    const t = Math.round((tMin + (pct / 100) * (tMax - tMin)) / tStep) * tStep;
    setTargetLocal(t);
    clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => call('climate', 'set_temperature', { temperature: t }), 120);
  };

  const statusLine = dev.control === 'light'
    ? (on ? `${Math.round(((Number(attrs.brightness ?? 255)) / 255) * 100)}%` : 'Off')
    : isCover ? `${coverPos}% open`
    : (on ? 'On' : 'Off');

  const relatedRules = RULE_LINKS.filter(r => r.sensors.includes(dev.id) || r.targets.includes(dev.id));

  const avatarBg = isSensor ? '#FBFAF6' : on ? '#F6E2BC' : '#F1EDE4';
  const iconName = DEVICE_ICON[dev.id] ?? 'plug';
  const iconColor = isSensor ? '#2A6F69' : '#2A2A30';

  return (
    <div style={{
      width: isMobile ? '100%' : 360, flexShrink: 0,
      background: '#FFFFFF',
      border: '1px solid #ECE6D9',
      borderRadius: isMobile ? '18px 18px 0 0' : 18,
      boxShadow: '0 10px 30px rgba(40,38,32,.10)',
      overflow: 'hidden',
      alignSelf: 'flex-start',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid #F0EBDF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: avatarBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isSensor ? '0 0 0 2px rgba(47,158,150,.45)' : undefined,
          }}>
            <SvgIcon name={iconName} size={22} color={iconColor} sw={1.7} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: '#9A958C', fontWeight: 600 }}>{dev.category}</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#25242A', lineHeight: 1.15 }}>{dev.name}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ width: 30, height: 30, flexShrink: 0, border: 'none', background: '#F4F0E7', borderRadius: 9, cursor: 'pointer', color: '#6F6A60', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <SvgIcon name="close" size={14} color="#6F6A60" sw={2} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px' }}>

        {/* Physical switch — read-only. It is pressed in the room, not from here;
            all the dashboard can tell you is whether the system saw the press. */}
        {isButton && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FBF6EC', border: '1px solid #F0E4CC', borderRadius: 13, padding: '13px 15px', marginBottom: 18 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#3A3833' }}>Last pressed</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#C97E1E' }}>
              {formatTriggered(lastPressed) || 'Never'}
            </span>
          </div>
        )}

        {/* Multi-gang wall switch: one read-only row per gang, each with its own
            last press (the two gangs are separate ps_* automations). */}
        {isPanel && dev.gangs && (
          <div style={{ marginBottom: 18 }}>
            <SwitchGangs gangs={dev.gangs} />
          </div>
        )}

        {/* Toggle control (lights, fan, sockets, heater, tv) */}
        {!isSensor && !isCover && !isButton && !isPanel && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FBF6EC', border: '1px solid #F0E4CC', borderRadius: 13, padding: '13px 15px', marginBottom: 18 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#3A3833' }}>{statusLine}</span>
              {pending && <ProcessingBadge />}
            </span>
            <button
              onClick={toggle}
              style={{
                width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', padding: 1,
                justifyContent: on ? 'flex-end' : 'flex-start',
                background: on ? '#E0992F' : '#D5CFC4',
                transition: 'background .2s, justify-content .2s',
              }}
            >
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)', display: 'block' }} />
            </button>
          </div>
        )}

        {/* Light intensity */}
        {isLight && (
          <div style={{ background: '#FBF6EC', border: '1px solid #F0E4CC', borderRadius: 13, padding: '13px 15px', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 11 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#3A3833' }}>Intensity</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#C97E1E' }}>{briPct}%</span>
            </div>
            <DragBar value={briPct} onChange={setBrightness} orientation="h" width="100%" height={26} />
          </div>
        )}

        {/* Heater target temperature — keeps the room at the set value */}
        {isHeater && (
          <div style={{ background: '#FBF6EC', border: '1px solid #F0E4CC', borderRadius: 13, padding: '13px 15px', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 11 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#3A3833' }}>Target temperature</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#C97E1E' }}>{Number.isInteger(targetTemp) ? targetTemp : targetTemp.toFixed(1)}°C</span>
            </div>
            <DragBar value={targetPct} onChange={setTarget} orientation="h" width="100%" height={26} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 11, fontWeight: 600, letterSpacing: '.3px', color: '#A39E93' }}>
              <span>{tMin}°C</span>
              <span>{tMax}°C</span>
            </div>
          </div>
        )}

        {/* Cover slider */}
        {isCover && (
          <div style={{ background: '#FBF6EC', border: '1px solid #F0E4CC', borderRadius: 13, padding: '13px 15px', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, color: '#3A3833' }}>
                Position
                <LinkStatusBadge status={link} />
              </span>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#C97E1E' }}>{opennessLabel(coverPos)}</span>
            </div>
            <DragBar value={coverPos} onChange={setCover} orientation="h" width="100%" height={26} />
            {/* End labels — the horizontal fill runs closed → open */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 11, fontWeight: 600, letterSpacing: '.3px', color: '#A39E93' }}>
              <span>Closed</span>
              <span>Open</span>
            </div>
          </div>
        )}

        {/* Parameters — never for a physical switch. A switch's display entity is
            the device it controls, so "State" would report that device's on/off and
            read as if it were the switch's own state. Confusing, so it is omitted:
            a switch's only meaningful reading is when it was last pressed. */}
        {!hideMeta && !isSwitch(dev.id) && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: '#A39E93', marginBottom: 10 }}>Parameters</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#F0EBDF', borderRadius: 11, overflow: 'hidden', marginBottom: 22 }}>
              <PRow label="State"    value={isSensor ? sensorStateLabel(dev, state) : (state || '—')} />
              <PRow label="Category" value={dev.category} />
            </div>
          </>
        )}

        {/* Attached rules */}
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: '#A39E93', marginBottom: 10 }}>Attached Rules</div>
        {relatedRules.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {relatedRules.map(r => (
              <button
                key={r.ruleId}
                onClick={() => onSelectRule?.(r.ruleId)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#FBFAF6', border: '1px solid #ECE6D9', borderRadius: 11, padding: '11px 14px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#3A3833' }}>{r.name}</span>
                <ChevronRight size={15} color="#C2BCAF" />
              </button>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#B0AB9F', fontStyle: 'italic' }}>No rules attached.</div>
        )}
      </div>
    </div>
  );
}

function PRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', background: '#FBFAF6' }}>
      <span style={{ fontSize: 13, color: '#8A857A' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#3A3833' }}>{value}</span>
    </div>
  );
}
