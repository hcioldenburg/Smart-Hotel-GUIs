import React, { useState, useEffect } from 'react';
import DeviceCard from '../DeviceCard';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import { TOKEN } from '../../config';

interface DoorSensorCardProps {
  label?: string;
}

const DoorSensorCard: React.FC<DoorSensorCardProps> = ({ label = "Door Sensor" }) => {
  const [doorState, setDoorState] = useState<string>('Loading...');

  const fetchDoorState = async () => {
    try {
      const response = await fetch('/api/states/binary_sensor.sensor_door_contact', {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDoorState(data.state);
      } else {
        setDoorState('Error');
      }
    } catch (error) {
      console.error('Error fetching door sensor state:', error);
      setDoorState('Error');
    }
  };

  useEffect(() => {
    fetchDoorState();
    // Refresh every 5 seconds
    const interval = setInterval(fetchDoorState, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusDisplay = () => {
    if (doorState === 'on') {
      return { text: 'Door Open', color: '#e74c3c' };
    } else if (doorState === 'off') {
      return { text: 'Door Closed', color: '#27ae60' };
    } else {
      return { text: doorState, color: '#95a5a6' };
    }
  };

  const status = getStatusDisplay();

  return (
    <DeviceCard
      name={label}
      status={status.text}
      icon={<DoorFrontIcon />}
    >
      <div className="text-center">
        <div 
          className="w-4 h-4 rounded-full mx-auto"
          style={{ backgroundColor: status.color }}
        />
      </div>
    </DeviceCard>
  );
};

export default DoorSensorCard; 