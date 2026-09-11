import { useState, useEffect } from 'react';
import Toggle from '../primitives/Toggle';
import { HA_HEADERS } from '../../config';

interface Props {
  entityId: string;
  label: string;
}

export default function SocketCard({ entityId, label }: Props) {
  const [on, setOn] = useState(false);

  const fetch_ = async () => {
    try {
      const res = await fetch(`/api/states/switch.${entityId}`, { headers: HA_HEADERS });
      if (!res.ok) return;
      const d = await res.json();
      setOn(d.state === 'on');
    } catch { /* silent */ }
  };

  useEffect(() => { fetch_(); const id = setInterval(fetch_, 4000); return () => clearInterval(id); }, [entityId]);

  const toggle = async () => {
    const next = !on;
    setOn(next);
    try {
      await fetch(`/api/services/switch/turn_${next ? 'on' : 'off'}`, {
        method: 'POST', headers: HA_HEADERS,
        body: JSON.stringify({ entity_id: `switch.${entityId}` }),
      });
    } catch { setOn(!next); }
  };

  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-2xl cursor-pointer select-none"
      style={{ background: '#FFFFFF', border: '1px solid #F0EBE1', minWidth: 120 }}
      onClick={toggle}
    >
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{ width: 64, height: 64, background: on ? 'rgba(224,153,47,0.12)' : '#F5F2EC' }}
      >
        {/* Power plug / socket icon */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={on ? '#E0992F' : '#9A9082'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 3v4M19 3v4" />
          <path d="M12 12v7" />
          <path d="M12 19a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3z" />
          <rect x="5" y="7" width="14" height="5" rx="2" />
        </svg>
      </div>
      <div className="text-center">
        <div style={{ fontSize: 13, fontWeight: 600, color: '#25242A' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#9A9082', marginTop: 2 }}>{on ? 'On' : 'Off'}</div>
      </div>
      <Toggle checked={on} onChange={toggle} />
    </div>
  );
}
