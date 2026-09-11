import React, { useState, useEffect } from 'react';
import DeviceCard from '../DeviceCard';
import PersonIcon from '@mui/icons-material/Person';
import { TOKEN } from '../../config';

interface PresenceSensorCardProps {
  label?: string;
}

const PresenceSensorCard: React.FC<PresenceSensorCardProps> = ({ label = "Presence Sensor" }) => {
  const [presenceState, setPresenceState] = useState<string>('Loading...');

  const fetchPresenceState = async () => {
    try {
      const response = await fetch('/api/states/binary_sensor.presencesensor_presence', {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPresenceState(data.state);
      } else {
        setPresenceState('Error');
      }
    } catch (error) {
      console.error('Error fetching presence sensor state:', error);
      setPresenceState('Error');
    }
  };

  useEffect(() => {
    fetchPresenceState();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPresenceState, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusDisplay = () => {
    if (presenceState === 'on') {
      return { text: 'Presence Detected', color: '#27ae60' };
    } else if (presenceState === 'off') {
      return { text: 'No Presence', color: '#95a5a6' };
    } else {
      return { text: presenceState, color: '#95a5a6' };
    }
  };

  const status = getStatusDisplay();

  return (
    <DeviceCard
      name={label}
      status={status.text}
      icon={<PersonIcon />}
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

export default PresenceSensorCard; 