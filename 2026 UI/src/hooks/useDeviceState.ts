/**
 * Provides live state for a single HA entity from the useDevices singleton.
 * Also exposes service-call helpers with optimistic update + revert.
 */
import { useMemo } from 'react';
import { useDevices } from './useDevices';
import { HA_HEADERS } from '../config';

export function useDeviceState(entityId: string) {
  const { devices } = useDevices();
  const entity = useMemo(() => devices.find(d => d.entity_id === entityId) ?? null, [devices, entityId]);

  const state: string = entity?.state ?? '';
  const attrs: Record<string, unknown> = entity?.attributes ?? {};

  async function call(domain: string, service: string, data: Record<string, unknown> = {}) {
    await fetch(`/api/services/${domain}/${service}`, {
      method: 'POST',
      headers: HA_HEADERS,
      body: JSON.stringify({ entity_id: entityId, ...data }),
    });
  }

  /**
   * Run an HA script, passing `data` as its fields. Unlike `call` this sends no
   * entity_id — the script targets its own entities, and an entity_id here would
   * be read as a target for the script itself.
   */
  async function callScript(scriptEntityId: string, data: Record<string, unknown> = {}) {
    const objectId = scriptEntityId.replace(/^script\./, '');
    await fetch(`/api/services/script/${objectId}`, {
      method: 'POST',
      headers: HA_HEADERS,
      body: JSON.stringify(data),
    });
  }

  return { entity, state, attrs, call, callScript };
}
