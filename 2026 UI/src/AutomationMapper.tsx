
export interface Automation {
  triggerDevice: string;     // e.g. "light.hallway"
  triggerEvent: string;      // e.g. "turned on"
  actionDevice: string;      // e.g. "light.kitchen"
  actionCommand: string;     // e.g. "turn off"
}

// Output structure compatible with Home Assistant automations
export interface HAAutomation {
  alias: string;
  trigger: any[];
  condition?: any[];
  action: any[];
}

export function mapHAToSimpleAutomation(haAutomation: any): Automation {
  const trigger = haAutomation.attributes.trigger?.[0] || {};
  const action = haAutomation.attributes.action?.[0] || {};

  let triggerDevice = "";

  if (trigger.entity_id) {
    triggerDevice = trigger.entity_id;
  } else if (trigger.event_data?.entity_id) {
    triggerDevice = trigger.event_data.entity_id;
  }

  const triggerEvent = trigger.to === "on"
    ? "turned on"
    : trigger.to === "off"
    ? "turned off"
    : trigger.event_type === "button_pressed"
    ? "button pressed"
    : `changed to ${trigger.to || "unknown"}`;

  const target = action.target?.entity_id;
  const actionDevice = Array.isArray(target) ? target[0] : target || "";

  const service = action.service || "";
  const actionCommand = service.includes("turn_on")
    ? "turn on"
    : service.includes("turn_off")
    ? "turn off"
    : service;

  return {
    triggerDevice,
    triggerEvent,
    actionDevice,
    actionCommand,
  };
}



// Utility: extract domain from entity_id
const getDomain = (entityId: string): string => {
  const parts = entityId.split(".");
  return parts.length > 1 ? parts[0] : "unknown";
};

// Mapping function: converts Automation to Home Assistant-compatible format
export function mapSimpleToHAAutomation(input: Automation): HAAutomation {
  const { triggerDevice, triggerEvent, actionDevice, actionCommand } = input;

  // === Trigger mapping ===
  let trigger: any;
  if (triggerEvent === "turned on") {
    trigger = {
      platform: "state",
      entity_id: triggerDevice,
      to: "on",
    };
  } else if (triggerEvent === "turned off") {
    trigger = {
      platform: "state",
      entity_id: triggerDevice,
      to: "off",
    };
  } else if (triggerEvent.startsWith("temperature above")) {
    const temp = parseFloat(triggerEvent.match(/\d+/)?.[0] || "25");
    trigger = {
      platform: "numeric_state",
      entity_id: triggerDevice,
      above: temp,
    };
  } else if (triggerEvent === "button pressed") {
    trigger = {
      platform: "event",
      event_type: "button_pressed",
      event_data: {
        entity_id: triggerDevice,
      },
    };
  } else {
    throw new Error(`Unsupported trigger event: ${triggerEvent}`);
  }

  // === Action mapping ===
  let action: any;
  const domain = getDomain(actionDevice);

  if (actionCommand === "turn on") {
    action = {
      service: `${domain}.turn_on`,
      target: {
        entity_id: actionDevice,
      },
    };
  } else if (actionCommand === "turn off") {
    action = {
      service: `${domain}.turn_off`,
      target: {
        entity_id: actionDevice,
      },
    };
  } else if (actionCommand.startsWith("set brightness to")) {
    const brightness = parseInt(actionCommand.match(/\d+/)?.[0] || "50");
    action = {
      service: "light.turn_on",
      data: {
        brightness_pct: brightness,
      },
      target: {
        entity_id: actionDevice,
      },
    };
  } else if (actionCommand.startsWith("set temperature to")) {
    const temp = parseInt(actionCommand.match(/\d+/)?.[0] || "22");
    action = {
      service: "climate.set_temperature",
      data: {
        temperature: temp,
      },
      target: {
        entity_id: actionDevice,
      },
    };
  } else {
    throw new Error(`Unsupported action command: ${actionCommand}`);
  }

  // === Final automation object ===
  return {
    alias: `TEST RULE: ${triggerDevice} does ${triggerEvent} → ${actionCommand} does ${actionDevice} :TEST RULE`,
    trigger: [trigger],
    action: [action],
  };
}
