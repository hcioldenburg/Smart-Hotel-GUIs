/**
 * Acknowledgement cue for a commanded device: spins while the command is in
 * flight, then says "No Response" if the device never acknowledged it.
 *
 * THE WORDING REPORTS AN OBSERVATION, NOT A VERDICT. "No Response" is equally
 * consistent with an unreachable device and with a reachable-but-seized one —
 * telling those two apart is exactly what the participant is asked to do, so
 * this badge must never name the fault class. (It read "Not connected" until
 * 2026-07-21, which handed over the answer.)
 *
 * A device that is reachable AND acknowledging must not show this at all — see
 * useCoverAck, which clears the moment the reported position moves.
 */
import ProcessingBadge from './ProcessingBadge';

interface Props {
  status: 'idle' | 'waiting' | 'failed';
  /** Spinner / icon only, no text — for spots too tight even for the dense pill. */
  compact?: boolean;
  /** Tighter type and padding, so the pill fits the 126px device tile. */
  dense?: boolean;
}

export default function LinkStatusBadge({ status, compact = false, dense = false }: Props) {
  if (status === 'idle') return null;
  if (status === 'waiting') return <ProcessingBadge compact={compact} label="Sending" />;

  const icon = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {/* triangle-alert. NOT a wifi-off glyph: the icon must not name the fault
          class any more than the label does — a struck-through radio symbol says
          "connection problem", which is the participant's call to make. */}
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );

  if (compact) return <span style={{ color: '#C0552F', display: 'inline-flex' }} title="No Response">{icon}</span>;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: dense ? 11 : 12, fontWeight: 600, color: '#C0552F',
      background: '#FBE4DC', borderRadius: 999, padding: dense ? '2px 8px' : '3px 10px',
      whiteSpace: 'nowrap',
    }}>
      {icon}
      No Response
    </span>
  );
}
