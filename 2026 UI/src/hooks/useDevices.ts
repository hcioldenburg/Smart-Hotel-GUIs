import { useEffect, useState, useRef } from "react";
import { TOKEN } from "../config";
import { applyHelperState, FREEZE_HELPERS, isFreezeHelper, isFrozen, seedFromStates } from "../lib/faultSim";
import axios from "axios";

// Connect to HA over the app's OWN origin (dev server), which proxies /api to
// Home Assistant (see vite.config.ts). Using window.location instead of a
// hardcoded localhost lets other devices (e.g. an iPad on the LAN) connect too —
// they reach the dev server, and only the dev machine talks to HA.
const WS_URL = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/websocket`;
const LOGBOOK_EVENT_TYPES = ["state_changed", "call_service", "automation_triggered"];

// Reusable device filtering function
const shouldIncludeDevice = (entityId: string, friendlyName: string): boolean => {
  // Match main devices but exclude sub-sensors by using specific patterns
  const isWantedDevice = (
    // Main device patterns (exact domain matches)
    /^(light\.|switch\.|climate\.|fan\.|media_player\.|cover\.)/i.test(entityId) ||
    // Presence sensors (specific pattern)
    /^(binary_sensor\.presencesensor|binary_sensor\.sensor_door_contact|binary_sensor\.sensor_window_contact|binary_sensor\.tv_status|sensor\.temp_humid_temperature|sensor\.h1switch_door_battery|sensor\.rolloswitch_battery|sensor\.sf_01_battery|sensor\.sf_02_battery)/i.test(entityId) ||
    // Friendly name patterns for main devices
    /^(light|switch|climate|fan|media|rollo)$/i.test(friendlyName) || 
    /^(light|switch|climate|fan|media|rollo)\s/i.test(friendlyName) // Starts with device type
  );
  
  const isUnwantedDevice = 
  /(camera|cam|shhub|cabinet|cube|sun|home|aircast|rest|toggle|control|automation)/i.test(friendlyName) ||
  /(device_temperature|target_distance|movement|spatial_learning|restart_device|identify|motion_sensitivity|detection_range|battery|voltage|schedule|detection|sensor\.time|floodlight|update\.|automation\.|switch\.zigbee2mqtt_bridge_permit_join|switch\.0x54ef441000c939e0_hand_open|switch\.heater_child_lock|switch\.socket_bedlight|switch\.smartfan_)/i.test(entityId);
  
  return isWantedDevice && !isUnwantedDevice;
};

// === Singleton WebSocket ===
let socket: WebSocket | null = null;
const listeners: Record<string, Set<(event: any) => void>> = {};

const ensureSocketConnection = () => {
  if (socket && socket.readyState <= 1) return;

  socket = new WebSocket(WS_URL);
  let msgId = 1;

  socket.onopen = () => {
    socket?.send(JSON.stringify({ type: "auth", access_token: TOKEN }));
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "auth_ok") {
      LOGBOOK_EVENT_TYPES.forEach((eventType) => {
        socket?.send(JSON.stringify({
          id: msgId++,
          type: "subscribe_events",
          event_type: eventType,
        }));
      });
    }

    if (msg.type === "event" && msg.event?.event_type) {
      const type = msg.event.event_type;
      listeners[type]?.forEach((cb) => cb(msg.event));
    }
  };

  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
};

// === WebSocket event subscription hook ===
const useHAEvent = (
  eventType: string,
  callback: (event: any) => void
) => {
  useEffect(() => {
    ensureSocketConnection();

    if (!listeners[eventType]) listeners[eventType] = new Set();
    listeners[eventType].add(callback);

    return () => {
      listeners[eventType].delete(callback);
      if (listeners[eventType].size === 0) delete listeners[eventType];
    };
  }, [eventType, callback]);
};

// After a connection-error sim is switched off, the UI is still holding the
// frozen snapshot and would keep holding it until the sensor next changes. Pull
// the real states so it snaps back immediately.
const resyncFrozenSensors = (
  deviceMap: Map<string, any>,
  setDevices: (d: any[]) => void,
) => {
  const stale = Object.keys(FREEZE_HELPERS).filter((id) => !isFrozen(id));
  Promise.all(
    stale.map((id) =>
      fetch(`/api/states/${id}`, { headers: { Authorization: `Bearer ${TOKEN}` } })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ),
  ).then((entities) => {
    entities.forEach((e: any) => { if (e?.entity_id) deviceMap.set(e.entity_id, e); });
    setDevices(Array.from(deviceMap.values()));
  });
};

// === Real-time device hook ===
export const useDevices = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const deviceMap = useRef(new Map<string, any>());

  useEffect(() => {
    fetch("/api/states", {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch devices");
        return res.json();
      })
      .then((data) => {
        const filtered = data.filter((entity: any) => {
          const entityId = entity.entity_id || "";
          const friendlyName = entity.attributes?.friendly_name || "";

          return shouldIncludeDevice(entityId, friendlyName);
        });

        filtered.forEach((e: any) => deviceMap.current.set(e.entity_id, e));
        // Read the connection-error helpers out of the same payload (they're
        // filtered out of the device list above, and must stay that way — a
        // stray input_boolean tile mid-study would give the game away), then
        // restore any frozen sensor to its snapshot.
        seedFromStates(data, deviceMap.current);
        setDevices(Array.from(deviceMap.current.values()));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  }, []);


  useHAEvent("state_changed", (event) => {
    const newState = event.data?.new_state;
    if (!newState) return;

    const entityId = newState.entity_id || "";
    const friendlyName = newState.attributes?.friendly_name || "";

    // A connection-error helper flipped. Checked before the device filter, which
    // (correctly) rejects input_boolean.* — the helper drives the UI but must
    // never appear in it.
    if (isFreezeHelper(entityId)) {
      if (applyHelperState(entityId, newState.state, deviceMap.current)) {
        // On release, pull the sensor's real state so the UI catches up at once
        // instead of waiting for the door to next move.
        if (!isFrozen(entityId)) resyncFrozenSensors(deviceMap.current, setDevices);
        setDevices(Array.from(deviceMap.current.values()));
      }
      return;
    }

    if (!shouldIncludeDevice(entityId, friendlyName)) return;

    // Connection error in progress: HA saw this, the portal "didn't".
    if (isFrozen(entityId)) return;

    deviceMap.current.set(newState.entity_id, newState);
    setDevices(Array.from(deviceMap.current.values()));
  });
    //console.log("State changed for following devices", devices);

    //console.log("Logged devices", devices);

  return { devices, loading, error };
};

// === Real-time logbook hook ===
export const useLogbook = (entityIds: string[]) => {
  const [logbook, setLogbook] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setInitialLoadComplete] = useState(false);
  const entitySet = useRef<Set<string>>(new Set());

  // Fetch logbook data for all entities
  const fetchLogbookData = async (isInitialLoad = false) => {
    if (entityIds.length === 0) return;

    // Filter out unwanted entities
    const filteredEntityIds = entityIds.filter(entityId => 
      entityId !== 'sensor.time' &&
      entityId !== 'script.tick_experiment_clock' &&
      entityId !== 'automation.tick_participant_clock_every_second'
    );

    if (filteredEntityIds.length === 0) return;

    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const promises = filteredEntityIds.map(entityId =>
        fetch(`/api/logbook?entity=${entityId}&end_time=${new Date().toISOString()}&limit=5`, {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
        })
        .then(res => res.json())
        .then(data => ({ entityId, data }))
        .catch(err => {
          console.error("Failed to fetch logbook for", entityId, err);
          return { entityId, data: [] };
        })
      );

      const results = await Promise.all(promises);
      
      // Combine all logbook entries
      const allEntries = results.flatMap(({ data }) => 
        Array.isArray(data) ? data : []
      );

      // Remove duplicates and sort by time (newest first)
      const uniqueEntries = allEntries.reduce((acc, entry) => {
        const key = `${entry.when}_${entry.entity_id}`;
        if (!acc.has(key)) {
          acc.set(key, entry);
        }
        return acc;
      }, new Map());

      const sortedEntries = Array.from(uniqueEntries.values())
        .sort((a: any, b: any) => new Date(b.when).getTime() - new Date(a.when).getTime())
        .slice(0, 100); // Keep latest 100 entries

      setLogbook(sortedEntries);
      
      if (isInitialLoad) {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    } catch (error) {
      console.error("Error fetching logbook data:", error);
      if (isInitialLoad) {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    }
  };

  // Initial fetch and set up polling
  useEffect(() => {
    if (entityIds.length > 0) {
      entitySet.current = new Set(entityIds);
      
      // Initial fetch with loading state
      fetchLogbookData(true);
      
      // Set up polling every 2 seconds (without loading state)
      const interval = setInterval(() => fetchLogbookData(false), 2000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [JSON.stringify(entityIds)]);

  return { logbook, loading };
};


// Script from Tom, altered to run on the frontend
export const mapDevicesToAutomations = async (): Promise<Record<string, { id: string; devices: { id: string; name: string }[] }>> => {
  // Step 1: Get all automations (id, name)
  const { data: automations } = await axios.post<{ id: string; name: string }[]>(
    "/api/template",
    {
      template:
        "{% set a = namespace(devices = []) -%}\n" +
        "{% for state in states.automation -%}\n" +
        "  {% set a.devices = a.devices + [{\"id\" : state.attributes.id, \"name\" : state.attributes.friendly_name}]   -%}\n" +
        "{% endfor-%}{{ a.devices | tojson }}",
    },
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  // Step 2: For each automation, get its config and collect device_ids
  const automationDevices: Record<string, { id: string; devices: { id: string; name: string }[] }> = {};
  const deviceIdsMap: Record<string, string[]> = {};
  const configPromises = (automations.map((item) => {
    deviceIdsMap[item.name] = [];
    automationDevices[item.name] = { id: item.id, devices: [] };
    return axios
      .get(`/api/config/automation/config/${item.id}`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      })
      .then((automationConfigResponse) => {
        const data = automationConfigResponse.data as { triggers?: any[]; conditions?: any[]; actions?: any[] };
        const { triggers, conditions, actions } = data;
        const collector = new Set<string>();
        if (triggers) {
          triggers.forEach((trigger: any) => {
            if (trigger?.device_id) collector.add(trigger.device_id);
          });
        }
        if (conditions) {
          conditions.forEach((condition: any) => {
            if (condition?.device_id) collector.add(condition.device_id);
          });
        }
        if (actions) {
          actions.forEach((action: any) => {
            if (action?.device_id) collector.add(action.device_id);
          });
        }
        deviceIdsMap[item.name] = Array.from(collector);
      });
  }) as Promise<void>[]);
  await Promise.all(configPromises);

  // Step 3: For each automation, resolve device_ids to {id, name}
  const deviceNamePromises = (Object.keys(deviceIdsMap).map((name) => {
    const deviceIds = deviceIdsMap[name];
    if (deviceIds.length === 0) {
      automationDevices[name].devices = [];
      return Promise.resolve();
    }
    return axios
      .post<{ id: string; name: string }[]>(
        "/api/template",
        {
          template:
            "{% set a = namespace(devices = []) -%}\n" +
            `{% for id in [${deviceIds.map((i) => `'${i}'`).join(", ")}] -%}\n` +
            "  {% set a.devices = a.devices +[{\"id\": id, \"name\" : device_attr(id, 'name')}] -%}\n" +
            "{% endfor-%}{{ a.devices | tojson}}",
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        automationDevices[name].devices = response.data as { id: string; name: string }[];
      });
  }) as Promise<void>[]);
  await Promise.all(deviceNamePromises);

  return automationDevices;
};

// New function to fetch specific button automations
export const fetchButtonAutomations = async (): Promise<Record<string, { id: string; name: string; entityId: string }>> => {
  const buttonAutomations = {
    'Bedlight_Right_Toggle (Button)': 'automation.ps_bedlight_right_toggle',
    'Bedlight_Left_Toggle (Button)': 'automation.ps_toggle_bedlight_left', 
    'zigbee2mqtt/Wall Switch': 'automation.ps_windowlighttoggle',
    'Roller Shutter Control Button (Button)': 'automation.ps_roller_shutter_switch',
    'Button - Floor Lamp': 'automation.ps_standlight_toggle'
  };

  const result: Record<string, { id: string; name: string; entityId: string }> = {};

  try {
    // Fetch each automation's details
    for (const [buttonName, entityId] of Object.entries(buttonAutomations)) {
      try {
        const response = await axios.get(`/api/states/${entityId}`, {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
        });

        if (response.data && typeof response.data === 'object' && 'attributes' in response.data) {
          const automationData = response.data as { attributes: { id?: string; friendly_name?: string } };
          result[buttonName] = {
            id: automationData.attributes.id || entityId,
            name: automationData.attributes.friendly_name || buttonName,
            entityId: entityId
          };
        } else {
          // Fallback if response doesn't have expected structure
          result[buttonName] = {
            id: entityId,
            name: buttonName,
            entityId: entityId
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch automation ${entityId}:`, error);
        // Add fallback entry
        result[buttonName] = {
          id: entityId,
          name: buttonName,
          entityId: entityId
        };
      }
    }
  } catch (error) {
    console.error('Error fetching button automations:', error);
  }

  return result;
};

export const fetchAutomationsViaWS = async (): Promise<any[]> => {
  console.log("fetchAutomationsViaWS CALLED");
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);






    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("WebSocket message received:", msg); // <-- Add this line
    
      if (msg.type === "auth_ok") {
        // Only now send the automation list request!
        ws.send(JSON.stringify({
          id: 1,
          type: "config/automation/list",
        }));
      }
    
      if (msg.type === "result" && msg.id === 1) {
        ws.close();
        if (msg.success) {
          resolve(msg.result);
        } else {
          reject(msg.error || "Automation list fetch failed");
        }
      }
    
      if (msg.type === "auth_invalid") {
        ws.close();
        reject("Authentication failed");
      }
    };





    

    ws.onopen = () => {
      console.log("WebSocket opened, sending auth");
      ws.send(JSON.stringify({ type: "auth", access_token: TOKEN }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("WebSocket message received:", msg);

      if (msg.type === "auth_ok") {
        // Only now send the automation list request!
        ws.send(JSON.stringify({
          id: 1,
          type: "config/automation/list",
        }));
      }

      if (msg.type === "result" && msg.id === 1) {
        ws.close();
        if (msg.success) {
          resolve(msg.result);
        } else {
          reject(msg.error || "Automation list fetch failed");
        }
      }

      if (msg.type === "auth_invalid") {
        ws.close();
        reject("Authentication failed");
      }
    };

    ws.onerror = (err) => {
      ws.close();
      reject(err);
    };
  });
};



// === Pure function to get automation count for a device or entity from a list of automations ===
export function getAutomationCount(automations: any[], deviceIdOrEntityId: string): number {
  const matchInAutomation = (section: any) => {
    if (Array.isArray(section)) {
      return section.some((part) =>
        JSON.stringify(part).includes(deviceIdOrEntityId)
      );
    }
    if (typeof section === "object" && section !== null) {
      return JSON.stringify(section).includes(deviceIdOrEntityId);
    }
    return false;
  };

  return automations.filter((automation: any) => {
    return (
      matchInAutomation(automation.trigger) ||
      matchInAutomation(automation.condition) ||
      matchInAutomation(automation.action)
    );
  }).length;
}

// Returns all automations that reference the given device/entity
export function getAutomationsForDevice(automationConfigs: any[], device: any): any[] {
  const entityId = device.entity_id;
  const idsToMatch = [entityId];
  if (device.device_id) idsToMatch.push(device.device_id);
  if (device.attributes?.unique_id) idsToMatch.push(device.attributes.unique_id);

  const matches = (section: any) =>
    idsToMatch.some(id => JSON.stringify(section).includes(id));

  return automationConfigs.filter(
    (automation: any) =>
      matches(automation.trigger) ||
      matches(automation.condition) ||
      matches(automation.action)
  );
}
