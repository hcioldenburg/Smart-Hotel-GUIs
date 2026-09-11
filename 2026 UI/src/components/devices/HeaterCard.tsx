import { useState, useEffect } from 'react';
import CircularArcDial from '../primitives/CircularArcDial';
import { HA_HEADERS } from '../../config';

interface Props { label?: string; }

const MIN_TEMP = 15;
const MAX_TEMP = 30;

export default function HeaterCard({ label = 'Heater' }: Props) {
  const [temp, setTemp] = useState(21.5);
  const [roomTemp, setRoomTemp] = useState<number | null>(null);
  const [mode, setMode] = useState<'heat' | 'off'>('off');

  const fetch_ = async () => {
    try {
      const res = await fetch('/api/states/climate.heater', { headers: HA_HEADERS });
      if (!res.ok) return;
      const d = await res.json();
      if (d.state !== 'unavailable') {
        setMode(d.state === 'heat' ? 'heat' : 'off');
        const t = d.attributes?.temperature;
        if (typeof t === 'number') setTemp(t);
        const cur = d.attributes?.current_temperature;
        if (typeof cur === 'number') setRoomTemp(cur);
      }
    } catch { /* silent */ }
  };

  useEffect(() => { fetch_(); const id = setInterval(fetch_, 5000); return () => clearInterval(id); }, []);

  const changeTemp = async (delta: number) => {
    const next = Math.min(MAX_TEMP, Math.max(MIN_TEMP, temp + delta));
    setTemp(next);
    try {
      await fetch('/api/services/climate/set_temperature', {
        method: 'POST', headers: HA_HEADERS,
        body: JSON.stringify({ entity_id: 'climate.heater', temperature: next }),
      });
    } catch { /* silent */ }
  };

  const dialValue = ((temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * 100;
  const isOn = mode === 'heat';

  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-2xl select-none"
      style={{ background: '#FFFFFF', border: '1px solid #F0EBE1', minWidth: 120 }}
    >
      <div className="relative">
        <CircularArcDial value={dialValue} on={isOn} size={96} strokeWidth={7} />
        {/* Temp readout overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, color: '#25242A', lineHeight: 1 }}>
            {temp.toFixed(1)}°
          </span>
          {roomTemp !== null && (
            <span style={{ fontSize: 9, color: '#9A9082', marginTop: 2 }}>Room {roomTemp}°</span>
          )}
        </div>
      </div>

      {/* ± buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => changeTemp(-0.5)}
          className="flex items-center justify-center rounded-full"
          style={{ width: 28, height: 28, background: '#F0EBE1', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6F6A60', fontWeight: 500 }}
        >−</button>
        <div className="text-center" style={{ minWidth: 48 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#25242A' }}>{label}</div>
          <div style={{ fontSize: 10, color: '#9A9082' }}>{isOn ? 'Heating' : 'Off'}</div>
        </div>
        <button
          onClick={() => changeTemp(0.5)}
          className="flex items-center justify-center rounded-full"
          style={{ width: 28, height: 28, background: '#F0EBE1', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6F6A60', fontWeight: 500 }}
        >+</button>
      </div>
    </div>
  );
}
