import { useSyncExternalStore } from 'react';

/**
 * Tracks devices that have been commanded but whose live state hasn't caught up
 * yet — e.g. the TV, which is driven by a script and only reports "on" once the
 * physical set responds (sometimes seconds later, sometimes never).
 *
 * A pending entry clears when the live state moves off the baseline captured at
 * command time (see PendingReaper) or when its TTL elapses, so a non-responsive
 * device never spins forever.
 */
interface PendingEntry { baseline: string; deadline: number; }

const pending = new Map<string, PendingEntry>();
let idSnapshot: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

function commit() {
  idSnapshot = new Set(pending.keys());
  listeners.forEach(l => l());
}

// The TTL must stay comfortably ABOVE the slowest source entity's reporting
// interval. The TV's status derives from sensor.socket_tv_power, which the
// Zigbee plug reports every ~10s — with a 10s TTL the deadline sat inside that
// jitter window, so identical presses randomly confirmed or timed out depending
// on where in the interval they landed. 15s leaves headroom for a full report
// cycle, which makes a timeout mean the device really didn't respond.
export function markPending(entityId: string, baseline: string, ttlMs = 15_000) {
  pending.set(entityId, { baseline, deadline: Date.now() + ttlMs });
  commit();
}

export function clearPending(entityId: string) {
  if (pending.delete(entityId)) commit();
}

// Transient states a device may blip through mid-transition (e.g. the Fire TV
// goes unavailable while powering up) — these are NOT the confirmed new state,
// so the "Updating" badge must keep spinning until a real value settles.
const TRANSIENT = new Set(['', 'unavailable', 'unknown']);

/** Clear entries whose live state has settled to a real value different from
 *  baseline, or that expired. */
export function reapPending(liveStates: Map<string, string>) {
  const now = Date.now();
  let changed = false;
  for (const [eid, entry] of pending) {
    const live = liveStates.get(eid);
    const settled = live !== undefined && !TRANSIENT.has(live) && live !== entry.baseline;
    if (now >= entry.deadline || settled) {
      pending.delete(eid);
      changed = true;
    }
  }
  if (changed) commit();
}

function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
function getSnapshot() { return idSnapshot; }

/** Reactive set of entity_ids currently awaiting confirmation. */
export function usePendingIds(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
