import { useEffect, useRef } from 'react';
import { useDevices } from '../hooks/useDevices';
import { reapPending } from '../hooks/usePending';
import { reapCoverAcks, type CoverSample } from '../hooks/useCoverAck';

/**
 * Invisible worker: watches live entity states (pushed over the WebSocket) and
 * clears "pending / updating" markers once a device confirms its new state, or
 * after their TTL. Kept as its own component so only it re-renders on each
 * state push, not the whole app.
 *
 * Covers are resolved separately (useCoverAck): their confirmation is a change
 * in `current_position`, which `state` never reflects.
 */
export default function PendingReaper() {
  const { devices } = useDevices();

  // Latest cover sample, kept in a ref so the 1s sweep below can re-check it
  // without restarting its interval on every state push.
  const covers = useRef<Map<string, CoverSample>>(new Map());

  // Confirmed state changes → clear immediately.
  useEffect(() => {
    const states = new Map<string, string>(devices.map((d: any) => [d.entity_id, d.state]));
    reapPending(states);

    covers.current = new Map(
      devices
        .filter((d: any) => d.entity_id.startsWith('cover.'))
        .map((d: any) => {
          // An unavailable cover comes back with its attributes stripped, so a
          // missing position means "no reading", not "position 0".
          const pos = d.attributes?.current_position;
          return [d.entity_id, { state: d.state, position: typeof pos === 'number' ? pos : null }] as const;
        }),
    );
    reapCoverAcks(covers.current);
  }, [devices]);

  // Sweep expired markers even when no state push arrives (unresponsive device).
  useEffect(() => {
    const id = setInterval(() => {
      reapPending(new Map());
      reapCoverAcks(covers.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}
