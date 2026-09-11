import { useState, useEffect } from "react";
import { TOKEN, RECORDER_PASSWORD } from "../config";
import LightCard from "../components/devices/LightCard";
import CurtainCard from "../components/devices/CurtainCard";
import ClockCard from "../components/devices/ClockCard";
import HeatingCard from "../components/devices/HeatingCard";
import SmartFanCard from "../components/devices/SmartFanCard";
import AllDevicesCard from "../components/devices/AllDevicesCard";
import AutomationCard from "../components/devices/AutomationCard";
import RecordActivity from "../components/RecordActivity";
import DoorSensorCard from "../components/devices/DoorSensorCard";
import WindowSensorCard from "../components/devices/WindowSensorCard";
import PresenceSensorCard from "../components/devices/PresenceSensorCard";
import TemperatureSensorCard from "../components/devices/TemperatureSensorCard";
import TVCard from "../components/devices/TVCard";
import SocketCard from "../components/devices/SocketCard";

type Light = {
  id: string;
  label: string;
  status: "on" | "off";
};

type Socket = {
  id: string;
  label: string;
  status: "on" | "off";
};

type Tab = "all devices" | "your room" | "rules";

function BaselineUI() {
    { /* Tabs Logic for the different lights and their states. Only lights which are "on" light up in the UI*/ }
  const [activeTab, setActiveTab] = useState<Tab>("your room");
  // Column focus state for tablet UI
  const [focusedColumn, setFocusedColumn] = useState<null | "lights" | "climate" | "other">(null);
  
  // Recorder states
  const [isAuthorized, setIsAuthorized] = useState(true);

  const [curtainOpen, setCurtainOpen] = useState(50);
  const [rolloOpen, setRolloOpen] = useState(50);
  const [temp, setTemp] = useState(22);
  
  

  // Function to fetch curtain states from Home Assistant
  const fetchCurtainStates = async () => {
    try {
      // Fetch curtain state
      const curtainResponse = await fetch('api/states/cover.0x54ef441000c939e0', {
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
        },
      });
      
      // Fetch rollo state
      const rolloResponse = await fetch('api/states/cover.rollo', {
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
        },
      });

      if (curtainResponse.ok) {
        const curtainData = await curtainResponse.json();
        console.log('Curtain data:', curtainData);
        if (curtainData.state !== 'unavailable' && curtainData.attributes?.current_position !== undefined) {
          console.log('Setting curtain position to:', curtainData.attributes.current_position);
          setCurtainOpen(curtainData.attributes.current_position);
        }
      }

      if (rolloResponse.ok) {
        const rolloData = await rolloResponse.json();
        console.log('Rollo data:', rolloData);
        if (rolloData.state !== 'unavailable' && rolloData.attributes?.current_position !== undefined) {
          console.log('Setting rollo position to:', rolloData.attributes.current_position);
          setRolloOpen(rolloData.attributes.current_position);
        }
      }
    } catch (error) {
      console.error('Error fetching curtain states:', error);
    }
  };

  // Function to fetch light states from Home Assistant
  const fetchLightStates = async () => {
    try {
      const lightIds = ["doorlight", "windowlight", "bedlight_l", "bedlight_r", "floorlamp"];
      
      for (const lightId of lightIds) {
        const response = await fetch(`api/states/light.${lightId}`, {
          headers: {
            'Authorization': 'Bearer ' + TOKEN,
          },
        });

        if (response.ok) {
          const lightData = await response.json();
          console.log(`Light ${lightId} data:`, lightData);
          
          if (lightData.state !== 'unavailable') {
            // Map the entity ID to the device ID used in the lights array
            const deviceId = lightId === "floorlamp" ? "floorlamp" : lightId;
            setLights(prev => prev.map(light => 
              light.id === deviceId 
                ? { ...light, status: lightData.state as "on" | "off" }
                : light
            ));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching light states:', error);
    }
  };

  // Function to fetch socket states from Home Assistant
  const fetchSocketStates = async () => {
    try {
      const socketIds = ["socket_fan", "socket_tv", "socket_bedlightl"];
      
      for (const socketId of socketIds) {
        const response = await fetch(`api/states/switch.${socketId}`, {
          headers: {
            'Authorization': 'Bearer ' + TOKEN,
          },
        });

        if (response.ok) {
          const socketData = await response.json();
          console.log(`Socket ${socketId} data:`, socketData);
          
          if (socketData.state !== 'unavailable') {
            setSockets(prev => prev.map(socket => 
              socket.id === socketId 
                ? { ...socket, status: socketData.state as "on" | "off" }
                : socket
            ));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching socket states:', error);
    }
  };

  // Function to fetch heating states from Home Assistant
  const fetchHeatingStates = async () => {
    try {
      const response = await fetch('api/states/climate.heater', {
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
        },
      });

      if (response.ok) {
        const heaterData = await response.json();
        console.log('Heater data:', heaterData);
        
        if (heaterData.state !== 'unavailable' && heaterData.attributes?.temperature !== undefined) {
          console.log('Setting heater temperature to:', heaterData.attributes.temperature);
          setTemp(heaterData.attributes.temperature);
        }
      }
    } catch (error) {
      console.error('Error fetching heating states:', error);
    }
  };

  // Set up automatic state updates every 5 seconds
  useEffect(() => {
    // Fetch initial states
    fetchCurtainStates();
    fetchLightStates(); // Fetch initial light states
    fetchSocketStates(); // Fetch initial socket states
    fetchHeatingStates(); // Fetch initial heating states
    
    // Set up interval for periodic updates
    const interval = setInterval(fetchCurtainStates, 2000);
    const lightInterval = setInterval(fetchLightStates, 2000); // Set up interval for light updates
    const socketInterval = setInterval(fetchSocketStates, 2000); // Set up interval for socket updates
    const heatingInterval = setInterval(fetchHeatingStates, 2000); // Set up interval for heating updates
    
    // Cleanup interval on component unmount
    return () => {
      clearInterval(interval);
      clearInterval(lightInterval);
      clearInterval(socketInterval);
      clearInterval(heatingInterval);
    };
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    console.log('Curtain state updated:', curtainOpen);
  }, [curtainOpen]);

  useEffect(() => {
    console.log('Rollo state updated:', rolloOpen);
  }, [rolloOpen]);
  
  const [lights, setLights] = useState<Light[]>([
    { id: "doorlight", label: "Wall Light Door", status: "off" },
    { id: "windowlight", label: "Wall Light Window", status: "off" },
    { id: "bedlight_l", label: "Bed Light Left", status: "off" },
    { id: "bedlight_r", label: "Bed Light Right", status: "off" },
    { id: "floorlamp", label: "Floor Lamp", status: "off" },
  ]);

  const [sockets, setSockets] = useState<Socket[]>([
    { id: "socket_fan", label: "Socket_Fan", status: "on" },
    { id: "socket_tv", label: "Socket_TV", status: "on" },
    { id: "socket_bedlightl", label: "Socket_BedlightL", status: "on" },
  ]);

  // Debug logging for light state changes
  useEffect(() => {
    console.log('Lights state updated:', lights);
  }, [lights]);

  // Debug logging for socket state changes
  useEffect(() => {
    console.log('Sockets state updated:', sockets);
  }, [sockets]);

  // Debug logging for heating state changes
  useEffect(() => {
    console.log('Heating temperature updated:', temp);
  }, [temp]);
  // Add brightness and color state for each light
  const [brightness, setBrightness] = useState<Record<string, number>>({
    doorlight: 100,
    windowlight: 100,
    bedlight_l: 100,
    bedlight_r: 100,
    floorlamp: 100,
  });
  const [color, setColor] = useState<Record<string, string>>({
    doorlight: '#ffff99',
    windowlight: '#ffff99',
    bedlight_l: '#ffff99',
    bedlight_r: '#ffff99',
    floorlamp: '#ffff99',
  });

  const handleBrightnessChange = async (id: string, value: number) => {
    setBrightness(prev => ({ ...prev, [id]: value }));
    // Convert 0-100 to 0-255
    const haBrightness = Math.round((value / 100) * 255);
    try {
      const response = await fetch('api/services/light/turn_on', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: `light.${id}`,
          brightness: haBrightness,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to set brightness: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error setting brightness:', error);
    }
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    // Parse r, g, b
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return [r, g, b];
  };

  const handleColorChange = async (id: string, value: string) => {
    setColor(prev => ({ ...prev, [id]: value }));
    const rgb = hexToRgb(value);
    try {
      const response = await fetch('api/services/light/turn_on', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: `light.${id}`,
          rgb_color: rgb,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to set color: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error setting color:', error);
    }
  };

  const handleCurtainChange = async (newPercentage: number) => {
    setCurtainOpen(newPercentage);
    try {
      const response = await fetch('api/services/cover/set_cover_position', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: 'cover.0x54ef441000c939e0',
          position: newPercentage,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to set curtain position: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error setting curtain position:', error);
      // Optionally revert state or show error
    }
  };

  const handleRolloChange = async (newPercentage: number) => {
    setRolloOpen(newPercentage);
    try {
      const response = await fetch('api/services/cover/set_cover_position', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: 'cover.rollo',
          position: newPercentage,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to set rollo position: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error setting rollo position:', error);
      // Optionally revert state or show error
    }
  };

  const handleTempChange = async (newTemp: number) => {
    setTemp(newTemp);
    try {
      const response = await fetch('api/services/climate/set_temperature', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: 'climate.heater',
          temperature: newTemp,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to set temperature: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error setting temperature:', error);
      // Optionally revert state or show error
    }
  };

  const toggleLight = async (id: string) => {
    const light = lights.find(light => light.id === id);
    if (!light) return;
  
    // Determine the new state based on the current state
    const newStatus = light.status === "on" ? "off" : "on";
  
    // Update the local state immediately for responsiveness
    setLights((prev) =>
      prev.map((light) =>
        light.id === id ? { ...light, status: newStatus } : light
      )
    );
  
    try {
      // Home Assistant API call to turn the light on or off
      const response = await fetch('api/services/light/turn_' + newStatus, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: `light.${id}`,  // Here, we're passing the entity_id to control the specific light
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to toggle the light: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error toggling light:', error);
      // Revert local state if the API call fails
      setLights((prev) =>
        prev.map((light) =>
          light.id === id ? { ...light, status: light.status === "on" ? "off" : "on" } : light
        )
      );
    }
  };

  const toggleSocket = async (id: string) => {
    const socket = sockets.find(socket => socket.id === id);
    if (!socket) return;
    const newStatus = socket.status === "on" ? "off" : "on";
    setSockets((prev) =>
      prev.map((socket) =>
        socket.id === id ? { ...socket, status: newStatus } : socket
      )
    );
    try {
      const response = await fetch(`api/services/switch/turn_${newStatus}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: `switch.${id}`,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to toggle the socket: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error toggling socket:', error);
      // Revert local state if the API call fails
      setSockets((prev) =>
        prev.map((socket) =>
          socket.id === id ? { ...socket, status: socket.status === "on" ? "off" : "on" } : socket
        )
      );
    }
  };



  return (
    <div
      className="w-screen min-h-screen transition-colors duration-300 bg-stone-50 text-black"
      onClick={() => setFocusedColumn(null)}
    >
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-center mb-10">
          Smart Hotel
        </h1>

        {/* Recorder Component */}
        <div className="absolute top-4 right-4 z-10">
          <RecordActivity />
        </div>

        {/* Tabs and ClockCard Row */}
        <div className="max-w-7xl mx-auto mb-4">
          <div className="border-2 border-gray-400 rounded-lg p-2 relative">
            <div className="grid grid-cols-3 gap-6">
              {/* Tabs Container */}
              <div className="col-span-2">
                <div className="grid grid-cols-3 gap-6">
                  {(["all devices", "your room", "rules"] as Tab[]).map((tab, index) => (
                    <div key={tab} className="relative">
                      <button
                        onClick={e => {
                          e.stopPropagation(); // Prevent outside click reset
                          setActiveTab(tab);
                        }}
                        className={`px-4 py-2 rounded capitalize w-full ${
                          activeTab === tab
                            ? "bg-blue-500 text-white"
                            : "bg-gray-500 text-white"
                        }`}>
                        {tab}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {/* ClockCard */}
              <div className="col-span-1">
                <ClockCard />
              </div>
            </div>
          </div>
        </div>

        {/* Your Room Content */}
        {activeTab === "your room" && (
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 border-2 border-gray-400 rounded-lg p-4 relative"
            onClick={e => e.stopPropagation()} // Prevent outside click reset when clicking inside grid
          >
            
            {/* Column 1: Lights */}
            <div
              className={`space-y-4 pr-4 transition-opacity duration-300 ${
                focusedColumn && focusedColumn !== "lights" ? "opacity-40" : ""
              }`}
              onClick={e => {
                e.stopPropagation();
                setFocusedColumn("lights");
              }}
            >
              <h2 className="text-2xl font-semibold mb-2">Lights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lights.map((light) => (
                  <LightCard
                    key={light.id}
                    label={light.label}
                    status={light.status}
                    onToggle={() => toggleLight(light.id)}
                    className={light.id === "floorlamp" ? "sm:col-span-2" : ""}
                    // brightness={brightness[light.id]}
                    // onBrightnessChange={value => handleBrightnessChange(light.id, value)}
                    // color={color[light.id]}
                    // onColorChange={value => handleColorChange(light.id, value)}
                  />
                ))}
              </div>
            </div>

            {/* Column 2: Windows */}
            <div
              className={`space-y-4 pr-4 transition-opacity duration-300 ${
                focusedColumn && focusedColumn !== "climate" ? "opacity-40" : ""
              }`}
              onClick={e => {
                e.stopPropagation();
                setFocusedColumn("climate");
              }}
            >
              <h2 className="text-2xl font-semibold mb-2">Appliances</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CurtainCard
                label="Curtains"
                percentage={curtainOpen}
                setPercentage={handleCurtainChange}
              />
              <CurtainCard
                label="Roller Shutter"
                percentage={rolloOpen}
                setPercentage={handleRolloChange}
              />
              <SmartFanCard />
              <TVCard />
              {sockets.map((socket) => (
            <div key={socket.id} className={`relative ${socket.id === "socket_bedlightl" ? "sm:col-span-2" : ""}`}>
              <SocketCard label={socket.label} status={socket.status} onToggle={() => toggleSocket(socket.id)} />
            </div>
          ))}
              </div>
              {/* <HeatingCard temp={temp} setTemp={handleTempChange} /> */}
              
              
            </div>

            {/* Column 3: Time */}
            <div
              className={`space-y-4 pl-4 transition-opacity duration-300 ${
                focusedColumn && focusedColumn !== "other" ? "opacity-40" : ""
              }`}
              onClick={e => {
                e.stopPropagation(); 
                setFocusedColumn("other");
              }}
            >
            <h2 className="text-2xl font-semibold mb-2">Sensors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <WindowSensorCard />
              <DoorSensorCard />
              <PresenceSensorCard />
              <TemperatureSensorCard />
             
              
            </div>
            {/* Vertical dividers extending from top to bottom borders */}
            <div className="absolute top-0 left-1/3 w-0.5 h-full bg-gray-400 transform -translate-x-0.5"></div>
            <div className="absolute top-0 left-2/3 w-0.5 h-full bg-gray-400 transform -translate-x-0.5"></div>
            </div>
          </div>
        )}

        {/* All Devices Content */}
        {activeTab === "all devices" && (
  <div className="grid grid-cols-1 gap-6">
    <AllDevicesCard />
  </div>
)}

        {/* Rules Content */}
        {activeTab === "rules" && (
          <div className="text-center mt-10 text-lg text-gray-300">
            <AutomationCard />
          </div>
        )}
      </div>
    </div>
  );
}

export default BaselineUI;
