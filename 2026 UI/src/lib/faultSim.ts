/**
 * Connection-error simulation: freezes a sensor's state in the UI while Home
 * Assistant keeps seeing the real thing.
 *
 * The study distinguishes two sensor faults, and they need to look different:
 *
 *   device error     — the sensor is intercepted at the network layer, so HA
 *                      never receives a new state. Nothing here is involved:
 *                      the portal doesn't update and the ESP32 indicator light
 *                      doesn't blink, because both follow the same state change.
 *
 *   connection error — the sensor still reports normally (so the indicator
 *                      light blinks, and HA's own state is truthful), but the
 *                      portal has "lost its feed" and keeps showing the last
 *                      value it received.
 *
 * Interception can't produce the second case — killing the state change kills
 * the light too. So the connection error is driven from HA instead: flipping
 * `input_boolean.<sensor>_con_err_sim` tells the frontend to stop applying
 * updates for that entity.
 *
 * We freeze the whole entity object, not just `.state`, so `last_changed` stops
 * advancing too and the "x min ago" labels keep aging — which is exactly how a
 * stale feed reads.
 */

/** Sensor entity → the HA input_boolean that freezes it. */
export const FREEZE_HELPERS: Record<string, string> = {
  'binary_sensor.sensor_door_contact': 'input_boolean.door_sensor_con_err_sim',
  'binary_sensor.sensor_window_contact': 'input_boolean.window_sensor_con_err_sim',
  'binary_sensor.presencesensor_presence': 'input_boolean.presence_sensor_con_err_sim',
};

/** Reverse lookup, so a state_changed on a helper finds the sensor it gates. */
const SENSOR_OF_HELPER: Record<string, string> = Object.fromEntries(
  Object.entries(FREEZE_HELPERS).map(([sensor, helper]) => [helper, sensor]),
);

export const isFreezeHelper = (entityId: string): boolean => entityId in SENSOR_OF_HELPER;

/** Live helper states, seeded from /api/states and kept current over the WS. */
const helperOn: Record<string, boolean> = {};

const SNAPSHOT_KEY = (entityId: string) => `shsim.frozen.${entityId}`;

/**
 * The frozen value has to survive a reload — a participant refreshing mid-fault
 * would otherwise re-fetch the real state and see the fault vanish. localStorage
 * is per-origin, and each condition runs on its own port, so the two builds keep
 * separate snapshots (which is what we want — they're separate sessions).
 */
function saveSnapshot(entityId: string, entity: unknown) {
  try { localStorage.setItem(SNAPSHOT_KEY(entityId), JSON.stringify(entity)); } catch { /* private mode */ }
}

function loadSnapshot(entityId: string): any | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY(entityId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function dropSnapshot(entityId: string) {
  try { localStorage.removeItem(SNAPSHOT_KEY(entityId)); } catch { /* ignore */ }
}

export const isFrozen = (entityId: string): boolean =>
  helperOn[FREEZE_HELPERS[entityId] ?? ''] === true;

/**
 * Apply a helper's state. Returns true if the freeze flipped, so the caller
 * knows to re-render / resync.
 *
 * `deviceMap` is the live entity cache: on freeze we snapshot the current entry,
 * on release we drop it so real updates flow again.
 */
export function applyHelperState(
  helperId: string,
  state: string,
  deviceMap: Map<string, any>,
): boolean {
  const sensorId = SENSOR_OF_HELPER[helperId];
  if (!sensorId) return false;

  const on = state === 'on';
  if (helperOn[helperId] === on) return false;
  helperOn[helperId] = on;

  if (on) {
    // Pin whatever the UI is showing right now; that's the last value the
    // "connection" delivered before it dropped.
    const current = deviceMap.get(sensorId);
    if (current) saveSnapshot(sensorId, current);
  } else {
    dropSnapshot(sensorId);
  }
  return true;
}

/**
 * Seed helper states from a full /api/states payload, and swap any frozen
 * sensor for its stored snapshot. Called on initial load, so a refresh during a
 * fault comes back up still showing the frozen value.
 *
 * If no snapshot exists (storage cleared, or a different device), we fall
 * through to HA's real state rather than inventing one — degraded, but honest.
 */
export function seedFromStates(all: any[], deviceMap: Map<string, any>): void {
  for (const entity of all) {
    if (isFreezeHelper(entity.entity_id)) helperOn[entity.entity_id] = entity.state === 'on';
  }
  for (const sensorId of Object.keys(FREEZE_HELPERS)) {
    if (!isFrozen(sensorId)) { dropSnapshot(sensorId); continue; }
    const snap = loadSnapshot(sensorId);
    if (snap) deviceMap.set(sensorId, snap);
  }
}
