import { useState, useEffect } from 'react';
import VerticalBar from '../primitives/VerticalBar';
import { HA_HEADERS } from '../../config';

interface Props {
  entityId: string;
  label: string;
}

export default function CurtainCard({ entityId, label }: Props) {
  const [position, setPosition] = useState(50);

  const fetch_ = async () => {
    try {
      const res = await fetch(`/api/states/cover.${entityId}`, { headers: HA_HEADERS });
      if (!res.ok) return;
      const d = await res.json();
      if (d.state === 'unavailable') return;
      const pos = d.attributes?.current_position;
      if (typeof pos === 'number') setPosition(pos);
    } catch { /* silent */ }
  };

  useEffect(() => { fetch_(); const id = setInterval(fetch_, 3000); return () => clearInterval(id); }, [entityId]);

  const setPos = async (val: number) => {
    setPosition(val);
    try {
      await fetch('/api/services/cover/set_cover_position', {
        method: 'POST', headers: HA_HEADERS,
        body: JSON.stringify({ entity_id: `cover.${entityId}`, position: val }),
      });
    } catch { /* silent */ }
  };

  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-2xl select-none"
      style={{ background: '#FFFFFF', border: '1px solid #F0EBE1', minWidth: 120 }}
    >
      {/* Icon + bar visual */}
      <div className="flex flex-col items-center gap-2">
        {/* Curtain rod icon */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9A9082" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h18" />
          <path d="M6 3v17" />
          <path d="M18 3v17" />
          <path d="M6 3c3.4 2.5 3.4 14.5 0 17" />
          <path d="M18 3c-3.4 2.5-3.4 14.5 0 17" />
          <path d="M12 3v17" />
        </svg>
        <VerticalBar value={position} height={56} width={14} />
      </div>

      <div className="text-center">
        <div style={{ fontSize: 13, fontWeight: 600, color: '#25242A', lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 11, color: '#9A9082', marginTop: 2 }}>{position}% open</div>
      </div>

      {/* Slider */}
      <input
        type="range" min={0} max={100} value={position}
        onChange={(e) => setPos(Number(e.target.value))}
        onClick={(e) => e.stopPropagation()}
        className="w-full"
        style={{ accentColor: '#E0992F', height: 4 }}
      />
    </div>
  );
}
