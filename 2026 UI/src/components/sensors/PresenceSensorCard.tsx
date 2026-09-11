import { useState, useEffect } from 'react';
import SensorCard from './SensorCard';
import { HA_HEADERS } from '../../config';

interface Props { label?: string; }

export default function PresenceSensorCard({ label = 'Presence Sensor' }: Props) {
  const [state, setState] = useState<string>('loading');
  const [ago, setAgo] = useState<string>('');

  const fetch_ = async () => {
    try {
      const res = await fetch('/api/states/binary_sensor.presencesensor_presence', { headers: HA_HEADERS });
      if (!res.ok) return;
      const d = await res.json();
      setState(d.state);
      const changed = d.last_changed ? new Date(d.last_changed) : null;
      if (changed) {
        const sec = Math.round((Date.now() - changed.getTime()) / 1000);
        setAgo(sec < 60 ? `${sec}s ago` : sec < 3600 ? `${Math.round(sec / 60)}m ago` : `${Math.round(sec / 3600)}h ago`);
      }
    } catch { /* silent */ }
  };

  useEffect(() => { fetch_(); const id = setInterval(fetch_, 5000); return () => clearInterval(id); }, []);

  const icon = (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );

  return (
    <SensorCard
      label={label}
      sublabel={ago}
      status={state === 'on' ? 'active' : state === 'loading' ? 'loading' : 'inactive'}
      statusText={state === 'on' ? 'Presence' : state === 'loading' ? '…' : 'No Presence'}
      icon={icon}
    />
  );
}
