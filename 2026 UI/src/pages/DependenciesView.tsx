import { DEVICES, DEVICE_BY_ID, RULE_LINKS, POWER_LINKS, SWITCH_LINKS, isSwitch } from '../data/devices';
import type { DeviceCategory, DeviceDef } from '../data/devices';
import { useDevices } from '../hooks/useDevices';
import FloorMapFrame from '../components/FloorMapFrame';
import GraphBubble from '../components/GraphBubble';
import GearBubble from '../components/GearBubble';

interface Props {
  selectedDevice: string | null;
  onSelectDevice: (id: string | null) => void;
  selectedRule: string | null;
  onSelectRule: (id: string | null) => void;
  categories: DeviceCategory[];      // empty = no filter
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Gears are laid out for an even spread across the map rather than piled on the
// centroid of their devices (which pulls everything to the middle). We sample a
// grid of open slots (clear of device bubbles), pick N maximally-spread anchors
// via farthest-point sampling, then assign each rule to the nearest free anchor
// to its device centroid — corner-most rules first so they claim their spot.
type Pt = { x: number; y: number };
const GEAR_POS: Record<string, Pt> = (() => {
  const LO = 14, HI = 86;
  const DEV_CLEAR = 7;   // keep gear slots off device bubbles
  const DEVICE_PTS: Pt[] = DEVICES.map(d => ({ x: d.x, y: d.y }));

  // Each rule's "home" = centroid of the devices it touches.
  const rules = RULE_LINKS
    .map(r => {
      const pts = [...r.sensors, ...r.targets].map(id => DEVICE_BY_ID[id]).filter(Boolean);
      if (!pts.length) return null;
      return {
        ruleId: r.ruleId,
        hx: clamp(pts.reduce((t, p) => t + p.x, 0) / pts.length, LO, HI),
        hy: clamp(pts.reduce((t, p) => t + p.y, 0) / pts.length, LO, HI),
      };
    })
    .filter((r): r is { ruleId: string; hx: number; hy: number } => r !== null);

  // Candidate slots: a grid over the usable area, minus anything on a device.
  const slots: Pt[] = [];
  for (let x = LO; x <= HI; x += 4)
    for (let y = LO; y <= HI; y += 4)
      if (DEVICE_PTS.every(p => Math.hypot(x - p.x, y - p.y) >= DEV_CLEAR)) slots.push({ x, y });

  // Farthest-point sampling → N anchors that fill the open area evenly. Seed
  // from the slot nearest the centre so sampling then grows outward.
  const N = rules.length;
  const anchors: Pt[] = [];
  anchors.push(slots.reduce((best, s) =>
    Math.hypot(s.x - 50, s.y - 50) < Math.hypot(best.x - 50, best.y - 50) ? s : best, slots[0]));
  while (anchors.length < N) {
    let pick = slots[0], pickD = -1;
    for (const s of slots) {
      let md = Infinity;
      for (const a of anchors) md = Math.min(md, Math.hypot(s.x - a.x, s.y - a.y));
      if (md > pickD) { pickD = md; pick = s; }
    }
    anchors.push(pick);
  }

  // Assign rules → anchors greedily; most off-centre rules choose first so they
  // land near their own devices before central rules take the middle anchors.
  const used = new Array(anchors.length).fill(false);
  const out: Record<string, Pt> = {};
  const order = [...rules].sort((a, b) =>
    Math.hypot(b.hx - 50, b.hy - 50) - Math.hypot(a.hx - 50, a.hy - 50));
  for (const r of order) {
    let bi = -1, bd = Infinity;
    for (let i = 0; i < anchors.length; i++) {
      if (used[i]) continue;
      const d = Math.hypot(anchors[i].x - r.hx, anchors[i].y - r.hy);
      if (d < bd) { bd = d; bi = i; }
    }
    if (bi >= 0) { used[bi] = true; out[r.ruleId] = anchors[bi]; }
  }

  // Manual fine-tuning on top of the auto-layout (values in on-screen cm; the map
  // renders ~800px wide so ~4.5 map-% ≈ 1cm). +x = right, +y = down.
  const CM = 4.5;
  const NUDGE_CM: Record<string, Pt> = {
    'automation.exp_temp_low_heater_on':       { x:  0, y:  1 }, // 1cm down
    'automation.exp_movie_mode_tv_on_fan_off': { x:  2, y:  0 }, // 2cm right
    'automation.exp_window_open_shutter_open': { x: -3, y:  1 }, // 3cm left, 1cm down
    'automation.exp_window_closed_fan_on':     { x:  0, y:  1 }, // 1cm down
    'automation.exp_morning_routine':          { x: -1, y: -1 }, // 1cm left, 1cm up
    'automation.exp_entrance_door_light_on':   { x:  2, y:  0 }, // 2cm right
    'automation.exp_tv_on_bedlight_ambient':   { x: -2, y: -2 }, // 2cm left, 2cm up
  };
  for (const [id, n] of Object.entries(NUDGE_CM)) {
    const p = out[id];
    if (p) out[id] = { x: clamp(p.x + n.x * CM, LO, HI), y: clamp(p.y + n.y * CM, LO, HI) };
  }
  return out;
})();

// Trim a line so it stops `g1`/`g2` units short of each endpoint
function trim(x1: number, y1: number, x2: number, y2: number, g1: number, g2: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;
  return { x1: x1 + ux * g1, y1: y1 + uy * g1, x2: x2 - ux * g2, y2: y2 - uy * g2 };
}

// Rules-view-only device bubble nudges (map units). Kept out of GEAR_POS so the
// auto gear-layout, which reads the raw device coords, stays put. The window
// sensor is placed on the presence sensor's row so the two read as aligned.
const DEV_NUDGE: Record<string, Pt> = {
  pres: { x: 0, y: 2.25 }, // 0.5cm down
  win:  { x: 3, y: 0.25 }, // presence sensor's row (aligned), shifted right to clear the roller-shutter label
  rsh:  { x: 0, y: -4 },   // lifted above the presence/window row so its label clears them
};
function dpos(d: DeviceDef): Pt {
  const n = DEV_NUDGE[d.id];
  return n ? { x: clamp(d.x + n.x, 2, 98), y: clamp(d.y + n.y, 2, 98) } : { x: d.x, y: d.y };
}

export default function DependenciesView({ selectedDevice, onSelectDevice, selectedRule, onSelectRule, categories }: Props) {
  const { devices } = useDevices();

  const catFilter = categories.length > 0;
  const matchCat = (id: string) => { const c = DEVICE_BY_ID[id]?.category; return !catFilter || (!!c && categories.includes(c)); };

  // ---- focus model (mirrors the design) ----
  const ruleFocus = !!selectedRule;
  const focusRule = RULE_LINKS.find(r => r.ruleId === selectedRule);
  const focusIds = focusRule ? [...focusRule.sensors, ...focusRule.targets] : [];

  const deviceFocus = !!selectedDevice;
  const devFocusGearIds: string[] = [];
  let devFocusDevIds: string[] = [];
  if (deviceFocus) {
    RULE_LINKS.forEach(r => {
      if (r.sensors.includes(selectedDevice!) || r.targets.includes(selectedDevice!)) {
        devFocusGearIds.push(r.ruleId);
        devFocusDevIds.push(...r.sensors, ...r.targets);
      }
    });
    POWER_LINKS.forEach(([a, b]) => { if (a === selectedDevice || b === selectedDevice) devFocusDevIds.push(a, b); });
    SWITCH_LINKS.forEach(([a, b]) => { if (a === selectedDevice || b === selectedDevice) devFocusDevIds.push(a, b); });
    devFocusDevIds.push(selectedDevice!);
    devFocusDevIds = [...new Set(devFocusDevIds)];
  }

  const anyFocus = ruleFocus || deviceFocus || catFilter;

  const devActive = (id: string) => {
    if (deviceFocus) return devFocusDevIds.includes(id);
    if (ruleFocus) return focusIds.includes(id);
    if (catFilter) return matchCat(id);
    return true;
  };
  const gearActive = (r: typeof RULE_LINKS[number]) => {
    if (deviceFocus) return devFocusGearIds.includes(r.ruleId);
    if (ruleFocus) return r.ruleId === selectedRule;
    if (catFilter) return [...r.sensors, ...r.targets].some(matchCat);
    return true;
  };

  return (
    <FloorMapFrame onBackgroundClick={() => { onSelectDevice(null); onSelectRule(null); }}>
      {/* Edges: sensor → gear (dashed), gear → target (solid arrow) + socket power links */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {RULE_LINKS.map(r => {
          const g = GEAR_POS[r.ruleId];
          if (!g) return null;
          const gAct = gearActive(r);
          return (
            <g key={r.ruleId}>
              {r.sensors.map(id => {
                const d = DEVICE_BY_ID[id]; if (!d) return null;
                const a = gAct && devActive(id);
                const p = dpos(d);
                const ln = trim(p.x, p.y, g.x, g.y, 4, 3.5);
                return (
                  <line key={`s${id}`} {...ln}
                    stroke={a ? 'rgba(224,153,47,.9)' : 'rgba(232,226,214,.5)'}
                    strokeWidth={a ? 0.3 : 0.18}
                    strokeLinecap="round"
                    strokeDasharray="0.7 0.8"
                    opacity={a ? 1 : anyFocus ? 0.2 : 0.6} />
                );
              })}
              {r.targets.map(id => {
                const d = DEVICE_BY_ID[id]; if (!d) return null;
                const a = gAct && devActive(id);
                const p = dpos(d);
                const ln = trim(g.x, g.y, p.x, p.y, 3.5, 4.5);
                return (
                  <line key={`t${id}`} {...ln}
                    stroke={a ? '#E0992F' : 'rgba(232,226,214,.55)'}
                    strokeWidth={a ? 0.3 : 0.18}
                    strokeLinecap="round"
                    opacity={a ? 1 : anyFocus ? 0.2 : 0.65} />
                );
              })}
            </g>
          );
        })}

        {/* physical switch → the device it controls. Same solid edge as a rule's
            action, since a press acts on the device — but the switch keeps its own
            device bubble rather than becoming a gear/rule node. */}
        {SWITCH_LINKS.map(([sw, dev]) => {
          const s = DEVICE_BY_ID[sw], d = DEVICE_BY_ID[dev];
          if (!s || !d) return null;
          const a = devActive(sw) && devActive(dev);
          const ps = dpos(s), pd = dpos(d);
          const ln = trim(ps.x, ps.y, pd.x, pd.y, 3, 4.5);
          return (
            <line key={`sw${sw}-${dev}`} {...ln}
              stroke={a ? '#E0992F' : 'rgba(232,226,214,.55)'}
              strokeWidth={a ? 0.3 : 0.18}
              strokeLinecap="round"
              opacity={a ? 1 : anyFocus ? 0.2 : 0.65} />
          );
        })}

        {/* socket → device power links */}
        {POWER_LINKS.map(([sock, dev]) => {
          const s = DEVICE_BY_ID[sock], d = DEVICE_BY_ID[dev];
          if (!s || !d) return null;
          const a = devActive(sock) && devActive(dev);
          const ps = dpos(s), pd = dpos(d);
          const ln = trim(ps.x, ps.y, pd.x, pd.y, 4, 4.5);
          return (
            <line key={`pw${sock}`} {...ln}
              stroke={a ? '#E0992F' : 'rgba(232,226,214,.55)'}
              strokeWidth={a ? 0.3 : 0.18}
              strokeLinecap="round"
              opacity={a ? 1 : anyFocus ? 0.2 : 0.65} />
          );
        })}
      </svg>

      {/* Device nodes */}
      {DEVICES.map(d => {
        const entity = devices.find(e => e.entity_id === d.entityId);
        // Switches stay neutral — see FloorMapView: their display entity is the
        // device they control, so "on" would report that device, not the switch.
        const on = !isSwitch(d.id) && d.control !== 'button' && d.control !== 'switchpanel' && (entity?.state === 'on' || entity?.state === 'heat');
        const active = devActive(d.id);
        return (
          <GraphBubble
            key={d.id}
            device={{ ...d, ...dpos(d) }}
            on={on}
            selected={selectedDevice === d.id}
            active={active}
            showLabel={selectedDevice === d.id || (anyFocus && active)}
            mini={d.mini}
            onClick={() => onSelectDevice(selectedDevice === d.id ? null : d.id)}
          />
        );
      })}

      {/* Gear (automation) nodes */}
      {RULE_LINKS.map(r => {
        const g = GEAR_POS[r.ruleId];
        if (!g) return null;
        return (
          <GearBubble
            key={r.ruleId}
            name={r.name}
            x={g.x} y={g.y}
            selected={selectedRule === r.ruleId}
            active={gearActive(r)}
            onClick={() => onSelectRule(selectedRule === r.ruleId ? null : r.ruleId)}
          />
        );
      })}
    </FloorMapFrame>
  );
}
