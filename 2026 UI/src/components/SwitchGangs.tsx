/**
 * Renders the gangs (buttons) of a multi-gang wall switch.
 *
 * READ-ONLY: a wall switch is pressed in the room, not from the dashboard. Each
 * gang is its own ps_* automation, so each reports its own last press — that is
 * the one signal that tells you whether the system registered the press at all.
 * The gang deliberately does NOT show the state of the light it controls: that
 * would read as the switch's own state.
 */
import { usePsTriggers } from '../hooks/useAutomation';
import { formatTriggered } from '../lib/time';
import type { Gang } from '../data/devices';

function GangRow({ gang, lastPressed }: { gang: Gang; lastPressed: string | undefined }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FBF6EC', border: '1px solid #F0E4CC', borderRadius: 13, padding: '13px 15px' }}>
      <span style={{ fontWeight: 600, fontSize: 14, color: '#3A3833' }}>{gang.label}</span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: '#A39E93' }}>Last pressed</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#C97E1E' }}>{formatTriggered(lastPressed) || 'Never'}</span>
      </span>
    </div>
  );
}

export default function SwitchGangs({ gangs }: { gangs: Gang[] }) {
  const triggers = usePsTriggers();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {gangs.map(g => (
        <GangRow key={g.automationId} gang={g} lastPressed={triggers[g.automationId]} />
      ))}
    </div>
  );
}
