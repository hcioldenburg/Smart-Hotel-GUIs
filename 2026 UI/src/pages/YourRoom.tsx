import { useState } from 'react';
import { DEVICE_BY_ID } from '../data/devices';
import type { DeviceCategory } from '../data/devices';
import DeviceTile from '../components/DeviceTile';
import FilterPills, { type FilterId } from '../components/FilterPills';
import DeviceDetailPanel from '../components/DeviceDetailPanel';
import RuleDetailPanel from '../components/RuleDetailPanel';
import FloorMapView from './FloorMapView';
import DependenciesView from './DependenciesView';
import ConnectionsView from './ConnectionsView';
import DetailOverlay from '../components/DetailOverlay';
import { SvgIcon } from '../lib/deviceIcons';
import { useIsMobile } from '../hooks/useMediaQuery';

type SubView = 'devices' | 'dependencies' | 'connections';

interface Props {
  condition: 1 | 2;
  selectedDevice: string | null;
  onSelectDevice: (id: string | null) => void;
  selectedRule: string | null;
  onSelectRule: (id: string | null) => void;
}

interface GroupDef { label: string; icon: string; cat: DeviceCategory; ids: string[] }
// Condition 1 (dashboard) shows devices only. The physical switches (sw_*) are
// automations, not devices, so they are deliberately absent here — they appear
// in All Rules, and on the floor map / dependency graph in Condition 2.
const GROUP_DEFS: GroupDef[] = [
  { label: 'Lights',     icon: 'bulb',   cat: 'Lights',     ids: ['wld', 'wlw', 'bll', 'blr', 'flr'] },
  { label: 'Appliances', icon: 'fan',    cat: 'Appliances', ids: ['cur', 'rsh', 'fan', 'fansock', 'htr'] },
  { label: 'TV & Media', icon: 'tv',     cat: 'Media',      ids: ['tv'] },
  { label: 'Sensors',    icon: 'motion', cat: 'Sensors',    ids: ['pres', 'door', 'win', 'th'] },
];

// Convert the FilterPills selection into a category list (empty = no filter)
function toCategories(filter: FilterId[]): DeviceCategory[] {
  if (filter.includes('All')) return [];
  return filter.filter((f): f is DeviceCategory => f !== 'All');
}

function GroupCard({ def, fill }: { def: GroupDef; fill?: boolean }) {
  const devs = def.ids.map(id => DEVICE_BY_ID[id]).filter(Boolean);
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #ECE6D9', borderRadius: 18, boxShadow: '0 10px 30px rgba(40,38,32,.06)', padding: '18px 20px 20px', width: '100%', height: fill ? '100%' : undefined, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: '#F4F0E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SvgIcon name={def.icon} size={17} color="#9A6A1E" sw={1.9} />
        </span>
        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, color: '#2F2D28' }}>{def.label}</span>
        <span style={{ fontSize: 12, color: '#A39E93', fontWeight: 600 }}>{devs.length} devices</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 6px', justifyContent: 'space-around', alignItems: 'flex-start' }}>
        {devs.map(d => <DeviceTile key={d.id} device={d} />)}
      </div>
    </div>
  );
}

function Condition1() {
  const [filter, setFilter] = useState<FilterId[]>(['All']);
  const categories = toCategories(filter);
  const show = (cat: DeviceCategory) => categories.length === 0 || categories.includes(cat);

  const lights = GROUP_DEFS[0], appliances = GROUP_DEFS[1], media = GROUP_DEFS[2], sensors = GROUP_DEFS[3];

  return (
    <>
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 26, color: 'var(--c-ink)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Your Room</h1>
      <div style={{ marginTop: 18, marginBottom: 22 }}>
        <FilterPills selected={filter} onChange={setFilter} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {show(lights.cat) && <GroupCard def={lights} />}
        {show(appliances.cat) && <GroupCard def={appliances} />}
        {(show(media.cat) || show(sensors.cat)) && (
          <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', flexWrap: 'wrap' }}>
            {show(media.cat) && <div style={{ flex: '2 1 280px', minWidth: 0, display: 'flex' }}><GroupCard def={media} fill /></div>}
            {show(sensors.cat) && <div style={{ flex: '3 1 440px', minWidth: 0, display: 'flex' }}><GroupCard def={sensors} fill /></div>}
          </div>
        )}
      </div>
    </>
  );
}

const VIEW_TABS: { id: SubView; label: string; icon: string }[] = [
  { id: 'devices',      label: 'Devices',      icon: 'devices' },
  { id: 'dependencies', label: 'Rules',        icon: 'gear' },
  { id: 'connections',  label: 'Connections',  icon: 'connections' },
];

function Condition2({ selected, onSelect, selectedRule, onSelectRule }: { selected: string | null; onSelect: (id: string | null) => void; selectedRule: string | null; onSelectRule: (id: string | null) => void }) {
  const [sub, setSub] = useState<SubView>('devices');
  const [filter, setFilter] = useState<FilterId[]>(['All']);
  const categories = toCategories(filter);
  const isMobile = useIsMobile();

  return (
    <>
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: isMobile ? 22 : 26, color: 'var(--c-ink)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Your Room</h1>

      <div style={{ marginTop: 18, marginBottom: 22 }}>
        <FilterPills selected={filter} onChange={setFilter} />
      </div>

      {/* Desktop: rail | map | detail side by side. Mobile: rail on top, map full
          width, detail promoted to a bottom sheet. */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 20, alignItems: isMobile ? 'stretch' : 'flex-start' }}>
        {/* view rail — horizontal scroller on mobile, vertical column on desktop */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          gap: 9, flexShrink: 0,
          width: isMobile ? '100%' : 158,
          overflowX: isMobile ? 'auto' : undefined,
          paddingTop: 2,
        }}>
          {VIEW_TABS.map(t => {
            const active = sub === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSub(t.id)}
                data-nav={t.label}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: 10,
                  width: isMobile ? undefined : '100%', flex: isMobile ? 1 : undefined,
                  textAlign: 'left', whiteSpace: 'nowrap',
                  border: active ? '1px solid #EAD3A4' : '1px solid transparent',
                  cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
                  fontFamily: 'inherit', padding: '12px 15px', borderRadius: 13,
                  transition: 'all .15s',
                  background: active ? '#FFFFFF' : '#F0EBDF',
                  color: active ? '#25242A' : '#8A857A',
                  boxShadow: active ? '0 3px 10px rgba(40,38,32,.10)' : 'none',
                }}
              >
                <SvgIcon name={t.icon} size={18} color={active ? '#9A6A1E' : '#8A857A'} sw={1.8} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* floor map / graph — fills the middle column, stays a constant width */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>
          {sub === 'devices' && (
            <FloorMapView selectedDevice={selected} onSelectDevice={onSelect} categories={categories} />
          )}
          {sub === 'dependencies' && (
            <DependenciesView
              selectedDevice={selected} onSelectDevice={onSelect}
              selectedRule={selectedRule} onSelectRule={onSelectRule}
              categories={categories}
            />
          )}
          {sub === 'connections' && (
            <ConnectionsView selectedDevice={selected} onSelectDevice={onSelect} categories={categories} />
          )}
        </div>

        {/* right column — reserved on desktop so the map never resizes and the
            device/rule cards keep a constant width. Hidden on mobile (uses the
            bottom sheet below instead). */}
        {!isMobile && (
          <div style={{ width: 360, flexShrink: 0 }}>
            {selected && !selectedRule && (
              <DeviceDetailPanel deviceId={selected} onClose={() => onSelect(null)} onSelectRule={onSelectRule} />
            )}
            {selectedRule && (
              <RuleDetailPanel ruleId={selectedRule} onClose={() => onSelectRule(null)} />
            )}
          </div>
        )}
      </div>

      {isMobile && selected && !selectedRule && (
        <DetailOverlay onClose={() => onSelect(null)}>
          <DeviceDetailPanel deviceId={selected} onClose={() => onSelect(null)} onSelectRule={onSelectRule} />
        </DetailOverlay>
      )}
      {isMobile && selectedRule && (
        <DetailOverlay onClose={() => onSelectRule(null)}>
          <RuleDetailPanel ruleId={selectedRule} onClose={() => onSelectRule(null)} />
        </DetailOverlay>
      )}
    </>
  );
}

export default function YourRoom({ condition, selectedDevice, onSelectDevice, selectedRule, onSelectRule }: Props) {
  return condition === 1
    ? <Condition1 />
    : <Condition2 selected={selectedDevice} onSelect={onSelectDevice} selectedRule={selectedRule} onSelectRule={onSelectRule} />;
}
