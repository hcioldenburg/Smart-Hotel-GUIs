import React, { useState, useEffect } from 'react';
import DeviceCard from '../DeviceCard';
import AirIcon from '@mui/icons-material/Air';
import { TOKEN } from '../../config';

interface SmartFanCardProps {
  label?: string;
}

const SmartFanCard: React.FC<SmartFanCardProps> = ({ label = "Smart Fan" }) => {
  const [fanState, setFanState] = useState<'on' | 'off'>('off');

  const fetchFanState = async () => {
    try {
      const response = await fetch('/api/states/fan.smartfan', {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFanState(data.state as 'on' | 'off');
      }
    } catch (error) {
      console.error('Error fetching fan state:', error);
    }
  };

  useEffect(() => {
    fetchFanState();
    // Refresh every 30 seconds
    const interval = setInterval(fetchFanState, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFanToggle = async () => {
    const newState = fanState === 'on' ? 'off' : 'on';
    setFanState(newState);
    
    try {
      const response = await fetch(`/api/services/fan/turn_${newState}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: 'fan.smartfan',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to toggle fan: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error toggling fan:', error);
      // Revert state if API call fails
      setFanState(fanState);
    }
  };

  const icon = fanState === 'on' ? (
    <AirIcon style={{ color: '#10b981' }} />
  ) : (
    <AirIcon style={{ color: '#9ca3af' }} />
  );

  return (
    <DeviceCard
      name={label}
      status={fanState === 'on' ? 'On' : 'Off'}
      icon={icon}
    >
      <button
        onClick={handleFanToggle}
        className={`px-4 py-2 rounded font-semibold transition text-white w-full ${
          fanState === 'on'
            ? 'bg-red-600 hover:bg-red-500'
            : 'bg-green-600 hover:bg-green-500'
        }`}
      >
        Turn {fanState === 'on' ? 'Off' : 'On'}
      </button>
    </DeviceCard>
  );
};

export default SmartFanCard; 