import { SvgIcon } from '../lib/deviceIcons';
import { useIsMobile } from '../hooks/useMediaQuery';

type Page = 'room' | 'devices' | 'rules';

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'room',    label: 'Your Room',   icon: 'home'  },
  { id: 'devices', label: 'All Devices', icon: 'devices' },
  { id: 'rules',   label: 'All Rules',   icon: 'rules' },
];

interface Props {
  active: Page;
  onSelect: (p: Page) => void;
  // Rendered as the last rail item (bottom of the rail on desktop, last slot on
  // the mobile bottom bar) — used for the Study Recorder.
  footer?: React.ReactNode;
}

export default function SidebarRail({ active, onSelect, footer }: Props) {
  const isMobile = useIsMobile();

  // Mobile: a fixed horizontal bottom bar. Desktop: the tall left rail.
  const nav: React.CSSProperties = isMobile
    ? {
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30,
        height: 64, background: 'var(--c-rail)',
        borderTop: '1px solid rgba(0,0,0,.25)',
        display: 'flex', flexDirection: 'row', alignItems: 'stretch',
        paddingTop: 0,
      }
    : {
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 30,
        width: 90, background: 'var(--c-rail)',
        display: 'flex', flexDirection: 'column', alignItems: 'stretch',
        paddingTop: 80,
      };

  return (
    <nav style={nav}>
      {NAV.map(({ id, label, icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            aria-label={label}
            data-nav={label}
            style={{
              flex: isMobile ? 1 : undefined,
              width: isMobile ? undefined : 90,
              height: isMobile ? '100%' : 80,
              border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 3 : 5,
              background: isActive ? '#F4F1EA' : 'transparent',
              color: isActive ? '#25242A' : '#C7C3BB',
              transition: 'all .15s',
            }}
          >
            <SvgIcon name={icon} size={isMobile ? 24 : 34} color={isActive ? '#C97E1E' : '#A7A399'} sw={1.8} />
            <span style={{ fontSize: isMobile ? 10 : 10.5, fontWeight: 600, lineHeight: 1.2, textAlign: 'center', letterSpacing: '0.01em' }}>
              {label}
            </span>
          </button>
        );
      })}

      {footer && (
        <div style={isMobile ? { flex: 1, display: 'flex' } : { marginTop: 'auto' }}>
          {footer}
        </div>
      )}
    </nav>
  );
}
