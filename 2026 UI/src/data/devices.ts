export type DeviceCategory = 'Lights' | 'Appliances' | 'Media' | 'Sensors';
export type ControlType = 'light' | 'cover-h' | 'cover-v' | 'toggle' | 'heater' | 'sensor' | 'button' | 'switchpanel';

// One gang (button) of a multi-gang wall switch: which light it toggles
// (entityId, for live state) and the ps_* automation that flips it.
export interface Gang { label: string; short: string; entityId: string; automationId: string; }

export interface DeviceDef {
  id: string;              // design id (e.g. 'wld')
  name: string;
  category: DeviceCategory;
  control: ControlType;
  entityId: string;        // real HA entity_id (used for live state display)
  x: number;              // floor-map % x
  y: number;              // floor-map % y
  batteryEntity?: string;
  // Optional control override: when the display entity is read-only, toggling
  // fires this service instead. The TV's state is a binary_sensor but its power
  // is driven by an HA script, so on/off both just run the toggle script.
  toggleAction?: { domain: string; service: string; entityId: string };
  // Render as a small floor-map bubble (used for the physical wall switches, so
  // they read as secondary controls next to the full-size device bubbles).
  mini?: boolean;
  // For control:'switchpanel' — the gangs (buttons) on a multi-gang wall switch.
  gangs?: Gang[];
  // Physical switches only: the ps_* automation this switch fires. Its
  // last_triggered is the switch's "last pressed" (read it via usePsTriggers —
  // useDevices filters automation.* out). Multi-gang switches carry one per gang.
  automationId?: string;
  // Covers only: route position commands through this HA script instead of
  // calling cover.set_cover_position directly. The roller shutter uses one so
  // its device-error simulation can clamp the commanded position before it
  // reaches the hardware — the shutter reports no travel states, so HA can't
  // intervene once a move is under way. See ha/rollo_device_error_sim.yaml.
  positionScript?: string;
  // Covers only: show a reachability cue next to the slider — a spinner while
  // the position command is in flight, then "No Response" if the device never
  // moved (see useCoverAck). Set on the curtain, whose connection error is
  // otherwise invisible: the slider moves, the call succeeds, nothing happens.
  reportLink?: boolean;
}

export const DEVICES: DeviceDef[] = [
  { id:'wld',    name:'Door Light',       category:'Lights',     control:'light',   entityId:'light.doorlight',                              x:11, y:75 },
  { id:'wlw',    name:'Window Light',     category:'Lights',     control:'light',   entityId:'light.windowlight',                            x:43, y:6  },
  { id:'bll',    name:'Bedlight L',       category:'Lights',     control:'light',   entityId:'light.bedlight_l',                             x:84, y:28 },
  { id:'blr',    name:'Bedlight R',       category:'Lights',     control:'light',   entityId:'light.bedlight_r',                             x:85, y:59 },
  { id:'flr',    name:'Floor Lamp',       category:'Lights',     control:'light',   entityId:'light.floorlamp',                              x:17, y:27 },
  { id:'cur',    name:'Curtain',          category:'Appliances', control:'cover-h', entityId:'cover.0x54ef441000c939e0',                     x:72, y:6,  batteryEntity:'sensor.0x54ef441000c939e0_battery', reportLink:true },
  { id:'rsh',    name:'Roller Shutter',   category:'Appliances', control:'cover-v', entityId:'cover.rollo',                                  x:25, y:8,  batteryEntity:'sensor.rollerblind_0004_battery', positionScript:'script.roller_move' },
  { id:'fan',    name:'SmartFan',         category:'Appliances', control:'toggle',  entityId:'fan.smartfan',                                 x:84, y:15 },
  { id:'fansock',name:'Fan Socket',       category:'Appliances', control:'toggle',  entityId:'switch.socket_fan',                            x:88, y:9,  mini:true },
  { id:'htr',    name:'Heater',           category:'Appliances', control:'heater',  entityId:'climate.heater',                               x:24, y:17, batteryEntity:'sensor.heater_battery' },
  { id:'tv',     name:'TV',               category:'Media',      control:'toggle',  entityId:'binary_sensor.tv_status',                      x:15, y:52, toggleAction:{ domain:'script', service:'turn_on', entityId:'script.new_script' } },
  // The TV Socket (switch.socket_tv) was removed from the study on 2026-07-13: it is
  // hidden from the dashboard and the floor map, so the participant never sees it.
  // The TV is diagnosed directly — toggling it goes through the hub.
  { id:'pres',   name:'Presence Sensor',  category:'Sensors',    control:'sensor',  entityId:'binary_sensor.presencesensor_presence',         x:13, y:5  },
  { id:'door',   name:'Door Sensor',     category:'Sensors',    control:'sensor',  entityId:'binary_sensor.sensor_door_contact',             x:13, y:91, batteryEntity:'sensor.sensor_door_battery' },
  { id:'win',    name:'Window Sensor',   category:'Sensors',    control:'sensor',  entityId:'binary_sensor.sensor_window_contact',           x:33, y:7,  batteryEntity:'sensor.sensor_window_battery' },
  { id:'th',     name:'Temperature Sensor', category:'Sensors',  control:'sensor',  entityId:'sensor.temp_humid_temperature',                 x:43, y:17,   batteryEntity:'sensor.temp_humid_battery' },
  // Physical wall-switch buttons. These are READ-ONLY in the portal: they are
  // switches you press in the room, and the dashboard's job is only to report
  // whether the system registered that press (the ps_* automation's last_triggered,
  // read via usePsTriggers — useDevices filters automation.* out).
  //
  // Their entityId is therefore their OWN automation, not the light they control.
  // Pointing it at the light would (a) make the map bubble light up with the
  // *light's* state as if it were the switch's, and (b) collide with the light in
  // DEVICE_BY_ENTITY.
  //
  // Placement mirrors where the real wall switches are: the door- and window-light
  // gangs share one double wall switch just above the door light (left = door
  // light, right = window light); the floor-lamp switch is stuck to the bottom of
  // the floor lamp; the bed-light switches sit right by each lamp.
  { id:'sw_walllights', name:'Wall Light Switch', category:'Lights', control:'switchpanel', entityId:'automation.ps_doorlighttoggle', x:11, y:69, mini:true,
    gangs:[
      { label:'Door Light',   short:'Door',   entityId:'light.doorlight',   automationId:'automation.ps_doorlighttoggle' },
      { label:'Window Light', short:'Window', entityId:'light.windowlight', automationId:'automation.ps_windowlighttoggle' },
    ] },
  { id:'sw_bll', name:'Bedlight L Switch',     category:'Lights',     control:'button', entityId:'automation.ps_toggle_bedlight_left',   x:84, y:33, mini:true, automationId:'automation.ps_toggle_bedlight_left' },
  { id:'sw_blr', name:'Bedlight R Switch',     category:'Lights',     control:'button', entityId:'automation.ps_bedlight_right_toggle', x:85, y:64, mini:true, automationId:'automation.ps_bedlight_right_toggle' },
  { id:'sw_flr', name:'Floor Lamp Switch',     category:'Lights',     control:'button', entityId:'automation.ps_standlight_toggle',     x:17, y:32, mini:true, automationId:'automation.ps_standlight_toggle' },
  { id:'sw_rsh', name:'Roller Shutter Switch', category:'Appliances', control:'button', entityId:'automation.ps_roller_shutter_switch', x:43, y:12, mini:true, automationId:'automation.ps_roller_shutter_switch' },
];

/* ─── Physical switches ───────────────────────────────────────────────────────
 * The sw_* entries above are wall switches / buttons, not smart devices: each is
 * just a trigger for a ps_* automation. They are therefore kept OUT of the device
 * list and the Condition-1 room view, and appear only as
 *   - a separate "Physical switches" section in All Rules,
 *   - a floor-map icon reporting when it was last pressed,
 *   - a graph node wired to the device(s) it controls (SWITCH_LINKS).
 */
export const SWITCH_IDS = ['sw_walllights', 'sw_bll', 'sw_blr', 'sw_flr', 'sw_rsh'];
export const isSwitch = (id: string) => SWITCH_IDS.includes(id);

/** Every ps_* automation a switch fires (a multi-gang switch fires one per gang). */
export function switchAutomationIds(d: DeviceDef): string[] {
  if (d.gangs?.length) return d.gangs.map(g => g.automationId);
  return d.automationId ? [d.automationId] : [];
}

/** Physical-switch → device it controls. Drawn as edges in the Dependencies graph. */
export const SWITCH_LINKS: [string, string][] = [
  ['sw_walllights', 'wld'],
  ['sw_walllights', 'wlw'],
  ['sw_bll', 'bll'],
  ['sw_blr', 'blr'],
  ['sw_flr', 'flr'],
  ['sw_rsh', 'rsh'],
];

/* ─── The 6 physical-switch (ps_*) automations, listed separately in All Rules ─── */
export interface PsRule {
  ruleId: string;      // HA automation entity_id
  name: string;        // friendly name shown in the rules list
  switchId: string;    // the sw_* device that fires it
  target: string;      // the device design ID it controls
  trigger: string;     // natural-language WHEN line
  action: string;      // natural-language THEN line
  summary: string;     // plain explanation shown on the rule panel
}

export const PS_RULES: PsRule[] = [
  { ruleId:'automation.ps_doorlighttoggle',      name:'Wall Switch — Door Light',    switchId:'sw_walllights', target:'wld',
    trigger:'The left side of the Wall Switch is pressed', action:'Toggle the Door Light on/off',
    summary:'Pressing the left side of the Wall Switch turns the Door Light on or off.' },
  { ruleId:'automation.ps_windowlighttoggle',    name:'Wall Switch — Window Light',  switchId:'sw_walllights', target:'wlw',
    trigger:'The right side of the Wall Switch is pressed', action:'Toggle the Window Light on/off',
    summary:'Pressing the right side of the Wall Switch turns the Window Light on or off.' },
  { ruleId:'automation.ps_toggle_bedlight_left', name:'Bedlight L Switch',           switchId:'sw_bll',        target:'bll',
    trigger:'The left bedside button is pressed', action:'Toggle Bedlight L on/off',
    summary:'Pressing the left bedside button turns Bedlight L on or off.' },
  { ruleId:'automation.ps_bedlight_right_toggle',name:'Bedlight R Switch',           switchId:'sw_blr',        target:'blr',
    trigger:'The right bedside button is pressed', action:'Toggle Bedlight R on/off',
    summary:'Pressing the right bedside button turns Bedlight R on or off.' },
  { ruleId:'automation.ps_standlight_toggle',    name:'Floor Lamp Switch',           switchId:'sw_flr',        target:'flr',
    trigger:'The floor-lamp button is pressed', action:'Toggle the Floor Lamp on/off',
    summary:'Pressing the floor-lamp button turns the Floor Lamp on or off.' },
  { ruleId:'automation.ps_roller_shutter_switch', name:'Roller Shutter Switch',      switchId:'sw_rsh',        target:'rsh',
    trigger:'The Roller Shutter button is held up or down', action:'Move the Roller Shutter up, down, or stop it',
    summary:'Holding the Roller Shutter button moves the shutter up, down, or stops it.' },
];

export const DEVICE_BY_ID = Object.fromEntries(DEVICES.map(d => [d.id, d]));
export const DEVICE_BY_ENTITY = Object.fromEntries(DEVICES.map(d => [d.entityId, d]));

/* ─── The 9 study automations with their source→target device links ─── */
export interface RuleLink {
  ruleId: string;       // HA automation entity_id
  name: string;
  sensors: string[];    // device design IDs that trigger (src)
  targets: string[];    // device design IDs that are controlled (dst)
  enabled: boolean;     // design default state (overridden by live HA)
  last: string;         // human last-run label (fallback)
  triggers: string[];   // natural-language WHEN lines
  conditions: string[]; // natural-language AND lines
  actions: string[];    // natural-language THEN lines
  summary: string;      // plain explanation shown on the rule panel
}

export const RULE_LINKS: RuleLink[] = [
  { ruleId:'automation.exp_movie_mode_tv_on_fan_off', name:'Movie mode - TV on Fan off', sensors:['tv','pres'], targets:['fan'], enabled:true, last:'just now',
    triggers:['TV turns on'],
    conditions:['Presence detected'],
    actions:['Turn the SmartFan off'],
    summary:'When the TV is switched on while the room is occupied, the SmartFan turns off for quieter viewing.' },
  { ruleId:'automation.exp_evening_wind_down', name:'Evening Wind down', sensors:[], targets:['rsh','cur','flr'], enabled:false, last:'7 days ago',
    triggers:['Re-evaluated every minute'],
    conditions:['Time between 9:00 PM and 11:00 PM'],
    actions:['Roller Shutter → 20%','Curtain → closed','Floor Lamp on'],
    summary:'Late evening lowers the roller shutter, closes the curtain and turns on the floor lamp to settle the room for the night.' },
  { ruleId:'automation.exp_morning_routine', name:'Morning Routine', sensors:[], targets:['cur','rsh','tv'], enabled:false, last:'7 days ago',
    triggers:['The time reaches 7:00 AM'],
    conditions:[],
    actions:['Open the Curtain','Roller Shutter → 81%','Wake the Fire TV and start the radio stream'],
    summary:'At 7:00 AM the room wakes up: the curtain and shutter open, and the TV powers on with a radio stream.' },
  { ruleId:'automation.exp_tv_on_bedlight_ambient', name:'TV On Bedlight Ambient', sensors:['tv'], targets:['blr'], enabled:false, last:'4 days ago',
    triggers:['TV turns on'],
    conditions:['Time between 7:00 PM and 1:00 AM'],
    actions:['TV on → Bedlight R to 100% (10s fade)'],
    summary:'In the evening, when the TV comes on, Bedlight R fades up to full brightness.' },
  { ruleId:'automation.exp_window_closed_fan_on', name:'Window Closed Fan On', sensors:['win','th','fansock'], targets:['fan'], enabled:false, last:'3 days ago',
    triggers:['Window Sensor closes (open → closed)'],
    conditions:['Temperature is above 20°C','The Fan Smart Plug is on'],
    actions:['Turn on the SmartFan'],
    summary:'Closing the window while the room is above 20°C turns the fan on, as long as its smart plug is on.' },
  { ruleId:'automation.exp_window_open_shutter_open', name:'Window Open Shutter Open', sensors:['win','pres'], targets:['rsh'], enabled:true, last:'3 days ago',
    triggers:['Window Sensor opens'],
    conditions:['Presence detected'],
    actions:['Open the Roller Shutter'],
    summary:'Opening the window while the room is occupied opens the roller shutter.' },
  // The real HA automation also has a second branch: when presence ends, the Door
  // Light is switched off. That exists purely as lab housekeeping (so the lamp is
  // not left burning once everyone has left) — a participant never triggers it and
  // never sees it happen. It is deliberately NOT listed here; showing it would add
  // a branch to reason about that the session can never exercise.
  { ruleId:'automation.exp_entrance_door_light_on', name:'Entrance Door Light On', sensors:['door','pres'], targets:['wld'], enabled:false, last:'3 days ago',
    triggers:['Door Sensor opens'],
    conditions:['Time is 7:00 PM or later','Presence detected'],
    actions:['Turn the Door Light on'],
    summary:'In the evening, opening the door while someone is present turns the entrance Door Light on.' },
  { ruleId:'automation.exp_door_window_open_fan_off', name:'Door Window Open Fan Off', sensors:['door','win'], targets:['fan'], enabled:false, last:'3 days ago',
    triggers:['Door Sensor opens, and stays open for 20 seconds'],
    conditions:['Window Sensor is open'],
    actions:['Turn the SmartFan off'],
    summary:'When the door has been open for 20 seconds while the window is also open, the fan switches off to avoid wasting airflow.' },
  { ruleId:'automation.exp_temp_low_heater_on', name:'Temp Low Heater On', sensors:['th','pres'], targets:['htr'], enabled:false, last:'3 days ago',
    triggers:['Re-evaluated every minute'],
    conditions:['Presence detected','Temperature is ABOVE 19°C'],
    actions:['Set the Heater to 30°C'],
    summary:'While the room is occupied and the temperature is above 19°C, the heater target is set to 30°C.' },
];

/* Physical power links: a socket powers a device (shown as a connection/dependency).
   The TV's socket was removed from the study, so only the fan's remains. */
export const POWER_LINKS: [string, string][] = [['fansock', 'fan']];
