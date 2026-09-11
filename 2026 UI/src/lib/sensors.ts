import type { DeviceDef } from '../data/devices';

/**
 * Human-readable state for the sensor devices — HA reports raw on/off (or a bare
 * number), which we translate into the domain wording:
 *   presence → Present / Away
 *   door / window contact → Open / Closed
 *   temperature → value with a °C unit
 */
export function sensorStateLabel(device: DeviceDef, state: string | undefined): string {
  if (!state || state === 'unavailable' || state === 'unknown') return '—';
  if (device.id === 'th')   return `${state}°C`;
  if (device.id === 'pres') return state === 'on' ? 'Present' : 'Away';
  // door / window contact sensors: on = open circuit = open
  return state === 'on' ? 'Open' : 'Closed';
}
