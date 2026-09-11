import { useState, useEffect } from 'react';
import Toggle from '../primitives/Toggle';
import { HA_HEADERS } from '../../config';

interface Props { label?: string; }

export default function TVCard({ label = 'TV' }: Props) {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetch_ = async () => {
    try {
      const res = await fetch('/api/states/binary_sensor.tv_status', { headers: HA_HEADERS });
      if (!res.ok) return;
      const d = await res.json();
      setOn(d.state === 'on');
    } catch { /* silent */ }
  };

  useEffect(() => { fetch_(); const id = setInterval(fetch_, 5000); return () => clearInterval(id); }, []);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/services/script/turn_on', {
        method: 'POST', headers: HA_HEADERS,
        body: JSON.stringify({ entity_id: 'script.new_script' }),
      });
      setTimeout(fetch_, 1200);
    } catch { /* silent */ }
    finally { setTimeout(() => setBusy(false), 1500); }
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
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={on ? '#E0992F' : '#9A9082'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </div>
      <div className="text-center">
        <div style={{ fontSize: 13, fontWeight: 600, color: '#25242A' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#9A9082', marginTop: 2 }}>{busy ? '…' : on ? 'On' : 'Off'}</div>
      </div>
      <Toggle checked={on} onChange={toggle} disabled={busy} />
    </div>
  );
}
