import React, { useState, useEffect } from 'react';
import DeviceCard from '../DeviceCard';
import WindowIcon from '@mui/icons-material/Window';
import { TOKEN } from '../../config';

interface WindowSensorCardProps {
  label?: string;
}

const WindowSensorCard: React.FC<WindowSensorCardProps> = ({ label = "Window Sensor" }) => {
  const [windowState, setWindowState] = useState<string>('Loading...');

  const fetchWindowState = async () => {
    try {
      const response = await fetch('/api/states/binary_sensor.sensor_window_contact', {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWindowState(data.state);
      } else {
        setWindowState('Error');
      }
    } catch (error) {
      console.error('Error fetching window sensor state:', error);
      setWindowState('Error');
    }
  };

  useEffect(() => {
    fetchWindowState();
    // Refresh every 5 seconds
    const interval = setInterval(fetchWindowState, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusDisplay = () => {
    if (windowState === 'on') {
      return { text: 'Window Open', color: '#e74c3c' };
    } else if (windowState === 'off') {
      return { text: 'Window Closed', color: '#27ae60' };
    } else {
      return { text: windowState, color: '#95a5a6' };
    }
  };

  const status = getStatusDisplay();

  return (
    <DeviceCard
      name={label}
      status={status.text}
      icon={<WindowIcon />}
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

export default WindowSensorCard; 