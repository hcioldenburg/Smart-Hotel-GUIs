import React, { useState, useEffect } from 'react';
import DeviceCard from '../DeviceCard';
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined';
import { TOKEN } from '../../config';

interface SensorData {
  windowSensor: string;
  doorSensor: string;
  presenceSensor: string;
  temperatureSensor: string;
}

interface SensorsCardProps {
  label?: string;
}

const SensorsCard: React.FC<SensorsCardProps> = ({ label = "Sensors" }) => {
  const [sensorData, setSensorData] = useState<SensorData>({
    windowSensor: 'Loading...',
    doorSensor: 'Loading...',
    presenceSensor: 'Loading...',
    temperatureSensor: 'Loading...'
  });

  const fetchSensorStates = async () => {
    const sensorEntityIds = {
      windowSensor: 'binary_sensor.sensor_window_contact',
      doorSensor: 'binary_sensor.sensor_door_contact',
      presenceSensor: 'binary_sensor.presencesensor_presence',
      temperatureSensor: 'sensor.temp_humid_temperature'
    };

    try {
      const promises = Object.entries(sensorEntityIds).map(async ([key, entityId]) => {
        const response = await fetch(`/api/states/${entityId}`, {
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          return [key, data.state];
        }
        return [key, 'Error'];
      });

      const results = await Promise.all(promises);
      const newSensorData = Object.fromEntries(results) as SensorData;
      setSensorData(newSensorData);
    } catch (error) {
      console.error('Error fetching sensor states:', error);
    }
  };

  useEffect(() => {
    fetchSensorStates();
    // Refresh sensor data every 30 seconds
    const interval = setInterval(fetchSensorStates, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSensorDisplay = (sensorType: keyof SensorData) => {
    const value = sensorData[sensorType];
    
    switch (sensorType) {
      case 'windowSensor':
        return {
          text: value === 'on' ? 'Window Open' : value === 'off' ? 'Window Closed' : value,
          color: value === 'on' ? '#e74c3c' : value === 'off' ? '#27ae60' : '#95a5a6'
        };
      case 'doorSensor':
        return {
          text: value === 'on' ? 'Door Open' : value === 'off' ? 'Door Closed' : value,
          color: value === 'on' ? '#e74c3c' : value === 'off' ? '#27ae60' : '#95a5a6'
        };
      case 'presenceSensor':
        return {
          text: value === 'on' ? 'Presence Detected' : value === 'off' ? 'No Presence' : value,
          color: value === 'on' ? '#27ae60' : value === 'off' ? '#95a5a6' : '#95a5a6'
        };
      case 'temperatureSensor':
        return {
          text: value !== 'Loading...' && value !== 'Error' ? `${value}°C` : value,
          color: '#3498db'
        };
      default:
        return { text: value, color: '#95a5a6' };
    }
  };

  return (
    <DeviceCard
      name={label}
      status="Sensor Status"
      icon={<SensorsOutlinedIcon />}
    >
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span>Window:</span>
          <span style={{ color: getSensorDisplay('windowSensor').color }}>
            {getSensorDisplay('windowSensor').text}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Door:</span>
          <span style={{ color: getSensorDisplay('doorSensor').color }}>
            {getSensorDisplay('doorSensor').text}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Presence:</span>
          <span style={{ color: getSensorDisplay('presenceSensor').color }}>
            {getSensorDisplay('presenceSensor').text}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Temperature:</span>
          <span style={{ color: getSensorDisplay('temperatureSensor').color }}>
            {getSensorDisplay('temperatureSensor').text}
          </span>
        </div>
      </div>
    </DeviceCard>
  );
};

export default SensorsCard; 