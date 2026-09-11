import { useState, useEffect } from 'react';
import SensorCard from './SensorCard';
import { HA_HEADERS } from '../../config';

interface Props { label?: string; }

export default function TempHumidCard({ label = 'Temp / Humidity' }: Props) {
  const [temp, setTemp] = useState<string | null>(null);
  const [humid, setHumid] = useState<string | null>(null);
  const [ago, setAgo] = useState<string>('');

  const fetch_ = async () => {
    try {
      const [tRes, hRes] = await Promise.all([
        fetch('/api/states/sensor.temp_humid_temperature', { headers: HA_HEADERS }),
        fetch('/api/states/sensor.temp_humid_humidity', { headers: HA_HEADERS }),
      ]);
      if (tRes.ok) {
        const d = await tRes.json();
        setTemp(d.state);
        const changed = d.last_changed ? new Date(d.last_changed) : null;
        if (changed) {
          const sec = Math.round((Date.now() - changed.getTime()) / 1000);
          setAgo(sec < 60 ? `${sec}s ago` : sec < 3600 ? `${Math.round(sec / 60)}m ago` : `${Math.round(sec / 3600)}h ago`);
        }
      }
      if (hRes.ok) {
        const d = await hRes.json();
        setHumid(d.state);
      }
    } catch { /* silent */ }
  };

  useEffect(() => { fetch_(); const id = setInterval(fetch_, 5000); return () => clearInterval(id); }, []);

  const icon = (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.8V6a2 2 0 1 0-4 0v8.8a4 4 0 1 0 4 0Z" />
    </svg>
  );

  const statusText =
    temp && humid ? `${temp}°C · ${humid}%` :
    temp ? `${temp}°C` :
    '…';

  return (
    <SensorCard
      label={label}
      sublabel={ago}
      status={temp ? 'active' : 'loading'}
      statusText={statusText}
      icon={icon}
    />
  );
}
