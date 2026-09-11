import React, { useState, useEffect } from 'react';
import DeviceCard from '../DeviceCard';
import TvIcon from '@mui/icons-material/Tv';
import { TOKEN } from '../../config';

interface TVCardProps {
  label?: string;
}

const TVCard: React.FC<TVCardProps> = ({ label = "TV" }) => {
  const [tvState, setTvState] = useState<'on' | 'off' | 'loading'>('loading');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch TV status from binary_sensor.tv_status
  const fetchTVState = async () => {
    try {
      const response = await fetch('/api/states/binary_sensor.tv_status', {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTvState(data.state === 'on' ? 'on' : 'off');
      } else {
        console.error('Failed to fetch TV state');
        setTvState('off');
      }
    } catch (error) {
      console.error('Error fetching TV state:', error);
      setTvState('off');
    }
  };

  // Fetch TV state on component mount and set up periodic refresh
  useEffect(() => {
    fetchTVState();
    
    // Set up periodic refresh every 5 seconds
    const interval = setInterval(fetchTVState, 5000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleTVToggle = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const newState = tvState === 'on' ? 'off' : 'on';
      
      // Call the script service
      const response = await fetch('/api/services/script/turn_on', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: 'script.new_script',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${newState} TV: ${response.statusText}`);
      }
      
      console.log(`TV ${newState} successfully`);
      
      // Wait a moment for Home Assistant to update the state, then refresh
      setTimeout(async () => {
        await fetchTVState();
      }, 1000);
      
    } catch (error) {
      console.error('Error toggling TV:', error);
      // Refresh the actual state from Home Assistant
      await fetchTVState();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DeviceCard
      name={label}
      status={tvState === 'loading' ? 'Loading...' : tvState === 'on' ? 'On' : 'Off'}
      icon={<TvIcon />}
    >
      <button
        onClick={handleTVToggle}
        disabled={isLoading || tvState === 'loading'}
        className={`px-4 py-2 rounded font-semibold transition text-white w-full ${
          tvState === 'on' 
            ? 'bg-red-600 hover:bg-red-500 disabled:bg-red-400' 
            : 'bg-green-600 hover:bg-green-500 disabled:bg-green-400'
        } ${isLoading || tvState === 'loading' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        {isLoading ? 'Loading...' : tvState === 'on' ? 'Turn Off' : 'Turn On'}
      </button>
    </DeviceCard>
  );
};

export default TVCard; 