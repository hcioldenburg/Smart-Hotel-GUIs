import React, { useState } from "react";
import LightCard from "./devices/LightCard";
import CurtainCard from "./devices/CurtainCard";
import SmartFanCard from "./devices/SmartFanCard";
import TVCard from "./devices/TVCard";
import WindowSensorCard from "./devices/WindowSensorCard";
import DoorSensorCard from "./devices/DoorSensorCard";
import PresenceSensorCard from "./devices/PresenceSensorCard";
import TemperatureSensorCard from "./devices/TemperatureSensorCard";
import { TOKEN } from "../config";
import SocketCard from "./devices/SocketCard";
import { useEffect } from "react";

// Tooltip helper
const Tooltip = ({ text, id, openTooltipId, setOpenTooltipId }: { 
  text: string; 
  id: string; 
  openTooltipId: string | null; 
  setOpenTooltipId: (id: string | null) => void; 
}) => {
  const isVisible = openTooltipId === id;

  const handleClick = () => {
    setOpenTooltipId(isVisible ? null : id);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <span 
        style={{ marginLeft: 4, cursor: "pointer" }} 
        onClick={handleClick}
      >
        <span style={{
          display: "inline-block",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#888",
          color: "#fff",
          textAlign: "center",
          fontSize: 12,
          lineHeight: "16px",
          fontWeight: "bold"
        }}>i</span>
      </span>
      {isVisible && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#333",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: "4px",
          fontSize: "14px",
          width: "400px",
          wordWrap: "break-word",
          whiteSpace: "normal",
          zIndex: 1000,
          marginBottom: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
        }}>
          {text}
          <div style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            border: "4px solid transparent",
            borderTopColor: "#333"
          }}></div>
        </div>
      )}
    </div>
  );
};

export type Light = {
  id: string;
  label: string;
  status: "on" | "off";
};

export type Socket = {
  id: string;
  label: string;
  status: "on" | "off";
};

export type YourRoomCardsProps = {
  showTooltips?: boolean;
};

const YourRoomCards: React.FC<YourRoomCardsProps> = ({ showTooltips = false }) => {
  // Column focus state for tablet UI
  const [focusedColumn, setFocusedColumn] = useState<null | "lights" | "climate" | "other">(null);
  
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

  const [curtainOpen, setCurtainOpen] = useState(50);
  const [rolloOpen, setRolloOpen] = useState(50);
  const [temp, setTemp] = useState(22);
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

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
    fetchLightStates();
    fetchSocketStates();
    fetchHeatingStates();
    
    // Set up interval for periodic updates
    const curtainInterval = setInterval(fetchCurtainStates, 2000);
    const lightInterval = setInterval(fetchLightStates, 2000);
    const socketInterval = setInterval(fetchSocketStates, 2000);
    const heatingInterval = setInterval(fetchHeatingStates, 2000);
    
    // Cleanup intervals on component unmount
    return () => {
      clearInterval(curtainInterval);
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

  useEffect(() => {
    console.log('Lights state updated:', lights);
  }, [lights]);

  useEffect(() => {
    console.log('Sockets state updated:', sockets);
  }, [sockets]);

  useEffect(() => {
    console.log('Heating temperature updated:', temp);
  }, [temp]);

  const toggleLight = async (id: string) => {
    const light = lights.find(light => light.id === id);
    if (!light) return;
    const newStatus = light.status === "on" ? "off" : "on";
    setLights((prev) =>
      prev.map((light) =>
        light.id === id ? { ...light, status: newStatus } : light
      )
    );
    try {
      const response = await fetch(`api/services/light/turn_${newStatus}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: `light.${id}`,
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
      // Revert local state if the API call fails
      setRolloOpen(rolloOpen);
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

  // TODO: Fix the fadeout
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-6 border-2 border-gray-400 rounded-lg p-4 relative"
      onClick={() => setFocusedColumn(null)}
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
        <h2 className="text-2xl font-semibold mb-2">
          Lights
          {showTooltips && <Tooltip text="Control all light fixtures in your home. Tap the “Turn On” / “Turn Off” button to toggle each light. Status is shown above the button (e.g., off or on)." id="lights-tooltip" openTooltipId={openTooltipId} setOpenTooltipId={setOpenTooltipId} />}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lights.map((light) => (
            <div
              key={light.id}
              className={`relative ${light.id === "floorlamp" ? "sm:col-span-2" : ""}`}
            >
              <LightCard
                label={light.label}
                status={light.status}
                onToggle={() => toggleLight(light.id)}
              />

            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Windows/Climate */}
      <div
        className={`space-y-4 pr-4 transition-opacity duration-300 ${
          focusedColumn && focusedColumn !== "climate" ? "opacity-40" : ""
        }`}
        onClick={e => {
          e.stopPropagation();
          setFocusedColumn("climate");
        }}
      >
        <h2 className="text-2xl font-semibold mb-2">
          Appliances
          {showTooltips && <Tooltip text="Manage smart appliances such as heating, fans, shades, TVs, and smart sockets." id="climate-tooltip" openTooltipId={openTooltipId} setOpenTooltipId={setOpenTooltipId} />}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <CurtainCard
            label="Curtains"
            percentage={curtainOpen}
            setPercentage={handleCurtainChange}
          />
          {showTooltips && <div className="absolute top-2 right-2"><Tooltip text="Use the slider to adjust the position of your curtains." id="curtains-tooltip" openTooltipId={openTooltipId} setOpenTooltipId={setOpenTooltipId} /></div>}
        </div>
        <div className="relative">
          <CurtainCard
            label="Roller Shutter"
            percentage={rolloOpen}
            setPercentage={handleRolloChange}
          />
          {showTooltips && <div className="absolute top-2 right-2"><Tooltip text="Use the slider to adjust the position of your roller shutter." id="rollo-tooltip" openTooltipId={openTooltipId} setOpenTooltipId={setOpenTooltipId} /></div>}
        </div>
        <div className="relative">
          <SmartFanCard />
          {showTooltips && <div className="absolute top-2 right-2"><Tooltip text="Check the status and toggle your ventilation fan ON/OFF." id="fan-tooltip" openTooltipId={openTooltipId} setOpenTooltipId={setOpenTooltipId} /></div>}
        </div>
        <div className="relative">
          <TVCard />
          {showTooltips && <div className="absolute top-2 right-2"><Tooltip text="Check the status and toggle your TV ON/OFF" id="tv-tooltip" openTooltipId={openTooltipId} setOpenTooltipId={setOpenTooltipId} /></div>}
        </div>
        {sockets.map((socket) => (
            <div key={socket.id} className={`relative ${socket.id === "socket_bedlightl" ? "sm:col-span-2" : ""}`}>
              <SocketCard label={socket.label} status={socket.status} onToggle={() => toggleSocket(socket.id)} />
              {showTooltips && <div className="absolute top-2 right-2"><Tooltip text="Check the status and toggle the socket ON/OFF" id={`socket-tooltip-${socket.id}`} openTooltipId={openTooltipId} setOpenTooltipId={setOpenTooltipId} /></div>}
            </div>
          ))}
        </div>

        
        {/* <div className="relative">
          <HeatingCard temp={temp} setTemp={handleTempChange} />
          {showTooltips && <div className="absolute top-2 right-2"><Tooltip text="View and change the set temperature for your heating system. Use the +/– buttons to raise or lower the target value." id="heating-tooltip" openTooltipId={openTooltipId} setOpenTooltipId={setOpenTooltipId} /></div>}
        </div> */}
      </div>

      {/* Column 3: Time/Weather */}
      <div
        className={`space-y-4 pl-4 transition-opacity duration-300 ${
          focusedColumn && focusedColumn !== "other" ? "opacity-40" : ""
        }`}
        onClick={e => {
          e.stopPropagation();
          setFocusedColumn("other");
        }}
      >
       <h2 className="text-2xl font-semibold mb-2">
          Sensors
          {showTooltips && <Tooltip text="Monitor environmental conditions and control power to connected devices." id="sensors-tooltip" openTooltipId={openTooltipId} setOpenTooltipId={setOpenTooltipId} />}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <WindowSensorCard />
          </div>
          <div className="relative">
            <DoorSensorCard />
          </div>
          <div className="relative">
            <PresenceSensorCard />
          </div>
          <div className="relative">
            <TemperatureSensorCard />
          </div>
        </div>
        
      </div>
      
      {/* Vertical dividers extending from top to bottom borders */}
      <div className="absolute top-0 left-1/3 w-0.5 h-full bg-gray-400 transform -translate-x-0.5"></div>
      <div className="absolute top-0 left-2/3 w-0.5 h-full bg-gray-400 transform -translate-x-0.5"></div>
    </div>
  );
};

export default YourRoomCards; 