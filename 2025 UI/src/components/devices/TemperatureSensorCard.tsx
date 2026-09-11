import React, { useState, useEffect } from 'react';
import DeviceCard from '../DeviceCard';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import { TOKEN } from '../../config';

interface TemperatureSensorCardProps {
  label?: string;
}

const TemperatureSensorCard: React.FC<TemperatureSensorCardProps> = ({ label = "Temperature Sensor" }) => {
  const [temperature, setTemperature] = useState<string>('Loading...');

  const fetchTemperature = async () => {
    try {
      const response = await fetch('/api/states/sensor.temp_humid_temperature', {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTemperature(data.state);
      } else {
        setTemperature('Error');
      }
    } catch (error) {
      console.error('Error fetching temperature sensor state:', error);
      setTemperature('Error');
    }
  };

  useEffect(() => {
    fetchTemperature();
    // Refresh every 5 seconds
    const interval = setInterval(fetchTemperature, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusDisplay = () => {
    if (temperature !== 'Loading...' && temperature !== 'Error') {
      return { text: `${temperature}°C`, color: '#3498db' };
    } else {
      return { text: temperature, color: '#95a5a6' };
    }
  };

  const status = getStatusDisplay();

  return (
    <DeviceCard
      name={label}
      status={status.text}
      icon={<ThermostatIcon />}
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

export default TemperatureSensorCard; 