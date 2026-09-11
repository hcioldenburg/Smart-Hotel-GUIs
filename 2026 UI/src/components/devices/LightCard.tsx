import { useState, useEffect } from 'react';
import CircularArcDial from '../primitives/CircularArcDial';
import Toggle from '../primitives/Toggle';
import { HA_HEADERS } from '../../config';

interface Props {
  entityId: string;
  label: string;
}

export default function LightCard({ entityId, label }: Props) {
  const [on, setOn] = useState(false);
  const [brightness, setBrightness] = useState(0);

  const fetch_ = async () => {
    try {
      const res = await fetch(`/api/states/light.${entityId}`, { headers: HA_HEADERS });
      if (!res.ok) return;
      const d = await res.json();
      if (d.state === 'unavailable') return;
      setOn(d.state === 'on');
      const b = d.attributes?.brightness;
      setBrightness(typeof b === 'number' ? Math.round((b / 255) * 100) : d.state === 'on' ? 100 : 0);
    } catch { /* silent */ }
  };

  useEffect(() => { fetch_(); const id = setInterval(fetch_, 4000); return () => clearInterval(id); }, [entityId]);

  const toggle = async () => {
    const next = !on;
    setOn(next);
    try {
      await fetch(`/api/services/light/turn_${next ? 'on' : 'off'}`, {
        method: 'POST', headers: HA_HEADERS,
        body: JSON.stringify({ entity_id: `light.${entityId}` }),
      });
    } catch { setOn(!next); }
  };

  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-2xl cursor-pointer select-none"
      style={{ background: '#FFFFFF', border: '1px solid #F0EBE1', minWidth: 120 }}
      onClick={toggle}
    >
      <CircularArcDial value={on ? (brightness || 80) : 0} on={on} size={96} strokeWidth={7}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={on ? '#E0992F' : '#B8B0A4'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18h6M10 21h4M8.5 14a5 5 0 1 1 7 0c-.7.8-1.2 1.6-1.4 2.5H9.9C9.7 15.6 9.2 14.8 8.5 14Z" />
        </svg>
      </CircularArcDial>
      <div className="text-center">
        <div style={{ fontSize: 13, fontWeight: 600, color: '#25242A', lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 11, color: '#9A9082', marginTop: 2 }}>{on ? 'On' : 'Off'}</div>
      </div>
      <Toggle checked={on} onChange={toggle} />
    </div>
  );
}
