import { useSyncExternalStore } from 'react';

/**
 * Tracks whether a cover actually acted on a position command.
 *
 * usePending answers the same question for on/off devices, but a cover's
 * confirmation lives in `current_position`, not in `state` — the entity sits at
 * "open" the whole time it travels. So this store watches the position instead.
 *
 * The point is to tell a *connection* error apart from a *device* error. Under
 * interception the command never reaches the curtain: the slider moved, the
 * service call returned 200, and nothing happened. Without a cue the participant
 * has no way to see that — the optimistic value quietly reverts on the next tab
 * switch and the fault reads as "I must have mis-dragged".
 *
 *   waiting  — command sent, HA hasn't reported any movement yet
 *   failed   — the entity dropped off HA, or the position never budged before
 *              the deadline → the portal couldn't reach the device
 *
 * An entry clears (back to idle) as soon as the position does move, so a slow
 * but healthy curtain is never accused, and a recovered link heals the badge on
 * its own.
 */
export type CoverAck = 'idle' | 'waiting' | 'failed';

interface AckEntry {
  /** Position HA reported when the command went out. Movement off this = success. */
  baseline: number;
  /** When to give up waiting (ignored once failed). */
  deadline: number;
  failed: boolean;
}

const acks = new Map<string, AckEntry>();
let snapshot: ReadonlyMap<string, CoverAck> = new Map();
const listeners = new Set<() => void>();

function commit() {
  snapshot = new Map(
    [...acks].map(([eid, e]) => [eid, e.failed ? 'failed' : 'waiting'] as const),
  );
  listeners.forEach(l => l());
}

/**
 * Start waiting on a position command. `baseline` must be the position HA last
 * reported — NOT the optimistic value, which already shows the target.
 *
 * Re-commanding while failed puts the entry back into `waiting`, so a retry
 * spins again rather than staying stuck on "No Response".
 */
export function markCoverPending(entityId: string, baseline: number, ttlMs = 7_000) {
  acks.set(entityId, { baseline, deadline: Date.now() + ttlMs, failed: false });
  commit();
}

export function clearCoverAck(entityId: string) {
  if (acks.delete(entityId)) commit();
}

/** A cover entity as the reaper sees it: live state + last known position. */
export interface CoverSample { state: string; position: number | null }

const OFFLINE = new Set(['unavailable', 'unknown']);

/**
 * Resolve outstanding entries against the live cover states. Called on every
 * state push and once a second (see PendingReaper) so an entity that simply
 * stops reporting still times out.
 */
export function reapCoverAcks(live: Map<string, CoverSample>) {
  const now = Date.now();
  let changed = false;

  for (const [eid, entry] of acks) {
    const sample = live.get(eid);
    const moved = sample != null
      && sample.position !== null
      && sample.position !== entry.baseline;

    // Movement is the only proof the command landed — it clears both a pending
    // wait and a failure that has since recovered.
    if (moved) { acks.delete(eid); changed = true; continue; }

    if (entry.failed) continue;

    // The entity vanishing from HA is an immediate verdict; otherwise we wait
    // out the deadline before calling it.
    if ((sample != null && OFFLINE.has(sample.state)) || now >= entry.deadline) {
      entry.failed = true;
      changed = true;
    }
  }

  if (changed) commit();
}

function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
function getSnapshot() { return snapshot; }

/** Reactive ack status for one cover. */
export function useCoverAck(entityId: string): CoverAck {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot).get(entityId) ?? 'idle';
}
