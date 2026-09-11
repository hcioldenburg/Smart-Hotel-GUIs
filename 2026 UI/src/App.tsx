import { useState, useMemo } from 'react';
import TopBar from './components/TopBar';
import SidebarRail from './components/SidebarRail';
import YourRoom from './pages/YourRoom';
import AllDevices from './pages/AllDevices';
import AllRules from './pages/AllRules';
import RecordActivity from './RecordActivity';
import PendingReaper from './components/PendingReaper';
import { useIsMobile } from './hooks/useMediaQuery';

type Page = 'room' | 'devices' | 'rules';

function getCondition(): 1 | 2 {
  // Explicit ?condition=1|2 always wins (handy for testing either build on one port).
  const p = new URLSearchParams(window.location.search).get('condition');
  if (p === '1') return 1;
  if (p === '2') return 2;
  // Otherwise the dev-server port decides: 5172 → condition 1, 5173 → condition 2.
  // Any other port (e.g. a preview/prod build) falls back to condition 1.
  return window.location.port === '5173' ? 2 : 1;
}

export default function App() {
  const condition = useMemo(getCondition, []);
  const isMobile = useIsMobile();
  const [page, setPage] = useState<Page>('room');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedRule,   setSelectedRule]   = useState<string | null>(null);

  // Table selections are independent and persist across tab switches.
  const selectDevice = (id: string | null) => setSelectedDevice(id);
  const selectRule   = (id: string | null) => setSelectedRule(id);
  // From a device's "Attached Rules": jump to the Rules tab, keep the device selected.
  const openRuleFromDevice = (id: string | null) => { setSelectedRule(id); setPage('rules'); };
  // Inside Your Room only one panel shows at a time, so selecting one clears the other.
  const roomSelectDevice = (id: string | null) => { setSelectedDevice(id); setSelectedRule(null); };
  const roomSelectRule   = (id: string | null) => { setSelectedRule(id); setSelectedDevice(null); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)' }}>
      <PendingReaper />
      <TopBar />
      <SidebarRail
        active={page}
        onSelect={setPage}
        footer={<RecordActivity condition={condition} />}
      />

      <main style={{
        marginTop: 64,
        marginLeft: isMobile ? 0 : 90,
        padding: isMobile ? '18px 16px 88px' : '32px 32px 64px',
        minHeight: 'calc(100vh - 64px)',
      }}>
        {page === 'room' && (
          <YourRoom
            condition={condition}
            selectedDevice={selectedDevice}
            onSelectDevice={roomSelectDevice}
            selectedRule={selectedRule}
            onSelectRule={roomSelectRule}
          />
        )}
        {page === 'devices' && (
          <AllDevices
            selectedDevice={selectedDevice}
            onSelectDevice={selectDevice}
            onSelectRule={openRuleFromDevice}
          />
        )}
        {page === 'rules' && (
          <AllRules
            selectedRule={selectedRule}
            onSelectRule={selectRule}
          />
        )}
      </main>
    </div>
  );
}
