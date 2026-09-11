import React from "react";
import { useDevices, mapDevicesToAutomations, fetchButtonAutomations } from "../../hooks/useDevices";
import type { Tab } from "../../pages/ContextualUI";

// As automations cannot be fetched in its entirety from Home Assistant, we cannot know to how many automations a device is connected to.
// As a result, the automations have to be manually assigned here.
const deviceAutomationCounts: Record<string, number> = {
  'cover.rollo': 3,
  'light.doorlight': 3,
  'light.windowlight': 1,
  'light.bedlight_r': 1,
  'light.bedlight_l': 1,
  'light.floorlamp': 2,
  //'update.rolloswitch': 1,
  'binary_sensor.sensor_window_contact': 2,
  'binary_sensor.sensor_door_contact': 5,
  'binary_sensor.presencesensor_presence': 5,
  'cover.0x54ef441000c939e0': 1,
  'sensor.temp_humid_temperature': 2,
  'fan.smartfan': 2,
  // Button automation counts
  'automation.ps_bedlight_right_toggle': 1,
  'automation.ps_toggle_bedlight_left': 1,
  'automation.ps_windowlighttoggle': 1,
  'automation.ps_rolloswitchcontrol': 1,
  'automation.ps_standlighttoggle': 1,
};

// Unique tooltips for each device's automation count
const deviceAutomationTooltips: Record<string, string> = {
  'cover.rollo': 'Roller Shutter is connected to 3 automations: Roller Shutter Evening Closing, Shutter when window is open, and RolloSwitchControl',
  'light.doorlight': 'DoorLight is connected to 3 automations: Light when entering, Light when Entering (Night), and DoorLightToggle',
  'light.windowlight': 'WindowLight is connected to 1 automation: WindowLightToggle',
  'light.bedlight_r': 'BedLight_R is connected to 1 automation: Bedlight_Right_Toggle',
  'light.bedlight_l': 'BedLight_L is connected to 1 automation: Bedlight_Left_Toggle',
  'light.floorlamp': 'FloorLamp is connected to 2 automations: Light when Entering (Night), and Floor Lamp Toggle',

  'binary_sensor.sensor_window_contact': 'Window is connected to 2 automations: Curtain after 7 pm, and RolloSwitchControl',
  'binary_sensor.sensor_door_contact': 'Sensor_Door Door is connected to 5 automations: Light when Entering, Light when Entering (Night), LightByEntrance, Fan-auto-on, and Fan-auto-off',
  'binary_sensor.presencesensor_presence': 'PresenceSensor Presence is connected to 5 automations: Light when Entering, Light when Entering (Night), LightByEntrance, Shutter when window is open, and Roller Shutter Evening Closing',
  'cover.0x54ef441000c939e0': 'Curtain is connected to 1 automation: Curtain after 7 pm',
  'sensor.temp_humid_temperature': 'Temp_Humid Temperature is connected to 2 automations: Fan-auto-on, and Fan-auto-off',
  'fan.smartfan': 'SmartFan is connected to 2 automations: Fan-auto-on, and Fan-auto-off',
  // Button automation tooltips
  'automation.ps_bedlight_right_toggle': 'Bedlight_Right_Toggle (Button) is connected to 1 automation: Bedlight Right Toggle',
  'automation.ps_toggle_bedlight_left': 'Bedlight_Left_Toggle (Button) is connected to 1 automation: Toggle Bedlight Left',
  'automation.ps_windowlighttoggle': 'zigbee2mqtt/Wall Switch is connected to 2 automations: DoorLightToggle and WindowLightToggle',
  'automation.ps_rolloswitchcontrol': 'Roller Shutter Control Button (Button) is connected to 1 automation: Rollo Switch Control',
  'automation.ps_standlighttoggle': 'Button - Floor Lamp is connected to 1 automation: Stand Light Toggle',
};

type AllDevicesCardProps = {
  showTooltips?: boolean;
  setActiveTab?: (tab: Tab) => void;
};



const AllDevicesCard: React.FC<AllDevicesCardProps> = ({ showTooltips = false, setActiveTab }) => {
  const { devices, loading, error } = useDevices();
  const [automationMap, setAutomationMap] = React.useState<Record<string, { id: string; devices: { id: string; name: string }[] }>>({});
  const [loadingAutomations, setLoadingAutomations] = React.useState(true);
  const [automationError, setAutomationError] = React.useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = React.useState<string | null>(null);
  const [activeHeaderTooltip, setActiveHeaderTooltip] = React.useState<string | null>(null);
  
  // New state for button automations
  const [buttonAutomations, setButtonAutomations] = React.useState<Record<string, { id: string; name: string; entityId: string }>>({});
  const [loadingButtonAutomations, setLoadingButtonAutomations] = React.useState(true);
  const [buttonAutomationsError, setButtonAutomationsError] = React.useState<string | null>(null);
  
  // Fetch automation map on mount
  React.useEffect(() => {
    setLoadingAutomations(true);
    mapDevicesToAutomations()
      .then((result) => {
        setAutomationMap(result);
        setAutomationError(null);
      })
      .catch((err) => {
        setAutomationError(err?.message || "Failed to fetch automations");
      })
      .finally(() => setLoadingAutomations(false));
  }, []);

  // Fetch button automations on mount
  React.useEffect(() => {
    setLoadingButtonAutomations(true);
    setButtonAutomationsError(null);
    fetchButtonAutomations()
      .then((result) => {
        console.log('Button automations fetched:', result);
        setButtonAutomations(result);
        setButtonAutomationsError(null);
      })
      .catch((err) => {
        console.error('Failed to fetch button automations:', err);
        setButtonAutomationsError(err?.message || 'Failed to fetch button automations');
      })
      .finally(() => setLoadingButtonAutomations(false));
  }, []);

  // Filter out devices with friendly_name "camera"
  const filteredDevices = devices.filter(
  (device) => !/camera/i.test(device.attributes.friendly_name || "")
);

  // Get all entity IDs including button automations for logbook fetching
  const allEntityIds = [
    ...filteredDevices.map((d) => d.entity_id),
    // Use MQTT topics for button devices instead of automation entity IDs
    'zigbee2mqtt/Button - Bedside Left',
    'zigbee2mqtt/Button - Bedside Right', 
    'zigbee2mqtt/Wall Switch',
    'zigbee2mqtt/Button - Roller Shutter',
    'zigbee2mqtt/Button - Floor Lamp',
    // Add automation entity IDs for button logbook tracking
    'automation.ps_toggle_bedlight_left',
    'automation.ps_bedlight_right_toggle',
    'automation.ps_rolloswitchcontrol',
    'automation.ps_standlight_toggle',
    'automation.ps_windowlighttoggle',
    // Add TV status entity for logbook tracking
    'binary_sensor.tv_status'
  ];

  // Get logbook entries for all device entity_ids and button automations
  /* const { logbook, loading: logbookLoading } = useLogbook(allEntityIds);

  if (loading) return <p className="text-gray-400">Loading devices...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  // Helper to get the latest logbook entry for a device
  const getLatestLog = (entityId: string) => {
    for (let i = logbook.length - 1; i >= 0; i--) {
      if (logbook[i].entity_id === entityId) {
        const timestamp = new Date(logbook[i].when);
        timestamp.setHours(timestamp.getHours() - 10);
        return `${timestamp.toLocaleString()}`;
      }
    }
    return "No recent activity";
  };

  // Helper to format relative time (like in AutomationCard)
  const formatRelativeTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else {
      return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
    }
  };

  // Helper to get the latest logbook entry with relative time format
  const getLatestLogRelative = (entityId: string) => {
    if (logbookLoading) {
      return "Loading...";
    }
    
    // Find all entries for this entity and sort by time (newest first)
    const entityEntries = logbook
      .filter(entry => entry.entity_id === entityId)
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
    
    if (entityEntries.length > 0) {
      const now = new Date();
      const timeDiff = now.getTime() - new Date(entityEntries[0].when).getTime();
      return formatRelativeTime(timeDiff);
    }
    
    return "No recent activity";
  }; */

  // Helper to get automation count for a device
  const getAutomationCountForDevice = (entityId: string) => {
    // Count how many automations have this device in their devices array
    return Object.values(automationMap).filter(auto => auto.devices.some(d => d.id === entityId)).length;
  };

  // Tooltip helper
  const Tooltip = ({ text, tooltipId }: { text: string; tooltipId: string }) => (
    <span className="relative inline-block ml-1">
      <span 
        className="cursor-pointer rounded-full w-5 h-5 inline-flex items-center justify-center text-xs font-bold bg-gray-400 text-white shadow-md border border-gray-600"
        onClick={(e) => {
          e.stopPropagation();
          setActiveHeaderTooltip(activeHeaderTooltip === tooltipId ? null : tooltipId);
        }}
      >
        i
      </span>
      {showTooltips && activeHeaderTooltip === tooltipId && (
        <div className="absolute z-20 bg-gray-800 text-white p-2 rounded shadow-lg text-xs max-w-md w-50 top-full -left-25 mt-1">
          {text}
        </div>
      )}
    </span>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">All Connected Devices</h2>
      

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-zinc-700 text-sm">
          <thead className="bg-gray-500 text-white">
            <tr>
              <th className="border border-zinc-700 px-4 py-2 text-left">
                Device Name
                {showTooltips && <Tooltip text="The name of the connected device as it appears in your smart home system." tooltipId="device-name" />}
              </th>
              <th className="border border-zinc-700 px-4 py-2 text-left">
                State
                {showTooltips && <Tooltip text="The current status or mode of the device." tooltipId="state" />}
              </th>
              <th className="border border-zinc-700 px-4 py-2 text-left">
                Parameters
                {showTooltips && <Tooltip text="Displays the most relevant value reported by each device, such as temperature, humidity, or light intensity" tooltipId="parameters" />}
              </th>
              {/* <th className="border border-zinc-700 px-4 py-2 text-left">
                Latest Activity
                {showTooltips && <Tooltip text="The most recent time the device reported a change or action. Useful for checking if a device is actively communicating or has recently been used." tooltipId="activity" />}
              </th> */}
              <th
                className="border border-zinc-700 px-4 py-2 text-left cursor-pointer hover:underline"
                onClick={() => setActiveTab && setActiveTab("rules")}
              >
                Rules Attached
                {showTooltips && <Tooltip text="The number of automations, routines, or rules that include this device. Click the number to view or manage rules linked to this device." tooltipId="rules" />}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device) => (
              <tr key={device.entity_id} className="bg-gray-500 text-white">

                {/* Device name */}
                <td className="border border-zinc-700 px-4 py-2 font-medium">
                  {device.attributes.friendly_name || device.entity_id}
                </td>

                {/* State */}
                <td className="border border-zinc-700 px-4 py-2">
                  {(() => {
                    // Special handling for window and door sensors
                    if (device.entity_id === 'binary_sensor.sensor_window_contact' || 
                        device.entity_id === 'binary_sensor.sensor_door_contact') {
                      return device.state === 'on' ? 'open' : 'close';
                    }
                    // Special handling for presence sensor
                    if (device.entity_id === 'binary_sensor.presencesensor_presence') {
                      return device.state === 'on' ? 'Presence detected' : 'No presence';
                    }
                    return device.state;
                  })()}
                </td>

                {/* Parameters */}
                <td className="border border-zinc-700 px-4 py-2 text-white">
                  {/* Temperature and openness information */}
                  {(() => {
                    const parts = [];
                    
                    // Add temperature if available (excluding Smartfan)
                    if (device.attributes?.temperature && device.entity_id !== 'fan.smartfan') {
                      parts.push(`${device.attributes.temperature}°${device.attributes.temperature_unit || "C"}`);
                    }
                    
                    // Add openness for curtain and roller shutter
                    if (device.entity_id === 'cover.0x54ef441000c939e0' && device.attributes?.current_position !== undefined) {
                      parts.push(`${device.attributes.current_position}% open`);
                    }
                    
                    if (device.entity_id === 'cover.rollo' && device.attributes?.current_position !== undefined) {
                      parts.push(`${device.attributes.current_position}% open`);
                    }
                    
                    return parts.length > 0 ? parts.join(', ') : "—";
                  })()}
                </td>

                {/* Latest Activity */}
                {/* <td className="border border-zinc-700 px-4 py-2 text-white">
                  {getLatestLogRelative(device.entity_id)}
                </td> */}
                
                {/* Rules Attached */}
                <td className="border border-zinc-700 px-4 py-2 text-white relative">
                  <span 
                    className={showTooltips ? "cursor-pointer hover:underline" : ""}
                    onClick={() => {
                      if (showTooltips) {
                        setActiveTooltip(activeTooltip === device.entity_id ? null : device.entity_id);
                      }
                    }}
                  >
                    {deviceAutomationCounts[device.entity_id] || 0}
                  </span>
                  
                  {showTooltips && activeTooltip === device.entity_id && (
                    <div className="absolute z-10 bg-gray-800 text-white p-2 rounded shadow-lg text-xs max-w-xs top-0 left-10 right-0">
                      {deviceAutomationTooltips[device.entity_id] || "This device is not connected to any automations"}
                    </div>
                  )}

                  {/* Commented out until I can fix it that it connects device and automation ID together
                  {loadingAutomations ? <span className="text-gray-400">Loading…</span> : getAutomationCountForDevice(device.entity_id)} */}
                </td>
              </tr>
            ))} 
            
            {/* Manually entry for TV, as it's not smart and not data cannot be fetched from HA */}
            {/* <tr className="bg-gray-500 text-white">
              <td className="border border-zinc-700 px-4 py-2 font-medium">TV</td>
              <td className="border border-zinc-700 px-4 py-2">
                {(() => {
                  const tvDevice = filteredDevices.find(device => device.entity_id === 'binary_sensor.tv_status');
                  return tvDevice ? (tvDevice.state === 'on' ? 'on' : 'off') : 'off';
                })()}
              </td>
              <td className="border border-zinc-700 px-4 py-2 text-white">—</td>
              <td className="border border-zinc-700 px-4 py-2 text-white">
                {(() => {
                  const tvDevice = filteredDevices.find(device => device.entity_id === 'binary_sensor.tv_status');
                  return tvDevice ? getLatestLogRelative(tvDevice.entity_id) : 'No recent activity';
                })()}
              </td>
              <td className="border border-zinc-700 px-4 py-2 text-white">0</td>
            </tr> */}
            
            {/* Button Automations */}
            {loadingButtonAutomations ? (
              <tr className="bg-gray-500 text-white">
                <td colSpan={4} className="border border-zinc-700 px-4 py-2 text-center"> {/* Former colspan 5 */}
                  Loading buttons...
                </td>
              </tr>
            ) : buttonAutomationsError ? (
              <tr className="bg-gray-500 text-white">
                <td colSpan={4} className="border border-zinc-700 px-4 py-2 text-center text-red-400"> {/* Former colspan 5 */}
                  Error loading buttons: {buttonAutomationsError}
                </td>
              </tr>
            ) : (
              Object.entries(buttonAutomations).map(([buttonName, automation]) => {
                // Map button names to their MQTT topics
                const mqttTopicMap: Record<string, string> = {
                  'Bedlight_Right_Toggle (Button)': 'zigbee2mqtt/Button - Bedside Right',
                  'Bedlight_Left_Toggle (Button)': 'zigbee2mqtt/Button - Bedside Left',
                  'zigbee2mqtt/Wall Switch': 'zigbee2mqtt/Wall Switch',
                  'Roller Shutter Control Button (Button)': 'zigbee2mqtt/Button - Roller Shutter',
                  'Button - Floor Lamp': 'zigbee2mqtt/Button - Floor Lamp'
                };
                
                // Map button names to their automation entity IDs for logbook
                const automationEntityMap: Record<string, string> = {
                  'Bedlight_Right_Toggle (Button)': 'automation.ps_bedlight_right_toggle',
                  'Bedlight_Left_Toggle (Button)': 'automation.ps_toggle_bedlight_left',
                  'zigbee2mqtt/Wall Switch': 'automation.ps_windowlighttoggle',
                  'Roller Shutter Control Button (Button)': 'automation.ps_roller_shutter_switch',
                  'Button - Floor Lamp': 'automation.ps_standlight_toggle'
                };
                
                // Map automation names to display names
                const displayNameMap: Record<string, string> = {
                  'Bedlight_Right_Toggle (Button)': 'Bedlight Right Toggle',
                  'Bedlight_Left_Toggle (Button)': 'Bedlight Left Toggle',
                  'zigbee2mqtt/Wall Switch': 'Wall Switch',
                  'Roller Shutter Control Button (Button)': 'Roller Shutter Control',
                  'Button - Floor Lamp': 'Floor Lamp'
                };
                
                const mqttTopic = mqttTopicMap[buttonName];
                const automationEntityId = automationEntityMap[buttonName];
                const displayName = displayNameMap[buttonName] || automation.name;
                
                return (
                  <tr key={automation.entityId} className="bg-gray-500 text-white">
                    <td className="border border-zinc-700 px-4 py-2 font-medium">
                      {displayName} (Button)
                    </td>
                    <td className="border border-zinc-700 px-4 py-2">
                      Button
                    </td>
                    <td className="border border-zinc-700 px-4 py-2 text-white">—</td>
                    {/* <td className="border border-zinc-700 px-4 py-2 text-white">
                      Replace it with {mqttTopic ? getLatestLogRelative(mqttTopic) : "No recent activity"} once we know how to fetch MQTT messages and how to depict them in Last Activity
                      {automationEntityId ? getLatestLogRelative(automationEntityId) : "No recent activity"}
                    </td> */}
                    <td className="border border-zinc-700 px-4 py-2 text-white relative">
                      <span 
                        className={showTooltips ? "cursor-pointer hover:underline" : ""}
                        onClick={() => {
                          if (showTooltips) {
                            setActiveTooltip(activeTooltip === automation.entityId ? null : automation.entityId);
                          }
                        }}
                      >
                        {buttonName === 'zigbee2mqtt/Wall Switch' ? 2 : 1}
                      </span>
                      
                      {showTooltips && activeTooltip === automation.entityId && (
                        <div className="absolute z-10 bg-gray-800 text-white p-2 rounded shadow-lg text-xs max-w-xs top-0 left-10 right-0">
                          {buttonName === 'zigbee2mqtt/Wall Switch' 
                            ? 'Wall Switch is connected to 2 automations: DoorLightToggle and WindowLightToggle'
                            : buttonName === 'Button - Floor Lamp'
                            ? 'Floor Lamp (Button) is connected to 1 automation: Floor Lamp Toggle'
                            : `${buttonName} is connected to 1 automation: ${automation.name}`
                          }
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {automationError && <div className="text-red-500 mt-2">{automationError}</div>}
      </div>
    </div>
  );
};

export default AllDevicesCard;
export type { AllDevicesCardProps };
