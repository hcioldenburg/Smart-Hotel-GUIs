/**
 * Study activity recorder.
 * Password-gated Start/Stop. Captures only the sequence of CLICKS and
 * NAVIGATIONS (main tab / view switches) — the only interactions used in this
 * study — each with a timestamp. Exports timestamped JSON. Uses a capture-phase
 * click listener so no click is missed.
 */
import { useEffect, useRef, useState } from 'react';
import { RECORDER_PASSWORD } from './config';
import { useIsMobile } from './hooks/useMediaQuery';
import { SvgIcon } from './lib/deviceIcons';

interface EventEntry {
  t: number;                      // ms since recording started
  ts: string;                     // absolute wall-clock timestamp (ISO)
  type: 'click' | 'navigate';
  target: string;                 // label of the clicked control / navigation destination
}

function getLabel(el: Element): string {
  const aria = el.getAttribute('aria-label');
  if (aria) return aria;
  const devId = el.getAttribute('data-device-id');
  if (devId) return `device:${devId}`;
  const id = el.getAttribute('id');
  if (id) return `#${id}`;
  const text = (el as HTMLElement).innerText?.slice(0, 40).trim();
  if (text) return text;
  return el.tagName.toLowerCase();
}

function nearest(t: EventTarget | null): string {
  if (!t || !(t instanceof Element)) return 'unknown';
  const interactive = t.closest('button, a, [data-device-id], [aria-label]');
  return interactive ? getLabel(interactive) : getLabel(t as Element);
}

export default function RecordActivity({ condition }: { condition: 1 | 2 }) {
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [recording, setRecording] = useState(false);
  const [count, setCount] = useState(0);
  const [pwInput, setPwInput] = useState('');
  const [showPw, setShowPw] = useState(false);
  const events = useRef<EventEntry[]>([]);
  const startTime = useRef<number>(0);
  const isMobile = useIsMobile();

  function push(type: EventEntry['type'], target: string) {
    const now = Date.now();
    events.current.push({ t: now - startTime.current, ts: new Date(now).toISOString(), type, target });
    setCount(c => c + 1);
  }

  // Single capture-phase click listener: a click on a nav control (tagged with
  // data-nav) is logged as a navigation; every other click as a plain click.
  const handleClick = (e: Event) => {
    const t = e.target;
    if (t instanceof Element && t.closest('[data-recorder-component]')) return; // ignore the recorder's own controls
    const nav = t instanceof Element ? t.closest('[data-nav]') : null;
    if (nav) push('navigate', nav.getAttribute('data-nav') || nearest(nav));
    else push('click', nearest(t));
  };

  useEffect(() => {
    if (!recording) return;
    startTime.current = Date.now();
    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [recording]);

  const exportData = async () => {
    const payload = JSON.stringify({ session: new Date().toISOString(), condition, events: events.current }, null, 2);
    // Primary: write to <project>/logs on the dev server (see vite.config.ts).
    try {
      const res = await fetch(`/save-activity?condition=${condition}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      if (res.ok) return;
    } catch { /* fall through to a browser download so data is never lost */ }
    // Fallback: download the file locally if the dev endpoint isn't available.
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `activity-cond${condition}-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const startRecording = () => { events.current = []; setCount(0); setRecording(true); };
  const stopRecording = () => { setRecording(false); exportData(); };

  const unlock = () => { if (pwInput === RECORDER_PASSWORD) { setUnlocked(true); setShowPw(false); } };

  // Lives as the last item in the sidebar rail (see SidebarRail's `footer` slot)
  // rather than as a floating panel, so it never covers the room content. The
  // controls open in a popover anchored to the rail.
  const popover: React.CSSProperties = {
    position: 'fixed', zIndex: 200,
    ...(isMobile ? { bottom: 72, right: 12 } : { bottom: 16, left: 98 }),
    background: 'var(--c-panel)', border: '1.5px solid var(--c-border2)',
    borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
    padding: '12px 16px', width: 190, fontSize: 13, fontFamily: 'inherit',
  };

  return (
    <div data-recorder-component style={isMobile ? { flex: 1, display: 'flex' } : undefined}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Study Recorder"
        style={{
          position: 'relative',
          flex: isMobile ? 1 : undefined,
          width: isMobile ? undefined : 90,
          height: isMobile ? '100%' : 80,
          border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 3 : 5,
          background: open ? '#F4F1EA' : 'transparent',
          color: open ? '#25242A' : '#C7C3BB',
          transition: 'all .15s',
        }}
      >
        <SvgIcon name="record" size={isMobile ? 24 : 30} color={recording ? '#E05050' : open ? '#C97E1E' : '#A7A399'} sw={1.8} />
        <span style={{ fontSize: isMobile ? 10 : 10.5, fontWeight: 600, lineHeight: 1.2, textAlign: 'center', letterSpacing: '0.01em' }}>
          Recorder
        </span>
        {/* Keeps the recording state visible even with the popover closed */}
        {recording && (
          <span style={{
            position: 'absolute', top: isMobile ? 6 : 12, right: isMobile ? 12 : 20,
            width: 8, height: 8, borderRadius: '50%', background: '#E05050',
            animation: 'sense-pulse 1s ease-out infinite',
          }} />
        )}
      </button>

      {open && (
        <div style={popover}>
          <div style={{ fontWeight: 700, color: 'var(--c-ink)', marginBottom: 8, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background: recording ? '#E05050' : 'var(--c-disabled)', display:'inline-block', animation: recording ? 'sense-pulse 1s ease-out infinite' : 'none' }} />
            Study Recorder
          </div>

          {!unlocked && !showPw && (
            <button onClick={() => setShowPw(true)} style={btnStyle}>Unlock</button>
          )}
          {!unlocked && showPw && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <input type="password" value={pwInput} onChange={e => setPwInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && unlock()}
                placeholder="Password" style={{ padding:'5px 8px', borderRadius:6, border:'1px solid var(--c-border)', fontSize:12, fontFamily:'inherit' }} />
              <button onClick={unlock} style={btnStyle}>Unlock</button>
            </div>
          )}

          {unlocked && !recording && (
            <button onClick={startRecording} style={{ ...btnStyle, background:'var(--c-amber)', color:'#fff' }}>Start Recording</button>
          )}
          {unlocked && recording && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ fontSize:11.5, color:'var(--c-muted)' }}>{count} events</div>
              <button onClick={stopRecording} style={{ ...btnStyle, background:'#C0552F', color:'#fff' }}>Stop &amp; Export</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: '100%', padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, background: '#EDE8DF', color: 'var(--c-ink)',
};
