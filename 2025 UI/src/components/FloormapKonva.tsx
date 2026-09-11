import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Circle, Text, Image as KonvaImage, Group, Path, Shape } from 'react-konva';
import { TOKEN } from '../config';

import floormapData from '../assets/floormap only bubbles.json';

// Importing the furniture, device, and background images

import bedImg from '../images/furniture/bed-alt.png';
import chairImg from '../images/furniture/chair.png';
import deskchairImg from '../images/furniture/deskchair.png';
import tableImg from '../images/furniture/table.png';
import deskImg from '../images/furniture/desk.png';
import hubImg from '../images/hub.svg';
import doorImg from '../images/furniture/door.png';
import windowImg from '../images/furniture/window.png';

import presencesensorImg from '../images/devices/motionsensor.png';
import walllampImg from '../images/devices/walllamp.png';
import tvImg from '../images/devices/tv.png';
import standinglampImg from '../images/devices/standinglamp.png';
import curtainImg from '../images/devices/curtain.svg';
import rollershutterImg from '../images/devices/roller_shade.svg';
import tabletImg from '../images/devices/tablet.png';
import fanImg from '../images/devices/fan.png';
import tempertureSensorImg from '../images/devices/temperaturesensor.png';
import heaterImg from '../images/devices/heater.png';
import windowsensorImg from '../images/devices/icon_window.svg';
import doorsensorImg from '../images/devices/doorsensor.png';
import bedlightImg from '../images/devices/bedlight.png';
import buttonImg from '../images/devices/switch.svg';
import doorswitchImg from '../images/devices/doorswitch.png';
import smartplugImg from '../images/devices/smartsocket.svg';

import backgroundImg from '../images/floorplan-background.svg';
import { useLogbook } from '../hooks/useDevices';


type WallShape = { id: string; type: string; points: number[]; stroke: string };
type DoorShape = { id: string; type: string; x: number; y: number; width: number; height: number; fill: string; label: string };
type RectShape = { id: string; type: string; x: number; y: number; width: number; height: number; fill: string; label: string };
type CircleShape = { id: string; type: string; x: number; y: number; radius: number; fill: string; label: string };
type Shape = WallShape | DoorShape | RectShape | CircleShape;

const FloorMapComponent = ({ displayConnections = false, displayDependencies = false, selectedCategory = [] }: { displayConnections?: boolean, displayDependencies?: boolean, selectedCategory?: string[] }) => {
  const [shapes] = useState<Shape[]>(floormapData);

  // Setting the states for the furniture and devices images
  const [bedImage, setBedImage] = useState<HTMLImageElement | null>(null);
  const [chairImage, setChairImage] = useState<HTMLImageElement | null>(null);
  const [deskchairImage, setDeskchairImage] = useState<HTMLImageElement | null>(null);
  const [tableImage, setTableImage] = useState<HTMLImageElement | null>(null);
  const [deskImage, setDeskImage] = useState<HTMLImageElement | null>(null);
  const [hubImage, sethubImage] = useState<HTMLImageElement | null>(null);
  const [doorImage, setDoorImage] = useState<HTMLImageElement | null>(null);
  const [windowImage, setWindowImage] = useState<HTMLImageElement | null>(null);

  // Devices
  const [presenceSensorImage, setPresenceSensorImage] = useState<HTMLImageElement | null>(null);
  const [wallLampImage, setWallLampImage] = useState<HTMLImageElement | null>(null);
  const [tvImage, setTvImage] = useState<HTMLImageElement | null>(null);
  const [standinglampImage, setStandinglampImage] = useState<HTMLImageElement | null>(null);
  const [curtainImage, setCurtainImage] = useState<HTMLImageElement | null>(null);
  const [rollershutterImage, setRolloShutterImage] = useState<HTMLImageElement | null>(null);
  const [tabletImage, setTabletImage] = useState<HTMLImageElement | null>(null);
  const [fanImage, setFanImage] = useState<HTMLImageElement | null>(null);
  const [tempertureSensorImage, setTempertureSensorImage] = useState<HTMLImageElement | null>(null);
  const [heaterImage, setHeaterImage] = useState<HTMLImageElement | null>(null);
  const [windowsensorImage, setWindowsensorImage] = useState<HTMLImageElement | null>(null);
  const [doorsensorImage, setDoorsensorImage] = useState<HTMLImageElement | null>(null);
  const [bedlightImage, setBedlightImage] = useState<HTMLImageElement | null>(null);
  const [buttonImage, setButtonImage] = useState<HTMLImageElement | null>(null);
  const [doorswitchImage, setDoorswitchImage] = useState<HTMLImageElement | null>(null);
  const [smartplugImage, setSmartplugImage] = useState<HTMLImageElement | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);


  const [deviceStates, setDeviceStates] = useState<Record<string, boolean>>({});
  const [blindsPosition, setBlindsPosition] = useState(50);
  const [rolloPosition, setRolloPosition] = useState(30);
  const [sensorStates, setSensorStates] = useState<Record<string, any>>({});
  const [heaterTemp, setHeaterTemp] = useState(22);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Function to format relative time (copied from AutomationCard)
  const formatRelativeTime = (milliseconds: number): string => {
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

  // Function to get latest log with relative time
  const getLatestLogRelative = (entityId: string): string => {
    if (!popupLogbook || popupLogbook.length === 0) {
      return 'No recent activity.';
    }
    
    const latestLog = popupLogbook[popupLogbook.length - 1];
    const logTime = new Date(latestLog.when).getTime();
    const timeDiff = currentTime - logTime;
    
    return formatRelativeTime(timeDiff);
  };

  // Update current time every minute for relative time calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Function to fetch smartplug states from Home Assistant
  const fetchSmartplugStates = async () => {
    try {
      const plugIds = ["socket_fan", "socket_tv", "socket_bedlightl"];

      for (const plugId of plugIds) {
        const response = await fetch(`api/states/switch.${plugId}`, {
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
        },
      });

      if (response.ok) {
        const smartplugData = await response.json();
        //console.log('Fan data:', fanData);
        
        if (smartplugData.state !== 'unavailable') {
          // Map the entity ID to the device ID used in the floormap
          const deviceId = plugId;
          setDeviceStates(prev => ({
            ...prev,
            [deviceId]: smartplugData.state === 'on'
          }));
        }
      }
    } }catch (error) {
      console.error('Error fetching smartplug states:', error);
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
          //console.log(`Light ${lightId} data:`, lightData);
          
          if (lightData.state !== 'unavailable') {
            // Map the entity ID to the device ID used in the floormap
            const deviceId = lightId === "floorlamp" ? "floorlamp" : lightId;
            setDeviceStates(prev => ({
              ...prev,
              [deviceId]: lightData.state === 'on'
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching light states:', error);
    }
  };

  // Function to fetch curtain and rollo states from Home Assistant
  const fetchCoverStates = async () => {
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
        //console.log('Curtain data:', curtainData);
        if (curtainData.state !== 'unavailable' && curtainData.attributes?.current_position !== undefined) {
          //console.log('Setting curtain position to:', curtainData.attributes.current_position);
          setBlindsPosition(curtainData.attributes.current_position);
        }
      }

      if (rolloResponse.ok) {
        const rolloData = await rolloResponse.json();
        //console.log('Rollo data:', rolloData);
        if (rolloData.state !== 'unavailable' && rolloData.attributes?.current_position !== undefined) {
          //console.log('Setting rollo position to:', rolloData.attributes.current_position);
          setRolloPosition(rolloData.attributes.current_position);
        }
      }
    } catch (error) {
      console.error('Error fetching cover states:', error);
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
        //console.log('Heater data:', heaterData);
        
        if (heaterData.state !== 'unavailable' && heaterData.attributes?.temperature !== undefined) {
          //console.log('Setting heater temperature to:', heaterData.attributes.temperature);
          setHeaterTemp(heaterData.attributes.temperature);
        }
      }
    } catch (error) {
      console.error('Error fetching heating states:', error);
    }
  };

  // Function to fetch fan states from Home Assistant
  const fetchFanStates = async () => {
    try {
      const response = await fetch('api/states/fan.smartfan', {
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
        },
      });

      if (response.ok) {
        const fanData = await response.json();
        //console.log('Fan data:', fanData);
        
        if (fanData.state !== 'unavailable') {
          setDeviceStates(prev => ({
            ...prev,
            smartfan: fanData.state === 'on'
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching fan states:', error);
    }
  };

  // Function to fetch TV state from Home Assistant
  const fetchTVState = async () => {
    try {
      const response = await fetch('api/states/binary_sensor.tv_status', {
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
        },
      });

      if (response.ok) {
        const tvData = await response.json();
        //console.log('TV data:', tvData);
        
        if (tvData.state !== 'unavailable') {
          setDeviceStates(prev => ({
            ...prev,
            tv: tvData.state === 'on'
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching TV state:', error);
    }
  };

  // Set up automatic state updates every 5 seconds
  useEffect(() => {
    // Fetch initial states
    fetchLightStates();
    fetchSmartplugStates();
    fetchCoverStates();
    fetchHeatingStates();
    fetchFanStates(); // Add this line to fetch fan states
    fetchTVState(); // Add this line to fetch TV state
    
    // Set up interval for periodic updates
    const lightInterval = setInterval(fetchLightStates, 2000);
    const smartplugInterval = setInterval(fetchSmartplugStates, 2000);
    const coverInterval = setInterval(fetchCoverStates, 2000);
    const heatingInterval = setInterval(fetchHeatingStates, 2000);
    const fanInterval = setInterval(fetchFanStates, 2000); // Add this line to set up fan interval
    const tvInterval = setInterval(fetchTVState, 2000); // Add this line to set up TV interval
    
    // Cleanup intervals on component unmount
    return () => {
      clearInterval(lightInterval);
      clearInterval(smartplugInterval);
      clearInterval(coverInterval);
      clearInterval(heatingInterval);
      clearInterval(fanInterval); // Add this line to clear fan interval
      clearInterval(tvInterval); // Add this line to clear TV interval
    };
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    //console.log('Device states updated:', deviceStates);
  }, [deviceStates]);

  useEffect(() => {
    //console.log('Blinds position updated:', blindsPosition);
  }, [blindsPosition]);

  useEffect(() => {
    //console.log('Rollo position updated:', rolloPosition);
  }, [rolloPosition]);

  useEffect(() => {
    //console.log('Heater temperature updated:', heaterTemp);
  }, [heaterTemp]);

  // Map device IDs in the JSON file to Home Assistant entity_id
  const deviceIDMap: Record<string, string> = {
    'tv': 'binary_sensor.tv_status',
    'curtain': 'cover.0x54ef441000c939e0',
    'rollo': 'cover.rollo',
    'presencesensor': 'binary_sensor.presencesensor_presence',
    'doorlight': 'light.doorlight',
    'windowlight': 'light.windowlight',
    'floorlamp': 'light.floorlamp',
    'bedlight_r': 'light.bedlight_r',
    'bedlight_l': 'light.bedlight_l',
    'smartfan': 'fan.smartfan',
    'temperaturesensor': 'sensor.temp_humid_temperature',
    'heater': 'climate.heater',
    'rolloswitch': 'automation.ps_rolloswitchcontrol',
    'windowsensor': 'binary_sensor.sensor_window_contact',
    'doorsensor': 'binary_sensor.sensor_door_contact',
    'sf01': 'automation.ps_bedlight_right_toggle',
    'sf02': 'automation.ps_toggle_bedlight_left',
    'doorswitch': 'automation.ps_windowlighttoggle',
    'FloorLampButton': 'automation.ps_standlight_toggle',
    'socket_fan': 'switch.socket_fan',
    'socket_tv': 'switch.socket_tv',
    'socket_bedlightl': 'switch.socket_bedlightl',
  };

  const [popupDevice, setPopupDevice] = useState<{ id: string, label: string } | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  // For popup, get entityId and useLogbook
  const popupEntityId = popupDevice ? deviceIDMap[popupDevice.id] : null;
  const { logbook: popupLogbook } = useLogbook(popupEntityId ? [popupEntityId] : []);

  // Fetch sensor states when popup opens
  useEffect(() => {
    if (popupOpen && popupDevice) {
      const fetchSensorState = async () => {
        const sensorEntityIds = {
          'Windowsensor': 'binary_sensor.sensor_window_contact',
          'Doorsensor': 'binary_sensor.sensor_door_contact',
          'Presencesensor': 'binary_sensor.presencesensor_presence',
          'Temperaturesensor': 'sensor.temp_humid_temperature'
        };
        
        const entityId = sensorEntityIds[popupDevice.label as keyof typeof sensorEntityIds];
        if (entityId) {
          try {
            const response = await fetch(`/api/states/${entityId}`, {
              headers: {
                'Authorization': `Bearer ${TOKEN}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              setSensorStates(prev => ({
                ...prev,
                [popupDevice.label]: data.state
              }));
            }
          } catch (error) {
            console.error('Error fetching sensor state:', error);
          }
        }
      };
      
      fetchSensorState();
    }
  }, [popupOpen, popupDevice]);


  // Transforming the images for the furniture and devices to be suitable to be used for KonvaImage
  useEffect(() => {
    const background = new window.Image();
    background.src = backgroundImg;
    background.onload = () => setBackgroundImage(background);
  }, []);

  useEffect(() => {
    // Load all images in a single useEffect to prevent multiple re-renders
    const loadImage = (src: string, setter: (img: HTMLImageElement) => void) => {
      const img = new window.Image();
      img.src = src;
      img.onload = () => setter(img);
    };

    loadImage(bedImg, setBedImage);
    loadImage(chairImg, setChairImage);
    loadImage(deskchairImg, setDeskchairImage);
    loadImage(tableImg, setTableImage);
    loadImage(deskImg, setDeskImage);
    loadImage(hubImg, sethubImage);
    loadImage(doorImg, setDoorImage);
    loadImage(windowImg, setWindowImage);
    loadImage(presencesensorImg, setPresenceSensorImage);
    loadImage(walllampImg, setWallLampImage);
    loadImage(tvImg, setTvImage);
    loadImage(standinglampImg, setStandinglampImage);
    loadImage(curtainImg, setCurtainImage);
    loadImage(rollershutterImg, setRolloShutterImage);
    loadImage(tabletImg, setTabletImage);
    loadImage(fanImg, setFanImage);
    loadImage(tempertureSensorImg, setTempertureSensorImage);
    loadImage(heaterImg, setHeaterImage);
    loadImage(windowsensorImg, setWindowsensorImage);
    loadImage(doorsensorImg, setDoorsensorImage);
    loadImage(bedlightImg, setBedlightImage);
    loadImage(buttonImg, setButtonImage);
    loadImage(doorswitchImg, setDoorswitchImage);
    loadImage(smartplugImg, setSmartplugImage);
  }, []);

    // Map device labels to their categories
    const deviceCategoryMap: Record<string, string> = {
      'Walllight': 'lighting',
      'Floor Lamp': 'lighting',
      'Bedlight': 'lighting',
      'Button': 'lighting',
      'Wallswitch': 'lighting',

      'Roller Shutter': 'climate',
      'Fan': 'climate',
      'Heater': 'climate',
      'Roller Shutter Control': 'climate',
      'Curtain': 'climate',
      'Smart Plug': 'climate',

      'TV': 'media',
      'IPad': 'media',

      'Presencesensor': 'sensors',
      'Temperaturesensor': 'sensors',
      'Windowsensor': 'sensors',
      'Doorsensor': 'sensors'
    };

    // Pre-calculate opacity values for better performance
    const getDeviceOpacity = (deviceLabel: string): number => {
      if (selectedCategory.length === 0) return 1;
      const deviceCategory = deviceCategoryMap[deviceLabel];
      return selectedCategory.includes(deviceCategory) ? 1 : 0.3;
    };
    

  // --- Find device and hub positions for connection lines ---
  // List of device labels to connect to the Hub
  const deviceLabels = [
    'TV', 'Curtain', 'Roller Shutter', 'Presencesensor', 'Walllight', 'Floor Lamp', 'Bedlight', 'IPad',
    'Fan', 'Temperaturesensor', 'Heater', 'Roller Shutter Control', 'Windowsensor', 'Doorsensor', 'Button', 'Wallswitch', 'Smart Plug'
  ];

  // Map device label to image
  const deviceImageMap: Record<string, HTMLImageElement | null> = {
    'TV': tvImage,
    'Curtain': curtainImage,
    'Roller Shutter': rollershutterImage,
    'Presencesensor': presenceSensorImage,
    'Walllight': wallLampImage,
    'Floor Lamp': standinglampImage,
    'Bedlight': bedlightImage,
    'IPad': tabletImage,
    'Fan': fanImage,
    'Temperaturesensor': tempertureSensorImage,
    'Heater': heaterImage,
    'Roller Shutter Control': buttonImage,
    'Windowsensor': windowsensorImage,
    'Doorsensor': doorsensorImage,
    'Button': buttonImage,
    'Wallswitch': buttonImage,
    'Smart Plug': smartplugImage,
  };

  // Find the Hub shape
  const hubShape = shapes.find(
    (shape) => (shape.type === 'rect' && 'label' in shape && shape.label === 'Hub')
  ) as RectShape | undefined;
  // Find device shapes
  const deviceShapes = shapes.filter(
    (shape) => (shape.type === 'rect' || shape.type === 'door') && 'label' in shape && deviceLabels.includes(shape.label)
  ) as (RectShape | DoorShape)[];
  // Helper to get center of a shape
  const getCenter = (shape: RectShape | DoorShape) => {
    return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
  };
  const hubCenter = hubShape ? getCenter(hubShape) : null;

  // --- Dependency line logic ---
  // Find the three shapes by id (all lowercase)
  const windowlightShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'windowlight'
  ) as RectShape | undefined;
  const doorlightShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'doorlight'
  ) as RectShape | undefined;
  const bedlight_rightShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'bedlight_r'
  ) as RectShape | undefined;
  const bedlight_leftShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'bedlight_l'
  ) as RectShape | undefined;
  const standinglampShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'floorlamp'
  ) as RectShape | undefined;
  

  const fanShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'smartfan'
  ) as RectShape | undefined;
  const heaterShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'heater'
  ) as RectShape | undefined;
  const curtainShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'curtain'
  ) as RectShape | undefined;
  const rolloShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'rollo'
  ) as RectShape | undefined;


  const presencesensorShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'presencesensor'
  ) as RectShape | undefined;
  const windowsensorShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'windowsensor'
  ) as RectShape | undefined;
  const temperaturesensorShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'temperaturesensor'
  ) as RectShape | undefined;
  const doorsensorShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'doorsensor'
  ) as RectShape | undefined;

  const sf01Shape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'sf01'
  ) as RectShape | undefined;
  const sf02Shape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'sf02'
  ) as RectShape | undefined;
  const h1Switch_DoorShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'doorswitch'
  ) as RectShape | undefined;
  const rolloswitchShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'rolloswitch'
  ) as RectShape | undefined;
  const floorLampButtonShape = shapes.find(
    (shape) => shape.type === 'rect' && shape.id === 'FloorLampButton'
  ) as RectShape | undefined;
  

  
  // Helper to get center of a shape (already defined)
  const windowlightCenter = windowlightShape ? getCenter(windowlightShape) : null;
  const doorlightCenter = doorlightShape ? getCenter(doorlightShape) : null;
  const bedlight_rightCenter = bedlight_rightShape ? getCenter(bedlight_rightShape) : null;
  const bedlight_leftCenter = bedlight_leftShape ? getCenter(bedlight_leftShape) : null;
  const standinglampCenter = standinglampShape ? getCenter(standinglampShape) : null;

  const fanCenter = fanShape ? getCenter(fanShape) : null;
  const heaterCenter = heaterShape ? getCenter(heaterShape) : null;
  const curtainCenter = curtainShape ? getCenter(curtainShape) : null;
  const rolloCenter = rolloShape ? getCenter(rolloShape) : null;

  const presencesensorCenter = presencesensorShape ? getCenter(presencesensorShape) : null;
  const windowsensorCenter = windowsensorShape ? getCenter(windowsensorShape) : null;
  const temperaturesensorCenter = temperaturesensorShape ? getCenter(temperaturesensorShape) : null;
  const doorsensorCenter = doorsensorShape ? getCenter(doorsensorShape) : null;

  const sf01Center = sf01Shape ? getCenter(sf01Shape) : null;
  const sf02Center = sf02Shape ? getCenter(sf02Shape) : null;
  const h1Switch_DoorCenter = h1Switch_DoorShape ? getCenter(h1Switch_DoorShape) : null;
  const rolloswitchCenter = rolloswitchShape ? getCenter(rolloswitchShape) : null;
  const floorLampButtonCenter = floorLampButtonShape ? getCenter(floorLampButtonShape) : null;
  

  


  // Helper to call Home Assistant service
async function callHomeAssistantService(entityId: string, turnOn: boolean) {
  const [domain] = entityId.split('.');
  let url, body, service;

  if (domain === 'script') {
    // Always trigger script with turn_on
    url = '/api/services/script/turn_on';
    body = JSON.stringify({ entity_id: entityId });
  } else if (domain === 'binary_sensor') {
    // For binary sensors like TV status, we need to call the script service
    // since binary sensors are read-only
    // The script.new_script likely toggles the TV state, so we always call turn_on
    url = '/api/services/script/turn_on';
    body = JSON.stringify({ entity_id: 'script.new_script' });
  } else {
    service = turnOn ? 'turn_on' : 'turn_off';
    url = `/api/services/${domain}/${service}`;
    body = JSON.stringify({ entity_id: entityId });
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Failed to call service: ${res.statusText}`);
  }
  return res.json();
}

  // Helper to set curtains position
  const handleCurtainPositionChange = async (newPosition: number) => {
    setBlindsPosition(newPosition);
    
    try {
      const curtainResponse = await fetch('/api/services/cover/set_cover_position', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: 'cover.0x54ef441000c939e0',
          position: newPosition,
        }),
      });
      if (!curtainResponse.ok) {
        throw new Error(`Failed to set curtain position: ${curtainResponse.statusText}`);
      }
    } catch (error) {
      console.error('Error setting curtain position:', error);
    }
  };

  // Helper to set rollo position
  const handleRolloPositionChange = async (newPosition: number) => {
    setRolloPosition(newPosition);
    
    try {
      const rolloResponse = await fetch('/api/services/cover/set_cover_position', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: 'cover.rollo',
          position: newPosition,
        }),
      });
      if (!rolloResponse.ok) {
        throw new Error(`Failed to set rollo position: ${rolloResponse.statusText}`);
      }
    } catch (error) {
      console.error('Error setting rollo position:', error);
    }
  };

  // Helper to set heater temperature
  const handleHeaterTempChange = async (newTemp: number) => {
    setHeaterTemp(newTemp);
    try {
      const response = await fetch('/api/services/climate/set_temperature', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: 'climate.heater',
          temperature: newTemp,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to set heater temperature: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error setting heater temperature:', error);
    }
  };

  return (
    <div>
      <Stage width={600} height={600} style={{ border: '1px solid #ccc' }}>
        <Layer>
          {/* Background image placeholder */}
          {backgroundImage && (
            <KonvaImage
              x={0}
              y={0}
              width={600}
              height={600}
              image={backgroundImage}
              listening={false} // So it doesn't block mouse events
            />
          )}
          {/* Draw connection lines if enabled */}
          {displayConnections && hubCenter && deviceShapes.map((device, idx) => {
            const deviceCenter = getCenter(device);
            const shouldRenderDevice = getDeviceOpacity(device.label) === 1;
            
            // Only render connection line if the device should be visible
            if (shouldRenderDevice) {
              return (
                <Line
                  key={`conn-line-${device.label}-${idx}`}
                  points={[deviceCenter.x, deviceCenter.y, hubCenter.x, hubCenter.y]}
                  stroke="orange"
                  strokeWidth={3}
                  opacity={0.7}
                />
              );
            }
            return null;
          })}
          {/* Draw dependency dotted line if enabled */}
          {displayDependencies && (
            <>
              {/* Bedlight Right <-> SF-01 */}
              {bedlight_rightCenter && sf01Center && getDeviceOpacity('Bedlight') === 1 && getDeviceOpacity('Button') === 1 && (
                <>
                  <Line
                    points={[bedlight_rightCenter.x, bedlight_rightCenter.y, sf01Center.x, sf01Center.y]}
                    stroke="purple"
                    strokeWidth={3}
                    dash={[8, 6]}
                    opacity={0.8}
                  />
                  <Text
                    text="Bedlight_Right_Toggle"
                    x={(bedlight_rightCenter.x + sf01Center.x) / 2}
                    y={(bedlight_rightCenter.y + sf01Center.y) / 2 - 10}
                    fontSize={14}
                    fill="#8e44ad"
                    fontStyle="bold"
                    opacity={0.92}
                  />
                </>
              )}
              
             {/* Bedlight Left <-> SF-02 */}
             {bedlight_leftCenter && sf02Center && getDeviceOpacity('Bedlight') === 1 && getDeviceOpacity('Button') === 1 && (
                <>
                  <Line
                    points={[bedlight_leftCenter.x, bedlight_leftCenter.y, sf02Center.x, sf02Center.y]}
                    stroke="purple"
                    strokeWidth={3}
                    dash={[8, 6]}
                    opacity={0.8}
                  />
                  <Text
                    text="Bedlight_Left_Toggle"
                    x={(bedlight_leftCenter.x + sf02Center.x) / 2}
                    y={(bedlight_leftCenter.y + sf02Center.y) / 2 - 10}
                    fontSize={14}
                    fill="#8e44ad"
                    fontStyle="bold"
                    opacity={0.92}
                  />
                </>
              )}
              
              {/* H1Switch_Door <-> DoorLight */}
              {h1Switch_DoorCenter && doorlightCenter && getDeviceOpacity('Wallswitch') === 1 && getDeviceOpacity('Walllight') === 1 && (
                <>
                  <Line
                    points={[h1Switch_DoorCenter.x, h1Switch_DoorCenter.y, doorlightCenter.x, doorlightCenter.y]}
                    stroke="purple"
                    strokeWidth={3}
                    dash={[8, 6]}
                    opacity={0.8}
                  />
                  <Text
                    text="DoorLightToggle"
                    x={(h1Switch_DoorCenter.x + doorlightCenter.x) / 2 - 20}
                    y={(h1Switch_DoorCenter.y + doorlightCenter.y) / 2 + 30}
                    fontSize={14}
                    fill="#8e44ad"
                    fontStyle="bold"
                    opacity={0.92}
                  />
                </>
              )}
              
              {/* H1Switch_Door <-> WindowLight */}
              {h1Switch_DoorCenter && windowlightCenter && getDeviceOpacity('Wallswitch') === 1 && getDeviceOpacity('Walllight') === 1 && (
                <>
                  {/* Create a curved path to avoid other bubbles */}
                  {(() => {
                    const startX = h1Switch_DoorCenter.x;
                    const startY = h1Switch_DoorCenter.y;
                    const endX = windowlightCenter.x;
                    const endY = windowlightCenter.y;
                    
                    // Calculate midpoint
                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2;
                    
                    // Create a curved path by placing control point to the side
                    const controlX = midX + 100; // Offset horizontally to create a visible curve
                    const controlY = midY - 80; // Offset upward to create an arc
                    
                    return (
                      <>
                        <Shape
                          sceneFunc={(ctx, shape) => {
                            ctx.beginPath();
                            ctx.moveTo(startX, startY);
                            ctx.quadraticCurveTo(controlX, controlY, endX, endY);
                            ctx.strokeShape(shape);
                          }}
                          stroke="purple"
                          strokeWidth={3}
                          dash={[8, 6]}
                          opacity={0.8}
                        />
                        <Text
                          text="WindowLightToggle"
                          x={(h1Switch_DoorCenter.x + windowlightCenter.x) / 2 - 20}
                          y={(h1Switch_DoorCenter.y + windowlightCenter.y) / 2 - 75}
                          fontSize={14}
                          fill="#8e44ad"
                          fontStyle="bold"
                          opacity={0.92}
                          rotation={35}
                        />
                      </>
                    );
                  })()}
                </>
              )}

              {/* Roller Shutter Control <-> Curtain */}
              {rolloswitchCenter && curtainCenter && getDeviceOpacity('Roller Shutter Control') === 1 && getDeviceOpacity('Curtain') === 1 && (
                <>
                  {/* Create a curved path to avoid other bubbles */}
                  {(() => {
                    const startX = rolloswitchCenter.x;
                    const startY = rolloswitchCenter.y;
                    const endX = curtainCenter.x;
                    const endY = curtainCenter.y;
                    
                    // Calculate midpoint
                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2;
                    
                    // Create a much more dramatic curve by placing control point far above and to the side
                    const controlX = midX + 80; // Offset horizontally to create a visible curve
                    const controlY = midY - 100; // Offset upward to create an arc
                    
                    //console.log('Curve points:', { startX, startY, endX, endY, controlX, controlY });
                    
                    return (
                      <>
                        <Shape
                          sceneFunc={(ctx, shape) => {
                            ctx.beginPath();
                            ctx.moveTo(startX, startY);
                            ctx.quadraticCurveTo(controlX, controlY, endX, endY);
                            ctx.strokeShape(shape);
                          }}
                          stroke="purple"
                          strokeWidth={3}
                          dash={[8, 6]}
                          opacity={0.8}
                        />
                        <Text
                          text="Roller Shutter Switch"
                          x={70}
                          y={250}
                          fontSize={14}
                          fill="#8e44ad"
                          fontStyle="bold"
                          opacity={0.92}
                        />
                      </>
                    );
                  })()}
                </>
              )}

              {/* FloorLamp <-> FloorLampButton */}
              {floorLampButtonCenter && standinglampCenter && getDeviceOpacity('FloorLampButton') === 1 && getDeviceOpacity('Floor Lamp') === 1 && (
                <>
                  <Line
                    points={[floorLampButtonCenter.x, floorLampButtonCenter.y, standinglampCenter.x, standinglampCenter.y]}
                    stroke="purple"
                    strokeWidth={3}
                    dash={[8, 6]}
                    opacity={0.8}
                  />
                  <Text
                    text="Floor Lamp Toggle"
                    x={110}
                    y={575}
                    fontSize={14}
                    fill="#8e44ad"
                    fontStyle="bold"
                    opacity={0.92}
                  />
                </>
              )}




                {/* WindowSensor <-> Curtain */}
                {windowsensorCenter && curtainCenter && getDeviceOpacity('Windowsensor') === 1 && getDeviceOpacity('Curtain') === 1 && (
                <>
                  {/* Create a curved path to avoid other bubbles */}
                  {(() => {
                    const startX = windowsensorCenter.x;
                    const startY = windowsensorCenter.y;
                    const endX = curtainCenter.x;
                    const endY = curtainCenter.y;
                    
                    // Calculate midpoint
                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2;
                    
                    // Create a curved path by placing control point to the side
                    const controlX = midX - 90; // Larger horizontal offset for more curve
                    const controlY = midY - 120; // Larger vertical offset for more curve
                    
                    return (
                      <>
                        <Shape
                          sceneFunc={(ctx, shape) => {
                            ctx.beginPath();
                            ctx.moveTo(startX, startY);
                            ctx.quadraticCurveTo(controlX, controlY, endX, endY);
                            ctx.strokeShape(shape);
                          }}
                          stroke="purple"
                          strokeWidth={3}
                          dash={[8, 6]}
                          opacity={0.8}
                        />
                        <Text
                          text="Curtain after 7 pm"
                          x={50}
                          y={320}
                          fontSize={14}
                          fill="#8e44ad"
                          fontStyle="bold"
                          opacity={0.92}
                        />
                      </>
                    );
                  })()}
                </>
              )}

                {/* DoorSensor -> Fan -> Temperaturesensor */}
                {/* DoorSensor -> Fan */}
                {doorsensorCenter && fanCenter && getDeviceOpacity('Doorsensor') === 1 && getDeviceOpacity('Fan') === 1 && (
                 <>
                   <Line
                     points={[doorsensorCenter.x, doorsensorCenter.y, fanCenter.x, fanCenter.y]}
                     stroke="purple"
                     strokeWidth={3}
                     dash={[8, 6]}
                     opacity={0.8}
                   />
                   <Text
                     text="Fan-auto-on / Fan-auto-off"
                     x={(doorsensorCenter.x + fanCenter.x) / 2}
                     y={(doorsensorCenter.y + fanCenter.y) / 2 - 20}
                     fontSize={14}
                     fill="#8e44ad"
                     fontStyle="bold"
                     opacity={0.92}
                     rotation={Math.atan2(fanCenter.y - doorsensorCenter.y, fanCenter.x - doorsensorCenter.x) * (180 / Math.PI) + 180}
                   />
                 </>
               )}
               {/* Fan -> Temperaturesensor */}
                {fanCenter && temperaturesensorCenter && getDeviceOpacity('Fan') === 1 && getDeviceOpacity('Temperaturesensor') === 1 && (
                 <>
                   <Line
                     points={[fanCenter.x, fanCenter.y, temperaturesensorCenter.x, temperaturesensorCenter.y]}
                     stroke="purple"
                     strokeWidth={3}
                     dash={[8, 6]}
                     opacity={0.8}
                   />
                 </>
               )}

                {/* DoorSensor -> DoorLight -> PresenceSensor */}
                {/* DoorSensor -> DoorLight */}
                {doorsensorCenter && doorlightCenter && getDeviceOpacity('Doorsensor') === 1 && getDeviceOpacity('Walllight') === 1 && (
                 <>
                   <Line
                     points={[doorsensorCenter.x, doorsensorCenter.y, doorlightCenter.x, doorlightCenter.y]}
                     stroke="purple"
                     strokeWidth={3}
                     dash={[8, 6]}
                     opacity={0.8}
                   />
                   <Text
                     text="Light when Entering"
                     x={(doorsensorCenter.x + doorlightCenter.x) / 2 - 180}
                     y={(doorsensorCenter.y + doorlightCenter.y) / 2 - 120}
                     fontSize={14}
                     fill="#8e44ad"
                     fontStyle="bold"
                     opacity={0.92}
                     rotation={45}
                   />
                 </>
               )}
               {/* DoorLight -> PresenceSensor */}
                {doorlightCenter && presencesensorCenter && getDeviceOpacity('Walllight') === 1 && getDeviceOpacity('Presencesensor') === 1 && (
                 <>
                   <Line
                     points={[doorlightCenter.x, doorlightCenter.y, presencesensorCenter.x, presencesensorCenter.y]}
                     stroke="purple"
                     strokeWidth={3}
                     dash={[8, 6]}
                     opacity={0.8}
                   />
                 </>
               )}

                {/* DoorSensor -> StandingLamp */}
                {doorsensorCenter && standinglampCenter && getDeviceOpacity('Doorsensor') === 1 && getDeviceOpacity('Floor Lamp') === 1 && (
                 <>
                   <Line
                     points={[doorsensorCenter.x, doorsensorCenter.y, standinglampCenter.x, standinglampCenter.y]}
                     stroke="purple"
                     strokeWidth={3}
                     dash={[8, 6]}
                     opacity={0.8}
                   />
                   <Text
                     text="Light when Entering (Night)"
                     x={(doorsensorCenter.x + standinglampCenter.x) / 2 - 145}
                     y={(doorsensorCenter.y + standinglampCenter.y) / 2 - 20}
                     fontSize={14}
                     fill="#8e44ad"
                     fontStyle="bold"
                     opacity={0.92}
                     rotation={-13}
                   />
                 </>
               )}

               {/* PresenceSensor -> Rollo */}
               {presencesensorCenter && rolloCenter && getDeviceOpacity('Presencesensor') === 1 && getDeviceOpacity('Roller Shutter') === 1 && (
                 <>
                   <Line
                     points={[presencesensorCenter.x, presencesensorCenter.y, rolloCenter.x, rolloCenter.y]}
                     stroke="purple"
                     strokeWidth={3}
                     dash={[8, 6]}
                     opacity={0.8}
                   />
                   <Text
                     text="Roller Shutter Evening Closing"
                     x={(rolloCenter.x) - 45}
                     y={(rolloCenter.y) + 25}
                     fontSize={14}
                     fill="#8e44ad"
                     fontStyle="bold"
                     opacity={0.92}
                   />
                 </>
               )}

               {/* PresenceSensor -> Rollo -> WindowSensor */}
                {/* PresenceSensor -> Rollo */}
                {presencesensorCenter && rolloCenter && getDeviceOpacity('Presencesensor') === 1 && getDeviceOpacity('Roller Shutter') === 1 && (
                 <>
                   <Line
                     points={[presencesensorCenter.x, presencesensorCenter.y, rolloCenter.x, rolloCenter.y]}
                     stroke="purple"
                     strokeWidth={3}
                     dash={[8, 6]}
                     opacity={0.8}
                   />
                 </>
               )}
               {/* Rollo -> WindowSensor */}
                {rolloCenter && windowsensorCenter && getDeviceOpacity('Roller Shutter') === 1 && getDeviceOpacity('Windowsensor') === 1 && (
                 <>
                   {/* Create a curved path to avoid other bubbles */}
                   {(() => {
                     const startX = rolloCenter.x;
                     const startY = rolloCenter.y;
                     const endX = windowsensorCenter.x;
                     const endY = windowsensorCenter.y;
                     
                     // Calculate midpoint
                     const midX = (startX + endX) / 2;
                     const midY = (startY + endY) / 2;
                     
                     // Create a curved path by placing control point to the side
                     const controlX = midX - 80; // Offset horizontally to create a visible curve
                     const controlY = midY - 60; // Offset upward to create an arc
                     
                     return (
                       <>
                         <Shape
                           sceneFunc={(ctx, shape) => {
                             ctx.beginPath();
                             ctx.moveTo(startX, startY);
                             ctx.quadraticCurveTo(controlX, controlY, endX, endY);
                             ctx.strokeShape(shape);
                           }}
                           stroke="purple"
                           strokeWidth={3}
                           dash={[8, 6]}
                           opacity={0.8}
                         />
                         <Text
                           text="Shutter when Window is open"
                           x={10}
                           y={378}
                           fontSize={14}
                           fill="#8e44ad"
                           fontStyle="bold"
                           opacity={0.92}
                         />
                       </>
                     );
                   })()}
                 </>
               )}
    



            </>
          )}
          {shapes.map((shape) => {
            // Only generate a bubble for devices in deviceLabels
            if ((shape.type === 'rect') && 'label' in shape && deviceLabels.includes(shape.label)) {
              const rectShape = shape as RectShape;
              const image = deviceImageMap[rectShape.label];
              if (image) {
                const centerX = rectShape.x + rectShape.width / 2;
                const centerY = rectShape.y + rectShape.height / 2;
                const bubbleRadius = Math.max(rectShape.width, rectShape.height) * 0.7;
                const shouldRender = getDeviceOpacity(rectShape.label) === 1;
                
                // Only render if the device should be visible based on category filter
                if (shouldRender) {
                  return (
                    <Group
                      key={rectShape.id}
                      onClick={() => {
                        console.log("Bubble clicked!", rectShape.id, rectShape.label);
                        setPopupDevice({ id: rectShape.id.toLowerCase(), label: rectShape.label });
                        setPopupOpen(true);
                      }}
                      onTap={() => {
                        console.log("Bubble tapped!");
                        setPopupDevice({ id: rectShape.id.toLowerCase(), label: rectShape.label });
                        setPopupOpen(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <Circle
                        x={centerX}
                        y={centerY}
                        radius={bubbleRadius}
                        fill={deviceStates[rectShape.id.toLowerCase()] ? "#ffe066" : "#fff"}
                        stroke="#bbb"
                        strokeWidth={3}
                        shadowBlur={8}
                      />
                      <KonvaImage
                        x={rectShape.x}
                        y={rectShape.y}
                        width={rectShape.width}
                        height={rectShape.height}
                        image={image}
                      />
                    </Group>
                  );
                }
                // Return null if device should not be rendered
                return null;
              }
            }

            // Replace shape with label 'Bed' with bed.png image
            if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Bed') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                bedImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={bedImage}
                  />
                )
              );
            }
            // Replace shape with label 'Chair' with chair.png image
            if (shape.type === 'circle' && 'label' in shape && shape.label === 'Chair') {
              const circleShape = shape as CircleShape;
              return (
                chairImage && (
                  <KonvaImage
                    key={circleShape.id}
                    x={circleShape.x - circleShape.radius}
                    y={circleShape.y - circleShape.radius}
                    width={circleShape.radius * 2}
                    height={circleShape.radius * 2}
                    image={chairImage}
                  />
                )
              );
            }
            // Replace shape with label 'Presencesensor' with presencesensor.png image
            if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Presencesensor') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                presenceSensorImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={presenceSensorImage}
                  />
                )
              );
            }
            // Replace shape with label 'Walllight' with walllamp.png image
            if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Walllight') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                wallLampImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={wallLampImage}
                  />
                )
              );
            }
            // Replace shape with label 'Deskchair' with deskchair.png image
            if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Officechair') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                deskchairImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={deskchairImage}
                  />
                )
              );
            }

            // Replace shape with label 'Table' with table.png image
            if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Table') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                tableImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={tableImage}
                  />
                )
              );
            }

            // Replace shape with label 'TV' with tv.png image and a bubble
            if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'TV') {
              const rectShape = shape as RectShape | DoorShape;
              const centerX = rectShape.x + rectShape.width / 2;
              const centerY = rectShape.y + rectShape.height / 2;
              const bubbleRadius = Math.max(rectShape.width, rectShape.height) * 0.7;
              const shouldRender = getDeviceOpacity(rectShape.label) === 1;
              
              // Only render if the device should be visible based on category filter
              if (shouldRender && tvImage) {
                return (
                  <Group key={rectShape.id}>
                    <Circle
                      x={centerX}
                      y={centerY}
                      radius={bubbleRadius}
                      fill="#fff"
                      stroke="#bbb"
                      strokeWidth={3}
                      shadowBlur={8}
                    />
                    <KonvaImage
                      x={rectShape.x}
                      y={rectShape.y}
                      width={rectShape.width}
                      height={rectShape.height}
                      image={tvImage}
                    />
                  </Group>
                );
              }
              // Return null if device should not be rendered
              return null;
            }





            // Replace shape with label 'IPad' with tablet.png image
            if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'IPad') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                tabletImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={tabletImage}
                  />
                )
              );
            }

            // Show the Hub only when display connections is active
            if ((shape.type === 'rect') && 'label' in shape && shape.label === 'Hub') {
              const rectShape = shape as RectShape;
              return (
                displayConnections && hubImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={hubImage}
                  />
                )
              );
            }

            // Replace shape with label 'Desk' with desk.png image
            if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Desk') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                deskImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={deskImage}
                  />
                )
              );
            }

            // Replace shape with label 'Fan' with fan.png image
            if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Fan') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                fanImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={fanImage}
                  />
                )
              );
            }

            // Replace shape with label 'Roller Shutter' with roller_shade.svg image
            if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Roller Shutter') {
              const rectShape = shape as RectShape | DoorShape;
              
              // Special handling for rollo device - give it bubble treatment
              if (rectShape.id === 'rollo') {
                const centerX = rectShape.x + rectShape.width / 2;
                const centerY = rectShape.y + rectShape.height / 2;
                const bubbleRadius = Math.max(rectShape.width, rectShape.height) * 0.7;
                const shouldRender = getDeviceOpacity(rectShape.label) === 1;
                
                // Only render if the device should be visible based on category filter
                if (shouldRender && rollershutterImage) {
                  return (
                    <Group
                      key={rectShape.id}
                      onClick={() => {
                        console.log("Rollo bubble clicked!", rectShape.id, rectShape.label);
                        setPopupDevice({ id: rectShape.id.toLowerCase(), label: rectShape.label });
                        setPopupOpen(true);
                      }}
                      onTap={() => {
                        console.log("Rollo bubble tapped!", rectShape.id, rectShape.label);
                        setPopupDevice({ id: rectShape.id.toLowerCase(), label: rectShape.label });
                        setPopupOpen(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <Circle
                        x={centerX}
                        y={centerY}
                        radius={bubbleRadius}
                        fill="#fff"
                        stroke="#bbb"
                        strokeWidth={3}
                        shadowBlur={8}
                      />
                      <KonvaImage
                        x={rectShape.x}
                        y={rectShape.y}
                        width={rectShape.width}
                        height={rectShape.height}
                        image={rollershutterImage}
                      />
                    </Group>
                  );
                }
                // Return null if device should not be rendered
                return null;
              }
            }

             // Replace shape with label 'Curtain' with curtain.svg image
             if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Curtain') {
              const rectShape = shape as RectShape | DoorShape;
            return (
              curtainImage && (
                <KonvaImage
                  key={rectShape.id}
                  x={rectShape.x}
                  y={rectShape.y}
                  width={rectShape.width}
                  height={rectShape.height}
                  image={curtainImage}
                />
              )
            );
          }

            // Replace shape with label 'Temperaturesensor' with tempertureSensor.png image
            if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Temperaturesensor') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                tempertureSensorImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={tempertureSensorImage}
                  />
                )
              );
            }

            // Replace shape with label 'Heater' with heater.png image
            if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Heater') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                heaterImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={heaterImage}
                  />
                )
              );
            }

             // Replace shape with label 'Roller Shutter Control' with rolloswitch.png image
             if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Roller Shutter Control') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                buttonImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={buttonImage}
                  />
                )
              );
            }

             // Replace shape with label 'Windowsensor' with windowsensor.png image
             if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Windowsensor') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                windowsensorImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={windowsensorImage}
                  />
                )
              );
            }

            // Replace shape with label 'Doorsensor' with doorsensor.png image
            if ((shape.type === 'rect' || shape.type === 'door') && 'label' in shape && shape.label === 'Doorsensor') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                doorsensorImage && (
                  <KonvaImage
                    key={rectShape.id}
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    image={doorsensorImage}
                  />
                )
              );
            }

             // Replace shape with label 'Door' with door.png image
             if ((shape.type === 'door') && 'label' in shape && shape.label === 'Door') {
              const doorShape = shape as DoorShape;
              return (
                doorImage && (
                  <KonvaImage
                    key={doorShape.id}
                    x={doorShape.x}
                    y={doorShape.y}
                    width={doorShape.width}
                    height={doorShape.height}
                    image={doorImage}
                  />
                )
              );
            }

             // Replace shape with label 'Window' with window.png image
             if ((shape.type === 'door') && 'label' in shape && shape.label === 'Window') {
              const doorShape = shape as DoorShape;
              return (
                windowImage && (
                  <KonvaImage
                    key={doorShape.id}
                    x={doorShape.x}
                    y={doorShape.y}
                    width={doorShape.width}
                    height={doorShape.height}
                    image={windowImage}
                  />
                )
              );
            }





            //
            // Generic rendering for rect/door
            if (shape.type === 'rect' || shape.type === 'door') {
              const rectShape = shape as RectShape | DoorShape;
              return (
                <React.Fragment key={rectShape.id}>
                  <Rect
                    x={rectShape.x}
                    y={rectShape.y}
                    width={rectShape.width}
                    height={rectShape.height}
                    fill={rectShape.fill}
                  />
                  {'label' in rectShape && rectShape.label && (
                    <Text
                      x={rectShape.x}
                      y={rectShape.y + rectShape.height / 2 - 10}
                      width={rectShape.width}
                      align="center"
                      text={rectShape.label}
                      fontSize={16}
                      fill="#222"
                    />
                  )}
                </React.Fragment>
              );
            }
            // Generic rendering for circle
            if (shape.type === 'circle') {
              const circleShape = shape as CircleShape;
              return (
                <React.Fragment key={circleShape.id}>
                  <Circle
                    x={circleShape.x}
                    y={circleShape.y}
                    radius={circleShape.radius}
                    fill={circleShape.fill}
                  />
                  {'label' in circleShape && circleShape.label && (
                    <Text
                      x={circleShape.x - circleShape.radius}
                      y={circleShape.y - 10}
                      width={circleShape.radius * 2}
                      align="center"
                      text={circleShape.label}
                      fontSize={16}
                      fill="#222"
                    />
                  )}
                </React.Fragment>
              );
            }
            // Generic rendering for wall
            if (shape.type === 'wall') {
              const wallShape = shape as WallShape;
              return (
                <Line
                  key={wallShape.id}
                  points={wallShape.points}
                  stroke={wallShape.stroke}
                  strokeWidth={5}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
      {/* Popup for device details and control */}
      {popupOpen && popupDevice && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          border: '2px solid #333',
          borderRadius: 8,
          padding: 24,
          zIndex: 1001,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          minWidth: 320,
          maxWidth: 400,
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#333', borderBottom: '2px solid #eee', paddingBottom: 8 }}>
            {popupDevice.id === 'curtain' ? 'Curtain Details' : 
             popupDevice.id === 'rollo' ? 'Roller Shutter Details' : 
             popupDevice.label === 'Smart Plug' ? 'Smart Socket Details' : 
             popupDevice.label + ' Details'}
          </h3>
          {/* <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: 16 }}>
            <strong>Latest Activity:</strong>
            <div style={{ marginTop: 4, color: '#555' }}>
              {popupLogbook && popupLogbook.length > 0
                ? getLatestLogRelative(popupEntityId || '')
                : 'No recent activity.'}
            </div>
          </div> */}
          
          {/* Show sensor state for sensors */}
          {(popupDevice.label === 'Windowsensor' || 
            popupDevice.label === 'Doorsensor' || 
            popupDevice.label === 'Presencesensor' || 
            popupDevice.label === 'Temperaturesensor') && (
            <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: 16 }}>
              <strong>Current State:</strong>
              <div style={{ marginTop: 4, color: '#555' }}>
                {popupDevice.label === 'Windowsensor' && (
                  <span style={{ color: sensorStates[popupDevice.label] === 'on' ? '#e74c3c' : '#27ae60' }}>
                    {sensorStates[popupDevice.label] === 'on' ? 'Window Open' : 'Window Closed'}
                  </span>
                )}
                {popupDevice.label === 'Doorsensor' && (
                  <span style={{ color: sensorStates[popupDevice.label] === 'on' ? '#e74c3c' : '#27ae60' }}>
                    {sensorStates[popupDevice.label] === 'on' ? 'Door Open' : 'Door Closed'}
                  </span>
                )}
                {popupDevice.label === 'Presencesensor' && (
                  <span style={{ color: sensorStates[popupDevice.label] === 'on' ? '#27ae60' : '#95a5a6' }}>
                    {sensorStates[popupDevice.label] === 'on' ? 'Presence Detected' : 'No Presence'}
                  </span>
                )}
                {popupDevice.label === 'Temperaturesensor' && (
                  <span style={{ color: '#3498db' }}>
                    {sensorStates[popupDevice.label] ? `${sensorStates[popupDevice.label]}°C` : 'Loading...'}
                  </span>
                )}
              </div>
            </div>
          )}
          {/* Only show turn on/off button for lighting devices, fan, and TV */}
          {(deviceCategoryMap[popupDevice.label] === 'lighting' || 
            popupDevice.label === 'Fan' || 
            popupDevice.label === 'TV' ||
            popupDevice.label === 'Smart Plug') &&
            popupDevice.label !== 'Button' && 
            popupDevice.label !== 'Wallswitch' && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button
                onClick={async () => {
                  if (popupEntityId) {
                    const newState = !deviceStates[popupDevice.id];
                    setDeviceStates((prev) => ({ ...prev, [popupDevice.id]: newState }));
                    try {
                      await callHomeAssistantService(popupEntityId, newState);
                      
                      // Refresh the TV state after a delay to get the updated state from Home Assistant
                      if (popupDevice.id === 'tv') {
                        setTimeout(async () => {
                          await fetchTVState();
                        }, 1000);
                      }
                    } catch (err) {
                      alert('Failed to toggle: ' + err);
                      // Refresh state on error to show actual state
                      if (popupDevice.id === 'tv') {
                        await fetchTVState();
                      }
                    }
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: deviceStates[popupDevice.id] ? '#f44336' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {deviceStates[popupDevice.id] ? 'Turn Off' : 'Turn On'}
              </button>
            </div>
          )}
          
          {/* Show slider for curtains */}
          {popupDevice.id === 'curtain' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontSize: '14px', fontWeight: 'bold' }}>
                Curtains Open: {blindsPosition}% 
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={blindsPosition}
                onChange={(e) => handleCurtainPositionChange(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: '#ddd',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          )}

          {/* Show slider for rollo */}
          {popupDevice.id === 'rollo' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontSize: '14px', fontWeight: 'bold' }}>
                Rollo Open: {rolloPosition}% 
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={rolloPosition}
                onChange={(e) => handleRolloPositionChange(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: '#ddd',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          )}

          {/* Show temperature control for heater */}
          {popupDevice.label === 'Heater' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontSize: '14px', fontWeight: 'bold' }}>
                Current setting: {heaterTemp}°C
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => handleHeaterTempChange(heaterTemp - 1)}
                  style={{
                    padding: '8px 12px',
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  -
                </button>
                <span style={{ fontSize: '16px', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>
                  {heaterTemp}°C
                </span>
                <button
                  onClick={() => handleHeaterTempChange(heaterTemp + 1)}
                  style={{
                    padding: '8px 12px',
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => setPopupOpen(false)}
            style={{ padding: '8px 16px', background: '#666', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export const FloorMap = React.memo(FloorMapComponent);
