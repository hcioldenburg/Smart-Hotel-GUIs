import { useState, useEffect } from 'react';
import Toggle from '../primitives/Toggle';
import { HA_HEADERS } from '../../config';

interface Props { label?: string; }

export default function SmartFanCard({ label = 'SmartFan' }: Props) {
  const [on, setOn] = useState(false);

  const fetch_ = async () => {
    try {
      const res = await fetch('/api/states/fan.smartfan', { headers: HA_HEADERS });
      if (!res.ok) return;
      const d = await res.json();
      setOn(d.state === 'on');
    } catch { /* silent */ }
  };

  useEffect(() => { fetch_(); const id = setInterval(fetch_, 5000); return () => clearInterval(id); }, []);

  const toggle = async () => {
    const next = !on;
    setOn(next);
    try {
      await fetch(`/api/services/fan/turn_${next ? 'on' : 'off'}`, {
        method: 'POST', headers: HA_HEADERS,
        body: JSON.stringify({ entity_id: 'fan.smartfan' }),
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
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={on ? '#E0992F' : '#9A9082'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: on ? 'spin 1.5s linear infinite' : 'none' }}
        >
          <path d="M12 12V3a4.5 4.5 0 0 1 0 9" />
          <path d="M12 12h9a4.5 4.5 0 0 1-9 0" />
          <path d="M12 12v9a4.5 4.5 0 0 1 0-9" />
          <path d="M12 12H3a4.5 4.5 0 0 1 9 0" />
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
