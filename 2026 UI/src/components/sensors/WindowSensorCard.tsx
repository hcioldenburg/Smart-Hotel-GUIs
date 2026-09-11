import { useState, useEffect } from 'react';
import SensorCard from './SensorCard';
import { HA_HEADERS } from '../../config';

interface Props { label?: string; }

export default function WindowSensorCard({ label = 'Window Sensor' }: Props) {
  const [state, setState] = useState<string>('loading');
  const [ago, setAgo] = useState<string>('');

  const fetch_ = async () => {
    try {
      const res = await fetch('/api/states/binary_sensor.sensor_window_contact', { headers: HA_HEADERS });
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
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );

  return (
    <SensorCard
      label={label}
      sublabel={ago}
      status={state === 'off' ? 'active' : state === 'loading' ? 'loading' : 'inactive'}
      statusText={state === 'on' ? 'Open' : state === 'loading' ? '…' : 'Closed'}
      icon={icon}
    />
  );
}
