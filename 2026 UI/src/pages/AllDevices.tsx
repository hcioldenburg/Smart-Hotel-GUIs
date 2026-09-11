import { useState } from 'react';
import { DEVICES, isSwitch } from '../data/devices';
import { lastActivity } from '../lib/lastActivity';
import type { FilterId } from '../components/FilterPills';
import { useDevices } from '../hooks/useDevices';
import { useIsMobile } from '../hooks/useMediaQuery';
import { usePendingIds } from '../hooks/usePending';
import FilterPills from '../components/FilterPills';
import DeviceDetailPanel from '../components/DeviceDetailPanel';
import DetailOverlay from '../components/DetailOverlay';
import ProcessingBadge from '../components/ProcessingBadge';
import { SvgIcon, DEVICE_ICON } from '../lib/deviceIcons';
import { sensorStateLabel } from '../lib/sensors';
import { formatTriggered } from '../lib/time';

interface Props {
  selectedDevice: string | null;
  onSelectDevice: (id: string | null) => void;
  onSelectRule: (id: string | null) => void;
}

// Desktop shows every column; mobile drops Category + Last changed to fit.
const GRID_DESKTOP = '2.2fr 1.2fr 1fr 1.2fr 40px';
const GRID_MOBILE = '1fr auto 34px';

function timeSince(iso: string | undefined): string {
  if (!iso) return '—';
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
  return `${Math.round(sec / 86400)}d ago`;
}

export default function AllDevices({ selectedDevice, onSelectDevice, onSelectRule }: Props) {
  const [filter, setFilter] = useState<FilterId[]>(['All']);
  const { devices: live } = useDevices();
  const isMobile = useIsMobile();
  const pendingIds = usePendingIds();
  const GRID = isMobile ? GRID_MOBILE : GRID_DESKTOP;

  const categories = filter.includes('All') ? [] : filter.filter(f => f !== 'All');
  // Physical switches are automations, not devices — they live in All Rules.
  const visible = DEVICES.filter(d => !isSwitch(d.id) && (categories.length === 0 || categories.includes(d.category)));
  const getState = (eid: string) => live.find(e => e.entity_id === eid);

  return (
    <div style={{ height: isMobile ? 'auto' : 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', overflow: isMobile ? 'visible' : 'hidden' }}>
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: isMobile ? 22 : 26, color: 'var(--c-ink)', letterSpacing: '-0.02em', flexShrink: 0 }}>All Devices</h1>
      <div style={{ marginTop: 18, marginBottom: 22, flexShrink: 0 }}>
        <FilterPills selected={filter} onChange={setFilter} />
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'stretch', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, background: '#FFFFFF', border: '1px solid #ECE6D9', borderRadius: 18, boxShadow: '0 10px 30px rgba(40,38,32,.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: isMobile ? '14px 16px' : '15px 22px', borderBottom: '1px solid #EFE9DD', fontSize: 12, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: '#A39E93', flexShrink: 0 }}>
            <span>Device</span>{!isMobile && <span>Category</span>}<span>State</span>{!isMobile && <span>Last changed</span>}<span />
          </div>

          {/* Scrollable rows */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {visible.map(d => {
            const entity = getState(d.entityId);
            const state = entity?.state ?? '';
            const pos = Number(entity?.attributes?.current_position ?? 0);
            const isCover = d.control === 'cover-h' || d.control === 'cover-v';
            const isSensor = d.control === 'sensor';
            const isButton = d.control === 'button';
            const isPanel = d.control === 'switchpanel';
            const isSocket = d.id === 'fansock';
            const on = !isButton && !isPanel && (state === 'on' || state === 'heat' || (isCover && pos > 0));
            const lit = on || (isCover && pos > 0);
            const isSelected = selectedDevice === d.id;

            let stateLabel: string;
            if (isSensor) stateLabel = sensorStateLabel(d, state);
            else if (isCover) stateLabel = `${pos}% Open`;
            else if (isButton) stateLabel = formatTriggered(entity?.attributes?.last_triggered as string | undefined) || 'Never';
            else if (isPanel) stateLabel = `${d.gangs?.length ?? 0} switches`;
            else stateLabel = on ? 'On' : 'Off';

            const pill = isSensor
              ? { bg: '#F1EDE4', color: '#6F6A60', weight: 600 }
              : lit
              ? { bg: '#FBEAC9', color: '#B8772A', weight: 700 }
              : { bg: '#F1EDE4', color: '#9A958C', weight: 600 };

            const avatarBg = lit ? '#F6E2BC' : '#F1EDE4';
            // Sensors share the standard dark icon colour; the yellow "enabled"
            // treatment still comes through via avatarBg when an active sensor
            // (presence/open) is lit.
            const iconColor = isSocket ? (on ? '#2A2008' : '#857F73') : '#2A2A30';

            return (
              <div
                key={d.id}
                data-device-id={d.id}
                aria-label={d.name}
                onClick={() => onSelectDevice(isSelected ? null : d.id)}
                style={{
                  display: 'grid', gridTemplateColumns: GRID, padding: isMobile ? '12px 16px' : '13px 22px', cursor: 'pointer',
                  borderBottom: '1px solid #F2EDE2', transition: 'background-color .12s',
                  background: isSelected ? '#FBF4E6' : 'transparent', alignItems: 'center',
                }}
              >
                {/* Device */}
                <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <span style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SvgIcon name={DEVICE_ICON[d.id] ?? 'plug'} size={isSocket ? 14 : 19} color={iconColor} sw={1.7} />
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#25242A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                </span>

                {/* Category */}
                {!isMobile && <span style={{ fontSize: 13.5, color: '#6F6A60' }}>{d.category}</span>}

                {/* State pill (or "Updating" while a command is awaiting confirmation) */}
                <span>
                  {pendingIds.has(d.entityId) ? (
                    <ProcessingBadge />
                  ) : (
                    <span style={{ display: 'inline-block', fontSize: 12, fontWeight: pill.weight, padding: '3px 10px', borderRadius: 999, background: pill.bg, color: pill.color, whiteSpace: 'nowrap' }}>
                      {stateLabel}
                    </span>
                  )}
                </span>

                {/* Last changed */}
                {!isMobile && <span style={{ fontSize: 13.5, color: '#6F6A60' }}>{timeSince(lastActivity(d, entity))}</span>}

                {/* Chevron */}
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <SvgIcon name="chevron" size={17} color={isSelected ? '#E0992F' : '#C2BCAF'} sw={2} />
                </span>
              </div>
            );
          })}
          </div>
        </div>

        {selectedDevice && !isMobile && (
          <div style={{ maxHeight: '100%', overflowY: 'auto', flexShrink: 0 }}>
            <DeviceDetailPanel
              deviceId={selectedDevice}
              onClose={() => onSelectDevice(null)}
              onSelectRule={onSelectRule}
              hideMeta
            />
          </div>
        )}
      </div>

      {selectedDevice && isMobile && (
        <DetailOverlay onClose={() => onSelectDevice(null)}>
          <DeviceDetailPanel
            deviceId={selectedDevice}
            onClose={() => onSelectDevice(null)}
            onSelectRule={onSelectRule}
            hideMeta
          />
        </DetailOverlay>
      )}
    </div>
  );
}
