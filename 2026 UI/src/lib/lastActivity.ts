import type { DeviceDef } from '../data/devices';

interface Timestamped { last_changed?: string; last_updated?: string }

/**
 * Controls whose meaningful change lives in an attribute rather than in `state`.
 * A cover is `open` at 80% and still `open` at 49%; a light is `on` at any
 * brightness; a heater is `heat` at any setpoint.
 */
const ATTRIBUTE_DRIVEN = new Set(['cover-h', 'cover-v', 'light', 'heater']);

/**
 * When the device last did something a participant would call a change.
 *
 * Home Assistant advances `last_changed` only on a `state` transition, so for
 * these controls it can sit hours stale while the thing was just moved — the
 * roller shutter reported `last_changed` 3.4 hours old moments after being
 * commanded, because only `last_updated` tracks the position attribute.
 *
 * Sensors deliberately keep `last_changed`: their state *is* the reading, and
 * attribute-only churn (battery, signal strength) must never be reported as the
 * door having just opened. That also preserves the connection-error fault in
 * lib/faultSim.ts, which freezes the whole entity so the "x min ago" label goes
 * on ageing against a pinned timestamp.
 */
export function lastActivity(
  device: DeviceDef,
  entity: Timestamped | null | undefined,
): string | undefined {
  if (!entity) return undefined;
  return ATTRIBUTE_DRIVEN.has(device.control)
    ? entity.last_updated ?? entity.last_changed
    : entity.last_changed;
}
