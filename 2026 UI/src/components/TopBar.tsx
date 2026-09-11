import { useState, useEffect } from 'react';
import { HA_HEADERS } from '../config';

const fmtReal = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

// Format an input_datetime "HH:MM:SS" state into "8:36 AM".
function fmtHelper(state: string): string | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(state);
  if (!m) return null;
  const h = Number(m[1]);
  const hr12 = ((h + 11) % 12) + 1;
  return `${hr12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
}

export default function TopBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    let cancelled = false;
    // The UI clock is the smart home's "system time" — it mirrors the
    // input_datetime.experiment_clock helper (the same clock the automations run
    // on), which can deliberately differ from real time in some study scenarios.
    // (The separate participant_time helper drives the physical lab clock, not
    // this UI.) Falls back to real device time if the helper can't be read.
    const tick = async () => {
      try {
        const res = await fetch('/api/states/input_datetime.experiment_clock', { headers: HA_HEADERS });
        if (res.ok) {
          const data = await res.json();
          const label = typeof data?.state === 'string' ? fmtHelper(data.state) : null;
          if (label) { if (!cancelled) setTime(label); return; }
        }
      } catch { /* fall through to real time */ }
      if (!cancelled) setTime(fmtReal());
    };
    tick();
    const id = setInterval(tick, 10_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        height: 64, background: 'var(--c-panel)',
        borderBottom: '1px solid var(--c-border2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: 'var(--c-amber)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A2008" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
            <path d="M9 21V12h6v9"/>
          </svg>
        </div>
        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:21, color:'var(--c-ink)', letterSpacing:'-0.02em' }}>
          SmartHotel
        </span>
      </div>

      {/* Clock pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:14, color:'#3A3833',
        border: '1px solid #E0D9CB', background: '#FBFAF6',
        borderRadius: 999, padding: '6px 16px',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-quiet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        {time}
      </div>
    </header>
  );
}
